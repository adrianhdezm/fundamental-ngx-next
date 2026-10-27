## object-attribute

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/object-attribute) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/object-attribute)
Registry: `registry/ui/object-attribute/` — 2 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                            | Registry story                                                                  | Status     | Notes                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| Object attribute standalone text            | Text, links and truncation ("Text")                                             | ✅ covered | Same label + projected ": Checked"                                              |
| Object Attributes with long text truncation | Text, links and truncation ("Truncation in a 120px container")                  | ✅ covered |                                                                                 |
| Object Attributes with link option          | Text, links and truncation ("Link with an action", "Disabled link"); Playground | ✅ covered | Upstream's second "link with routing" variant differs only in the click handler |

### Tests vs. upstream specs

| Upstream behaviour                                        | Registry test                                                                           | Status     | Notes                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| `should create` (x2)                                      | —                                                                                       | ➖ n/a     |                                                               |
| Host classes `fd-object-attribute`, `--link`              | —                                                                                       | ➖ n/a     | Class only; the link state is covered via role/tab stop below |
| Title attribute is the label                              | truncates to a single line… keeps the label as title; has no title without a label      | ✅ covered |                                                               |
| Renders the label text                                    | renders the label and projected value as plain text without a link                      | ✅ covered |                                                               |
| Content projection displays the text                      | renders the label and projected value…                                                  | ✅ covered |                                                               |
| Link mode: renders a link with the link text              | with isLink renders a focusable link that emits objectAttributeClick on click and Enter | ✅ covered | Also checks `title` = link text                               |
| Link mode: title is the label, inner content is the label | with isLink renders a focusable link…                                                   | ✅ covered |                                                               |

Registry-only coverage: click and Enter emit `objectAttributeClick`, disabled link out of tab order with `aria-disabled` and no emit, `linkText` without `isLink` is plain text, link colour only for action links.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, nothing to add.
