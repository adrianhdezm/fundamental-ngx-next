import { Component, signal, viewChild, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { MultiInput, type MultiInputMobileConfig } from './multi-input';

@Component({
    imports: [MultiInput, ReactiveFormsModule],
    template: `
        <fd-multi-input
            ariaLabel="Fruits"
            [dropdownValues]="fruits"
            [allowNewTokens]="allowNew()"
            [autoComplete]="autoComplete()"
            [formControl]="control"
        />
        <button type="button">Outside</button>
    `
})
class Host {
    readonly fruits = ['Apple', 'Apricot', 'Banana', 'Cherry'];
    readonly allowNew = signal(false);
    readonly autoComplete = signal(true);
    readonly control = new FormControl<string[]>(['Banana']);
}

/** Host with every input under test in a signal and the outputs recorded. */
@Component({
    imports: [MultiInput, ReactiveFormsModule],
    template: `
        <button type="button" id="before">Before</button>
        <div [style.width.px]="width()">
            <fd-multi-input
                ariaLabel="Values"
                [placeholder]="placeholder()"
                [dropdownValues]="values()"
                [disabled]="disabled()"
                [openDropdownOnAddOnClicked]="openOnAddon()"
                [maxVisibleTokens]="maxVisible()"
                [mobile]="mobile()"
                [mobileConfig]="mobileConfig()"
                [autoComplete]="false"
                [formControl]="control"
                (searchTermChange)="terms.push($event)"
                (addOnButtonClicked)="addonClicks.set(addonClicks() + 1)"
                (allItemsSelectedChange)="allSelected.push($event)"
            />
        </div>
        <button type="button" id="after">After</button>
    `
})
class SignalHost {
    readonly multiInput = viewChild.required(MultiInput);
    readonly placeholder = signal('Search fruits');
    readonly values = signal<string[]>(['Apple', 'Apricot', 'Banana', 'Cherry']);
    readonly disabled = signal(false);
    readonly openOnAddon = signal(true);
    readonly maxVisible = signal(12);
    readonly mobile = signal(false);
    readonly mobileConfig = signal<MultiInputMobileConfig>({
        title: 'Fruits',
        approveButtonText: 'Select',
        cancelButtonText: 'Cancel'
    });
    readonly width = signal(600);
    readonly control = new FormControl<string[]>([]);
    readonly addonClicks = signal(0);
    readonly terms: string[] = [];
    readonly allSelected: boolean[] = [];
}

interface Product {
    id: number;
    name: string;
}

@Component({
    imports: [MultiInput],
    template: `
        <fd-multi-input
            ariaLabel="Products"
            [dropdownValues]="products"
            [displayFn]="display"
            [valueFn]="value"
            [autoComplete]="false"
            [(selected)]="selected"
        />
    `
})
class ObjectHost {
    readonly products: Product[] = [
        { id: 1, name: 'Laptop' },
        { id: 2, name: 'Monitor' },
        { id: 3, name: 'Mouse' }
    ];
    readonly display = (item: Product) => item.name;
    readonly value = (item: Product) => item.id;
    readonly selected = signal<number[]>([2]);
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const options = () => [...document.querySelectorAll<HTMLElement>('ul[role=listbox] [role=option]')];
const tokens = () => [...document.querySelectorAll<HTMLElement>('fd-token')].map((t) => t.textContent?.trim());

async function render<T>(type: Type<T>, configure?: (host: T) => void) {
    const fixture = TestBed.createComponent(type);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        await fixture.whenStable();
        await new Promise((r) => requestAnimationFrame(r));
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input[role=combobox]')!;
    const addon = () => root.querySelector<HTMLButtonElement>('fd-multi-input button[aria-haspopup]')!;
    const more = () => root.querySelectorAll<HTMLElement>('[data-tokenizer-more]');
    return { fixture, host: fixture.componentInstance, root, input, addon, more, stable };
}

const optionTexts = () => options().map((o) => o.textContent?.trim());
const listOpen = () => !!document.querySelector('.cdk-overlay-container ul[role=listbox]');
const values = (count: number) => Array.from({ length: count }, (_, i) => `item${i}`);

async function setup(config: { allowNew?: boolean; autoComplete?: boolean } = {}) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.allowNew.set(!!config.allowNew);
    fixture.componentInstance.autoComplete.set(config.autoComplete ?? true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input[role=combobox]')!;
    return { fixture, host: fixture.componentInstance, root, input };
}

describe('MultiInput', () => {
    it('shows the selected values as tokens', async () => {
        const { fixture, host } = await setup();
        expect(tokens()).toEqual(['Banana']);
        host.control.setValue(['Apple', 'Cherry']);
        await fixture.whenStable();
        expect(tokens()).toEqual(['Apple', 'Cherry']);
    });

    it('filters the options while typing and marks the selected ones', async () => {
        const { fixture, input } = await setup({ autoComplete: false });
        await userEvent.type(input, 'a');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Apple', 'Apricot']);
        await userEvent.clear(input);
        await userEvent.keyboard('{ArrowDown}');
        await fixture.whenStable();
        expect(options()).toHaveLength(4);
        expect(options()[2].getAttribute('aria-selected')).toBe('true');
        expect(document.querySelector('ul[role=listbox][aria-multiselectable=true]')).not.toBeNull();
    });

    it('toggles options by click and with Enter on the highlighted option', async () => {
        const { fixture, host, input } = await setup();
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        await fixture.whenStable();
        await userEvent.click(options()[0]);
        expect(host.control.value).toEqual(['Banana', 'Apple']);
        expect(document.activeElement).toBe(input);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(input.getAttribute('aria-activedescendant')).toBe(options()[2].id);
        await userEvent.keyboard('{Enter}');
        expect(host.control.value).toEqual(['Apple']);
        await fixture.whenStable();
        expect(tokens()).toEqual(['Apple']);
    });

    it('selects the first match with Enter and clears the search', async () => {
        const { fixture, host, input } = await setup();
        input.focus();
        await userEvent.keyboard('ch');
        await fixture.whenStable();
        await wait();
        expect(input.value).toBe('Cherry');
        await userEvent.keyboard('{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toEqual(['Banana', 'Cherry']);
        expect(input.value).toBe('');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('adds new tokens when allowed', async () => {
        const { fixture, host, input } = await setup({ allowNew: true, autoComplete: false });
        await userEvent.type(input, 'Mango{Enter}');
        await fixture.whenStable();
        expect(host.control.value).toEqual(['Banana', 'Mango']);
        expect(tokens()).toEqual(['Banana', 'Mango']);
    });

    it('removes tokens with the close icon and Backspace', async () => {
        const { fixture, host, input } = await setup();
        host.control.setValue(['Apple', 'Banana']);
        await fixture.whenStable();
        await userEvent.click(document.querySelector<HTMLElement>('fd-token [aria-hidden=true]')!);
        expect(host.control.value).toEqual(['Banana']);
        input.focus();
        await userEvent.keyboard('{Backspace}{Backspace}');
        await fixture.whenStable();
        expect(host.control.value).toEqual([]);
    });

    it('closes with Escape and marks the control touched when the focus leaves', async () => {
        const { fixture, host, root, input } = await setup();
        await userEvent.type(input, 'b');
        await fixture.whenStable();
        await userEvent.keyboard('{Escape}');
        await fixture.whenStable();
        expect(input.getAttribute('aria-expanded')).toBe('false');
        await userEvent.click(root.querySelector('button:not([fdButton])')!);
        expect(host.control.touched).toBe(true);
    });

    it('shows the placeholder while nothing is selected', async () => {
        const { host, input, stable } = await render(SignalHost);
        expect(input.getAttribute('placeholder')).toBe('Search fruits');
        host.placeholder.set('Type a fruit');
        await stable();
        expect(input.getAttribute('placeholder')).toBe('Type a fruit');
        host.control.setValue(['Apple']);
        await stable();
        expect(input.hasAttribute('placeholder')).toBe(false);
    });

    it('emits searchTermChange while typing and when the search clears', async () => {
        const { host, input, stable } = await render(SignalHost);
        await userEvent.type(input, 'ap');
        await stable();
        expect(host.terms).toEqual(['a', 'ap']);
        expect(optionTexts()).toEqual(['Apple', 'Apricot']);
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(host.terms).toEqual(['a', 'ap', '']);
    });

    it('the addon button opens and closes the list and keeps the focus in the input', async () => {
        const { host, input, addon, stable } = await render(SignalHost);
        await userEvent.click(addon());
        await stable();
        expect(listOpen()).toBe(true);
        expect(optionTexts()).toHaveLength(4);
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(addon().getAttribute('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(input);
        expect(host.addonClicks()).toBe(1);
        await userEvent.click(addon());
        await stable();
        expect(listOpen()).toBe(false);
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(host.addonClicks()).toBe(2);
    });

    it('openDropdownOnAddOnClicked=false only emits addOnButtonClicked', async () => {
        const { host, input, addon, stable } = await render(SignalHost, (h) => h.openOnAddon.set(false));
        await userEvent.click(addon());
        await stable();
        expect(host.addonClicks()).toBe(1);
        expect(listOpen()).toBe(false);
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(host.multiInput().open()).toBe(false);
    });

    it('Show All lists every option after filtering and clears the search', async () => {
        const { host, input, stable } = await render(SignalHost);
        await userEvent.type(input, 'b');
        await stable();
        expect(optionTexts()).toEqual(['Banana']);
        const showAll = document.querySelector<HTMLAnchorElement>('.cdk-overlay-container a[href]')!;
        expect(showAll.textContent?.trim()).toBe('Show All (4)');
        await userEvent.click(showAll);
        await stable();
        expect(optionTexts()).toEqual(['Apple', 'Apricot', 'Banana', 'Cherry']);
        expect(input.value).toBe('');
        expect(host.terms.at(-1)).toBe('');
        expect(document.activeElement).toBe(input);
        expect(document.querySelector('.cdk-overlay-container a[href]')).toBeNull();
    });

    it('displayFn and valueFn map objects to tokens and values', async () => {
        const { host, input, stable } = await render(ObjectHost);
        expect(tokens()).toEqual(['Monitor']);
        await userEvent.type(input, 'm');
        await stable();
        expect(optionTexts()).toEqual(['Monitor', 'Mouse']);
        expect(options()[0].getAttribute('aria-selected')).toBe('true');
        await userEvent.click(options()[1]);
        await stable();
        expect(host.selected()).toEqual([2, 3]);
        expect(tokens()).toEqual(['Monitor', 'Mouse']);
    });

    it('keeps the selection when dropdownValues change', async () => {
        const { host, input, stable } = await render(SignalHost, (h) => {
            h.values.set(['foo', 'baz', 'bar']);
            h.control.setValue(['foo1']);
        });
        expect(tokens()).toEqual(['foo1']);
        input.focus();
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(optionTexts()).toEqual(['foo', 'baz', 'bar']);
        await userEvent.click(options()[1]);
        await stable();
        expect(host.control.value).toEqual(['foo1', 'baz']);
        host.values.set(['foo1']);
        await stable();
        expect(optionTexts()).toEqual(['foo1']);
        expect(options()[0].getAttribute('aria-selected')).toBe('true');
        expect(host.control.value).toEqual(['foo1', 'baz']);
        expect(tokens()).toEqual(['foo1', 'baz']);
    });

    it('select all and deselect all emit allItemsSelectedChange', async () => {
        const { host, stable } = await render(SignalHost);
        expect(host.allSelected).toEqual([false]);
        host.multiInput().selectAllItems(true);
        await stable();
        expect(host.control.value).toEqual(['Apple', 'Apricot', 'Banana', 'Cherry']);
        expect(tokens()).toHaveLength(4);
        expect(host.allSelected).toEqual([false, true]);
        host.multiInput().selectAllItems(false);
        await stable();
        expect(host.control.value).toEqual([]);
        expect(host.allSelected).toEqual([false, true, false]);
    });

    it('a disabled multi input is not focusable or clickable until re-enabled', async () => {
        const { host, root, input, addon, stable } = await render(SignalHost, (h) => h.control.setValue(['Apple']));
        host.control.disable();
        await stable();
        const field = root.querySelector<HTMLElement>('fd-tokenizer > div')!;
        expect(input.disabled).toBe(true);
        expect(getComputedStyle(field).pointerEvents).toBe('none');
        expect(Number(getComputedStyle(field).opacity)).toBeLessThan(1);
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(root.querySelector('#after'));
        addon().click();
        await stable();
        expect(listOpen()).toBe(false);
        host.control.enable();
        await stable();
        expect(input.disabled).toBe(false);
        expect(getComputedStyle(field).pointerEvents).not.toBe('none');
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(input);
    });

    it('renders maxVisibleTokens tokens plus "+N more" until focused, and collapses on an outside blur', async () => {
        const { host, root, input, more, stable } = await render(SignalHost, (h) => {
            h.width.set(2400);
            h.values.set(values(50));
            h.control.setValue(values(50));
        });
        expect(host.multiInput().maxVisibleTokens()).toBe(12);
        expect(tokens()).toHaveLength(12);
        expect(more()).toHaveLength(1);
        expect(more()[0].textContent?.trim()).toBe('38 more');

        input.focus();
        await stable();
        expect(tokens()).toHaveLength(50);
        expect(more()).toHaveLength(0);

        // a click on a token stays inside the multi input
        await userEvent.click(root.querySelector<HTMLElement>('fd-token')!);
        await stable();
        expect(tokens()).toHaveLength(50);

        await userEvent.click(root.querySelector<HTMLElement>('#after')!);
        await stable();
        expect(tokens()).toHaveLength(12);
        expect(more()).toHaveLength(1);

        host.control.setValue(values(8));
        await stable();
        expect(tokens()).toHaveLength(8);
        expect(more()).toHaveLength(0);
    });

    it('"+N more" is a button activated by Enter and Space', async () => {
        const { root, input, more, stable } = await render(SignalHost, (h) => {
            h.width.set(2400);
            h.values.set(values(20));
            h.control.setValue(values(20));
            h.maxVisible.set(5);
        });
        const after = root.querySelector<HTMLElement>('#after')!;
        for (const key of ['{Enter}', ' ']) {
            expect(tokens()).toHaveLength(5);
            const link = more()[0];
            expect(link.getAttribute('role')).toBe('button');
            expect(link.getAttribute('tabindex')).toBe('0');
            expect(link.textContent?.trim()).toBe('15 more');
            let prevented: boolean | null = null;
            link.addEventListener('keydown', (e) => setTimeout(() => (prevented = e.defaultPrevented)));
            link.focus();
            await userEvent.keyboard(key);
            await stable();
            expect(tokens()).toHaveLength(20);
            expect(more()).toHaveLength(0);
            // the list shows only the selected values and the focus moves to the input
            expect(optionTexts()).toHaveLength(20);
            expect(options().every((o) => o.getAttribute('aria-selected') === 'true')).toBe(true);
            expect(document.activeElement).toBe(input);
            if (key === ' ') expect(prevented).toBe(true);
            await userEvent.keyboard('{Escape}');
            after.focus();
            await stable();
        }
    });

    it('the mobile dialog applies the selection on approve and restores it on cancel', async () => {
        const { host, input, addon, stable } = await render(SignalHost, (h) => {
            h.mobile.set(true);
            h.control.setValue(['Banana']);
        });
        const dialog = () => document.querySelector<HTMLElement>('[role=dialog]');
        // the emphasized button also holds a hidden "Default Action" text
        const footerButton = (label: string) =>
            [...dialog()!.querySelectorAll<HTMLButtonElement>('fd-dialog-footer button')].find((b) =>
                b.textContent?.trim().startsWith(label)
            )!;
        const changes: (string[] | null)[] = [];
        host.control.valueChanges.subscribe((v) => changes.push(v));

        await userEvent.click(addon());
        await stable();
        expect(dialog()).not.toBeNull();
        expect(dialog()!.querySelector('h1')!.textContent).toBe('Fruits');
        await userEvent.click(options()[0]);
        await stable();
        expect(host.multiInput().selected()).toEqual(['Banana', 'Apple']);
        expect(changes).toEqual([]);
        await userEvent.click(footerButton('Cancel'));
        await stable();
        await wait();
        await expect.poll(dialog).toBeNull();
        expect(host.multiInput().selected()).toEqual(['Banana']);
        expect(host.control.value).toEqual(['Banana']);
        expect(changes).toEqual([]);
        expect(tokens()).toEqual(['Banana']);

        await userEvent.click(addon());
        await stable();
        await userEvent.click(options()[3]);
        await stable();
        expect(changes).toEqual([]);
        await userEvent.click(footerButton('Select'));
        await stable();
        await wait();
        await expect.poll(dialog).toBeNull();
        expect(changes).toEqual([['Banana', 'Cherry']]);
        expect(host.control.value).toEqual(['Banana', 'Cherry']);
        expect(tokens()).toEqual(['Banana', 'Cherry']);
        expect(document.activeElement).toBe(input);
    });
});
