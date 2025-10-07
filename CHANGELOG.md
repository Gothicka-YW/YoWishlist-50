# YoWishlist-50 Changelog

## 1.4.1 - 2025-10-06
- Fix: Cropped export could cut off the final row and render a transparent band at the bottom. The stitcher now bottom-aligns the last pass, increases overlap, uses overscan+final crop, and clamps coordinates to eliminate gaps.
- Fix: Restored clean message handlers in content script after a prior crop-tightening edit introduced syntax errors; stabilized preview/export messaging.
- Tweak: Asymmetric crop padding (top tightened to 6px; right/bottom/left 12px) to avoid capturing the section header above the grid.
- Change: Removed white canvas pre-fill to preserve any genuine transparency in captured content.
- New: Share tab toggle “Include title in forum code” — lets you omit the [b]Title[/b] prefix when copying BBCode. Persists in settings.
- New: Save Title now prompts when a title already exists. Confirming updates the existing entry and replaces its image (auto-uploads staged image with fallbacks if needed).
- New: Local fonts support — added `fonts/` folder with `fonts.css` (MV3-safe). Linked in popup and added a sample “Local: Header Script” header font option.
- UX: Pressing Enter in Scope finds, scrolls to, and briefly highlights the matching section.

## 1.4 - 2025-10-05
- Fix: Preview first N now operates on the correct section and reliably hides cards beyond N.
- Fix: Cropped export no longer captures a tiny blank square; it stitches the selected section.
- Fix: Pick card selector now constrains actions to the picked section and hides the other section correctly.
- Change: Resources tab renamed to Settings in the UI/logic.
- New: Single "Saved" list on Share tab with Save/Rename/Delete, title placeholders, and BBCode generation.
- New: Upload fallbacks (imgbb → postimages → catbox) with inline status; added host permissions for fallbacks.
- New: Import/Export JSON for saved entries and settings (excludes API keys).
- New: Cap options (10/25/50/100/Unlimited) for saved entries.
- Migration: Legacy profiles/images migrated to the single saved list on first run.
