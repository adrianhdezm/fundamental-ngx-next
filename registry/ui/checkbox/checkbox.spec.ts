import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Checkbox, type CheckboxValues, type FormState } from './checkbox';

@Component({
    imports: [Checkbox, FormsModule],
    template: `
        <fd-checkbox
            label="Accept terms"
            [(ngModel)]="model"
            [disabled]="disabled()"
            [state]="state()"
            [readonly]="readonly()"
            [displayOnly]="displayOnly()"
            [tristate]="tristate()"
            [tristateSelectable]="tristateSelectable()"
            [values]="values()"
            [wrapLabel]="wrapLabel()"
            [valignLabel]="valignLabel()"
            [required]="required()"
            (valueChange)="changes.set([...changes(), $event])"
            (click)="hostClicks.set(hostClicks() + 1)"
        />
        <button id="after">After</button>
    `
})
class NgModelHost {
    readonly model = signal<unknown>(false);
    readonly disabled = signal(false);
    readonly state = signal<FormState | null>(null);
    readonly readonly = signal(false);
    readonly displayOnly = signal(false);
    readonly tristate = signal(false);
    readonly tristateSelectable = signal(false);
    readonly values = signal<CheckboxValues | null>(null);
    readonly wrapLabel = signal(false);
    readonly valignLabel = signal<'top' | 'middle'>('middle');
    readonly required = signal(false);
    readonly changes = signal<unknown[]>([]);
    readonly hostClicks = signal(0);
}

@Component({
    imports: [Checkbox, ReactiveFormsModule],
    template: `<fd-checkbox label="Reactive" [formControl]="control" />`
})
class ReactiveHost {
    readonly control = new FormControl<unknown>(true);
}

@Component({
    imports: [Checkbox],
    template: `
        <div style="width: 120px">
            <fd-checkbox [label]="label" wrapLabel [valignLabel]="valign()" />
        </div>
    `
})
class WrapHost {
    readonly label = 'A very long label text that has to wrap onto several lines';
    readonly valign = signal<'top' | 'middle'>('middle');
}

const frame = () => new Promise((r) => requestAnimationFrame(r));

async function setup(configure?: (host: NgModelHost) => void) {
    const fixture = TestBed.createComponent(NgModelHost);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        input: root.querySelector<HTMLInputElement>('input[type=checkbox]')!,
        label: root.querySelector<HTMLLabelElement>('label')!,
        box: root.querySelector<HTMLElement>('label > span[aria-hidden=true]')!,
        stable
    };
}

describe('Checkbox', () => {
    afterEach(() => document.documentElement.removeAttribute('data-density'));

    it('works with ngModel: clicks write the model and model changes update the box', async () => {
        const { host, input, label, stable } = await setup();
        expect(input.checked).toBe(false);
        expect(input.getAttribute('aria-checked')).toBe('false');
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(true);
        expect(input.checked).toBe(true);
        expect(input.getAttribute('aria-checked')).toBe('true');
        expect(host.changes()).toEqual([true]);
        host.model.set(false);
        await stable();
        expect(input.checked).toBe(false);
        expect(input.getAttribute('aria-checked')).toBe('false');
    });

    it('works with reactive forms, including the disabled state', async () => {
        const fixture = TestBed.createComponent(ReactiveHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const control = fixture.componentInstance.control;
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector('input')!;
        const label = root.querySelector('label')!;
        expect(input.checked).toBe(true);
        await userEvent.click(label);
        await fixture.whenStable();
        expect(control.value).toBe(false);
        expect(control.dirty).toBe(true);
        input.blur();
        expect(control.touched).toBe(true);
        control.disable();
        await fixture.whenStable();
        expect(input.disabled).toBe(true);
        expect(input.getAttribute('aria-disabled')).toBe('true');
        label.click();
        await fixture.whenStable();
        expect(control.value).toBe(false);
        control.enable();
        control.setValue(true);
        await fixture.whenStable();
        expect(input.disabled).toBe(false);
        expect(input.checked).toBe(true);
    });

    it('the disabled input stops changes', async () => {
        const { host, input, label, stable } = await setup((h) => h.disabled.set(true));
        expect(input.disabled).toBe(true);
        expect(getComputedStyle(label).pointerEvents).toBe('none');
        label.click();
        await stable();
        expect(host.model()).toBe(false);
    });

    it('Space toggles the focused checkbox', async () => {
        const { host, input, stable } = await setup();
        input.focus();
        await userEvent.keyboard(' ');
        await stable();
        expect(host.model()).toBe(true);
        await userEvent.keyboard(' ');
        await stable();
        expect(host.model()).toBe(false);
    });

    it('the label click toggles and the host (click) fires once', async () => {
        const { host, label, box, stable } = await setup();
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(true);
        expect(host.hostClicks()).toBe(1);
        await userEvent.click(box);
        await stable();
        expect(host.model()).toBe(false);
        expect(host.hostClicks()).toBe(2);
        expect(label.htmlFor).toBe(label.parentElement!.querySelector('input')!.id);
    });

    it('tristate cycles unchecked → indeterminate → checked → unchecked when tristateSelectable', async () => {
        const { host, input, label, stable } = await setup((h) => {
            h.tristate.set(true);
            h.tristateSelectable.set(true);
        });
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(null);
        expect(input.indeterminate).toBe(true);
        expect(input.getAttribute('aria-checked')).toBe('mixed');
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(true);
        expect(input.indeterminate).toBe(false);
        expect(input.getAttribute('aria-checked')).toBe('true');
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(false);
        expect(input.getAttribute('aria-checked')).toBe('false');
        expect(host.changes()).toEqual([null, true, false]);
    });

    it('a tristate checkbox that is not selectable leaves the mixed state but never returns to it', async () => {
        const { host, input, label, stable } = await setup((h) => {
            h.tristate.set(true);
            h.model.set(null);
        });
        expect(input.getAttribute('aria-checked')).toBe('mixed');
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(true);
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(false);
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(true);
    });

    it('without tristate, the third state value shows as unchecked', async () => {
        const { input } = await setup((h) => h.model.set(null));
        expect(input.indeterminate).toBe(false);
        expect(input.getAttribute('aria-checked')).toBe('false');
    });

    it('custom values map to checked, unchecked and indeterminate', async () => {
        const { host, input, label, stable } = await setup((h) => {
            h.values.set({ trueValue: 'yes', falseValue: 'no', thirdStateValue: { partial: 1 } });
            h.tristate.set(true);
            h.tristateSelectable.set(true);
            h.model.set('no');
        });
        expect(input.getAttribute('aria-checked')).toBe('false');
        await userEvent.click(label);
        await stable();
        expect(host.model()).toEqual({ partial: 1 });
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe('yes');
        expect(input.checked).toBe(true);
        host.model.set({ partial: 1 });
        await stable();
        expect(input.getAttribute('aria-checked')).toBe('mixed');
        host.model.set('no');
        await stable();
        expect(input.getAttribute('aria-checked')).toBe('false');
    });

    it('error state sets aria-invalid; other states colour the box but are valid', async () => {
        const { host, input, box, stable } = await setup();
        const defaultBorder = getComputedStyle(box).borderColor;
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        const borders = new Set<string>([defaultBorder]);
        for (const state of ['error', 'warning', 'success', 'information'] as const) {
            host.state.set(state);
            await stable();
            expect(input.getAttribute('aria-invalid')).toBe(state === 'error' ? 'true' : null);
            borders.add(getComputedStyle(box).borderColor);
        }
        expect(borders.size).toBe(5);
    });

    it('clearing the state removes the state colour and aria-invalid', async () => {
        const { host, input, box, stable } = await setup();
        const defaultBorder = getComputedStyle(box).borderColor;
        host.state.set('error');
        await stable();
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(getComputedStyle(box).borderColor).not.toBe(defaultBorder);

        host.state.set(null);
        await stable();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(getComputedStyle(box).borderColor).toBe(defaultBorder);

        host.state.set('warning');
        await stable();
        expect(getComputedStyle(box).borderColor).not.toBe(defaultBorder);
        host.state.set('default');
        await stable();
        expect(input.hasAttribute('aria-invalid')).toBe(false);
        expect(getComputedStyle(box).borderColor).toBe(defaultBorder);
    });

    it('readonly keeps the value, stays focusable and sets aria-readonly', async () => {
        const { host, input, label, stable } = await setup((h) => {
            h.readonly.set(true);
            h.model.set(true);
        });
        expect(input.getAttribute('aria-readonly')).toBe('true');
        expect(input.disabled).toBe(false);
        label.click();
        await stable();
        expect(host.model()).toBe(true);
        input.focus();
        expect(document.activeElement).toBe(input);
        await userEvent.keyboard(' ');
        await stable();
        expect(host.model()).toBe(true);
        expect(input.checked).toBe(true);
        expect(host.changes()).toEqual([]);
    });

    it('displayOnly shows the value as a glyph without a box and ignores clicks', async () => {
        const { host, input, label, box, stable } = await setup((h) => h.displayOnly.set(true));
        expect(input.disabled).toBe(true);
        const unchecked = box.getAttribute('data-glyph');
        expect(unchecked).toBeTruthy();
        expect(getComputedStyle(box).borderTopWidth).toBe('0px');
        expect(getComputedStyle(label).opacity).toBe('1');
        label.click();
        await stable();
        expect(host.model()).toBe(false);
        host.model.set(true);
        await stable();
        expect(box.getAttribute('data-glyph')).toBeTruthy();
        expect(box.getAttribute('data-glyph')).not.toBe(unchecked);
    });

    it('a checked box shows the check glyph; unchecked shows none', async () => {
        const { host, box, stable } = await setup();
        expect(box.hasAttribute('data-glyph')).toBe(false);
        host.model.set(true);
        await stable();
        expect(box.getAttribute('data-glyph')).toBeTruthy();
    });

    it('required sets aria-required', async () => {
        const { input } = await setup((h) => h.required.set(true));
        expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('compact density shrinks the box', async () => {
        const { box, stable } = await setup();
        expect(box.getBoundingClientRect().width).toBe(22);
        document.documentElement.setAttribute('data-density', 'compact');
        await stable();
        expect(box.getBoundingClientRect().width).toBe(16);
    });

    it('wrapLabel lets long labels wrap; valignLabel top aligns the box with the first line', async () => {
        const fixture = TestBed.createComponent(WrapHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const label = root.querySelector('label')!;
        const box = label.querySelector<HTMLElement>('span[aria-hidden=true]')!;
        const text = box.nextElementSibling as HTMLElement;
        expect(text.getBoundingClientRect().height).toBeGreaterThan(30);
        const labelRect = label.getBoundingClientRect();
        const middleOffset = box.getBoundingClientRect().top - labelRect.top;
        fixture.componentInstance.valign.set('top');
        await fixture.whenStable();
        const topOffset = box.getBoundingClientRect().top - label.getBoundingClientRect().top;
        expect(topOffset).toBeLessThan(middleOffset);
    });

    it('focus and blur emit focusChange', async () => {
        const fixture = TestBed.createComponent(NgModelHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const checkbox = fixture.debugElement.children[0].componentInstance as Checkbox;
        const events: boolean[] = [];
        checkbox.focusChange.subscribe((v) => events.push(v));
        checkbox.focus();
        expect(document.activeElement).toBe((fixture.nativeElement as HTMLElement).querySelector('input'));
        await userEvent.tab();
        expect(events).toEqual([true, false]);
    });
});
