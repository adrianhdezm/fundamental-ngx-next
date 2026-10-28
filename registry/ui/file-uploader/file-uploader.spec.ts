import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { FileUploader, FileUploaderService, parseFileSize } from './file-uploader';

@Component({
    imports: [FileUploader, FormsModule],
    template: `
        <fd-file-uploader
            ariaLabel="Document"
            placeholder="Select a file"
            accept=".png,.pdf"
            maxFileSize="1 KB"
            [(ngModel)]="files"
            (selectedInvalidFiles)="invalid.set($event)"
        />
    `
})
class Host {
    readonly files = signal<File[]>([]);
    readonly invalid = signal<File[]>([]);
    readonly uploader = viewChild.required(FileUploader);
}

const file = (name: string, size = 10) => new File(['x'.repeat(size)], name);
const transfer = (files: File[]) => {
    const data = new DataTransfer();
    files.forEach((f) => data.items.add(f));
    return data;
};

async function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host: fixture.componentInstance,
        field: root.querySelector<HTMLInputElement>('input[type=text]')!,
        fileInput: root.querySelector<HTMLInputElement>('input[type=file]')!,
        dropZone: root.querySelector<HTMLElement>('[fdFileDragnDrop]')!
    };
}

@Component({
    imports: [FileUploader, ReactiveFormsModule],
    template: `
        <div style="width: 600px">
            <fd-file-uploader
                ariaLabel="Attachment"
                placeholder="Select a file"
                [formControl]="control"
                [width]="width()"
                [fileLimit]="fileLimit()"
                (selectedInvalidFiles)="invalid.set($event)"
                (onDragEnter)="drags.update((d) => [...d, 'enter'])"
                (onDragLeave)="drags.update((d) => [...d, 'leave'])"
            />
        </div>
    `
})
class OptionsHost {
    readonly control = new FormControl<File[]>([]);
    readonly width = signal<string | null>(null);
    readonly fileLimit = signal<number | null>(null);
    readonly invalid = signal<File[]>([]);
    readonly drags = signal<string[]>([]);
}

async function setupOptions(init: (host: OptionsHost) => void = () => {}) {
    const fixture = TestBed.createComponent(OptionsHost);
    init(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
        fixture,
        host: fixture.componentInstance,
        root,
        field: root.querySelector<HTMLInputElement>('input[type=text]')!,
        button: root.querySelector<HTMLButtonElement>('button')!,
        fileInput: root.querySelector<HTMLInputElement>('input[type=file]')!,
        dropZone: root.querySelector<HTMLElement>('[fdFileDragnDrop]')!
    };
}

describe('parseFileSize', () => {
    it('reads sizes with units', () => {
        expect(parseFileSize('')).toBe(0);
        expect(parseFileSize('500')).toBe(500);
        expect(parseFileSize('2 KB')).toBe(2048);
        expect(parseFileSize('1.5MB')).toBe(1.5 * 1024 * 1024);
        expect(() => parseFileSize('big')).toThrow();
    });
});

describe('FileUploaderService', () => {
    it('splits files by size and extension', () => {
        const service = TestBed.inject(FileUploaderService);
        const result = service.validateFiles(
            [file('a.png'), file('b.txt'), file('c.PDF', 2000)],
            '',
            '1 KB',
            '.png, .pdf'
        );
        expect(result.validFiles!.map((f) => f.name)).toEqual(['a.png']);
        expect(result.invalidFiles!.map((f) => f.name)).toEqual(['b.txt', 'c.PDF']);
    });

    it('rejects files below minFileSize, alone and between min and max with an extension filter', () => {
        const service = TestBed.inject(FileUploaderService);
        const names = (files?: File[]) => files!.map((f) => f.name);
        const files = [file('tiny.png', 100), file('mid.png', 1500), file('mid.txt', 1500), file('big.png', 3000)];

        const minOnly = service.validateFiles(files, '1 KB', '', null);
        expect(names(minOnly.validFiles)).toEqual(['mid.png', 'mid.txt', 'big.png']);
        expect(names(minOnly.invalidFiles)).toEqual(['tiny.png']);

        const range = service.validateFiles(files, '1 KB', '2 KB', '.png');
        expect(names(range.validFiles)).toEqual(['mid.png']);
        expect(names(range.invalidFiles)).toEqual(['tiny.png', 'mid.txt', 'big.png']);
    });
});

describe('FileUploader', () => {
    it('shows chosen files and reports the valid ones to the form', async () => {
        const { host, field, fileInput, fixture } = await setup();
        expect(field.getAttribute('placeholder')).toBe('Select a file');
        fileInput.files = transfer([file('one.png'), file('two.txt')]).files;
        fileInput.dispatchEvent(new Event('change'));
        await fixture.whenStable();
        expect(host.files().map((f) => f.name)).toEqual(['one.png']);
        expect(host.invalid().map((f) => f.name)).toEqual(['two.txt']);
        expect(field.value).toBe('one.png');
        expect(document.activeElement).toBe(field);
    });

    it('accepts dropped files', async () => {
        const { host, dropZone, fixture } = await setup();
        dropZone.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer([file('drop.pdf')]), bubbles: true }));
        await fixture.whenStable();
        expect(host.files().map((f) => f.name)).toEqual(['drop.pdf']);
    });

    it('opens the file dialog from the field with Enter and ignores typing', async () => {
        const { field, fileInput } = await setup();
        const click = vi.spyOn(fileInput, 'click').mockImplementation(() => undefined);
        field.focus();
        await userEvent.keyboard('abc');
        expect(field.value).toBe('');
        await userEvent.keyboard('{Enter}');
        expect(click).toHaveBeenCalledTimes(1);
    });

    it('clears the files from the form and with clear()', async () => {
        const { host, field, fileInput, fixture } = await setup();
        fileInput.files = transfer([file('one.png')]).files;
        fileInput.dispatchEvent(new Event('change'));
        await fixture.whenStable();
        host.uploader().clear();
        await fixture.whenStable();
        expect(host.files()).toEqual([]);
        expect(field.value).toBe('');
    });

    it('disables the field and the button when the form control is disabled', async () => {
        const { fixture, host, field, button, fileInput } = await setupOptions();
        const click = vi.spyOn(fileInput, 'click').mockImplementation(() => undefined);
        host.control.disable();
        await fixture.whenStable();
        expect(field.disabled).toBe(true);
        expect(button.disabled).toBe(true);
        expect(fileInput.disabled).toBe(true);
        await userEvent.click(button, { force: true });
        expect(click).not.toHaveBeenCalled();
        host.control.enable();
        await fixture.whenStable();
        expect(field.disabled).toBe(false);
        await userEvent.click(button);
        expect(click).toHaveBeenCalledTimes(1);
    });

    it('fixes the field to the given width and truncates long names', async () => {
        const { fixture, host, field, fileInput } = await setupOptions();
        const grown = field.getBoundingClientRect().width;
        expect(grown).toBeGreaterThan(300);
        host.width.set('150px');
        await fixture.whenStable();
        expect(field.getBoundingClientRect().width).toBe(150);
        fileInput.files = transfer([file('a_very_long_file_name_that_does_not_fit_in_the_field.pdf')]).files;
        fileInput.dispatchEvent(new Event('change'));
        await fixture.whenStable();
        expect(field.getBoundingClientRect().width).toBe(150);
        expect(getComputedStyle(field).textOverflow).toBe('ellipsis');
        expect(field.scrollWidth).toBeGreaterThan(field.clientWidth);
        expect(field.title).toBe('a_very_long_file_name_that_does_not_fit_in_the_field.pdf');
    });

    it('rejects all chosen files when there are more than fileLimit', async () => {
        const { fixture, host, fileInput } = await setupOptions((h) => h.fileLimit.set(2));
        fileInput.files = transfer([file('a.png'), file('b.png'), file('c.png')]).files;
        fileInput.dispatchEvent(new Event('change'));
        await fixture.whenStable();
        expect(host.control.value).toEqual([]);
        expect(host.invalid().map((f) => f.name)).toEqual(['a.png', 'b.png', 'c.png']);
        fileInput.files = transfer([file('a.png'), file('b.png')]).files;
        fileInput.dispatchEvent(new Event('change'));
        await fixture.whenStable();
        expect(host.control.value!.map((f) => f.name)).toEqual(['a.png', 'b.png']);
    });

    it('emits onDragEnter and onDragLeave once while dragging over, also across children', async () => {
        const { host, dropZone, field } = await setupOptions();
        dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));
        field.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));
        field.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
        expect(host.drags()).toEqual(['enter']);
        dropZone.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
        expect(host.drags()).toEqual(['enter', 'leave']);
    });
});
