import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Dialog, DialogBody, DialogService, type DialogRef } from '@/ui/dialog/dialog';
import { Combobox } from './combobox';

interface Item {
    id: number;
    name: string;
}

@Component({
    imports: [Combobox, ReactiveFormsModule],
    template: `
        <fd-combobox
            ariaLabel="Fruit"
            [dropdownValues]="fruits"
            [autoComplete]="autoComplete()"
            [formControl]="control"
            (itemClicked)="clicked.set($event.item)"
        />
        <fd-combobox
            id="objects"
            ariaLabel="Item"
            communicateByObject
            valueProperty="id"
            [displayFn]="display"
            [dropdownValues]="items"
            [formControl]="objectControl"
        />
        <button type="button">Outside</button>
    `
})
class Host {
    readonly fruits = ['Apple', 'Apricot', 'Banana', 'Cherry'];
    readonly items: Item[] = [
        { id: 1, name: 'One' },
        { id: 2, name: 'Two' }
    ];
    readonly display = (item: Item | null | undefined) => item?.name ?? '';
    readonly autoComplete = signal(true);
    readonly clicked = signal<unknown>(null);
    readonly control = new FormControl<unknown>('');
    readonly objectControl = new FormControl<unknown>(2);
}

interface Fruit {
    name: string;
    code: string;
}

const KIWI: Fruit = { name: 'Kiwi', code: 'K1' };
const BANANA: Fruit = { name: 'Banana', code: 'B1' };
const APPLE: Fruit = { name: 'Apple', code: 'A1' };
const APPLE_2: Fruit = { name: 'Apple', code: 'A2' };

@Component({
    imports: [Combobox, ReactiveFormsModule],
    template: `
        <fd-combobox
            ariaLabel="Fruit"
            [communicateByObject]="byObject()"
            [autoComplete]="autoComplete()"
            [tabOutStrategy]="tabOutStrategy()"
            [displayFn]="display"
            [dropdownValues]="values()"
            [formControl]="control"
            (itemClicked)="clicks.set(clicks() + 1)"
        />
        <button type="button">Outside</button>
    `
})
class LeaveHost {
    readonly byObject = signal(true);
    readonly autoComplete = signal(true);
    readonly tabOutStrategy = signal<'close' | 'closeAndSelect'>('closeAndSelect');
    readonly values = signal<unknown[]>([KIWI, BANANA, APPLE, APPLE_2]);
    readonly display = (item: unknown) =>
        item == null ? '' : typeof item === 'string' ? item : ((item as Fruit).name ?? '');
    readonly clicks = signal(0);
    readonly control = new FormControl<unknown>(null);
}

async function setupLeave(configure: (host: LeaveHost) => void = () => {}) {
    const fixture = TestBed.createComponent(LeaveHost);
    configure(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('fd-combobox input')!;
    const outside = [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Outside')!;
    const emitted: unknown[] = [];
    fixture.componentInstance.control.valueChanges.subscribe((v) => emitted.push(v));
    /** Opens the list with Alt+Down and clicks the option with the text. */
    const pick = async (text: string) => {
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        await userEvent.click(options().find((o) => o.textContent?.trim() === text)!);
        await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, input, outside, emitted, pick };
}

@Component({
    imports: [Combobox],
    template: `<fd-combobox ariaLabel="Food" [dropdownValues]="values" [groupFn]="group" />`
})
class GroupHost {
    readonly values = ['Apple', 'Banana', 'Carrot'];
    readonly group = (items: string[]) => ({
        Fruit: items.filter((i) => i !== 'Carrot'),
        Vegetable: items.filter((i) => i === 'Carrot')
    });
}

@Component({
    imports: [Combobox, Dialog, DialogBody],
    template: `
        <ng-template #tpl>
            <fd-dialog>
                <fd-dialog-body>
                    <fd-combobox ariaLabel="Fruit" [dropdownValues]="values" />
                </fd-dialog-body>
            </fd-dialog>
        </ng-template>
    `
})
class DialogHost {
    readonly values = ['Apple', 'Banana'];
    readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    private readonly dialogs = inject(DialogService);
    open(): DialogRef {
        return this.dialogs.open(this.tpl(), { ariaLabel: 'Fruits' });
    }
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')];

async function setup(autoComplete = true) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.autoComplete.set(autoComplete);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('fd-combobox input')!;
    return { fixture, host: fixture.componentInstance, root, input };
}

describe('Combobox', () => {
    it('is a combobox input that filters the values while typing', async () => {
        const { fixture, input } = await setup(false);
        expect(input.getAttribute('role')).toBe('combobox');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        await userEvent.type(input, 'ap');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Apple', 'Apricot']);
        expect(options()[0].querySelector('b')?.textContent).toBe('Ap');
    });

    it('completes the text inline and takes it over with Enter', async () => {
        const { fixture, host, input } = await setup();
        input.focus();
        await userEvent.keyboard('b');
        await fixture.whenStable();
        await wait();
        expect(input.value).toBe('Banana');
        expect(input.selectionStart).toBe(1);
        expect(input.selectionEnd).toBe(6);
        expect(host.control.value).toBe('b');
        await userEvent.keyboard('{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toBe('Banana');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('highlights items with the arrow keys and chooses with Enter', async () => {
        const { fixture, host, input } = await setup(false);
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        expect(options()).toHaveLength(4);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        await fixture.whenStable();
        expect(input.getAttribute('aria-activedescendant')).toBe(options()[1].id);
        expect(input.value).toBe('Apricot');
        await userEvent.keyboard('{ArrowDown}{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toBe('Banana');
        expect(host.clicked()).toBe('Banana');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('chooses an item on click and closes', async () => {
        const { fixture, host, input } = await setup(false);
        await userEvent.type(input, 'c');
        await fixture.whenStable();
        await userEvent.click(options()[0]);
        await fixture.whenStable();
        expect(host.control.value).toBe('Cherry');
        expect(input.value).toBe('Cherry');
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('steps through the values with the arrow keys while closed', async () => {
        const { fixture, host, input } = await setup(false);
        host.control.setValue('Apricot');
        await fixture.whenStable();
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(host.control.value).toBe('Banana');
        await userEvent.keyboard('{ArrowUp}{ArrowUp}');
        expect(host.control.value).toBe('Apple');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens the full list with the button and closes with Escape', async () => {
        const { fixture, root, input } = await setup(false);
        await userEvent.click(root.querySelector<HTMLButtonElement>('fd-combobox button')!);
        await fixture.whenStable();
        expect(options()).toHaveLength(4);
        expect(document.activeElement).toBe(input);
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('communicates by object with a value property', async () => {
        const { fixture, host, root } = await setup(false);
        const input = root.querySelector<HTMLInputElement>('#objects input')!;
        expect(input.value).toBe('Two');
        await userEvent.clear(input);
        await userEvent.type(input, 'One');
        await fixture.whenStable();
        expect(host.objectControl.value).toBe(1);
        await userEvent.type(input, 'x');
        expect(host.objectControl.value).toBeNull();
    });

    describe('leaving the field', () => {
        it('Tab reverts invalid text to the last selection in object mode', async () => {
            const { fixture, host, input, pick } = await setupLeave();
            await pick('Kiwi');
            expect(host.control.value).toBe(KIWI);
            await userEvent.type(input, '123');
            await fixture.whenStable();
            expect(host.control.value).toBeNull();
            await userEvent.keyboard('{Tab}');
            await fixture.whenStable();
            expect(input.value).toBe('Kiwi');
            expect(host.control.value).toBe(KIWI);
            expect(input.getAttribute('aria-expanded')).toBe('false');
        });

        it('tabOutStrategy close restores the selection without emitting itemClicked', async () => {
            const { fixture, host, input, pick } = await setupLeave((h) => h.tabOutStrategy.set('close'));
            await pick('Kiwi');
            expect(host.clicks()).toBe(1);
            await userEvent.clear(input);
            await userEvent.type(input, 'Custom');
            await fixture.whenStable();
            await userEvent.keyboard('{Tab}');
            await fixture.whenStable();
            expect(input.value).toBe('Kiwi');
            expect(host.control.value).toBe(KIWI);
            expect(host.clicks()).toBe(1);
        });

        it('Tab commits the completed autocomplete candidate once', async () => {
            const { fixture, host, input, emitted } = await setupLeave((h) => {
                h.byObject.set(false);
                h.values.set(['Kiwi', 'Banana']);
            });
            input.focus();
            await userEvent.keyboard('k');
            await fixture.whenStable();
            await wait();
            expect(input.value).toBe('Kiwi');
            expect(host.control.value).toBe('k');
            emitted.length = 0;
            await userEvent.keyboard('{Tab}');
            await fixture.whenStable();
            expect(input.value).toBe('Kiwi');
            expect(emitted).toEqual(['Kiwi']);
        });

        it('a duplicate completed label does not choose an arbitrary object on Tab', async () => {
            const { fixture, host, input, pick } = await setupLeave();
            await pick('Kiwi');
            await userEvent.clear(input);
            await userEvent.keyboard('a');
            await fixture.whenStable();
            await wait();
            expect(input.value).toBe('Apple');
            await userEvent.keyboard('{Tab}');
            await fixture.whenStable();
            expect(input.value).toBe('Kiwi');
            expect(host.control.value).toBe(KIWI);
            expect(host.clicks()).toBe(1);
        });

        it('an outside click reverts invalid text, but not when the text matches the selection', async () => {
            const { fixture, host, input, outside, emitted, pick } = await setupLeave();
            await pick('Kiwi');
            emitted.length = 0;
            await userEvent.click(outside);
            await fixture.whenStable();
            expect(input.value).toBe('Kiwi');
            expect(emitted).toEqual([]);

            await userEvent.type(input, '123');
            await fixture.whenStable();
            expect(host.control.value).toBeNull();
            await userEvent.click(outside);
            await fixture.whenStable();
            expect(input.value).toBe('Kiwi');
            expect(host.control.value).toBe(KIWI);
            expect(input.getAttribute('aria-expanded')).toBe('false');
        });

        it('an outside click keeps free text in text mode', async () => {
            const { fixture, host, input, outside, pick } = await setupLeave((h) => {
                h.byObject.set(false);
                h.values.set(['Kiwi', 'Banana']);
            });
            await pick('Kiwi');
            await userEvent.type(input, '123');
            await fixture.whenStable();
            await userEvent.click(outside);
            await fixture.whenStable();
            expect(input.value).toBe('Kiwi123');
            expect(host.control.value).toBe('Kiwi123');
        });

        it('keeps free text on Tab and on a later close when autoComplete is false', async () => {
            const { fixture, host, input, pick } = await setupLeave((h) => h.autoComplete.set(false));
            await pick('Apple');
            expect(host.control.value).toBe(APPLE);
            await userEvent.clear(input);
            await userEvent.type(input, 'free text');
            await fixture.whenStable();
            await userEvent.keyboard('{Tab}');
            await fixture.whenStable();
            expect(input.value).toBe('free text');
            expect(host.control.value).toBeNull();

            input.focus();
            await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
            await fixture.whenStable();
            await userEvent.keyboard('{Tab}');
            await fixture.whenStable();
            expect(input.value).toBe('free text');
        });
    });

    it('groups options in labelled groups that are lists, not list items', async () => {
        const fixture = TestBed.createComponent(GroupHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
        input.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await fixture.whenStable();
        const groups = [...document.querySelectorAll<HTMLElement>('[role=listbox] [role=group]')];
        expect(groups.map((g) => g.tagName)).toEqual(['UL', 'UL']);
        expect(
            groups.map((g) => document.getElementById(g.getAttribute('aria-labelledby')!)?.textContent?.trim())
        ).toEqual(['Fruit', 'Vegetable']);
        expect(groups.map((g) => g.querySelectorAll('[role=option]').length)).toEqual([2, 1]);
        expect(groups[0].parentElement!.getAttribute('role')).toBe('none');
    });

    it('inside a dialog, Escape closes the list but not the dialog', async () => {
        const fixture = TestBed.createComponent(DialogHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const ref = fixture.componentInstance.open();
        await fixture.whenStable();
        await wait();
        const input = document.querySelector<HTMLInputElement>('[role=dialog] fd-combobox input')!;
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
