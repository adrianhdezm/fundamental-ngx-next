## title

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/title) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/title)
Registry: `registry/ui/title/` — 5 stories, 9 tests.

### Stories vs. upstream examples

| Upstream example                      | Registry story                               | Status     | Notes                                                                                         |
| ------------------------------------- | -------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| Semantic Levels                       | Semantic ("Semantic levels")                 | ✅ covered | H1–H6                                                                                         |
| Visual Styling                        | Visual ("Visual levels")                     | ✅ covered | Same H1→6 … H6→1 matrix as upstream                                                           |
| Text Truncation                       | Elision ("Truncation")                       | ✅ covered | 300px container, three levels                                                                 |
| Text Wrapping                         | Wrapping                                     | ✅ covered | Also shows `twoLineClamp`                                                                     |
| Default Size via Dependency Injection | `DefaultSize` ("Default size via injection") | ✅ covered | A wrapper component provides `FD_DEFAULT_TITLE_SIZE: 5`; an explicit `headerSize` still wins. |

### Tests vs. upstream specs

| Upstream behaviour                                                               | Registry test                                                                             | Status     | Notes                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `should create`                                                                  | —                                                                                         | ➖ n/a     |                                                                          |
| Header size auto-detected from the tag (incl. fallback without injected default) | stays a semantic heading and follows the heading level by default                         | ✅ covered | Checks the computed font size per level and the non-heading fallback (5) |
| Explicit `headerSize` applied and updated on change                              | headerSize overrides the visual size independent of the heading level                     | ✅ covered | Includes reset to `null`                                                 |
| `wrap` true/false                                                                | truncates long titles on one line by default; wrap shows the whole title on several lines | ✅ covered | Layout outcome, not class                                                |
| `elementRef` getter                                                              | exposes the host element through elementRef                                               | ✅ covered |                                                                          |
| `DEFAULT_TITLE_SIZE` injection, explicit wins                                    | FD_DEFAULT_TITLE_SIZE sets the size for titles without headerSize                         | ✅ covered |                                                                          |

Registry-only coverage: SAP header typography tokens (font family, weight, colour, margin), `twoLineClamp`, user class merge.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, one story and one trivial test.
