## skeleton

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/skeleton) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/skeleton)
Registry: `registry/ui/skeleton/` — 3 stories, 10 tests.

### Stories vs. upstream examples

| Upstream example                                                      | Registry story             | Status     | Notes                                                                          |
| --------------------------------------------------------------------- | -------------------------- | ---------- | ------------------------------------------------------------------------------ |
| Component (types: rectangle, circle, text 3/2 lines, animated on/off) | `Types`                    | ✅ covered | Same matrix; also adds a 1-line text skeleton. `Playground` covers the inputs. |
| Custom Templates (projected SVG shapes)                               | `Custom` ("Custom shapes") | ✅ covered | Identical shapes.                                                              |

### Tests vs. upstream specs

| Upstream behaviour                                                          | Registry test                                                         | Status     | Notes                                                                                                                                                 |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| should create                                                               | —                                                                     | ➖ n/a     |                                                                                                                                                       |
| Defaults: animated, null type, 3 text lines, null width/height              | animates with the shimmer gradient by default                         | 🟡 partial | Animated default is checked; the host always binds `textLines`, `type`, `width`, `height`, so the 3-line and unset-type defaults are never exercised. |
| Input changes: animated=false, type change, `textLines` string coercion     | animated=false uses a solid fill; circle/text tests switch `type`     | 🟡 partial | No test binds `textLines="2"` as a string (`numberAttribute`).                                                                                        |
| Text dimensions: 100% default width, height from lines, custom width/height | text draws textLines lines…; text without a width fills its container | ✅ covered | Custom height on a text skeleton is not checked (minor).                                                                                              |
| Circle: square from width or height, both given                             | circle is square when only width or height is given                   | ✅ covered | Both-dimensions case not checked (minor).                                                                                                             |
| Rectangle custom dimensions                                                 | rectangle fills the given size with a rounded rectangle               | ✅ covered |                                                                                                                                                       |
| Unique ids per instance                                                     | each instance has unique gradient and mask ids…                       | ✅ covered | Also checks the `url(#…)` references.                                                                                                                 |
| Line widths: 100%/60%, update on change, 20px spacing, zero lines           | text draws textLines lines…; text with textLines 0 draws no lines…    | ✅ covered | Widths, spacing and updates covered. `textLines=0` now renders no lines like upstream (the height keeps one line).                                    |

Registry-only coverage: aria-hidden SVG, wait cursor, projected shapes land as real SVG elements, prefers-reduced-motion stops the shimmer.

### Gaps to fill

- **Stories:** none.
- **Tests:** "uses type null, 3 text lines and no size by default"; "coerces a string textLines attribute".
- **Effort:** S, three small specs on an existing host.
