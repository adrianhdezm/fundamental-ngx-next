import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Button } from '@/ui/button/button';
import { iconGlyphChar } from '@/ui/icon/icon';
import {
    Notification,
    NotificationActions,
    NotificationBody,
    NotificationContent,
    NotificationFooter,
    NotificationGroup,
    NotificationGroupHeader,
    NotificationGroupGrowingItem,
    NotificationGroupGrowingItemTitle,
    NotificationGroupHeaderTitle,
    NotificationGroupList,
    NotificationHeader,
    NotificationList,
    NotificationParagraph,
    NotificationRef,
    NotificationService,
    NotificationTitle
} from './notification';

const PARTS = [
    Notification,
    NotificationBody,
    NotificationContent,
    NotificationHeader,
    NotificationTitle,
    NotificationParagraph,
    NotificationFooter
];
const LONG = 'A very long text that needs more than two lines in a narrow notification. '.repeat(6);

@Component({
    imports: [
        ...PARTS,
        NotificationGroup,
        NotificationGroupHeader,
        NotificationGroupHeaderTitle,
        NotificationGroupList
    ],
    template: `
        <div style="width: 20rem">
            <fd-notification-group>
                <fd-notification-group-header
                    ><span fd-notification-group-header-title>Today</span></fd-notification-group-header
                >
                <fd-notification-group-list>
                    @for (n of [1, 2, 3]; track n) {
                        <fd-notification>
                            <fd-notification-body>
                                <fd-notification-content>
                                    <fd-notification-header
                                        ><h4 fd-notification-title>Title {{ n }}</h4></fd-notification-header
                                    >
                                    <p fd-notification-paragraph>{{ n === 1 ? long : 'Short' }}</p>
                                    <fd-notification-footer><span>Source</span></fd-notification-footer>
                                </fd-notification-content>
                            </fd-notification-body>
                        </fd-notification>
                    }
                </fd-notification-group-list>
            </fd-notification-group>
        </div>
    `
})
class GroupHost {
    readonly long = LONG;
}

@Component({
    imports: [Notification, NotificationBody, NotificationContent, NotificationHeader, NotificationTitle],
    template: `
        <fd-notification>
            <fd-notification-body>
                <fd-notification-content>
                    <fd-notification-header
                        ><h4 fd-notification-title>{{ ref.data }}</h4></fd-notification-header
                    >
                </fd-notification-content>
            </fd-notification-body>
        </fd-notification>
    `
})
class BannerContent {
    readonly ref = inject(NotificationRef);
}

@Component({
    imports: [...PARTS, NotificationActions, Button],
    template: `
        <fd-notification>
            <fd-notification-body>
                <fd-notification-content>
                    @if (withHeader()) {
                        <fd-notification-header id="first-header"
                            ><h4 fd-notification-title>First</h4></fd-notification-header
                        >
                        <fd-notification-header id="second-header"
                            ><h4 fd-notification-title>Second</h4></fd-notification-header
                        >
                    }
                    <p fd-notification-paragraph>Text</p>
                </fd-notification-content>
                <fd-notification-actions>
                    <button fdButton id="btn1" glyph="accept" ariaLabel="Accept"></button>
                    <button fdButton id="btn2" glyph="decline" ariaLabel="Decline" aria-describedby="existing"></button>
                    @if (extra()) {
                        <button fdButton id="btn3" glyph="overflow" ariaLabel="More"></button>
                    }
                </fd-notification-actions>
            </fd-notification-body>
        </fd-notification>
    `
})
class ActionsHost {
    readonly withHeader = signal(true);
    readonly extra = signal(false);
}

@Component({
    imports: [
        Notification,
        NotificationBody,
        NotificationContent,
        NotificationHeader,
        NotificationTitle,
        NotificationActions,
        Button
    ],
    template: `
        <fd-notification>
            <fd-notification-body>
                <fd-notification-content>
                    <fd-notification-header><h4 fd-notification-title>Saved</h4></fd-notification-header>
                </fd-notification-content>
                <fd-notification-actions>
                    <button fdButton glyph="accept" ariaLabel="Approve"></button>
                    <button fdButton glyph="decline" ariaLabel="Close"></button>
                </fd-notification-actions>
            </fd-notification-body>
        </fd-notification>
    `
})
class BannerWithActions {}

@Component({
    imports: [
        ...PARTS,
        NotificationActions,
        NotificationList,
        NotificationGroup,
        NotificationGroupHeader,
        NotificationGroupHeaderTitle,
        NotificationGroupList,
        NotificationGroupGrowingItem,
        NotificationGroupGrowingItemTitle,
        Button
    ],
    template: `
        <ul fd-notification-list>
            <fd-notification-group>
                <fd-notification-group-header
                    ><span fd-notification-group-header-title>Today</span></fd-notification-group-header
                >
                <fd-notification-group-list>
                    @for (n of [1, 2, 3]; track n) {
                        <fd-notification [actionKeyHandler]="onKey">
                            <fd-notification-body>
                                <fd-notification-content>
                                    <fd-notification-header
                                        ><h4 fd-notification-title>Title {{ n }}</h4></fd-notification-header
                                    >
                                    <p fd-notification-paragraph>Text {{ n }}</p>
                                </fd-notification-content>
                                <fd-notification-actions>
                                    <button fdButton glyph="accept" [ariaLabel]="'Accept ' + n"></button>
                                    <button fdButton glyph="decline" [ariaLabel]="'Decline ' + n"></button>
                                </fd-notification-actions>
                            </fd-notification-body>
                        </fd-notification>
                    }
                </fd-notification-group-list>
                <fd-notification-group-growing-item ariaLabel="Show more notifications"
                    ><span fd-notification-group-growing-item-title>More</span></fd-notification-group-growing-item
                >
            </fd-notification-group>
        </ul>
        <fd-notification data-untitled>
            <fd-notification-body>
                <fd-notification-content><p fd-notification-paragraph>Only a description</p></fd-notification-content>
            </fd-notification-body>
        </fd-notification>
    `
})
class ListHost {
    readonly keys = signal<string[]>([]);
    readonly onKey = (_: KeyboardEvent, key: 'enter' | 'delete') => this.keys.update((k) => [...k, key]);
}

@Component({
    imports: [...PARTS],
    template: `
        <ng-template #tpl let-ref>
            <fd-notification>
                <fd-notification-body>
                    <fd-notification-content>
                        <fd-notification-header
                            ><h4 fd-notification-title>From a template {{ ref.data }}</h4></fd-notification-header
                        >
                    </fd-notification-content>
                </fd-notification-body>
            </fd-notification>
        </ng-template>
    `
})
class TemplateHost {
    readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
}

const wait = (ms = 80) => new Promise((r) => setTimeout(r, ms));

describe('Notification', () => {
    afterEach(() => TestBed.inject(NotificationService).destroyAll());

    it('expands a group from its header and lists its notifications', async () => {
        const fixture = TestBed.createComponent(GroupHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await wait();
        const el = fixture.nativeElement as HTMLElement;
        const header = el.querySelector<HTMLElement>('fd-notification-group-header')!;
        expect(header.getAttribute('aria-expanded')).toBe('false');
        expect(el.querySelectorAll('fd-notification')).toHaveLength(0);
        header.focus();
        await userEvent.keyboard('{Enter}');
        await fixture.whenStable();
        await wait();
        expect(header.getAttribute('aria-expanded')).toBe('true');
        expect(document.getElementById(header.getAttribute('aria-controls')!)!.getAttribute('role')).toBe('list');
        const items = [...el.querySelectorAll<HTMLElement>('fd-notification')];
        expect(items[0].getAttribute('role')).toBe('listitem');
        expect(document.getElementById(items[0].getAttribute('aria-labelledby')!)!.textContent).toBe('Title 1');

        items[0].focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(items[1]);
        await userEvent.keyboard('{End}');
        expect(document.activeElement).toBe(items[2]);
    });

    it('offers More/Less for truncated texts', async () => {
        const fixture = TestBed.createComponent(GroupHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await wait();
        (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('fd-notification-group-header')!.click();
        await fixture.whenStable();
        await wait(150);
        const [first, second] = [...(fixture.nativeElement as HTMLElement).querySelectorAll('fd-notification')];
        expect(second.querySelector('[role=button]')).toBeNull();
        const more = first.querySelector<HTMLElement>('fd-notification-footer [role=button]')!;
        expect(more.textContent!.trim()).toBe('More');
        const paragraph = first.querySelector<HTMLElement>('[fd-notification-paragraph]')!;
        const clamped = paragraph.getBoundingClientRect().height;
        await userEvent.click(more);
        await fixture.whenStable();
        expect(more.textContent!.trim()).toBe('Less');
        expect(more.getAttribute('aria-expanded')).toBe('true');
        expect(paragraph.getBoundingClientRect().height).toBeGreaterThan(clamped);
    });

    it('opens banners with the service, focuses them and returns the focus', async () => {
        const trigger = document.createElement('button');
        document.body.appendChild(trigger);
        trigger.focus();
        const service = TestBed.inject(NotificationService);
        const ref = service.open(BannerContent, { data: 'Saved', escKeyCloseable: true });
        await wait();
        const banner = document.querySelector<HTMLElement>('.cdk-overlay-container fd-notification')!;
        expect(banner.textContent!.trim()).toBe('Saved');
        expect(document.activeElement).toBe(banner);
        const result = new Promise((resolve) => ref.afterClosed.subscribe({ error: resolve }));
        await userEvent.keyboard('{Escape}');
        expect(await result).toBe('escape');
        await wait();
        expect(service.isAnyOpened()).toBe(false);
        expect(document.activeElement).toBe(trigger);
    });
    it('describes the action buttons by the first header and keeps existing descriptions', async () => {
        const fixture = TestBed.createComponent(ActionsHost);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await wait();
        const button = (id: string) => document.getElementById(id)!;
        expect(button('btn1').getAttribute('aria-describedby')).toBe('first-header');
        expect(button('btn2').getAttribute('aria-describedby')).toBe('existing');

        fixture.componentInstance.extra.set(true);
        await fixture.whenStable();
        await wait();
        expect(button('btn3').getAttribute('aria-describedby')).toBe('first-header');
        fixture.nativeElement.remove();
    });

    it('does not describe the action buttons without a header', async () => {
        const fixture = TestBed.createComponent(ActionsHost);
        fixture.componentInstance.withHeader.set(false);
        document.body.appendChild(fixture.nativeElement);
        await fixture.whenStable();
        await wait();
        expect(document.getElementById('btn1')!.hasAttribute('aria-describedby')).toBe(false);
        fixture.nativeElement.remove();
    });
    it('keeps Tab inside a banner without focusable aria-hidden anchors', async () => {
        const trigger = document.createElement('button');
        document.body.appendChild(trigger);
        trigger.focus();
        TestBed.inject(NotificationService).open(BannerWithActions);
        await wait();
        const banner = document.querySelector<HTMLElement>('.cdk-overlay-container fd-notification')!;
        const [approve, close] = [...banner.querySelectorAll('button')];
        expect(document.querySelector('.cdk-overlay-container .cdk-focus-trap-anchor')).toBeNull();
        expect(document.activeElement).toBe(banner);
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(approve);
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(close);
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(banner);
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(document.activeElement).toBe(close);
        trigger.remove();
    });
    describe('lists and groups', () => {
        async function render() {
            const fixture = TestBed.createComponent(ListHost);
            document.body.appendChild(fixture.nativeElement);
            await fixture.whenStable();
            await wait();
            const el = fixture.nativeElement as HTMLElement;
            const header = el.querySelector<HTMLElement>('fd-notification-group-header')!;
            const expand = async () => {
                header.click();
                await fixture.whenStable();
                await wait();
            };
            const items = () => [...el.querySelectorAll<HTMLElement>('fd-notification-group-list fd-notification')];
            return { fixture, el, header, expand, items };
        }

        afterEach(() => document.documentElement.removeAttribute('dir'));

        it('labels the list, the group, its heading and the growing item', async () => {
            const { fixture, el, header, expand } = await render();
            const list = el.querySelector<HTMLElement>('[fd-notification-list]')!;
            expect(list.getAttribute('role')).toBe('list');
            expect(list.getAttribute('aria-label')).toBe('Notifications');

            const title = el.querySelector<HTMLElement>('[fd-notification-group-header-title]')!;
            expect(title.getAttribute('role')).toBe('heading');
            expect(title.getAttribute('aria-level')).toBe('3');
            expect(header.getAttribute('title')).toBe('Expand/Collapse');

            const group = el.querySelector<HTMLElement>('fd-notification-group')!;
            expect(group.getAttribute('role')).toBe('listitem');
            expect(group.getAttribute('tabindex')).toBe('-1');
            expect(group.getAttribute('aria-level')).toBe('1');
            expect(group.getAttribute('aria-labelledby')).toBe(title.id);
            expect(group.getAttribute('aria-description')).toBe('Notification group collapsed');
            await expand();
            expect(group.getAttribute('aria-description')).toBe('Notification group expanded');

            const growing = el.querySelector<HTMLElement>('fd-notification-group-growing-item')!;
            expect(growing.getAttribute('role')).toBe('button');
            expect(growing.getAttribute('tabindex')).toBe('0');
            expect(growing.getAttribute('aria-label')).toBe('Show more notifications');
            fixture.destroy();
        });

        it('toggles the group header with Space and ignores other keys', async () => {
            const { fixture, header } = await render();
            header.focus();
            await userEvent.keyboard('{ }');
            await fixture.whenStable();
            expect(header.getAttribute('aria-expanded')).toBe('true');
            await userEvent.keyboard('a{ArrowDown}{Escape}');
            await fixture.whenStable();
            expect(header.getAttribute('aria-expanded')).toBe('true');
            await userEvent.keyboard('{ }');
            await fixture.whenStable();
            expect(header.getAttribute('aria-expanded')).toBe('false');
            fixture.destroy();
        });

        it('points the header arrow right when collapsed and down when expanded, mirrored in RTL', async () => {
            document.documentElement.setAttribute('dir', 'rtl');
            const { fixture, header, expand } = await render();
            const icon = header.querySelector<HTMLElement>('fd-icon')!;
            expect(icon.getAttribute('data-glyph')).toBe(iconGlyphChar('slim-arrow-right'));
            expect(getComputedStyle(icon).scale).toMatch(/^-1/);
            await expand();
            expect(icon.getAttribute('data-glyph')).toBe(iconGlyphChar('slim-arrow-down'));
            fixture.destroy();
        });

        it('moves between notifications with ArrowUp and Home', async () => {
            const { fixture, expand, items } = await render();
            await expand();
            const [first, second, third] = items();
            expect(second.getAttribute('aria-level')).toBe('2');
            third.focus();
            await userEvent.keyboard('{ArrowUp}');
            expect(document.activeElement).toBe(second);
            await userEvent.keyboard('{Home}');
            expect(document.activeElement).toBe(first);
            await userEvent.keyboard('{ArrowUp}');
            expect(document.activeElement).toBe(first);
            fixture.destroy();
        });

        it('keeps the focused action button column across notifications', async () => {
            const { fixture, expand } = await render();
            await expand();
            const button = (name: string) =>
                document.querySelector<HTMLElement>('fd-notification-actions button[aria-label="' + name + '"]')!;
            button('Decline 1').focus();
            await userEvent.keyboard('{ArrowDown}');
            expect(document.activeElement).toBe(button('Decline 2'));
            await userEvent.keyboard('{End}');
            expect(document.activeElement).toBe(button('Decline 3'));
            await userEvent.keyboard('{ArrowUp}');
            expect(document.activeElement).toBe(button('Decline 2'));
            fixture.destroy();
        });

        it('runs actionKeyHandler on Enter, Delete and Backspace but not on other keys or from nested buttons', async () => {
            const { fixture, expand, items } = await render();
            await expand();
            const keys = fixture.componentInstance.keys;
            items()[0].focus();
            await userEvent.keyboard('{Enter}{Delete}{Backspace}');
            expect(keys()).toEqual(['enter', 'delete', 'delete']);
            await userEvent.keyboard('a{ }{Escape}');
            expect(keys()).toEqual(['enter', 'delete', 'delete']);
            items()[0].querySelector<HTMLElement>('fd-notification-actions button')!.focus();
            await userEvent.keyboard('{Enter}{Delete}');
            expect(keys()).toEqual(['enter', 'delete', 'delete']);
            fixture.destroy();
        });

        it('labels a notification without a title by its paragraph', async () => {
            const { fixture } = await render();
            const untitled = document.querySelector<HTMLElement>('[data-untitled]')!;
            const paragraph = untitled.querySelector<HTMLElement>('[fd-notification-paragraph]')!;
            expect(untitled.getAttribute('aria-labelledby')).toBe(paragraph.id);
            fixture.destroy();
        });
    });

    it('opens a banner from a template and destroyAll closes every banner', async () => {
        const fixture = TestBed.createComponent(TemplateHost);
        await fixture.whenStable();
        const service = TestBed.inject(NotificationService);
        const closed: unknown[] = [];
        const refs = [
            service.open(fixture.componentInstance.tpl(), { data: 'A' }),
            service.open(fixture.componentInstance.tpl(), { data: 'B' }),
            service.open(BannerContent, { data: 'C' })
        ];
        refs.forEach((ref) => ref.afterClosed.subscribe({ next: (r) => closed.push(r ?? 'closed') }));
        await wait();
        const banners = () => [...document.querySelectorAll<HTMLElement>('.cdk-overlay-container fd-notification')];
        expect(banners().map((b) => b.textContent!.trim())).toEqual(['From a template A', 'From a template B', 'C']);
        expect(service.notifications()).toHaveLength(3);

        service.destroyAll();
        await wait();
        expect(closed).toEqual(['closed', 'closed', 'closed']);
        expect(service.isAnyOpened()).toBe(false);
        expect(banners()).toHaveLength(0);
    });
});
