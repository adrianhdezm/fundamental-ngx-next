import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
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
});
