# YoCatalog Changelog

## 1.5.1 - 2025-11-14
- UX: Added an inline notice banner for concise success/error messages in the popup.
- Import/Export: Standardized messages and added an import summary showing counts for Wish Lists, Images, and Avatars.
- Cleanup: Removed a duplicate Export JSON handler to avoid double downloads; kept the full, centralized Settings export.
- Safety: Added delete confirmations for Wish Lists and Images saved entries.

## 1.5.0 - 2025-11-13
- Rename: Project renamed from "YoWishlist-50" to "YoCatalog". Updated manifest name/title, README, footer Privacy Policy link, and in-app strings.
- Home: Header now says "Welcome to YoCatalog!" and includes a new "Open Help Guide" link.
- Avatars: New tab with full catalog features — name, group, tags, description, image upload (imgbb primary, catbox fallback), search/filter/sort, Replace Image, Copy URL/BBCode, Download, Delete, bulk select (delete/export), and Export/Import JSON. Configurable cap (or unlimited).
- Images: New tab mirroring Wish Lists upload/save flow for a separate image library (drag/drop/paste, Upload, Copy URL/BBCode, Save/Rename/Delete/Load). Upload uses imgbb → catbox fallback.
- Wish Lists: Polished upload + BBCode workflow; retains include-title toggle and saved entries with caps.
- Screen Grab: Now only functions on yoworld.info/template. When off-site, buttons are disabled with a friendly note; "Open template page" remains available. Auto-switch to Wish Lists after Export (crop) preserved.
- Layout/UX: Consistent popup width across tabs; narrower default buttons; equal-width action row for Screen Grab actions; last-opened tab persists.
- Settings: Restored to its own tab (previously nested under Images by mistake). Contains imgbb key, caps, theme, header font, auto-switch toggle, Reset, Import/Export JSON, and Help/Guide link.
- Fixes: Removed duplicate "No image URL — …" hint and stray control character in Images tab.
- Docs: Added comprehensive `YoCatalog_HelpGuide.md`; linked from Home. Updated README and Privacy Policy link paths.

## 1.4.5 - 2025-10-08
- Tweak: Increased bottom padding by ~48 px for large crops (≥9 rows; e.g., Limit 50 with 5 columns) to prevent manual text/captions from being clipped. Smaller crops keep prior padding.

## 1.4.6 - 2025-10-08
- Tweak: Bottom padding is now consistent across all Limits to eliminate caption/manual text clipping on mid‑sized crops (e.g., 30 items). White sides and tight union are unchanged.

## 1.4.7 - 2025-10-08
- Fix: Changing Limit after a preview sometimes required re-picking a tile to capture all rows. Preview/Export now auto-restore the list at the start so the new Limit applies cleanly without re-picking.

## 1.4.8 - 2025-10-08
- Fix: Cropping could start from a random row if you didn’t re-pick after preview. The picker now stores the clicked tile’s index and the crop falls back to that index if the exact selector no longer matches, keeping mid‑list crops stable.

## 1.4.9 - 2025-10-08
- Tweak: The pick-index fallback now only applies when a selector hint exists and the saved container matches the active section, preventing unintended offsets when exporting without previewing.

## 1.4.4 - 2025-10-08
- New: Tight 3×2 crop for Sales Board screenshots. When exporting with Limit = 6 (or when only six tiles are visible), the crop targets the image areas of the first six cards, preserving clean white sides.
- Tweak: Increased bottom padding so multi‑line captions/manual text aren’t clipped; reduced left/right side margins by ~12 px each for a tighter look.
- Reliability: Keeps the stitched capture engine improvements from 1.4.3 (pre‑scroll, overlap, overscan) and hides sticky/fixed headers during capture. Falls back to container crop if the grid cannot be detected.
- UX: Recommended flow — Pick card selector on one tile → Preview first N → Export (crop). This produces a ready 3×2 composite you can share or slice as needed.

## 1.4.3 - 2025-10-07
- Removed: “Export first N (site)” button. The crop export now covers the primary export use case and avoids site-dependent behavior.
- Fix: Export (crop) could miss the last 2 rows (capturing ~40/50). The stitcher now uses the container’s full content height, hides sticky/fixed headers during capture, increases overlap and bottom overscan, and pre-scrolls to trigger lazy loading — resulting in all 50 cards captured consistently.
- UX: Updated failure messages to point users to retry or use the page’s own Download if needed.

## 1.4.2 - 2025-10-07
- Visual: Buttons are smaller with a 3D gradient style; active tab uses a matching gradient. Default theme switched to a purple → dark blue background gradient with tuned surface/border colors.
- Fonts: Default header font now prefers “Dancing Script” when no previous selection exists (falls back to sans if not available). Local font list is parsed from `fonts/fonts.css`.
- Privacy: Added `PRIVACY_POLICY.txt`, linked from README and as a footer link in the popup Settings view.
- Layout: Popup auto-sizes to fit the Main tab height on first render; other tabs scroll inside the rounded card. Moved Privacy Policy link to the footer text.

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
