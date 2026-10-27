## layout-grid

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/layout-grid) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/layout-grid)
Registry: `registry/ui/layout-grid/` — 4 stories, 6 tests.

### Stories vs. upstream examples

| Upstream example   | Registry story    | Status     | Notes                                                                               |
| ------------------ | ----------------- | ---------- | ----------------------------------------------------------------------------------- |
| Grid columns       | Basic             | ✅ covered | 1/2/3/4/6/12 spans                                                                  |
| Growing columns    | GrowingAndNesting | ✅ covered | Upstream puts the fixed column between two growing ones; ours has fixed + 2 growing |
| Column offset      | Responsive        | ✅ covered | "Offsets" block                                                                     |
| Responsive columns | Responsive        | ✅ covered | 12 / md 6 / lg 4 / xl 3                                                             |
| Responsive offset  | Responsive        | ✅ covered | md 1 / lg 2 / xl 4, as upstream                                                     |
| Grid row           | GrowingAndNesting | ✅ covered | Two explicit `fdLayoutGridRow`s (upstream four)                                     |
| Without gap        | NoGap             | ✅ covered | noGap, noHorizontalGap, noVerticalGap                                               |
| Nesting columns    | GrowingAndNesting | ✅ covered |                                                                                     |

### Tests vs. upstream specs

| Upstream behaviour                                                            | Registry test                               | Status     | Notes                                                                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| Col base class + custom `class` input                                         | —                                           | 🟡 partial | Base layout checked via geometry; merging a user `class` (our `userClass` alias) is never tested |
| Col sizes per breakpoint (default/md/lg/xl, together, string numbers)         | columns span from the S/M/L/XL inputs…      | ✅ covered | Measured spans at 500/800/1100/1500px                                                            |
| Spans/offsets outside 1..12 are ignored                                       | —                                           | ❌ missing | Source clamps via `valid()`/`validOffset()`; no test                                             |
| Offsets per breakpoint                                                        | offsets per breakpoint                      | 🟡 partial | md/lg tested; `colOffsetXl` never set                                                            |
| colGrow on/off                                                                | columns of a row wrap and a growing column… | ✅ covered |                                                                                                  |
| Reactivity (spans/offset/grow change at runtime)                              | —                                           | ❌ missing | Only `noGap` is toggled at runtime                                                               |
| elementRef exposed                                                            | —                                           | ➖ n/a     | DI plumbing                                                                                      |
| Grid gap variants (noGap / noHorizontalGap / noVerticalGap, update on change) | noGap removes the gutters                   | 🟡 partial | Only `noGap` (incl. runtime toggle); horizontal/vertical-only variants untested                  |

Registry-only coverage: real breakpoint geometry, nested grids not inheriting parent spans, auto-row insertion only without explicit rows.

### Gaps to fill

- **Tests:** "ignores spans and offsets outside 1-12"; "colOffsetXl applies from 1440px"; "updates span, offset and grow when inputs change"; "noHorizontalGap removes only the inline gutters and noVerticalGap only the block gutters"; "merges a user class onto the column and grid".
- **Effort:** S — a handful of geometry assertions in the existing host.
