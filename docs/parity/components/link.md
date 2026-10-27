## link

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/link) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/link)
Registry: `registry/ui/link/` — 6 stories, 6 tests.

### Stories vs. upstream examples

| Upstream example                                                      | Registry story                                                 | Status     | Notes                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Links (standard, visual modifiers, inverted, states, icons, combined) | Playground, Standard, VisualModifiers, Inverted, States, Icons | ✅ covered | Every sub-heading of the single upstream example has a story; combined emphasized+icon and subtle+undecorated included |

### Tests vs. upstream specs

| Upstream behaviour                          | Registry test                                                       | Status     | Notes                             |
| ------------------------------------------- | ------------------------------------------------------------------- | ---------- | --------------------------------- |
| should create / base `fd-link` class        | —                                                                   | ➖ n/a     |                                   |
| Emphasized, subtle, inverted styles         | emphasized, subtle, inverted and disabled styles…                   | ✅ covered | Token colours and font family     |
| Disabled state + `aria-disabled` true/false | emphasized, subtle, inverted and disabled styles…                   | ✅ covered | Also tab order and pointer events |
| Undecorated and touchTarget                 | underlines on hover and focus only; undecorated never; touchTarget… | ✅ covered |                                   |
| Multiple modifiers at once                  | combines modifiers: subtle undecorated and emphasized inverted      | ✅ covered |                                   |

Registry-only coverage: keyboard activation, tabindex on href-less links, hover/focus underline, screen-reader labels for emphasized/subtle.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S — one small test.
