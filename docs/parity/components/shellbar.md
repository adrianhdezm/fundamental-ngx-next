## shellbar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/shellbar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/shellbar)
Registry: `registry/ui/shellbar/` — 11 stories, 8 tests.

### Stories vs. upstream examples

| Upstream example                                 | Registry story                                                                    | Status     | Notes                                                                                                                                                                                                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How it works                                     | —                                                                                 | ➖ n/a     | Description only, no example (not counted).                                                                                                                                                                                                         |
| Basic                                            | `Basic`                                                                           | ✅ covered | Branding, search, actions with counts, user menu, product switch, navigation/back buttons.                                                                                                                                                          |
| Links with collapsible menu and product switcher | `CollapsibleLinks` ("Collapsible links"), `Basic`, `ProductMenuAndSimpleUserMenu` | ✅ covered | Product menu, actions, `[user]`/`[userMenu]` and the product switch together at xl/l/m/s; the switch shows a list (`forceListMode`) at size `s`.                                                                                                    |
| Responsive Shellbar                              | `Responsive` ("Responsive sizes")                                                 | ✅ covered | xl/l/m/s widths.                                                                                                                                                                                                                                    |
| Shellbar with Growing groups                     | `GrowingGroups` ("Growing groups")                                                | ✅ covered | `[groupFlex]` with `shrink` and `flexBasisAuto` on the product and actions groups.                                                                                                                                                                  |
| Shellbar with branding and context area          | `ContextArea` ("Context area")                                                    | ✅ covered | Context area with hide priorities, menu, status, switch, and toggled actions (`fdType` + `[toggled]`).                                                                                                                                              |
| Context Area Overflow                            | `ContextAreaOverflow` ("Context area overflow")                                   | ✅ covered | Narrow width hides items; an overflow button (priority 0) opens a popover listing the hidden items from `contentItemVisibilityChange`. Upstream clones the hidden elements into the popover; the story lists their names, so no ids are duplicated. |
| Shellbar with complex search results             | —                                                                                 | ❌ missing | Our `fd-shellbar-search` has no suggestions/suggestion footer/loading inputs: feature not ported, so this needs source work first.                                                                                                                  |

"Open: user menu", "Open: product switch", "Open: product menu" and "Open: simple user menu" open them in `play`. No story opens the actions overflow menu: opened, the action sheet's CDK focus-trap anchors (`aria-hidden` with `tabindex="0"`) fail axe `aria-hidden-focus`, which needs a fix in action-sheet/popover first.

### Tests vs. upstream specs

| Upstream behaviour                                                                                            | Registry test | Status | Notes                                                      |
| ------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ---------------------------------------------------------- |
| Should create (shellbar, actions, action, logo, title, subtitle, product menu, user menu, side-nav directive) | —             | ➖ n/a |                                                            |
| Applies modifier classes (shellbar, actions)                                                                  | —             | ➖ n/a | Class-name checks; size is tested via `data-size` instead. |

Registry-only coverage: size from width, search placement and opening per size, action names with notification counts and callbacks, keyboard-reachable interactive branding, actions overflow menu, small-screen search takeover, context-area hide priority, `contentItemVisibilityChange` with the hidden items and an empty list once they fit again.

### Gaps to fill

- **Stories:** `Open: Overflow menu` once the action sheet passes `aria-hidden-focus` when open. Complex search results only after porting suggestions.
- **Tests:** "a toggled action exposes aria-pressed"; "groupFlex lets a group shrink so the others grow"; "the product menu opens and runs the callback of a selected item"; "the user menu built from [user] and [userMenu] opens and runs callbacks"; "the navigation and back buttons emit their events".
- **Effort:** M — several composite stories and overlay tests; complex search would be L (feature missing).
