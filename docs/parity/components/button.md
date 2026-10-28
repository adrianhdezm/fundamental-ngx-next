## button

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/button) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/button)
Registry: `registry/ui/button/` — 8 stories, 11 tests.

### Stories vs. upstream examples

| Upstream example  | Registry story | Status     | Notes                                               |
| ----------------- | -------------- | ---------- | --------------------------------------------------- |
| Button Types      | Types          | ✅ covered | All seven types, with custom descriptions           |
| Menu Button       | Menu           | ✅ covered | Upstream only shows the arrow too; it opens no menu |
| Button Sizes      | Sizes          | ✅ covered | `fdCozy` / `fdCompact`                              |
| Button with Icons | Icons          | ✅ covered | Glyph before/after, icon-only                       |
| Button State      | State          | ✅ covered | Toggled, `aria-disabled`, disabled, disabled links  |
| Toggled Button    | Toggled        | ✅ covered |                                                     |
| Badge Buttons     | Badge          | ✅ covered |                                                     |
| Playground Area   | Playground     | ✅ covered |                                                     |

### Tests vs. upstream specs

| Upstream behaviour                                            | Registry test                                                           | Status     | Notes                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Default id with prefix; custom id                             | generates a unique id with the fd-button prefix and accepts a custom id | ✅ covered | The description ids follow the id                                                                                   |
| Type classes, dynamic type change                             | variants (…) use their token classes in all states                      | ✅ covered | Token colours per state                                                                                             |
| Menu on/off                                                   | fdMenu adds the menu arrow and aria-haspopup                            | ✅ covered |                                                                                                                     |
| Disabled, `aria-disabled`, both                               | disabled vs aria-disabled …                                             | ✅ covered | Includes anchors                                                                                                    |
| Toggled on/off                                                | toggled and selected set aria-pressed / aria-selected …                 | ✅ covered |                                                                                                                     |
| Selected → `aria-selected`                                    | toggled and selected …                                                  | ✅ covered |                                                                                                                     |
| `aria-label`; no `aria-describedby` for non-special types     | glyph-only button requires ariaLabel …; semantic variants …             | ✅ covered |                                                                                                                     |
| `ariaDescription` → described-by hidden span                  | semantic variants announce their meaning …                              | ✅ covered |                                                                                                                     |
| Special-type auto description, `ariaTypeDescription` override | semantic variants …                                                     | ✅ covered |                                                                                                                     |
| Combined description and type description                     | semantic variants …                                                     | ✅ covered |                                                                                                                     |
| Auto `aria-label` for special types (from label, from glyph)  | glyph-only button requires ariaLabel …                                  | ✅ covered | Glyph fallback covered; the from-label case is deliberately not ported (the visible label already names the button) |
| `label`, `glyph`, `glyphPosition` inputs                      | glyph-only button requires ariaLabel; glyph before/after label          | ✅ covered |                                                                                                                     |
| `ButtonModel` methods (`isDisabled`, `getFdType`, …)          | —                                                                       | ➖ n/a     | Interface dropped in our port                                                                                       |
| `type` default "button", custom type                          | type defaults to "button" inside forms                                  | ✅ covered |                                                                                                                     |
| `should create`, default class                                | —                                                                       | ➖ n/a     |                                                                                                                     |

Registry-only coverage: hover/disabled token colours per variant, badge placement and compact inline badge, compact height, focus on click (Safari), `aria-expanded` sync with a menu.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, one trivial test.
