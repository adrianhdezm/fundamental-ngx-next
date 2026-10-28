import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FdDate } from '@/lib/datetime';
import { Time } from './time';

@Component({
    imports: [Time],
    template: `
        <fd-time
            id="t"
            [(time)]="time"
            [meridian]="meridian()"
            [minuteStep]="step()"
            [displaySeconds]="seconds()"
            [keepTwoDigits]="twoDigits()"
            [spinnerButtons]="spinners()"
            [tablet]="tablet()"
        />
    `
})
class Host {
    readonly time = signal(new FdDate(2024, 3, 9, 14, 30, 15));
    readonly meridian = signal(false);
    readonly step = signal(1);
    readonly seconds = signal(true);
    readonly twoDigits = signal(false);
    readonly spinners = signal(true);
    readonly tablet = signal(false);
}

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const column = (name: string) => root.querySelector<HTMLElement>(`#t-${name}`)!;
    const shown = (name: string) =>
        [...column(name).querySelectorAll('[data-displayed-value]')].map((item) => item.textContent!.trim());
    return { fixture, host: fixture.componentInstance, root, column, shown, stable: () => fixture.whenStable() };
}

describe('Time', () => {
    it('shows spinbutton columns; the active one shows a window around the value', async () => {
        const { root, column, shown } = await setup();
        expect(root.querySelector('fd-time')!.getAttribute('role')).toBe('group');
        const hours = column('hours');
        expect(hours.getAttribute('role')).toBe('spinbutton');
        expect(hours.getAttribute('aria-label')).toBe('Hours');
        expect(hours.getAttribute('aria-valuetext')).toBe('14');
        expect(shown('hours')).toEqual(['11', '12', '13', '14', '15', '16', '17']);
        // inactive columns show only their value
        expect(shown('minutes')).toEqual([]);
        expect(column('minutes').textContent!.trim()).toBe('30');
        expect(root.querySelectorAll('button[aria-label="Decrease hours"]')).toHaveLength(1);
    });

    it('changes the active column with Up and Down, wrapping around', async () => {
        const { host, column, shown, stable } = await setup((h) => h.time.set(new FdDate(2024, 3, 9, 23, 0, 0)));
        column('hours').focus();
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(host.time().hour).toBe(0);
        expect(shown('hours')[3]).toBe('0');
        await userEvent.keyboard('{ArrowUp}{ArrowUp}');
        await stable();
        expect(host.time().hour).toBe(22);
        // the date stays
        expect(host.time().toDateString()).toBe('2024-03-09');
    });

    it('moves between the columns with Left and Right', async () => {
        const { host, column, shown, stable } = await setup();
        column('hours').focus();
        await userEvent.keyboard('{ArrowRight}');
        await stable();
        expect(document.activeElement).toBe(column('minutes'));
        expect(shown('minutes')[3]).toBe('30');
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(host.time().minute).toBe(31);
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        await stable();
        expect(document.activeElement).toBe(column('seconds'));
    });

    it('picks a clicked value and steps with the spinner buttons', async () => {
        const { host, root, column, stable } = await setup();
        await userEvent.click(column('hours').querySelector('[data-displayed-value="16"]')!);
        await stable();
        expect(host.time().hour).toBe(16);
        await userEvent.click(root.querySelector('button[aria-label="Increase hours"]')!);
        await stable();
        expect(host.time().hour).toBe(17);
        // a click on an inactive column activates it
        await userEvent.click(column('seconds'));
        await stable();
        expect(root.querySelector('button[aria-label="Decrease seconds"]')).not.toBeNull();
    });

    it('takes typed digits', async () => {
        const { host, column, stable } = await setup();
        column('hours').focus();
        await userEvent.keyboard('9');
        await new Promise((resolve) => setTimeout(resolve, 600));
        await stable();
        expect(host.time().hour).toBe(9);
        await userEvent.keyboard('21');
        await stable();
        expect(host.time().hour).toBe(21);
    });

    it('splits the day into periods with a 12-hour clock', async () => {
        const { host, column, shown, stable } = await setup((h) => {
            h.meridian.set(true);
            h.twoDigits.set(true);
        });
        expect(column('hours').getAttribute('aria-valuetext')).toBe('02');
        expect(column('period').textContent!.trim()).toBe('PM');
        column('period').focus();
        await stable();
        // the short period column does not wrap
        expect(shown('period')).toEqual(['AM', 'PM']);
        await userEvent.keyboard('a');
        await stable();
        expect(host.time().hour).toBe(2);
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(host.time().hour).toBe(14);
    });

    it('steps minutes', async () => {
        const { host, column, shown, stable } = await setup((h) => {
            h.step.set(15);
            h.time.set(new FdDate(2024, 3, 9, 10, 20, 0));
        });
        column('minutes').focus();
        await stable();
        expect(column('minutes').getAttribute('aria-valuetext')).toBe('15');
        expect(shown('minutes')).toEqual(['0', '15', '30', '45']);
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(host.time().minute).toBe(30);
    });

    it('switches the period when the hours step across 11 and 12', async () => {
        const { host, column, stable } = await setup((h) => {
            h.meridian.set(true);
            h.time.set(new FdDate(2024, 3, 9, 11, 0, 0));
        });
        expect(column('period').textContent!.trim()).toBe('AM');
        column('hours').focus();
        await userEvent.keyboard('{ArrowDown}');
        await stable();
        expect(host.time().hour).toBe(12);
        expect(column('hours').getAttribute('aria-valuetext')).toBe('12');
        expect(column('period').getAttribute('aria-valuetext')).toBe('PM');
        await userEvent.keyboard('{ArrowUp}');
        await stable();
        expect(host.time().hour).toBe(11);
        expect(column('period').getAttribute('aria-valuetext')).toBe('AM');
    });

    it('moves within a column with Page Up, Page Down, Home and End', async () => {
        const { host, column, stable } = await setup((h) => h.time.set(new FdDate(2024, 3, 9, 10, 0, 0)));
        column('hours').focus();
        await userEvent.keyboard('{PageDown}');
        await stable();
        // a page is the seven values shown
        expect(host.time().hour).toBe(17);
        await userEvent.keyboard('{PageUp}{PageUp}');
        await stable();
        expect(host.time().hour).toBe(3);
        await userEvent.keyboard('{End}');
        await stable();
        expect(host.time().hour).toBe(23);
        await userEvent.keyboard('{Home}');
        await stable();
        expect(host.time().hour).toBe(0);
    });

    it('steps the active column with the mouse wheel', async () => {
        const { host, column, stable } = await setup();
        const wheel = (target: HTMLElement, deltaY: number) => {
            const event = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true });
            target.dispatchEvent(event);
            return event;
        };
        expect(wheel(column('hours'), 100).defaultPrevented).toBe(true);
        await stable();
        expect(host.time().hour).toBe(15);
        wheel(column('hours'), -100);
        wheel(column('hours'), -100);
        await stable();
        expect(host.time().hour).toBe(13);
        // an inactive column leaves the wheel to the page
        expect(wheel(column('minutes'), 100).defaultPrevented).toBe(false);
        await stable();
        expect(host.time().minute).toBe(30);
    });

    it('changes the value when a column is dragged', async () => {
        const { host, column, stable } = await setup();
        const hours = column('hours');
        const itemHeight = hours.querySelector<HTMLElement>('[data-displayed-value]')!.getBoundingClientRect().height;
        const { left, top } = hours.getBoundingClientRect();
        const pointer = (type: string, target: EventTarget, clientY: number) =>
            target.dispatchEvent(
                new PointerEvent(type, { button: 0, clientX: left + 10, clientY, bubbles: true, pointerId: 1 })
            );
        const start = top + 3 * itemHeight + 10;
        pointer('pointerdown', hours, start);
        // dragging up by two values shows later hours
        pointer('pointermove', document, start - 2 * itemHeight - 1);
        pointer('pointerup', document, start - 2 * itemHeight - 1);
        await stable();
        expect(host.time().hour).toBe(16);
        pointer('pointerdown', hours, start);
        pointer('pointermove', document, start + itemHeight + 1);
        pointer('pointerup', document, start + itemHeight + 1);
        await stable();
        expect(host.time().hour).toBe(15);
    });

    it('hides the spinner buttons with spinnerButtons false', async () => {
        const { root, stable, fixture } = await setup();
        expect(root.querySelectorAll('fd-time-column button')).toHaveLength(2);
        fixture.componentInstance.spinners.set(false);
        await stable();
        expect(root.querySelectorAll('fd-time-column button')).toHaveLength(0);
    });

    it('uses smaller paddings and larger compact values for tablets', async () => {
        const { root, column, fixture, stable } = await setup();
        const time = root.querySelector<HTMLElement>('fd-time')!;
        const itemHeight = () =>
            column('hours').querySelector<HTMLElement>('[data-displayed-value]')!.getBoundingClientRect().height;
        expect(getComputedStyle(time).paddingTop).toBe('16px');
        time.setAttribute('data-density', 'compact');
        await stable();
        expect(itemHeight()).toBe(32);
        fixture.componentInstance.tablet.set(true);
        await stable();
        expect(getComputedStyle(time).paddingTop).toBe('8px');
        // tablets keep touch-sized values in compact density
        expect(itemHeight()).toBe(46);
    });
});

@Component({
    imports: [Time, ReactiveFormsModule],
    template: `<fd-time [formControl]="control" /><button id="after">After</button>`
})
class FormHost {
    readonly control = new FormControl<FdDate | null>(new FdDate(2024, 1, 1, 8, 15, 0));
}

describe('Time forms', () => {
    it('writes, reads and disables', async () => {
        const fixture = TestBed.createComponent(FormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const hours = root.querySelector<HTMLElement>('[role=spinbutton]')!;
        expect(hours.getAttribute('aria-valuetext')).toBe('8');
        hours.focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(fixture.componentInstance.control.value!.hour).toBe(9);
        fixture.componentInstance.control.disable();
        await fixture.whenStable();
        expect(hours.getAttribute('aria-disabled')).toBe('true');
        await userEvent.keyboard('{ArrowDown}');
        expect(fixture.componentInstance.control.value!.hour).toBe(9);
    });

    it('marks the control touched when the focus leaves the time', async () => {
        const fixture = TestBed.createComponent(FormHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const control = fixture.componentInstance.control;
        root.querySelector<HTMLElement>('[role=spinbutton]')!.focus();
        // moving between the columns stays inside
        await userEvent.keyboard('{ArrowRight}');
        await fixture.whenStable();
        expect(control.touched).toBe(false);
        root.querySelector<HTMLElement>('#after')!.focus();
        await fixture.whenStable();
        expect(control.touched).toBe(true);
    });
});
