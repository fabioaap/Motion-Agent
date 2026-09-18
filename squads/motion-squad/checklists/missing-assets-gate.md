# Missing Assets Gate

- [ ] All repository/source assets were inspected before asking the user.
- [ ] Missing assets are named precisely.
- [ ] Reconstructable elements are separated from assets that truly require user/source input.
- [ ] The user was told what becomes impossible or degrades without each critical missing asset.
- [ ] The agent explicitly states when continuing would produce flat slide-like motion.
- [ ] Flat motion has explicit user authorization if it is the only remaining path.

## Gate Rule

If a critical moving element is missing and cannot be faithfully reconstructed, set:

`BLOCKED_MISSING_ASSETS -> WAITING_FOR_ASSETS`

Do not build.

If flat motion is the only path and the user has not explicitly authorized it, do not build.
