## layout-panel

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/layout-panel) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/layout-panel)
Registry: `registry/ui/layout-panel/` — 4 stories, 5 tests.

### Stories vs. upstream examples

| Upstream example               | Registry story                         | Status     | Notes                                                                                |
| ------------------------------ | -------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| Basic Layout Panel Layout      | Default ("Basic")                      | ✅ covered | Header, filters, body, footer                                                        |
| Layout Panel Edge Bleed        | EdgeBleed ("Edge bleed")               | ✅ covered | A plain `<table>` in a bled body (no table component in the registry), plus an image |
| Layout Panel Transparent       | Transparent                            | ✅ covered |                                                                                      |
| Layout Panel Footer Variations | FooterVariations ("Footer variations") | ✅ covered | start, end and default (center)                                                      |

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

- **Tests:** none.
- **Effort:** S — story restructuring only.
