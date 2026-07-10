# PDF Merge Tool

A static, client-side PDF merging tool. Upload multiple PDFs, reorder them, and merge them into a single file — all processing happens locally in your browser via [pdf-lib](https://pdf-lib.js.org/). No files are ever uploaded to a server, no accounts, no login.

## Usage

Because browsers restrict `file://` access to local scripts, serve the folder with any static file server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

Alternatively, most editors (e.g. VS Code's Live Server extension) can serve it just as well.

## Features

- Drag-and-drop or file picker upload of multiple PDFs
- Reorder files before merging
- Remove individual files
- Merge into a single downloadable PDF
- 100% client-side — works offline, no data leaves your device

## Project structure

```
index.html          Main page
css/style.css        Styling
js/app.js            App logic (upload, reorder, merge)
vendor/pdf-lib.min.js  Vendored copy of pdf-lib (no CDN/network dependency)
```
