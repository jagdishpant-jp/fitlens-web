# FitLens front end (COM682 CW2)

Static website for FitLens, hosted in the `$web` container of the `fitlensmediajp` storage account.

## Pages
- `index.html`  - Timeline: all uploads (RAI), filter, compare, delete (DIPS)
- `upload.html` - Upload a photo/video with progress bar (IUPS)
- `media.html`  - One upload: view (RIPS), edit caption/comment (UIPS), delete (DIPS)

## Setup
1. Open `js/config.js` and paste the five Logic App URLs (base URL only, ending in `&sig=...`).
2. Upload all files (keeping the `css` and `js` folders) to the `$web` container.
3. Open the static website URL.
