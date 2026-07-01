# gulp_webfonts_gen

A Gulp 5 pipeline that turns raw `.ttf` / `.otf` font files into a full web-font kit: it converts each font into `.eot`, `.woff`, `.woff2`, `.svg` (alongside the original/converted `.ttf`), generates a ready-to-use `@font-face` stylesheet, and builds a live HTML demo page so you can preview every font immediately.

## What it does

Drop font files into `src/fonts/`, run one command, and get back:

- **`dist/fonts/`** — each font converted into `.ttf`, `.eot`, `.woff`, `.woff2`, and `.svg`
- **`dist/css/fonts.css`** — a generated stylesheet with one `@font-face` rule per font, using the classic cross-browser `src` fallback chain (`eot` → `woff2` → `woff` → `ttf` → `svg`)
- **`dist/demo/index.html`** — a bare-bones demo page that loads `fonts.css` and renders a sample line of text in every converted font, so you can eyeball rendering before wiring the fonts into a real project

This is meant as a quick, no-fuss way to go from "designer handed me a `.ttf`" to "I have everything I need to `@font-face` it into a site" — you drop the file in, run the build, and copy the output.

## How it works

The pipeline is defined in `gulpfile.js` (ESM, `"type": "module"` in `package.json`) as four composed tasks, run in series:

```js
export const build = gulp.series(
  cleanDist,
  convertFonts,
  generateCSS,
  generateDemo
);
```

| Task            | What it does                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `cleanDist`       | Deletes the entire `dist/` folder before each build, so output never contains stale files from a previous run.     |
| `convertFonts`    | Reads every `.ttf`/`.otf` file in `src/fonts/`. `.otf` files are first converted to `.ttf` (via [`fontmin`](https://github.com/ecomfe/fontmin)'s `otf2ttf`); `.ttf` files are copied as-is. Every resulting `.ttf` is then converted to `.eot`, `.woff`, `.woff2`, and `.svg` using fontmin's respective plugins. |
| `generateCSS`     | Scans `dist/fonts/` for `.ttf` files and writes one `@font-face` block per font into `dist/css/fonts.css`, using the font's filename (without extension) as the `font-family` name. |
| `generateDemo`    | Scans the same `.ttf` files and writes `dist/demo/index.html`, a minimal page that links `fonts.css` and shows a sample line of text set in each font. |

If `src/fonts/` contains no `.ttf`/`.otf` files, `convertFonts` logs a warning and exits gracefully instead of failing.

### Generated `@font-face` example

For a font file named `MyFont.ttf` (or `MyFont.otf`), the generated CSS looks like:

```css
@font-face {
  font-family: 'MyFont';
  src: url('../fonts/MyFont.eot');
  src: url('../fonts/MyFont.eot?#iefix') format('embedded-opentype'),
       url('../fonts/MyFont.woff2') format('woff2'),
       url('../fonts/MyFont.woff') format('woff'),
       url('../fonts/MyFont.ttf') format('truetype'),
       url('../fonts/MyFont.svg#MyFont') format('svg');
  font-weight: normal;
  font-style: normal;
}
```

> **Note for use in a real project:** every generated rule uses `font-weight: normal; font-style: normal;` and derives `font-family` straight from the filename, regardless of the font's actual weight/style/family metadata. If you're converting multiple weights or italics of the same family (e.g. `MyFont-Bold.ttf`, `MyFont-Italic.ttf`), you'll want to hand-edit `dist/css/fonts.css` afterward to set the correct `font-family`, `font-weight`, and `font-style` per rule — otherwise the browser will treat each weight/style as an entirely separate font family.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (ESM `gulpfile.js`, Gulp 5)
- npm

## Installation

```bash
git clone https://github.com/petrony/gulp_webfonts_gen.git
cd gulp_webfonts_gen
npm install
```

## Project structure

```
gulp_webfonts_gen/
├── src/
│   └── fonts/            # Place your source .ttf / .otf files here
├── dist/                  # Generated — created fresh on every build
│   ├── fonts/             # Converted .ttf/.eot/.woff/.woff2/.svg files
│   ├── css/
│   │   └── fonts.css      # Generated @font-face stylesheet
│   └── demo/
│       └── index.html     # Generated font preview page
├── gulpfile.js
├── package.json
└── package-lock.json
```

`dist/` is git-ignored and fully regenerated on every run — don't hand-edit files inside it if you plan to rebuild, since `cleanDist` wipes the folder each time.

## Usage

1. Copy your `.ttf` or `.otf` font files into `src/fonts/` (flat — the task reads files directly in that folder, not subfolders).
2. Run the build:

```bash
npm run build
```

(This runs `node --no-deprecation ./node_modules/gulp/bin/gulp.js`, which executes the default exported task — i.e. the full `build` series.)

Alternatively, run Gulp directly:

```bash
npx gulp
```

3. Open `dist/demo/index.html` in a browser to preview the converted fonts.
4. Copy `dist/fonts/` and `dist/css/fonts.css` into your project, adjusting the `url()` paths in the CSS if your folder layout differs from `../fonts/`.

### Running individual tasks

Each step is also exported by name, so you can run any single stage on its own:

```bash
npx gulp cleanDist
npx gulp convertFonts
npx gulp generateCSS
npx gulp generateDemo
```

Note that `generateCSS` and `generateDemo` both depend on `.ttf` files already existing in `dist/fonts/` — run `convertFonts` first if you're not running the full `build` series.

## Supported input → output

| Input   | Copied/converted to `.ttf`? | Also generated                     |
| -------- | ----------------------------- | ------------------------------------ |
| `.ttf`   | Copied as-is                  | `.eot`, `.woff`, `.woff2`, `.svg`    |
| `.otf`   | Converted via `otf2ttf`       | `.eot`, `.woff`, `.woff2`, `.svg`    |

## Dependencies

| Package             | Purpose                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `gulp`                 | Task runner (v5)                                                  |
| `fontmin`               | Core font conversion engine (OTF→TTF, TTF→EOT/WOFF/WOFF2/SVG)      |
| `gulp-clean`            | Removes `dist/` before each build                                  |
| `gulp-file`             | Writes generated in-memory content (`fonts.css`, `index.html`) to disk |

The `package.json` also lists `gulp-fonter`, `gulp-fonter-unx`, `gulp-iconfont`, `gulp-iconfont-css`, `gulp-rename`, `gulp-svg2ttf`, and `otf2ttf` as `devDependencies` — these aren't currently wired into `gulpfile.js`'s task chain, but are available if you want to extend the pipeline (e.g. building an icon font from SVGs via `gulp-iconfont`).

## Troubleshooting

- **`⚠️ Немає .ttf або .otf файлів у src/fonts/`** — no matching font files were found directly inside `src/fonts/`. Make sure files are placed at the top level of that folder (not in a nested subfolder) and have a `.ttf` or `.otf` extension.
- **CSS shows wrong/duplicate font-family names for multiple weights** — see the note above about `generateCSS`; edit `dist/css/fonts.css` manually to set correct `font-family`/`font-weight`/`font-style` per weight.
- **`.eot` file needed for very old IE support only** — modern projects can typically drop the `.eot`/`.svg` fallbacks and the `?#iefix` line entirely if you don't need to support Internet Explorer; `.woff2` + `.woff` covers effectively all current browsers.

## License

Listed as `ISC` in `package.json`, but no `LICENSE` file is present in the repository. Add one if you intend to make the license terms explicit.
