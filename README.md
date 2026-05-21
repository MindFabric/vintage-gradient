# Vintage Gradient

A Canva app for generating vintage-style gradients with built-in film grain. Drop them into your designs in one click.

## Features

- **Four modes** — Linear, Radial, Conic, and Spots (multi-radial, magazine-style)
- **Unlimited color stops** with hard-clamped sliders so they can't cross each other
- **Drag-to-position** centers in Radial/Conic; click and drag to add/move spots in Spots mode
- **Built-in vintage presets** (Sunset Burn, Risograph, Polaroid, Miami, Aurora, Halftone Sun, etc.)
- **Save your own presets** to localStorage
- **Vignette** for shot-on-film falloff
- **Film grain** with intensity, size, monochrome or chromatic (RGB) modes, and reroll
- **Per-spot opacity** and **blend modes** (Normal / Multiply / Screen / Overlay)
- Aspect ratios: 1:1, 16:9, 9:16, 4:5 — with optional **2x export** for sharper output

## App support and links

- **Terms and conditions:** https://example.com/terms-and-conditions
- **Privacy policy:** https://example.com/privacy-policy
- **Support:** https://example.com/support

## Development

```bash
npm install
npm start
```

Dev server runs on `http://localhost:8080`. Point the Canva developer portal's "Development URL" at it and use the preview link.

`.env` requires `CANVA_APP_ID` — get one from the Canva developer portal.

## Building for upload

```bash
npm run build
```

Upload the resulting `dist/app.js` in the developer portal's Bundle section.

## Stack

- React 19 + TypeScript
- `@canva/app-ui-kit` for the sidebar UI
- Canvas 2D for gradient + grain rendering (seeded PRNG keeps grain stable until rerolled)
- `@canva/asset` `upload()` + `@canva/design` `addElementAtPoint`/`addElementAtCursor` for inserting into the design as an image
