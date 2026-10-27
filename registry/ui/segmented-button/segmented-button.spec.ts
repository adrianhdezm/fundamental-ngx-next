import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Button } from '@/ui/button/button';
import { SegmentedButton, type SegmentedButtonValue } from './segmented-button';

@Component({
    imports: [SegmentedButton, Button, FormsModule],
    template: `
        <button id="before">Before</button>
        <fd-segmented-button id="single" ariaLabel="Alignment" [(ngModel)]="model" [vertical]="vertical()">
            <button fdButton label="Left" value="left"></button>
            <button fdButton label="Middle" value="middle" [disabled]="middleDisabled()"></button>
            <button fdButton label="Right" value="right"></button>
        </fd-segmented-button>
        <button id="after">After</button>
        <span id="style-label">Text style</span>
        <fd-segmented-button id="multi" ariaLabelledBy="style-label" toggle [(value)]="styles">
            <button fdButton label="Bold" value="bold"></button>
            <button fdButton label="Italic" value="italic"></button>
            <button fdButton label="Underline" value="underline"></button>
        </fd-segmented-button>
    `
})
class Host {
    readonly model = signal<SegmentedButtonValue>('middle');
    readonly styles = signal<SegmentedButtonValue>(['bold']);
    readonly vertical = signal(false);
    readonly middleDisabled = signal(false);
}

@Component({
    imports: [SegmentedButton, Button, ReactiveFormsModule],
    template: `
        <fd-segmented-button ariaLabel="Size" [formControl]="control">
            <button fdButton label="S" value="s"></button>
            <button fdButton label="M" value="m"></button>
            @if (withLarge()) {
                <button fdButton label="L" value="l" disabled></button>
            }
        </fd-segmented-button>
    `
})
class ReactiveHost {
    readonly control = new FormControl<SegmentedButtonValue>('s');
    readonly withLarge = signal(false);
}

@Component({
    imports: [SegmentedButton, Button],
    template: `
        <fd-segmented-button ariaLabel="Views" [(value)]="view">
            @for (v of views(); track v) {
                <button fdButton [label]="v" [attr.value]="v"></button>
            }
        </fd-segmented-button>
    `
})
class DynamicHost {
    readonly view = signal<SegmentedButtonValue>('list');
    readonly views = signal(['list', 'grid']);
}

const frame = () => new Promise((r) => requestAnimationFrame(r));

async function render<T>(type: Type<T>, configure?: (host: T) => void) {
    const fixture = TestBed.createComponent(type);
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
    const buttons = (id: string) => [...root.querySelectorAll<HTMLButtonElement>(`#${id} > button`)];
    return { fixture, host: fixture.componentInstance, root, buttons, stable };
}

const selected = (buttons: HTMLElement[]) => buttons.map((b) => b.getAttribute('aria-selected'));

describe('SegmentedButton', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'));

    it('is a labelled listbox of options', async () => {
        const { root, buttons } = await render(Host);
        const single = root.querySelector('#single')!;
        expect(single.getAttribute('role')).toBe('listbox');
        expect(single.getAttribute('aria-label')).toBe('Alignment');
        expect(single.getAttribute('aria-multiselectable')).toBe('false');
        expect(single.getAttribute('aria-roledescription')).toBe('Segmented button group');
        const multi = root.querySelector('#multi')!;
        expect(multi.getAttribute('aria-labelledby')).toBe('style-label');
        expect(multi.hasAttribute('aria-label')).toBe(false);
        expect(multi.getAttribute('aria-multiselectable')).toBe('true');
        const options = buttons('single');
        expect(options.map((b) => b.getAttribute('role'))).toEqual(['option', 'option', 'option']);
        expect(options.map((b) => b.getAttribute('aria-posinset'))).toEqual(['1', '2', '3']);
        expect(options.every((b) => b.getAttribute('aria-setsize') === '3')).toBe(true);
        expect(options[0].getAttribute('aria-roledescription')).toBe('Segmented button');
    });

    it('ngModel: the selected button follows the model and a click selects', async () => {
        const { host, buttons, stable } = await render(Host);
        const options = buttons('single');
        expect(selected(options)).toEqual(['false', 'true', 'false']);
        await userEvent.click(options[2]);
        await stable();
        expect(host.model()).toBe('right');
        expect(selected(options)).toEqual(['false', 'false', 'true']);
        await userEvent.click(options[2]);
        await stable();
        expect(host.model()).toBe('right');
        host.model.set('left');
        await stable();
        expect(selected(options)).toEqual(['true', 'false', 'false']);
        host.model.set(null);
        await stable();
        expect(selected(options)).toEqual(['false', 'false', 'false']);
    });

    it('toggle mode allows several selected buttons and deselects on a second click', async () => {
        const { host, buttons, stable } = await render(Host);
        const options = buttons('multi');
        expect(selected(options)).toEqual(['true', 'false', 'false']);
        await userEvent.click(options[2]);
        await stable();
        expect(host.styles()).toEqual(['bold', 'underline']);
        expect(selected(options)).toEqual(['true', 'false', 'true']);
        await userEvent.click(options[0]);
        await stable();
        expect(host.styles()).toEqual(['underline']);
        expect(selected(options)).toEqual(['false', 'false', 'true']);
    });

    it('reactive forms: value, touched and disable()', async () => {
        const { host, root, stable } = await render(ReactiveHost);
        const options = [...root.querySelectorAll<HTMLButtonElement>('fd-segmented-button > button')];
        expect(selected(options)).toEqual(['true', 'false']);
        await userEvent.click(options[1]);
        await stable();
        expect(host.control.value).toBe('m');
        expect(host.control.dirty).toBe(true);
        options[1].blur();
        expect(host.control.touched).toBe(true);
        host.control.disable();
        await stable();
        expect(root.querySelector('fd-segmented-button')!.getAttribute('aria-disabled')).toBe('true');
        expect(options.every((b) => b.disabled)).toBe(true);
        expect(options.every((b) => b.tabIndex === -1)).toBe(true);
        options[0].click();
        await stable();
        expect(host.control.value).toBe('m');
        host.control.enable();
        host.control.setValue('s');
        await stable();
        expect(options.every((b) => !b.disabled)).toBe(true);
        expect(selected(options)).toEqual(['true', 'false']);
    });

    it('the selected button is the only tab stop', async () => {
        const { root, buttons } = await render(Host);
        const options = buttons('single');
        expect(options.map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
        root.querySelector<HTMLElement>('#before')!.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(options[1]);
        await userEvent.tab();
        expect(document.activeElement).toBe(root.querySelector('#after'));
    });

    it('without a selection the first button is the tab stop', async () => {
        const { buttons } = await render(Host, (h) => h.model.set(null));
        expect(buttons('single').map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    });

    it('arrow keys, Home and End move focus (roving tabindex); Space and Enter select', async () => {
        const { host, buttons, stable } = await render(Host);
        const options = buttons('single');
        options[1].focus();
        await userEvent.keyboard('{ArrowRight}');
        await stable();
        expect(document.activeElement).toBe(options[2]);
        expect(options.map((b) => b.tabIndex)).toEqual([-1, -1, 0]);
        expect(host.model()).toBe('middle');
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(options[2]);
        await userEvent.keyboard('{Home}');
        await stable();
        expect(document.activeElement).toBe(options[0]);
        await userEvent.keyboard(' ');
        await stable();
        expect(host.model()).toBe('left');
        await userEvent.keyboard('{End}');
        await userEvent.keyboard('{ArrowLeft}');
        await stable();
        expect(document.activeElement).toBe(options[1]);
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(host.model()).toBe('middle');
    });

    it('arrow keys are mirrored in RTL', async () => {
        document.documentElement.setAttribute('dir', 'rtl');
        const { buttons } = await render(Host);
        const options = buttons('single');
        options[1].focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(options[2]);
        await userEvent.keyboard('{ArrowRight}');
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(options[0]);
    });

    it('arrow keys skip disabled buttons, which cannot be selected', async () => {
        const { host, buttons, stable } = await render(Host, (h) => {
            h.middleDisabled.set(true);
            h.model.set('left');
        });
        const options = buttons('single');
        expect(options[1].disabled).toBe(true);
        options[1].click();
        await stable();
        expect(host.model()).toBe('left');
        options[0].focus();
        await userEvent.keyboard('{ArrowRight}');
        await stable();
        expect(document.activeElement).toBe(options[2]);
        expect(options.map((b) => b.tabIndex)).toEqual([-1, -1, 0]);
        await userEvent.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(options[0]);
    });

    it('vertical orientation stacks the buttons and uses ArrowUp/ArrowDown', async () => {
        const { root, buttons, stable } = await render(Host, (h) => h.vertical.set(true));
        const group = root.querySelector('#single')!;
        expect(group.getAttribute('aria-orientation')).toBe('vertical');
        const options = buttons('single');
        const [a, b] = options.map((o) => o.getBoundingClientRect());
        expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
        expect(b.left).toBe(a.left);
        options[1].focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(options[1]);
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(document.activeElement).toBe(options[2]);
        await userEvent.keyboard('{ArrowUp}');
        expect(document.activeElement).toBe(options[1]);
    });

    it('horizontal orientation lays the buttons out in a row', async () => {
        const { root, buttons } = await render(Host);
        expect(root.querySelector('#single')!.getAttribute('aria-orientation')).toBe('horizontal');
        const [a, b] = buttons('single').map((o) => o.getBoundingClientRect());
        expect(b.left).toBeGreaterThanOrEqual(a.right - 1);
        expect(b.top).toBe(a.top);
    });

    it('an individually disabled button stays disabled after the group is re-enabled', async () => {
        const { host, root, stable } = await render(ReactiveHost, (h) => h.withLarge.set(true));
        const options = [...root.querySelectorAll<HTMLButtonElement>('fd-segmented-button > button')];
        expect(options.map((b) => b.disabled)).toEqual([false, false, true]);
        host.control.disable();
        await stable();
        expect(options.every((b) => b.disabled)).toBe(true);
        host.control.enable();
        await stable();
        expect(options.map((b) => b.disabled)).toEqual([false, false, true]);
        options[2].click();
        await stable();
        expect(host.control.value).toBe('s');
    });

    it('a button added after render gets option role, posinset and setsize, and setsize updates on the others', async () => {
        const { host, root, stable } = await render(DynamicHost);
        const options = () => [...root.querySelectorAll<HTMLButtonElement>('fd-segmented-button > button')];
        expect(options().map((b) => b.getAttribute('aria-setsize'))).toEqual(['2', '2']);
        host.views.set(['list', 'grid', 'table']);
        await stable();
        const added = options()[2];
        expect(added.getAttribute('role')).toBe('option');
        expect(added.getAttribute('aria-roledescription')).toBe('Segmented button');
        expect(options().map((b) => b.getAttribute('aria-posinset'))).toEqual(['1', '2', '3']);
        expect(options().map((b) => b.getAttribute('aria-setsize'))).toEqual(['3', '3', '3']);
        expect(selected(options())).toEqual(['true', 'false', 'false']);
        await userEvent.click(added);
        await stable();
        expect(host.view()).toBe('table');
        expect(selected(options())).toEqual(['false', 'false', 'true']);
        host.views.set(['grid', 'table']);
        await stable();
        expect(options().map((b) => b.getAttribute('aria-posinset'))).toEqual(['1', '2']);
        expect(options().map((b) => b.getAttribute('aria-setsize'))).toEqual(['2', '2']);
    });
});
