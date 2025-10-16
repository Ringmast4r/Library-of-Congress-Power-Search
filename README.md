# LOC Power Search

A fast, desktop search client for the Library of Congress (LOC) digital collections. Built with Electron for a responsive, keyboard-friendly experience and a dense gallery view that makes scanning large result sets quick and satisfying.

Not affiliated with or endorsed by the Library of Congress.

## Highlights

- High-density gallery view for both LOC and PPOC
- Compact, readable list view with rich metadata
- One-click view toggle (List ↔ Gallery)
- Image-only gallery for LOC to keep grids visually useful
- Quick details dialog with large preview (PPOC)
- Smart client-side caching and next-page prefetching
- Discreet theme toggle (Deep, Forest, Rose, Flag, Purple, Red, Black, Black+Gold)
- Compact layout that adapts on small screens and ultrawide 5120×1440
- Works with or without an API key (public requests by default)

## Why It’s Better Than the Default Search

- Gallery-first: See many more visual results at once to rapidly triage.
- Faster iteration: Local caching + prefetching smooths paging.
- Cleaner workflow: Results, filters, and actions are optimized for focus.
- Accessible defaults: Keyboard and screen-size friendliness are core to UI.

## Data Sources

- LOC Collections (https://www.loc.gov)
- Prints & Photographs Online Catalog (PPOC) (https://www.loc.gov/pictures/)

PPOC is image-first by design; for LOC Collections, the gallery view automatically selects records with image previews when Gallery is active.

## Installation

Prerequisites
- Node.js 18+ and npm
- Windows (packaged installer is configured for Windows via electron-builder). The app runs cross-platform via npm start.

Steps
- Install dependencies: npm install
- Start in development: npm start
- Build a Windows installer (dist/LOC-Power-Search-<version>-Setup.exe): npm run dist

## Usage

- Choose Data Source: LOC Collections or PPOC.
- Enter keywords and optional filters (collection, format, dates, language, sort, page size).
- Run Search.
- Toggle views:
  - List View: metadata-focused, two-column cards.
  - Gallery View: dense, uniform thumbnails ideal for visual scanning.
- Open Details:
  - Click “Details” on a card (or in Gallery, on the tile’s overlay button). Clicking a tile opens the LOC/PPOC page in your browser.

Tips
- Use quotes for exact phrases.
- Combine filters for more precise results.
- For PPOC imagery, try subject keywords plus date ranges.

## API Key (Optional)

- The app works without a key; public requests are used by default.
- Adding your LOC API key may improve rate limits and reliability.
- Paste your key in the top-right “API Key” field and click Save.
- After saving, the API section collapses to a compact indicator so it’s not distracting (click “Edit” on the pill to expand).
- Storage: The key is saved locally in the browser storage used by Electron (localStorage). It is not sent anywhere except appended to your LOC API requests.

## Themes

Click the small circular toggle next to the Save button to cycle themes:
- Deep (default)
- Forest
- Rose
- Flag (subtle photo of the U.S. flag)
- Purple
- Red
- Black (high-contrast)
- Black+Gold

Your selection is saved locally and restored on launch.

## Privacy & Storage

Stored locally in your Electron profile (localStorage):
- API key (if you provide one)
- Theme preference

No analytics or tracking are included.

## Packaging

The project uses electron-builder to produce a Windows installer:
- Output: dist/LOC-Power-Search-<version>-Setup.exe
- A code-signing certificate is not included; Windows may warn about an unknown publisher.

## Troubleshooting

- Requests throttled or slow: Add an API key or slow down rapid paging.
- “No preview” in some LOC results: Not all LOC items include thumbnails; Gallery filters out non-image items when Gallery is selected.
- Installer warnings: Expected without code signing. You can still run in dev with npm start.

## Disclaimer

- Not affiliated with or endorsed by the Library of Congress.
- Do not use the official LOC logo/seal in a way that implies endorsement. Use nominative text references only.

## License

MIT
