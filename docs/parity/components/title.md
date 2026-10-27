## title

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/title) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/title)
Registry: `registry/ui/title/` — 4 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example                      | Registry story               | Status     | Notes                                                                                                     |
| ------------------------------------- | ---------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| Semantic Levels                       | Semantic ("Semantic levels") | ✅ covered | H1–H6                                                                                                     |
| Visual Styling                        | Visual ("Visual levels")     | ✅ covered | Same H1→6 … H6→1 matrix as upstream                                                                       |
| Text Truncation                       | Elision ("Truncation")       | ✅ covered | 300px container, three levels                                                                             |
| Text Wrapping                         | Wrapping                     | ✅ covered | Also shows `twoLineClamp`                                                                                 |
| Default Size via Dependency Injection | —                            | ❌ missing | Upstream is mostly a code snippet (`DEFAULT_TITLE_SIZE` provider); no story shows `FD_DEFAULT_TITLE_SIZE` |

### Tests vs. upstream specs

| Upstream behaviour                                                               | Registry test                                                                             | Status     | Notes                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `should create`                                                                  | —                                                                                         | ➖ n/a     |                                                                          |
| Header size auto-detected from the tag (incl. fallback without injected default) | stays a semantic heading and follows the heading level by default                         | ✅ covered | Checks the computed font size per level and the non-heading fallback (5) |
| Explicit `headerSize` applied and updated on change                              | headerSize overrides the visual size independent of the heading level                     | ✅ covered | Includes reset to `null`                                                 |
| `wrap` true/false                                                                | truncates long titles on one line by default; wrap shows the whole title on several lines | ✅ covered | Layout outcome, not class                                                |
| `elementRef` getter                                                              | —                                                                                         | ❌ missing | Public `elementRef` exists in our source, untested (trivial)             |
| `DEFAULT_TITLE_SIZE` injection, explicit wins                                    | FD_DEFAULT_TITLE_SIZE sets the size for titles without headerSize                         | ✅ covered |                                                                          |

Registry-only coverage: SAP header typography tokens (font family, weight, colour, margin), `twoLineClamp`, user class merge.

### Gaps to fill

- **Stories:** "Default size via injection" — a wrapper component providing `FD_DEFAULT_TITLE_SIZE: 5` with untouched `h2 fdTitle` titles next to one with an explicit `headerSize`.
- **Tests:** "exposes the host element through elementRef".
- **Effort:** S, one story and one trivial test.
