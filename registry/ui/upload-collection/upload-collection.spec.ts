import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FormsModule } from '@angular/forms';
import { userEvent } from 'vitest/browser';
import { Checkbox } from '@/ui/checkbox/checkbox';
import { ListContent, ListItem, ListTitle } from '@/ui/list/list';
import {
    UploadCollection,
    UploadCollectionButtonGroup,
    UploadCollectionFormItem,
    UploadCollectionItem,
    UploadCollectionTitle,
    UploadCollectionTitleContainer
} from './upload-collection';

@Component({
    imports: [
        UploadCollection,
        UploadCollectionItem,
        UploadCollectionButtonGroup,
        UploadCollectionFormItem,
        UploadCollectionTitle,
        UploadCollectionTitleContainer,
        ListItem,
        ListContent,
        ListTitle
    ],
    template: `
        <div [style.width.px]="width()">
            <fd-upload-collection>
                @for (file of files(); track file) {
                    <li
                        fd-list-item
                        fd-upload-collection-item
                        [(fileName)]="file.name"
                        extension="pdf"
                        (fileNameChanged)="renamed.set($event.fileName())"
                        (deleteClicked)="remove(file)"
                    >
                        <div fd-list-content>
                            <div fd-upload-collection-title-container>
                                <span fd-list-title fd-upload-collection-title></span>
                                <fd-upload-collection-form-item />
                            </div>
                        </div>
                        <fd-upload-collection-button-group />
                    </li>
                }
            </fd-upload-collection>
        </div>
    `
})
class Host {
    readonly width = signal(800);
    readonly files = signal([
        { name: 'Report' },
        { name: 'A_very_long_file_name_that_needs_to_be_shortened_in_the_middle' }
    ]);
    readonly renamed = signal('');
    remove(file: { name: string }): void {
        this.files.update((files) => files.filter((f) => f !== file));
    }
}

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
const titles = () =>
    [...document.querySelectorAll<HTMLElement>('[fd-upload-collection-title]')].map((t) => t.textContent!.trim());
const button = (name: string, index = 0) =>
    [...document.querySelectorAll<HTMLButtonElement>('fd-upload-collection-button-group button')].filter(
        (b) => (b.getAttribute('aria-label') ?? b.textContent!.trim()) === name
    )[index];

@Component({
    imports: [
        UploadCollection,
        UploadCollectionItem,
        UploadCollectionButtonGroup,
        UploadCollectionFormItem,
        UploadCollectionTitle,
        UploadCollectionTitleContainer,
        ListItem,
        ListContent,
        ListTitle,
        Checkbox,
        FormsModule
    ],
    template: `
        <div style="width: 500px">
            <fd-upload-collection [small]="small()" [selection]="selection()">
                <li fd-list-item fd-upload-collection-item ariaRole="listitem" fileName="Report" extension="pdf">
                    @if (selection()) {
                        <fd-checkbox [(ngModel)]="checked" ariaLabel="Select Report.pdf" />
                    }
                    <div fd-list-content>
                        <div fd-upload-collection-title-container>
                            <span fd-list-title fd-upload-collection-title></span>
                            <fd-upload-collection-form-item [(ngModel)]="draft" />
                        </div>
                    </div>
                    <fd-upload-collection-button-group
                        [allowFileNameEdit]="allowEdit()"
                        [allowFileDeletion]="allowDelete()"
                        [disableFileNameEdit]="disableEdit()"
                        [disableFileDeletion]="disableDelete()"
                    />
                </li>
            </fd-upload-collection>
        </div>
    `
})
class ConfigHost {
    readonly small = signal(false);
    readonly selection = signal(false);
    readonly allowEdit = signal(true);
    readonly allowDelete = signal(true);
    readonly disableEdit = signal(false);
    readonly disableDelete = signal(false);
    checked = false;
    draft = '';
}

async function setupConfig(init: (host: ConfigHost) => void = () => {}) {
    const fixture = TestBed.createComponent(ConfigHost);
    init(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

async function setup(width = 800) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.width.set(width);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    await wait();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

describe('UploadCollection', () => {
    it('is a list of files with their names and extensions', async () => {
        const { root } = await setup();
        expect(root.querySelector('fd-upload-collection')!.getAttribute('role')).toBe('list');
        expect(titles()[0]).toBe('Report.pdf');
    });

    it('shortens long names in the middle, keeping the extension', async () => {
        await setup(320);
        const title = titles()[1];
        expect(title).toContain('...');
        expect(title.endsWith('.pdf')).toBe(true);
        expect(document.querySelectorAll('[fd-upload-collection-title]')[1].getAttribute('title')).toBe(
            'A_very_long_file_name_that_needs_to_be_shortened_in_the_middle.pdf'
        );
    });

    it('renames a file in place', async () => {
        const { host, fixture } = await setup();
        await userEvent.click(button('Edit'));
        await fixture.whenStable();
        const field = document.querySelector<HTMLInputElement>('fd-upload-collection-form-item input')!;
        expect(document.activeElement).toBe(field);
        expect(field.value).toBe('Report');
        await userEvent.clear(field);
        await fixture.whenStable();
        expect(button('Ok').disabled).toBe(true);
        await userEvent.type(field, 'Summary{Enter}');
        await wait();
        expect(host.renamed()).toBe('Summary');
        expect(host.files()[0].name).toBe('Summary');
        expect(titles()[0]).toBe('Summary.pdf');
        expect(document.activeElement).toBe(button('Edit'));
    });

    it('cancels a rename with Escape', async () => {
        const { host, fixture } = await setup();
        await userEvent.click(button('Edit'));
        await fixture.whenStable();
        await userEvent.type(
            document.querySelector<HTMLInputElement>('fd-upload-collection-form-item input')!,
            'x{Escape}'
        );
        await wait();
        expect(host.files()[0].name).toBe('Report');
        expect(titles()[0]).toBe('Report.pdf');
    });

    it('deletes a file', async () => {
        const { host, fixture } = await setup();
        await userEvent.click(button('Delete'));
        await fixture.whenStable();
        expect(host.files()).toHaveLength(1);
    });
    it('renders a file name with markup as text, also after a rename', async () => {
        const { host, fixture, root } = await setup();
        host.files.set([{ name: '<img src="x" onerror="window.__ucXss = true">' }]);
        await fixture.whenStable();
        await wait();
        expect(root.querySelector('[fd-upload-collection-title] img')).toBeNull();
        expect(titles()[0]).toBe('<img src="x" onerror="window.__ucXss = true">.pdf');

        await userEvent.click(button('Edit'));
        await fixture.whenStable();
        const field = document.querySelector<HTMLInputElement>('fd-upload-collection-form-item input')!;
        await userEvent.clear(field);
        await userEvent.type(field, '<b>bold</b>{Enter}');
        await wait();
        expect(root.querySelector('[fd-upload-collection-title] b')).toBeNull();
        expect(titles()[0]).toBe('<b>bold</b>.pdf');
        expect((window as { __ucXss?: boolean }).__ucXss).toBeUndefined();
    });

    describe('buttons, layout and selection', () => {
        it('wraps the buttons below the file in small mode', async () => {
            const { fixture, host, root } = await setupConfig();
            const group = root.querySelector<HTMLElement>('fd-upload-collection-button-group')!;
            const content = root.querySelector<HTMLElement>('[fd-list-content]')!;
            expect(group.getBoundingClientRect().top).toBeLessThan(content.getBoundingClientRect().bottom);
            host.small.set(true);
            await fixture.whenStable();
            expect(root.querySelector('fd-upload-collection')!.hasAttribute('data-small')).toBe(true);
            expect(group.getBoundingClientRect().top).toBeGreaterThanOrEqual(content.getBoundingClientRect().bottom);
            expect(group.getBoundingClientRect().width).toBeGreaterThan(400);
            // the file keeps its line, even without a thumbnail
            expect(content.getBoundingClientRect().width).toBeGreaterThan(400);
            fixture.destroy();
        });
    });
});
