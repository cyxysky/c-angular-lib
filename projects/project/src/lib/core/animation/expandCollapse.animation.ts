import { trigger, state, style, transition, animate } from "@angular/animations";

export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ opacity: 0, height: '0' }),
    animate('200ms ease', style({ opacity: 1, height: '*' })),
  ]),
  transition(':leave', [
    animate('200ms ease', style({ opacity: 0, height: '0' }))
  ])
])