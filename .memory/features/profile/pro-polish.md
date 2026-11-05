---
name: Pro polish
description: Pending no-handicap states, short island captions and Verified catalogue
type: constraint
---
Pending and verified pros hide own-handicap surfaces; pending never earns PRO. The island shows only a centred PRO badge at 22px high, 10.5px text and 9px side padding, without tour/club/PGA PRO caption; badges elsewhere remain unchanged. Pending has no handicap cell/divider/connect. Settings pending uses BEING CHECKED and disabled off prompts. Both pro states have inert Leaderboards/New rounds privacy rows without stored-value changes. Admin Verified combines server pros/pending/golfers/businesses and omits empty groups, and ordinary member lists show verified pro identity/tour instead of No hcp. No SQL/migrations; server-authorised get_admin_verified takes no arguments.