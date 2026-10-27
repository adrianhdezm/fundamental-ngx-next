## scroll-spy

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/scroll-spy) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/scroll-spy)
Registry: `registry/ui/scroll-spy/` — 1 story, 10 tests.

### Stories vs. upstream examples

| Upstream example                  | Registry story                  | Status     | Notes                                                                                                    |
| --------------------------------- | ------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| Scroll Spy Example                | `Default` ("Table of contents") | ✅ covered | Link list highlights the tracked section; upstream also sets `fireEmpty`, which ours leaves off (minor). |
| Custom Detection Threshold        | —                               | ❌ missing | No story with `targetPercent` (upstream 0.5).                                                            |
| Custom Offset Detection Threshold | —                               | ❌ missing | No story with `targetOffset` (upstream 100).                                                             |

### Tests vs. upstream specs

| Upstream behaviour | Registry test | Status | Notes                           |
| ------------------ | ------------- | ------ | ------------------------------- |
| Should create      | —             | ➖ n/a | Upstream has no behaviour test. |

Registry-only coverage: initial emission, emission while scrolling, `trackedTags` filtering and case-insensitive multi-tag match, `targetOffset`, `targetPercent`, `fireEmpty` on/off, `scrollSpyDisabled`, re-emit on resize.

### Gaps to fill

- **Stories:** `Detection threshold` — same table of contents with `[targetPercent]="0.5"`; `Offset` — with `[targetOffset]="100"` (could be one story component taking these as inputs; optionally a `fireEmpty` toggle).
- **Tests:** none.
- **Effort:** S — parametrise the existing story component.
