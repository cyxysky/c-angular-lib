import { trigger, state, style, transition, animate, AnimationTriggerMetadata } from "@angular/animations";

export function rotate(angel: number): AnimationTriggerMetadata {
    return trigger('rotate', [
        state('start', style({
            transform: 'rotate(0deg)'
        })),
        state('end', style({
            transform: `rotate(${angel}deg)`
        })),
        transition('start <=> end', [
            animate('200ms ease')
        ])
    ])
}