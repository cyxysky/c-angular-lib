import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from '@angular/animations';

export const messageMotion: AnimationTriggerMetadata = trigger('messageMotion', [
  state('enter', style({ opacity: 1, transform: 'translateY(0)' })),
  state('leave', style({ opacity: 0, transform: 'translateY(-50%)' })),
  transition('* => enter', [
    style({ opacity: 0, transform: 'translateY(-50%)' }),
    animate('200ms ease-out')
  ]),
  transition('enter => leave', [
    animate('200ms ease-in')
  ])
]); 