import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    ElementRef,
    booleanAttribute,
    computed,
    inject,
    input,
    output
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { iconGlyphChar, iconVariants, type IconFont } from '@/ui/icon/icon';

export type TileType = 'kpi' | 'launch' | 'feed' | 'slide' | 'line';
export type TileSize = 's';

/** Box of a glyph rendered from the data-glyph attribute. */
const GLYPH = iconVariants();

/** Container of tiles; with list, line tiles stack vertically. */
@Directive({
    selector: '[fd-tile-container], [fdTileContainer]',
    host: { '[class]': 'computedClass()' }
})
export class TileContainer {
    readonly list = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex w-full flex-wrap rounded-sap-element-border-corner-radius border border-sap-tile-border-color bg-sap-tile-background p-2 font-sap-font-family text-sap-font-size text-sap-text-color shadow-sap-content-shadow0',
            this.list() && 'flex-col bg-sap-group-content-background',
            this.userClass()
        )
    );
}

/**
 * Tile: a fixed-size launch, KPI, feed or slide tile, or a line (link) tile.
 *
 * ```html
 * <fd-tile type="launch" clickable ariaLabel="Sales" (tileClick)="open()">
 *     <div fd-tile-header><div fd-tile-title>Sales</div></div>
 *     <div fd-tile-content>...</div>
 *     <div fd-tile-footer><span fd-tile-footer-text>Now</span></div>
 * </fd-tile>
 * ```
 *
 * Use `<a fd-tile href="...">` for a tile that navigates.
 */
@Component({
    selector: 'fd-tile, [fd-tile]',
    exportAs: 'fdTile',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.tabindex]': 'tabindex()',
        '[attr.role]': 'roleValue()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-labelledby]': 'ariaLabelledby()',
        '[attr.aria-disabled]': 'disabled() || null',
        '[attr.id]': 'id()',
        '[class]': 'computedClass()',
        '(click)': 'onClick()',
        '(keydown.enter)': 'onKey($event)',
        '(keydown.space)': '$event.target === $event.currentTarget && $event.preventDefault()',
        '(keyup.space)': 'onKey($event)'
    },
    template: `
        @if (action() && type() !== 'line') {
            <div
                class="absolute inset-0 z-4 m-0 size-full rounded-sap-element-border-corner-radius bg-sap-tile-background p-0 opacity-70"
            ></div>
        }
        <ng-content />
    `
})
export class Tile {
    readonly size = input<TileSize | null | undefined>();
    /** Double width. */
    readonly double = input(false, { transform: booleanAttribute });
    readonly type = input<TileType | null | undefined>();
    /** Action (edit) mode: shows the close and action indicator buttons and hides the footer and badge. */
    readonly action = input(false, { transform: booleanAttribute });
    /** Focusable, emits tileClick on click, Enter and Space. */
    readonly clickable = input(false, { transform: booleanAttribute });
    /** Line tiles only. */
    readonly disabled = input(false, { transform: booleanAttribute });
    /** Defaults to button for clickable tiles. */
    readonly role = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledby = input<string | null | undefined>();
    readonly id = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    readonly tileClick = output<void>();

    private readonly isLink = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'A';
    private readonly container = inject(TileContainer, { optional: true });

    readonly small = computed(() => this.size() === 's');
    readonly line = computed(() => this.type() === 'line');
    readonly inList = computed(() => !!this.container?.list());

    protected readonly tabindex = computed(() =>
        this.isLink ? null : this.clickable() && !this.disabled() ? 0 : null
    );
    protected readonly roleValue = computed(() =>
        this.isLink ? null : (this.role() ?? (this.clickable() ? 'button' : null))
    );

    protected onClick(): void {
        if ((this.isLink || this.clickable()) && !this.disabled()) this.tileClick.emit();
    }

    protected onKey(event: Event): void {
        if (this.isLink || !this.clickable() || this.disabled() || event.target !== event.currentTarget) return;
        event.preventDefault();
        this.tileClick.emit();
    }

    protected readonly computedClass = computed(() => {
        const small = this.small();
        const double = this.double();
        if (this.line()) {
            return cn(
                'relative m-0 my-1 me-2 box-border flex h-full max-h-(--tile-lh) min-h-(--tile-lh) w-auto max-w-full min-w-8 cursor-pointer items-center justify-between gap-2 px-2 py-0 last:me-0',
                '[--tile-lh:2rem] [--tile-lmh:3.25rem] [--tile-lnh:1.625rem] [--tile-ts:0.625rem] compact:[--tile-lh:1.625rem] compact:[--tile-lmh:2.875rem] compact:[--tile-lnh:1.4375rem] compact:[--tile-ts:0.5rem]',
                'rounded-sap-tile-border-corner-radius border border-sap-tile-border-color bg-sap-tile-background font-sap-font-family text-sap-font-size text-sap-text-color no-underline shadow-sap-content-shadow0',
                'hover:bg-sap-tile-hover-background hover:shadow-sap-content-shadow2 active:bg-sap-tile-active-background',
                'outline-none focus-visible:z-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sap-content-focus-color focus-visible:outline-solid',
                this.disabled() && 'pointer-events-none bg-transparent opacity-50',
                this.action() && 'pe-0',
                this.inList() && 'mx-0 max-h-(--tile-lmh) flex-wrap',
                this.userClass()
            );
        }
        return cn(
            'group/tile relative m-0 box-border block cursor-pointer p-[0.9375rem] font-sap-font-family text-sap-font-size leading-[normal] text-sap-text-color no-underline',
            'rounded-sap-element-border-corner-radius border border-sap-tile-border-color bg-sap-tile-background shadow-sap-content-shadow0',
            'hover:bg-sap-tile-hover-background hover:shadow-sap-content-shadow2 hc:hover:shadow-[0_0_0_0.125rem_var(--sapTile_BorderColor)]',
            'active:border-sap-tile-interactive-border-color active:bg-sap-tile-active-background active:shadow-none',
            'outline-none focus-visible:outline-sap focus-visible:-outline-offset-[0.1875rem]',
            small ? 'h-37 max-h-37 min-h-37 p-[0.4375rem]' : 'h-44 max-h-44 min-h-44',
            double
                ? small
                    ? 'w-76 max-w-76 min-w-76'
                    : 'w-90 max-w-90 min-w-90'
                : small
                  ? 'w-37 max-w-37 min-w-37'
                  : 'w-44 max-w-44 min-w-44',
            this.type() === 'slide' && 'flex items-end p-0',
            this.userClass()
        );
    });
}

/** Header (title and subtitle) area. */
@Directive({
    selector: '[fd-tile-header], [fdTileHeader]',
    host: { '[class]': 'computedClass()' }
})
export class TileHeader {
    readonly twoColumn = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() => {
        const tile = this.tile;
        if (tile?.line()) {
            return cn(
                'm-0 box-border flex h-full max-h-full min-h-full items-center overflow-hidden p-0',
                tile.inList() && 'flex-1 flex-wrap',
                tile.inList() &&
                    tile.action() &&
                    '[mask-image:linear-gradient(to_left,transparent,black_7%)] rtl:[mask-image:linear-gradient(to_right,transparent,black_7%)]',
                this.userClass()
            );
        }
        return cn(
            'm-0 mb-1 box-border overflow-hidden p-0',
            tile?.small() ? 'h-13 max-h-13 min-h-13' : 'h-[3.625rem] max-h-[3.625rem] min-h-[3.625rem]',
            this.twoColumn() && 'flex justify-between',
            this.userClass()
        );
    });
}

/** Header and content combined, for a longer title. */
@Directive({
    selector: '[fd-tile-header-content], [fdTileHeaderContent]',
    host: { '[class]': 'computedClass()' }
})
export class TileHeaderContent {
    readonly twoColumn = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 mb-1 box-border overflow-hidden p-0',
            this.tile?.small()
                ? 'h-[6.938rem] max-h-[6.938rem] min-h-[6.938rem]'
                : 'h-[7.75rem] max-h-[7.75rem] min-h-[7.75rem]',
            this.twoColumn() && 'flex justify-between',
            this.userClass()
        )
    );
}

/** Groups a badge and the title of a line tile. */
@Directive({
    selector: '[fd-tile-title-container], [fdTileTitleContainer]',
    host: { '[class]': 'computedClass()' }
})
export class TileTitleContainer {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn('m-0 box-border flex max-w-full items-center p-0', this.userClass())
    );
}

@Directive({
    selector: '[fd-tile-title], [fdTileTitle]',
    host: { '[class]': 'computedClass()' }
})
export class TileTitle {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    private readonly headerContent = inject(TileHeaderContent, { optional: true });
    protected readonly computedClass = computed(() => {
        const type = this.tile?.type();
        return cn(
            'm-0 box-border p-0 font-sap-font-family leading-[normal] font-bold',
            type === 'line'
                ? 'me-(--tile-ts) min-w-8 truncate text-sap-font-size leading-(--tile-lnh) text-sap-tile-title-text-color text-shadow-sap-content-text-shadow'
                : type === 'slide'
                  ? cn(
                        'line-clamp-2 text-sap-tile-overlay-foreground-color',
                        this.tile?.small() ? 'text-sap-font-small-size' : 'text-sap-font-size'
                    )
                  : cn(
                        'text-sap-font-header6-size text-sap-tile-title-text-color',
                        this.headerContent ? 'line-clamp-4' : 'line-clamp-2'
                    ),
            this.userClass()
        );
    });
}

@Directive({
    selector: '[fd-tile-subtitle], [fdTileSubtitle]',
    host: { '[class]': 'computedClass()' }
})
export class TileSubtitle {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() => {
        const type = this.tile?.type();
        return cn(
            'm-0 box-border truncate p-0 font-sap-font-family leading-[normal]',
            type === 'line'
                ? 'min-w-8 text-[0.875rem] leading-(--tile-lnh) text-sap-tile-text-color text-shadow-sap-content-text-shadow'
                : type === 'slide'
                  ? cn(
                        'text-sap-tile-overlay-foreground-color',
                        this.tile?.small() ? 'text-sap-font-small-size' : 'text-sap-font-size'
                    )
                  : 'text-sap-font-size text-sap-tile-text-color',
            this.userClass()
        );
    });
}

/** Content area. */
@Directive({
    selector: '[fd-tile-content], [fdTileContent]',
    host: { '[class]': 'computedClass()' }
})
export class TileContent {
    readonly twoColumn = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() => {
        const type = this.tile?.type();
        return cn(
            'm-0 mb-1 box-border overflow-hidden p-0',
            this.tile?.small()
                ? 'h-[3.438rem] max-h-[3.438rem] min-h-[3.438rem]'
                : 'h-[3.875rem] max-h-[3.875rem] min-h-[3.875rem]',
            (type === 'kpi' || type === 'launch' || type === 'feed') && 'flex items-end',
            this.twoColumn() && 'flex justify-between',
            this.userClass()
        );
    });
}

/** Footer area; hidden in action mode. */
@Directive({
    selector: '[fd-tile-footer], [fdTileFooter]',
    host: { '[class]': 'computedClass()' }
})
export class TileFooter {
    readonly twoColumn = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() => {
        const type = this.tile?.type();
        return cn(
            'm-0 box-border flex overflow-hidden p-0',
            this.tile?.small() ? 'h-[1.063rem] max-h-[1.063rem] min-h-[1.063rem]' : 'h-4 max-h-4 min-h-4',
            (type === 'kpi' || type === 'launch' || type === 'feed') && 'items-center',
            this.twoColumn() && 'justify-between',
            this.tile?.action() && 'hidden',
            this.userClass()
        );
    });
}

/** Half of a two-column header, content or footer. */
@Directive({
    selector: '[fd-tile-section], [fdTileSection]',
    host: { '[class]': 'computedClass()' }
})
export class TileSection {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly content = inject(TileContent, { optional: true });
    private readonly footer = inject(TileFooter, { optional: true });
    protected readonly computedClass = computed(() => {
        const type = (this.content ?? this.footer)?.tile?.type();
        const typed = type === 'kpi' || type === 'launch' || type === 'feed';
        return cn(
            'm-0 box-border h-full w-[calc(50%_-_0.125rem)] overflow-hidden p-0',
            this.content && typed && 'flex items-end',
            this.footer && typed && 'flex items-center last:justify-end',
            this.content &&
                type === 'feed' &&
                cn(
                    'w-auto first:me-1 first:max-w-full first:flex-1 first:flex-col first:items-start first:justify-end nth-2:ps-2',
                    this.content.tile?.small() ? 'nth-2:max-w-33' : 'nth-2:max-w-[10.25rem]'
                ),
            this.userClass()
        );
    });
}

/** Text of a feed tile. */
@Directive({
    selector: '[fd-tile-content-text], [fdTileContentText]',
    host: { '[class]': 'computedClass()' }
})
export class TileContentText {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 line-clamp-2 max-h-[2.125rem] max-w-full p-0 text-sap-font-small-size leading-[1.063rem] text-sap-tile-title-text-color',
            this.userClass()
        )
    );
}

/** Byline (e.g. a time stamp) of a feed tile. */
@Directive({
    selector: '[fd-tile-content-byline], [fdTileContentByline]',
    host: { '[class]': 'computedClass()' }
})
export class TileContentByline {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 max-w-full truncate p-0 text-sap-font-small-size leading-[1.063rem] text-sap-tile-text-color',
            this.userClass()
        )
    );
}

@Directive({
    selector: '[fd-tile-footer-text], [fdTileFooterText]',
    host: { '[class]': 'computedClass()' }
})
export class TileFooterText {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border truncate p-0 font-sap-font-family leading-[normal]',
            this.tile?.small() ? 'text-sap-font-small-size' : 'text-sap-font-size',
            this.tile?.type() === 'slide' ? 'text-sap-tile-overlay-foreground-color' : 'text-sap-tile-text-color',
            this.userClass()
        )
    );
}

/** Refresh icon of a tile footer; use it on a button to make it actionable. */
@Component({
    selector: '[fd-tile-refresh], [fdTileRefresh]',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.data-glyph]': 'glyphChar()',
        '[class]': 'computedClass()'
    }
})
export class TileRefresh {
    readonly glyph = input<string>('refresh');
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly ariaLabel = input<string | null>('Refresh');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly glyphChar = computed(() => iconGlyphChar(this.glyph(), this.glyphFont()));
    protected readonly computedClass = computed(() =>
        cn(
            iconVariants({ font: this.glyphFont() }),
            'me-2 min-w-[0.875rem] cursor-pointer border-0 bg-transparent p-0 text-center text-sap-font-size leading-[normal] text-sap-button-icon-color',
            'outline-none focus-visible:outline-sap',
            this.userClass()
        )
    );
}

let nextProfileImgId = 0;

/** Round profile image of a launch tile. */
@Directive({
    selector: '[fd-tile-profile-img], [fdTileProfileImg]',
    host: {
        role: 'img',
        '[attr.id]': 'id()',
        '[attr.aria-label]': 'ariaLabel()',
        '[attr.aria-labelledby]': 'ariaLabelledby()',
        '[style.background-image]': 'backgroundImage() ? "url(" + backgroundImage() + ")" : null',
        '[class]': 'computedClass()'
    }
})
export class TileProfileImg {
    readonly id = input(`fd-tile-profile-img-${++nextProfileImgId}`);
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaLabelledby = input<string | null | undefined>();
    readonly backgroundImage = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border block rounded-full bg-cover bg-center p-0',
            this.tile?.small() ? 'size-12 min-h-12 min-w-12' : 'size-14 min-h-14 min-w-14',
            this.userClass()
        )
    );
}

/** Company logo of a launch tile. */
@Directive({
    selector: '[fd-tile-logo], [fdTileLogo]',
    host: { '[class]': 'computedClass()' }
})
export class TileLogo {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            this.tile?.small()
                ? 'h-[1.438rem] max-h-[1.438rem] min-h-[1.438rem] w-12 max-w-12 min-w-12'
                : 'h-7 max-h-7 min-h-7 w-[3.625rem] max-w-[3.625rem] min-w-[3.625rem]',
            this.userClass()
        )
    );
}

/** Badge at the top end corner of a tile (inline in line tiles); hidden in action mode. */
@Directive({
    selector: '[fd-tile-badge], [fdTileBadge]',
    host: { '[class]': 'computedClass()' }
})
export class TileBadge {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'z-10 m-0 box-border h-4 max-w-[calc(100%_-_1rem)] truncate rounded-lg border border-(--fdBadge_Border_Color) bg-sap-highlight-color px-2 py-0 font-sap-font-family text-sap-font-small-size leading-[normal] font-bold text-sap-content-contrast-text-color',
            this.tile?.line() ? 'relative me-1.5 shrink-0' : 'absolute end-2 -top-[0.55rem]',
            this.tile?.action() && !this.tile.line() && 'hidden',
            this.userClass()
        )
    );
}

/** Background image of a slide tile. */
@Directive({
    selector: '[fd-tile-background-img], [fdTileBackgroundImg]',
    host: {
        '[style.background-image]': 'backgroundImage() ? "url(" + backgroundImage() + ")" : null',
        '[class]': 'computedClass()'
    }
})
export class TileBackgroundImg {
    readonly backgroundImage = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'absolute inset-0 m-0 box-border size-full rounded-sap-element-border-corner-radius bg-cover bg-center p-0 hover:opacity-90 active:opacity-80',
            this.userClass()
        )
    );
}

/** Play/pause button of a slide tile; shown on hover, focus and touch devices. */
@Component({
    selector: 'button[fd-tile-toggle], button[fdTileToggle]',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        type: 'button',
        '[attr.aria-label]': 'ariaLabel() ?? (playing() ? "Pause" : "Play")',
        '[attr.data-glyph]': 'glyphChar()',
        '[class]': 'computedClass()'
    }
})
export class TileToggle {
    /** Shows the pause glyph. */
    readonly playing = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly glyphChar = computed(() => iconGlyphChar(this.playing() ? 'media-pause' : 'media-play'));
    protected readonly computedClass = computed(() =>
        cn(
            'absolute -end-px -top-px z-5 m-0 box-border hidden size-12 cursor-pointer border-0 bg-transparent p-2 outline-none group-hover/tile:flex focus-visible:flex pointer-coarse:flex',
            'before:flex before:size-8 before:items-center before:justify-center before:rounded-full before:bg-sap-block-layer-background before:font-sap-content-icon-font-family before:text-[1rem] before:text-sap-button-emphasized-text-color before:opacity-60 before:text-shadow-sap-button-emphasized-text-shadow before:content-[attr(data-glyph)]',
            'hover:before:opacity-80 active:before:opacity-100 focus-visible:before:outline-sap',
            this.userClass()
        )
    );
}

/** Bottom band of a slide tile holding the header, footer and page indicator. */
@Directive({
    selector: '[fd-tile-slide-container], [fdTileSlideContainer]',
    host: { '[class]': 'computedClass()' }
})
export class TileSlideContainer {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'relative z-2 m-0 box-border flex w-full max-w-full flex-col justify-between rounded-b-sap-element-border-corner-radius bg-sap-tile-overlay-background',
            this.tile?.small()
                ? 'h-21 max-h-21 min-h-21 px-[0.4375rem] pt-[0.1875rem]'
                : 'h-[6.125rem] max-h-[6.125rem] min-h-[6.125rem] px-[0.9375rem] pt-1',
            this.userClass()
        )
    );
}

/** Page dots of a slide tile. */
@Directive({
    selector: '[fd-tile-page-indicator], [fdTilePageIndicator]',
    host: { '[class]': 'computedClass()' }
})
export class TilePageIndicator {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border flex h-2 max-h-2 min-h-2 items-center justify-center p-0',
            this.tile?.small() ? 'my-0' : 'mt-1.5 mb-0.5',
            this.userClass()
        )
    );
}

@Directive({
    selector: '[fd-tile-dot], [fdTileDot]',
    host: { '[class]': 'computedClass()' }
})
export class TileDot {
    readonly active = input(false, { transform: booleanAttribute });
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 me-[0.188rem] box-border block size-1.5 rounded-full p-0 opacity-60 last:m-0',
            this.active()
                ? 'bg-sap-tile-overlay-foreground-color shadow-[0_0_0.063rem_var(--sapContent_ShadowColor)]'
                : 'border border-sap-tile-overlay-foreground-color bg-transparent shadow-[0_0_0.125rem_var(--sapContent_ShadowColor)]',
            this.userClass()
        )
    );
}

/** Close (remove) button of a tile in action mode. */
@Component({
    selector: 'button[fd-tile-action-close], button[fdTileActionClose]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        type: 'button',
        '[attr.aria-label]': 'ariaLabel()',
        '[class]': 'computedClass()'
    },
    template: `<span aria-hidden="true" [attr.data-glyph]="glyph" [class]="iconClass()"></span>`
})
export class TileActionClose {
    readonly ariaLabel = input<string | null>('Remove');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly glyph = iconGlyphChar('decline');
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border cursor-pointer border-0 bg-transparent p-0 font-sap-font-family outline-none',
            this.tile?.line()
                ? 'relative -top-2.5 flex size-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full focus-visible:outline-sap'
                : 'absolute -end-1.5 -top-1.5 z-5 flex items-start justify-end rounded-full focus-visible:outline-sap',
            this.userClass()
        )
    );
    protected readonly iconClass = computed(() =>
        cn(
            GLYPH,
            'box-border size-[1.375rem] rounded-full border bg-sap-button-background text-[0.75rem] border-sap-button-border-color text-sap-button-icon-color'
        )
    );
}

/** Actions (overflow) indicator of a tile in action mode. */
@Component({
    selector: 'button[fd-tile-action-indicator], button[fdTileActionIndicator]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        type: 'button',
        '[attr.aria-label]': 'ariaLabel()',
        '[class]': 'computedClass()'
    },
    template: `<span aria-hidden="true" [attr.data-glyph]="glyph" [class]="iconClass()"></span>`
})
export class TileActionIndicator {
    readonly ariaLabel = input<string | null>('More');
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    private readonly tile = inject(Tile, { optional: true });
    protected readonly glyph = iconGlyphChar('overflow');
    protected readonly computedClass = computed(() =>
        cn(
            'm-0 box-border inline-flex cursor-pointer items-center justify-center rounded-sap-button-border-corner-radius border-0 bg-transparent p-0 font-sap-font-family outline-none focus-visible:outline-sap',
            this.tile?.line()
                ? 'relative size-[1.625rem] after:absolute after:start-[60%] after:top-1/2 after:size-8 after:-translate-1/2 after:content-[""] rtl:after:translate-x-1/2'
                : 'absolute end-0 bottom-0 z-5 me-1 mb-1 h-[1.625rem] min-w-8 px-2',
            this.userClass()
        )
    );
    protected readonly iconClass = computed(() =>
        cn(
            GLYPH,
            'text-[1rem]',
            this.tile?.line()
                ? 'text-sap-button-lite-text-color'
                : this.tile?.type() === 'slide'
                  ? 'text-sap-shell-active-text-color'
                  : 'text-sap-button-icon-color'
        )
    );
}

/** Holds the action buttons of a line tile in action mode. */
@Directive({
    selector: '[fd-tile-action-container], [fdTileActionContainer]',
    host: { '[class]': 'computedClass()' }
})
export class TileActionContainer {
    readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly computedClass = computed(() =>
        cn('m-0 ms-1 box-border flex items-center p-0', this.userClass())
    );
}
