import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Avatar } from '@/ui/avatar/avatar';
import type { Placement } from '@/ui/popover/popover';
import { AvatarGroup, AvatarGroupItem, type AvatarGroupOrientation, type AvatarGroupType } from './avatar-group';

interface Person {
    name: string;
    force?: boolean;
}

const NAMES = [
    'Alexander Hamilton',
    'Benjamin Franklin',
    'Charlotte Bronte',
    'Dorothy Hodgkin',
    'Emmy Noether',
    'Frida Kahlo',
    'Grace Hopper',
    'Hedy Lamarr',
    'Isaac Newton',
    'Jane Austen',
    'Katherine Johnson',
    'Leonardo Vinci'
];

@Component({
    imports: [AvatarGroup, AvatarGroupItem, Avatar],
    template: `
        <button id="before">Before</button>
        <div id="wrapper" [style.width.px]="width()" [style.padding-top.px]="offset()">
            <fd-avatar-group
                size="s"
                [type]="type()"
                [orientation]="orientation()"
                [placement]="placement()"
                [maxVisibleItems]="max()"
                [ariaLabel]="ariaLabel()"
                overflowPopoverTitle="Team members"
                (visibleCountChange)="visibleCount.set($event)"
            >
                @for (p of people(); track p.name) {
                    <fd-avatar
                        *fdAvatarGroupItem="details; title: p.name; forceVisibility: !!p.force"
                        circle
                        border
                        size="s"
                        [label]="p.name"
                        [attr.data-name]="p.name"
                    />
                    <ng-template #details>
                        <div class="details p-4">
                            <span class="details-name">{{ p.name }}</span>
                            <button class="details-action">Message {{ p.name }}</button>
                        </div>
                    </ng-template>
                }
            </fd-avatar-group>
        </div>
    `
})
class Host {
    readonly width = signal(300);
    /** Room above the group, for popovers centred next to it. */
    readonly offset = signal(0);
    readonly type = signal<AvatarGroupType>('individual');
    readonly orientation = signal<AvatarGroupOrientation>('horizontal');
    readonly placement = signal<Placement | undefined>(undefined);
    readonly max = signal<number | null>(null);
    readonly ariaLabel = signal<string | null>(null);
    readonly people = signal<Person[]>(NAMES.map((name) => ({ name })));
    readonly visibleCount = signal(-1);
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup(configure?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    const stable = async () => {
        for (let i = 0; i < 3; i++) {
            await fixture.whenStable();
            await frame();
        }
        await fixture.whenStable();
    };
    await stable();
    const root = fixture.nativeElement as HTMLElement;
    const group = root.querySelector<HTMLElement>('fd-avatar-group')!;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        group,
        stable,
        /** Names of the avatars shown in the group (not in the popover). */
        visible: () =>
            [...group.querySelectorAll<HTMLElement>('[data-avatar-group-item] fd-avatar')].map(
                (a) => a.dataset['name']
            ),
        overflow: () => group.querySelector<HTMLElement>('[data-avatar-group-overflow]'),
        overflowTrigger: () => group.querySelector<HTMLElement>('[data-avatar-group-overflow] [role=button]'),
        body: () => document.querySelector<HTMLElement>('.cdk-overlay-container [role=dialog]'),
        update: async (change: (host: Host) => void) => {
            change(fixture.componentInstance);
            await stable();
        }
    };
}

@Component({
    imports: [AvatarGroup, AvatarGroupItem, Avatar],
    template: `
        @for (shape of shapes; track $index) {
            <div style="width: 1000px">
                <fd-avatar-group size="s" [maxVisibleItems]="2" [overflowButtonShape]="shape!">
                    @for (name of names; track name) {
                        <fd-avatar *fdAvatarGroupItem circle size="s" [label]="name" />
                    }
                </fd-avatar-group>
            </div>
        }
        <div style="width: 1000px">
            <fd-avatar-group id="default-shape" size="s" [maxVisibleItems]="2">
                @for (name of names; track name) {
                    <fd-avatar *fdAvatarGroupItem circle size="s" [label]="name" />
                }
            </fd-avatar-group>
        </div>
    `
})
class ShapeHost {
    readonly names = NAMES.slice(0, 4);
    readonly shapes = ['circle', 'square'] as const;
}

describe('AvatarGroup', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'));

    it('shows as many avatars as fit and moves the rest into the overflow button ("+N")', async () => {
        const { host, group, visible, overflow } = await setup();
        const shown = visible();
        expect(shown.length).toBeGreaterThan(2);
        expect(shown.length).toBeLessThan(NAMES.length);
        expect(shown).toEqual(NAMES.slice(0, shown.length));
        expect(overflow()!.textContent!.trim()).toBe(`+${NAMES.length - shown.length}`);
        expect(host.visibleCount()).toBe(shown.length);

        // everything fits inside the group, and one more avatar would not
        const right = group.getBoundingClientRect().right;
        expect(overflow()!.getBoundingClientRect().right).toBeLessThanOrEqual(right);
        const avatar = group.querySelector('fd-avatar')!.getBoundingClientRect().width;
        expect(overflow()!.getBoundingClientRect().right + avatar).toBeGreaterThan(right - avatar);

        // a list of avatars, the overflow button is the last item
        const list = group.querySelector('[role=list]')!;
        const items = list.querySelectorAll(':scope > [role=listitem]');
        expect(items).toHaveLength(shown.length + 1);
        expect(items[items.length - 1]).toBe(overflow());
        expect(overflow()!.querySelector('[role=button]')!.getAttribute('aria-label')).toBe(
            `+${NAMES.length - shown.length} more`
        );
    });

    it('shows all avatars without overflow button when they fit', async () => {
        const { visible, overflow } = await setup((h) => h.width.set(1000));
        expect(visible()).toEqual(NAMES);
        expect(overflow()).toBeNull();
    });

    it('maxVisibleItems caps the visible avatars; fdAvatarGroupItemForceVisibility keeps an avatar visible', async () => {
        const { visible, overflow, update } = await setup((h) => {
            h.width.set(1000);
            h.max.set(5);
        });
        // the overflow button takes the last slot
        expect(visible()).toEqual(NAMES.slice(0, 4));
        expect(overflow()!.textContent!.trim()).toBe('+8');

        await update((h) => h.people.set(NAMES.map((name, i) => ({ name, force: i === 9 }))));
        expect(visible()).toEqual([NAMES[9], ...NAMES.slice(0, 3)]);
        expect(overflow()!.textContent!.trim()).toBe('+8');

        // forced avatars stay even when space is short
        await update((h) => {
            h.max.set(null);
            h.width.set(120);
        });
        expect(visible()).toContain(NAMES[9]);
    });

    it('overflow count is wrapped in <bdi dir="ltr"> so "+8" stays readable in RTL', async () => {
        const { overflow, stable } = await setup((h) => {
            h.width.set(1000);
            h.max.set(5);
        });
        const bdi = overflow()!.querySelector('bdi')!;
        expect(bdi.getAttribute('dir')).toBe('ltr');
        expect(bdi.textContent).toBe('+8');

        document.documentElement.dir = 'rtl';
        await stable();
        const range = document.createRange();
        range.setStart(bdi.firstChild!, 0);
        range.setEnd(bdi.firstChild!, 1);
        const plus = range.getBoundingClientRect();
        range.setStart(bdi.firstChild!, 1);
        range.setEnd(bdi.firstChild!, 2);
        // "+" stays left of the digit
        expect(plus.left).toBeLessThan(range.getBoundingClientRect().left);
    });

    it('individual type: each avatar opens its details popover', async () => {
        const { group, body, stable } = await setup();
        const triggers = [...group.querySelectorAll<HTMLElement>('[data-avatar-group-item] [role=button]')];
        expect(triggers.length).toBeGreaterThan(2);
        expect(triggers[1].getAttribute('aria-haspopup')).toBe('dialog');
        expect(triggers[1].getAttribute('tabindex')).toBe('0');

        await userEvent.click(triggers[1]);
        await stable();
        expect(body()!.querySelector('.details-name')!.textContent).toBe(NAMES[1]);
        // the details dialog is named by the avatar's title
        expect(body()!.getAttribute('aria-label')).toBe(NAMES[1]);
        // focus moves into the details
        await wait(50);
        expect(body()!.contains(document.activeElement)).toBe(true);

        await userEvent.keyboard('{Escape}');
        await stable();
        expect(body()).toBeNull();
        expect(document.activeElement).toBe(triggers[1]);

        // keyboard: Enter opens the popover of the focused avatar
        triggers[2].focus();
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(body()!.querySelector('.details-name')!.textContent).toBe(NAMES[2]);
        await userEvent.keyboard('{Escape}');
        await stable();
        await userEvent.keyboard(' ');
        await stable();
        expect(body()!.querySelector('.details-name')!.textContent).toBe(NAMES[2]);
        await userEvent.keyboard('{Escape}');
        await stable();
    });

    it('group type: the whole group opens the list of all avatars', async () => {
        const { group, body, stable } = await setup((h) => h.type.set('group'));
        const trigger = group.querySelector<HTMLElement>('[role=button]')!;
        // one trigger only; the avatars overlap
        expect(group.querySelectorAll('[role=button]')).toHaveLength(1);
        const avatars = [...trigger.querySelectorAll<HTMLElement>('fd-avatar')];
        expect(avatars[1].getBoundingClientRect().left).toBeLessThan(avatars[0].getBoundingClientRect().right);

        await userEvent.click(trigger);
        await stable();
        const items = body()!.querySelectorAll('[role=list] > [role=listitem]');
        expect(items).toHaveLength(NAMES.length);
        expect(body()!.querySelector('[role=heading]')!.textContent).toBe('Team members');
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(body()).toBeNull();

        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(body()).not.toBeNull();
        await userEvent.keyboard('{Escape}');
        await stable();
    });

    it('overflow popover: list stage → details stage → back button returns and restores focus', async () => {
        const { overflowTrigger, body, stable } = await setup((h) => {
            h.width.set(1000);
            h.max.set(5);
        });
        await userEvent.click(overflowTrigger()!);
        await stable();
        const heading = () => body()!.querySelector('[role=heading]')!.textContent;
        const items = () => [...body()!.querySelectorAll<HTMLElement>('[role=list] > [role=listitem]')];
        expect(heading()).toBe('Team members');
        expect(body()!.getAttribute('aria-label')).toBe('Team members');
        expect(items().map((i) => i.querySelector<HTMLElement>('fd-avatar')!.dataset['name'])).toEqual(NAMES.slice(4));
        expect(items()[0].getAttribute('aria-haspopup')).toBe('dialog');

        // details of the third hidden avatar, by keyboard
        items()[2].focus();
        await userEvent.keyboard('{Enter}');
        await stable();
        expect(heading()).toBe(NAMES[6]);
        expect(body()!.querySelector('.details-name')!.textContent).toBe(NAMES[6]);
        expect(body()!.querySelector('[role=list]')).toBeNull();
        // focus moves to the first focusable element: the back button
        const back = body()!.querySelector<HTMLElement>('button[aria-label="Back"]')!;
        expect(document.activeElement).toBe(back);

        await userEvent.click(back);
        await stable();
        expect(heading()).toBe('Team members');
        expect(document.activeElement).toBe(items()[2]);

        // Space works as well
        await userEvent.keyboard(' ');
        await stable();
        expect(heading()).toBe(NAMES[6]);
        await userEvent.keyboard('{Escape}');
        await stable();
        expect(body()).toBeNull();
        expect(document.activeElement).toBe(overflowTrigger());
    });

    it('re-measures when the container resizes or items change', async () => {
        const { host, visible, overflow, update } = await setup();
        const before = visible().length;
        await update((h) => h.width.set(500));
        await new Promise((resolve) => setTimeout(resolve, 50));
        await update(() => {});
        expect(visible().length).toBeGreaterThan(before);
        expect(host.visibleCount()).toBe(visible().length);

        await update((h) => h.width.set(160));
        await update(() => {});
        expect(visible().length).toBeLessThan(before);
        expect(overflow()!.textContent!.trim()).toBe(`+${NAMES.length - visible().length}`);

        await update((h) => {
            h.width.set(500);
            h.people.set(NAMES.slice(0, 3).map((name) => ({ name })));
        });
        await update(() => {});
        expect(visible()).toEqual(NAMES.slice(0, 3));
        expect(overflow()).toBeNull();
    });

    it('group trigger has an accessible name built from the visible avatars', async () => {
        const { group, update } = await setup((h) => h.type.set('group'));
        const trigger = group.querySelector<HTMLElement>('[role=button]')!;
        const name = trigger.querySelector('.sr-only-sap')!;
        expect(name.textContent!.trim()).toBe(`Avatar group, ${NAMES.length} avatars`);
        // the avatars and the overflow count do not add to the name
        for (const el of trigger.querySelectorAll('[data-avatar-group-item], [data-avatar-group-overflow]'))
            expect(el.getAttribute('aria-hidden')).toBe('true');

        await update((h) => h.ariaLabel.set('Project team'));
        expect(name.textContent!.trim()).toBe('Project team');

        // individual groups label their list
        await update((h) => {
            h.type.set('individual');
            h.ariaLabel.set(null);
        });
        expect(group.querySelector('[role=list]')!.getAttribute('aria-label')).toBe('Individual avatar group');
    });

    it('the overflow button is square by default and circular with overflowButtonShape=circle', async () => {
        const fixture = TestBed.createComponent(ShapeHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await frame();
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const buttons = [...root.querySelectorAll<HTMLElement>('[data-avatar-group-overflow] [role=button] > span')];
        const radius = (el: HTMLElement) => parseFloat(getComputedStyle(el).borderTopLeftRadius);
        const [circle, square, byDefault] = buttons;
        expect(buttons).toHaveLength(3);
        expect(radius(circle)).toBeGreaterThanOrEqual(circle.getBoundingClientRect().width / 2);
        expect(radius(square)).toBeLessThan(square.getBoundingClientRect().width / 2);
        expect(radius(byDefault)).toBe(radius(square));
        fixture.destroy();
    });

    it('vertical groups open their popovers to the right unless placement is set', async () => {
        const { group, body, stable, update } = await setup((h) => {
            h.type.set('group');
            h.width.set(1000);
            h.max.set(4);
            h.offset.set(200);
        });
        const trigger = () => group.querySelector<HTMLElement>('[role=button]')!;
        /** Opens the group popover and returns where it is relative to the trigger. */
        const side = async () => {
            await userEvent.click(trigger());
            await stable();
            const t = trigger().getBoundingClientRect();
            const b = body()!.getBoundingClientRect();
            await userEvent.keyboard('{Escape}');
            await stable();
            if (b.left >= t.right - 1) return 'right';
            if (b.top >= t.bottom - 1) return 'bottom';
            if (b.bottom <= t.top + 1) return 'top';
            return 'other';
        };
        expect(await side()).toBe('bottom');
        await update((h) => h.orientation.set('vertical'));
        expect(await side()).toBe('right');
        await update((h) => h.placement.set('bottom'));
        expect(await side()).toBe('bottom');
        await update((h) => h.placement.set(undefined));
        expect(await side()).toBe('right');

        // the details popovers of an individual vertical group open to the right as well
        await update((h) => h.type.set('individual'));
        const avatar = group.querySelector<HTMLElement>('[data-avatar-group-item] [role=button]')!;
        await userEvent.click(avatar);
        await stable();
        expect(body()!.getBoundingClientRect().left).toBeGreaterThanOrEqual(avatar.getBoundingClientRect().right - 1);
        await userEvent.keyboard('{Escape}');
        await stable();
    });

    it('focusing an avatar of an individual group announces its position', async () => {
        const { group, overflowTrigger } = await setup((h) => {
            h.width.set(1000);
            h.max.set(5);
        });
        const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce');
        const triggers = [...group.querySelectorAll<HTMLElement>('[data-avatar-group-item] [role=button]')];
        expect(triggers).toHaveLength(4);
        triggers[1].focus();
        expect(announce).toHaveBeenLastCalledWith('2 of 5');
        // the overflow button is the last item of the list
        overflowTrigger()!.focus();
        expect(announce).toHaveBeenLastCalledWith('5 of 5');
        announce.mockRestore();
    });

    it('a maxVisibleItems larger than what fits still leaves room for the overflow button', async () => {
        const { group, visible, overflow } = await setup((h) => h.max.set(10));
        const shown = visible().length;
        expect(shown).toBeLessThan(10);
        expect(overflow()!.textContent!.trim()).toBe(`+${NAMES.length - shown}`);
        expect(overflow()!.getBoundingClientRect().right).toBeLessThanOrEqual(group.getBoundingClientRect().right);
    });
});
