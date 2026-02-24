/**
 * validate-prediction-field-status
 * 
 * Scheduled edge function that checks whether picked players are still
 * in the tournament field and promotes alternates if any have withdrawn.
 * 
 * Trigger: Daily cron at 6 AM ET + 2 hours before tournament start.
 * Can also be called manually via POST.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find tournaments with predictions that are still scheduled
    const { data: predictions, error: predErr } = await supabase
      .from("ai_predictions")
      .select("*, sr_tournaments!inner(id, name, status, start_date, venue_name)")
      .in("sr_tournaments.status", ["scheduled", "created"]);

    if (predErr) throw predErr;
    if (!predictions || predictions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled tournaments with predictions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];

    for (const pred of predictions) {
      const tournament = (pred as any).sr_tournaments;
      const topContenders: any[] = (pred.predictions as any[]) || [];
      const alternates: any[] = (pred.dark_horses as any[]) || [];
      const auditLog: any[] = ((pred as any).prediction_audit_log as any[]) || [];

      if (topContenders.length === 0) continue;

      // Step 1: Query Perplexity for withdrawal news
      const withdrawnPlayerIds = new Set<string>();
      const withdrawalReasons = new Map<string, string>();

      if (perplexityKey) {
        const playerNames = [
          ...topContenders.map((p: any) => p.playerName),
          ...alternates.slice(0, 3).map((p: any) => p.playerName),
        ].filter(Boolean);

        const query = `Has ${playerNames.join(", ")} withdrawn from the ${tournament.name} ${new Date().getFullYear()}? Any injury updates, withdrawal news, or field changes this week?`;

        try {
          const ppxRes = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${perplexityKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "sonar",
              messages: [
                {
                  role: "system",
                  content: "You are a golf tournament field analyst. Return ONLY a JSON array of player names who have withdrawn or been confirmed out of the tournament. If no withdrawals, return an empty array []. Example: [\"Tiger Woods\", \"Rory McIlroy\"]",
                },
                { role: "user", content: query },
              ],
              temperature: 0.1,
              max_tokens: 500,
            }),
          });

          if (ppxRes.ok) {
            const ppxData = await ppxRes.json();
            const content = ppxData.choices?.[0]?.message?.content || "";

            // Try to parse JSON array from response
            const jsonMatch = content.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
              try {
                const wdNames: string[] = JSON.parse(jsonMatch[0]);
                for (const wdName of wdNames) {
                  const nameLower = wdName.toLowerCase().trim();
                  // Match against our picks
                  const matchedPick = topContenders.find(
                    (p: any) => p.playerName?.toLowerCase() === nameLower
                  );
                  if (matchedPick) {
                    withdrawnPlayerIds.add(matchedPick.playerId);
                    withdrawalReasons.set(matchedPick.playerId, `Perplexity: ${wdName} reported withdrawn`);
                  }
                }
              } catch {
                console.warn("[validate] Failed to parse Perplexity JSON response");
              }
            }
          }
        } catch (err) {
          console.warn("[validate] Perplexity query failed:", err);
        }
      }

      // Step 2: Cross-reference with leaderboard/tee-time data
      const { data: lbRows } = await supabase
        .from("sr_leaderboards")
        .select("player_id, status, sr_players!inner(sr_id)")
        .eq("tournament_id", tournament.id);

      if (lbRows && lbRows.length > 0) {
        for (const row of lbRows) {
          const srId = (row.sr_players as any)?.sr_id;
          if (srId && (row.status === "wd" || row.status === "dsq")) {
            const matchedPick = topContenders.find((p: any) => p.playerId === srId);
            if (matchedPick) {
              withdrawnPlayerIds.add(srId);
              if (!withdrawalReasons.has(srId)) {
                withdrawalReasons.set(srId, `Leaderboard status: ${row.status}`);
              }
            }
          }
        }
      }

      // Step 3: If no withdrawals detected, skip
      if (withdrawnPlayerIds.size === 0) {
        results.push({ tournament: tournament.name, action: "no_changes" });
        continue;
      }

      // Step 4: Check if 3+ top-5 picks have withdrawn — flag for full regeneration
      const top5Ids = topContenders.slice(0, 5).map((p: any) => p.playerId);
      const wdInTop5 = top5Ids.filter((id: string) => withdrawnPlayerIds.has(id));

      if (wdInTop5.length >= 3) {
        // Flag for full regeneration
        const newAuditEntry = {
          timestamp: new Date().toISOString(),
          action: "needs_full_regeneration",
          reason: `${wdInTop5.length} of top 5 picks have withdrawn`,
          withdrawnPlayers: wdInTop5,
        };

        await supabase
          .from("ai_predictions")
          .update({
            research_context: {
              ...(pred.research_context as any || {}),
              needs_full_regeneration: true,
              prediction_audit_log: [...auditLog, newAuditEntry],
            },
          })
          .eq("id", pred.id);

        results.push({
          tournament: tournament.name,
          action: "flagged_regeneration",
          withdrawnCount: wdInTop5.length,
        });
        continue;
      }

      // Step 5: Promote alternates
      const updatedContenders = [...topContenders];
      const updatedAlternates = [...alternates];
      const newAuditEntries: any[] = [];

      for (const wdId of withdrawnPlayerIds) {
        const idx = updatedContenders.findIndex((p: any) => p.playerId === wdId);
        if (idx === -1) continue;

        const removedPlayer = updatedContenders[idx];

        // Find first available alternate
        const altIdx = updatedAlternates.findIndex(
          (a: any) => !withdrawnPlayerIds.has(a.playerId)
        );

        if (altIdx !== -1) {
          const promotedAlt = updatedAlternates.splice(altIdx, 1)[0];
          updatedContenders[idx] = {
            ...promotedAlt,
            rank: idx + 1,
            promoted: true,
          };

          newAuditEntries.push({
            timestamp: new Date().toISOString(),
            action: "swap",
            playerOut: removedPlayer.playerName,
            playerIn: promotedAlt.playerName,
            reason: withdrawalReasons.get(wdId) || "Withdrawal detected",
          });
        } else {
          // No alternate available — remove the player
          updatedContenders.splice(idx, 1);
          newAuditEntries.push({
            timestamp: new Date().toISOString(),
            action: "removed",
            playerOut: removedPlayer.playerName,
            playerIn: null,
            reason: withdrawalReasons.get(wdId) || "Withdrawal detected, no alternate available",
          });
        }
      }

      // Re-rank contenders
      updatedContenders.forEach((p: any, i: number) => {
        p.rank = i + 1;
      });

      // Update ai_predictions
      await supabase
        .from("ai_predictions")
        .update({
          predictions: updatedContenders as any,
          dark_horses: updatedAlternates as any,
          research_context: {
            ...(pred.research_context as any || {}),
            prediction_audit_log: [...auditLog, ...newAuditEntries],
          },
        })
        .eq("id", pred.id);

      results.push({
        tournament: tournament.name,
        action: "swapped",
        swaps: newAuditEntries.length,
        details: newAuditEntries,
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[validate-prediction-field-status] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
