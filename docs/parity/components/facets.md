## facets

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/facets) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/facets)
Registry: `registry/ui/facets/` — 5 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example                | Registry story                  | Status     | Notes                                                                                                                                                                                       |
| ------------------------------- | ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facets as a Group               | Group ("Facet group"), KeyValue | ✅ covered | Image, form, rating, key-value facets                                                                                                                                                       |
| Form Facet                      | FormFacet ("Form facet")        | ✅ covered |                                                                                                                                                                                             |
| Facets with different alignment | Alignment                       | ✅ covered | `alignEnd`                                                                                                                                                                                  |
| Custom Facet                    | Loading                         | 🟡 partial | `type="custom"` + `fd-facet-container` appear only with skeletons; upstream shows a description paragraph and a title row with a copy button (`flexDirection="row"`, `alignItems="center"`) |
| Facets Loading                  | Loading                         | ✅ covered | Skeletons, `aria-busy`                                                                                                                                                                      |

### Tests vs. upstream specs

| Upstream behaviour                                                          | Registry test                                                                                        | Status     | Notes                                                                            |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `should create` (x5)                                                        | —                                                                                                    | ➖ n/a     |                                                                                  |
| Form facet spacing; icon in a form facet with a link gets a tiny end margin | facet group is a group…(reference spacing); form facet rows space evenly and icons get an end margin | ✅ covered | Measured, not class-checked                                                      |
| Image facet first (`order: -1`), no bottom margin                           | image facets come first (order -1) and have no title                                                 | ✅ covered |                                                                                  |
| Rating-indicator facet and the rating indicator's facet modifier            | rating facet shows the subtitle (review count) under the title                                       | 🟡 partial | Subtitle placement checked; the rating indicator's facet-specific styling is not |
| Key-value facet and its large object status/number                          | key-value facets use the regular font family for large object statuses                               | ✅ covered |                                                                                  |
| `alignEnd`                                                                  | alignEnd pushes the facet to the end in LTR and RTL                                                  | ✅ covered | Also RTL                                                                         |

Registry-only coverage: group and facet accessible names (`role=group`, labelled by title), `headingLevel` heading semantics, facet-container flex options.

### Gaps to fill

- **Stories:** "Custom facet" — custom facets with a product description paragraph and a title + copy-button row using `fd-facet-container` row layout.
- **Tests:** "rating indicator inside a rating facet uses the facet size/alignment" (only if our facet applies any rating-specific styling; otherwise none).
- **Effort:** S, one story.
