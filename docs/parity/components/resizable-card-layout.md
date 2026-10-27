## resizable-card-layout

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/resizable-card-layout) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/resizable-card-layout)
Registry: `registry/ui/resizable-card-layout/` — 1 story, 12 tests.

### Stories vs. upstream examples

| Upstream example                          | Registry story                | Status     | Notes                                                                                                                                                                                                                         |
| ----------------------------------------- | ----------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resizable Card Layout                     | `Default` ("Resizable cards") | 🟡 partial | Cards, a non-resizable card and resize status are shown, but via `[config]` objects; upstream binds the item inputs (`rank`, `cardWidthColSpan`, `cardHeightRowSpan`, mini spans) and grows the card content on `stepChange`. |
| Resizable Card Layout using Layout config | —                             | ❌ missing | `layoutConfig` input exists on `ResizableCardLayout` but no story uses it.                                                                                                                                                    |
| Resizable Card Layout using Item config   | `Default`                     | ✅ covered | Same `[config]` per item approach.                                                                                                                                                                                            |

### Tests vs. upstream specs

| Upstream behaviour                                 | Registry test                                                     | Status     | Notes                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Should create (item, layout)                       | —                                                                 | ➖ n/a     |                                                                               |
| Width grows/shrinks in 20rem columns               | dragging the right edge/corner snaps the width …                  | ✅ covered | Grow and shrink (corner drag back to 1 column).                               |
| Height grows/shrinks in 1rem rows                  | dragging the bottom edge snaps the height …                       | ✅ covered |                                                                               |
| Emits resized when resizing completes              | dragging the right edge/corner …                                  | ✅ covered | Also checks stepChange and the event payload.                                 |
| Reverts width when the offset is not reached       | dragging the right edge/corner …                                  | ✅ covered | "less than half a column: back to one column".                                |
| Reverts height when the offset is not reached      | dragging the bottom edge …                                        | ✅ covered | Row rounding (5px down, 13px up).                                             |
| Max card width per layout size (sm/md/lg/xl)       | layout size from the available width …; card widths are limited … | ✅ covered |                                                                               |
| Cards are placed in the layout                     | cards are placed by rank …                                        | ✅ covered |                                                                               |
| Relayout after a card's width and/or height change | growing a card past half a column …; dragging the bottom edge …   | ✅ covered |                                                                               |
| Width not above the layout capacity                | card widths are limited to the columns …                          | ✅ covered |                                                                               |
| Width not below one column                         | —                                                                 | 🟡 partial | Shrinking 2 → 1 column is tested; dragging a one-column card narrower is not. |

Registry-only coverage: focusable groups named by title, arrow-key focus between cards, dashed frame and next-column indication, rank restore when shrinking back, RTL mirroring, `resizable=false`, mini header/content events, `layoutChange`.

### Gaps to fill

- **Stories:** `Layout config` — the same cards driven by `layoutConfig` on `fd-resizable-card-layout`; `Item inputs` — cards bound with `rank`/`cardWidthColSpan`/`cardHeightRowSpan`/mini spans whose list shows more rows on `stepChange`.
- **Tests:** "a one-column card dragged left stays one column wide"; "layoutConfig assigns rank and spans to the cards in order" (no test binds `layoutConfig` today); "item inputs (rank, cardWidthColSpan, cardHeightRowSpan) place and size a card like config".
- **Effort:** S — tests are already thorough; two stories and three focused tests reusing the existing host.
