## feed-list

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/feed-list-item) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/feed-list-item)
Registry: `registry/ui/feed-list/` — 8 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example                        | Registry story                               | Status     | Notes                                                                                                           |
| --------------------------------------- | -------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Sample example                          | Default, Borderless, Custom more/less labels | ✅ covered | Authors with/without link, `maxChars`, rich text, borderless, custom More/Less labels (`moreLabel`/`lessLabel`) |
| Avatar examples                         | Default, NoAvatars                           | ✅ covered | Upstream also shows a raw SVG avatar; not needed                                                                |
| Actions examples                        | WithActions ("With actions"); Open: actions  | ✅ covered | Action sheet per post, opened in `play()` by the Open story                                                     |
| Footer examples                         | Default                                      | ✅ covered | Footer bylines on every post                                                                                    |
| Mobile example with actionsheet control | Mobile; Open: mobile actions                 | ✅ covered | Mobile action sheet, opened in `play()` by the Open story                                                       |

The action sheet the post actions open is checked by axe through the two Open stories.

### Tests vs. upstream specs

| Upstream behaviour                                           | Registry test                                                                   | Status     | Notes                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `should create` (item, list, byline directive)               | —                                                                               | ➖ n/a     |                                                                         |
| Author title rendered as a link                              | renders a list of posts with the author as a link                               | ✅ covered | Also list/listitem roles                                                |
| Author title as plain text without `authorLink`              | renders the author as text without authorLink                                   | ✅ covered |                                                                         |
| Rich text rendered as formatted text only                    | renders rich text in full                                                       | ✅ covered |                                                                         |
| More/Less button labels                                      | collapses long texts with a More/Less link; uses custom moreLabel and lessLabel | ✅ covered | Default "{count} more"/"Less" and custom labels                         |
| Toggle collapsed/expanded view                               | collapses long texts with a More/Less link                                      | ✅ covered |                                                                         |
| `authorLink` XSS: `javascript:` stripped, `https:` preserved | does not render a javascript: authorLink as a live link                         | ✅ covered | Angular's URL sanitizer prefixes `unsafe:` on the `[attr.href]` binding |
| List mobile mode                                             | moves the author, footer and actions above the text in mobile mode              | ✅ covered | Tests the layout, not the class                                         |
| List borderless                                              | removes the borders between items with borderLess                               | ✅ covered | Checks the computed border between items                                |

Registry-only coverage: list semantics (`role=list`/`listitem`), mobile header placement of footer and actions.

### Gaps to fill

- None.
