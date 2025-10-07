YoWishlist-50 fonts

How to use custom fonts locally (MV3-safe)

- Place .woff2 files in this folder. Prefer WOFF2 for best compression and MV3 packaging.
- Edit fonts.css in this folder to add @font-face rules for each font file.
- Reference the family names in CSS. Example:
  body.header-font-myfont h1{ font-family: "My Local Font", Arial, sans-serif; }

Example @font-face block

@font-face {
  font-family: "My Local Font";
  src: url("./MyLocalFont.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

Hooking into the popup

- `popup.html` links `fonts/fonts.css`. Any @font-face family declared there is available in the popup.
- Use the existing "Header font" selector in Settings, or extend it to include new classes for your custom families.

Notes
- Keep font file names ASCII (no spaces is safest).
- Only include fonts you have the rights to package.
- If a font ships with multiple weights/styles, add one @font-face per weight/style.
