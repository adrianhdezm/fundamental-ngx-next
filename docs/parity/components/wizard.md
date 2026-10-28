## wizard

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/wizard) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/wizard)
Registry: `registry/ui/wizard/` — 10 stories, 15 tests.

### Stories vs. upstream examples

| Upstream example                     | Registry story                                                            | Status     | Notes                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default Wizard                       | Default                                                                   | ✅ covered | Shown inline with `contentHeight`; upstream opens it full screen                                                                                                |
| Customizable Wizard                  | Customizable; CurrentStepOnly ("Current step only")                       | ✅ covered | `appendToWizard=false`, solid content background on the first step, sm progress bar with md content, compact next-step buttons, footer bar                      |
| Mobile Wizard                        | Mobile ("Mobile, floating footer"); Narrow ("Stacked steps and a footer") | ✅ covered | Small wizard with a `floating-footer` bar and `fd-wizard-next-step floating`; narrow stacked steps with a footer bar                                            |
| Branching Wizard                     | Branching ("Branching steps and a visible summary")                       | ✅ covered |                                                                                                                                                                 |
| Dialog Wizard                        | InDialog ("In a dialog"); Open: dialog                                    | ✅ covered | Wizard in a dialog (`appendToWizard=false`, `displaySummaryStep`), Previous/Next/Review/Finish/Cancel in the dialog footer; the Open story opens it in `play()` |
| Wizard with steps in ngFor           | Narrow                                                                    | ✅ covered | Steps built with `@for`                                                                                                                                         |
| Visible summary step in progress bar | Branching                                                                 | ✅ covered | `displaySummaryStep`                                                                                                                                            |
| Loading                              | Loading                                                                   | ✅ covered | Skeleton indicators and content, footer bar                                                                                                                     |

The stacked-steps indicator opens an action sheet; "Open: stacked steps" opens it in `play()`.

### Tests vs. upstream specs

| Upstream behaviour                                                                 | Registry test                                                                                             | Status     | Notes                                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| `should create` (wizard, content, navigation, next step, step, indicator, service) | —                                                                                                         | ➖ n/a     |                                                            |
| Step indicator renders the glyph                                                   | shows the glyph of a step indicator                                                                       | ✅ covered |                                                            |
| Step key press / click emits `stepClicked` when visited                            | goes back to a visited step when it is clicked; moves the focus between visited steps with the arrow keys | ✅ covered | Click and Enter                                            |
| Resize smaller/bigger                                                              | stacks steps that do not fit…; gives stacked steps their labels back when the wizard grows                | ✅ covered |                                                            |
| `setContentTemplates` (step ids, visited, final step)                              | —                                                                                                         | ➖ n/a     | Internal setup; visited outcome covered by the click tests |
| Status change focuses the first tabbable element of the new step                   | appends the content of the steps as they become current                                                   | ✅ covered |                                                            |
| Scroll spy updates statuses                                                        | makes the step whose content scrolls to the top current                                                   | ✅ covered |                                                            |
| Progress bar hidden at summary, shown otherwise                                    | replaces the steps by the summary                                                                         | ✅ covered |                                                            |

Registry-only coverage: list/region/nav roles and aria-current, `stepClickValidator`, roving focus with arrows between visited steps, `appendToWizard=false`, stacked-step indicator action sheet, `displaySummaryStep` keeping the summary in the progress bar, the dashed connector of a branching step, a floating next step above the floating footer, arrow keys mirrored in RTL.

### Gaps to fill

- None left.
