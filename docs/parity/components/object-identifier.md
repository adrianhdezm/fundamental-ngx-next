## object-identifier

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/object-identifier) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/object-identifier)
Registry: `registry/ui/object-identifier/` — 4 stories, 10 tests.

### Stories vs. upstream examples

| Upstream example | Registry story                             | Status     | Notes                                                   |
| ---------------- | ------------------------------------------ | ---------- | ------------------------------------------------------- |
| Title            | Title, bold and description; Playground    | ✅ covered |                                                         |
| Bold             | Title, bold and description                | ✅ covered |                                                         |
| Links            | Title as link                              | ✅ covered | Plain and bold link                                     |
| Descriptive      | Title, bold and description; Title as link | ✅ covered | Description with text and link titles, bold and regular |
| Tables           | Medium size in a table                     | ✅ covered | Identifier usage identical                              |

### Tests vs. upstream specs

| Upstream behaviour                            | Registry test                                            | Status     | Notes                           |
| --------------------------------------------- | -------------------------------------------------------- | ---------- | ------------------------------- |
| `should create`                               | —                                                        | ➖ n/a     |                                 |
| `medium` adds the medium modifier             | uses the large font size unless medium                   | ✅ covered | Checks computed font size       |
| `bold` makes the title bold                   | bold title is bold, regular otherwise                    | ✅ covered |                                 |
| Renders the description when provided         | renders the title and the description below it           | ✅ covered |                                 |
| No description element without description    | omits the description when there is none                 | ✅ covered |                                 |
| Projected `fd-link` gets the identifier class | a projected link inherits the title font size and weight | ✅ covered | Outcome (font) instead of class |

Registry-only coverage: hidden role text with `ariaLabel` override, projected link labelled by text + role text + description (updates when description toggles, keeps existing id, role text restored when link removed).

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, nothing required.
