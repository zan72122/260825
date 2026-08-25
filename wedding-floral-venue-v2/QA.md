# Browser QA

The committed `index.html` was fetched again from `raw.githubusercontent.com`, served locally over HTTP, and verified with an automated Chromium browser.

## Route sweep

- `?v=01` through `?v=15`: loaded individually
- Variant counter matched the requested route
- 15 scene selector controls rendered on every route
- WebGL canvas had non-zero dimensions
- No framework error overlay was present
- A screenshot was captured for every route
- All 15 screenshots had distinct hashes and non-trivial pixel variance

## Responsive checks

- Portrait viewport: 390 × 844
- Landscape viewport: 844 × 390
- Header, descriptive copy, primary button, and scene navigation remained inside the viewport in both orientations

## Runtime design limits

- Device pixel ratio capped at 1.6
- Shadow map set to 1024 × 1024
- Three.js geometry uses deliberately modest segment counts for flower petals, leaves, furniture, and tableware
- No post-processing depth-of-field, bloom, neon outline, or generated background image

## Manual review targets for future full-game work

- iPhone Safari memory pressure during long multi-stage sessions
- iPad split-view and Stage Manager resizing
- VoiceOver labels once the interaction chapters are implemented
- Haptic timing on real hardware
- Touch acquisition with a child’s smaller and less stable finger path
