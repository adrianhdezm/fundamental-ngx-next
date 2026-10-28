## dynamic-page

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/dynamic-page) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/dynamic-page)
Registry: `registry/ui/dynamic-page/` — 10 stories, 20 tests.

### Stories vs. upstream examples

| Upstream example                           | Registry story                                             | Status     | Notes                                                                                                           |
| ------------------------------------------ | ---------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Basic Dynamic Page                         | Default ("Facets, pinnable header and footer")             | ✅ covered | Breadcrumb, global/layout actions, title content, footer                                                        |
| Dynamic Page with Tabs                     | Tabs, StackedTabs                                          | ✅ covered |                                                                                                                 |
| Dynamic Page inside Flexible Column Layout | InFlexibleColumnLayout ("Inside a flexible column layout") | ✅ covered | Page in the mid column with full screen / close layout actions                                                  |
| Responsive Dynamic Page                    | Responsive, Small ("Small width")                          | ✅ covered | Width switcher over the four sizes: paddings, squashed layout actions, global actions toolbar overflow on small |
| Dynamic Page with Facets                   | Default, Collapsed                                         | ✅ covered |                                                                                                                 |
| Dynamic height of parent element           | ContainerHeight ("Dynamic height of the parent")           | ✅ covered | Space added above the page, `refreshSize()` and `offset`                                                        |
| Routing inside Dynamic Page                | —                                                          | ❌ missing | Blocked: router outlet in the content needs a router in stories (see README "Not yet ported")                   |
| Dynamic Page with Wizard                   | WithWizard ("With wizard")                                 | ✅ covered | `fd-wizard` in the content                                                                                      |

Not an overlay component; upstream opens examples full screen from a button, our stories render the page in a frame, so no "Open: …" story is needed.

### Tests vs. upstream specs

| Upstream behaviour                                                                           | Registry test                                                                                                 | Status     | Notes                                                                                                                |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Base actions add toolbar classes; `should create`; service created; content-children queries | —                                                                                                             | ➖ n/a     | Class/DI plumbing                                                                                                    |
| Global and layout actions are `role=toolbar`                                                 | global and layout actions are labelled toolbars                                                               | ✅ covered |                                                                                                                      |
| Global actions overflow when the size is small (`shouldOverflow`)                            | moves the global actions of a toolbar into its overflow when the page is small                                | ✅ covered | An `fd-toolbar` in the global actions moves all items into its overflow on small pages (`FD_TOOLBAR_FORCE_OVERFLOW`) |
| Title and subtitle render from inputs; subtitle moves into the title area when collapsed     | renders title and subtitle, and moves the subtitle into the title area when collapsed                         | ✅ covered |                                                                                                                      |
| `titleWrap` / `subtitleWrap`                                                                 | truncates the title and subtitle unless titleWrap/subtitleWrap are set                                        | ✅ covered |                                                                                                                      |
| Custom / default `titleId`                                                                   | uses titleId for the heading and sets aria-level from headingLevel                                            | ✅ covered | Also the header toggle's aria-describedby                                                                            |
| Heading levels (title level, default 2, subtitle heading role/level only when set)           | uses titleId for the heading…; gives the subtitle a heading role only with subtitleHeadingLevel               | ✅ covered |                                                                                                                      |
| Responsive size from width (sm ≤599, md, lg, xl ≥1440) and manual size override              | derives the size from the width and honours size when autoResponsive is false                                 | ✅ covered | Breakpoints and paddings                                                                                             |
| Layout actions squash into the breadcrumb row below the breakpoint                           | moves the layout actions into the breadcrumb row below 1280px                                                 | ✅ covered |                                                                                                                      |
| Clicks on header controls do not toggle (stopPropagation)                                    | toggles the header by clicking the title area but not its links                                               | ✅ covered |                                                                                                                      |
| Custom title/subtitle templates get the collapsed state as context                           | passes the collapsed state to custom title and subtitle templates                                             | ✅ covered |                                                                                                                      |
| Message strip rendered in the header                                                         | renders a message strip in the header; clicking it does not toggle the header                                 | ✅ covered |                                                                                                                      |
| Pin toggle (pinned state, pin/unpin label)                                                   | pin button toggles its pressed state and label; collapses the header while the content scrolls, unless pinned | ✅ covered |                                                                                                                      |
| Collapse toggle: state, button label follows state, `collapsed` output                       | collapse button switches between Collapse and Expand Header and updates collapsed; toggles the header…        | ✅ covered | Two-way `collapsed` model on the subheader                                                                           |
| Collapses on content scroll, not when pinned                                                 | collapses the header while the content scrolls, unless pinned                                                 | ✅ covered |                                                                                                                      |
| Page height fills the viewport with `svh` minus top/offset                                   | fills the viewport below its top, minus offset                                                                | ✅ covered | `offset` applies on the next measure (resize or `refreshSize()`)                                                     |

Registry-only coverage: Enter/Space on the header toggle, `disableSnapOnScroll`, scrolling and collapsing from tab panels, footer spacer per content vs stacked tabs, no nested navigation landmark around `fd-breadcrumb`.

### Gaps to fill

- **Stories:** "Routing" is blocked on a router in stories.
- **Tests:** none.
- **Effort:** M, about a dozen header tests and four stories, all built from existing registry components.
