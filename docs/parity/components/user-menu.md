## user-menu

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/user-menu) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/user-menu)
Registry: `registry/ui/user-menu/` — 6 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example       | Registry story                                                                                                 | Status     | Notes                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User Menu Default Mode | Default, OpenDesktop ("Open: desktop"), OpenLong ("Open: long name, scrolling"), OpenSubmenu ("Open: submenu") | ✅ covered | Avatar control, header content area, panel, message strip, list, sublists with icons, footer. The header avatar shows the photo instead of upstream's initials (an edit button showing "LM" fails axe label-content-name-mismatch). Open stories open in `play` |
| User Menu Mobile Mode  | Mobile, OpenMobile ("Open: mobile")                                                                            | ✅ covered |                                                                                                                                                                                                                                                                 |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                                                                 | Registry test                                                | Status     | Notes                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------- |
| `should create` / host classes (body, content container, header, header container, sublist modifier, subline/user-name base class, header content area projection) | —                                                            | ➖ n/a     | Class/projection only                                                                  |
| Body focus management: reset list focus when focus leaves the menu, not when it moves within, null relatedTarget                                                   | —                                                            | ❌ missing | Our lists handle `focusout`; no test that the tab stop resets to the first item        |
| Body stops click propagation                                                                                                                                       | keeps clicks inside the body from bubbling out of the menu   | ✅ covered | The port now stops it too; outside clicks are detected by the CDK in the capture phase |
| Control: Enter/Space emit click, other keys do not, event bubbles                                                                                                  | moves between items with the arrow keys … (opens with Enter) | 🟡 partial | Enter covered; Space and "other keys do nothing" untested                              |
| Control: click emits                                                                                                                                               | opens from the control in a popover …                        | ✅ covered |                                                                                        |
| Control: focusable with tabindex 0, `focus()`                                                                                                                      | closes with Escape and returns the focus to the control      | 🟡 partial | Focus return covered; tabindex not asserted                                            |
| Subline / user name `truncate` input                                                                                                                               | —                                                            | ❌ missing | Inputs exist (truncate, wrap); default two-line clamp vs one line untested             |
| Initial focus on first list item (desktop), not in mobile                                                                                                          | opens from the control … and focuses the first item          | ✅ covered | Mobile initial focus not asserted                                                      |
| Focus reset on close: list focus reset, focus back to control                                                                                                      | closes with Escape and returns the focus to the control      | 🟡 partial | Control focus covered; reopening starts on the first item not tested                   |
| `resetListFocus` util                                                                                                                                              | —                                                            | ➖ n/a     | Internal helper; outcome belongs to the focus-reset rows                               |

Registry-only coverage: roving tab stop with Up/Down/Home/End, submenu Right/Left and hover, mobile dialog with in-place submenus, Go back and Close, popover labelled by the user name.

### Gaps to fill

- **Stories:** none.
- **Tests:** "opens with Space and ignores other keys on the control"; "the control is a focusable button (tabindex 0, aria-haspopup dialog)"; "reopening after moving the focus starts on the first item"; "tabbing out of the menu resets the tab stop to the first item"; "user name clamps to two lines, truncate keeps one line"; "subline truncates only with truncate"; "submenu arrows are mirrored in RTL"; "mobile mode focuses the first item when it opens".
- **Effort:** S, tests only, all on the existing host.
