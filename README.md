# LOC Power Search

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/Ringmast4r/Library-of-Congress-Power-Search)](https://github.com/Ringmast4r/Library-of-Congress-Power-Search/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/Ringmast4r/Library-of-Congress-Power-Search)
[![Electron](https://img.shields.io/badge/Electron-30.5.1-47848F?logo=electron)](https://www.electronjs.org/)

A powerful desktop search tool for the Library of Congress digital collections. I wanted a better way to search the Library of Congress - something faster and more visual than the default web interface. This application delivers exactly that.

**Not affiliated with or endorsed by the Library of Congress.**

![LOC Power Search Gallery View](capture.png)

## Why I Built This

The Library of Congress has an incredible digital collection, but their default search interface makes it difficult to browse visually and explore large result sets efficiently. I discovered they offer API access (with free API keys available), so I built this desktop application to provide a superior search experience.

## Key Features

**Gallery Mode** - The star of the show. View hundreds of results in a high-density gallery grid that makes visual browsing fast and satisfying. This is the primary reason this tool exists.

**Massive Results Per Page** - Increase search results to see many more items at once, dramatically reducing pagination and making it easier to find what you're looking for.

**No API Key Required** - Works out of the box with public requests. However, getting a free API key from the Library of Congress is recommended for better performance and higher rate limits.

**Dual View Modes** - Toggle instantly between dense Gallery view for visual scanning and detailed List view for metadata-rich browsing.

**Smart Performance** - Client-side caching and next-page prefetching make navigation smooth and responsive.

**Multiple Themes** - Choose from 8 themes: Deep, Forest, Rose, Flag, Purple, Red, Black, and Black+Gold.

**Optimized Layout** - Adapts beautifully from small screens to ultrawide 5120×1440 displays.

## Why It's Better Than the Default Search

- **Gallery-first**: See 10x more visual results at once to rapidly scan and discover
- **Customizable page size**: Load hundreds of results instead of being limited to small pages
- **Faster workflow**: Local caching + prefetching eliminates loading delays
- **Cleaner interface**: Everything is optimized for focus and efficiency
- **Keyboard-friendly**: Navigate and search without reaching for the mouse

## Data Sources

- LOC Collections (https://www.loc.gov)
- Prints & Photographs Online Catalog (PPOC) (https://www.loc.gov/pictures/)

PPOC is image-first by design; for LOC Collections, the gallery view automatically selects records with image previews when Gallery is active.

## Installation

### Windows (Recommended)

**Option 1: Download the Installer (Easiest)**
1. Go to [Releases](https://github.com/Ringmast4r/Library-of-Congress-Power-Search/releases)
2. Download `LOC-Power-Search-1.2.0-Setup.exe`
3. Run the installer
4. Launch the application

**Note:** Windows may show a warning about an "unknown publisher" because the app isn't code-signed. Click "More info" → "Run anyway" to proceed.

**Option 2: Run from Source**
1. Install [Node.js 18+](https://nodejs.org/)
2. Clone or download this repository
3. Open terminal in the project folder
4. Run: `npm install`
5. Run: `npm start`

### macOS

1. Install [Node.js 18+](https://nodejs.org/)
2. Clone or download this repository
3. Open terminal in the project folder
4. Run: `npm install`
5. Run: `npm start`

To build a macOS app package, run: `npm run dist`

### Linux

1. Install Node.js 18+ (via your package manager)
2. Clone or download this repository
3. Open terminal in the project folder
4. Run: `npm install`
5. Run: `npm start`

To build a Linux package, run: `npm run dist`

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

## API Key (Optional but Recommended)

**You don't need an API key** - the app works perfectly fine with public requests by default.

**However, getting a free API key is recommended** for better performance and higher rate limits when doing intensive searching.

**How to get a free API key:**
1. Visit the [Library of Congress API page](https://www.loc.gov/apis/)
2. Request a free API key (it's quick and easy)
3. Once you receive it, paste it in the "API Key" field in the app and click Save

**Privacy:** Your API key is stored locally on your computer only (localStorage). It's never sent anywhere except directly to the Library of Congress with your search requests.

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
