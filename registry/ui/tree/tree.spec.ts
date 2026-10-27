import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    Tree,
    TreeDataSource,
    TreeItem,
    TreeItemDef,
    TreeItemText,
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
});
