## vertical-navigation

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/vertical-navigation) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/vertical-navigation)
Registry: `registry/ui/vertical-navigation/` — 5 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example               | Registry story                                     | Status     | Notes                                                                |
| ------------------------------ | -------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| Vertical Navigation (default)  | Default                                            | ✅ covered | Icons, second level expanded, indicated child                        |
| Condensed Mode                 | Condensed, OpenCondensed ("Open: condensed panel") | ✅ covered | Upstream toggles condensed with a button; ours uses separate stories |
| No Icons / Text Only           | NoIcons ("No icons")                               | ✅ covered |                                                                      |
| Vertical Navigation (grouping) | Grouping                                           | ✅ covered | Group header "Employee Services"                                     |

### Tests vs. upstream specs

| Upstream behaviour                             | Registry test                                                           | Status     | Notes                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------- | ---------- | ------------------------------------------- |
| `should create`                                | —                                                                       | ➖ n/a     |                                             |
| `ngAfterContentInit` passes condensed to items | shows icons only when condensed and opens second-level items in a panel | ✅ covered | Outcome: text becomes sr-only, narrow width |
| First item tabbable, others not                | renders a tree with one tab stop and second-level groups                | ✅ covered |                                             |

Registry-only coverage: tree/group roles and aria-level, current page and collapsed-parent indicator, arrow-key navigation and expansion, click/Enter/Space toggling, condensed panel open/close with Escape and outside click, RTL-mirrored Right/Left, group headers skipped by arrows and Tab, runtime condensed switching keeping the focus and tab stop.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, three small tests.
