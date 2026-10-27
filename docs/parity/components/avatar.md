## avatar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/avatar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/avatar)
Registry: `registry/ui/avatar/` — 13 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                      | Registry story                                        | Status     | Notes                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Icon                                  | Icon                                                  | ✅ covered | Clickable glyph avatars, all sizes                                                                                           |
| Initials                              | Initials                                              | ✅ covered | Same three names                                                                                                             |
| Circle                                | Circle                                                | ✅ covered |                                                                                                                              |
| Background Image                      | BackgroundImage ("Background image")                  | ✅ covered | Includes `contain`                                                                                                           |
| Transparent                           | Transparent                                           | ✅ covered |                                                                                                                              |
| Placeholder Background                | Placeholder                                           | ✅ covered |                                                                                                                              |
| Tile Icon Background                  | Tile                                                  | ✅ covered |                                                                                                                              |
| Accent and Indication Colors          | AccentColors ("Accent and indication colors")         | ✅ covered | Also shows interactive indication avatars                                                                                    |
| Zoom Icon                             | ZoomIcon ("Zoom icon")                                | 🟡 partial | Only the circle + `edit` row; upstream's second row (square initials avatars, `zoomGlyph="camera"`, accents 6–10) is missing |
| Borders                               | Border                                                | ✅ covered |                                                                                                                              |
| Default image with alter icon options | AlternativeOptions ("Image with alternative options") | ✅ covered |                                                                                                                              |
| Avatar Value States                   | ValueStates ("Value states")                          | ✅ covered |                                                                                                                              |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                             | Registry test                                             | Status     | Notes                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Size                                                                                                                           | size, circle, border, tile, transparent and colorAccent … | ✅ covered | Real pixel sizes                                                        |
| Glyph                                                                                                                          | renders initials from label, a glyph, or the image …      | ✅ covered |                                                                         |
| Circle                                                                                                                         | size, circle, border …                                    | ✅ covered | Border radius                                                           |
| Transparent background                                                                                                         | size, circle, border …                                    | ✅ covered | Token colours                                                           |
| Background size `contain`                                                                                                      | —                                                         | ❌ missing | Only `cover` is asserted                                                |
| Placeholder background                                                                                                         | —                                                         | ❌ missing |                                                                         |
| Tile background                                                                                                                | size, circle, border …                                    | ✅ covered |                                                                         |
| Accent colour                                                                                                                  | size, circle, border …                                    | ✅ covered |                                                                         |
| Indication colour                                                                                                              | —                                                         | ❌ missing | `colorIndication` has no assertion                                      |
| Random accent colour                                                                                                           | random color accent is stable for the same label          | ✅ covered |                                                                         |
| Border                                                                                                                         | size, circle, border …                                    | ✅ covered |                                                                         |
| Zoom icon                                                                                                                      | zoom glyph shows a badge that emits zoomGlyphClicked      | ✅ covered | Also keyboard and position                                              |
| Abbreviate (initials)                                                                                                          | renders initials from label …                             | ✅ covered |                                                                         |
| Value state icons                                                                                                              | —                                                         | ❌ missing | `valueState` badge/icon untested                                        |
| One image request per URL: no duplicates on re-render, same URL, parent mutations, OnPush parents, interpolation, many avatars | —                                                         | ❌ missing | Our effect only reloads when the `image` signal changes; never asserted |
| Rapid URL changes: stale loads ignored, back to a loaded URL without a new request                                             | —                                                         | ❌ missing | `loadToken` guard is untested                                           |
| Failed image: a single attempt, then backup image / default icon                                                               | falls back through alterIcon order …                      | 🟡 partial | Fallback chain covered; "only one attempt, no loop" is not asserted     |
| `should create`                                                                                                                | —                                                         | ➖ n/a     |                                                                         |

Registry-only coverage: role img/presentation and aria-label rules, clickable avatar as a focusable button (Enter/Space), initials edge cases (more than three words, non-letters, diacritics).

### Gaps to fill

- **Stories:** extend ZoomIcon with the square initials row (`label="Jane Doe"`, `zoomGlyph="camera"`, accents 6–10).
- **Tests:** "contain scales the image to fit"; "placeholder uses the placeholder background token"; "colorIndication applies the indication background and text tokens"; "valueState shows the state badge with its icon and colour"; "loads an image once and does not reload when the same URL is set again"; "ignores a slower earlier image when the URL changes quickly"; "a failing image is requested only once before falling back".
- **Effort:** M, 7 tests; the request-count tests need a counting `Image` stub or a `PerformanceObserver`.
