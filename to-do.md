# Todo

- [ ] Add Signatures tab feature
  - Implement a new "Signatures" tab to save signature images with hosting and forum code generation.
  - Scope:
    1) Stage image (paste / drag-drop / file) → Upload (imgbb primary, catbox fallback) → Save entry.
    2) Generate signature BBCode `[img]...[/img]` with optional click-through URL wrapper `[url=...]...[/url]`.
    3) Copy URL and BBCode actions.
    4) Rename / Delete entries.
    5) Optional size presets (e.g., 350×100) with auto-resize/compress toggle.
    6) Import/Export JSON support.
    7) Cap options consistent with Lists/Images.
    8) UI and UX consistent with existing tabs.
    9) Non-destructive to existing data.
    10) Help Guide entry + “Video — Coming soon” placeholder.

  - Acceptance criteria:
    - Users can upload, save, and manage signature entries separately from Lists/Images.
    - One-click copy of URL and BBCode (with optional URL wrapper).
    - Presets apply size constraints without degrading quality unexpectedly.
    - JSON round-trip works and doesn’t impact existing datasets.
    - Help Guide updated with a dedicated section and placeholder video link.
