## generic-tag

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/generic-tag) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/generic-tag)
Registry: `registry/ui/generic-tag/` — 2 stories, 5 tests.

### Stories vs. upstream examples

| Upstream example | Registry story                    | Status     | Notes                                                                                  |
| ---------------- | --------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| Types            | `Default` ("Types"), `Playground` | ✅ covered | Same five tags as upstream (incl. custom `ariaRoleDescription`), plus a name-only tag. |

### Tests vs. upstream specs

| Upstream behaviour                                                 | Registry test                                                                | Status     | Notes                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Should create                                                      | —                                                                            | ➖ n/a     |                                                                        |
| Type modifier (error/success/...)                                  | type (error, warning, success, information) shows the status icon and colors | ✅ covered | Asserts token colours and status strip, not classes.                   |
| Default look without type                                          | type (...) shows the status icon and colors                                  | ✅ covered | Neutral background asserted before setting a type.                     |
| Name and value displayed, updated, value omitted when not provided | name and value are rendered and separated                                    | ✅ covered | Value update/removal tested; a name change at runtime is not, trivial. |
| Status icon only with a type                                       | type (...) shows the status icon and colors                                  | ✅ covered |                                                                        |
| aria-roledescription default and update                            | role description (ariaRoleDescription) and readable name/value ...           | ✅ covered |                                                                        |

Registry-only coverage: keyboard focus and activation with Enter/Space/click, accessible name excludes the decorative icon, name truncation with title.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S, nothing to do.
