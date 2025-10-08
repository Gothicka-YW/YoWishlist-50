# YoWishlist-50 Help Guide

## What it does
YoWishlist-50 is a fan-made Chrome extension that trims and exports the first N tiles from the YoWorld template page at yoworld.info/template. It can target either the Wish List or Sale Items section and export using one of two modes:

- Export (crop): Captures a stitched, full-height PNG of the selected section without scroll artifacts. The background is forced to white during capture for a clean, shareable image.

Note: The legacy “Export first N (site)” option has been removed. Crop export is more reliable and consistent across layouts.

No accounts or servers are used; settings are saved in Chrome sync storage. This tool isn’t affiliated with YoWorld or Big Viking Games.

---

## Quick start

1) Click the YoWishlist-50 icon in Chrome. If you aren’t already on yoworld.info/template, the extension will open it for you.

2) Set your options in the popup:
  - Limit: Number of items to keep (1–100). Defaults to 50.
  - Scope name (optional): Type the list title as it appears on the page (e.g., “My Wishlist” or “Halloween Sale”). Press Enter to scroll/highlight the matching section.

3) Optional: Click Pick card selector, then click a single item tile on the page. This helps the extension detect the grid when the default detection doesn’t match your layout.

4) Click Preview first N to see exactly which items will remain (everything after N is temporarily hidden).

5) Export:
  - Export (crop): Renders a stitched PNG of the section (with a white background) and downloads it (filename is derived from your scope/header when possible).

6) Click Restore list to put the page back to normal if you’re done previewing/exporting.

---

## Buttons and settings

- Limit: The number of tiles to keep from the start of the chosen section.
- Scope name (optional): Type the list title to target a specific section. Press Enter to scroll and highlight it.
- Preview first N: Temporarily hides items after N so you can confirm the result.
- Export (crop): Captures a stitched screenshot and downloads a high-quality PNG.
- Restore list: Undoes all temporary changes.
- Pick card selector: Opens a picker overlay. Click a single tile (the outer card). The extension saves three helpers in Chrome storage:
  - yl50_container: The grid container CSS path.
  - yl50_card: The CSS selector for an item card.
  - yl50_selectors: A hint to a representative card for detection.

Notes:
- The extension attempts to enable any “Preview” checkbox on the page automatically.
- During crop mode, a white background is temporarily forced to avoid gray/transparent seams.
- The cropper stitches multiple viewport slices (with overlap and overscan), so the PNG has no scroll seams and respects devicePixelRatio.

---

## Troubleshooting

- Could not detect item grid — use Pick card selector on the desired section: Click Pick card selector in the popup, then click one of the item tiles on the page. Try again.
- Download button not found — click it manually: This legacy path has been removed; use Export (crop) for consistent results.
- Wrong section trimmed: Change Scope to Wish List or Sale Items explicitly (instead of Auto), then Preview trim again.
- Crop looks too tight/too wide: The tool adds a small padding around the section. If your page has unusual margins, try resizing slightly or scrolling so the section is centered before using Export (crop).
- Nothing happens when clicking buttons: Ensure the popup stays open and you’re on yoworld.info/template. The extension auto-injects its content script, but if your tab is very busy, wait a moment and try again.

---

## Privacy and permissions

- Storage: Saves only your settings (limit, scope, and selectors) in Chrome sync storage.
- Host permissions: Runs only on *.yoworld.info pages.
- Downloads: Needed to save the PNG from Export (crop).
- Tab capture: Export (crop) uses captureVisibleTab to stitch a full-height image.

This is an unofficial fan tool and does not collect or send any data to external servers.

---

## Tips

- Keep the template page visible during Export (crop) so capture works as expected.
- If the page has both Wish List and Sale Items visible, the tool hides the non-selected section for clean exports (it restores after).
- You can change Limit to numbers other than 50 (up to 100) for flexible exports.

### Tight 3×2 captures (new)
- Set Limit = 6 and ensure a 3×2 grid is visible.
- Use Pick card selector once on a single tile if detection ever misses your grid.
- Use Export (crop). The tool targets the six card image areas, keeps slim white sides, and adds extra space below captions so text isn’t clipped.

---

Enjoy faster, cleaner exports of your YoWorld template lists!
