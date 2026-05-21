# Vintage Gradient

A Canva app for generating vintage-style gradients with built-in film grain. Drop them into your designs in one click.

## What it does

- **Four modes:** Linear, Radial, Conic, and Spots (multi-radial, magazine-style)
- **Unlimited color stops** — drag sliders to position; can't accidentally cross each other
- **Drag the preview** to position the gradient center, or to add and move spots
- **Vintage presets:** Sunset Burn, Risograph, Polaroid, Miami, Aurora, Halftone Sun and more
- **Save your own presets** with one click
- **Vignette** for that shot-on-film falloff
- **Film grain** — adjust intensity, size, monochrome or chromatic, reroll any time
- **Per-spot opacity** and **blend modes** (Normal / Multiply / Screen / Overlay)
- Aspect ratios: 1:1, 16:9, 9:16, 4:5 — with optional **2x export** for sharper output

## App support and links

These are the URLs to use in the Canva developer portal:

- **Terms and conditions:** `https://github.com/MindFabric/vintage-gradient#terms-and-conditions`
- **Privacy policy:** `https://github.com/MindFabric/vintage-gradient#privacy-policy`
- **Support:** `https://github.com/MindFabric/vintage-gradient#support`

---

## Terms and conditions

_Last updated: 2026-05-20_

By installing or using the **Vintage Gradient** Canva app ("the app"), you agree to these terms.

1. **Use of the app.** The app is provided free of charge for use inside Canva to generate gradient images you can insert into your own designs. You may use the gradients you generate for any personal or commercial purpose.
2. **No warranty.** The app is provided "as is," without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. The maintainers make no guarantee that the app will be available, error-free, or compatible with future versions of Canva.
3. **Limitation of liability.** In no event shall the authors or maintainers be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the app or the use or other dealings in the app.
4. **Acceptable use.** You agree not to use the app to generate, distribute, or facilitate content that is unlawful, infringing, hateful, harassing, or otherwise harmful. Canva's own [Terms of Use](https://www.canva.com/policies/terms-of-use/) also apply to your use of Canva and any output created with the app.
5. **Changes.** These terms may change. Continued use of the app after a change constitutes acceptance of the updated terms. The current version is always the one in this README on the `main` branch.

## Privacy policy

_Last updated: 2026-05-20_

**Short version: the app does not collect, store, or transmit any personal data.**

- **No backend.** Vintage Gradient runs entirely in your browser inside Canva's app sandbox. There is no server operated by us that receives, logs, or stores any data about you.
- **No tracking, no analytics, no cookies.** The app does not include any analytics, telemetry, advertising, or tracking code of any kind.
- **Local storage only.** When you click "Save current" to save a custom preset, the preset (a small JSON object containing colors, positions, and your chosen name) is stored in your browser's `localStorage` under the key `vintage-gradient.customPresets.v1`. This data never leaves your device. Clearing your browser data, or clicking the × on a saved preset, removes it.
- **Generated images.** When you click "Add to design," the generated gradient image is uploaded via Canva's official `@canva/asset` SDK so it can be inserted into your design. The image is handled by Canva's own infrastructure and is subject to [Canva's Privacy Policy](https://www.canva.com/policies/privacy-policy/). We do not receive a copy.
- **Third-party services.** The app interacts only with Canva's Apps SDK. It does not call any other third-party service.
- **Children.** The app does not knowingly collect any data from anyone, including children.

If this policy changes, the updated version will appear in this README on the `main` branch with a new "Last updated" date.

## Support

Need help, found a bug, or have a feature request?

- **Open a GitHub issue:** https://github.com/MindFabric/vintage-gradient/issues
- We typically respond within a few business days. Please include:
  - What you were trying to do
  - What happened instead
  - Your browser and OS (e.g. "Chrome 128 on macOS 14")
  - A screenshot if relevant

For questions about Canva itself (your account, billing, designs), please contact [Canva Support](https://www.canva.com/help/) directly — those issues are outside the scope of this app.
