# V28_20 Wheel Prize Format Fix

- Fixed wheel reward message formatting so prizes show as `1$`, not `1.00000000$`.
- Fixed displayed wheel result label formatting.
- Fixed wheel segment labels when prize values contain trailing decimals.
- Kept internal database precision unchanged; this patch affects user-facing text only.
- Production build regenerated in `public/build`.
