## formatted-text

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/formatted-text) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/formatted-text)
Registry: `registry/ui/formatted-text/` — 2 stories, 4 tests.

### Stories vs. upstream examples

| Upstream example                             | Registry story | Status     | Notes                                                                                                                                                                 |
| -------------------------------------------- | -------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simple Formatted Text                        | `Default`      | ✅ covered | Headings, lists, blockquote, links, inline styles; upstream also shows a `style` attribute on an `li` and an invalid `href`, ours shows a `javascript:` href instead. |
| Formatted text with custom link target       | `Sized`        | ✅ covered | `convertedLinksDefaultTarget="_self"`; upstream's link already carries `target="_blank"` to show it is overwritten, ours has none (minor).                            |
| Formatted text with prevent script execution | `Default`      | ✅ covered | `<script>` and `onerror` handler included in the default HTML. Upstream shows the raw input next to the output; we do not.                                            |

### Tests vs. upstream specs

| Upstream behaviour                    | Registry test                                                                 | Status     | Notes                                   |
| ------------------------------------- | ----------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| Should create                         | —                                                                             | ➖ n/a     |                                         |
| height / width set class and style    | width and height constrain the container                                      | ✅ covered | Asserts the rendered size, not classes. |
| Renders the allowed tags as given     | sanitizes htmlText: keeps the allowed tags and attributes, strips scripts ... | ✅ covered |                                         |
| Skips unsupported tags                | sanitizes htmlText ... strips scripts and event handlers                      | ✅ covered |                                         |
| Skips unsupported attributes on a tag | sanitizes htmlText ...; sanitizeFormattedText keeps safe link schemes only    | ✅ covered |                                         |

Registry-only coverage: safe link schemes only, `rel="noopener"` on `_blank` links, in-page anchors keep no target, link focus styles, changing the target at runtime.

### Gaps to fill

- **Stories:** optional: `CustomLinkTarget` showing a link that already has `target="_blank"` being rewritten to `_self`; otherwise none.
- **Tests:** "an existing target on a link is replaced by convertedLinksDefaultTarget" (only if not already asserted inside the link test).
- **Effort:** S, cosmetic additions only.
