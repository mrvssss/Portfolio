# Logo asset tools

Helper scripts used to normalize the "Client logos" artwork in `index.html`. They are
build-time tools only - nothing here is loaded by the site.

The goal was to make the DepEd and Quanby Solutions slots use the **same format and size**
as the WHO / NYCI / PCIC slots: a transparent, graphic-mark-only asset sitting directly on
`var(--surface)` (no white plate, no wording).

## Outputs (committed assets)

| Asset | Source | How it was derived |
| --- | --- | --- |
| `assets/logos/quanby-logo-mark.png` (468x468) | `assets/logos/quanby-solutions-logo.png` (2000x500) | Alpha-channel column profiling found the empty gap at x = 473-536 that separates the square badge (x 39-472, y 33-466) from the "Quanby Solutions" wordmark. The badge was cropped with 4% padding and squared to 468x468. |
| `assets/logos/deped-emblem.svg` (115x265) | `assets/logos/deped-logo.svg` (490x250, official DepEd lockup) | Every shape was measured in a browser (`getBBox()`); the caption line (y >= 205) and the "Dep" / "Ed" letterforms (outside x 188-296) were removed, the flame + torch group (x 191.7-291.8, y 0-250) was kept, and the `viewBox` was re-fitted with 2% padding. |

## Re-running

```powershell
# 1. Crop the Quanby badge out of the horizontal lockup (System.Drawing, no deps).
powershell -ExecutionPolicy Bypass -File tools/crop-quanby.ps1

# 2. Rebuild the DepEd emblem-only SVG (requires Google Chrome or Microsoft Edge).
#    Edit $chrome in the script if you are on Edge.
powershell -ExecutionPolicy Bypass -File tools/build-deped-mark.ps1

# 3. Measure how the five client logos actually render in index.html
#    (iframes index.html, forces lazy images to load, prints natural + rendered sizes).
powershell -ExecutionPolicy Bypass -File tools/run-verify.ps1   # -> tools/verify-report.txt
```

## Expected render metrics (desktop, 1280px)

| # | Logo | Rendered | Slot |
| --- | --- | --- | --- |
| 1 | WHO emblem (CSS crop) | 220 x 188 visible | 240 x 220 |
| 2 | NYCI seal | 216 x 216 | 240 x 240 |
| 3 | PCIC mark | 130 x 180 | 240 x 204 |
| 4 | DepEd emblem | 78 x 180 | 240 x 204 |
| 5 | Quanby badge | 216 x 216 | 240 x 240 |

Portrait marks (`.pcic-logo`, `.deped-logo`) are capped at `max-height: 180px` so their
height matches; square marks use the default `.client-logo` width of `min(100%, 220px)`.
