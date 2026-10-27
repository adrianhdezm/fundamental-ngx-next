/*
 * Port of @fundamental-ngx/core (formatted-text) with the visual design of fundamental-styles,
 * Copyright (c) SAP SE or an SAP affiliate company and Fundamental Library contributors.
 * Modified for fundamental-ngx-next: rewritten with Angular signals, the Angular CDK and Tailwind CSS.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

export type LinkTarget = '' | '_blank' | '_self' | '_top' | '_parent' | '_search';

const TAGS = new Set([
    'A',
    'ABBR',
    'BLOCKQUOTE',
    'BR',
    'CITE',
    'CODE',
    'DL',
    'DT',
    'DD',
    'EM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'P',
    'PRE',
    'STRONG',
    'SPAN',
    'U',
    'UL',
    'OL',
    'LI'
]);
const ATTRIBUTES = ['class', 'style', 'href', 'target', 'download', 'hreflang', 'rel', 'type', 'title'];
/** Elements removed with their content. */
const DROPPED = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH']);
const SAFE_SCHEMES = ['http', 'https', 'ftp', 'mailto'];

/**
 * Keeps whitelisted tags and attributes only. Links with a scheme other than http(s), ftp or mailto
 * lose their href; external links open in `linkTarget`.
 */
export function sanitizeFormattedText(html: string, linkTarget: LinkTarget = '_blank'): string {
    const doc = new DOMParser().parseFromString(`<body>${html.trim()}</body>`, 'text/html');
    const copy = (node: Node, into: Node): void => {
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                into.appendChild(document.createTextNode(child.textContent ?? ''));
            } else if (child instanceof Element && TAGS.has(child.tagName)) {
                const el = document.createElement(child.tagName);
                for (const name of ATTRIBUTES) {
                    const value = child.getAttribute(name);
                    if (value === null) continue;
                    if (name === 'href' && value.includes(':') && !SAFE_SCHEMES.some((s) => value.startsWith(`${s}:`)))
                        continue;
                    el.setAttribute(name, value);
                }
                if (el.tagName === 'A') {
                    const href = el.getAttribute('href');
                    if (!href || href.startsWith('#')) el.removeAttribute('target');
                    else if (linkTarget) el.setAttribute('target', linkTarget);
                    if (el.getAttribute('target') === '_blank' && !/\bnoopener\b/.test(el.getAttribute('rel') ?? ''))
                        el.setAttribute('rel', `${el.getAttribute('rel') ?? ''} noopener`.trim());
                }
                copy(child, el);
                into.appendChild(el);
            } else if (child instanceof Element && !DROPPED.has(child.tagName.toUpperCase())) {
                // other tags are dropped but their text is kept
                copy(child, into);
            }
        }
    };
    const out = document.createElement('div');
    copy(doc.body, out);
    return out.innerHTML;
}

/** Restores document typography that Tailwind's preflight removes, with SAP fonts and sizes. */
const TYPOGRAPHY = [
    'block font-sap-font-family text-sap-font-size leading-(--sapContent_LineHeight) text-sap-text-color',
    '[&_p]:my-[0.5em] [&_blockquote]:my-[0.5em] [&_blockquote]:mx-8 [&_pre]:my-[0.5em] [&_dl]:my-[0.5em] [&_dd]:ms-8',
    '[&_ul]:my-[0.5em] [&_ul]:list-disc [&_ul]:ps-8 [&_ol]:my-[0.5em] [&_ol]:list-decimal [&_ol]:ps-8',
    '[&_h1]:my-[0.5em] [&_h2]:my-[0.5em] [&_h3]:my-[0.5em] [&_h4]:my-[0.5em] [&_h5]:my-[0.5em] [&_h6]:my-[0.5em]',
    '[&_h1]:font-sap-font-header-family [&_h2]:font-sap-font-header-family [&_h3]:font-sap-font-header-family',
    '[&_h4]:font-sap-font-header-family [&_h5]:font-sap-font-header-family [&_h6]:font-sap-font-header-family',
    '[&_h1]:text-sap-font-header1-size [&_h2]:text-sap-font-header2-size [&_h3]:text-sap-font-header3-size',
    '[&_h4]:text-sap-font-header4-size [&_h5]:text-sap-font-header5-size [&_h6]:text-sap-font-header6-size',
    '[&_strong]:font-sap-font-bold-family [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_abbr]:underline [&_abbr]:decoration-dotted',
    '[&_code]:font-sap-content-monospace-font-family [&_pre]:font-sap-content-monospace-font-family',
    '[&_a]:text-sap-link-color [&_a:hover]:underline'
].join(' ');

/**
 * Renders a limited, sanitised subset of HTML (paragraphs, headings, lists, emphasis, links, code).
 *
 * ```html
 * <fd-formatted-text [htmlText]="releaseNotes" height="10rem" />
 * ```
 */
@Component({
    selector: 'fd-formatted-text',
    exportAs: 'fdFormattedText',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'typography',
        '[class.overflow-y-auto]': '!!height()',
        '[class.overflow-x-auto]': '!!width()',
        '[style.height]': 'height()',
        '[style.width]': 'width()',
        '[innerHTML]': 'sanitizedHtml()'
    },
    template: ''
})
export class FormattedText {
    readonly htmlText = input<string | null | undefined>();
    /** Target of converted external links. */
    readonly convertedLinksDefaultTarget = input<LinkTarget>('_blank');
    readonly height = input<string | null | undefined>();
    readonly width = input<string | null | undefined>();

    protected readonly typography = TYPOGRAPHY;
    private readonly domSanitizer = inject(DomSanitizer);

    protected readonly sanitizedHtml = computed(() => {
        const raw = this.htmlText();
        if (!raw?.trim()) return '';
        // already reduced to the whitelist above
        return this.domSanitizer.bypassSecurityTrustHtml(
            sanitizeFormattedText(raw, this.convertedLinksDefaultTarget())
        );
    });
}
