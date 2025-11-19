# YoCatalog Help Guide

Formerly “YoWishlist-50”. This is the definitive, step‑by‑step guide to all features in YoCatalog, with room for embedded tutorial videos (placeholders included below).

— Fan tool. Not affiliated with YoWorld or Big Viking Games.

## Quick Links (TOC)
- Overview and Install
- First‑Run Setup
- Screen Grab (with anchoring, Scope, and 3×2 captures)
- Lists (formerly “Wish Lists”)
- Images Library
- Avatars Catalog
- Settings
- Import/Export JSON
- Troubleshooting & FAQ
- Privacy & Permissions
- Versioning & Support

---

## Overview and Install

YoCatalog is a Chrome extension to capture clean stitched grids from the YoWorld template page, and to organize/share images via lightweight libraries and an avatar catalog.

What’s included:
- Screen Grab: Clean stitched capture from https://yoworld.info/template with reliable grid detection and crops.
- Lists: Upload, save, copy URL/BBCode for quick forum posting.
- Images: A second library for banners/art separate from Lists.
- Avatars: Catalog with name, group, tags, description, image URL, search/filter/sort, bulk select, JSON import/export.

Install options:
- Chrome Web Store: Add extension → Pin (optional) → Click the YoCatalog icon.
- Unpacked (dev): chrome://extensions → Developer mode → Load unpacked → select the `YoCatalog` folder.

[▶ Watch: Getting Started — Coming soon]

---

## First‑Run Setup

1) Open the popup → Settings.
2) Optional: paste your imgbb API key for primary uploads.
3) Choose theme and header font (local fonts are loaded from `fonts/fonts.css`).
4) Set caps for Lists/Avatars or choose Unlimited.
5) If you like, enable “Switch to Lists after capture”.

The popup remembers your last tab and persists `Limit`, `Scope`, Lists title draft, and Avatars field drafts between sessions.

[▶ Watch: Settings & Onboarding — Coming soon]

---

## Screen Grab

Purpose: capture a stitched, clean PNG of the YoWorld template grid for forum or marketplace posts.

Availability: works only on https://yoworld.info/template. Off‑site, the buttons are disabled with a helpful note.

Controls:
- Limit: number of items to keep (1–100).
- Columns (estimate): assists grid detection if the layout is unusual.
- Scope (optional): type the section title (e.g., “My Wishlist”) and press Enter to jump and highlight it.
- Preview first N: temporarily hides items after N so you can verify the target before export.
- Export (crop): stitches a PNG with a white background and downloads it.
- Restore list: reverts any temporary Preview/Export changes.
- Pick card selector: click one tile to lock detection to your grid when auto‑detect struggles; crops/exports are then anchored to that container so the crop starts at the exact tile you clicked.
- Reset selectors: clears saved hints if you want to re‑pick.
- Open template page: opens the template page in a new tab.

Recommended flow:
1) Open template page → Screen Grab.
2) If multiple grids, type Scope and press Enter to jump to the right one.
3) If detection misses, use Pick card selector on a single tile.
4) Click Preview first N to confirm.
5) Click Export (crop) to download the stitched PNG.

Notes and tips:
- Keep the template page visible during export for reliable capture and lazy‑loading.
- Anchoring: after picking a tile, previews/exports are anchored to that container — helpful on pages with multiple sections.
- 3×2 mode: when capturing six items, the crop locks to the first 3×2 image area, preserving slim white sides and extra bottom padding for multi‑line captions.
- Limit changes after a preview are handled by auto‑restore before the next preview/export, so you don’t need to re‑pick.
- If detection still fails, export falls back to container crop with a white background.

[▶ Watch: Screen Grab Deep‑Dive — Coming soon]

---

## Lists (formerly “Wish Lists”)

What it does: lets you stage an image (paste/drag‑drop/file), upload it to a host, save under a title, and quickly copy URL or forum BBCode (optionally with a bolded title).

Core actions:
- Stage image: paste, drag‑drop, or choose a file.
- Upload: imgbb (primary; use your API key) with best‑effort fallbacks when available.
- Copy URL or BBCode: BBCode includes title when “Include title” is toggled on.
- Save/Rename/Delete entries: remembers the last selection; entries listed with timestamps.

Tips:
- Keep titles unique for easier reuse; the app auto‑uniquifies by appending a number or timestamp when needed.
- Use Import/Export JSON (in Settings) to back up and restore.

[▶ Watch: Lists Workflow — Coming soon]

---

## Images Library

Separate from Lists and great for banners or art.

Core actions are the same as Lists:
- Stage → Upload → Save → Copy URL/BBCode → Rename/Delete.
- Upload pipeline: imgbb primary → catbox fallback.

[▶ Watch: Images Library — Coming soon]

---

## Avatars Catalog

Manage a personal avatar catalog with metadata and hosting.

Entry fields:
- Name (required), Group (optional), Tags (comma‑separated), Description (optional), Image URL.

Key features:
- Upload/Replace image: get a hosted URL; replace preserves metadata.
- Search/filter/sort: search across name/group/tags/description; filter by group; sort by name or recency.
- Bulk select: click anywhere on a card to toggle selection; bulk delete or export selected JSON.
- Duplicate protection: saving a name that exists prompts you to replace the entry.
- Ability to download avatars.

Tips:
- Use consistent group names (e.g., “Forum”, “Model Group”) and tags for fast filtering.
- Export selected before large edits to keep a quick backup.

[▶ Watch: Avatars Catalog — Coming soon]

---

## Settings

Everything central:
- imgbb API key: needed for primary uploads.
- Caps: choose 10/25/50/100/Unlimited for Lists; 50/100/200/Unlimited for Avatars.
- Theme: Default, Midnight, Yo Pink, Emerald, High Contrast.
- Auto‑switch: jump to Lists after a capture export.
- Reset settings: clears stored preferences and state (doesn’t delete images already uploaded online).
- Import/Export JSON: back up or restore your entries and settings (not your imgbb key).

[▶ Watch: Settings Tour — Coming soon]

---

## Import/Export JSON

Where: Settings → Import/Export JSON.

What’s included: Lists entries, Images entries, Avatars entries, and general settings (excluding your imgbb API key).

Round‑trip tips:
- Use Export JSON from the same version before Import to keep shapes aligned.
- If an import fails, check the console for a summary message and verify the JSON format.

Example (illustrative only; use your own export as the source of truth):

```
{
  "lists": [ { "title": "My Wishlist", "url": "https://...", "savedAt": 1731200000000 } ],
  "images": [ { "title": "Banner A", "url": "https://...", "savedAt": 1731201111111 } ],
  "avatars": [
    {
      "name": "Astra",
      "group": "Forum",
      "tags": ["space","blue"],
      "description": "Winter set",
      "url": "https://...",
      "savedAt": 1731202222222
    }
  ],
  "settings": { "theme": "Default", "headerFont": "Dancing Script", "caps": { "lists": 50, "avatars": 100 } }
}
```

[▶ Watch: Backup & Restore — Coming soon]

---

## Troubleshooting & FAQ

Screen Grab disabled?
- You must be on https://yoworld.info/template. Use “Open template page”.

Crop starts in the wrong place?
- Use Pick card selector on a single tile to anchor to the correct container. Scope also helps when multiple sections exist.

Only part of the grid captured?
- Keep the page visible; the stitcher scrolls and overscans. Sticky/fixed headers are hidden during capture and restored after.

Limit changed but results didn’t update?
- Export/Preview auto‑restore the list first; try again. Re‑picking a tile is not required.

imgbb upload failed?
- Verify your imgbb key in Settings. The tool attempts fallbacks to catbox where available.

Duplicate titles?
- Titles are uniquified automatically (Title2, Title3, or timestamp). You can also rename.

Import complaints about shape?
- Export from your current version and use that file as a template for edits.

[▶ Watch: Troubleshooting — Coming soon]

---

## Privacy & Permissions

- Storage: settings and saved entries are stored in Chrome storage (sync by default).
- Site access: Screen Grab operates only on yoworld.info pages. No personal page data is collected or transmitted.
- Uploads: images upload only when you click Upload.
  - Hosts: imgbb.com (primary; your key), catbox.moe (fallback). Some older flows may best‑effort postimages.org.
- Downloads: used to save exports you explicitly request.

Read the full policy in `PRIVACY_POLICY.txt`.

---

## Versioning & Support

- Your extension’s UI uses the “YoCatalog” name; some legacy docs may say “YoWishlist‑50”.
- See `README.md` for highlights and `CHANGELOG.md` for detailed changes.
- Issue reporting and feedback: https://github.com/Gothicka-YW/YoCatalog/issues

[▶ Watch: What’s New — Coming soon]

---

Want a printable quick reference? Use the Quick Links (TOC) above and print this page from your browser.
