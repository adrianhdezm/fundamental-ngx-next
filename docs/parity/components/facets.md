## facets

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/facets) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/facets)
Registry: `registry/ui/facets/` — 6 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story                  | Status     | Notes                                                                                                                                                                         |
| ------------------------------- | ------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facets as a Group               | Group ("Facet group"), KeyValue | ✅ covered | Image, form, rating, key-value facets                                                                                                                                         |
| Form Facet                      | FormFacet ("Form facet")        | ✅ covered |                                                                                                                                                                               |
| Facets with different alignment | Alignment                       | ✅ covered | `alignEnd`                                                                                                                                                                    |
| Custom Facet                    | Custom ("Custom facet")         | ✅ covered | Description paragraph with a large object status; title, status and ID rows with copy buttons in `fd-facet-container` row and column layouts; Loading also uses custom facets |
| Facets Loading                  | Loading                         | ✅ covered | Skeletons, `aria-busy`                                                                                                                                                        |

### Tests vs. upstream specs

| Upstream behaviour                                                          | Registry test                                                                                        | Status     | Notes                                                                                                             |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `should create` (x5)                                                        | —                                                                                                    | ➖ n/a     |                                                                                                                   |
| Form facet spacing; icon in a form facet with a link gets a tiny end margin | facet group is a group…(reference spacing); form facet rows space evenly and icons get an end margin | ✅ covered | Measured, not class-checked                                                                                       |
| Image facet first (`order: -1`), no bottom margin                           | image facets come first (order -1) and have no title                                                 | ✅ covered |                                                                                                                   |
| Rating-indicator facet and the rating indicator's facet modifier            | rating facet shows the subtitle (review count) under the title                                       | ✅ covered | Our facet and rating indicator apply no rating-specific styling to each other, so only the facet layout is tested |
| Key-value facet and its large object status/number                          | key-value facets use the regular font family for large object statuses                               | ✅ covered |                                                                                                                   |
| `alignEnd`                                                                  | alignEnd pushes the facet to the end in LTR and RTL                                                  | ✅ covered | Also RTL                                                                                                          |

Registry-only coverage: group and facet accessible names (`role=group`, labelled by title), `headingLevel` heading semantics, facet-container flex options.

### Gaps to fill

- **Stories:** none.
- **Tests:** none (our facet applies no rating-specific styling).
- **Effort:** S, one story.
