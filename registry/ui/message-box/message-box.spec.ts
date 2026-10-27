import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { MessageBoxService, type MessageBoxRef } from './message-box';

const wait = async (ms = 150) => {
    await new Promise((r) => setTimeout(r, ms));
    await expect.poll(() => document.querySelector('[role=alertdialog]')).not.toBeNull();
};
const win = () => document.querySelector<HTMLElement>('[role=alertdialog]')!;

function outcome(ref: MessageBoxRef): Promise<{ closed?: unknown; dismissed?: unknown }> {
    return new Promise((resolve) =>
        ref.afterClosed.subscribe({
            next: (closed) => resolve({ closed }),
            error: (dismissed) => resolve({ dismissed })
        })
    );
}

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
});
