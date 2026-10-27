## feed-input

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/feed-input) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/feed-input)
Registry: `registry/ui/feed-input/` — 7 stories, 3 tests.

### Stories vs. upstream examples

| Upstream example  | Registry story             | Status     | Notes                        |
| ----------------- | -------------------------- | ---------- | ---------------------------- |
| Standard          | Default                    | ✅ covered | Image avatar                 |
| Placeholder image | PlaceholderAvatar          | ✅ covered |                              |
| No image          | NoAvatar                   | ✅ covered |                              |
| Disabled          | Disabled                   | ✅ covered |                              |
| Max Height        | Grow ("Grow up to 7 rows") | ✅ covered | `fdFeedInputTextareaMaxRows` |
| Circle Avatar     | CircleAvatar               | ✅ covered |                              |

### Tests vs. upstream specs

| Upstream behaviour                                                            | Registry test                              | Status     | Notes                                                                       |
| ----------------------------------------------------------------------------- | ------------------------------------------ | ---------- | --------------------------------------------------------------------------- |
| `should create`                                                               | —                                          | ➖ n/a     |                                                                             |
| Disabled state (`is-disabled`)                                                | disables the text area and the button      | ✅ covered | Real disabled controls instead of the class                                 |
| Send button disabled by default, enabled with text, disabled again when empty | enables the send button once there is text | ✅ covered | Also checks the "Send" label                                                |
| Textarea `valueChange` emits the typed value                                  | —                                          | ❌ missing | Our test reads the value through a template ref, not the output             |
| Max height from max rows, also with `line-height: normal`                     | grows with its text up to the maximum rows | 🟡 partial | Row cap tested; the default 20rem cap and `normal` line-height case are not |

Registry-only coverage: group accessible name, avatar hidden below 20rem (Narrow story only).

### Gaps to fill

- **Stories:** none.
- **Tests:** "emits valueChange while typing"; "caps the height at 20rem without max rows"; "computes the row cap when line-height is normal"; optionally "hides the avatar below 20rem".
- **Effort:** S, three small tests.
