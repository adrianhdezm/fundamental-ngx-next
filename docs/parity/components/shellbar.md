## shellbar

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/shellbar) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/shellbar)
Registry: `registry/ui/shellbar/` — 9 stories, 7 tests.

### Stories vs. upstream examples

| Upstream example                                 | Registry story                                  | Status     | Notes                                                                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How it works                                     | —                                               | ➖ n/a     | Description only, no example (not counted).                                                                                                                                |
| Basic                                            | `Basic`                                         | ✅ covered | Branding, search, actions with counts, user menu, product switch, navigation/back buttons.                                                                                 |
| Links with collapsible menu and product switcher | `Basic`, `ProductMenuAndSimpleUserMenu`         | 🟡 partial | Product menu, product switch and `[user]`/`[userMenu]` are shown, but not together and not collapsing at size `s`; product switch `forceListMode` on small size not shown. |
| Responsive Shellbar                              | `Responsive` ("Responsive sizes")               | ✅ covered | xl/l/m/s widths.                                                                                                                                                           |
| Shellbar with Growing groups                     | —                                               | ❌ missing | `groupFlex` input exists (`shellbar.ts`) but no story uses it.                                                                                                             |
| Shellbar with branding and context area          | `ContextArea` ("Context area")                  | 🟡 partial | Context area with hide priorities, menu, status, switch; upstream's toggled actions (`fdType` + `[toggled]`) are not shown.                                                |
| Context Area Overflow                            | `ContextAreaOverflow` ("Context area overflow") | 🟡 partial | Narrow width hides items and counts them; upstream's overflow button + popover listing the hidden items is missing.                                                        |
| Shellbar with complex search results             | —                                               | ❌ missing | Our `fd-shellbar-search` has no suggestions/suggestion footer/loading inputs: feature not ported, so this needs source work first.                                         |

"Open: user menu", "Open: product switch", "Open: product menu" and "Open: simple user menu" open them in `play`. No story opens the actions overflow menu: opened, the action sheet's CDK focus-trap anchors (`aria-hidden` with `tabindex="0"`) fail axe `aria-hidden-focus`, which needs a fix in action-sheet/popover first.

### Tests vs. upstream specs

| Upstream behaviour                                                                                            | Registry test | Status | Notes                                                      |
| ------------------------------------------------------------------------------------------------------------- | ------------- | ------ | ---------------------------------------------------------- |
| Should create (shellbar, actions, action, logo, title, subtitle, product menu, user menu, side-nav directive) | —             | ➖ n/a |                                                            |
| Applies modifier classes (shellbar, actions)                                                                  | —             | ➖ n/a | Class-name checks; size is tested via `data-size` instead. |

Registry-only coverage: size from width, search placement and opening per size, action names with notification counts and callbacks, keyboard-reachable interactive branding, actions overflow menu, small-screen search takeover, context-area hide priority.

### Gaps to fill

- **Stories:** `Growing groups` (`[groupFlex]` letting the actions group grow); `Toggled actions` (actions with `fdType` + `[toggled]`, added to `ContextArea`); extend `ContextAreaOverflow` with an overflow button + popover of hidden items; `Collapsible links` (product menu + product switch + user at size `s`); `Open: Overflow menu` once the action sheet passes `aria-hidden-focus` when open. Complex search results only after porting suggestions.
- **Tests:** "a toggled action exposes aria-pressed"; "groupFlex lets a group shrink so the others grow"; "the product menu opens and runs the callback of a selected item"; "the user menu built from [user] and [userMenu] opens and runs callbacks"; "the navigation and back buttons emit their events"; "contentItemVisibilityChange emits the hidden items and restores them when space returns".
- **Effort:** M — several composite stories and overlay tests; complex search would be L (feature missing).
