## pagination

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/pagination) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/pagination)
Registry: `registry/ui/pagination/` — 6 stories, 14 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story                         | Status     | Notes                                                                                                                                                                                 |
| ------------------------------- | -------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Basic Pagination                | Basic                                  | ✅ covered | 50 items without the total, page set after a simulated request started by `pageChangeStart`, "Go to page 1" button                                                                    |
| Pagination showing items        | Showing items                          | ✅ covered | `displayTextTemplate` "From … to …. Total items …"                                                                                                                                    |
| Pagination with per page select | Items per page, "Open: items per page" | ✅ covered | `itemsPerPage` 15 (10 pages, so the page input shows), the default select with `[4, 8, 16]`, and a custom segmented button template; the Open story opens the select for the a11y run |
| Mobile                          | Mobile                                 | ✅ covered | 50 items, 4 per page, options `[4, 8, 16]`                                                                                                                                            |
| Playground Area                 | Playground                             | ✅ covered |                                                                                                                                                                                       |

Until the stories were split per upstream example, a single "Examples" story stood in for all of them and this table rated it covered; the custom items per page template, `itemsPerPage` 15 and the basic example's request flow were in fact missing. The desktop layout also showed "Page:" and "of N" around the page input, which fundamental-styles shows in the mobile layout only; fixed with the stories.

### Tests vs. upstream specs

| Upstream behaviour                                                                          | Registry test                                                                                    | Status     | Notes                                                                                                               |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `PaginationService` created / pagination object from the service                            | —                                                                                                | ➖ n/a     | Service replaced by the exported `paginationPages` function and computeds                                           |
| Defaults to the first page                                                                  | starts on the first page by default                                                              | ✅ covered | Also a `null` currentPage in "rounds a fractional currentPage down…"                                                |
| Items-per-page select with its options                                                      | changes the items per page…; rounds items per page options down…                                 | ✅ covered | The rendered option list is asserted                                                                                |
| Clicking a page navigates                                                                   | goes to pages with the buttons and disables them at the ends                                     | ✅ covered |                                                                                                                     |
| Does not navigate to an invalid page                                                        | takes a page from the input when there are more than nine pages                                  | ✅ covered | 99 marked `aria-invalid`, Enter ignored                                                                             |
| `itemsPerPage`: number coercion, floor, default 10 when unparsable, rejects < 1             | rounds itemsPerPage down, keeps it at least 1 and falls back to 10 …                             | ✅ covered | Ported: the `pageSize` computed normalises the `itemsPerPage` model like upstream's setter                          |
| `currentPage`: floor and input reset                                                        | rounds a fractional currentPage down and keeps it in range; resets an invalid page in the input… | ✅ covered | Floor and clamp; the field value is reset on Enter and on blur                                                      |
| `itemsPerPageOptions`: numbers, floor, add current `itemsPerPage`, sort ascending, keep > 0 | rounds items per page options down, drops values below 1, adds itemsPerPage and sorts them       | ✅ covered |                                                                                                                     |
| Page list truncation with ellipses (≤ 9, start, end, both)                                  | shows all pages up to nine and ellipses beyond                                                   | ✅ covered |                                                                                                                     |
| Total pages: count, 0 for itemsPerPage 0/empty                                              | goes to pages… ("50 Results"); rounds itemsPerPage down…                                         | 🟡 partial | Count checked; `itemsPerPage` 0 is normalised to 1 (as upstream's component does), so the service's 0 never applies |
| One vs. two ellipsis sections, not two when the second-to-last page is current              | shows all pages up to nine…; shows only one ellipsis while the current page is near an end       | ✅ covered | Pages 2, 5, 6, 46, 49 of 50 and 9 of 10                                                                             |

Registry-only coverage: `nav` label, `aria-current`, prev/next disabled at the ends, `pageChangeStart`, roving single tab stop with Arrow/Home, items-per-page change clamps the page, mobile first/last buttons.

### Gaps to fill

- None.
