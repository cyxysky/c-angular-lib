import { AnimationTriggerMetadata, trigger, state, style, transition, animate } from '@angular/animations';

export const drawerAnimations: {
  readonly drawerMotion: AnimationTriggerMetadata;
  readonly maskMotion: AnimationTriggerMetadata;
} = {
  drawerMotion: trigger('drawerMotion', [
    state('enter-from-right', style({
      transform: 'translate3d(0, 0, 0)',
    })),
    state('enter-from-left', style({
      transform: 'translate3d(0, 0, 0)',
    })),
    state('enter-from-top', style({
      transform: 'translate3d(0, 0, 0)',
    })),
    state('enter-from-bottom', style({
      transform: 'translate3d(0, 0, 0)',
    })),
    transition('void => enter-from-right', [
      style({
        transform: 'translate3d(100%, 0, 0)',
      }),
      animate('150ms')
    ]),
    transition('enter-from-right => void', [
      animate('150ms', style({
        transform: 'translate3d(100%, 0, 0)',
      }))
    ]),
    transition('void => enter-from-left', [
      style({
        transform: 'translate3d(-100%, 0, 0)',
      }),
      animate('150ms')
    ]),
    transition('enter-from-left => void', [
      animate('150ms', style({
        transform: 'translate3d(-100%, 0, 0)',
      }))
    ]),
    transition('void => enter-from-top', [
      style({
        transform: 'translate3d(0, -100%, 0)',
      }),
      animate('150ms')
    ]),
    transition('enter-from-top => void', [
      animate('150ms', style({
        transform: 'translate3d(0, -100%, 0)',
      }))
    ]),
    transition('void => enter-from-bottom', [
      style({
        transform: 'translate3d(0, 100%, 0)',
      }),
      animate('150ms')
    ]),
    transition('enter-from-bottom => void', [
      animate('150ms', style({
        transform: 'translate3d(0, 100%, 0)',
      }))
    ])
  ]),
  
  maskMotion: trigger('maskMotion', [
    state('void', style({
      opacity: 0
    })),
    state('enter', style({
      opacity: 1
    })),
    transition('void => enter', [
      animate('150ms')
    ]),
    transition('enter => void', [
      animate('150ms')
    ])
  ])
}; 