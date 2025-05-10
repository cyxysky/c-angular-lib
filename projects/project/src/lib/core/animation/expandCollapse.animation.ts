import { trigger, style, transition, animate } from "@angular/animations";

export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ opacity: 0, height: '0' }),
    animate('200ms ease', style({ opacity: 1, height: '*' })),
  ]),
  transition(':leave', [
    animate('200ms ease', style({ opacity: 0, height: '0' }))
  ])
])

export function CustomerExpandCollapse(duration: number = 200) {
  return trigger('expandCollapse', [
    transition(':enter', [
      style({ height: '0', overflow: 'hidden' }),
      animate(`${duration}ms ease`, style({ height: '*', overflow: 'hidden' })),
    ]),
    transition(':leave', [
      animate(`${duration}ms ease`, style({ height: '0', overflow: 'hidden' }))
    ])
  ])
}