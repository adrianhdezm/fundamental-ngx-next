import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Injectable,
    Injector,
    TemplateRef,
    type Type,
    afterNextRender,
    computed,
    effect,
    inject,
    input,
    signal,
    untracked,
    viewChild
} from '@angular/core';
import { Subject, type Observable } from 'rxjs';
import { cn } from '@/lib/utils';
import {
    AutoDismissMessageStrip,
    MessageStrip,
    type MessageStripIndicationColor,
    type MessageStripType
} from './message-strip';

export type MessageStripAlertPosition = `${'top' | 'bottom'}-${'start' | 'middle' | 'end'}`;

export interface MessageStripAlertStripConfig {
    type: MessageStripType | null;
    indicationColor: MessageStripIndicationColor | null;
    dismissible: boolean;
    noIcon: boolean;
    /** Milliseconds before the alert dismisses itself; 0 or less keeps it open. */
    duration: number;
    /** Keeps the alert open while the pointer is over it. */
    mousePersist: boolean;
    dismissBtnTitle: string | null;
    ariaLabel: string | null;
    ariaLabelledBy: string | null;
    class: string;
    onDismiss: () => void;
}

export interface OpenMessageStripAlertConfig<C = unknown> {
    /** Default top-middle; narrow screens always use the middle. */
    position?: MessageStripAlertPosition;
    /** Text, a template (its context is the alert ref) or a component (it can inject the ref). */
    content: string | TemplateRef<{ $implicit: MessageStripAlertRef }> | Type<C>;
    messageStrip?: Partial<MessageStripAlertStripConfig>;
}

/** Handle of an open alert; components shown in an alert can inject it. */
export class MessageStripAlertRef {
    private readonly dismissed = new Subject<void>();
    /** Emits once when the alert is dismissed. */
    readonly afterDismissed: Observable<void> = this.dismissed.asObservable();

    constructor(private readonly onDismiss: (ref: MessageStripAlertRef) => void) {}

    dismiss(): void {
        if (this.dismissed.closed) return;
        this.onDismiss(this);
        this.dismissed.next();
        this.dismissed.complete();
    }
}

interface AlertEntry {
    ref: MessageStripAlertRef;
    config: OpenMessageStripAlertConfig;
    strip: MessageStripAlertStripConfig;
    injector: Injector;
}

const DEFAULT_STRIP: MessageStripAlertStripConfig = {
    type: null,
    indicationColor: null,
    dismissible: true,
    noIcon: false,
    duration: 10000,
    mousePersist: false,
    dismissBtnTitle: null,
    ariaLabel: null,
    ariaLabelledBy: null,
    class: '',
    onDismiss: () => {}
};

/** One alert in a container. */
@Component({
    selector: 'fd-message-strip-alert',
    imports: [MessageStrip, AutoDismissMessageStrip, NgTemplateOutlet, NgComponentOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block w-fit max-w-full' },
    template: `
        @let s = entry().strip;
        <fd-message-strip
            [class]="s.class"
            [type]="s.type"
            [indicationColor]="s.indicationColor"
            [dismissible]="s.dismissible"
            [noIcon]="s.noIcon"
            [dismissBtnTitle]="s.dismissBtnTitle"
            [ariaLabel]="s.ariaLabel"
            [ariaLabelledBy]="s.ariaLabelledBy"
            [autoDismiss]="s.duration > 0"
            [duration]="s.duration"
            [mousePersist]="s.mousePersist"
            (onDismiss)="entry().ref.dismiss()"
        >
            @if (text(); as text) {
                {{ text }}
            } @else if (template(); as template) {
                <ng-container *ngTemplateOutlet="template; context: { $implicit: entry().ref }" />
            } @else if (component(); as component) {
                <ng-container *ngComponentOutlet="component; injector: entry().injector" />
            }
        </fd-message-strip>
    `
})
export class MessageStripAlert {
    readonly entry = input.required<AlertEntry>();

    private readonly autoDismiss = viewChild.required(AutoDismissMessageStrip);

    protected readonly text = computed(() => {
        const content = this.entry().config.content;
        return typeof content === 'string' ? content : null;
    });
    protected readonly template = computed(() => {
        const content = this.entry().config.content;
        return content instanceof TemplateRef ? content : null;
    });
    protected readonly component = computed(() => {
        const content = this.entry().config.content;
        return typeof content === 'function' ? (content as Type<unknown>) : null;
    });

    constructor() {
        afterNextRender(() => this.autoDismiss().open());
    }
}

/** Overlay content: the alerts of one screen position. */
@Component({
    selector: 'fd-message-strip-alert-container',
    imports: [MessageStripAlert],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class]': 'hostClass()' },
    template: `
        @for (entry of entries(); track entry.ref) {
            <fd-message-strip-alert [entry]="entry" />
        }
    `
})
export class MessageStripAlertContainer {
    readonly entries = signal<AlertEntry[]>([]);
    readonly position = signal<MessageStripAlertPosition>('top-middle');
    /** Halves the height when alerts are open at the other edge too. */
    readonly shared = signal(false);

    protected readonly hostClass = computed(() => {
        const [vertical, horizontal] = this.position().split('-');
        return cn(
            'scrollbar-sap flex max-w-full flex-col gap-3 overflow-auto p-2',
            this.shared() ? 'max-h-[calc(50vh_-_1rem)]' : 'max-h-[calc(100vh_-_1rem)]',
            vertical === 'bottom' && 'flex-col-reverse',
            horizontal === 'middle' ? 'items-center' : horizontal === 'end' ? 'items-end' : 'items-start'
        );
    });
}

/**
 * Shows message strips as alerts in overlays at the edges of the screen.
 *
 * ```ts
 * const ref = inject(MessageStripAlertService).open({ content: 'Saved', messageStrip: { type: 'success', duration: 5000 } });
 * // to close it on navigation:
 * router.events.pipe(filter((e) => e instanceof NavigationStart), take(1)).subscribe(() => ref.dismiss());
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MessageStripAlertService {
    private readonly overlay = inject(Overlay);
    private readonly injector = inject(Injector);
    private readonly dir = inject(Directionality, { optional: true });

    private readonly alerts = signal<AlertEntry[]>([]);
    private readonly narrow = signal(false);
    private readonly overlays = new Map<
        MessageStripAlertPosition,
        { ref: OverlayRef; container: MessageStripAlertContainer }
    >();

    /** Open alerts, newest first. */
    readonly openAlerts = computed(() => this.alerts().map((entry) => entry.ref));

    constructor() {
        if (typeof matchMedia === 'function') {
            const query = matchMedia('(max-width: 599px)');
            this.narrow.set(query.matches);
            const listener = (event: MediaQueryListEvent) => this.narrow.set(event.matches);
            query.addEventListener('change', listener);
            inject(DestroyRef).onDestroy(() => query.removeEventListener('change', listener));
        }
        effect(() => this.sync(this.alerts(), this.narrow()));
    }

    open<C = unknown>(config: OpenMessageStripAlertConfig<C>): MessageStripAlertRef {
        const strip = { ...DEFAULT_STRIP, ...config.messageStrip };
        const ref = new MessageStripAlertRef((closed) => {
            this.alerts.update((alerts) => alerts.filter((entry) => entry.ref !== closed));
            strip.onDismiss();
        });
        const injector = Injector.create({
            providers: [{ provide: MessageStripAlertRef, useValue: ref }],
            parent: this.injector
        });
        this.alerts.update((alerts) => [
            { ref, config: config as OpenMessageStripAlertConfig, strip, injector },
            ...alerts
        ]);
        return ref;
    }

    dismissAll(): void {
        untracked(() => this.alerts()).forEach((entry) => entry.ref.dismiss());
    }

    private sync(alerts: AlertEntry[], narrow: boolean): void {
        const groups = new Map<MessageStripAlertPosition, AlertEntry[]>();
        for (const entry of alerts) {
            let position = entry.config.position ?? 'top-middle';
            if (narrow) position = position.startsWith('top') ? 'top-middle' : 'bottom-middle';
            groups.set(position, [...(groups.get(position) ?? []), entry]);
        }
        const positions = [...groups.keys()];
        const top = positions.some((p) => p.startsWith('top'));
        const bottom = positions.some((p) => p.startsWith('bottom'));
        untracked(() => {
            for (const [position, overlay] of this.overlays) {
                if (!groups.has(position)) {
                    overlay.ref.dispose();
                    this.overlays.delete(position);
                }
            }
            for (const [position, entries] of groups) {
                const { container } = this.overlayFor(position, narrow);
                container.entries.set(entries);
                container.shared.set(top && bottom);
            }
        });
    }

    private overlayFor(position: MessageStripAlertPosition, narrow: boolean) {
        let overlay = this.overlays.get(position);
        if (!overlay) {
            const [vertical, horizontal] = position.split('-');
            const rtl = this.dir?.value === 'rtl';
            const strategy = this.overlay.position().global();
            if (vertical === 'top') strategy.top('0');
            else strategy.bottom('0');
            if (horizontal === 'middle') strategy.centerHorizontally();
            else if ((horizontal === 'start') !== rtl) strategy.left('0');
            else strategy.right('0');
            const ref = this.overlay.create({
                positionStrategy: strategy,
                hasBackdrop: false,
                direction: this.dir?.value,
                width: horizontal === 'middle' ? (narrow ? '90vw' : '33.33vw') : undefined,
                maxWidth: narrow ? '90vw' : '33.33vw'
            });
            const container = ref.attach(new ComponentPortal(MessageStripAlertContainer, null, this.injector)).instance;
            container.position.set(position);
            overlay = { ref, container };
            this.overlays.set(position, overlay);
        }
        return overlay;
    }
}
