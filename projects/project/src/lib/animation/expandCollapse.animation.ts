import { trigger, state, style, transition, animate } from "@angular/animations";

export const expandCollapse = trigger('expandCollapse', [
    state('void', style({
        height: '0',
        opacity: 0,
      })),
      state('*', style({
        height: '*',
        opacity: 1,
      })),
      transition('void => *', [
        animate('200ms ease')
      ]),
      transition('* => void', [
        animate('200ms ease')
      ])
])