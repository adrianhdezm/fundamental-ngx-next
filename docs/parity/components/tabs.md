## tabs

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/tabs) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/tabs)
Registry: `registry/ui/tabs/` — 9 stories, 16 tests.

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

| Upstream behaviour                                          | Registry test                                                                                                                                  | Status     | Notes                                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| should create (TabList, TabNav, TabLink)                    | —                                                                                                                                              | ➖ n/a     |                                                                                   |
| Initially opens the first tab (incl. zoneless, is-expanded) | links tabs and panels and selects the first tab                                                                                                | ✅ covered | Checked as `aria-selected`, `aria-controls`, `aria-labelledby`.                   |
| Select tab                                                  | selects tabs by click…; selectTab() selects a tab by id and emits selectedTabChange                                                            | ✅ covered | Click and the `selectTab()` API (tab or panel id)                                 |
| Tab structures update on panel changes, keep the active tab | adding and removing tabs keeps the selected tab selected; selectDefaultOnTabsChange selects the default tab again…                             | ✅ covered |                                                                                   |
| Respect maxVisibleTabs                                      | lists tabs that do not fit in a "More" menu                                                                                                    | ✅ covered |                                                                                   |
| Collapse active tab                                         | collapses the selected tab when collapsible                                                                                                    | ✅ covered |                                                                                   |
| Stacked content: all panels expanded, count tracking        | shows every panel and marks the tab of the panel in view; selecting a stacked tab scrolls to its panel and focuses its first focusable element | ✅ covered | Also `focusFirstFocusableElement` off                                             |
| TabNav consumes content density                             | compact density makes the tabs smaller                                                                                                         | ✅ covered | Checked on a tab list (icon-only and filter tabs); TabNav uses the same tab parts |
| TabNav reacts to link list changes                          | marks the active link…; updates the tab stop when links are added                                                                              | ✅ covered |                                                                                   |
| TabNav keydown                                              | marks the active link and makes it the tab stop                                                                                                | ✅ covered | ArrowLeft.                                                                        |
| Tab item / link / icon CSS classes                          | —                                                                                                                                              | ➖ n/a     | Class-only checks; selected state is covered via ARIA.                            |

Registry-only coverage: Home and End, More menu opened with Enter and focus back on the More button after Escape, `defaultTab` with ids bound in a `@for` (the selection follows the default until a tab is chosen), one tab stop with arrow wrap and disabled tabs skipped, End + Enter selection, More menu item selection moves the tab into view.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** M, a second host for dynamic and stacked tabs plus four stories.
