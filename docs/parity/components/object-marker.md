## object-marker

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/object-marker) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/object-marker)
Registry: `registry/ui/object-marker/` — 2 stories, 10 tests.

### Stories vs. upstream examples

| Upstream example        | Registry story                             | Status     | Notes                                  |
| ----------------------- | ------------------------------------------ | ---------- | -------------------------------------- |
| Only Icon               | Icon, text and clickable ("Icon only")     | ✅ covered | Same five markers incl. clickable ones |
| Text and clickable Text | Icon, text and clickable ("Text only")     | ✅ covered |                                        |
| Icon and text readonly  | Icon, text and clickable ("Icon and text") | ✅ covered |                                        |
| Icon and text clickable | Icon, text and clickable ("Clickable")     | ✅ covered | Includes the glyph-toggling marker     |

### Tests vs. upstream specs

| Upstream behaviour                               | Registry test                                                                                 | Status     | Notes                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| `should create`                                  | —                                                                                             | ➖ n/a     |                                                                       |
| Clickable adds the link modifier, not when false | clickable marker shows the filled focus style; non-clickable markers are not in the tab order | ✅ covered | Outcome instead of class                                              |
| Role `link` when clickable, `img` when icon-only | clickable marker is a focusable link…; glyph-only marker is an image…                         | ✅ covered |                                                                       |
| Custom status text                               | statusText and ariaLabelledBy override the accessible name                                    | ✅ covered |                                                                       |
| Renders icon with glyph and label text           | label with glyph…; label only renders no icon                                                 | ✅ covered |                                                                       |
| sr-only icon title only when icon-only           | glyph-only marker is an image named by its title…                                             | ✅ covered |                                                                       |
| `aria-labelledby` default and custom             | label with glyph…; statusText and ariaLabelledBy override…                                    | ✅ covered |                                                                       |
| tabindex 0 when clickable, -1 otherwise          | non-clickable markers are not in the tab order; clickable marker is a focusable link…         | ✅ covered |                                                                       |
| Icon role presentation when a label exists       | label with glyph: icon is presentational…                                                     | ✅ covered |                                                                       |
| Custom glyph font                                | —                                                                                             | ❌ missing | `glyphFont` input exists and is passed to `fd-icon` but is not tested |

Registry-only coverage: activation by click and Enter, Enter ignored when not clickable, native anchor activates once, "Active Object Marker" announcement.

### Gaps to fill

- **Stories:** none.
- **Tests:** "glyphFont passes the icon font to the marker icon".
- **Effort:** S, one assertion.
