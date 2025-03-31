import { trigger, state, style, transition, animate } from "@angular/animations";

export const expandCollapse = trigger('expandCollapse', [
    state('collapsed', style({
        height: '0',
        opacity: 0,
    })),
    state('expanded', style({
        height: '*',
        opacity: 1,
    })),
    transition('collapsed <=> expanded', [
        animate('200ms ease')
    ])
])