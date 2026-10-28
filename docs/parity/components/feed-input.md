## feed-input

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/feed-input) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/feed-input)
Registry: `registry/ui/feed-input/` — 7 stories, 7 tests.

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

| Upstream behaviour                                                            | Registry test                                                                                                                          | Status     | Notes                                       |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------- |
| `should create`                                                               | —                                                                                                                                      | ➖ n/a     |                                             |
| Disabled state (`is-disabled`)                                                | disables the text area and the button                                                                                                  | ✅ covered | Real disabled controls instead of the class |
| Send button disabled by default, enabled with text, disabled again when empty | enables the send button once there is text                                                                                             | ✅ covered | Also checks the "Send" label                |
| Textarea `valueChange` emits the typed value                                  | emits valueChange while typing                                                                                                         | ✅ covered |                                             |
| Max height from max rows, also with `line-height: normal`                     | grows with its text up to the maximum rows; caps the height at 20rem without max rows; computes the row cap when line-height is normal | ✅ covered |                                             |

Registry-only coverage: group accessible name, avatar hidden below 20rem.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, three small tests.
