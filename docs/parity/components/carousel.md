## carousel

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/carousel) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/carousel)
Registry: `registry/ui/carousel/` — 5 stories, 16 tests.

### Stories vs. upstream examples

| Upstream example                             | Registry story                               | Status     | Notes                                                                          |
| -------------------------------------------- | -------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| Carousel with one active item                | Basic                                        | ✅ covered | Also a numeric indicator for many slides                                       |
| Carousel with vertical direction             | Navigation ("Navigation, vertical and loop") | ✅ covered |                                                                                |
| Carousel with multiple active item           | MultipleSlides ("Several slides at once")    | ✅ covered | Two cards at a time                                                            |
| Carousel with dynamic items                  | MultipleSlides                               | ✅ covered | Add/remove card buttons (upstream toggles three cards with a segmented button) |
| Carousel with no page indicator              | Navigation                                   | ✅ covered |                                                                                |
| Carousel with hidden navigation buttons      | Navigation                                   | ✅ covered |                                                                                |
| Carousel with navigation inside content area | Navigation ("Buttons over the slides …")     | ✅ covered |                                                                                |
| Carousel with looped navigation              | Navigation ("Looped")                        | ✅ covered |                                                                                |
| Carousel error message … Message Page …      | States ("Loading and error")                 | ✅ covered |                                                                                |
| Carousel item loading indicator              | States                                       | ✅ covered |                                                                                |
| Automatic slides count                       | MultipleSlides ("As many as fit …")          | ✅ covered |                                                                                |
| Background modifiers                         | Backgrounds                                  | ✅ covered |                                                                                |

### Tests vs. upstream specs

| Upstream behaviour                                                                                                             | Registry test                                                                                                                      | Status     | Notes                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Background config (content, page indicator, no border)                                                                         | contentBackground, pageIndicatorBackground and noPaginationContainerBorder apply their tokens                                      | ✅ covered | Every option of both backgrounds, border removed                                                                         |
| Vertical carousel uses up/down navigation icons                                                                                | a vertical carousel shows up and down navigation icons                                                                             | ✅ covered |                                                                                                                          |
| Renders all items                                                                                                              | is a listbox of slides with page indicators                                                                                        | ✅ covered |                                                                                                                          |
| `visibleSlidesCount` changes at runtime                                                                                        | shows several slides at once; changing visibleSlidesCount re-pages the slides                                                      | ✅ covered | Fixed: a larger count now keeps the shown slides in range, and a new count emits `slideChange` with `None` like upstream |
| Default carousel: previous disabled, next enabled                                                                              | is a listbox of slides …; moves with the buttons …                                                                                 | ✅ covered |                                                                                                                          |
| Slide visibility and ARIA after navigation (`visibility`, `aria-hidden`, `aria-selected`, active ids, `aria-activedescendant`) | is a listbox of slides …; moves with the buttons …; aria-activedescendant and aria-hidden follow the active slide after navigating | ✅ covered | Includes the hidden slides' visibility                                                                                   |
| Multiple active items: button states at both ends, visible range, active ids                                                   | shows several slides at once                                                                                                       | ✅ covered |                                                                                                                          |
| Looping: both buttons enabled                                                                                                  | wraps around with loop                                                                                                             | ✅ covered |                                                                                                                          |
| Directive, horizontal: pan start/move, snap to closest at half, wrap first/last when panned past the list                      | slides by dragging; releasing a drag before half a slide snaps back                                                                | 🟡 partial | Wrap on over-pan of a looping carousel is not tested                                                                     |
| Directive, vertical: translate, middle at the end, pan end, wrap                                                               | keeps the active item in the middle when infinite; dragging a vertical carousel moves to the next slide                            | ✅ covered |                                                                                                                          |
| `should create`                                                                                                                | —                                                                                                                                  | ➖ n/a     |                                                                                                                          |

Registry-only coverage: live region "Displaying item n of N", indicator `aria-label`s, numeric indicator above eight slides, `slideChange` direction, reset to the first slide when the slides change, Up/Down ignored by a horizontal carousel.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, six focused tests on existing hosts.
