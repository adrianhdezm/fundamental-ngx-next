# Parity with @fundamental-ngx/core: stories and tests

This folder compares every component in `registry/ui/` with `@fundamental-ngx/core` in two ways:

1. **Stories vs. upstream examples**: each example on the component's page of the
   [core docs](https://sap.github.io/fundamental-ngx/#/core/home) against our `<name>.stories.ts`.
2. **Tests vs. upstream specs**: the behaviours checked by `libs/core/<name>/**/*.spec.ts` in
   [SAP/fundamental-ngx](https://github.com/SAP/fundamental-ngx/tree/main/libs/core) against our `<name>.spec.ts`.

The first version of this report listed the gaps and a plan to fill them. The plan has since been carried out: this
page shows the result and what is still open. [`components/`](components/) has one file per component, with one row
per upstream example and per upstream behaviour, kept up to date with the stories and specs.

## Method

- **Upstream version:** `SAP/fundamental-ngx` `main` at
  [`3879bc0`](https://github.com/SAP/fundamental-ngx/tree/3879bc03796ed8d72d759e3891e873f20cf4a5ed), October 2026.
- **Examples** come from the docs sources the site is built from: each `<fd-docs-section-title>` in
  `libs/docs/core/<page>/*-docs.component.html` is one example, and the page list is the site navigation in
  `libs/docs/core/docs-data.json`. The live site itself could not be opened from the analysis environment, so it was not
  checked visually.
- **Tests** are grouped into behaviours (roughly one per upstream `describe`, near-duplicate `it`s merged), so the
  counts are behaviours, not `it` blocks.
- **Status:** ✅ covered · 🟡 partial (exists but misses variants, states or assertions) · ❌ missing · ➖ n/a. A
  behaviour is n/a when it has no meaning in this port: "should create", NgModule/DI and zone plumbing,
  fundamental-styles class names checked for their own sake, and APIs the port deliberately dropped. Where a class
  encodes a state (`is-disabled`, toggled, selected), the state is in scope and must be tested through ARIA or the
  token classes.
- **"Open story missing"** means the component has an overlay (popover, menu, dialog, list, tooltip) and no story
  named "Open: …" that opens it, so `pnpm test:a11y` never runs axe on the overlay.
- **Name mapping:** `feed-list` ← `feed-list-item`; `form` ← `form-message` and core `form`; `input` ← the `input` and
  `textarea` pages and the core `form` specs; `list` ← the `list`, `list-byline` and `list-subline` pages; `settings` ←
  `settings-dialog`; `nested-list` has no page of its own, so its examples come from `side-navigation` (they overlap).
- The comparison was done per component by reading both sides' sources. It is a judgement, not a script: treat
  single rows as a starting point and re-check them when you work on a component.

## Status

|                                                   | Before                                 | Now                                                                        |
| ------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Upstream examples covered by a story              | 448 of 626 (72%), 82 missing           | 615 of 628 (98%), 10 missing (all blocked)                                 |
| Upstream behaviours covered by a test             | 416 of 786 in scope (53%), 218 missing | 785 of 792 in scope (99%), 1 missing                                       |
| Components with an overlay but no "Open: …" story | 40                                     | 0 (nested-list's condensed popover is opened in side-navigation's stories) |
| Registry stories / unit tests                     | 439 / 767                              | 650 / 1254                                                                 |

Example and behaviour totals moved slightly because some rows were split or merged while the gaps were filled.

The work landed as Conventional Commits, one per component and kind: `fix(<name>)` for behaviour, `docs(<name>)` for
stories and `test(<name>)` for specs. "Open: …" stories open their overlay in `play` (action-sheet and
vertical-navigation still use an `autoOpen` input), so `pnpm test:a11y` checks every popover, menu, list, dialog, toast
and alert.

## Behaviour fixes

Filling the gaps turned up 56 behaviour bugs or differences from upstream, now fixed, each with a test that fails
without the fix. The ones that change a public API or a default:

| Component                    | Change                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| datetime-picker              | `date` is an input plus a `dateChange` output instead of a model. `dateChange` fires only for a value the user picks or types, not for values written by a form, Cancel, a no-op submit or invalid input. `[(date)]` binds as before; code calling `picker.date.set()` from outside breaks. |
| token                        | `onTokenClick` is `MouseEvent \| KeyboardEvent` and also fires on Enter and Space. `closeClickHandler()` without an event emits nothing. With `externalHiddenCount > 0` the "n more" link only emits `moreClickedEvent`.                                                                    |
| avatar-group                 | The overflow button defaults to a square (was a circle): set `overflowButtonShape="circle"` to keep the old look. Popovers of vertical groups open to the right.                                                                                                                            |
| pagination                   | `itemsPerPage` is normalised as upstream: rounded down, at least 1, 10 when it is not a number. `0` now means one item per page.                                                                                                                                                            |
| skeleton                     | `textLines = 0` renders no lines (was one).                                                                                                                                                                                                                                                 |
| popover                      | Focus is trapped without the CDK focus trap, whose `aria-hidden` focusable anchors failed axe; `PopoverBody.trapFocus` is gone. Options passed only through `[config]` apply, and `[isOpen]="true"` on creation opens.                                                                      |
| date-picker, datetime-picker | The field is described by its value state and message (`aria-describedby`); `DatePickerLabels` has four new state labels.                                                                                                                                                                   |
| toolbar                      | New optional `FD_TOOLBAR_FORCE_OVERFLOW` token, used by dynamic-page to collapse its global actions on small pages.                                                                                                                                                                         |
| nested-list                  | The list in a condensed popover is a `tree` of its own, named by the popover title (`NestedListPopover.heading`).                                                                                                                                                                           |

The other fixes are listed by `git log --grep="^fix("`. Among them: combobox reverting invalid text on Tab and
outside click, menu ignoring `disabled` on ArrowDown, tabs ignoring `defaultTab`, toolbar not re-measuring its
overflow, step-input never emitting `onFocusIn`, dialog's `mobileOuterSpacing` doing nothing, and a dozen popovers and
dialogs without an accessible name.

## Still open

**Blocked** on a feature that is not ported. Each needs a design decision and a `feat` pull request first:

| Blocker                                                                                     | Blocks                                                                                                                          |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Drag and drop (`fd-dnd-list`)                                                               | list and grid-list "Drag and drop"                                                                                              |
| `fd-card-bar`                                                                               | card "Bar Chart List"                                                                                                           |
| `searchResultsList` / `suggestion` in list, suggestions in `fd-shellbar-search`             | list "Search Results", shellbar "complex search results"                                                                        |
| `dataRequested` / `dataReceived` outputs                                                    | multi-combobox "Loading"                                                                                                        |
| Popover `mobile`, `placementContainer`, lazy `fdPopoverBody`, repositioning on layout shift | popover "Mobile Mode", "Positioning & Container", "Lazy Loading", "Dynamic Container Height"; form message `placementContainer` |
| Router in stories (`provideRouter` decorator)                                               | breadcrumb `routerLink`, dynamic-page routing                                                                                   |

**Decisions needed:**

- **Stacked dialogs fail axe** (`landmark-no-duplicate-banner`, `landmark-no-duplicate-contentinfo`): every dialog
  header renders `<header>` and every footer `<footer>`, as upstream does, so two open dialogs duplicate the landmarks.
  Options: render them as `div`s with the same classes, or accept it and keep stacked dialogs out of the a11y run.
- **content-density:** upstream's "a restricting parent wins over a child" is not matched. Our density is CSS-driven
  and the nearest ancestor wins; matching upstream would mean rewriting every `compact:`/`condensed:` variant. A test
  pins the current rule. Invalid density strings are also not validated.
- **datetime-picker:** a typed date rejected by `disableFunction` does not emit `dateChange`. Upstream doesn't check
  `disableFunction` for typed text, so it emits there.

**Kept on purpose**, each pinned by a test and explained in its component file: `aria-haspopup="dialog"` on the date
pickers (the popup is a dialog), the user-menu tab stop resetting only when focus leaves its overlays, menu arrow keys
not wrapping (as upstream), and Tab cycling inside the time-picker columns (as upstream).

**Not yet ported:** object-page, truncate, global-config, theming and the datetime adapters (no Moment adapter).

## Per component

"Before → now" counts are from the first report. Status counts are ✅/🟡/❌(/➖) after the work.

| Component                                                      | Stories | Tests   | Examples ✅/🟡/❌ | Behaviours ✅/🟡/❌/➖ | Remaining                                                                                    |
| -------------------------------------------------------------- | ------- | ------- | ----------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| [action-bar](components/action-bar.md)                         | 3 → 6   | 11 → 12 | 5/0/0             | 1/0/0/3                | —                                                                                            |
| [action-sheet](components/action-sheet.md)                     | 4 → 4   | 8 → 12  | 3/0/0             | 1/0/0/1                | —                                                                                            |
| [avatar](components/avatar.md)                                 | 13 → 13 | 7 → 15  | 12/0/0            | 17/0/0/1               | —                                                                                            |
| [avatar-group](components/avatar-group.md)                     | 3 → 8   | 9 → 19  | 7/0/0             | 9/0/0/2                | —                                                                                            |
| [bar](components/bar.md)                                       | 4 → 5   | 17 → 19 | 10/0/0            | 8/0/0/3                | —                                                                                            |
| [breadcrumb](components/breadcrumb.md)                         | 3 → 4   | 3 → 8   | 3/1/0             | 6/0/0/1                | `routerLink` story (blocked: router in stories)                                              |
| [busy-indicator](components/busy-indicator.md)                 | 6 → 8   | 6 → 9   | 5/0/0             | 13/0/0/2               | —                                                                                            |
| [button](components/button.md)                                 | 8 → 8   | 10 → 11 | 8/0/0             | 13/0/0/2               | —                                                                                            |
| [calendar](components/calendar.md)                             | 5 → 11  | 11 → 24 | 16/0/0            | 19/0/0/2               | —                                                                                            |
| [card](components/card.md)                                     | 6 → 15  | 14 → 16 | 15/1/1            | 7/0/0/2                | Bar Chart List (blocked: `fd-card-bar`); not all 11 standard-card variants shown             |
| [carousel](components/carousel.md)                             | 5 → 5   | 10 → 16 | 12/0/0            | 9/1/0/1                | wrap on over-pan of a looping carousel untested                                              |
| [checkbox](components/checkbox.md)                             | 8 → 8   | 17 → 18 | 7/0/0             | 11/0/0/1               | —                                                                                            |
| [combobox](components/combobox.md)                             | 6 → 13  | 7 → 27  | 18/0/0            | 15/0/0/3               | —                                                                                            |
| [content-density](components/content-density.md)               | 0 → 3   | 5 → 7   | 4/0/0             | 5/1/0/7                | invalid density strings are not validated (decision)                                         |
| [date-picker](components/date-picker.md)                       | 7 → 12  | 12 → 22 | 22/0/0            | 19/1/0/0               | message shown inside the popover by design, not hidden while open                            |
| [datetime-picker](components/datetime-picker.md)               | 5 → 9   | 10 → 22 | 10/0/0            | 14/1/0/1               | invalid temporary date falling back to today untested                                        |
| [dialog](components/dialog.md)                                 | 14 → 22 | 7 → 19  | 15/0/0            | 18/0/0/3               | —                                                                                            |
| [dynamic-page](components/dynamic-page.md)                     | 6 → 10  | 7 → 20  | 7/0/1             | 15/0/0/1               | routing example (blocked: router in stories)                                                 |
| [dynamic-side-content](components/dynamic-side-content.md)     | 3 → 3   | 5 → 5   | 3/0/0             | 4/0/0/2                | —                                                                                            |
| [facets](components/facets.md)                                 | 5 → 6   | 8 → 8   | 5/0/0             | 5/0/0/1                | —                                                                                            |
| [feed-input](components/feed-input.md)                         | 7 → 7   | 3 → 7   | 6/0/0             | 4/0/0/1                | —                                                                                            |
| [feed-list](components/feed-list.md)                           | 5 → 8   | 4 → 8   | 5/0/0             | 8/0/0/1                | —                                                                                            |
| [file-uploader](components/file-uploader.md)                   | 7 → 7   | 6 → 11  | 6/0/0             | 7/0/0/1                | —                                                                                            |
| [fixed-card-layout](components/fixed-card-layout.md)           | 4 → 6   | 13 → 14 | 6/0/0             | 4/0/0/1                | —                                                                                            |
| [flexible-column-layout](components/flexible-column-layout.md) | 3 → 4   | 9 → 11  | 3/0/0             | 8/0/0/1                | —                                                                                            |
| [form](components/form.md)                                     | 3 → 7   | 18 → 25 | 2/0/0             | 13/0/0/3               | —                                                                                            |
| [formatted-text](components/formatted-text.md)                 | 2 → 2   | 4 → 4   | 3/0/0             | 4/0/0/1                | —                                                                                            |
| [generic-tag](components/generic-tag.md)                       | 2 → 2   | 5 → 5   | 1/0/0             | 5/0/0/1                | —                                                                                            |
| [grid-list](components/grid-list.md)                           | 5 → 8   | 6 → 14  | 10/0/1            | 9/0/0/2                | drag and drop (blocked)                                                                      |
| [icon](components/icon.md)                                     | 8 → 8   | 4 → 4   | 5/0/0             | 4/0/0/2                | —                                                                                            |
| [illustrated-message](components/illustrated-message.md)       | 6 → 8   | 3 → 6   | 5/0/0             | 9/0/0/1                | —                                                                                            |
| [infinite-scroll](components/infinite-scroll.md)               | 1 → 1   | 7 → 7   | 1/0/0             | 7/0/0/2                | —                                                                                            |
| [info-label](components/info-label.md)                         | 3 → 3   | 4 → 4   | 1/0/0             | 7/0/0/1                | —                                                                                            |
| [inline-help](components/inline-help.md)                       | 4 → 5   | 10 → 19 | 4/0/0             | 7/0/0/1                | —                                                                                            |
| [input](components/input.md)                                   | 7 → 11  | 9 → 10  | 8/0/0             | 2/0/0/2                | —                                                                                            |
| [input-group](components/input-group.md)                       | 10 → 11 | 7 → 12  | 9/0/0             | 3/0/0/1                | —                                                                                            |
| [layout-grid](components/layout-grid.md)                       | 4 → 4   | 6 → 11  | 8/0/0             | 7/0/0/1                | —                                                                                            |
| [layout-panel](components/layout-panel.md)                     | 1 → 4   | 5 → 5   | 4/0/0             | 7/0/0/1                | —                                                                                            |
| [link](components/link.md)                                     | 6 → 6   | 5 → 6   | 1/0/0             | 4/0/0/1                | —                                                                                            |
| [list](components/list.md)                                     | 5 → 16  | 32 → 37 | 24/0/2            | 9/0/0/4                | drag and drop, search results (blocked)                                                      |
| [menu](components/menu.md)                                     | 13 → 18 | 5 → 24  | 10/0/0            | 19/0/0/4               | —                                                                                            |
| [message-box](components/message-box.md)                       | 10 → 15 | 3 → 15  | 7/0/0             | 13/0/0/3               | —                                                                                            |
| [message-page](components/message-page.md)                     | 4 → 6   | 1 → 3   | 7/0/0             | 5/0/0/2                | —                                                                                            |
| [message-strip](components/message-strip.md)                   | 6 → 8   | 17 → 20 | 7/0/0             | 15/0/0/1               | —                                                                                            |
| [message-toast](components/message-toast.md)                   | 1 → 1   | 3 → 3   | 2/0/0             | 9/0/0/2                | —                                                                                            |
| [micro-process-flow](components/micro-process-flow.md)         | 3 → 4   | 4 → 5   | 7/0/0             | 4/0/0/2                | —                                                                                            |
| [multi-combobox](components/multi-combobox.md)                 | 6 → 15  | 7 → 18  | 10/0/1            | 16/0/0/3               | Loading example (blocked: `dataRequested`/`dataReceived`)                                    |
| [multi-input](components/multi-input.md)                       | 5 → 12  | 7 → 19  | 14/0/0            | 15/0/0/1               | —                                                                                            |
| [nested-list](components/nested-list.md)                       | 0 → 3   | 0 → 5   | 7/0/0             | 11/0/0/3               | —                                                                                            |
| [notification](components/notification.md)                     | 4 → 6   | 3 → 14  | 4/0/0             | 16/0/0/2               | —                                                                                            |
| [object-attribute](components/object-attribute.md)             | 2 → 2   | 7 → 7   | 3/0/0             | 5/0/0/2                | —                                                                                            |
| [object-identifier](components/object-identifier.md)           | 4 → 4   | 10 → 10 | 5/0/0             | 5/0/0/1                | —                                                                                            |
| [object-marker](components/object-marker.md)                   | 2 → 2   | 10 → 11 | 4/0/0             | 9/0/0/1                | —                                                                                            |
| [object-number](components/object-number.md)                   | 4 → 4   | 13 → 13 | 10/0/0            | 8/0/0/1                | —                                                                                            |
| [object-status](components/object-status.md)                   | 5 → 5   | 16 → 17 | 3/0/0             | 9/0/0/1                | —                                                                                            |
| [overflow-layout](components/overflow-layout.md)               | 2 → 7   | 7 → 9   | 3/0/0             | 5/0/0/1                | —                                                                                            |
| [pagination](components/pagination.md)                         | 2 → 3   | 6 → 12  | 5/0/0             | 9/1/0/1                | `itemsPerPage` 0 normalised to 1, as upstream's component                                    |
| [panel](components/panel.md)                                   | 2 → 3   | 5 → 9   | 4/0/0             | 6/0/0/2                | —                                                                                            |
| [popover](components/popover.md)                               | 13 → 26 | 29 → 47 | 16/1/3            | 24/0/1/6               | mobile mode, lazy body, `placementContainer` (blocked); reposition on layout shift (feature) |
| [product-switch](components/product-switch.md)                 | 8 → 12  | 3 → 16  | 7/0/0             | 18/0/0/1               | —                                                                                            |
| [progress-indicator](components/progress-indicator.md)         | 5 → 6   | 4 → 8   | 4/0/0             | 2/0/0/1                | —                                                                                            |
| [quick-view](components/quick-view.md)                         | 3 → 6   | 1 → 5   | 3/0/0             | 5/0/0/2                | —                                                                                            |
| [radio](components/radio.md)                                   | 3 → 4   | 10 → 11 | 3/0/0             | 6/0/0/1                | —                                                                                            |
| [rating-indicator](components/rating-indicator.md)             | 4 → 5   | 6 → 14  | 6/0/0             | 12/0/0/2               | —                                                                                            |
| [resizable-card-layout](components/resizable-card-layout.md)   | 1 → 3   | 12 → 15 | 3/0/0             | 12/0/0/1               | —                                                                                            |
| [scroll-spy](components/scroll-spy.md)                         | 1 → 3   | 10 → 10 | 3/0/0             | 0/0/0/1                | —                                                                                            |
| [scrollbar](components/scrollbar.md)                           | 2 → 2   | 7 → 7   | 3/0/0             | 4/0/0/1                | —                                                                                            |
| [segmented-button](components/segmented-button.md)             | 3 → 5   | 11 → 13 | 4/0/0             | 12/0/0/2               | —                                                                                            |
| [select](components/select.md)                                 | 8 → 12  | 7 → 24  | 10/0/0            | 23/1/0/3               | trigger click while the mobile dialog is open is unreachable                                 |
| [settings](components/settings.md)                             | 3 → 3   | 4 → 8   | 1/0/0             | 7/0/0/4                | —                                                                                            |
| [shellbar](components/shellbar.md)                             | 5 → 12  | 7 → 13  | 6/0/1             | 0/0/0/2                | complex search results (blocked: search suggestions)                                         |
| [side-navigation](components/side-navigation.md)               | 5 → 9   | 6 → 10  | 7/0/0             | 2/0/0/1                | —                                                                                            |
| [skeleton](components/skeleton.md)                             | 3 → 3   | 9 → 12  | 2/0/0             | 7/0/0/1                | —                                                                                            |
| [slider](components/slider.md)                                 | 6 → 7   | 6 → 16  | 10/0/0            | 8/0/0/1                | —                                                                                            |
| [split-button](components/split-button.md)                     | 3 → 5   | 3 → 9   | 5/0/0             | 3/0/0/2                | —                                                                                            |
| [status-indicator](components/status-indicator.md)             | 5 → 5   | 17 → 19 | 9/0/0             | 4/0/0/1                | —                                                                                            |
| [step-input](components/step-input.md)                         | 5 → 5   | 8 → 21  | 7/0/0             | 15/0/0/1               | —                                                                                            |
| [switch](components/switch.md)                                 | 6 → 6   | 11 → 14 | 6/0/0             | 6/0/0/2                | —                                                                                            |
| [tabs](components/tabs.md)                                     | 5 → 9   | 6 → 16  | 13/0/0            | 9/0/0/2                | —                                                                                            |
| [text](components/text.md)                                     | 5 → 5   | 5 → 7   | 5/0/0             | 7/0/0/1                | —                                                                                            |
| [tile](components/tile.md)                                     | 10 → 10 | 14 → 15 | 5/0/0             | 5/0/0/3                | —                                                                                            |
| [time](components/time.md)                                     | 2 → 4   | 8 → 15  | 10/0/0            | 6/0/0/2                | —                                                                                            |
| [time-picker](components/time-picker.md)                       | 3 → 5   | 8 → 16  | 8/0/0             | 10/0/0/1               | —                                                                                            |
| [timeline](components/timeline.md)                             | 7 → 7   | 7 → 10  | 5/0/0             | 8/0/0/3                | —                                                                                            |
| [title](components/title.md)                                   | 4 → 5   | 8 → 9   | 5/0/0             | 5/0/0/1                | —                                                                                            |
| [token](components/token.md)                                   | 4 → 6   | 5 → 18  | 6/0/0             | 13/0/0/3               | —                                                                                            |
| [toolbar](components/toolbar.md)                               | 4 → 8   | 11 → 16 | 7/0/0             | 6/0/0/1                | —                                                                                            |
| [tree](components/tree.md)                                     | 4 → 5   | 8 → 17  | 6/0/0             | 7/0/0/2                | —                                                                                            |
| [upload-collection](components/upload-collection.md)           | 3 → 7   | 5 → 12  | 5/0/0             | 7/0/0/2                | —                                                                                            |
| [user-menu](components/user-menu.md)                           | 5 → 6   | 6 → 15  | 2/0/0             | 8/0/0/2                | —                                                                                            |
| [vertical-navigation](components/vertical-navigation.md)       | 5 → 5   | 5 → 8   | 4/0/0             | 2/0/0/1                | —                                                                                            |
| [wizard](components/wizard.md)                                 | 4 → 10  | 9 → 15  | 8/0/0             | 6/0/0/2                | —                                                                                            |

## Keeping it current

When a pull request adds a story or a test that closes a row, or changes a behaviour listed here, update the matching
rows in [`components/`](components/) in the same pull request. To redo the comparison against a newer upstream, check
out `libs/core` and `libs/docs/core` from SAP/fundamental-ngx and repeat the method above.
