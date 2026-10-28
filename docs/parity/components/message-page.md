## message-page

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/message-page) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/message-page)
Registry: `registry/ui/message-page/` — 6 stories, 3 tests.

### Stories vs. upstream examples

| Upstream example           | Registry story              | Status     | Notes                               |
| -------------------------- | --------------------------- | ---------- | ----------------------------------- |
| Filter                     | Filter, Types               | ✅ covered |                                     |
| Search                     | Types                       | ✅ covered | Default arg                         |
| No Items                   | NoItems ("No items"), Types | ✅ covered |                                     |
| Error                      | Error                       | ✅ covered |                                     |
| Formatted text and buttons | Actions                     | ✅ covered | Bold/italic subtitle, actions, more |
| Custom Icon                | CustomIcon                  | ✅ covered | `glyph="retail-store"`              |
| No Icon                    | CustomIcon                  | ✅ covered | `[hasIcon]="false"`                 |

### Tests vs. upstream specs

| Upstream behaviour                                         | Registry test                                                 | Status     | Notes                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| should create (page and parts)                             | —                                                             | ➖ n/a     |                                                        |
| Host and part CSS classes (title, subtitle, actions, more) | —                                                             | ➖ n/a     | Class-only                                             |
| Renders title and subtitle                                 | announces its content …; renders the subtitle below the title | ✅ covered |                                                        |
| Renders actions and more                                   | renders actions and the more area after the subtitle          | ✅ covered | Parts projected out of order still land in their slots |
| type binding                                               | announces its content…                                        | ✅ covered | Glyph changes with type                                |
| glyph binding                                              | announces its content…                                        | ✅ covered | Custom glyph wins over type                            |
| hasIcon binding                                            | announces its content…                                        | ✅ covered |                                                        |

Registry-only coverage: polite `role=status` live region, presentational icon.

### Gaps to fill

- **Stories:** none.
- **Tests:** none.
- **Effort:** S — two stories and one small test.
