## shellbar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/shellbar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/shellbar)
Registry: `registry/ui/shellbar/` — 12 stories, 13 tests.

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

"Open: user menu", "Open: product switch", "Open: product menu", "Open: simple user menu" and "Open: overflow menu" open them in `play`; the overflow story narrows the shellbar to 340px so the actions collapse into the action sheet, which passes axe now that the popover focus-trap fix has landed.

### Tests vs. upstream specs

| Upstream behaviour                                                                                            | Registry test | Status | Notes                                                      |
| ------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ---------------------------------------------------------- |
| Should create (shellbar, actions, action, logo, title, subtitle, product menu, user menu, side-nav directive) | —             | ➖ n/a |                                                            |
| Applies modifier classes (shellbar, actions)                                                                  | —             | ➖ n/a | Class-name checks; size is tested via `data-size` instead. |

Registry-only coverage: size from width, search placement and opening per size, action names with notification counts and callbacks, keyboard-reachable interactive branding, actions overflow menu, small-screen search takeover, context-area hide priority, `contentItemVisibilityChange` with the hidden items and an empty list once they fit again, `aria-pressed` on toggled actions, `groupFlex` shrinking a group to its content, the product menu and the simple user menu (`[user]`/`[userMenu]`) opening and running item callbacks, navigation and back button events.

### Gaps to fill

- **Stories:** complex search results only after porting suggestions.
- **Tests:** none.
- **Effort:** complex search is L (feature missing).
