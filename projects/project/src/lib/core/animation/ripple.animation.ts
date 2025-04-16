import { animation, style, animate, keyframes } from '@angular/animations';

export const rippleAnimation = animation([
  animate(
    '800ms ease-out',
    keyframes([
      style({
        transform: 'scale(0)',
        opacity: 0.6,
        offset: 0,
      }),
      style({
        transform: 'scale(1)',
        opacity: 0.3,
        offset: 0.5,
      }),
      style({
        transform: 'scale(2)',
        opacity: 0,
        offset: 1,
      }),
    ])
  ),
]);