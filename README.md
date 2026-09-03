<p align="center">
  <img src="assets/icon.png" width="96" alt="Bundle icon">
</p>

<h1 align="center">Bundle</h1>

<p align="center">
  A desktop app for filling out repetitive office documents — fast.
</p>

Bundle is a Windows desktop app for automating documents you fill out over
and over: salary certificates, memos, travel forms, and anything else built
from a template with a handful of blanks. Design a template once with
`{{ placeholder }}` fields, then fill it through a form with a live preview,
and export to `.docx` or `.pdf` — or print directly.

## Features

- **Rich text template editor** — bold/italic/underline, fonts, sizes, line
  and paragraph spacing, text alignment, tables
- **Placeholders** — insert `{{ field }}` chips anywhere in a template; each
  one becomes a form field on the fill page (text, date, or paragraph type)
- **Live fill & preview** — see the finished document update as you type,
  paginated exactly like the exported file
- **Bulk fill** — paragraph-type fields accept multiple lines to generate
  one document per row (mail-merge style), with bulk print/export
- **Import from Word** — bring in an existing `.docx` as a starting template
- **Export & print** — `.docx` (faithful to Word's own formatting) or `.pdf`,
  plus direct printing with page/copy count
- **Presets** — save and reuse a set of filled-in values per template
- **Categories** — organize templates into groups in the sidebar

## Getting started (using the app)

1. Grab the latest installer from the
   [Releases](https://github.com/Gvtone/document-filler/releases) page —
   `Bundle Setup <version>.exe`
2. Run it and follow the install wizard (choose "just me" or "all users" on
   this computer, pick an install location if you want)
3. Launch Bundle from the Start Menu

Your templates and saved fill-in values live in your Windows user profile —
uninstalling will ask whether to keep or remove them.

## Getting started (developing)

Requires Node.js and npm.

```
git clone https://github.com/Gvtone/document-filler.git
cd document-filler
npm install
npm start
```

`npm start` launches the app in dev mode with hot reload. Other useful
scripts:

| Command | What it does |
| --- | --- |
| `npm start` | Run the app in development |
| `npm run package` | Build an unpacked app (for testing a build locally) |
| `npm run make` | Build the distributable Windows installer |
| `npm run lint` | Lint the codebase |

## Built with

Electron, React, TypeScript, Tailwind CSS, TipTap (rich text editing), and
[`docx`](https://github.com/dolanmiu/docx) for `.docx` generation.

## License

MIT
