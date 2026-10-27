## tabs

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/tabs) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/tabs)
Registry: `registry/ui/tabs/` — 9 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                                        | Registry story                 | Status     | Notes                                                                                        |
| ------------------------------------------------------- | ------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| Simple Tabs (titles, semantic, title templates)         | `Basic`                        | ✅ covered | Adds a disabled tab.                                                                         |
| Form element inside tab content                         | `Form content`                 | ✅ covered | A button and an input group with a label in the panels                                       |
| Tabs with Counter                                       | `Basic`, `Modes`               | ✅ covered | Counts on title and template tabs; semantic counts in filter mode.                           |
| Icon-Only Mode                                          | `Modes`                        | ✅ covered |                                                                                              |
| Process Mode                                            | `Modes`                        | ✅ covered |                                                                                              |
| Filter Mode                                             | `Modes`                        | ✅ covered |                                                                                              |
| Programmatic Selection                                  | `Behaviour`                    | ✅ covered | `selectTab('story-tab-2')`.                                                                  |
| Adding and Removing Tabs                                | `Behaviour`                    | ✅ covered |                                                                                              |
| Collapsible Overflow (More menu; maxVisibleTabs)        | `Behaviour`, "Open: More menu" | ✅ covered | The Open story opens the More menu for the a11y run                                          |
| Stacked Content                                         | `Stacked`                      | ✅ covered |                                                                                              |
| Collapsible Tab                                         | `Behaviour`                    | ✅ covered | `collapsibleTabs` with `maxVisibleTabs=3`.                                                   |
| Default Tab (`defaultTab`, `selectDefaultOnTabsChange`) | `Default tab`                  | ✅ covered | `defaultTab` on the third tab; a Hide/Show first tab button with `selectDefaultOnTabsChange` |
| Playground Area                                         | `Playground`                   | ✅ covered | Mode, size, compact, and the title, icon and count of each tab                               |

### Tests vs. upstream specs

| Upstream behaviour                                          | Registry test                                   | Status     | Notes                                                           |
| ----------------------------------------------------------- | ----------------------------------------------- | ---------- | --------------------------------------------------------------- |
| should create (TabList, TabNav, TabLink)                    | —                                               | ➖ n/a     |                                                                 |
| Initially opens the first tab (incl. zoneless, is-expanded) | links tabs and panels and selects the first tab | ✅ covered | Checked as `aria-selected`, `aria-controls`, `aria-labelledby`. |
| Select tab                                                  | selects tabs by click and skips disabled ones   | 🟡 partial | Click covered; the `selectTab()` API is not.                    |
| Tab structures update on panel changes, keep the active tab | —                                               | ❌ missing | No test adds or removes tabs.                                   |
| Respect maxVisibleTabs                                      | lists tabs that do not fit in a "More" menu     | ✅ covered |                                                                 |
| Collapse active tab                                         | collapses the selected tab when collapsible     | ✅ covered |                                                                 |
| Stacked content: all panels expanded, count tracking        | —                                               | ❌ missing |                                                                 |
| TabNav consumes content density                             | —                                               | ❌ missing |                                                                 |
| TabNav reacts to link list changes                          | marks the active link and makes it the tab stop | 🟡 partial | Static links only.                                              |
| TabNav keydown                                              | marks the active link and makes it the tab stop | ✅ covered | ArrowLeft.                                                      |
| Tab item / link / icon CSS classes                          | —                                               | ➖ n/a     | Class-only checks; selected state is covered via ARIA.          |

Registry-only coverage: `defaultTab` with ids bound in a `@for` (the selection follows the default until a tab is chosen), one tab stop with arrow wrap and disabled tabs skipped, End + Enter selection, More menu item selection moves the tab into view.

### Gaps to fill

- **Stories:** none.
- **Tests:** "selectTab() selects a tab by id and emits selectedTabChange"; "adding and removing tabs keeps the selected tab selected"; "removing the selected tab selects the default tab with selectDefaultOnTabsChange"; "stackContent shows every panel and marks the tab of the panel in view"; "the More menu opens with the keyboard and returns focus to the More button on Escape"; "compact density makes the tabs smaller"; "TabNav updates the tab stop when links are added"; "selecting a tab focuses the first focusable element in its panel"; "Home moves to the first enabled tab".
- **Effort:** M, a second host for dynamic and stacked tabs plus four stories.
