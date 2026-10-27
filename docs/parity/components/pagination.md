## pagination

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/pagination) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/pagination)
Registry: `registry/ui/pagination/` — 3 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story                                        | Status     | Notes                                                                        |
| ------------------------------- | ----------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| Basic Pagination                | Examples ("More than nine pages", "Up to nine pages") | ✅ covered |                                                                              |
| Pagination showing items        | Examples ("Showing text")                             | ✅ covered | Via `displayTextTemplate`                                                    |
| Pagination with per page select | Examples ("Items per page"), "Open: items per page"   | ✅ covered | The Open story opens the items-per-page `fd-select` listbox for the a11y run |
| Mobile                          | Examples ("Mobile")                                   | ✅ covered |                                                                              |
| Playground Area                 | Playground                                            | ✅ covered |                                                                              |

### Tests vs. upstream specs

| Upstream behaviour                                                                          | Registry test                                                        | Status     | Notes                                                                                                                 |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `PaginationService` created / pagination object from the service                            | —                                                                    | ➖ n/a     | Service replaced by the exported `paginationPages` function and computeds                                             |
| Defaults to the first page                                                                  | —                                                                    | ❌ missing | `currentPage` defaults to 1; every test sets a page                                                                   |
| Items-per-page select with its options                                                      | changes the items per page and keeps the page in range               | 🟡 partial | Picks option 25; the rendered option list is not asserted                                                             |
| Clicking a page navigates                                                                   | goes to pages with the buttons and disables them at the ends         | ✅ covered |                                                                                                                       |
| Does not navigate to an invalid page                                                        | takes a page from the input when there are more than nine pages      | ✅ covered | 99 marked `aria-invalid`, Enter ignored                                                                               |
| `itemsPerPage`: number coercion, floor, default 10 when unparsable, rejects < 1             | rounds itemsPerPage down, keeps it at least 1 and falls back to 10 … | ✅ covered | Ported: the `pageSize` computed normalises the `itemsPerPage` model like upstream's setter                            |
| `currentPage`: floor and input reset                                                        | takes a page from the input…                                         | 🟡 partial | Port floors and clamps `currentPage`; untested. Invalid input is flagged but reset of the field value is not asserted |
| `itemsPerPageOptions`: numbers, floor, add current `itemsPerPage`, sort ascending, keep > 0 | —                                                                    | ❌ missing | Implemented in `pageSizeOptions`; untested                                                                            |
| Page list truncation with ellipses (≤ 9, start, end, both)                                  | shows all pages up to nine and ellipses beyond                       | ✅ covered |                                                                                                                       |
| Total pages: count, 0 for itemsPerPage 0/empty                                              | goes to pages… ("50 Results"); rounds itemsPerPage down…             | 🟡 partial | Count checked; `itemsPerPage` 0 is normalised to 1 (as upstream's component does), so the service's 0 never applies   |
| One vs. two ellipsis sections, not two when the second-to-last page is current              | shows all pages up to nine and ellipses beyond                       | 🟡 partial | Pages 1, 25, 50 checked; the second-to-last edge (e.g. page 49 or 2) is not                                           |

Registry-only coverage: `nav` label, `aria-current`, prev/next disabled at the ends, `pageChangeStart`, roving single tab stop with Arrow/Home, items-per-page change clamps the page, mobile first/last buttons.

### Gaps to fill

- **Tests:** "starts on the first page by default"; "floors and clamps a fractional or out-of-range currentPage"; "items per page options are floored, filtered to positive values, include itemsPerPage and are sorted"; "invalid input value is reset to the current page on blur/Enter"; "paginationPages shows only one ellipsis when the current page is next to an end" (e.g. `paginationPages(50, 49)`, `paginationPages(50, 2)`).
- **Effort:** S, mostly pure assertions plus one Open story.
