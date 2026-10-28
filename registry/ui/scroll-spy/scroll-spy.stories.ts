import { Component, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Link } from '@/ui/link/link';
import { ScrollSpy } from './scroll-spy';

let nextDemo = 0;

@Component({
    selector: 'story-scroll-spy',
    imports: [ScrollSpy, Link],
    template: `
        <div class="flex max-w-3xl gap-6">
            <nav aria-label="Sections" class="flex w-40 shrink-0 flex-col gap-2">
                @for (s of sections; track s) {
                    <a
                        fdLink
                        [href]="'#' + idPrefix + s"
                        [emphasized]="active() === s"
                        [attr.aria-current]="active() === s ? 'location' : null"
                        (click)="go($event, s)"
                        >{{ s }}</a
                    >
                }
            </nav>
            <div
                #container
                fdScrollSpy
                [trackedTags]="['section']"
                [targetPercent]="targetPercent()"
                [targetOffset]="targetOffset()"
                [fireEmpty]="fireEmpty()"
                (spyChange)="active.set($event?.id?.slice(idPrefix.length))"
                tabindex="0"
                aria-label="Content"
                class="scrollbar-sap h-72 flex-1 overflow-auto pb-60 text-sap-text-color"
            >
                @for (s of sections; track s) {
                    <section [id]="idPrefix + s" class="mb-6">
                        <h3
                            class="m-0 mb-2 font-sap-font-header-family text-sap-font-header5-size text-sap-title-color"
                        >
                            {{ s }}
                        </h3>
                        <p class="m-0">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ut laoreet lorem.
                            Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
                            Aenean sagittis aliquam justo et suscipit.
                        </p>
                    </section>
                }
            </div>
        </div>
    `
})
class ScrollSpyDemo {
    /** Where in the container a section counts as current: a fraction of its height … */
    readonly targetPercent = input(0);
    /** … plus an offset in pixels. */
    readonly targetOffset = input(0);
    readonly fireEmpty = input(false);
    /** Keeps the section ids unique when several demos share the docs page. */
    protected readonly idPrefix = `spy-${nextDemo++}-`;
    protected readonly sections = ['Introduction', 'Installation', 'Usage', 'Theming', 'Accessibility', 'API'];
    protected readonly active = signal<string | undefined>('Introduction');
    protected go(event: Event, id: string): void {
        event.preventDefault();
        document.getElementById(this.idPrefix + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

const meta: Meta<ScrollSpy> = {
    title: 'Components/Scroll Spy',
    component: ScrollSpy,
    decorators: [moduleMetadata({ imports: [ScrollSpyDemo] })],
    parameters: {
        docs: {
            description: {
                component:
                    'Reports which tracked child of a scroll container is at the top, e.g. to highlight the current entry of a table of contents.'
            }
        }
    }
};
export default meta;
type Story = StoryObj<ScrollSpy>;

export const Default: Story = { name: 'Table of contents', render: () => ({ template: `<story-scroll-spy />` }) };

export const DetectionThreshold: Story = {
    name: 'Detection threshold',
    parameters: {
        docs: {
            description: {
                story: 'With `[targetPercent]="0.5"`, a section becomes current once it reaches the middle of the container.'
            }
        }
    },
    render: () => ({ template: `<story-scroll-spy [targetPercent]="0.5" />` })
};

export const Offset: Story = {
    name: 'Offset',
    parameters: {
        docs: {
            description: {
                story: 'With `[targetOffset]="100"`, a section becomes current once it is 100px from the top of the container. `fireEmpty` reports `undefined` when no section is there yet.'
            }
        }
    },
    render: () => ({ template: `<story-scroll-spy [targetOffset]="100" [fireEmpty]="true" />` })
};
