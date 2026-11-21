import React from "/node_modules/.vite/deps/react.js?v=b76f7b4e";
import ReactDOM from "/node_modules/.vite/deps/react-dom_client.js?v=cb817ec8";
import { QueryClient, QueryClientProvider } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=025aaac3";
import { MemoryRouter } from "/node_modules/.vite/deps/react-router-dom.js?v=6b7293d6";
import { MoreHorizontal, Link2, Settings, Building2 } from "/node_modules/.vite/deps/lucide-react.js?v=7c714798";
import { Button } from "/src/components/ui/button.tsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "/src/components/ui/dropdown-menu.tsx";
import { ProProfileBuildOne } from "/src/features/pro-profile/ProProfileBuildOne.tsx";
import"/src/features/pro-profile/pro-profile.css";
const noop = () => {}, navigate = noop, toast = { success: noop }, isSelfView = true, myBusinesses = [{ business: { slug: "golf-studio", id: "biz-id" } }], viewerActorType = "personal", friendshipStatus = "none", unfriend = noop, setShowReportDialog = noop, setShowBlockDialog = noop;
const menu = React.createElement(DropdownMenu, null, React.createElement(DropdownMenuTrigger, {
  asChild: true
}, React.createElement(Button, {
  variant: "ghost",
  size: "icon",
  "aria-label": "Profile options"
}, React.createElement(MoreHorizontal, null))), React.createElement(DropdownMenuContent, {
  align: "end"
}, React.createElement(DropdownMenuItem, {
  onClick: () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Copied to clipboard");
  }
}, isSelfView && React.createElement(Link2, {
  className: "w-4 h-4 mr-2"
}), "Copy link"), isSelfView ? React.createElement(React.Fragment, null, React.createElement(DropdownMenuSeparator, null), React.createElement(DropdownMenuItem, {
  onClick: () => navigate("/edit-profile?tab=settings")
}, React.createElement(Settings, {
  className: "w-4 h-4 mr-2"
}), "Settings"), myBusinesses && myBusinesses.length > 0 && React.createElement(React.Fragment, null, React.createElement(DropdownMenuSeparator, null), React.createElement(DropdownMenuItem, {
  onClick: () => {
    const biz = myBusinesses[0];
    navigate(`/business/${biz.business.slug || biz.business.id}`);
  }
}, React.createElement(Building2, {
  className: "w-4 h-4 mr-2"
}), "Switch to business"))) : React.createElement(React.Fragment, null, viewerActorType !== "business" && friendshipStatus === "friends" && React.createElement(DropdownMenuItem, {
  onClick: () => unfriend()
}, "Remove friend"), React.createElement(DropdownMenuItem, {
  onClick: () => setShowReportDialog(true)
}, "Report"), React.createElement(DropdownMenuItem, {
  onClick: () => setShowBlockDialog(true)
}, "Block"))));
const id = "capture-pro";
const finishes = ["MC", "WD", "T28", "DQ", "T3", "1st", "T41", "T10", "T19", "MC"];
const events = finishes.map((finish, i) => ({ id: "e" + i, user_id: id, source: "owgr", event_name: i === 2 ? "A very long tournament name requiring an ellipsis" : "Tournament " + i, start_date: i < 4 ? "2026-11-0" + (9 - i) : "2025-11-01", end_date: null, country: "China", finish, total_strokes: i === 2 ? 273 : 144, owgr_points: i === 2 ? 1.24 : null, rounds: (i === 2 ? [68, 69, 67, 69] : [72, 72]).map((strokes, j) => ({ round_no: j + 1, strokes, source: "owgr" })) }));
const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 1 / 0, refetchOnMount: false, refetchOnWindowFocus: false } } });
for (const key of ["bag", "partners", "career"])
  qc.setQueryData(["pro-profile", key, id], []);
qc.setQueryData(["pro-profile", "ask", id, 3, 0], { enabled: false, total: 0, waiting: 0, answers: [], my_waiting: [] });
qc.setQueryData(["pro-profile", "events", id], events);
qc.setQueryData(["pro-profile", "rank", id], { rank: 1426, week: 42, year: 2026 });
const host = document.createElement("div");
host.id = "pro-verification";
document.body.replaceChildren(host);
ReactDOM.createRoot(host).render(React.createElement(MemoryRouter, null, React.createElement(QueryClientProvider, {
  client: qc
}, React.createElement(ProProfileBuildOne, {
  pro: { user_id: id, pro_kind: "tour_pro", pro_tour: "Alps Tour", pro_tour_code: "alps", pro_player_id: null },
  name: "Mason Essam",
  cover: null,
  owner: true,
  viewerId: id,
  followers: 3,
  friends: 14,
  followersReady: true,
  onFollowers: noop,
  onFriends: noop,
  onAvatar: noop,
  onEdit: noop,
  onShare: noop,
  onFollow: noop,
  following: false,
  followBusy: false,
  onMessage: noop,
  messageBusy: false,
  menu
}))));
