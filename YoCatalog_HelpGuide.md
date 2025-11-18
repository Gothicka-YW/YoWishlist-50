# YoCatalog Help Guide
Note: Formerly "YoWishlist-50". Some screenshots or labels may still reference the old name.

## Overview

YoCatalog is a fan-made Chrome extension for organizing and sharing content for the YoWorld community. It consolidates:

- Avatars: Create a personal avatar catalog with groups, tags, descriptions, and image hosting.
- Screen Grab: Capture and export a stitched image from the YoWorld template page for clean wish list or sales posts.
- Lists (formerly Wish Lists): Upload, name, save, and reuse images with quick forum BBCode.
- Images: A second, separate image library with the same upload/save tools (for banners, art, etc.).

The popup remembers your last tab and keeps a consistent width for a smooth workflow. It also persists `Limit`, `Scope`, your Lists title draft, and Avatars field drafts so you won’t lose work if the popup closes.

No accounts or servers are required; your data is stored in Chrome storage. This tool isn’t affiliated with YoWorld or Big Viking Games.

---

## Tabs and Features

### Home
- Welcome screen with useful descriptions and information about the extension.

### Avatars
- Catalog entries include: name, optional group, tags (comma-separated), optional description, and an image URL.
- Add avatars by loading, dropping, or pasting an image; upload to get a hosted URL.
- Search across name, group, tags, and description; filter by group; sort by name or recency.
- Preview pane with actions: Save meta, Replace image, Copy URL, Copy BBCode, Download, Delete. The preview appears below the controls for better visibility.
- Bulk select with Delete and Export Selected JSON. You can click anywhere on a card to toggle its selection.
- Duplicate name protection: If you try to save an avatar with an existing name, you’ll be asked to confirm replacing it.
- Export/Import all avatars JSON. Unlimited or capped entries (see Settings).
- Optional “Compress PNG (lossless)” toggle saves a local preference for future compression features.

### Screen Grab
- Purpose: capture a stitched, clean image from yoworld.info/template for forums.
- Availability: Only works on yoworld.info/template. If you’re elsewhere, the tab disables its action buttons and shows a note.
- Controls:
	- Limit: Number of items to keep (1–100).
	- Columns (estimate): Helps grid detection on some layouts.
	- Scope (optional): Type a section title (e.g., “My Wishlist”) and press Enter to jump/highlight it.
	- Preview first N: Temporarily hides items after N so you can verify before export.
	- Export (crop): Stitches PNG with white background and downloads it.
	- Restore list: Reverts the page after Preview/Export.
	- Pick card selector: Click a single tile to guide detection when auto-detect struggles.
	- Reset selectors: Clears saved hints if you want to re-pick.
	- Open template page: Opens https://yoworld.info/template in a new tab.
- Tips:
	- Keep the template page visible during export to ensure a full, clean capture.
	- Pick card selector once if detection misses your grid. Previews/exports are anchored to the container you clicked, so the crop starts at the exact tile you picked.
	- Use Scope for more reliable targeting when multiple sections exist.

### Lists
- Saved entries: name/title + image URL, with date-stamped dropdown for quick reuse.
- Load/Drop/Paste an image, Upload to host it, then copy URL or forum BBCode.
- Include-title toggle: Prepends [b]Title[/b] on the BBCode link when enabled.
- Save, Rename, Delete entries; remembers the last selection.
- Upload pipeline: imgbb (primary, needs your API key) → Postimages (best-effort) → Catbox (fallback).

### Images
- Separate image library with the same tools as Wish Lists.
- Drag/drop/paste, upload to host, copy URL/BBCode, and save under a title.
- Upload pipeline: imgbb (primary) → Catbox (fallback).

### Settings
- imgbb API Key: Needed for uploads via imgbb.
- Max saved entries cap: 10/25/50/100/Unlimited for Wish Lists.
- Avatar max entries cap: 50/100/200/Unlimited.
- Theme: Default, Midnight, Yo Pink, Emerald, High Contrast.
- Header font: Uses locally-available fonts listed in `fonts/fonts.css`.
- Switch to Lists after capture: Automatically jumps to Lists after Export (crop).
- Reset settings: Clears stored options and saved state (non-destructive to images already uploaded online).
- Import/Export JSON: Backup or restore your entries and settings.
- Help/Guide: Opens the project page for more docs.

---

## Common Workflows

### A) Capture and share items from YoWorld template
1. Open the popup → Screen Grab.
2. Ensure you’re on yoworld.info/template. If not, click “Open template page.”
3. Optionally type a Scope (section title), press Enter to jump to it.
4. Click Preview first N to confirm.
5. Click Export (crop) to download the stitched PNG.
6. Go to Wish Lists → Upload → Copy forum link (BBCode) and paste to your forum post.

### B) Build and manage an avatar catalog
1. Avatars tab → Load or paste an image, then Upload & Save.
2. Set name, optional group, tags, and description.
3. Use search, group filter, and sorting to find and manage entries.
4. Use Replace image to overwrite the hosted URL with a new upload when needed.
5. Export selected/all JSON for backup; re-import later as needed.

### C) Maintain reusable media libraries
1. Wish Lists or Images tab → Load/Drop/Paste an image.
2. Upload to host (imgbb primary; falls back per tab).
3. Save under a title for quick reuse; copy URL or BBCode whenever you need it.

---

## Troubleshooting

- Screen Grab disabled: It works only on yoworld.info/template. Open the template page, then try again.
- Grid detection off: Use Pick card selector on a single item tile and retry.
- imgbb upload fails: Set or test your imgbb API key in Settings. If it still fails, the tool will try fallbacks where available.
- Duplicate titles: The tool ensures unique titles by appending a number (Title2, Title3, …) or a timestamp when necessary.
- Missing images after import: Ensure JSON matches the expected shape; re-import from a known-good export if needed.
- Storage caps: If you hit a cap, older items are trimmed in some flows; raise the cap or set Unlimited.

---

## Privacy & Permissions (summary)

- Storage: Saves your settings and saved entries in Chrome storage (sync by default).
- Site access: Screen Grab operates only on yoworld.info pages. No personal page data is collected or transmitted.
- Uploads: Images are only uploaded when you click Upload. Hosts used:
	- imgbb.com (needs your key)
	- catbox.moe (fallback)
	- postimages.org (best-effort on the Wish Lists tab)
- Downloads: Used to save exports you explicitly request.

Read the full policy in `PRIVACY_POLICY.txt`.

---

## Tips

- Keep the template page visible during export to avoid capture issues.
- Use Scope or Pick card selector to make detection consistent across sessions.
- Use group names and tags in Avatars for fast filtering.
- The Include-title toggle changes the BBCode to add a bold header above the image.

---

For more details and updates, see the project README and CHANGELOG on GitHub.
