# YoCatalog
Formerly "YoWishlist-50". Lists/Images/Avatars manager and Screen Grab tool for YoWorld forum and selling group posts.

## Privacy Policy
This extension does not track you and only stores settings and saved entries in Chrome storage. Read the full policy here:
- PRIVACY_POLICY: ./PRIVACY_POLICY.txt

## What’s new (v1.5.2 — Unreleased)
- Screen Grab: Anchors previews/exports to the picked container, so the crop starts at the exact tile you clicked even on pages with multiple grids.
- Persistence: Remembers last tab, `Limit`, and `Scope`. Lists title draft and Avatars field drafts (name/group/tags/desc) are restored if you close/reopen the popup.
- Avatars UX: Duplicate-name upload now asks to replace the existing entry; clicking anywhere on a card toggles selection; preview moved below controls to avoid clipping.
- Copy & labels: Home text refreshed; “Wish Lists” tab renamed to “Lists”.

## What’s new (v1.5.1)
- UX: Inline notice banner in the popup for concise success/error messages.
- Import/Export: Standardized messages and an import summary for Wish Lists, Images, and Avatars.
- Cleanup: Removed a duplicate Export JSON handler; kept a single centralized export.
- Safety: Delete confirmations for Wish Lists and Images entries.

## What’s new (v1.5.0)
- Rename and expansion: Project renamed to "YoCatalog" with new tabs and features.
- Home: Welcome header and quick link to the Help Guide.
- Avatars: Full catalog with upload/replace, name, group, tags, description, search/filter/sort, bulk select, and JSON import/export.
- Images: Separate image library mirroring Wish Lists flows.
- Wish Lists (now "Lists"): Polished upload + BBCode; saved entries retained with caps.
- Screen Grab: Works only on yoworld.info/template; friendly disabled state and “Open template page”.
- Settings: Dedicated tab with imgbb key, caps, theme, header font, auto-switch toggle, Reset, Import/Export JSON, Help/Guide link.

## What’s new (v1.4.9)
- Refinement: The mid-list pick index is only used when a selector hint exists and matches the current section, so exports without preview work as before.

## What’s new (v1.4.8)
- Robust mid-list crops: The picker stores the clicked tile’s index; crops fall back to it if the selector path changes, so you don’t get random items after preview.

## What’s new (v1.4.7)
- Reliability: Changing Limit after a preview no longer requires re-picking a tile. Preview/Export auto-restore the list before applying the new Limit.

## What’s new (v1.4.6)
- Padding: Bottom padding is now consistent across all Limits to prevent caption/manual text clipping on mid‑sized crops (e.g., 30 items). White sides and tight union are unchanged.

## What’s new (v1.4.5)
- Padding: Added ~48 px more bottom padding for large crops (≥9 rows; e.g., Limit 50 with 5 columns) so manual text/captions aren’t clipped. Smaller crops unchanged.

## What’s new (v1.4.4)
- Tight 3×2 crop: When capturing six tiles, the crop locks to the first 3×2 image area, keeping slim white sides.
- Padding tuned: More bottom space so multi‑line captions/manual text aren’t clipped; reduced left/right margins ~12 px for a tighter composition.
- Fallback: If detection misses the grid, Export (crop) falls back to container crop with the same white background guarantee.

## What’s new (v1.4.3)
- Removed: “Export first N (site)” button. Use Export (crop) for consistent results.
- Fix: Export (crop) now captures all 50 cards reliably (handled scrollable containers, sticky headers, lazy loading, and seam overscan).

## What’s new (v1.4.2)
- Visual: Default theme now uses a purple → dark blue background gradient; buttons are smaller with a stronger 3D gradient look; active tab matches button style.
- Fonts: Default header font now prefers “Dancing Script” (local) when no prior preference exists; Settings dropdown lists local fonts from `fonts/fonts.css`.
- Privacy: Added PRIVACY_POLICY.txt and linked it from the popup footer and README.

## What’s new (v1.4.1)
- Cropped export: fixed occasional cutoff/transparent bottom strip via bottom-aligned last pass, extra overlap, overscan + final crop, and coordinate clamps; asymmetric crop padding (top 6px; right/bottom/left 12px).
- Stability: restored clean content-script message handlers after a prior crop edit caused syntax errors.
- Share: new “Include title in forum code” toggle; Save Title now asks to update existing titles and replaces image (auto-uploads staged image with fallbacks if needed).
- Fonts: added local fonts support via `fonts/` folder and `fonts.css`; sample “Local: Header Script” option in Settings.
- UX: Press Enter in Scope to scroll to and highlight the target section.

## Tabs overview
- Home: Overview of features (Screen Grab, Lists, Avatars, Images) and quick tips.
- Screen Grab: Set `Limit` and optional `Scope`, preview the first N, export a stitched crop, restore, pick a card selector, reset selectors, or open the template page.
- Lists (formerly Wish Lists): Load/Drop/Paste image, Upload to host, Copy URL/BBCode, Save/Rename/Delete entries; remembers last selection; import/export JSON.
- Avatars: Catalog with name/group/tags/description, upload/replace image, search/filter/sort, bulk select (click card), JSON import/export, and quick copy/share actions.
- Images: A separate image library with the same tools as Lists.
- Settings: imgbb key, caps, theme, header font, auto switch to Lists after capture, Reset, Import/Export JSON, Help link.

Note: Works on yoworld.info/template. If detection misses your grid, use Pick card selector on a single item tile, then retry. Scope helps target the right section when multiple grids exist.
