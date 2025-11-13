# YoWishlist‑50 v1.4.4 — Release Notes (2025‑10‑08)

YoWishlist‑50 is used to quickly capture the first N item cards from yoworld.info/template. It’s built for two common sharing workflows: (1) posting clean wish lists on the YoWorld Forums, and (2) creating sales posts for YoWorld fan Facebook marketplace groups. Set your count, capture a seam‑free PNG, and upload/share anywhere.

Tight 3×2 captures for Sales Boards, cleaner white sides, and extra space for multi‑line captions — all while keeping the rock‑solid stitched export from 1.4.3.

## Highlights
- Tight 3×2 crop: When you capture six tiles, the exporter locks onto the first 3×2 card image area for a compact composite.
- Padding tuned for readability:
  - More bottom space so manual/caption text isn’t clipped.
  - Slimmer left/right margins for a tighter composition.
- Reliability carried forward: stitched captures scroll, overlap, and overscan to avoid seams and missing rows; sticky/fixed headers are temporarily hidden.

## Why this matters
This pairs perfectly with YoWorld Paint Sales Boards. You can grab a neat 3×2 from yoworld.info/template and upload/share it immediately, or slice it into six tiles (390×260) if you prefer individual slots.

## How to use the 3×2 capture
1) Open the template: https://yoworld.info/template
2) In the YoWishlist‑50 popup (Main tab):
   - Set Limit = `6`.
   - (Optional) Enter a Scope name matching your list title; press Enter to highlight it.
   - Click “Pick card selector” once and click any one tile if detection ever misses.
3) Click “Preview first N” to confirm only six remain.
4) Click “Export (crop)”. A PNG will download that’s tightly cropped around the 3×2 image area, with slim white sides and generous space under captions.

Notes
- If the grid can’t be detected, the exporter falls back to a container crop (still white background) with slightly larger padding.
- The page background is forced to white only during capture; it’s restored immediately after.

## Changes in 1.4.4
- New: 3×2 tight crop mode (first six image areas).
- Tweak: Increased bottom padding so multi‑line captions/manual text aren’t clipped.
- Tweak: Reduced left/right margins by ~12 px each for a tighter look.
- UX: Recommended flow — Pick card selector → Preview first N → Export (crop).

## Compatibility
- Chrome/Brave/Edge (desktop): Load as unpacked extension.
- Android: Use Kiwi Browser to load unpacked/ZIP if you want to run the extension on a tablet.

## Install or Update
- From GitHub source: enable “Developer mode” in chrome://extensions → “Load unpacked” → select the `YoWishlist-50` folder.
- To update: replace the folder with the new version and click “Reload” on chrome://extensions.

## Known issues / tips
- If only part of the 3×2 is visible on screen, the exporter scrolls and stitches; keep the page visible during capture for best results.
- If a sticky header overlaps the grid, it’s hidden for the capture and then restored.
- If the layout differs significantly, use “Pick card selector” once to lock detection to your grid.

## Version
- Extension version: 1.4.4
- Date: 2025‑10‑08

---
Fan tool. Not affiliated with YoWorld or Big Viking Games. Feedback/Bugs: https://github.com/Gothicka-YW/YoWishlist-50/issues
