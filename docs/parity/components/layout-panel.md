## layout-panel

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/layout-panel) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/layout-panel)
Registry: `registry/ui/layout-panel/` — 1 story, 5 tests.

### Stories vs. upstream examples

| Upstream example               | Registry story       | Status     | Notes                                                                                                                   |
| ------------------------------ | -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Basic Layout Panel Layout      | Default (panel 1)    | ✅ covered | Header, filters, body, footer                                                                                           |
| Layout Panel Edge Bleed        | Default (panel 2)    | 🟡 partial | Bleed shown with an image; upstream bleeds a table, which is the real use case (cell padding aligning with panel edges) |
| Layout Panel Transparent       | Default (panel 3)    | ✅ covered |                                                                                                                         |
| Layout Panel Footer Variations | Default (panels 1-3) | ✅ covered | end, start and default (center) across the three panels                                                                 |

### Tests vs. upstream specs

| Upstream behaviour                                    | Registry test                                          | Status     | Notes                          |
| ----------------------------------------------------- | ------------------------------------------------------ | ---------- | ------------------------------ |
| should create (all 9 parts)                           | —                                                      | ➖ n/a     |                                |
| Panel base class / structure                          | places header, filters, body and footer in that order… | ✅ covered | Also checks the generated id   |
| Transparent background                                | transparent variant and backgroundImage                | ✅ covered |                                |
| Background image style                                | transparent variant and backgroundImage                | ✅ covered | Incl. clearing                 |
| Header / head / title / description / actions classes | header with title, description, actions and filters    | ✅ covered | Layout and typography outcomes |
| Filters class                                         | header with title, description, actions and filters    | ✅ covered |                                |
| Body class + edge bleed                               | body bleed removes the padding                         | ✅ covered |                                |
| Footer default / start / end                          | footer position start/end                              | ✅ covered |                                |

Registry-only coverage: slot ordering independent of projection order.

### Gaps to fill

- **Stories:** split `Default` into one story per upstream example ("Basic", "Edge bleed" with a `fd-table` in a bled body, "Transparent", "Footer variations").
- **Tests:** none.
- **Effort:** S — story restructuring only.
