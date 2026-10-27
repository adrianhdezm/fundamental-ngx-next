## quick-view

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/quick-view) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/quick-view)
Registry: `registry/ui/quick-view/` — 3 stories, 2 tests.

### Stories vs. upstream examples

| Upstream example      | Registry story                          | Status     | Notes                                                                                                                                                              |
| --------------------- | --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Basic Quick View      | `Default` ("Quick view"), `WithTitle`   | ✅ covered | Subheader with avatar, two groups, tel/mailto links; `WithTitle` adds the header bar.                                                                              |
| Quick View in Popover | `Overlays` ("In a popover or a dialog") | 🟡 partial | Popover with a titled quick view exists, but no "Open: …" play story; upstream's long-text `allowWrap` variant and second "without heading" popover are not shown. |
| Quick View in Dialog  | `Overlays`                              | 🟡 partial | Dialog opened by a button; no "Open: …" play story, so axe never checks the dialog content.                                                                        |

### Tests vs. upstream specs

| Upstream behaviour                                           | Registry test                                | Status     | Notes                                                                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every part "should create" (11 specs)                        | —                                            | ➖ n/a     |                                                                                                                                                                           |
| QuickView assigns its id                                     | —                                            | ❌ missing | `id` input exists (`quick-view.ts`), rendered on the inner div; untested.                                                                                                 |
| Group title: id on the header text and header labelled by it | names each group by its title                | ✅ covered | The title's generated `id` names the group: `QuickViewGroup` sets `aria-labelledby` on its `role="group"` (upstream leaves this to the app, its example sets it by hand). |
| Group item label/content-element link label and value        | labels each value with its label …           | ✅ covered | `aria-labelledby` = label id + value id resolves to "Email ann@example.com".                                                                                              |
| Subheader title as fd-title                                  | labels each value … marks titles as headings | ✅ covered | Checked as heading with aria-level 5.                                                                                                                                     |
| Quick view title: header bar, section, element, shows text   | —                                            | ❌ missing | Bar classes are n/a, but "title shows in the header bar, aligned by `align`" is untested.                                                                                 |
| fd-form-item / fd-bar / fd-bar-left class assignments        | —                                            | ➖ n/a     | Pure class-name checks.                                                                                                                                                   |

Registry-only coverage: none beyond the above.

### Gaps to fill

- **Stories:** `Open: In a popover` (play clicks "Open in a popover"), `Open: In a dialog` (play clicks "Open in a dialog"), split from `Overlays`; `Long texts` showing `allowWrap` on subheader title/subtitle, group title and labels.
- **Tests:** "renders the id on the quick view"; "shows the title in a header bar on the left, middle or right by align"; "allowWrap wraps the titles and labels instead of truncating".
- **Effort:** S — small static host; the group-naming fix may need a few lines in the source.
