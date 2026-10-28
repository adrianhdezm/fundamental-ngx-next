import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Icon } from '@/ui/icon/icon';
import {
    Tree,
    TreeDataSource,
    TreeItem,
    TreeItemButton,
    TreeItemDef,
    TreeItemIcon,
    TreeItemText,
    type TreeItemState,
    type TreeAcceptableDataSource,
    type TreeItemData,
    type TreeSelectionPlacement,
    type TreeSelectionType
} from './tree';

@Component({
    imports: [Tree, TreeItem, TreeItemText],
    template: `
        <fd-tree ariaLabel="Nested">
            <fd-tree-item (expandedChange)="expansions.push($event)">
                <span fdTreeItemText>A</span>
                <fd-tree-item>
                    <span fdTreeItemText>A1</span>
                    <fd-tree-item><span fdTreeItemText>A1a</span></fd-tree-item>
                </fd-tree-item>
                <fd-tree-item><span fdTreeItemText>A2</span></fd-tree-item>
            </fd-tree-item>
            <fd-tree-item navigatable (treeItemClick)="clicks.push('B')"><span fdTreeItemText>B</span></fd-tree-item>
        </fd-tree>
    `
})
class NestedHost {
    readonly expansions: boolean[] = [];
    readonly clicks: string[] = [];
}

type Data = Partial<TreeItemData<{ title: string; value: number }>>;

@Component({
    imports: [Tree, TreeItem, TreeItemDef, TreeItemText, ReactiveFormsModule],
    template: `
        <fd-tree
            ariaLabel="Data"
            [dataSource]="source()"
            [selection]="selection()"
            [selectionPlacement]="placement()"
            [formControl]="control"
        >
            <fd-tree-item
                *fdTreeItemDef="let item"
                [id]="item.id"
                [value]="item.data.value"
                [level]="item.level"
                [parentId]="item.parentId"
                [childNodes]="item.children"
                [expanded]="!!item.expanded"
            >
                <span fdTreeItemText>{{ item.data.title }}</span>
            </fd-tree-item>
        </fd-tree>
    `
})
class DataHost {
    readonly source = signal<TreeAcceptableDataSource<Data>>([]);
    readonly selection = signal<TreeSelectionType>('none');
    readonly placement = signal<TreeSelectionPlacement>('none');
    readonly control = new FormControl<unknown>(null);
}

const DATA: Data[] = [
    {
        data: { title: 'Fruits', value: 1 },
        children: [{ data: { title: 'Apple', value: 2 } }, { data: { title: 'Pear', value: 3 } }]
    },
    { data: { title: 'Vegetables', value: 4 } }
];

@Component({
    imports: [Tree, TreeItem, TreeItemIcon, TreeItemText, TreeItemButton, Icon],
    template: `
        <div [attr.dir]="dir()">
            <fd-tree
                ariaLabel="Features"
                [noBorder]="noBorder()"
                [navigationIndicator]="indicator()"
                [selection]="selection()"
                [selectionPlacement]="placement()"
                [independentSections]="independent()"
            >
                <fd-tree-item value="A" [(expanded)]="aExpanded">
                    <fd-icon fdTreeItemIcon glyph="laptop" />
                    <span fdTreeItemText>A</span>
                    <fd-tree-item value="A1" [(expanded)]="a1Expanded">
                        <span fdTreeItemText>A1</span>
                        <fd-tree-item value="A1a"><span fdTreeItemText>A1a</span></fd-tree-item>
                    </fd-tree-item>
                </fd-tree-item>
                <fd-tree-item value="B" navigatable [state]="state()">
                    <span fdTreeItemText>B</span>
                    <button fdTreeItemButton type="button">Edit B</button>
                </fd-tree-item>
                <fd-tree-item value="C"><span fdTreeItemText>C</span></fd-tree-item>
            </fd-tree>
        </div>
        <button type="button">After</button>
    `
})
class FeaturesHost {
    readonly dir = signal<'ltr' | 'rtl'>('ltr');
    readonly noBorder = signal(false);
    readonly indicator = signal(false);
    readonly selection = signal<TreeSelectionType>('none');
    readonly placement = signal<TreeSelectionPlacement>('none');
    readonly independent = signal(false);
    readonly state = signal<TreeItemState | null>(null);
    readonly aExpanded = signal(false);
    readonly a1Expanded = signal(false);
}

/** The row of the item whose text is the given one. */
const itemRow = (root: HTMLElement, text: string) =>
    [...root.querySelectorAll<HTMLElement>('[role=treeitem]')].find(
        (r) => r.querySelector('[fdTreeItemText]')!.textContent!.trim() === text
    )!;
/** The resolved colour of a theme variable. */
const themeColor = (variable: string) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${variable})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
};

async function render<T>(component: new () => T, setup?: (host: T) => void) {
    const fixture = TestBed.createComponent(component);
    setup?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const rows = () => [...root.querySelectorAll<HTMLElement>('[role=treeitem]')];
    const row = (text: string) => rows().find((r) => r.textContent!.trim() === text)!;
    const texts = () => rows().map((r) => r.textContent!.trim());
    return { fixture, host: fixture.componentInstance, root, stable, rows, row, texts };
}

describe('Tree', () => {
    it('is a tree of items with levels, positions and expansion states', async () => {
        const { root, row, texts } = await render(NestedHost);
        expect(root.querySelector('fd-tree')!.getAttribute('role')).toBe('tree');
        expect(texts()).toEqual(['A', 'B']);
        const a = row('A');
        expect(a.getAttribute('aria-level')).toBe('1');
        expect(a.getAttribute('aria-expanded')).toBe('false');
        expect(a.getAttribute('aria-setsize')).toBe('2');
        expect(a.getAttribute('aria-posinset')).toBe('1');
        // a leaf has no expansion state
        expect(row('B').hasAttribute('aria-expanded')).toBe(false);
        expect(row('B').getAttribute('aria-posinset')).toBe('2');
    });

    it('expands with the expander and indents the children', async () => {
        const { host, row, texts, stable } = await render(NestedHost);
        await userEvent.click(row('A').querySelector('span[aria-hidden=true]')!);
        await stable();
        expect(texts()).toEqual(['A', 'A1', 'A2', 'B']);
        expect(host.expansions).toEqual([true]);
        expect(row('A1').getAttribute('aria-level')).toBe('2');
        expect(row('A2').getAttribute('aria-setsize')).toBe('2');
        expect(row('A2').getAttribute('aria-posinset')).toBe('2');
        // level 2 is indented by 1.5rem while only level 1 is expanded
        const expander = row('A1').querySelector<HTMLElement>('span[aria-hidden=true]')!;
        expect(expander.style.marginInlineStart).toBe('1.5rem');
        expect(document.activeElement).toBe(row('A'));
    });

    it('is one tab stop moved with the arrow keys', async () => {
        const { row, texts, stable, host } = await render(NestedHost);
        expect(row('A').tabIndex).toBe(0);
        expect(row('B').tabIndex).toBe(-1);
        row('A').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(row('B'));
        await userEvent.keyboard('{ArrowUp}{ArrowRight}');
        await stable();
        expect(texts()).toEqual(['A', 'A1', 'A2', 'B']);
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(row('A1'));
        await userEvent.keyboard('{End}');
        expect(document.activeElement).toBe(row('B'));
        await userEvent.keyboard('{Home}{ArrowDown}{ArrowLeft}');
        expect(document.activeElement).toBe(row('A'));
        await userEvent.keyboard('{ArrowLeft}');
        await stable();
        expect(texts()).toEqual(['A', 'B']);
        expect(row('A').tabIndex).toBe(0);
        row('B').focus();
        await userEvent.keyboard('{Enter}');
        expect(host.clicks).toEqual(['B']);
    });

    it('renders data items and loads children when they expand', async () => {
        const { row, texts, stable } = await render(DataHost, (host) => host.source.set(DATA));
        expect(texts()).toEqual(['Fruits', 'Vegetables']);
        row('Fruits').focus();
        await userEvent.keyboard('{ArrowRight}');
        await stable();
        expect(texts()).toEqual(['Fruits', 'Apple', 'Pear', 'Vegetables']);
        expect(row('Pear').getAttribute('aria-level')).toBe('2');
        expect(row('Pear').getAttribute('aria-posinset')).toBe('2');
    });

    it('shows loading rows until lazy children arrive', async () => {
        const children = new Subject<Data[]>();
        class Lazy extends TreeDataSource<Data> {
            fetch() {
                return children;
            }
            override getTotalItems() {
                return 1;
            }
        }
        const { row, rows, texts, stable } = await render(DataHost, (host) =>
            host.source.set([{ data: { title: 'Folder', value: 1 }, children: new Lazy() }])
        );
        row('Folder').focus();
        await userEvent.keyboard('{ArrowRight}');
        await stable();
        const loading = rows().filter((r) => r.getAttribute('aria-busy') === 'true');
        expect(loading).toHaveLength(5);
        expect(loading[0].getAttribute('aria-label')).toBe('Loading');
        children.next([{ data: { title: 'File', value: 2 } }]);
        await stable();
        expect(texts()).toEqual(['Folder', 'File']);
    });

    it('says when there is no data', async () => {
        const { texts } = await render(DataHost);
        expect(texts()).toEqual(['No data']);
    });

    it('selects one item as a form value', async () => {
        const { host, row, stable } = await render(DataHost, (h) => {
            h.source.set(DATA);
            h.selection.set('single');
            h.placement.set('left');
            h.control.setValue(4);
        });
        expect(row('Vegetables').getAttribute('aria-selected')).toBe('true');
        expect(row('Fruits').querySelector('input[type=radio]')).not.toBeNull();
        await userEvent.click(row('Fruits'));
        await stable();
        expect(host.control.value).toBe(1);
        expect(row('Vegetables').getAttribute('aria-selected')).toBe('false');
        // a second click deselects
        await userEvent.click(row('Fruits'));
        expect(host.control.value).toBeNull();
    });

    it('selects several items with checkboxes', async () => {
        const { root, host, row, stable } = await render(DataHost, (h) => {
            h.source.set(DATA);
            h.selection.set('multiple');
            h.placement.set('right');
        });
        expect(root.querySelector('fd-tree')!.getAttribute('aria-multiselectable')).toBe('true');
        row('Fruits').focus();
        await userEvent.keyboard(' ');
        await userEvent.click(row('Vegetables'));
        await stable();
        expect(host.control.value).toEqual([1, 4]);
        const checkbox = row('Vegetables').querySelector<HTMLInputElement>('input[type=checkbox]')!;
        expect(checkbox.checked).toBe(true);
        expect(checkbox.tabIndex).toBe(-1);
    });

    describe('options', () => {
        it('removes the borders of the top level items with noBorder', async () => {
            const { root, host, stable } = await render(FeaturesHost);
            const a = itemRow(root, 'A');
            expect(getComputedStyle(a).borderBottomColor).toBe(themeColor('--sapList_BorderColor'));
            host.noBorder.set(true);
            await stable();
            expect(getComputedStyle(a).borderBottomColor).toBe('rgba(0, 0, 0, 0)');
        });

        it('renders the projected icon before the text', async () => {
            const { root } = await render(FeaturesHost);
            const icon = itemRow(root, 'A').querySelector<HTMLElement>('[fdTreeItemIcon]')!;
            expect(icon.getAttribute('aria-hidden')).toBe('true');
            expect(icon.nextElementSibling!.hasAttribute('fdTreeItemText')).toBe(true);
            expect(icon.getBoundingClientRect().width).toBeGreaterThan(0);
        });

        it('indents by the deepest expanded level and shrinks back when it collapses', async () => {
            const { root, host, stable } = await render(FeaturesHost);
            const expander = (text: string) =>
                itemRow(root, text).querySelector<HTMLElement>('span[aria-hidden=true]')!.style.marginInlineStart;
            host.aExpanded.set(true);
            await stable();
            expect(expander('A1')).toBe('1.5rem');
            host.a1Expanded.set(true);
            await stable();
            // two expanded levels: level 2 by 1rem, level 3 by 2.5rem (plus the expander width for a leaf)
            expect(expander('A1')).toBe('1rem');
            const leafContent = itemRow(root, 'A1a').querySelector<HTMLElement>('[fdTreeItemText]')!.parentElement!;
            expect(leafContent.style.marginInlineStart).toBe('calc(2.5rem + var(--tree-exp))');
            host.a1Expanded.set(false);
            await stable();
            expect(expander('A1')).toBe('1.5rem');
        });

        it('shows the highlight indicator of the state', async () => {
            const { root, host, stable } = await render(FeaturesHost);
            const b = itemRow(root, 'B');
            expect(getComputedStyle(b).boxShadow).toBe('none');
            const states: [TreeItemState, string][] = [
                ['error', '--sapErrorBorderColor'],
                ['warning', '--sapWarningBorderColor'],
                ['success', '--sapSuccessBorderColor'],
                ['default', '--sapInformationBorderColor']
            ];
            for (const [state, variable] of states) {
                host.state.set(state);
                await stable();
                // the indicator is the last of Tailwind's composed shadows
                expect(getComputedStyle(b).boxShadow.endsWith(`, ${themeColor(variable)} 6px 0px 0px 0px inset`)).toBe(
                    true
                );
            }
        });

        it('shows the navigation arrow on navigatable items with navigationIndicator', async () => {
            const { root, host, stable } = await render(FeaturesHost);
            const arrow = (text: string) => itemRow(root, text).querySelector('fd-icon[glyph="slim-arrow-right"]');
            expect(arrow('B')).toBeNull();
            host.indicator.set(true);
            await stable();
            expect(arrow('B')).not.toBeNull();
            expect(arrow('A')).toBeNull();
            expect(arrow('C')).toBeNull();
        });

        it('places the selection control after the expander or at the end', async () => {
            const { root, host, stable } = await render(FeaturesHost, (h) => {
                h.selection.set('multiple');
                h.placement.set('afterExpand');
            });
            const control = (text: string) => itemRow(root, text).querySelector('fd-checkbox')?.parentElement ?? null;
            // after the expander, on items that have one
            expect(control('A')!.previousElementSibling!.getAttribute('aria-hidden')).toBe('true');
            expect(control('C')).toBeNull();
            host.placement.set('right');
            await stable();
            for (const text of ['A', 'B', 'C']) expect(itemRow(root, text).lastElementChild).toBe(control(text));
            // after the action buttons
            expect(control('B')!.previousElementSibling!.textContent).toBe('Edit B');
        });

        it('puts left selection controls in one column with independentSections', async () => {
            const { root, host, stable } = await render(FeaturesHost, (h) => {
                h.selection.set('single');
                h.placement.set('left');
            });
            const c = itemRow(root, 'C');
            const control = () => c.querySelector('fd-radio-button')!.parentElement!;
            const content = () => c.querySelector<HTMLElement>('[fdTreeItemText]')!.parentElement!;
            // the leaf's control takes the indentation of the expander it lacks
            expect(control().style.marginInlineStart).toBe('calc(0rem + var(--tree-exp))');
            expect(content().style.marginInlineStart).toBe('');
            host.independent.set(true);
            await stable();
            expect(control().style.marginInlineStart).toBe('');
            expect(content().style.marginInlineStart).toBe('calc(0rem + var(--tree-exp))');
            const left = (text: string) =>
                itemRow(root, text).querySelector('fd-radio-button')!.getBoundingClientRect().left;
            expect(left('C')).toBe(left('A'));
        });

        it('mirrors Right and Left in RTL', async () => {
            const { root, host, stable } = await render(FeaturesHost, (h) => h.dir.set('rtl'));
            itemRow(root, 'A').focus();
            await userEvent.keyboard('{ArrowLeft}');
            await stable();
            expect(host.aExpanded()).toBe(true);
            await userEvent.keyboard('{ArrowLeft}');
            expect(document.activeElement).toBe(itemRow(root, 'A1'));
            await userEvent.keyboard('{ArrowRight}');
            expect(document.activeElement).toBe(itemRow(root, 'A'));
            await userEvent.keyboard('{ArrowRight}');
            await stable();
            expect(host.aExpanded()).toBe(false);
        });

        it('reaches the action buttons with Tab from their item, keeping one item in the tab order', async () => {
            const { root, stable } = await render(FeaturesHost);
            const b = itemRow(root, 'B');
            b.focus();
            await stable();
            expect(b.tabIndex).toBe(0);
            expect(itemRow(root, 'A').tabIndex).toBe(-1);
            await userEvent.tab();
            expect(document.activeElement!.textContent).toBe('Edit B');
            await userEvent.tab();
            expect(document.activeElement!.textContent).toBe('After');
            await userEvent.tab({ shift: true });
            await userEvent.tab({ shift: true });
            expect(document.activeElement).toBe(b);
        });
    });
});
