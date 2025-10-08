# YoWishlist-50
Wish List importer for use on YoWorld Forums.

## Privacy Policy
This extension does not track you and only stores settings and saved entries in Chrome storage. Read the full policy here:
- PRIVACY_POLICY: https://github.com/Gothicka-YW/YoWishlist-50/blob/main/PRIVACY_POLICY.txt

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
- Main: set Limit, optional Scope name, Preview first N, Export (crop), Restore list, Pick card selector, Reset selectors, Open template.
- Share: single Saved list (Save/Rename/Delete), drag/drop/paste image, Upload with fallbacks, Copy URL/BBCode, Clear image.
- Settings: get/save/test imgbb key, theme and header font, Switch to Share after capture, saved cap, Reset settings, Import/Export JSON, Help link.

Note: Works on yoworld.info/template. If detection misses your grid, use Pick card selector on a single item tile, then retry.
