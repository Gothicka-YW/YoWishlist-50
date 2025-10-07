# YoWishlist-50
Wish List importer for use on YoWorld Forums.

## What’s new (v1.4.1)
- Cropped export: fixed occasional cutoff/transparent bottom strip via bottom-aligned last pass, extra overlap, overscan + final crop, and coordinate clamps; asymmetric crop padding (top 6px; right/bottom/left 12px).
- Stability: restored clean content-script message handlers after a prior crop edit caused syntax errors.
- Share: new “Include title in forum code” toggle; Save Title now asks to update existing titles and replaces image (auto-uploads staged image with fallbacks if needed).
- Fonts: added local fonts support via `fonts/` folder and `fonts.css`; sample “Local: Header Script” option in Settings.
- UX: Press Enter in Scope to scroll to and highlight the target section.

## Tabs overview
- Main: set Limit, optional Scope name, Preview/Export, Restore, Pick card selector, Reset selectors, Open template.
- Share: single Saved list (Save/Rename/Delete), drag/drop/paste image, Upload with fallbacks, Copy URL/BBCode, Clear image.
- Settings: get/save/test imgbb key, theme and header font, Switch to Share after capture, saved cap, Reset settings, Import/Export JSON, Help link.

Note: Works on yoworld.info/template. If detection misses your grid, use Pick card selector on a single item tile, then retry.
