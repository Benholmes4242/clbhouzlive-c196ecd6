# BRIEF_WAGR_SETTINGS_FIX — report

CSS-only corrections in `src/features/amateur-ranking/wagr-settings.css`. No other files changed. No SQL, no migrations, feed_config untouched.

## Diff

```diff
-.wagr-settings{...;--ep-canvas:var(--background);color:var(--ep-ink)}
+.wagr-settings{...;--ep-canvas:#0B0B0D;color:var(--ep-ink)}

-.wagr-settings .wagr-text.wagr-text{...;font-size:14px;font-weight:600;color:var(--ep-mute);...}
+.wagr-settings .wagr-text.wagr-text{...;font-size:13.3333px;font-weight:400;color:var(--ep-mute);...}

-.wagr-settings .st2-connect.st2-connect{...;color:var(--pro-controls-canvas);font-size:14.5px;font-weight:600;...}
+.wagr-settings .st2-connect.st2-connect{...;color:#0B0B0D;font-size:13.3333px;font-weight:400;...}

-.wagr-settings .wagr-send.wagr-send{width:100%;height:46px;margin-top:16px}
+.wagr-settings .wagr-send.wagr-send{width:100%;height:46px;margin-top:16px;font-size:13.3333px;font-weight:400;color:#0B0B0D}
```

Kept per brief: switch knob now paints on #0B0B0D canvas (was transparent fallback from HSL triplet); st2-connect keeps 40px/0 18px/999px/ink background; wagr-send keeps full width/46px; wagr-text keeps var(--ep-mute) and margin-top 14px. All other text sizes untouched.

## Tests

No existing test asserts these CSS values (grep of wagrSettings.test.tsx for ep-canvas/st2-connect/wagr-send/wagr-text/13.3333: no matches). No test added, deleted, renamed or rewritten.

## Shard totals

Command: `bunx vitest run --shard=N/4 --maxWorkers=2 --reporter=json`

- Shard 1: 2,211 passed / 0 failed
- Shard 2: 2,046 passed / 0 failed
- Shard 3: 2,186 passed / 0 failed
- Shard 4: 2,197 passed / 0 failed
- **Total: 8,640 passed, 0 failed** — matches the previous 8,640 baseline exactly; no count change.
