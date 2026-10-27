import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
    Notification,
    NotificationBody,
    NotificationContent,
    NotificationFooter,
    NotificationGroup,
    NotificationGroupHeader,
    NotificationGroupHeaderTitle,
    NotificationGroupList,
    NotificationHeader,
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
});
