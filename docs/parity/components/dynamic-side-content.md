## dynamic-side-content

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/dynamic-side-content) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/dynamic-side-content)
Registry: `registry/ui/dynamic-side-content/` — 3 stories, 5 tests.

### Stories vs. upstream examples

| Upstream example | Registry story            | Status     | Notes                                              |
| ---------------- | ------------------------- | ---------- | -------------------------------------------------- |
| Basic usage      | Basic ("Projected order") | ✅ covered | Main-first and side-first projection               |
| Positioning      | Positioning ("Positions") | ✅ covered | left, right, bottom, equalSplit                    |
| Responsiveness   | Sizes                     | ✅ covered | sm (hidden), md, xl — same three sizes as upstream |

### Tests vs. upstream specs

| Upstream behaviour                                                                | Registry test                                                                           | Status     | Notes                        |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- | ---------------------------- |
| `should create` (container, main, side)                                           | —                                                                                       | ➖ n/a     |                              |
| BEM host classes on main, side and container                                      | —                                                                                       | ➖ n/a     | Class-only                   |
| Position modifiers (equalSplit, bottom)                                           | bottom stacks vertically with full widths; equalSplit gives 50% each                    | ✅ covered | Asserts real widths/stacking |
| Size modifier                                                                     | size sm hides the side content; md/lg give main 66.666%; xl 75%                         | ✅ covered |                              |
| Projected content rendered                                                        | position none/equalSplit keeps the projected order                                      | ✅ covered |                              |
| Side content placed by projection or by `position` (left/right/bottom/equalSplit) | position left/right/bottom renders…; position none/equalSplit keeps the projected order | ✅ covered |                              |

Registry-only coverage: moving the side content when `position` changes at runtime; measured widths per size.

### Gaps to fill

- **Stories:** none.
- **Tests:** none (optionally "side content is not exposed to assistive tech when hidden at size sm").
- **Effort:** S, nothing required.
