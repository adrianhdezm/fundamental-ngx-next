import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component, TemplateRef, inject, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { BarElement, BarLeft, BarRight, ButtonBar } from '@/ui/bar/bar';
import { Icon } from '@/ui/icon/icon';
import { Title } from '@/ui/title/title';
import {
    MessageBox,
    MessageBoxBody,
    MessageBoxFooter,
    MessageBoxHeader,
    MessageBoxRef,
    MessageBoxSemanticIcon,
    MessageBoxService,
    MessageBoxTemplate,
    type MessageBoxType
} from './message-box';

const wait = async (ms = 150) => {
    await new Promise((r) => setTimeout(r, ms));
    await expect.poll(() => document.querySelector('[role=alertdialog]')).not.toBeNull();
};
const win = () => document.querySelector<HTMLElement>('[role=alertdialog]')!;
const settle = () => new Promise((r) => setTimeout(r, 150));
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

function outcome(ref: MessageBoxRef): Promise<{ closed?: unknown; dismissed?: unknown }> {
    return new Promise((resolve) =>
        ref.afterClosed.subscribe({
            next: (closed) => resolve({ closed }),
            error: (dismissed) => resolve({ dismissed })
        })
    );
}

const GLYPHS = ['error', 'sys-enter-2', 'alert', 'information', 'sys-help-2', 'cart'];

/** A message box template with a custom footer, a page button and reference icons for the glyph checks. */
@Component({
    imports: [
        MessageBox,
        MessageBoxHeader,
        MessageBoxBody,
        MessageBoxFooter,
        MessageBoxTemplate,
        Title,
        ButtonBar,
        BarLeft,
        BarRight,
        BarElement,
        Icon
    ],
    template: `
        <button id="page-button">Page</button>
        <ng-template fdMessageBoxTemplate let-messageBox #tpl>
            <fd-message-box>
                <fd-message-box-header
                    ><h1 fd-title>{{ messageBox.data?.title }}</h1></fd-message-box-header
                >
                <fd-message-box-body>Template body</fd-message-box-body>
                <fd-message-box-footer>
                    <div fd-bar-left>
                        <fd-bar-element><span class="footer-note">Step 1 of 2</span></fd-bar-element>
                    </div>
                    <div fd-bar-right>
                        <fd-button-bar variant="emphasized" label="Next" (click)="messageBox.close('next')" />
                    </div>
                </fd-message-box-footer>
            </fd-message-box>
        </ng-template>
        @for (glyph of glyphs; track glyph) {
            <fd-icon class="reference" [glyph]="glyph" [attr.data-name]="glyph" />
        }
    `
})
class Host {
    readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
    readonly glyphs = GLYPHS;
}

/** A message box component with its own semantic icon; it injects its ref. */
@Component({
    imports: [MessageBox, MessageBoxHeader, MessageBoxBody, MessageBoxSemanticIcon, Title],
    template: `
        <fd-message-box>
            <fd-message-box-header>
                <fd-message-box-semantic-icon glyph="cart" />
                <h1 fd-title>Checkout</h1>
            </fd-message-box-header>
            <fd-message-box-body>{{ ref.data?.count }} items in the cart</fd-message-box-body>
        </fd-message-box>
    `
})
class BoxContent {
    static last: BoxContent | null = null;
    readonly ref = inject<MessageBoxRef<{ count: number }>>(MessageBoxRef);
    constructor() {
        BoxContent.last = this;
    }
}

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    /** The glyph character of an icon name, from the reference icons. */
    const glyph = (name: string) => root.querySelector(`fd-icon[data-name="${name}"]`)!.getAttribute('data-glyph');
    return { fixture, root, host: fixture.componentInstance, service: TestBed.inject(MessageBoxService), glyph };
}

const semanticGlyphs = () =>
    [...win().querySelectorAll('fd-message-box-semantic-icon fd-icon')].map((icon) => icon.getAttribute('data-glyph'));

describe('MessageBox', () => {
    afterEach(() => TestBed.inject(MessageBoxService).dismissAll());

    it('opens an alert dialog named by its title and described by its body', async () => {
        const service = TestBed.inject(MessageBoxService);
        const ref: MessageBoxRef = service.open(
            {
                title: 'Delete order',
                content: 'The order will be deleted.',
                approveButton: 'Delete',
                approveButtonCallback: () => ref.close('deleted'),
                cancelButton: 'Cancel',
                cancelButtonCallback: () => ref.dismiss('canceled')
            },
            { type: 'error', showSemanticIcon: true }
        );
        await wait();
        const dialog = win();
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)!.textContent!.trim()).toBe(
            'Delete order'
        );
        expect(document.getElementById(dialog.getAttribute('aria-describedby')!)!.textContent!.trim()).toBe(
            'The order will be deleted.'
        );
        expect(dialog.querySelector('fd-message-box-semantic-icon fd-icon')).not.toBeNull();
        expect(document.activeElement!.textContent!.trim()).toContain('Delete');
        const result = outcome(ref);
        await userEvent.click(document.activeElement as HTMLElement);
        expect(await result).toEqual({ closed: 'deleted' });
    });

    it('dismisses on Escape', async () => {
        const service = TestBed.inject(MessageBoxService);
        const ref = service.open({ title: 'Info', content: 'Text', approveButton: 'OK' }, { type: 'information' });
        await wait();
        const result = outcome(ref);
        await userEvent.keyboard('{Escape}');
        expect(await result).toEqual({ dismissed: 'escape' });
    });

    it('shows no semantic icon unless asked', async () => {
        const service = TestBed.inject(MessageBoxService);
        service.open({ title: 'Plain', content: 'Text' }, { type: 'warning' });
        await wait();
        expect(win().querySelector('fd-message-box-semantic-icon')).toBeNull();
    });

    it('opens from a template and a component with their data and ref', async () => {
        const { host, service } = await setup();
        const fromTemplate = service.open(host.tpl(), { data: { title: 'From a template' } });
        await wait();
        expect(document.getElementById(win().getAttribute('aria-labelledby')!)!.textContent).toBe('From a template');
        expect(win().querySelector('fd-message-box-body')!.textContent).toBe('Template body');
        const templateResult = outcome(fromTemplate);
        await userEvent.click(win().querySelector<HTMLElement>('fd-button-bar button')!);
        expect(await templateResult).toEqual({ closed: 'next' });
        await settle();

        const fromComponent = service.open(BoxContent, { data: { count: 3 } });
        await wait();
        expect(win().querySelector('fd-message-box-body')!.textContent).toBe('3 items in the cart');
        expect(document.getElementById(win().getAttribute('aria-labelledby')!)!.textContent).toBe('Checkout');
        expect(BoxContent.last!.ref).toBe(fromComponent);
        const componentResult = outcome(fromComponent);
        BoxContent.last!.ref.close('checkout');
        expect(await componentResult).toEqual({ closed: 'checkout' });
    });

    it('the cancel callback dismisses with its reason', async () => {
        const service = TestBed.inject(MessageBoxService);
        const ref: MessageBoxRef = service.open({
            title: 'Discard changes',
            content: 'Your changes will be lost.',
            approveButton: 'Discard',
            approveButtonCallback: () => ref.close('discarded'),
            cancelButton: 'Keep editing',
            cancelButtonCallback: () => ref.dismiss('canceled')
        });
        await wait();
        const result = outcome(ref);
        const cancel = [...win().querySelectorAll<HTMLElement>('button')].find((b) =>
            b.textContent!.includes('Keep editing')
        )!;
        await userEvent.click(cancel);
        expect(await result).toEqual({ dismissed: 'canceled' });
    });

    it('focusTrapped false neither focuses the approve button nor traps the focus', async () => {
        const { root, service } = await setup();
        service.open({ title: 'Untrapped', content: 'Text', approveButton: 'OK' }, { focusTrapped: false });
        await wait();
        const approve = [...win().querySelectorAll('button')].find((b) => b.textContent!.includes('OK'))!;
        expect(document.activeElement).not.toBe(approve);
        expect(document.activeElement).toBe(win());
        // Tab leaves the message box for the page
        const page = root.querySelector('#page-button');
        const reached: Element[] = [];
        for (let i = 0; i < 5 && document.activeElement !== page; i++) {
            await userEvent.keyboard('{Tab}');
            reached.push(document.activeElement!);
        }
        expect(reached).toContain(approve);
        expect(document.activeElement).toBe(page);
    });

    it('each type shows its semantic glyph, a custom icon replaces it', async () => {
        const { service, glyph } = await setup();
        const expected: Record<MessageBoxType, string> = {
            error: 'error',
            success: 'sys-enter-2',
            warning: 'alert',
            information: 'information',
            confirmation: 'sys-help-2'
        };
        // the reference glyphs are all different characters
        expect(new Set(GLYPHS.map(glyph).filter(Boolean)).size).toBe(GLYPHS.length);
        for (const [type, name] of Object.entries(expected) as [MessageBoxType, string][]) {
            service.open({ title: type, content: 'Text' }, { type, showSemanticIcon: true });
            await wait();
            expect(semanticGlyphs()).toEqual([glyph(name)]);
            service.dismissAll();
            await settle();
        }
        service.open({ title: 'Custom', content: 'Text' }, { type: 'error', customSemanticIcon: 'cart' });
        await wait();
        expect(semanticGlyphs()).toEqual([glyph('cart')]);
    });

    it('a projected semantic icon replaces the type icon', async () => {
        const { service, glyph } = await setup();
        service.open(BoxContent, { type: 'error', showSemanticIcon: true, data: { count: 1 } });
        await wait();
        expect(semanticGlyphs()).toEqual([glyph('cart')]);
    });

    it('the footer renders custom content in its bar areas', async () => {
        const { host, service } = await setup();
        service.open(host.tpl(), { data: { title: 'Custom footer' } });
        await wait();
        const footer = win().querySelector('fd-message-box-footer')!;
        expect(footer.querySelector('[fd-bar-left] .footer-note')!.textContent).toBe('Step 1 of 2');
        expect(footer.querySelector('[fd-bar-right] button')!.textContent).toContain('Next');
        const note = footer.querySelector('.footer-note')!.getBoundingClientRect();
        const next = footer.querySelector('[fd-bar-right] button')!.getBoundingClientRect();
        expect(note.right).toBeLessThan(next.left);
    });

    it('dismisses on a backdrop click only when backdropClickCloseable', async () => {
        const service = TestBed.inject(MessageBoxService);
        const backdrop = () => document.querySelector<HTMLElement>('fd-dialog')!;
        const kept = service.open({ title: 'Kept', content: 'Text' });
        await wait();
        backdrop().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(kept.isOpen()).toBe(true);
        kept.close();
        await settle();

        const ref = service.open({ title: 'Closable', content: 'Text' }, { backdropClickCloseable: true });
        await wait();
        const result = outcome(ref);
        backdrop().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(await result).toEqual({ dismissed: 'backdrop' });
    });

    it('applies position, width and height', async () => {
        TestBed.inject(MessageBoxService).open(
            { title: 'Placed', content: 'Text' },
            { position: { top: '30px', left: '40px' }, width: '400px', height: '250px' }
        );
        await wait();
        const backdrop = document.querySelector('fd-dialog')!.getBoundingClientRect();
        const rect = win().getBoundingClientRect();
        near(rect.top - backdrop.top, 30);
        near(rect.left - backdrop.left, 40);
        near(rect.width, 400);
        near(rect.height, 250);
    });

    it('applies dialogPanelClass and ariaLabel', async () => {
        TestBed.inject(MessageBoxService).open(
            { title: 'Labelled', content: 'Text' },
            { dialogPanelClass: 'custom-panel', ariaLabel: 'Custom label' }
        );
        await wait();
        expect(win().classList).toContain('custom-panel');
        expect(win().getAttribute('aria-label')).toBe('Custom label');
    });

    it('mobile mode fills the viewport, mobileOuterSpacing keeps a margin', async () => {
        const service = TestBed.inject(MessageBoxService);
        service.open({ title: 'Mobile', content: 'Text' }, { mobile: true, width: '300px' });
        await wait();
        const viewport = document.querySelector('fd-dialog')!.getBoundingClientRect();
        let rect = win().getBoundingClientRect();
        expect(rect.width).toBe(viewport.width);
        expect(rect.height).toBe(viewport.height);
        service.dismissAll();
        await settle();

        service.open({ title: 'Mobile', content: 'Text' }, { mobile: true, mobileOuterSpacing: true });
        await wait();
        rect = win().getBoundingClientRect();
        near(rect.width, viewport.width * 0.9);
        near(rect.left, viewport.width * 0.05);
    });

    it('dismisses on navigation unless closeOnNavigation is false', async () => {
        TestBed.configureTestingModule({ providers: [provideLocationMocks()] });
        const service = TestBed.inject(MessageBoxService);
        const location = TestBed.inject(Location);
        const kept = service.open({ title: 'Kept', content: 'Text' }, { closeOnNavigation: false });
        await wait();
        location.go('/elsewhere');
        expect(kept.isOpen()).toBe(true);
        kept.close();
        await settle();

        const ref = service.open({ title: 'Navigated', content: 'Text' });
        await wait();
        const result = outcome(ref);
        location.go('/next');
        expect(await result).toEqual({ dismissed: 'navigation change' });
    });

    it('dismissAll closes every open box and removes the overlay', async () => {
        const service = TestBed.inject(MessageBoxService);
        const first = outcome(service.open({ title: 'First', content: 'Text' }));
        const second = outcome(service.open({ title: 'Second', content: 'Text' }));
        await wait();
        expect(service.dialogsOpen()).toBe(2);
        service.dismissAll('all');
        expect(await first).toEqual({ dismissed: 'all' });
        expect(await second).toEqual({ dismissed: 'all' });
        expect(service.dialogsOpen()).toBe(0);
        await settle();
        expect(document.querySelector('[role=alertdialog]')).toBeNull();
        expect(document.querySelectorAll('.fd-dialog-pane')).toHaveLength(0);
    });
});
