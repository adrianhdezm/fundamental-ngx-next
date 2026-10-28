import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { RadioButton } from '@/ui/radio/radio';
import {
    List,
    ListByline,
    ListBylineLeft,
    ListBylineRight,
    ListContent,
    ListFooter,
    ListGroupHeader,
    ListIcon,
    ListItem,
    ListLink,
    ListMessage,
    ListSecondary,
    ListSubline,
    ListThumbnail,
    ListTitle,
    ListTitleText,
    type FocusEscapeDirection
} from './list';

const IMPORTS = [
    List,
    ListItem,
    ListTitle,
    ListTitleText,
    ListSecondary,
    ListIcon,
    ListLink,
    ListGroupHeader,
    ListFooter,
    ListMessage,
    ListContent,
    ListByline,
    ListBylineLeft,
    ListBylineRight,
    ListThumbnail,
    ListSubline,
    Checkbox,
    RadioButton,
    FormsModule
];

@Component({
    imports: IMPORTS,
    template: `
        <button data-testid="before">Before</button>
        <ul fd-list aria-label="Keyboard" [keyboardSupport]="keyboard()" (focusEscapeList)="escapes.push($event)">
            <li fd-list-group-header><span fd-list-title>Group</span></li>
            @for (item of items(); track item) {
                <li fd-list-item>
                    <span fd-list-title>{{ item }}</span>
                    @if (item === 'Two') {
                        <input aria-label="Field" data-testid="field" />
                    }
                </li>
            }
        </ul>
        <button data-testid="after">After</button>
    `
})
class KeyboardHost {
    readonly items = signal(['One', 'Two', 'Three', 'Four']);
    readonly keyboard = signal(true);
    readonly escapes: FocusEscapeDirection[] = [];
}

@Component({
    imports: IMPORTS,
    template: `
        <ul fd-list selection role="listbox" aria-multiselectable="true" aria-label="Multi">
            @for (item of multi; track item.label) {
                <li fd-list-item>
                    <fd-checkbox [(ngModel)]="item.selected" [ariaLabel]="item.label" />
                    <span fd-list-title>{{ item.label }}</span>
                </li>
            }
        </ul>
        <ul fd-list selection role="listbox" aria-label="Single" selectedLabel="Chosen" notSelectedLabel="Not chosen">
            @for (v of radios; track v) {
                <li fd-list-item>
                    <fd-radio-button name="list-radio" [value]="v" [(ngModel)]="single" [ariaLabel]="v" />
                    <span fd-list-title>{{ v }}</span>
                </li>
            }
        </ul>
    `
})
class SelectionHost {
    readonly radios = ['r1', 'r2', 'r3'];
    multi = [
        { label: 'Item 1', selected: true },
        { label: 'Item 2', selected: false }
    ];
    single = 'r2';
}

@Component({
    imports: IMPORTS,
    template: `
        <ul fd-list aria-label="Interactive">
            <li fd-list-item interactive [selected]="selected()" (selectedChange)="changes.push($event)">
                <span fd-list-title>Interactive</span>
                <button data-testid="inner" (click)="innerClicks = innerClicks + 1">Inner</button>
            </li>
            <li fd-list-item interactive inactive (selectedChange)="changes.push($event)">
                <span fd-list-title>Inactive</span>
            </li>
            <li fd-list-item interactive preventClick (selectedChange)="changes.push($event)">
                <span fd-list-title>Prevent click</span>
            </li>
            <li fd-list-item (keyDown)="keys.push($event.key)"><span fd-list-title>Plain</span></li>
        </ul>
    `
})
class InteractiveHost {
    readonly selected = signal(false);
    readonly changes: boolean[] = [];
    readonly keys: string[] = [];
    innerClicks = 0;
}

@Component({
    imports: IMPORTS,
    template: `
        <ul fd-list navigationIndicator aria-label="Navigation" style="width: 400px">
            <li fd-list-item>
                <a fd-list-link href="#one" navigationIndicator (click)="go($event, 'one')"
                    ><span fd-list-title>One</span></a
                >
            </li>
            <li fd-list-item [counter]="42">
                <a fd-list-link href="#two" navigated (click)="go($event, 'two')"
                    ><i fd-list-icon glyph="cart"></i><span fd-list-title>Two</span></a
                >
            </li>
            <li fd-list-item>
                <a fd-list-link href="#three" focusable (click)="go($event, 'three')"
                    ><span fd-list-title>Three</span></a
                >
            </li>
        </ul>
    `
})
class NavigationHost {
    readonly visited: string[] = [];
    go(event: Event, target: string): void {
        event.preventDefault();
        this.visited.push(target);
    }
}

@Component({
    imports: IMPORTS,
    template: `
        <ul fd-list aria-label="Growing">
            @for (i of items(); track i) {
                <li fd-list-item>
                    <span fd-list-title>Item {{ i }}</span>
                </li>
            }
            <li fd-list-item action growing>
                <button fd-list-title data-testid="more" (click)="more()">
                    <span fd-list-title-text>Show more</span>
                </button>
            </li>
            <li fd-list-footer>Footer</li>
        </ul>
    `
})
class GrowingHost {
    readonly items = signal([1, 2, 3]);
    more(): void {
        this.items.update((list) => [...list, list.length + 1, list.length + 2]);
    }
}

@Component({
    imports: IMPORTS,
    template: `
        <ul fd-list byline unreadIndicator aria-label="Byline" data-testid="byline-list">
            <li fd-list-item unread data-testid="unread">
                <span fd-list-thumbnail><i fd-list-icon glyph="activate"></i></span>
                <div fd-list-content>
                    <div fd-list-title data-testid="unread-title">Unread</div>
                    <div fd-list-byline twoCol>
                        <div fd-list-byline-left data-testid="byline-left">Left</div>
                        <div fd-list-byline-right status="positive" data-testid="byline-right">Available</div>
                    </div>
                </div>
            </li>
            <li fd-list-item data-testid="read">
                <div fd-list-content>
                    <div fd-list-title data-testid="read-title">Read</div>
                    <div fd-list-byline data-testid="byline">Byline text</div>
                </div>
            </li>
        </ul>
        <ul fd-list subline aria-label="Subline">
            <li fd-list-item data-testid="subline-item">
                <div fd-list-content>
                    <div fd-list-title>Jane Doe</div>
                    <div fd-list-subline data-testid="subline">Developer</div>
                </div>
            </li>
        </ul>
        <ul fd-list hasMessage aria-label="Message" data-testid="message-list">
            <li fd-list-message type="error" data-testid="message">Error message</li>
            <li fd-list-item data-testid="message-item"><span fd-list-title>Item</span></li>
            <li fd-list-footer align="end" data-testid="footer">Footer</li>
        </ul>
        <ul fd-list hasMessage aria-label="Success message">
            <li fd-list-message type="success" data-testid="success-message">Saved</li>
            <li fd-list-item><span fd-list-title>Item</span></li>
        </ul>
        <ul fd-list aria-label="Counter">
            <li fd-list-item [counter]="1234.5" counterAriaLabel="1234 items" data-testid="counter-item">
                <span fd-list-title>Counter</span>
                <span fd-list-secondary type="negative" data-testid="secondary">Rejected</span>
            </li>
            <li fd-list-item active data-testid="active-item"><span fd-list-title>Current</span></li>
            <li fd-list-item noData><span fd-list-title data-testid="no-data">No data</span></li>
        </ul>
        <ul fd-list aria-label="Groups">
            <li fd-list-group-header data-testid="group-header"><span fd-list-title>Group A</span></li>
            <li fd-list-item><span fd-list-title>A1</span></li>
            <li fd-list-group-header role="presentation" data-testid="presentational-header">
                <span fd-list-title>Group B</span>
            </li>
        </ul>
        <ul fd-list aria-label="Actions" style="width: 300px">
            <li fd-list-item><span fd-list-title>Regular</span></li>
            <li fd-list-item action data-testid="action-item">
                <button fd-list-title data-testid="action">Action</button>
            </li>
        </ul>
        <ul fd-list wrap aria-label="Wrap" style="width: 200px">
            <li fd-list-item data-testid="wrap-item">
                <span fd-list-title data-testid="wrap-title">{{ longText }}</span>
            </li>
        </ul>
        <ul fd-list aria-label="Truncate" style="width: 200px">
            <li fd-list-item>
                <span fd-list-title data-testid="truncate-title">{{ longText }}</span>
            </li>
        </ul>
    `
})
class ContentHost {
    readonly longText = 'A very long title that does not fit into the list item and needs several lines';
}

@Component({
    imports: IMPORTS,
    template: `
        <ul fd-list class="custom-list" aria-label="User classes" data-testid="list">
            <li fd-list-item>
                <a fd-list-link class="custom-link" href="#" data-testid="link"
                    ><i fd-list-icon class="custom-icon" glyph="cart" data-testid="icon"></i
                    ><span fd-list-title>Link</span></a
                >
            </li>
        </ul>
    `
})
class UserClassHost {}

async function render<T>(type: new () => T) {
    const fixture = TestBed.createComponent(type);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    const items = (list = 0) => [
        ...root.querySelectorAll('[fd-list]')[list].querySelectorAll<HTMLElement>('[fd-list-item]')
    ];
    return { fixture, host: fixture.componentInstance, root, el, items };
}

function themed(property: 'backgroundColor' | 'color', value: string): string {
    const probe = document.createElement('div');
    probe.style[property] = value;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe)[property];
    probe.remove();
    return computed;
}

const rect = (el: Element) => el.getBoundingClientRect();

describe('List', () => {
    describe('keyboard', () => {
        it('has one tab stop: the first entry, then the last focused one', async () => {
            const { root, el, items } = await render(KeyboardHost);
            const header = root.querySelector<HTMLElement>('[fd-list-group-header]')!;
            expect(root.querySelector('[fd-list]')!.getAttribute('role')).toBe('list');
            expect(items().every((item) => item.getAttribute('role') === 'listitem')).toBe(true);
            expect(header.tabIndex).toBe(0);
            expect(items().map((item) => item.tabIndex)).toEqual([-1, -1, -1, -1]);

            el('before').focus();
            await userEvent.tab();
            expect(document.activeElement).toBe(header);
            await userEvent.keyboard('{ArrowDown}{ArrowDown}');
            expect(document.activeElement).toBe(items()[1]);
            expect(items()[1].tabIndex).toBe(0);
            expect(header.tabIndex).toBe(-1);

            // Tab leaves the list (through the field in the item) and Shift+Tab comes back to the item
            el('after').focus();
            await userEvent.tab({ shift: true });
            expect(document.activeElement).toBe(el('field'));
            await userEvent.tab({ shift: true });
            expect(document.activeElement).toBe(items()[1]);
        });

        it('arrow keys move focus between items; Home/End', async () => {
            const { items } = await render(KeyboardHost);
            items()[0].focus();
            await userEvent.keyboard('{ArrowDown}');
            expect(document.activeElement).toBe(items()[1]);
            await userEvent.keyboard('{ArrowDown}');
            expect(document.activeElement).toBe(items()[2]);
            await userEvent.keyboard('{ArrowUp}');
            expect(document.activeElement).toBe(items()[1]);
            await userEvent.keyboard('{End}');
            expect(document.activeElement).toBe(items()[3]);
            await userEvent.keyboard('{Home}');
            expect(document.activeElement!.hasAttribute('fd-list-group-header')).toBe(true);
            await userEvent.keyboard('{PageDown}');
            expect(document.activeElement).toBe(items()[3]);
            await userEvent.keyboard('{PageUp}');
            expect(document.activeElement!.hasAttribute('fd-list-group-header')).toBe(true);
        });

        it('rebuilds the key manager when items change', async () => {
            const { fixture, host, items } = await render(KeyboardHost);
            host.items.set(['One', 'Two', 'Three', 'Four', 'Five']);
            await fixture.whenStable();
            items()[0].focus();
            await userEvent.keyboard('{End}');
            expect(document.activeElement).toBe(items()[4]);
            expect(document.activeElement!.textContent!.trim()).toBe('Five');

            host.items.set(['Two', 'Four']);
            await fixture.whenStable();
            items()[0].focus();
            await userEvent.keyboard('{ArrowDown}');
            expect(document.activeElement).toBe(items()[1]);
            expect(document.activeElement!.textContent!.trim()).toBe('Four');
            // the tab stop stays on an existing item
            expect(items().filter((item) => item.tabIndex === 0)).toHaveLength(1);
        });

        it('setItemActive focuses the item at the index and moves the tab stop to it', async () => {
            const { fixture, root, items } = await render(KeyboardHost);
            const list = fixture.debugElement.query(By.directive(List)).injector.get(List);
            const header = root.querySelector<HTMLElement>('[fd-list-group-header]')!;
            // index 0 is the group header, so 2 is the second item
            list.setItemActive(2);
            await fixture.whenStable();
            expect(document.activeElement).toBe(items()[1]);
            expect(items()[1].tabIndex).toBe(0);
            expect(header.tabIndex).toBe(-1);
            expect([header, ...items()].filter((el) => el.tabIndex === 0)).toHaveLength(1);
            await userEvent.keyboard('{ArrowDown}');
            expect(document.activeElement).toBe(items()[2]);
        });

        it('clicking an item makes it the tab stop', async () => {
            const { fixture, root, el, items } = await render(KeyboardHost);
            const header = root.querySelector<HTMLElement>('[fd-list-group-header]')!;
            await userEvent.click(items()[2]);
            await fixture.whenStable();
            expect(document.activeElement).toBe(items()[2]);
            expect(items()[2].tabIndex).toBe(0);
            expect(header.tabIndex).toBe(-1);
            el('after').focus();
            await userEvent.tab({ shift: true });
            expect(document.activeElement).toBe(items()[2]);
            await userEvent.keyboard('{ArrowUp}');
            expect(document.activeElement).toBe(items()[1]);
        });

        it('keys typed into a field inside an item stay with the field', async () => {
            const { el } = await render(KeyboardHost);
            el('field').focus();
            await userEvent.keyboard('{ArrowDown}{Home}');
            expect(document.activeElement).toBe(el('field'));
        });

        it('focusEscapeList emits at the ends instead of moving focus', async () => {
            const { root, host, items } = await render(KeyboardHost);
            root.querySelector<HTMLElement>('[fd-list-group-header]')!.focus();
            await userEvent.keyboard('{ArrowUp}');
            expect(host.escapes).toEqual(['up']);
            items()[3].focus();
            await userEvent.keyboard('{ArrowDown}');
            expect(host.escapes).toEqual(['up', 'down']);
            expect(document.activeElement).toBe(items()[3]);
        });

        it('keyboardSupport=false turns arrow navigation off', async () => {
            const { fixture, host, items } = await render(KeyboardHost);
            host.keyboard.set(false);
            await fixture.whenStable();
            expect(items().every((item) => item.tabIndex === -1)).toBe(true);
            items()[0].focus();
            await userEvent.keyboard('{ArrowDown}');
            expect(document.activeElement).toBe(items()[0]);
        });
    });

    describe('selection', () => {
        it('items are options with aria-selected; the checkbox is inert and the item toggles it', async () => {
            const { fixture, host, items } = await render(SelectionHost);
            const [first, second] = items(0);
            expect(first.getAttribute('role')).toBe('option');
            expect(first.getAttribute('aria-selected')).toBe('true');
            expect(second.getAttribute('aria-selected')).toBe('false');
            // the checkbox is not reachable on its own
            expect(first.querySelector('fd-checkbox')!.closest('[inert]')).not.toBeNull();
            expect(first.querySelector<HTMLInputElement>('input[type=checkbox]')!.tabIndex).toBe(-1);

            await userEvent.click(second);
            await fixture.whenStable();
            expect(host.multi[1].selected).toBe(true);
            expect(second.getAttribute('aria-selected')).toBe('true');
            expect(second.hasAttribute('data-selected')).toBe(true);

            second.focus();
            await userEvent.keyboard(' ');
            await fixture.whenStable();
            expect(host.multi[1].selected).toBe(false);
            expect(second.getAttribute('aria-selected')).toBe('false');

            await userEvent.keyboard('{Enter}');
            await fixture.whenStable();
            expect(host.multi[1].selected).toBe(true);
        });

        it('describes the selection state for screen readers', async () => {
            const { fixture, items } = await render(SelectionHost);
            const describedBy = (item: HTMLElement) =>
                document.getElementById(item.getAttribute('aria-describedby')!)!.textContent!.trim();
            expect(describedBy(items(0)[0])).toBe('Selected');
            expect(describedBy(items(0)[1])).toBe('Not selected');
            expect(describedBy(items(1)[1])).toBe('Chosen');
            expect(describedBy(items(1)[0])).toBe('Not chosen');
            await userEvent.click(items(0)[0]);
            await fixture.whenStable();
            expect(describedBy(items(0)[0])).toBe('Not selected');
        });

        it('items of a list without selection have no aria-describedby and no selection text', async () => {
            const { root, items } = await render(KeyboardHost);
            for (const item of items()) {
                expect(item.hasAttribute('aria-describedby')).toBe(false);
                expect(item.hasAttribute('aria-selected')).toBe(false);
                expect(item.querySelector('.sr-only-sap')).toBeNull();
            }
            expect(root.textContent).not.toContain('Not selected');
        });

        it('radio items select their radio button on click and Space', async () => {
            const { fixture, host, items } = await render(SelectionHost);
            const radios = items(1);
            expect(radios.map((item) => item.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
            await userEvent.click(radios[0]);
            await fixture.whenStable();
            expect(host.single).toBe('r1');
            expect(radios.map((item) => item.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);

            radios[2].focus();
            await userEvent.keyboard(' ');
            await fixture.whenStable();
            expect(host.single).toBe('r3');
            expect(radios[2].getAttribute('aria-selected')).toBe('true');
        });
    });

    describe('interactive items', () => {
        it('selectedChange emits from clicks, Space and Enter', async () => {
            const { fixture, host, items } = await render(InteractiveHost);
            const item = items()[0];
            expect(item.getAttribute('role')).toBe('listitem');
            expect(item.hasAttribute('aria-selected')).toBe(false);

            await userEvent.click(item);
            await fixture.whenStable();
            expect(host.changes).toEqual([true]);
            expect(item.hasAttribute('data-selected')).toBe(true);
            await userEvent.unhover(item);
            expect(getComputedStyle(item).backgroundColor).toBe(
                themed('backgroundColor', 'var(--sapList_SelectionBackgroundColor)')
            );

            item.focus();
            await userEvent.keyboard(' ');
            await fixture.whenStable();
            expect(host.changes).toEqual([true, false]);
            expect(item.hasAttribute('data-selected')).toBe(false);

            await userEvent.keyboard('{Enter}');
            await fixture.whenStable();
            expect(host.changes).toEqual([true, false, true]);
        });

        it('follows the selected input', async () => {
            const { fixture, host, items } = await render(InteractiveHost);
            host.selected.set(true);
            await fixture.whenStable();
            expect(items()[0].hasAttribute('data-selected')).toBe(true);
            expect(host.changes).toEqual([]);
        });

        it('clicks on a control inside the item do not toggle it', async () => {
            const { fixture, host, el, items } = await render(InteractiveHost);
            await userEvent.click(el('inner'));
            await fixture.whenStable();
            expect(host.innerClicks).toBe(1);
            expect(host.changes).toEqual([]);
            expect(items()[0].hasAttribute('data-selected')).toBe(false);
        });

        it('inactive items ignore the pointer and preventClick items ignore clicks', async () => {
            const { fixture, host, items } = await render(InteractiveHost);
            expect(getComputedStyle(items()[1]).pointerEvents).toBe('none');
            items()[2].click();
            await fixture.whenStable();
            expect(host.changes).toEqual([]);
        });

        it('inactive items are skipped by the arrow keys', async () => {
            const { items } = await render(InteractiveHost);
            items()[0].focus();
            await userEvent.keyboard('{ArrowDown}');
            expect(document.activeElement).toBe(items()[2]);
        });

        it('keyDown emits the keys of plain items', async () => {
            const { host, items } = await render(InteractiveHost);
            items()[3].focus();
            await userEvent.keyboard('{Enter}a');
            expect(host.keys).toEqual(['Enter', 'a']);
        });
    });

    describe('navigation items', () => {
        it('the link fills the item and is opened with Enter on the item', async () => {
            const { host, items } = await render(NavigationHost);
            const [first] = items();
            const link = first.querySelector<HTMLElement>('a')!;
            expect(link.tabIndex).toBe(-1);
            expect(rect(link).width).toBeCloseTo(rect(first).width, 0);
            expect(rect(link).height).toBeGreaterThan(rect(first).height - 2);

            await userEvent.click(items()[1].querySelector('[fd-list-title]')!);
            expect(host.visited).toEqual(['two']);

            first.focus();
            await userEvent.keyboard('{Enter}');
            expect(host.visited).toEqual(['two', 'one']);
            await userEvent.keyboard(' ');
            expect(host.visited).toEqual(['two', 'one', 'one']);
        });

        it('shows the navigation indicator arrow and reserves its space in the list', async () => {
            const { items } = await render(NavigationHost);
            const withIndicator = getComputedStyle(items()[0].querySelector('a')!, '::after');
            expect(withIndicator.content).not.toBe('none');
            expect(withIndicator.content).not.toBe('""');
            expect(withIndicator.minWidth).toBe('40px');
            // items without the arrow keep the space empty
            const without = getComputedStyle(items()[1].querySelector('a')!, '::after');
            expect(without.content).toBe('""');
            expect(without.minWidth).toBe('40px');
        });

        it('navigated marks the link with the selection border colour', async () => {
            const { items } = await render(NavigationHost);
            const shadow = getComputedStyle(items()[1].querySelector('a')!).boxShadow;
            expect(shadow).toContain('inset');
            expect(shadow).toContain(themed('color', 'var(--sapList_SelectionBorderColor)'));
            expect(getComputedStyle(items()[0].querySelector('a')!).boxShadow).not.toContain('inset');
        });

        it('a counter is shown inside the link', async () => {
            const { items } = await render(NavigationHost);
            const link = items()[1].querySelector('a')!;
            expect(link.lastElementChild!.textContent!.trim()).toBe('42');
        });

        it('a focusable link receives the focus of its item', async () => {
            const { items } = await render(NavigationHost);
            items()[2].focus();
            expect(document.activeElement).toBe(items()[2].querySelector('a'));
        });
    });

    describe('growing', () => {
        it('growing item loads more (button) and keeps focus', async () => {
            const { fixture, el, items } = await render(GrowingHost);
            expect(items()).toHaveLength(4);
            el('more').focus();
            await userEvent.keyboard('{Enter}');
            await fixture.whenStable();
            expect(items()).toHaveLength(6);
            expect(document.activeElement).toBe(el('more'));
            await userEvent.click(el('more'));
            await fixture.whenStable();
            expect(items()).toHaveLength(8);
            expect(document.activeElement).toBe(el('more'));
            expect(items()[6].textContent!.trim()).toBe('Item 7');
        });

        it('the growing button fills the item and its label is bold', async () => {
            const { el } = await render(GrowingHost);
            const item = el('more').closest('[fd-list-item]')!;
            expect(rect(el('more')).width).toBeCloseTo(rect(item).width, 0);
            expect(getComputedStyle(el('more').querySelector('[fd-list-title-text]')!).fontWeight).toBe('700');
        });
    });

    describe('content', () => {
        it('byline items show the title above the byline; twoCol splits it', async () => {
            const { el } = await render(ContentHost);
            expect(rect(el('byline')).top).toBeGreaterThanOrEqual(rect(el('read-title')).bottom);
            expect(rect(el('read')).height).toBeGreaterThanOrEqual(80);
            expect(rect(el('byline-left')).right).toBeLessThanOrEqual(rect(el('byline-right')).left + 1);
            expect(getComputedStyle(el('byline-right')).color).toBe(themed('color', 'var(--sapPositiveTextColor)'));
        });

        it('unread items have a bold title and an unread dot', async () => {
            const { el } = await render(ContentHost);
            expect(getComputedStyle(el('unread-title')).fontWeight).toBe('700');
            expect(getComputedStyle(el('read-title')).fontWeight).toBe('400');
            const dot = el('unread').querySelector(':scope > fd-icon')!;
            expect(dot.getAttribute('aria-hidden')).toBe('true');
            expect(rect(dot).left).toBeLessThan(rect(el('unread').querySelector('[fd-list-thumbnail]')!).left);
            expect(el('read').querySelector(':scope > fd-icon')).toBeNull();
        });

        it('subline items show the subline below the title', async () => {
            const { el } = await render(ContentHost);
            const title = el('subline-item').querySelector('[fd-list-title]')!;
            expect(rect(el('subline')).top).toBeGreaterThanOrEqual(rect(title).bottom);
            expect(rect(el('subline-item')).height).toBeGreaterThanOrEqual(72);
        });

        it('counter, secondary text and the active check mark', async () => {
            const { el } = await render(ContentHost);
            const counter = el('counter-item').querySelector('[aria-label="1234 items"]')!;
            expect(counter.textContent!.trim()).toBe('1,234.5');
            expect(rect(counter).left).toBeGreaterThan(rect(el('secondary')).right - 1);
            expect(getComputedStyle(el('secondary')).color).toBe(themed('color', 'var(--sapNegativeTextColor)'));
            expect(el('active-item').querySelector('fd-icon')!.getAttribute('data-glyph')).toBeTruthy();
            expect(getComputedStyle(el('no-data')).textAlign).toBe('center');
        });

        it('group headers are focusable list items unless presentational', async () => {
            const { el } = await render(ContentHost);
            expect(el('group-header').getAttribute('role')).toBe('listitem');
            expect(el('group-header').hasAttribute('tabindex')).toBe(true);
            expect(getComputedStyle(el('group-header')).backgroundColor).toBe(
                themed('backgroundColor', 'var(--sapList_GroupHeaderBackground)')
            );
            expect(el('presentational-header').getAttribute('role')).toBe('presentation');
            expect(el('presentational-header').hasAttribute('tabindex')).toBe(false);
        });

        it('the message sits above the items and the footer below them', async () => {
            const { el } = await render(ContentHost);
            expect(getComputedStyle(el('message-list')).paddingTop).toBe('32px');
            expect(rect(el('message')).top).toBe(rect(el('message-list')).top);
            expect(rect(el('message')).bottom).toBeLessThanOrEqual(rect(el('message-item')).top);
            expect(getComputedStyle(el('message')).backgroundColor).toBe(
                themed('backgroundColor', 'var(--sapErrorBackground)')
            );
            expect(rect(el('footer')).top).toBeGreaterThanOrEqual(rect(el('message-item')).bottom);
            expect(getComputedStyle(el('footer')).justifyContent).toBe('flex-end');
        });

        it('a success message uses the success background', async () => {
            const { el } = await render(ContentHost);
            expect(getComputedStyle(el('success-message')).backgroundColor).toBe(
                themed('backgroundColor', 'var(--sapSuccessBackground)')
            );
            expect(el('success-message').className).not.toContain('bg-sap-error-background');
        });

        it('merges a user class on the list, icon and link', async () => {
            const { el } = await render(UserClassHost);
            const list = el('list');
            expect(list.classList).toContain('custom-list');
            expect(list.classList).toContain('list-none');
            expect(el('icon').classList).toContain('custom-icon');
            expect(el('icon').classList).toContain('pointer-events-none');
            expect(el('link').classList).toContain('custom-link');
            expect(el('link').classList).toContain('no-underline');
        });

        it('titles truncate by default and wrap in a wrap list', async () => {
            const { el } = await render(ContentHost);
            const truncated = el('truncate-title');
            expect(truncated.scrollWidth).toBeGreaterThan(truncated.clientWidth);
            const wrapped = el('wrap-title');
            expect(getComputedStyle(wrapped).whiteSpace).toBe('normal');
            expect(rect(wrapped).height).toBeGreaterThan(rect(truncated).height * 2);
            expect(rect(el('wrap-item')).height).toBeGreaterThan(rect(truncated.closest('[fd-list-item]')!).height);
        });

        it('compact density makes the items shorter', async () => {
            const { el } = await render(ContentHost);
            const item = el('message-item');
            const cozy = rect(item).height;
            document.documentElement.setAttribute('data-density', 'compact');
            try {
                expect(rect(item).height).toBeLessThan(cozy);
            } finally {
                document.documentElement.removeAttribute('data-density');
            }
        });
    });

    describe('action items', () => {
        it('in Horizon the whole item is the button', async () => {
            const { el } = await render(ContentHost);
            const button = el('action');
            const item = el('action-item');
            expect(rect(button).width).toBeCloseTo(rect(item).width, 0);
            expect(getComputedStyle(button).borderTopWidth).toBe('0px');
            expect(getComputedStyle(button).borderRadius).toBe('0px');
            expect(getComputedStyle(button).color).toBe(themed('color', 'var(--sapButton_TextColor)'));
        });

        it('in high contrast it is an inset bordered button', async () => {
            const { el } = await render(ContentHost);
            document.documentElement.setAttribute('data-sap-theme', 'sap_horizon_hcb');
            try {
                const button = el('action');
                const style = getComputedStyle(button);
                expect(style.borderTopWidth).toBe('1px');
                expect(style.borderTopStyle).toBe('solid');
                expect(style.borderRadius).toBe('6px');
                expect(style.marginTop).toBe('4px');
                expect(rect(button).width).toBeLessThan(rect(el('action-item')).width);
            } finally {
                document.documentElement.removeAttribute('data-sap-theme');
            }
        });
    });
});
