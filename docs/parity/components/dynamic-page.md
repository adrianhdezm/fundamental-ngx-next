## dynamic-page

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/dynamic-page) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/dynamic-page)
Registry: `registry/ui/dynamic-page/` — 6 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                           | Registry story                                 | Status     | Notes                                                                                                  |
| ------------------------------------------ | ---------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Basic Dynamic Page                         | Default ("Facets, pinnable header and footer") | ✅ covered | Breadcrumb, global/layout actions, title content, footer                                               |
| Dynamic Page with Tabs                     | Tabs, StackedTabs                              | ✅ covered |                                                                                                        |
| Dynamic Page inside Flexible Column Layout | —                                              | ❌ missing | `flexible-column-layout` exists in the registry                                                        |
| Responsive Dynamic Page                    | Small ("Small width")                          | 🟡 partial | One fixed narrow frame; upstream shows the responsive paddings and compact title content across widths |
| Dynamic Page with Facets                   | Default, Collapsed                             | ✅ covered |                                                                                                        |
| Dynamic height of parent element           | —                                              | ❌ missing | Page inside a container whose height changes (`refreshSize`/`offset`)                                  |
| Routing inside Dynamic Page                | —                                              | ❌ missing | Router outlet in the content                                                                           |
| Dynamic Page with Wizard                   | —                                              | ❌ missing | Wizard inside the content                                                                              |

Not an overlay component; upstream opens examples full screen from a button, our stories render the page in a frame, so no "Open: …" story is needed.

### Tests vs. upstream specs

| Upstream behaviour                                                                           | Registry test                                                             | Status     | Notes                                                                         |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Base actions add toolbar classes; `should create`; service created; content-children queries | —                                                                         | ➖ n/a     | Class/DI plumbing                                                             |
| Global and layout actions are `role=toolbar`                                                 | —                                                                         | ❌ missing | Implemented with an aria-label, never asserted                                |
| Global actions overflow when the size is small (`shouldOverflow`)                            | —                                                                         | ❌ missing | Our global actions have no overflow logic; unclear whether dropped on purpose |
| Title and subtitle render from inputs; subtitle moves into the title area when collapsed     | —                                                                         | ❌ missing | Rendered in fixtures, never asserted                                          |
| `titleWrap` / `subtitleWrap`                                                                 | —                                                                         | ❌ missing | Truncate vs wrap                                                              |
| Custom / default `titleId`                                                                   | —                                                                         | ❌ missing |                                                                               |
| Heading levels (title level, default 2, subtitle heading role/level only when set)           | —                                                                         | ❌ missing | Implemented as `role=heading` + `aria-level`                                  |
| Responsive size from width (sm ≤599, md, lg, xl ≥1440) and manual size override              | —                                                                         | ❌ missing | `size` + `autoResponsive=false` untested                                      |
| Layout actions squash into the breadcrumb row below the breakpoint                           | —                                                                         | ❌ missing | `squashed()`                                                                  |
| Clicks on header controls do not toggle (stopPropagation)                                    | toggles the header by clicking the title area but not its links           | ✅ covered |                                                                               |
| Custom title/subtitle templates get the collapsed state as context                           | —                                                                         | ❌ missing | Used in the Collapsed story only                                              |
| Message strip rendered in the header                                                         | —                                                                         | ❌ missing | Collapsed story only                                                          |
| Pin toggle (pinned state, pin/unpin label)                                                   | collapses the header while the content scrolls, unless pinned             | 🟡 partial | Pinning effect checked; toggled state and label swap not                      |
| Collapse toggle: state, button label follows state, `collapsed` output                       | toggles the header by clicking…; toggles the header with Enter and Space… | 🟡 partial | aria-expanded checked; Expand/Collapse label and model emission not           |
| Collapses on content scroll, not when pinned                                                 | collapses the header while the content scrolls, unless pinned             | ✅ covered |                                                                               |
| Page height fills the viewport with `svh` minus top/offset                                   | —                                                                         | ❌ missing | Unclear how valuable in browser tests; `offset` input untested                |

Registry-only coverage: Enter/Space on the header toggle, `disableSnapOnScroll`, scrolling and collapsing from tab panels, footer spacer per content vs stacked tabs, no nested navigation landmark around `fd-breadcrumb`.

### Gaps to fill

- **Stories:** "Inside flexible column layout" — page in the mid column of an FCL; "Responsive" — the same page in sm/md/lg/xl frames (or a width control) showing paddings and squashed actions; "Container height" — page in a resizable container with `offset`; "Routing" — buttons switching routed content (can be simulated with a signal if no router in Storybook); "Wizard" — `fd-wizard` in the content.
- **Tests:** "global and layout actions are labelled toolbars"; "renders title and subtitle, and moves the subtitle into the title area when collapsed"; "wraps the title and subtitle with titleWrap/subtitleWrap"; "uses titleId for the heading and sets aria-level from headingLevel"; "gives the subtitle a heading role only with subtitleHeadingLevel"; "derives the size from the width and honours size when autoResponsive is false"; "moves the layout actions into the breadcrumb row below the squash width"; "passes the collapsed state to custom title and subtitle templates"; "renders a message strip in the header"; "pin button toggles its pressed state and label"; "collapse button switches between Expand and Collapse Header and emits collapsed"; "subtracts offset from the full height".
- **Effort:** M, about a dozen header tests and four stories, all built from existing registry components.
