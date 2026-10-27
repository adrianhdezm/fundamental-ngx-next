import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { FormControl } from '@/ui/input/input';
import { Fieldset, FormGroup, FormGroupHeader, FormHeader, FormItem, FormLabel, FormLegend } from './form';
import { FormInputMessageGroup } from './form-input-message-group';
import { FormMessage, type FormMessageType } from './form-message';

@Component({
    imports: [FormControl, FormItem, FormLabel],
    template: `
        <div fdFormItem id="item-name">
            <label fdFormLabel id="name-label" for="name" required colon>Name</label>
            <input fdFormControl id="name" />
        </div>
        <div fdFormItem id="item-plain">
            <label fdFormLabel for="plain">Plain</label><input fdFormControl id="plain" />
        </div>
        <div fdFormItem>
            <label
                fdFormLabel
                for="vat"
                inlineHelpContent="Country code and digits"
                [inlineHelpPlacement]="helpPlacement()"
                >VAT</label
            >
            <input fdFormControl id="vat" />
        </div>
        <div fdFormItem><label fdFormLabel for="off" disabled>Off</label><input fdFormControl id="off" disabled /></div>
        <div fdFormItem horizontal id="item-horizontal">
            <label fdFormLabel for="amount">Amount</label>
            <input fdFormControl id="amount" />
            <label fdFormLabel unitDescription>EUR</label>
        </div>
        <div style="display: flex; height: 60px" id="row">
            <label fdFormLabel id="alone" independent>Stand-alone</label>
            <label fdFormLabel id="dependent">Dependent</label>
        </div>
        <div style="width: 120px">
            <label fdFormLabel id="wrap" allowWrap>A long label that is allowed to wrap onto lines</label>
            <label fdFormLabel id="truncate">A long label that is truncated at the end</label>
        </div>
    `
})
class LabelHost {
    readonly helpPlacement = signal<'before' | 'after'>('after');
}

@Component({
    imports: [Fieldset, FormLegend, FormGroup, FormItem, FormLabel, FormControl, FormHeader, FormGroupHeader],
    template: `
        <h4 fdFormHeader id="header">Address</h4>
        <fieldset fdFieldset id="fieldset" [disabled]="disabled()">
            <legend fdFormLegend id="legend" [disabled]="disabled()">Shipping address</legend>
            <fd-form-group id="column" withSpacing>
                <div fdFormItem><label fdFormLabel for="street">Street</label><input fdFormControl id="street" /></div>
                <div fdFormItem><label fdFormLabel for="city">City</label><input fdFormControl id="city" /></div>
            </fd-form-group>
        </fieldset>
        <fd-form-group id="inline" isInline>
            <div fdFormItem isInline><label fdFormLabel for="zip">Zip</label><input fdFormControl id="zip" /></div>
            <div fdFormItem isInline>
                <label fdFormLabel for="country">Country</label><input fdFormControl id="country" />
            </div>
        </fd-form-group>
        <fieldset fdFieldset>
            <legend fdFormLegend id="own-legend" [disabled]="legendDisabled()">Own legend</legend>
        </fieldset>
        <div fdFormGroupHeader id="group-header" [noBorder]="noBorder()">Group header</div>
    `
})
class LayoutHost {
    readonly disabled = signal(false);
    readonly noBorder = signal(false);
    readonly legendDisabled = signal(false);
}

@Component({
    imports: [FormMessage, FormInputMessageGroup, FormControl],
    template: `
        <fd-form-message id="message" [type]="type()" [valueStateMessage]="prefix()"
            >Explains the state</fd-form-message
        >
        <fd-form-input-message-group>
            <input fdFormControl id="own" aria-label="Own" aria-describedby="own-hint" />
            <fd-form-message type="error">Error</fd-form-message>
        </fd-form-input-message-group>
        <span id="own-hint">Hint</span>
        <fd-form-input-message-group>
            <input fdFormControl id="errormessage" aria-label="Error message" aria-errormessage="custom-error" />
            <fd-form-message id="custom-error" type="error">Custom</fd-form-message>
        </fd-form-input-message-group>
        <fd-form-input-message-group [(isOpen)]="open">
            <input fdFormControl id="toggle" aria-label="Toggle" />
            @if (showMessage()) {
                <fd-form-message type="error">Shown</fd-form-message>
            }
        </fd-form-input-message-group>
    `
})
class MessageHost {
    readonly type = signal<FormMessageType>('error');
    readonly prefix = signal('');
    readonly showMessage = signal(true);
    readonly open = signal(false);
}

@Component({
    imports: [FormMessage, FormInputMessageGroup, FormControl],
    template: `
        @for (group of groups; track group) {
            <fd-form-input-message-group [popoverAriaLabel]="ariaLabel()">
                <input fdFormControl [id]="'field-' + group" [attr.aria-label]="'Field ' + group" [state]="type()" />
                <fd-form-message [type]="type()">{{ text() }} {{ group }}</fd-form-message>
            </fd-form-input-message-group>
        }
    `
})
class GroupsHost {
    readonly groups = [1, 2, 3, 4];
    readonly type = signal<FormMessageType>('error');
    readonly text = signal('Message');
    readonly ariaLabel = signal('Field validation messages');
}

const frame = () => new Promise((r) => requestAnimationFrame(r));

async function render<T>(type: Type<T>, configure?: (host: T) => void) {
    const fixture = TestBed.createComponent(type);
    configure?.(fixture.componentInstance);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
        await fixture.whenStable();
        await frame();
        await fixture.whenStable();
    };
    await stable();
    const $ = <E extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<E>(selector)!;
    return { fixture, host: fixture.componentInstance, root, $, stable };
}

const labelText = (label: HTMLElement) => label.querySelector<HTMLElement>(':scope > span')!;

describe('Form', () => {
    describe('FormLabel', () => {
        it('names the control and focuses it on click', async () => {
            const { $ } = await render(LabelHost);
            expect($<HTMLLabelElement>('#name-label').control).toBe($('#name'));
            await expect.element(page.getByRole('textbox', { name: 'Plain', exact: true })).toBeInTheDocument();
            await userEvent.click(labelText($('#name-label')));
            expect(document.activeElement).toBe($('#name'));
        });

        it('required shows an asterisk with empty alt text and colon a colon', async () => {
            const { $ } = await render(LabelHost);
            const required = labelText($('#name-label'));
            expect(getComputedStyle(required, '::after').content).toContain('"*"');
            expect(getComputedStyle(required, '::before').content).toBe('":"');
            const plain = labelText($('label[for=plain]'));
            expect(getComputedStyle(plain, '::after').content).toBe('none');
            expect(getComputedStyle(plain, '::before').content).toBe('none');
            // the colon sits before the asterisk at the end of the text
            expect(parseFloat(getComputedStyle(required, '::before').right)).toBeGreaterThan(
                parseFloat(getComputedStyle(required, '::after').right)
            );
        });

        it('inline help adds a focusable help icon that opens the help text', async () => {
            const { $, host, stable } = await render(LabelHost);
            const label = $('label[for=vat]');
            const icon = label.querySelector<HTMLElement>('fd-icon')!;
            expect(icon.getAttribute('tabindex')).toBe('0');
            expect(icon.getAttribute('aria-label')).toBe('Country code and digits');
            expect(icon.previousElementSibling).toBe(labelText(label));
            icon.focus();
            await stable();
            expect(document.querySelector('[role=tooltip]')!.textContent).toContain('Country code and digits');
            icon.blur();
            host.helpPlacement.set('before');
            await stable();
            expect(label.firstElementChild!.tagName).toBe('FD-ICON');
        });

        it('a disabled label is dimmed', async () => {
            const { $ } = await render(LabelHost);
            const text = labelText($('label[for=off]'));
            expect(text.getAttribute('aria-disabled')).toBe('true');
            expect(Number(getComputedStyle(text).opacity)).toBeLessThan(1);
            expect(labelText($('label[for=plain]')).hasAttribute('aria-disabled')).toBe(false);
        });

        it('an independent label renders stand-alone: centred, with no end margin', async () => {
            const { $ } = await render(LabelHost);
            const row = $('#row').getBoundingClientRect();
            const alone = labelText($('#alone'));
            const dependent = labelText($('#dependent'));
            const middle = (r: DOMRect) => r.top + r.height / 2;
            expect(Math.abs(middle(alone.getBoundingClientRect()) - middle(row))).toBeLessThanOrEqual(1);
            expect(getComputedStyle(alone).marginInlineEnd).toBe('0px');
            expect(dependent.getBoundingClientRect().top).toBeLessThan(alone.getBoundingClientRect().top);
            expect(getComputedStyle(dependent).marginInlineEnd).not.toBe('0px');
        });

        it('gets a generated id', async () => {
            const { $ } = await render(LabelHost);
            expect($('label[for=plain]').id).toMatch(/^fd-form-label-\d+$/);
            expect($('#name-label').id).toBe('name-label');
        });

        it('allowWrap wraps long labels, otherwise they are truncated', async () => {
            const { $ } = await render(LabelHost);
            const wrap = labelText($('#wrap'));
            const truncate = labelText($('#truncate'));
            expect(wrap.getBoundingClientRect().height).toBeGreaterThan(truncate.getBoundingClientRect().height * 1.5);
            expect(truncate.scrollWidth).toBeGreaterThan(truncate.clientWidth);
            expect(getComputedStyle(truncate).textOverflow).toBe('ellipsis');
        });
    });

    describe('FormItem', () => {
        it('stacks the label above the control by default', async () => {
            const { $ } = await render(LabelHost);
            const label = $('label[for=plain]').getBoundingClientRect();
            const input = $('#plain').getBoundingClientRect();
            expect(input.top).toBeGreaterThanOrEqual(label.bottom - 1);
            expect(Math.abs(input.left - label.left)).toBeLessThanOrEqual(1);
        });

        it('horizontal puts label, control and unit description on one line', async () => {
            const { $ } = await render(LabelHost);
            const label = $('label[for=amount]').getBoundingClientRect();
            const input = $('#amount').getBoundingClientRect();
            const unit = $('#item-horizontal label:last-child').getBoundingClientRect();
            expect(input.left).toBeGreaterThanOrEqual(label.right - 1);
            expect(unit.left).toBeGreaterThanOrEqual(input.right - 1);
            const middle = (r: DOMRect) => r.top + r.height / 2;
            expect(Math.abs(middle(label) - middle(input))).toBeLessThan(input.height / 2);
        });
    });

    describe('Fieldset and groups', () => {
        it('fieldset and legend form a named group', async () => {
            const { $ } = await render(LayoutHost);
            const fieldset = $('#fieldset');
            expect(fieldset.tagName).toBe('FIELDSET');
            expect(fieldset.firstElementChild).toBe($('#legend'));
            await expect.element(page.getByRole('group', { name: 'Shipping address' })).toBeInTheDocument();
            // no browser chrome
            expect(getComputedStyle(fieldset).borderTopWidth).toBe('0px');
            expect(getComputedStyle(fieldset).paddingTop).toBe('0px');
        });

        it('disabling the fieldset disables its controls and dims the legend', async () => {
            const { $, host, stable } = await render(LayoutHost);
            host.disabled.set(true);
            await stable();
            expect($<HTMLInputElement>('#street').matches(':disabled')).toBe(true);
            expect(Number(getComputedStyle($('#legend')).opacity)).toBeLessThan(1);
        });

        it('a disabled legend is dimmed on its own', async () => {
            const { $, host, stable } = await render(LayoutHost);
            const legend = $('#own-legend');
            expect(getComputedStyle(legend).opacity).toBe('1');
            host.legendDisabled.set(true);
            await stable();
            expect(Number(getComputedStyle(legend).opacity)).toBeLessThan(1);
            expect(legend.closest('fieldset')!.disabled).toBe(false);
        });

        it('a form group stacks items in a column; withSpacing adds the gap', async () => {
            const { $ } = await render(LayoutHost);
            const street = $('#street').closest<HTMLElement>('[fdFormItem]')!.getBoundingClientRect();
            const city = $('#city').closest<HTMLElement>('[fdFormItem]')!.getBoundingClientRect();
            expect(city.top - street.bottom).toBe(10);
        });

        it('isInline lays the items out in a row', async () => {
            const { $ } = await render(LayoutHost);
            const zip = $('#zip').closest<HTMLElement>('[fdFormItem]')!.getBoundingClientRect();
            const country = $('#country').closest<HTMLElement>('[fdFormItem]')!.getBoundingClientRect();
            expect(country.left).toBeGreaterThanOrEqual(zip.right - 1);
            expect(country.top).toBe(zip.top);
        });

        it('form header and group header are title bars with a bottom line', async () => {
            const { $, host, stable } = await render(LayoutHost);
            const header = $('#header');
            expect(getComputedStyle(header).display).toBe('flex');
            expect(getComputedStyle(header).boxShadow).not.toBe('none');
            expect(header.querySelector('span')!.textContent).toBe('Address');
            expect(getComputedStyle(header.querySelector('span')!).textOverflow).toBe('ellipsis');

            const groupHeader = $('#group-header');
            expect(getComputedStyle(groupHeader).fontWeight).toBe('700');
            expect(getComputedStyle(groupHeader).borderBottomWidth).not.toBe('0px');
            host.noBorder.set(true);
            await stable();
            expect(getComputedStyle(groupHeader).borderBottomWidth).toBe('0px');
        });
    });

    describe('FormMessage', () => {
        it('types show a glyph, a background and a hidden type description', async () => {
            const { $, host, stable } = await render(MessageHost);
            const message = $('#message');
            expect(message.getAttribute('aria-live')).toBe('assertive');
            const seen = new Set<string>();
            for (const [type, label] of [
                ['error', 'Invalid Entry'],
                ['warning', 'Warning'],
                ['success', 'Success'],
                ['information', 'Information']
            ] as const) {
                host.type.set(type);
                await stable();
                const srOnly = message.querySelector<HTMLElement>('.sr-only-sap')!;
                expect(srOnly.textContent).toBe(label);
                expect(srOnly.getBoundingClientRect().width).toBeLessThanOrEqual(1);
                expect(message.getAttribute('data-glyph')).toBeTruthy();
                seen.add(getComputedStyle(message).backgroundColor);
            }
            expect(seen.size).toBe(4);
            host.prefix.set('Check this');
            await stable();
            expect(message.querySelector('.sr-only-sap')!.textContent).toBe('Check this');
        });

        it('the message group keeps an author aria-describedby but still marks errors invalid', async () => {
            const { $ } = await render(MessageHost);
            const input = $('#own');
            expect(input.getAttribute('aria-describedby')).toBe('own-hint');
            expect(input.getAttribute('aria-invalid')).toBe('true');
        });

        it('aria-errormessage is moved to aria-describedby', async () => {
            const { $ } = await render(MessageHost);
            const input = $('#errormessage');
            expect(input.hasAttribute('aria-errormessage')).toBe(false);
            expect(input.getAttribute('aria-describedby')).toBe('custom-error');
            expect(input.getAttribute('aria-invalid')).toBe('true');
        });

        it('removing the message removes the managed aria-describedby and aria-invalid', async () => {
            const { $, host, stable } = await render(MessageHost);
            const input = $('#toggle');
            expect(input.getAttribute('aria-describedby')).toMatch(/^fd-form-message-\d+$/);
            expect(input.getAttribute('aria-invalid')).toBe('true');
            host.showMessage.set(false);
            await stable();
            expect(input.hasAttribute('aria-describedby')).toBe(false);
            expect(input.hasAttribute('aria-invalid')).toBe(false);
        });

        it('the message opens under the field on focus and isOpen follows it', async () => {
            const { $, host, stable } = await render(MessageHost);
            const input = $('#toggle');
            await userEvent.click(input);
            await stable();
            expect(host.open()).toBe(true);
            const message = document.getElementById(input.getAttribute('aria-describedby')!)!;
            expect(message.textContent).toContain('Shown');
            expect(message.getBoundingClientRect().top).toBeGreaterThanOrEqual(
                input.getBoundingClientRect().bottom - 1
            );
            await userEvent.tab();
            await stable();
            expect(host.open()).toBe(false);
        });
        describe('message groups', () => {
            const openMessages = () =>
                [...document.querySelectorAll<HTMLElement>('.cdk-overlay-container fd-form-message')].filter(
                    (m) => m.getBoundingClientRect().height > 0
                );
            const settle = async (stable: () => Promise<void>) => {
                await stable();
                await new Promise((r) => setTimeout(r, 50));
                await stable();
            };

            it('one click moves focus to another group and only its message stays open', async () => {
                const { $, stable } = await render(GroupsHost);
                await userEvent.click($('#field-1'));
                await settle(stable);
                expect(openMessages().map((m) => m.textContent)).toEqual([expect.stringContaining('Message 1')]);
                await userEvent.click($('#field-2'));
                await settle(stable);
                expect(document.activeElement).toBe($('#field-2'));
                expect(openMessages().map((m) => m.textContent)).toEqual([expect.stringContaining('Message 2')]);
            });

            it('rapid focus changes across groups leave only the focused group open', async () => {
                const { $, stable } = await render(GroupsHost);
                for (const id of [1, 3, 2, 4, 1, 3]) $(`#field-${id}`).focus();
                await settle(stable);
                expect(document.activeElement).toBe($('#field-3'));
                expect(openMessages().map((m) => m.textContent)).toEqual([expect.stringContaining('Message 3')]);
                for (const id of [4, 3, 2]) await userEvent.click($(`#field-${id}`));
                await settle(stable);
                expect(document.activeElement).toBe($('#field-2'));
                expect(openMessages().map((m) => m.textContent)).toEqual([expect.stringContaining('Message 2')]);
            });

            it('the message popover body has an aria-label (popoverAriaLabel)', async () => {
                const { $, host, stable } = await render(GroupsHost);
                await userEvent.click($('#field-1'));
                await settle(stable);
                const body = () => openMessages()[0].parentElement!.closest<HTMLElement>('[aria-label]')!;
                expect(body().getAttribute('aria-label')).toBe('Field validation messages');
                await userEvent.tab();
                await settle(stable);
                host.ariaLabel.set('VAT messages');
                await stable();
                await userEvent.click($('#field-1'));
                await settle(stable);
                expect(body().getAttribute('aria-label')).toBe('VAT messages');
            });

            it('non-error message types set aria-describedby without aria-invalid', async () => {
                const { $, host, stable } = await render(GroupsHost);
                const input = $('#field-1');
                const id = input.getAttribute('aria-describedby');
                expect(id).toMatch(/^fd-form-message-\d+$/);
                expect(input.getAttribute('aria-invalid')).toBe('true');
                for (const type of ['warning', 'success', 'information'] as const) {
                    host.type.set(type);
                    await stable();
                    expect(input.getAttribute('aria-describedby')).toBe(id);
                    expect(input.hasAttribute('aria-invalid')).toBe(false);
                }
                await userEvent.click(input);
                await settle(stable);
                expect(openMessages()[0].id).toBe(id);
            });

            it('changing the message text or type while open updates the popover', async () => {
                const { $, host, stable } = await render(GroupsHost);
                const input = $('#field-1');
                await userEvent.click(input);
                await settle(stable);
                const message = openMessages()[0];
                expect(message.textContent).toContain('Invalid Entry');
                const errorBackground = getComputedStyle(message).backgroundColor;
                host.text.set('Changed');
                host.type.set('warning');
                await settle(stable);
                expect(openMessages()).toEqual([message]);
                expect(message.textContent).toContain('Changed 1');
                expect(message.textContent).toContain('Warning');
                expect(getComputedStyle(message).backgroundColor).not.toBe(errorBackground);
                expect(message.getBoundingClientRect().top).toBeGreaterThanOrEqual(
                    input.getBoundingClientRect().bottom - 1
                );
                expect(document.activeElement).toBe(input);
            });
        });
    });
});
