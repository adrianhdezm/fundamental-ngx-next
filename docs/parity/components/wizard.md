## wizard

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/wizard) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/wizard)
Registry: `registry/ui/wizard/` — 5 stories, 9 tests.

### Stories vs. upstream examples

| Upstream example                     | Registry story                                      | Status     | Notes                                                                                                                         |
| ------------------------------------ | --------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Default Wizard                       | Default                                             | ✅ covered | Shown inline with `contentHeight`; upstream opens it full screen                                                              |
| Customizable Wizard                  | CurrentStepOnly ("Current step only")               | 🟡 partial | `appendToWizard=false` covered; no `contentBackground="solid"`, mixed content/progress-bar sizes or compact next-step buttons |
| Mobile Wizard                        | Narrow ("Stacked steps and a footer")               | 🟡 partial | Narrow stacked steps with a footer bar; no `floating-footer` bar or `fd-wizard-next-step [floating]`                          |
| Branching Wizard                     | Branching ("Branching steps and a visible summary") | ✅ covered |                                                                                                                               |
| Dialog Wizard                        | —                                                   | ❌ missing | Wizard in a dialog (`appendToWizard=false`, `displaySummaryStep`); needs an "Open: dialog" story                              |
| Wizard with steps in ngFor           | Narrow                                              | ✅ covered | Steps built with `@for`                                                                                                       |
| Visible summary step in progress bar | Branching                                           | ✅ covered | `displaySummaryStep`                                                                                                          |
| Loading                              | —                                                   | ❌ missing | Skeleton placeholders in steps and content                                                                                    |

The stacked-steps indicator opens an action sheet; "Open: stacked steps" opens it in `play()`.

### Tests vs. upstream specs

| Upstream behaviour                                                                 | Registry test                                                                                             | Status     | Notes                                                       |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| `should create` (wizard, content, navigation, next step, step, indicator, service) | —                                                                                                         | ➖ n/a     |                                                             |
| Step indicator renders the glyph                                                   | —                                                                                                         | ❌ missing | `glyph` input exists; no test of the icon                   |
| Step key press / click emits `stepClicked` when visited                            | goes back to a visited step when it is clicked; moves the focus between visited steps with the arrow keys | ✅ covered | Click and Enter                                             |
| Resize smaller/bigger                                                              | stacks steps that do not fit and lists them in the indicator                                              | 🟡 partial | Stacking when narrow covered; un-stacking when it grows not |
| `setContentTemplates` (step ids, visited, final step)                              | —                                                                                                         | ➖ n/a     | Internal setup; visited outcome covered by the click tests  |
| Status change focuses the first tabbable element of the new step                   | appends the content of the steps as they become current                                                   | ✅ covered |                                                             |
| Scroll spy updates statuses                                                        | makes the step whose content scrolls to the top current                                                   | ✅ covered |                                                             |
| Progress bar hidden at summary, shown otherwise                                    | replaces the steps by the summary                                                                         | ✅ covered |                                                             |

Registry-only coverage: list/region/nav roles and aria-current, `stepClickValidator`, roving focus with arrows between visited steps, `appendToWizard=false`, stacked-step indicator action sheet.

### Gaps to fill

- **Stories:** "Customizable" — solid content background, sm/md sizes, compact next-step buttons; "Mobile" — floating-footer bar with a floating next-step button; "Open: dialog" — `play` opens a dialog with a wizard and a visible summary step; "Loading" — skeleton step labels and content.
- **Tests:** "the step indicator shows its glyph"; "stacked steps get their labels back when the wizard grows"; "displaySummaryStep keeps the summary in the progress bar"; "branching step draws the branching connector"; "floating next step stays above the footer"; "arrow keys between steps are mirrored in RTL".
- **Effort:** M, five stories (two with overlays) and six tests.
