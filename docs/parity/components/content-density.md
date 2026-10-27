## content-density

Upstream: [docs](https://sap.github.io/fundamental-ngx/#/core/content-density) · [source](https://github.com/SAP/fundamental-ngx/tree/main/libs/core/content-density)
Registry: `registry/ui/content-density/` — 0 stories, 6 tests.

Our port is a single attribute directive that writes `data-density`; components react through the Tailwind `compact:`/`condensed:` variants. All services, storages, observers and provider config are deliberately dropped; the Storybook toolbar density switcher sets `data-density` on the document element.

### Stories vs. upstream examples

| Upstream example                  | Registry story | Status     | Notes                                                                               |
| --------------------------------- | -------------- | ---------- | ----------------------------------------------------------------------------------- |
| Content Density Modes             | —              | ❌ missing | No story shows cozy / compact / condensed side by side                              |
| ContentDensityStorage             | —              | ➖ n/a     | Storage providers dropped (the toolbar switcher replaces it)                        |
| GlobalContentDensityService       | —              | ➖ n/a     | Service dropped; `data-density` on `<html>` is the global setting                   |
| ContentDensityObserver            | —              | ➖ n/a     | Observer dropped; density is pure CSS                                               |
| Directives                        | —              | ❌ missing | `fdContentDensity`, `fdCompact`, `fdCozy`, `fdCondensed` have no story              |
| Inheritance and Priority          | —              | ❌ missing | Nearest-ancestor inheritance and a cozy island inside compact are tested, not shown |
| Toggle Directive Behavior         | —              | ❌ missing | `[fdCompact]="flag"` toggling back to the inherited density                         |
| Advanced Configuration            | —              | ➖ n/a     | debug / modifiers / alwaysAddModifiers config dropped                               |
| UI5 Web Components Integration    | —              | ➖ n/a     | No UI5 wrappers in the registry                                                     |
| Deprecated APIs (Migration Guide) | —              | ➖ n/a     | Prose only                                                                          |

### Tests vs. upstream specs

| Upstream behaviour                                                                                           | Registry test                                                             | Status     | Notes                                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| Directive inputs set the density (`fdContentDensity`, `fdCompact`, `fdCondensed`, `fdCozy`, empty string)    | sets data-density from the explicit input or the shorthands               | ✅ covered | Also explicit-over-shorthand precedence                                                                  |
| Density updates reactively when the input changes                                                            | data-density="compact" on an ancestor switches compact: utilities…        | ✅ covered | Checks real button heights                                                                               |
| Shorthand set to `false` reverts to the global/inherited density                                             | —                                                                         | ❌ missing | Not toggled true → false in any test                                                                     |
| Invalid values (undefined, null, numbers, objects, whitespace) fall back gracefully                          | sets data-density… (empty attribute)                                      | 🟡 partial | Only empty/unset; our directive writes any string unvalidated (e.g. `"foo"`) — unclear whether it should |
| Programmatic `setDensity()` override                                                                         | —                                                                         | ➖ n/a     | API dropped                                                                                              |
| UI5 `data-ui5-compact-size` attribute                                                                        | —                                                                         | ➖ n/a     | No UI5 integration                                                                                       |
| Directive lifecycle / effect cleanup                                                                         | —                                                                         | ➖ n/a     | No effects or subscriptions in our directive                                                             |
| Priority resolution: local directive over global, nested child keeps its density (nesting regression #14355) | density on the document element…; a cozy island inside a compact subtree… | ✅ covered | CSS nearest-ancestor wins                                                                                |
| `restrictChildContentDensity` (restricting parent overrides child directive)                                 | a density set on a child wins over the density of its parent              | ➖ n/a     | Dropped; our semantics are the opposite (nearest ancestor always wins), pinned by this test              |
| DI-island guard (shared vs isolated global service)                                                          | —                                                                         | ➖ n/a     | No DI                                                                                                    |
| Local / Memory / URL storage providers                                                                       | —                                                                         | ➖ n/a     | Dropped                                                                                                  |
| ContentDensityObserver signals, observables, modifier classes, debug, consumers                              | —                                                                         | ➖ n/a     | Dropped                                                                                                  |
| Unsupported density fallback (condensed → compact)                                                           | condensed falls back to compact sizes…                                    | ✅ covered |                                                                                                          |

Registry-only coverage: measures actual rendered heights of a button under each density, including the document-element global setting.

### Gaps to fill

- **Stories:** "Modes" — three buttons/inputs in cozy, compact and condensed containers; "Directives and inheritance" — compact section with a nested `fdCozy` island and an `fdContentDensity="condensed"` list; "Toggle" — a switch bound to `[fdCompact]` showing the field resize and fall back to the toolbar density.
- **Tests:** "fdCompact set back to false removes data-density so the inherited density applies"; optionally "ignores values that are not a density" (needs a source decision).
- **Effort:** S, one docs-style story file and one test.
