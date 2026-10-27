## object-number

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/object-number) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/object-number)
Registry: `registry/ui/object-number/` — 4 stories, 13 tests.

### Stories vs. upstream examples

| Upstream example                   | Registry story                                          | Status     | Notes |
| ---------------------------------- | ------------------------------------------------------- | ---------- | ----- |
| Basic Object Number                | Playground; Status, emphasized, decimals and units      | ✅ covered |       |
| Object Number Status               | Status, emphasized… ("Status")                          | ✅ covered |       |
| Large Object Number                | Large                                                   | ✅ covered |       |
| Bold Object Number                 | Status, emphasized… ("Emphasized")                      | ✅ covered |       |
| Object Number Units                | Status, emphasized… ("Units")                           | ✅ covered |       |
| Object Number Decimal              | Status, emphasized… ("Decimals")                        | ✅ covered |       |
| Object Number Truncation           | Status, emphasized… ("Truncation in a 100px container") | ✅ covered |       |
| Object Number Interactive          | Interactive and inverted ("Interactive")                | ✅ covered |       |
| Object Number Inverted             | Interactive and inverted ("Inverted")                   | ✅ covered |       |
| Object Number Inverted Interactive | Interactive and inverted ("Inverted interactive")       | ✅ covered |       |

### Tests vs. upstream specs

| Upstream behaviour                              | Registry test                                                                       | Status     | Notes                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- | ---------- | -------------------------------- |
| `should create`                                 | —                                                                                   | ➖ n/a     |                                  |
| Large design                                    | large uses a bigger font and ignores emphasized                                     | ✅ covered |                                  |
| Displays units                                  | shows the unit after the number                                                     | ✅ covered |                                  |
| Displays decimals; none when `decimal` is 0     | formats with the given number of decimals                                           | ✅ covered |                                  |
| Emphasized adds translated sr "Emphasized" text | emphasized makes the number bold and announces it                                   | ✅ covered |                                  |
| Status modifier class                           | status colours the number with the semantic text colour                             | ✅ covered | Computed colour instead of class |
| Default sr status text; custom `statusMessage`  | status has a hidden text for assistive technology, overridable with statusMessage   | ✅ covered |                                  |
| Interactive: modifier, tabindex 0, role button  | interactive number is a focusable button that activates with click, Enter and Space | ✅ covered |                                  |
| Inverted modifier when interactive              | inverted shows a filled badge in the status colours                                 | ✅ covered |                                  |

Registry-only coverage: LOCALE_ID formatting, `ariaLabel`, Space does not scroll, `<bdi>` isolation for RTL, not focusable unless interactive.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, nothing to add.
