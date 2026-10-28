## scroll-spy

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/scroll-spy) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/scroll-spy)
Registry: `registry/ui/scroll-spy/` — 3 stories, 10 tests.

### Stories vs. upstream examples

| Upstream example                  | Registry story                               | Status     | Notes                                                                                                    |
| --------------------------------- | -------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| Scroll Spy Example                | `Default` ("Table of contents")              | ✅ covered | Link list highlights the tracked section; upstream also sets `fireEmpty`, which ours leaves off (minor). |
| Custom Detection Threshold        | `DetectionThreshold` ("Detection threshold") | ✅ covered | `[targetPercent]="0.5"`.                                                                                 |
| Custom Offset Detection Threshold | `Offset`                                     | ✅ covered | `[targetOffset]="100"`, with `fireEmpty`.                                                                |

### Tests vs. upstream specs

| Upstream behaviour | Registry test | Status | Notes                           |
| ------------------ | ------------- | ------ | ------------------------------- |
| Should create      | —             | ➖ n/a | Upstream has no behaviour test. |

Registry-only coverage: initial emission, emission while scrolling, `trackedTags` filtering and case-insensitive multi-tag match, `targetOffset`, `targetPercent`, `fireEmpty` on/off, `scrollSpyDisabled`, re-emit on resize.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S — parametrise the existing story component.
