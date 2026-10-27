## settings

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/settings-dialog) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/settings)
Registry: `registry/ui/settings/` — 3 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example              | Registry story                                                | Status     | Notes                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings Dialog Standard List | `Dialog_` ("Dialog"), `Inline`, `OpenDialog` ("Open: dialog") | ✅ covered | Profile card, list with bylines, content with spacing sizes, pushed detail view; "Open: dialog" clicks "Open settings" in `play`. Upstream also ships a byline-only example file that its docs page does not render (not counted). |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                   | Registry test                                  | Status     | Notes                                              |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- | -------------------------------------------------- |
| Should create (all parts)                                                                                            | —                                              | ➖ n/a     |                                                    |
| Class assignment on container, content container, detail/list areas, dialog body/content, header, profile card parts | —                                              | ➖ n/a     | Pure class-name checks.                            |
| Content `noPadding` / `noBackground` modifiers                                                                       | —                                              | ➖ n/a     | Cosmetic modifiers.                                |
| Spacing has role presentation and aria-hidden                                                                        | spacing is hidden from assistive technology    | ✅ covered |                                                    |
| Spacing size modifiers (small/medium/large/form)                                                                     | —                                              | ➖ n/a     | Class-name checks.                                 |
| No stacked view initially                                                                                            | shows the list and the view … side by side     | ✅ covered | No back button.                                    |
| Pushes a view and renders its template                                                                               | pushes further views with a back button        | ✅ covered |                                                    |
| Stacks multiple views                                                                                                | two pushed views go back one at a time         | ✅ covered |                                                    |
| Pops a view; back button shown and works                                                                             | pushes further views with a back button        | ✅ covered | Also checks focus moves to the back button.        |
| Clears all stacked views                                                                                             | selecting another item clears the pushed views | ✅ covered | Through `select()`, which runs `clearViewStack()`. |
| Popping an empty stack does nothing                                                                                  | popView on an empty stack keeps the item view  | ✅ covered |                                                    |

Registry-only coverage: large vs. medium layouts (list and view side by side vs. replaced), selection moving on click, focus returning to the list item on back in medium layout.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** done.
