/*
 * Port of @fundamental-ngx/core (token) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Directive,
    ElementRef,
    Injector,
    afterNextRender,
    booleanAttribute,
    computed,
    contentChild,
    contentChildren,
    effect,
    forwardRef,
    inject,
    input,
    model,
    output,
    signal,
    untracked
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Button } from '@/ui/button/button';
import { Icon, type IconFont } from '@/ui/icon/icon';
import { fieldStates, type FormState } from '@/ui/input/input';
import { Popover, PopoverBody, PopoverControl } from '@/ui/popover/popover';

/**
 * Token: a removable item such as a chosen value, usually in a tokenizer. Click and Space select
 * it, the close icon (or Backspace and Delete in a tokenizer) removes it.
 *
 * ```html
 * <fd-token (onCloseClick)="remove(value)">{{ value }}</fd-token>
 * ```
 */
@Component({
    selector: 'fd-token',
    exportAs: 'fdToken',
    imports: [Icon],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-flex max-w-full shrink-0' },
    template: `
        <span
            #wrapper
            role="option"
            [attr.tabindex]="tokenizer ? -1 : 0"
            [attr.aria-roledescription]="ariaRoleDescription()"
            [attr.aria-selected]="selected()"
            [attr.aria-disabled]="disabled() || null"
            [attr.aria-setsize]="position()?.[1] ?? null"
            [attr.aria-posinset]="position()?.[0] ?? null"
            [class]="tokenClass()"
            (click)="onClick($event)"
            (keydown)="onKeydown($event)"
            (focus)="elementFocused.emit(true)"
            (blur)="elementFocused.emit(false)"
        >
            <span class="w-full min-w-0 truncate select-none"><ng-content /></span>
            @if (!readOnly()) {
                <span aria-hidden="true" [class]="closeClass" (click)="closeClickHandler($event)">
                    <fd-icon glyph="decline" class="text-[length:inherit]" />
                </span>
            }
        </span>
    `
})
export class Token {
    readonly disabled = input(false, { transform: booleanAttribute });
    /** Selected tokens are removed together with Backspace or Delete. */
    readonly selected = model(false);
    readonly readOnly = input(false, { transform: booleanAttribute });
    readonly ariaRoleDescription = input('token');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    /** The close icon was clicked, or Backspace/Delete removed the token in a tokenizer. */
    readonly onCloseClick = output<MouseEvent | undefined>();
    /** Emitted by `Tokenizer.removeSelectedTokens()`. */
    readonly onRemove = output<void>();
    readonly onTokenClick = output<MouseEvent>();
    readonly onTokenKeydown = output<KeyboardEvent>();
    readonly elementFocused = output<boolean>();

    readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    protected readonly tokenizer = inject(
        forwardRef(() => Tokenizer),
        { optional: true }
    );

    /** Position in the tokenizer, for screen readers. */
    protected readonly position = computed<[number, number] | null>(() => {
        const tokens = this.tokenizer?.tokens() ?? [];
        const index = tokens.indexOf(this);
        return index < 0 ? null : [index + 1, tokens.length];
    });

    protected readonly closeClass =
        'm-0 box-border inline-flex h-(--tk-h) w-(--tk-close-w) min-w-(--tk-close-w) shrink-0 cursor-pointer items-center justify-center bg-transparent p-0 py-(--tk-close-py) px-(--tk-close-px) text-sap-font-small-size leading-5 text-(--tk-close)';

    protected readonly tokenClass = computed(() => {
        const selected = this.selected();
        const readOnly = this.readOnly();
        return cn(
            'relative m-0 box-border flex h-(--tk-h) max-w-full min-w-(--tk-min-w) shrink-0 cursor-default items-center justify-center p-0 ps-(--tk-ps) text-center leading-6 whitespace-nowrap outline-none',
            'font-sap-font-family text-sap-font-size text-(--tk-fg) rounded-[0.375rem] hc:rounded-[0.25rem] bg-(--tk-bg) border-width-sap-button-border-width border-solid border-(--tk-bc)',
            '[--tk-h:1.625rem] [--tk-min-w:3.625rem] [--tk-ps:0.3125rem] [--tk-close-w:1.75rem] [--tk-close-px:0.5rem] [--tk-close-py:0.25rem] [--tk-close:var(--sapContent_IconColor)]',
            'compact:[--tk-h:1.25rem] compact:[--tk-min-w:3rem] compact:[--tk-ps:0.25rem] compact:[--tk-close-w:1.25rem] compact:[--tk-close-px:0.25rem] compact:[--tk-close-py:0.125rem] compact:leading-[1.125rem]',
            '[--tk-fg:var(--sapTextColor)] [--tk-bg:var(--sapButton_TokenBackground)] [--tk-bc:var(--sapButton_TokenBorderColor)]',
            'hover:[--tk-bg:var(--sapButton_Hover_Background)]',
            // focus: an outer frame, the token corners grow to follow it
            'focus:outline-sap focus:outline-offset-1 focus:rounded-[0.5rem] compact:focus:outline-offset-0 hc:focus:-outline-offset-[0.1875rem] hc:focus:rounded-[0.1875rem]',
            selected &&
                !readOnly && [
                    '[--tk-fg:var(--sapButton_Selected_TextColor)] [--tk-bg:var(--sapButton_Selected_Background)] [--tk-bc:var(--sapButton_Selected_BorderColor)] [--tk-close:var(--sapButton_Selected_TextColor)]',
                    'hover:[--tk-bg:var(--sapButton_Selected_Hover_Background)] font-sap-font-semibold-duplex-family',
                    // a thicker bottom line
                    'shadow-[inset_0_-0.0625rem_0_0_var(--sapButton_Selected_BorderColor)] focus:outline-sap-content-focus-color hc:focus:outline-sap-content-contrast-focus-color'
                ],
            readOnly && [
                '[--tk-fg:var(--sapContent_LabelColor)] [--tk-bc:var(--sapField_ReadOnly_BorderColor)] [--tk-ps:0.3125rem] pe-(--tk-ps) compact:[--tk-ps:0.25rem]',
                'hc:[--tk-bg:var(--sapField_ReadOnly_Background)] hover:[--tk-bg:var(--sapButton_TokenBackground)] hc:hover:[--tk-bg:var(--sapField_ReadOnly_Background)]'
            ],
            this.disabled() && 'cursor-not-allowed opacity-(--sapContent_DisabledOpacity)',
            this.userClass()
        );
    });

    /** The focusable element of the token. */
    wrapper(): HTMLElement {
        return this.elementRef.nativeElement.firstElementChild as HTMLElement;
    }

    /** Text of the token. */
    text(): string {
        return this.elementRef.nativeElement.textContent?.trim() ?? '';
    }

    focus(): void {
        this.wrapper().focus();
    }

    closeClickHandler(event?: MouseEvent): void {
        event?.stopPropagation();
        if (!this.disabled() && !this.readOnly()) this.onCloseClick.emit(event);
    }

    protected onClick(event: MouseEvent): void {
        this.onTokenClick.emit(event);
    }

    protected onKeydown(event: KeyboardEvent): void {
        this.onTokenKeydown.emit(event);
    }
}

/** The text input of a tokenizer. */
@Directive({
    selector: 'input[fdTokenizerInput], input[fd-tokenizer-input]',
    host: {
        class: 'm-0 box-border h-full min-h-full min-w-12 flex-1 basis-full border-none bg-transparent px-[0.3125rem] py-0 shadow-none outline-none compact:min-w-8 compact:px-1 font-sap-font-family text-sap-font-size text-sap-field-text-color placeholder:italic placeholder:text-sap-field-placeholder-text-color hc:placeholder:not-italic  '
    }
})
export class TokenizerInput {
    readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);
}

/**
 * Tokenizer: tokens and an input in one field. When it does not have the focus, tokens that do not
 * fit collapse into an "n more" link that lists them in a popover. Arrow keys move between the
 * tokens and the input, Backspace and Delete remove the focused or selected tokens, Space selects,
 * Ctrl+A selects all, Ctrl and Shift clicks extend the selection.
 *
 * ```html
 * <fd-tokenizer>
 *     @for (value of values; track value) {
 *         <fd-token (onCloseClick)="remove(value)">{{ value }}</fd-token>
 *     }
 *     <input fdTokenizerInput aria-label="Values" />
 * </fd-tokenizer>
 * ```
 */
@Component({
    selector: 'fd-tokenizer',
    exportAs: 'fdTokenizer',
    imports: [Button, Popover, PopoverControl, PopoverBody],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block w-full',
        '(keydown)': 'onKeydown($event)',
        '(focusin)': 'onFocusin($event)',
        '(focusout)': 'onFocusout($event)'
    },
    template: `
        <div [class]="fieldClass()">
            <div #inner [class]="innerClass()">
                <div
                    role="listbox"
                    class="flex items-center"
                    [attr.aria-label]="tokenizerLabel()"
                    aria-multiselectable="true"
                >
                    <ng-content select="fd-token" />
                </div>
                @if (hiddenCount() > 0) {
                    @if (showOverflowPopover()) {
                        <fd-popover placement="bottom-start" [noArrow]="false" [(isOpen)]="overflowOpen">
                            <fd-popover-control>
                                <span
                                    role="button"
                                    tabindex="0"
                                    data-tokenizer-more
                                    [class]="moreClass"
                                    (click)="moreClickedEvent.emit()"
                                    >{{ moreText() }}</span
                                >
                            </fd-popover-control>
                            <fd-popover-body>
                                <ul
                                    role="list"
                                    class="m-0 list-none p-1 font-sap-font-family text-sap-font-size text-sap-text-color"
                                    [attr.aria-label]="tokenizerLabel()"
                                >
                                    @for (token of hiddenTokens(); track token) {
                                        <li class="flex min-h-8 items-center justify-between gap-2 ps-3">
                                            <span class="truncate">{{ token.text() }}</span>
                                            @if (!token.readOnly()) {
                                                <button
                                                    fdButton
                                                    variant="transparent"
                                                    glyph="decline"
                                                    [ariaLabel]="removeLabel() + ' ' + token.text()"
                                                    (click)="token.closeClickHandler($event)"
                                                ></button>
                                            }
                                        </li>
                                    }
                                </ul>
                            </fd-popover-body>
                        </fd-popover>
                    } @else {
                        <span
                            role="button"
                            tabindex="0"
                            data-tokenizer-more
                            [class]="moreClass"
                            (click)="moreClickedEvent.emit()"
                            (keydown.enter)="moreClickedEvent.emit()"
                            >{{ moreText() }}</span
                        >
                    }
                }
                <ng-content select="[fd-tokenizer-extra]" />
                <ng-content />
            </div>
            @if (glyph()) {
                <button
                    fdButton
                    variant="transparent"
                    type="button"
                    tabindex="-1"
                    class="shrink-0"
                    [glyph]="glyph()"
                    [glyphFont]="glyphFont()"
                    [ariaLabel]="glyphAriaLabel()"
                ></button>
            }
        </div>
    `
})
export class Tokenizer {
    /** Backspace and Delete do not remove tokens. */
    readonly disableKeyboardDeletion = input(false, { transform: booleanAttribute });
    /** Kept for compatibility: tokens always collapse while the tokenizer does not have the focus. */
    readonly compactCollapse = input(false, { transform: booleanAttribute });
    /** Shows the field focus frame while its input has the focus. */
    readonly tokenizerFocusable = input(true, { transform: booleanAttribute });
    /** Icon of an addon button after the field, e.g. a value help. */
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly glyphAriaLabel = input<string | null>(null);
    /** Text of the overflow link; `{count}` is the number of hidden tokens. */
    readonly moreTerm = input('{count} more');
    /** Lists the hidden tokens in a popover; otherwise only `moreClickedEvent` emits. */
    readonly showOverflowPopover = input(true, { transform: booleanAttribute });
    /** Tokens hidden by the owner (e.g. a multi-input), counted in the overflow link. */
    readonly externalHiddenCount = input(0);
    /** Keeps the tokens expanded, e.g. while a value help is open. */
    readonly open = input(false, { transform: booleanAttribute });
    readonly state = input<FormState | null | undefined>();
    readonly readonly = input(false, { transform: booleanAttribute });
    readonly tokenizerLabel = input('Tokenizer');
    readonly removeLabel = input('Remove');
    readonly tokensCountText = input('Contains total tokens: {length}.');
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly moreClickedEvent = output<void>();

    readonly tokens = contentChildren(Token);
    private readonly inputDir = contentChild(TokenizerInput);
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly direction = inject(Directionality, { optional: true });
    private readonly announcer = inject(LiveAnnouncer);
    private readonly injector = inject(Injector);
    readonly focused = signal(false);
    protected readonly overflowOpen = signal(false);
    /** Tokens collapsed into the overflow link. */
    private readonly collapsed = signal<Token[]>([]);
    private anchor: number | null = null;

    readonly hiddenTokens = computed(() => this.collapsed().filter((t) => this.tokens().includes(t)));
    protected readonly hiddenCount = computed(() => this.hiddenTokens().length + this.externalHiddenCount());
    protected readonly moreText = computed(() => this.moreTerm().replace('{count}', String(this.hiddenCount())));
    protected readonly moreClass =
        'shrink-0 cursor-pointer pe-2 font-sap-font-family text-sap-font-size text-sap-link-color whitespace-nowrap outline-none focus-visible:outline-sap';

    protected readonly fieldClass = computed(() =>
        cn(
            'relative box-border flex w-full min-h-sap-element-height items-center overflow-hidden p-0 compact:min-h-sap-element-compact-height',
            'rounded-sap-field-border-corner-radius border-width-sap-field-border-width [border-style:var(--sapField_BorderStyle)] border-sap-field-border-color shadow-sap-field-shadow',
            '[background:var(--sapField_BackgroundStyle)_var(--sapField_Background)]',
            'hover:[background:var(--sapField_Hover_BackgroundStyle)_var(--sapField_Hover_Background)] hover:border-sap-field-hover-border-color',
            this.tokenizerFocusable() && 'has-[input:focus]:outline-sap has-[input:focus]:-outline-offset-1',
            fieldStates[this.state() ?? 'default'],
            this.readonly() &&
                'border-dashed border-sap-field-read-only-border-color bg-sap-field-read-only-background shadow-none',
            this.userClass()
        )
    );
    protected readonly innerClass = computed(() =>
        cn(
            'flex h-full w-full items-center overflow-hidden px-[0.3125rem] whitespace-nowrap compact:px-1',
            '[&_fd-token]:me-[0.3125rem] compact:[&_fd-token]:me-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            this.expanded() && 'overflow-x-auto'
        )
    );
    /** All tokens show while the tokenizer has the focus or is open. */
    private readonly expanded = computed(() => this.focused() || this.open());

    constructor() {
        // collapse or expand after every change of tokens, focus or size
        effect(() => {
            this.tokens();
            this.expanded();
            untracked(() => afterNextRender(() => this.layout(), { injector: this.injector }));
        });
        const destroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer = new ResizeObserver(() => this.layout());
            observer.observe(this.el);
            const outside = (event: MouseEvent) => {
                if (!this.el.contains(event.target as Node)) this.tokens().forEach((t) => t.selected.set(false));
            };
            document.addEventListener('click', outside);
            const input = this.inputEl();
            const announce = () =>
                this.announcer.announce(this.tokensCountText().replace('{length}', String(this.tokens().length)));
            input?.addEventListener('focus', announce);
            destroyRef.onDestroy(() => {
                observer.disconnect();
                document.removeEventListener('click', outside);
                input?.removeEventListener('focus', announce);
            });
        });
        // clicks on tokens select them
        effect((onCleanup) => {
            const subs = this.tokens().map((token, index) =>
                token.onTokenClick.subscribe((event) => this.onTokenClick(token, index, event))
            );
            onCleanup(() => subs.forEach((s) => s.unsubscribe()));
        });
    }

    /** Emits `onRemove` of the selected tokens. */
    removeSelectedTokens(): void {
        this.activeTokens().forEach((t) => t.onRemove.emit());
    }

    focusTokenElement(index: number): void {
        this.tokens()[index]?.focus();
    }

    /** Hides tokens from the start until the rest, the overflow link and the input fit. */
    private layout(): void {
        const tokens = this.tokens();
        tokens.forEach((t) => (t.elementRef.nativeElement.style.display = ''));
        const inner = this.el.querySelector<HTMLElement>(':scope > div > div');
        if (!inner) return;
        if (this.expanded()) {
            if (this.collapsed().length) this.collapsed.set([]);
            inner.scrollLeft = this.rtl() ? -inner.scrollWidth : inner.scrollWidth;
            return;
        }
        const hidden: Token[] = [];
        // room for the overflow link once tokens hide; the last token always stays
        const moreWidth = inner.querySelector('[data-tokenizer-more]') ? 0 : 64;
        const fits = () => inner.scrollWidth <= inner.clientWidth - (hidden.length ? moreWidth : 0);
        for (const token of tokens) {
            if (fits() || hidden.length >= tokens.length - 1) break;
            token.elementRef.nativeElement.style.display = 'none';
            hidden.push(token);
        }
        const current = this.collapsed();
        if (current.length !== hidden.length || current.some((t, i) => t !== hidden[i])) this.collapsed.set(hidden);
    }

    /** Tokens expand while the input or a token has the focus, not the overflow link. */
    protected onFocusin(event: FocusEvent): void {
        if (!(event.target as Element).closest('[data-tokenizer-more]')) this.focused.set(true);
    }

    protected onFocusout(event: FocusEvent): void {
        const next = event.relatedTarget as Node | null;
        if (next && (this.el.contains(next) || (next as Element).closest?.('.cdk-overlay-container'))) return;
        this.focused.set(false);
    }

    private onTokenClick(token: Token, index: number, event: MouseEvent): void {
        if (token.disabled()) return;
        event.stopPropagation();
        token.focus();
        const tokens = this.tokens();
        if (event.ctrlKey || event.metaKey) {
            token.selected.update((v) => !v);
            this.anchor = index;
        } else if (event.shiftKey && this.anchor !== null) {
            const [from, to] = [Math.min(this.anchor, index), Math.max(this.anchor, index)];
            tokens.forEach((t, i) => t.selected.set(i >= from && i <= to));
        } else {
            tokens.forEach((t) => t.selected.set(t === token));
            this.anchor = index;
        }
    }

    protected onKeydown(event: KeyboardEvent): void {
        const tokens = this.tokens();
        const input = this.inputEl();
        const inInput = !!input && event.target === input;
        const index = inInput ? tokens.length : tokens.findIndex((t) => t.wrapper() === event.target);
        if (index < 0) return;
        const back = this.rtl() ? 'ArrowRight' : 'ArrowLeft';
        const forward = this.rtl() ? 'ArrowLeft' : 'ArrowRight';
        const caretAtStart = !inInput || (input.selectionStart === 0 && input.selectionEnd === 0);
        if ((event.key === 'Backspace' || event.key === 'Delete') && !this.disableKeyboardDeletion()) {
            if (inInput && !this.anySelected()) {
                if (event.key === 'Backspace' && !input.value && tokens.length) {
                    event.preventDefault();
                    this.focusTokenElement(tokens.length - 1);
                }
                return;
            }
            event.preventDefault();
            this.activeTokens().forEach((t) => t.onCloseClick.emit(undefined));
            if (event.key === 'Delete' || inInput) this.focusInput();
            else afterNextRender(() => this.focusTokenElement(Math.max(index - 1, 0)), { injector: this.injector });
            return;
        }
        if (inInput && !caretAtStart && event.key !== 'a') return;
        switch (event.key) {
            case back:
                if (index > 0) {
                    event.preventDefault();
                    this.focusTokenElement(index - 1);
                }
                break;
            case forward:
                if (!inInput) {
                    event.preventDefault();
                    if (index + 1 < tokens.length) this.focusTokenElement(index + 1);
                    else this.focusInput();
                }
                break;
            case ' ':
                if (!inInput) {
                    event.preventDefault();
                    const token = tokens[index];
                    tokens.forEach((t) => t !== token && t.selected.set(false));
                    token.selected.update((v) => !v);
                }
                break;
            case 'Enter':
                if (!inInput) this.focusInput();
                break;
            case 'a':
                if ((event.ctrlKey || event.metaKey) && !input?.value) {
                    event.preventDefault();
                    tokens.forEach((t) => t.selected.set(true));
                }
                break;
        }
    }

    private activeTokens(): Token[] {
        return this.tokens().filter((t) => t.selected() || t.wrapper() === document.activeElement);
    }

    private anySelected(): boolean {
        return this.tokens().some((t) => t.selected());
    }

    private inputEl(): HTMLInputElement | null {
        return this.inputDir()?.elementRef.nativeElement ?? this.el.querySelector('input');
    }

    private focusInput(): void {
        this.inputEl()?.focus();
    }

    private rtl(): boolean {
        return this.direction?.value === 'rtl';
    }
}
