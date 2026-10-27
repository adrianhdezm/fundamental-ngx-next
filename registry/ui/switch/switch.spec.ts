import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Switch } from './switch';

@Component({
    imports: [Switch, FormsModule],
    template: `
        <fd-switch
            id="wifi"
            [(ngModel)]="model"
            [semantic]="semantic()"
            [disabled]="disabled()"
            [activeText]="activeText()"
            [inactiveText]="inactiveText()"
            ariaLabelledBy="ext"
            >Wi-Fi</fd-switch
        >
        <span id="ext">External</span>
        <fd-switch id="two-way" [(checked)]="checked" (checkedChange)="changes.set([...changes(), $event])"
            >Two-way</fd-switch
        >
    `
})
class Host {
    readonly model = signal(false);
    readonly semantic = signal(false);
    readonly disabled = signal(false);
    readonly activeText = signal('');
    readonly inactiveText = signal('');
    readonly checked = signal(true);
    readonly changes = signal<boolean[]>([]);
}

@Component({
    imports: [Switch, ReactiveFormsModule],
    template: `<fd-switch [formControl]="control">Reactive</fd-switch>`
})
class ReactiveHost {
    readonly control = new FormControl(true);
}

const frame = () => new Promise((r) => requestAnimationFrame(r));

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
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
    const wifi = root.querySelector<HTMLElement>('#wifi')!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        wifi,
        input: wifi.querySelector<HTMLInputElement>('input')!,
        label: wifi.querySelector<HTMLLabelElement>('label')!,
        slider: wifi.querySelector<HTMLElement>('label > span > span')!,
        stable
    };
}

describe('Switch', () => {
    afterEach(() => document.documentElement.removeAttribute('data-density'));

    it('renders a native checkbox with role switch and aria-checked', async () => {
        const { input, label } = await setup();
        expect(input.type).toBe('checkbox');
        expect(input.getAttribute('role')).toBe('switch');
        expect(input.getAttribute('aria-checked')).toBe('false');
        expect(input.id).toBe('wifi-input');
        expect(label.textContent).toContain('Wi-Fi');
        expect(input.getAttribute('aria-labelledby')).toBe('ext');
    });

    it('works with ngModel: click and Space toggle the model, the model updates the switch', async () => {
        const { host, input, label, stable } = await setup();
        await userEvent.click(label);
        await stable();
        expect(host.model()).toBe(true);
        expect(input.checked).toBe(true);
        expect(input.getAttribute('aria-checked')).toBe('true');
        expect(document.activeElement).toBe(input);
        await userEvent.keyboard(' ');
        await stable();
        expect(host.model()).toBe(false);
        expect(input.getAttribute('aria-checked')).toBe('false');
        host.model.set(true);
        await stable();
        expect(input.checked).toBe(true);
    });

    it('works with reactive forms, including disable() and touched', async () => {
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
        input.blur();
        expect(control.touched).toBe(true);
        control.disable();
        await fixture.whenStable();
        expect(input.disabled).toBe(true);
        label.click();
        await fixture.whenStable();
        expect(control.value).toBe(false);
    });

    it('[(checked)] two-way binds and emits checkedChange', async () => {
        const { host, root, stable } = await setup();
        const input = root.querySelector<HTMLInputElement>('#two-way input')!;
        expect(input.checked).toBe(true);
        await userEvent.click(root.querySelector('#two-way label')!);
        await stable();
        expect(host.checked()).toBe(false);
        expect(host.changes()).toEqual([false]);
        host.checked.set(true);
        await stable();
        expect(input.getAttribute('aria-checked')).toBe('true');
    });

    it('the handle slides to the other side when switched on', async () => {
        const { host, slider, stable } = await setup();
        const handle = slider.querySelector<HTMLElement>('span[role=presentation]')!;
        const off = handle.getBoundingClientRect().left - slider.getBoundingClientRect().left;
        host.model.set(true);
        await stable();
        const on = handle.getBoundingClientRect().left - slider.getBoundingClientRect().left;
        expect(on).toBeGreaterThan(off);
    });

    it('the handle position mirrors in RTL', async () => {
        const { slider, stable, wifi } = await setup();
        const handle = slider.querySelector<HTMLElement>('span[role=presentation]')!;
        const centre = (el: HTMLElement) => el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2;
        const ltrOffset = centre(handle) - centre(slider);
        wifi.setAttribute('dir', 'rtl');
        await stable();
        const rtlOffset = centre(handle) - centre(slider);
        expect(Math.sign(rtlOffset)).toBe(-Math.sign(ltrOffset));
    });

    it('semantic shows accept/decline glyphs and announces the state', async () => {
        const { host, input, root, wifi, stable } = await setup((h) => h.semantic.set(true));
        const icons = [...wifi.querySelectorAll<HTMLElement>('fd-icon')];
        expect(icons).toHaveLength(2);
        const [accept, decline] = icons;
        expect(getComputedStyle(accept).visibility).toBe('hidden');
        expect(getComputedStyle(decline).visibility).toBe('visible');
        const semanticLabel = root.querySelector<HTMLElement>('#wifi-semantic-label')!;
        expect(input.getAttribute('aria-labelledby')).toBe('ext wifi-semantic-label');
        expect(semanticLabel.textContent!.trim()).toBe('Decline');
        host.model.set(true);
        await stable();
        expect(getComputedStyle(accept).visibility).toBe('visible');
        expect(getComputedStyle(decline).visibility).toBe('hidden');
        expect(semanticLabel.textContent!.trim()).toBe('Accept');
    });

    it('the semantic switch uses different track colours than the standard one', async () => {
        const { host, slider, stable } = await setup();
        const standard = getComputedStyle(slider).backgroundColor;
        host.semantic.set(true);
        await stable();
        expect(getComputedStyle(slider).backgroundColor).not.toBe(standard);
    });

    it('activeText and inactiveText replace the icons', async () => {
        const { host, wifi, stable } = await setup((h) => {
            h.activeText.set('on');
            h.inactiveText.set('off');
        });
        expect(wifi.querySelectorAll('fd-icon')).toHaveLength(0);
        const texts = [...wifi.querySelectorAll<HTMLElement>('label span')].filter(
            (s) => s.children.length === 0 && /^(on|off)$/.test(s.textContent!.trim())
        );
        expect(texts).toHaveLength(2);
        const visibleText = () =>
            texts.filter((t) => getComputedStyle(t).visibility === 'visible').map((t) => t.innerText);
        expect(visibleText()).toEqual(['OFF']);
        host.model.set(true);
        await stable();
        expect(visibleText()).toEqual(['ON']);
    });

    it('disabled stops changes and dims the switch', async () => {
        const { host, input, label, stable } = await setup((h) => h.disabled.set(true));
        expect(input.disabled).toBe(true);
        expect(Number(getComputedStyle(label).opacity)).toBeLessThan(1);
        label.click();
        await stable();
        expect(host.model()).toBe(false);
    });

    it('compact density makes the track smaller', async () => {
        const { slider, stable } = await setup();
        expect(slider.getBoundingClientRect().height).toBe(24);
        expect(slider.getBoundingClientRect().width).toBe(40);
        document.documentElement.setAttribute('data-density', 'compact');
        await stable();
        expect(slider.getBoundingClientRect().height).toBe(20);
        expect(slider.getBoundingClientRect().width).toBe(32);
    });
});
