## upload-collection

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/upload-collection) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/upload-collection)
Registry: `registry/ui/upload-collection/` — 7 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                    | Registry story                     | Status     | Notes                                                                                                                                                                                                                                    |
| ----------------------------------- | ---------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload Collection                   | Default                            | ✅ covered | Thumbnail, link title, marker, descriptions, statuses, edit/delete                                                                                                                                                                       |
| Upload Collection - Small Mode      | Small                              | ✅ covered |                                                                                                                                                                                                                                          |
| Upload Collection - Customization   | Customization                      | ✅ covered | Default buttons, both disabled, rename only, no buttons                                                                                                                                                                                  |
| Upload Collection - Complex Example | Complex; Open: delete confirmation | ✅ covered | Toolbar with the count, a file uploader, Download and Delete Multiple for the selection, checkboxes (`selection`; items keep `role="listitem"` since they hold buttons), delete confirmation dialog opened in `play()` by the Open story |
| Upload Collection - No Data         | Empty; No data                     | ✅ covered | No-data list item, and upstream's message page (glyph, title, subtitle)                                                                                                                                                                  |

### Tests vs. upstream specs

| Upstream behaviour                                           | Registry test                                                | Status     | Notes                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------- |
| `should create` (collection, item, button group, form item)  | —                                                            | ➖ n/a     |                                                                            |
| Item host class                                              | —                                                            | ➖ n/a     | Class only                                                                 |
| Button group emits edit/delete/ok                            | renames a file in place; deletes a file                      | ✅ covered | Through real clicks; Cancel button click not exercised (Escape is)         |
| Form item `writeValue`                                       | renames a file in place                                      | 🟡 partial | Field shows the current name on edit; CVA use with a form control untested |
| Title shows fileName + extension                             | is a list of files with their names and extensions           | ✅ covered |                                                                            |
| Delete subscription emits `deleteClicked`                    | deletes a file                                               | ✅ covered |                                                                            |
| Ok: title back, fileName updated, edit mode ends             | renames a file in place                                      | ✅ covered | Also focus returns to Edit and Ok disabled when empty                      |
| Edit: edit mode, title hidden, form item gets name/extension | renames a file in place                                      | ✅ covered | Title hiding not asserted directly                                         |
| XSS: file name and rename not parsed as HTML                 | renders a file name with markup as text, also after a rename | ✅ covered | Title set with `textContent`                                               |

Registry-only coverage: middle truncation keeping the extension (+ full name in `title`), Escape cancels a rename, focus handling after rename, small mode wrapping the buttons below the file (also without a thumbnail).

### Gaps to fill

- **Tests:** "allowFileNameEdit and allowFileDeletion hide the buttons"; "disableFileNameEdit and disableFileDeletion disable them"; "Cancel discards a rename"; "the form item works as a form control"; "selection marks items as selected".
- **Effort:** M, the complex story pulls in toolbar, file uploader and dialog; tests are small.
