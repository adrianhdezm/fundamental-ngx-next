## message-strip

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/message-strip) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/message-strip)
Registry: `registry/ui/message-strip/` — 8 stories, 20 tests.

### Stories vs. upstream examples

| Upstream example                       | Registry story                 | Status     | Notes                                                                              |
| -------------------------------------- | ------------------------------ | ---------- | ---------------------------------------------------------------------------------- |
| Message Strip Types                    | Types, Playground              | ✅ covered | Incl. dismissible/non-dismissible and long text                                    |
| Custom Icons                           | IndicationColors               | ✅ covered | Custom icon via `*fdMessageStripIcon`                                              |
| Message Strips Without Icons           | WithoutIcons ("Without icons") | ✅ covered | All four types with `noIcon`                                                       |
| Message Strips With Customizable Width | Widths                         | ✅ covered |                                                                                    |
| Message Strips Indication Colors       | IndicationColors               | ✅ covered | All 20 colours                                                                     |
| Message Strip Alerts                   | Alerts, OpenAlerts             | ✅ covered | "Open: alerts" opens one alert per position in `play`, so the a11y run checks them |
| Auto Dismiss Message Strip Alerts      | AutoDismiss                    | ✅ covered |                                                                                    |

### Tests vs. upstream specs

| Upstream behaviour                                                                   | Registry test                                                                                                       | Status     | Notes                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------- |
| should create                                                                        | —                                                                                                                   | ➖ n/a     |                                        |
| noIcon modifier                                                                      | noIcon hides the icon; a custom icon template replaces it                                                           | ✅ covered |                                        |
| Types (each type, none)                                                              | types use the semantic colours, their icon and type description                                                     | ✅ covered |                                        |
| Dismiss button closes and emits onDismiss                                            | the dismiss button closes the strip and emits onDismiss                                                             | ✅ covered | Plus keyboard                          |
| `dismiss()` called programmatically emits onDismiss                                  | dismiss() emits onDismiss and hides the strip                                                                       | ✅ covered |                                        |
| `ariaLabel` input                                                                    | ariaLabel sets the aria-label and marginBottom the bottom margin                                                    | ✅ covered |                                        |
| width / minWidth / marginBottom styles                                               | is a note labelled…; ariaLabel sets the aria-label and marginBottom…                                                | ✅ covered |                                        |
| id input                                                                             | is a note labelled…                                                                                                 | ✅ covered | Drives the hidden-text and content ids |
| role="note", default and custom aria-labelledby                                      | is a note labelled…                                                                                                 | ✅ covered |                                        |
| Text container id                                                                    | is a note labelled…                                                                                                 | ✅ covered |                                        |
| Dismiss button aria-label: default, custom, updates, empty falls back, title mirrors | the dismiss button closes…; …takes a custom title; …follows dismissBtnTitle changes and falls back when it is empty | ✅ covered |                                        |
| dismissible true/false                                                               | dismissible=false hides the dismiss button                                                                          | ✅ covered |                                        |
| indicationColor                                                                      | indication colours change the background and text colour                                                            | ✅ covered |                                        |
| Icon per type / none without type                                                    | types use the semantic colours…                                                                                     | ✅ covered |                                        |
| Screen-reader hidden text incl. "closable" and its id                                | is a note labelled…; dismissible=false…                                                                             | ✅ covered |                                        |
| Content projection container                                                         | is a note labelled…                                                                                                 | ✅ covered |                                        |

Registry-only coverage: auto dismiss timer and mousePersist, `open()` re-showing, the whole MessageStripAlertService (positions, ordering, role=alert, refs, durations, template/component content, narrow-screen collapse).

### Gaps to fill

None: all gaps are filled.
