// npm i @supabase/supabase-js
import { createClient } from "@supabase/supabase-js";

/** Utilities **/
const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};
const decodeSub = (jwt) => {
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
  return payload.sub;
};
const now = () => new Date().toISOString();

const SUPABASE_URL = required("SUPABASE_URL");
const ANON_KEY = required("SUPABASE_ANON_KEY");
const HOST_JWT = required("HOST_JWT");
const TAGGED_JWT = required("TAGGED_JWT");
const REQUESTER_JWT = required("REQUESTER_JWT");

const uid = {
  host: decodeSub(HOST_JWT),
  tagged: decodeSub(TAGGED_JWT),
  requester: decodeSub(REQUESTER_JWT),
};

// Per-user clients (bearer auth so RLS applies)
const clientFor = (jwt) =>
  createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

const host = clientFor(HOST_JWT);
const tagged = clientFor(TAGGED_JWT);
const requester = clientFor(REQUESTER_JWT);

/** Helper: pretty log */
const log = (label, obj) => {
  console.log(`\n=== ${label} ===`);
  console.dir(obj, { depth: 5, colors: true });
};

(async () => {
  console.log("Users:", uid);

  // 1) Host creates a public, active game starting in 2h, expiring tonight
  const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const endOfDay = new Date();
  endOfDay.setHours(23, 0, 0, 0);

  const gameInsert = await host
    .from("games")
    .insert({
      host_user_id: uid.host, // RLS requires host to be the creator
      course_name: "Sunningdale Old",
      start_time: start.toISOString(),
      expires_at: endOfDay.toISOString(),
      status: "active",
      visibility: "public",
      slots_total: 4,
      slots_open: 3,
      lat: 51.387,
      lng: -0.635,
    })
    .select("id, slots_total, slots_open")
    .single();

  if (gameInsert.error) throw gameInsert.error;
  const gameId = gameInsert.data.id;
  log("Game created", gameInsert.data);

  // 2) Host tags the "tagged" user with a reserved invite
  const tagInsert = await host
    .from("game_participants")
    .insert({
      game_id: gameId,
      user_id: uid.tagged,
      role: "player",
      state: "invited",
      reserves_slot: true, // reserves a seat
      joined_at: null,
    })
    .select()
    .single();
  if (tagInsert.error && tagInsert.error.code !== "23505") throw tagInsert.error; // ignore duplicate

  log("Tagged player (reserved invite)", tagInsert.data || "already tagged");

  // 3) Requester creates a join request (ensure RLS allows this in your policy)
  const jrInsert = await requester
    .from("game_join_requests")
    .insert({
      game_id: gameId,
      requester_user_id: uid.requester,
      status: "pending",
      created_at: now(),
    })
    .select("id, status")
    .single();

  if (jrInsert.error) {
    console.warn("Join request insert failed (check RLS on game_join_requests):", jrInsert.error.message);
    // Optional fallback for testing only: host inserts the pending request on behalf
    const jrFallback = await host
      .from("game_join_requests")
      .insert({
        game_id: gameId,
        requester_user_id: uid.requester,
        status: "pending",
        created_at: now(),
      })
      .select("id, status")
      .single();
    if (jrFallback.error) throw jrFallback.error;
    log("Join request (host-created fallback)", jrFallback.data);
    var joinRequestId = jrFallback.data.id;
  } else {
    log("Join request (requester)", jrInsert.data);
    var joinRequestId = jrInsert.data.id;
  }

  // 4) Host accepts the request via RPC (atomic seat decrement + messages)
  const acceptReq = await host.rpc("game_request_decide", {
    p_request_id: joinRequestId,
    p_decision: "accept",
  });
  if (acceptReq.error) throw acceptReq.error;
  log("RPC: game_request_decide -> accept", acceptReq.data);

  // 5) Tagged user accepts their reserved seat via RPC
  const tagAccept = await tagged.rpc("game_tag_accept", { p_game_id: gameId });
  if (tagAccept.error) throw tagAccept.error;
  log("RPC: game_tag_accept", tagAccept.data);

  // 6) Snapshot seats + participants
  const gameSnap = await host
    .from("games")
    .select("id, course_name, slots_total, slots_open")
    .eq("id", gameId)
    .single();
  if (gameSnap.error) throw gameSnap.error;

  const parts = await host
    .from("game_participants")
    .select("user_id, role, state, reserves_slot, joined_at")
    .eq("game_id", gameId)
    .order("role", { ascending: true });
  if (parts.error) throw parts.error;

  log("Seats snapshot", {
    filled: gameSnap.data.slots_total - gameSnap.data.slots_open,
    total: gameSnap.data.slots_total,
    open: gameSnap.data.slots_open,
  });
  log("Participants", parts.data);

  // 7) Fetch recent system messages for this game
  const thread = await host
    .from("game_threads")
    .select("id")
    .eq("game_id", gameId)
    .single();
  if (thread.error) throw thread.error;

  const msgs = await host
    .from("game_thread_messages")
    .select("created_at, text, is_system, sender_id")
    .eq("thread_id", thread.data.id)
    .order("created_at", { ascending: false })
    .limit(10);
  if (msgs.error) throw msgs.error;

  log("Latest messages", msgs.data);

  console.log("\n✅ Test flow completed successfully.");
})().catch((e) => {
  console.error("\n❌ Test flow failed:");
  console.error(e);
  process.exit(1);
});
