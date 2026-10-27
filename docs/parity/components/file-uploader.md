## file-uploader

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/file-uploader) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/file-uploader)
Registry: `registry/ui/file-uploader/` — 7 stories, 11 tests.

### Stories vs. upstream examples

| Upstream example                 | Registry story                           | Status     | Notes                                                        |
| -------------------------------- | ---------------------------------------- | ---------- | ------------------------------------------------------------ |
| Simple File Upload               | Default                                  | ✅ covered | `accept`, required, valid/rejected lists                     |
| Disabled File Upload             | Disabled, DragDisabled ("Drop disabled") | ✅ covered | Upstream example file is the drag-disabled one; we show both |
| File Uploader Truncation example | Truncation                               | ✅ covered | Fixed `width` with a long placeholder                        |
| Invalid File Upload              | States, Default                          | ✅ covered | Value states plus rejected files                             |
| Min File Size                    | SizeLimits ("Size limits")               | ✅ covered | `minFileSize="1 KB"`                                         |
| Max File Size                    | SizeLimits ("Size limits")               | ✅ covered | `maxFileSize="20 KB"`                                        |

### Tests vs. upstream specs

| Upstream behaviour                                           | Registry test                                                                           | Status     | Notes                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| `should create`                                              | —                                                                                       | ➖ n/a     |                                                                 |
| Service: max size and extension validation                   | splits files by size and extension                                                      | ✅ covered | Also `parseFileSize` units                                      |
| Service: min size, alone and combined with max (+ extension) | rejects files below minFileSize, alone and between min and max with an extension filter | ✅ covered |                                                                 |
| Form `setDisabledState`                                      | disables the field and the button when the form control is disabled                     | ✅ covered | Reactive `FormControl`; the dialog does not open while disabled |
| Selection handling reports valid and invalid files           | shows chosen files and reports the valid ones to the form                               | ✅ covered | With `maxFileSize`; also drop                                   |
| Opens the file dialog                                        | opens the file dialog from the field with Enter and ignores typing                      | ✅ covered |                                                                 |
| Clear, and clear when the form value is set to empty         | clears the files from the form and with clear()                                         | ✅ covered |                                                                 |
| Width management / truncation                                | fixes the field to the given width and truncates long names                             | ✅ covered | Field keeps the width, ellipsis, full name in `title`           |

Registry-only coverage: drop handling, Enter on the field opens the dialog and typing is ignored, focus stays on the field after choosing, `fileLimit` rejecting a larger selection, `onDragEnter`/`onDragLeave` emitted once across children.

### Gaps to fill

- None.
