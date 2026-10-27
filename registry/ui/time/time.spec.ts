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
        />
    `
})
class Host {
    readonly time = signal(new FdDate(2024, 3, 9, 14, 30, 15));
    readonly meridian = signal(false);
    readonly step = signal(1);
    readonly seconds = signal(true);
    readonly twoDigits = signal(false);
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
});

@Component({
    imports: [Time, ReactiveFormsModule],
    template: `<fd-time [formControl]="control" />`
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
});
