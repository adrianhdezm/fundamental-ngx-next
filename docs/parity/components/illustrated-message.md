## illustrated-message

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/illustrated-message) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/illustrated-message)
Registry: `registry/ui/illustrated-message/` — 8 stories, 3 tests.

### Stories vs. upstream examples

| Upstream example | Registry story                                          | Status     | Notes                                                                                                                                                            |
| ---------------- | ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Large            | `Scene`                                                 | ✅ covered | Labelled with `svgAriaLabel` like upstream.                                                                                                                      |
| Medium           | `Dialog`; `InDialog` ("In a dialog"); Open: in a dialog | ✅ covered | Inline medium message, and upstream's dialog opened by a button (title `h2` under the dialog's `h1` for axe heading-order); the Open story opens it in `play()`. |
| Small            | `Spot`                                                  | ✅ covered | Upstream places it in cards; cosmetic difference.                                                                                                                |
| Extra Small      | `Dot`                                                   | ✅ covered | Same, upstream uses a card.                                                                                                                                      |
| Inline SVG       | all stories (inline `file` configs)                     | ✅ covered | Every story uses inline SVG from `docs/assets/illustrations`. `Responsive` and `TextOnly` add width-following and text-only variants.                            |

### Tests vs. upstream specs

| Upstream behaviour                                                                  | Registry test                                                      | Status     | Notes                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------- |
| Should create / host, title and text classes                                        | —                                                                  | ➖ n/a     | Class-only.                                                         |
| type selects the size (large, medium, small, base)                                  | shows the illustration of its size from inline SVG or a sprite URL | 🟡 partial | Dialog and spot sizes asserted; `base` (text only) is not.          |
| href updates when svgConfig changes                                                 | shows the illustration of its size from inline SVG or a sprite URL | ✅ covered | Asserted via type change; a config swap at runtime is not, trivial. |
| aria-label on the svg, updated when changed                                         | is decorative unless the illustration is labelled                  | ✅ covered |                                                                     |
| noSvg removes the illustration                                                      | —                                                                  | ❌ missing |                                                                     |
| Legacy type names (scene/dialog/spot/dot) normalised                                | shows the illustration of its size ...                             | ✅ covered | Host uses `dialog`/`spot`.                                          |
| Legacy svgConfig keys                                                               | shows the illustration of its size ...                             | ✅ covered | Test config uses scene/dialog/spot/dot keys.                        |
| Inline SVG content                                                                  | shows the illustration of its size from inline SVG ...             | ✅ covered |                                                                     |
| Breakpoint type from element width                                                  | follows the available width without a type                         | ✅ covered |                                                                     |
| Initially hidden (offsetWidth 0) renders base, then picks the right size when shown | —                                                                  | ❌ missing | Tab-switch scenario from upstream.                                  |

Registry-only coverage: none beyond upstream (all three tests map to upstream behaviours).

### Gaps to fill

- **Tests:** "noSvg renders the text without an illustration"; "type base renders text only"; "a message created while hidden picks its size once it becomes visible".
- **Effort:** S, three small tests and one dialog story.
