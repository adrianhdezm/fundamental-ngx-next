## infinite-scroll

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/infinite-scroll) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/infinite-scroll)
Registry: `registry/ui/infinite-scroll/` — 1 story, 7 tests.

### Stories vs. upstream examples

| Upstream example      | Registry story                   | Status     | Notes                                                    |
| --------------------- | -------------------------------- | ---------- | -------------------------------------------------------- |
| Basic Infinite Scroll | `Default` ("Loading more items") | ✅ covered | Scroll container that appends items on `onScrollAction`. |

### Tests vs. upstream specs

| Upstream behaviour                              | Registry test                                                                    | Status     | Notes                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Should create                                   | —                                                                                | ➖ n/a     |                                                                         |
| Default scrollPercent 75                        | emits onScrollAction when the scroll position is within scrollPercent of the end | ✅ covered | Asserted through behaviour (no emit at 400, emit at 600).               |
| scrollPercent / scrollOffset inputs update      | follows a custom scrollPercent; scrollOffset fires within that many pixels ...   | ✅ covered | Set at creation; changing them at runtime is not exercised (minor).     |
| Trigger / no trigger by scrollPercent threshold | emits onScrollAction ...; follows a custom scrollPercent                         | ✅ covered |                                                                         |
| Trigger / no trigger by scrollOffset threshold  | scrollOffset fires within that many pixels of the end ...                        | ✅ covered |                                                                         |
| Debounce scroll events                          | debounces a burst of scroll events into one emission                             | ✅ covered |                                                                         |
| shouldTriggerAction returns the right value     | —                                                                                | ➖ n/a     | Public helper, but its logic is fully exercised by the threshold tests. |
| Emits onScrollAction                            | emits onScrollAction ...                                                         | ✅ covered |                                                                         |
| Cleans up on destroy                            | stops listening when destroyed                                                   | ✅ covered |                                                                         |

Registry-only coverage: no re-emit after new content moves the end away, listens only to its own scroll container.

### Gaps to fill

- **Stories:** none.
- **Tests:** none (optionally "changing scrollPercent at runtime changes the threshold").
- **Effort:** S, nothing required.
