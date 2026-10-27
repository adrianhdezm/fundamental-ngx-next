import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@analogjs/storybook-angular';
import { Link } from '@/ui/link/link';
import { ScrollSpy } from './scroll-spy';

@Component({
    selector: 'story-scroll-spy',
    imports: [ScrollSpy, Link],
    template: `
        <div class="flex max-w-3xl gap-6">
            <nav aria-label="Sections" class="flex w-40 shrink-0 flex-col gap-2">
                @for (s of sections; track s) {
                    <a
                        fdLink
                        [href]="'#' + s"
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
                (spyChange)="active.set($event?.id)"
                tabindex="0"
                aria-label="Content"
                class="scrollbar-sap h-72 flex-1 overflow-auto pb-60 text-sap-text-color"
            >
                @for (s of sections; track s) {
                    <section [id]="s" class="mb-6">
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
    protected readonly sections = ['Introduction', 'Installation', 'Usage', 'Theming', 'Accessibility', 'API'];
    protected readonly active = signal<string | undefined>('Introduction');
    protected go(event: Event, id: string): void {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
