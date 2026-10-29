import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Dialog, DialogBody, DialogService, type DialogRef } from '@/ui/dialog/dialog';
import { MultiCombobox, type MultiComboboxDataSource, type MultiComboboxMobileConfig } from './multi-combobox';

interface Item {
    id: number;
    name: string;
    type: string;
}

const ITEMS: Item[] = [
    { id: 1, name: 'Apple', type: 'Fruit' },
    { id: 2, name: 'Banana', type: 'Fruit' },
    { id: 3, name: 'Red Pepper', type: 'Vegetable' },
    { id: 4, name: 'Spinach', type: 'Vegetable' }
];

@Component({
    imports: [MultiCombobox, ReactiveFormsModule],
    template: `
        <fd-multi-combobox
            ariaLabel="Food"
            displayKey="name"
            lookupKey="id"
            [showSelectAll]="selectAll()"
            [group]="group()"
            groupKey="type"
            [autoComplete]="false"
            [invalidEntryDisplayTime]="200"
            [dataSource]="items"
            [formControl]="control"
            (selectionChange)="changes.set(changes() + 1)"
        />
        <button type="button">Outside</button>
    `
})
class Host {
    readonly items = ITEMS;
    readonly selectAll = signal(false);
    readonly group = signal(false);
    readonly changes = signal(0);
    readonly control = new FormControl<Item[]>([ITEMS[1]]);
}

@Component({
    imports: [MultiCombobox],
    template: `
        <fd-multi-combobox
            ariaLabel="Food"
            displayKey="name"
            lookupKey="id"
            secondaryKey="type"
            [showSecondaryText]="secondary()"
            [limitless]="limitless()"
            [openDropdownOnAddOnClicked]="openOnAddon()"
            [mobile]="mobile()"
            [mobileConfig]="mobileConfig()"
            [dataSource]="data()"
            [(selectedItems)]="selected"
            (selectionChange)="changes.set(changes() + 1)"
            (addOnButtonClicked)="addonClicks.set(addonClicks() + 1)"
        />
    `
})
class ModelHost {
    readonly data = signal<MultiComboboxDataSource<any>>(ITEMS);
    readonly selected = signal<any[]>([]);
    readonly secondary = signal(false);
    readonly limitless = signal(false);
    readonly openOnAddon = signal(true);
    readonly mobile = signal(false);
    readonly mobileConfig = signal<MultiComboboxMobileConfig>({
        title: 'Food',
        approveButtonText: 'OK',
        cancelButtonText: 'Cancel'
    });
    readonly changes = signal(0);
    readonly addonClicks = signal(0);
}

@Component({
    imports: [MultiCombobox, ReactiveFormsModule],
    template: `<fd-multi-combobox
        ariaLabel="Food"
        displayKey="name"
        lookupKey="id"
        [dataSource]="source"
        [formControl]="control"
    />`
})
class ObservableHost {
    readonly source = new Subject<Item[]>();
    readonly control = new FormControl<Item[]>([ITEMS[1]]);
}

@Component({
    imports: [MultiCombobox, Dialog, DialogBody],
    template: `
        <ng-template #tpl>
            <fd-dialog>
                <fd-dialog-body>
                    <fd-multi-combobox ariaLabel="Food" displayKey="name" lookupKey="id" [dataSource]="items" />
                </fd-dialog-body>
            </fd-dialog>
        </ng-template>
    `
})
class DialogHost {
    readonly items = ITEMS;
    readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    private readonly dialogs = inject(DialogService);
    open(): DialogRef {
        return this.dialogs.open(this.tpl(), { ariaLabel: 'Food' });
    }
}

async function setupModel(configure: (host: ModelHost) => void = () => {}) {
    const fixture = TestBed.createComponent(ModelHost);
    configure(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input[role=combobox]')!;
    const addon = () => root.querySelector<HTMLElement>('button[aria-haspopup]')!;
    return { fixture, host: fixture.componentInstance, root, input, addon };
}

/** A button of the open dialog by the start of its text, or by its label. */
const dialogButton = (label: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('[role=dialog] button')].find(
        (b) => b.textContent?.trim().startsWith(label) || b.getAttribute('aria-label') === label
    );

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const optionTexts = () =>
    [...document.querySelectorAll<HTMLElement>('ul[role=listbox] [role=option]')].map((o) => o.textContent?.trim());
const options = () => [...document.querySelectorAll<HTMLElement>('ul[role=listbox] [role=option]')];
const tokens = () => [...document.querySelectorAll<HTMLElement>('fd-token')].map((t) => t.textContent?.trim());
const names = (items: Item[] | null) => (items ?? []).map((i) => i.name);

async function setup(config: { selectAll?: boolean; group?: boolean } = {}) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.selectAll.set(!!config.selectAll);
    fixture.componentInstance.group.set(!!config.group);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input[role=combobox]')!;
    return { fixture, host: fixture.componentInstance, root, input };
}

describe('MultiCombobox', () => {
    it('shows the chosen items as tokens', async () => {
        const { fixture, host } = await setup();
        expect(tokens()).toEqual(['Banana']);
        host.control.setValue([ITEMS[0], ITEMS[3]]);
        await fixture.whenStable();
        expect(tokens()).toEqual(['Apple', 'Spinach']);
    });

    it('filters by the start of any word', async () => {
        const { fixture, input } = await setup();
        await userEvent.type(input, 'pe');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Red Pepper']);
    });

    it('rejects text that matches nothing with a brief error', async () => {
        const { fixture, input, root } = await setup();
        await userEvent.type(input, 'a');
        await userEvent.keyboard('z');
        await fixture.whenStable();
        expect(input.value).toBe('a');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(root.textContent).toContain('Invalid entry');
        await wait(300);
        await fixture.whenStable();
        expect(input.getAttribute('aria-invalid')).toBeNull();
    });

    it('toggles options with the keyboard and the mouse', async () => {
        const { fixture, host, input } = await setup();
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        await userEvent.keyboard('{ArrowDown}');
        expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);
        await userEvent.keyboard(' ');
        expect(names(host.control.value)).toEqual(['Banana', 'Apple']);
        expect(input.getAttribute('aria-expanded')).toBe('true');
        await userEvent.click(options()[2].querySelector('[aria-hidden=true]')!);
        expect(names(host.control.value)).toEqual(['Banana', 'Apple', 'Red Pepper']);
        await userEvent.click(options()[1]);
        await fixture.whenStable();
        expect(names(host.control.value)).toEqual(['Apple', 'Red Pepper']);
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(host.changes()).toBe(3);
    });

    it('chooses the item named by the text with Enter', async () => {
        const { fixture, host, input } = await setup();
        await userEvent.type(input, 'spinach{Enter}');
        await fixture.whenStable();
        expect(names(host.control.value)).toEqual(['Banana', 'Spinach']);
        expect(input.value).toBe('');
    });

    it('selects all with the select all option and Ctrl+A', async () => {
        const { fixture, host, input } = await setup({ selectAll: true });
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        expect(options()[0].textContent).toContain('Select All (1/4)');
        await userEvent.click(options()[0]);
        expect(host.control.value).toHaveLength(4);
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}{ArrowDown}{Control>}{Shift>}a{/Shift}{/Control}');
        expect(host.control.value).toEqual([]);
    });

    it('groups the options under headers', async () => {
        const { fixture, input } = await setup({ group: true });
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        const groups = [...document.querySelectorAll<HTMLElement>('ul[role=listbox] [role=group]')];
        expect(groups).toHaveLength(2);
        // a list may take the group role (an li may not), inside a presentational li
        expect(groups.map((g) => g.tagName)).toEqual(['UL', 'UL']);
        expect(groups[0].parentElement!.getAttribute('role')).toBe('none');
        expect(groups.map((g) => g.querySelectorAll('[role=option]').length)).toEqual([2, 2]);
        expect(document.getElementById(groups[1].getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe(
            'Vegetable'
        );
        // the header is a list group header: its title in the header font, on a 2rem line at the bottom
        const header = document.getElementById(groups[0].getAttribute('aria-labelledby')!)!;
        const title = header.querySelector<HTMLElement>('[fd-list-title], [fdListTitle]')!;
        expect(header.hasAttribute('tabindex')).toBe(false);
        expect(getComputedStyle(header).alignItems).toBe('flex-end');
        expect(getComputedStyle(title).lineHeight).toBe('32px');
        expect(getComputedStyle(title).fontWeight).toBe('700');
        expect(title.getBoundingClientRect().bottom).toBeCloseTo(header.getBoundingClientRect().bottom - 1, 0);
    });

    describe('options', () => {
        it('the addon button opens and closes the list', async () => {
            const { fixture, host, input, addon } = await setupModel();
            await userEvent.click(addon());
            await fixture.whenStable();
            expect(input.getAttribute('aria-expanded')).toBe('true');
            expect(options()).toHaveLength(4);
            expect(document.activeElement).toBe(input);
            await userEvent.click(addon());
            await fixture.whenStable();
            expect(input.getAttribute('aria-expanded')).toBe('false');
            expect(host.addonClicks()).toBe(2);
        });

        it('openDropdownOnAddOnClicked=false keeps the list closed', async () => {
            const { fixture, host, input, addon } = await setupModel((h) => h.openOnAddon.set(false));
            await userEvent.click(addon());
            await fixture.whenStable();
            expect(input.getAttribute('aria-expanded')).toBe('false');
            expect(options()).toHaveLength(0);
            expect(host.addonClicks()).toBe(1);
        });

        it('limitless shows every item, otherwise mapLimit', async () => {
            const many = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
            const { fixture, host, addon } = await setupModel((h) => h.data.set(many));
            await userEvent.click(addon());
            await fixture.whenStable();
            expect(options()).toHaveLength(12);
            await userEvent.click(addon());
            host.limitless.set(true);
            await fixture.whenStable();
            await userEvent.click(addon());
            await fixture.whenStable();
            expect(options()).toHaveLength(20);
        });

        it('shows secondary text in a second column', async () => {
            const { fixture, addon } = await setupModel((h) => h.secondary.set(true));
            await userEvent.click(addon());
            await fixture.whenStable();
            const cells = [...options()[2].querySelectorAll<HTMLElement>('span[title]')];
            expect(cells.map((c) => c.textContent?.trim())).toEqual(['Red Pepper', 'Vegetable']);
        });

        it('filters the new items after the dataSource is replaced, and handles an empty one', async () => {
            const { fixture, host, input, root } = await setupModel();
            await userEvent.type(input, 'b');
            await fixture.whenStable();
            expect(optionTexts()).toEqual(['Banana']);
            await userEvent.keyboard('{Escape}');
            host.data.set([
                { id: 5, name: 'Beetroot', type: 'Vegetable' },
                { id: 6, name: 'Broccoli', type: 'Vegetable' },
                { id: 7, name: 'Carrot', type: 'Vegetable' }
            ]);
            await fixture.whenStable();
            await userEvent.type(input, 'b');
            await fixture.whenStable();
            expect(optionTexts()).toEqual(['Beetroot', 'Broccoli']);
            await userEvent.keyboard('r');
            await fixture.whenStable();
            expect(optionTexts()).toEqual(['Broccoli']);
            await userEvent.clear(input);
            await fixture.whenStable();
            expect(optionTexts()).toEqual(['Beetroot', 'Broccoli', 'Carrot']);

            await userEvent.keyboard('{Escape}');
            host.data.set([]);
            await fixture.whenStable();
            await userEvent.type(input, 'b');
            await fixture.whenStable();
            expect(input.value).toBe('');
            expect(root.textContent).toContain('Invalid entry');
            expect(optionTexts()).toEqual([]);
        });

        it('the selectedItems input adds, replaces and clears tokens and the checked options', async () => {
            const { fixture, host, addon } = await setupModel();
            const checked = () => options().filter((o) => o.getAttribute('aria-selected') === 'true');
            host.selected.set([ITEMS[0], ITEMS[1]]);
            await fixture.whenStable();
            expect(tokens()).toEqual(['Apple', 'Banana']);

            host.selected.set([ITEMS[1]]);
            await fixture.whenStable();
            expect(tokens()).toEqual(['Banana']);
            await userEvent.click(addon());
            await fixture.whenStable();
            expect(checked().map((o) => o.textContent?.trim())).toEqual(['Banana']);
            await userEvent.click(addon());
            await fixture.whenStable();

            host.selected.set([]);
            await fixture.whenStable();
            expect(tokens()).toEqual([]);
            await userEvent.click(addon());
            await fixture.whenStable();
            expect(checked()).toEqual([]);
            expect(host.changes()).toBe(0);
        });

        it('removing a token unchecks it in the open list and keeps the others', async () => {
            const { fixture, host, addon } = await setupModel((h) => h.selected.set([ITEMS[0], ITEMS[2]]));
            await userEvent.click(addon());
            await fixture.whenStable();
            const token = [...document.querySelectorAll<HTMLElement>('fd-token')].find((t) =>
                t.textContent?.includes('Apple')
            )!;
            await userEvent.click(token.querySelector<HTMLElement>('span[aria-hidden=true]')!);
            await fixture.whenStable();
            expect(tokens()).toEqual(['Red Pepper']);
            expect(names(host.selected())).toEqual(['Red Pepper']);
            expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'false', 'true', 'false']);
        });
    });

    it('renders the form value once an observable dataSource emits', async () => {
        const fixture = TestBed.createComponent(ObservableHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        expect(tokens()).toEqual(['Banana']);
        fixture.componentInstance.source.next(ITEMS);
        await fixture.whenStable();
        expect(tokens()).toEqual(['Banana']);
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false']);
    });

    describe('mobile', () => {
        const mobileSetup = () =>
            setupModel((h) => {
                h.mobile.set(true);
                h.selected.set([ITEMS[1]]);
            });
        const openDialog = async (fixture: { whenStable(): Promise<unknown> }, addon: () => HTMLElement) => {
            await userEvent.click(addon());
            await fixture.whenStable();
            await wait();
            expect(document.querySelector('[role=dialog] [role=listbox]')).not.toBeNull();
        };

        it('Approve commits once and Cancel restores the selection', async () => {
            const { fixture, host, addon } = await mobileSetup();
            await openDialog(fixture, addon);
            await userEvent.click(options()[0]);
            await userEvent.click(options()[1]);
            await fixture.whenStable();
            expect(options()[0].getAttribute('aria-selected')).toBe('true');
            expect(host.changes()).toBe(0);
            await userEvent.click(dialogButton('Cancel')!);
            await fixture.whenStable();
            await wait(300);
            expect(document.querySelector('[role=dialog]')).toBeNull();
            expect(names(host.selected())).toEqual(['Banana']);
            expect(tokens()).toEqual(['Banana']);
            expect(host.changes()).toBe(0);

            await openDialog(fixture, addon);
            expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false']);
            await userEvent.click(options()[3]);
            await userEvent.click(dialogButton('OK')!);
            await fixture.whenStable();
            await wait(300);
            expect(document.querySelector('[role=dialog]')).toBeNull();
            expect(names(host.selected())).toEqual(['Banana', 'Spinach']);
            expect(host.changes()).toBe(1);
        });

        it('deselecting the last item keeps the focus in the dialog', async () => {
            const { fixture, host, addon } = await mobileSetup();
            await openDialog(fixture, addon);
            const field = document.querySelector<HTMLInputElement>('[role=dialog] input[role=combobox]')!;
            field.focus();
            await userEvent.keyboard('{ArrowDown}{ArrowDown} ');
            await fixture.whenStable();
            expect(options()[1].getAttribute('aria-selected')).toBe('false');
            expect(names(host.selected())).toEqual([]);
            expect(document.activeElement).toBe(field);
        });
    });

    it('inside a dialog, Escape closes the list but not the dialog', async () => {
        const fixture = TestBed.createComponent(DialogHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const ref = fixture.componentInstance.open();
        await fixture.whenStable();
        await wait();
        const input = document.querySelector<HTMLInputElement>('[role=dialog] fd-multi-combobox input')!;
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('true');
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(ref.isClosed()).toBe(false);
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();
        expect(ref.isClosed()).toBe(true);
    });
});
