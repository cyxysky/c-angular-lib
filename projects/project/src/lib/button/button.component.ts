import { booleanAttribute, Component, input, numberAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, useAnimation } from '@angular/animations';
import { rippleAnimation } from '../animation/ripple.animation';
import * as _ from 'lodash';
import { ButtonColor, ButtonShape, ButtonSize, ButtonType } from './button.interface';
@Component({
	selector: 'lib-button',
	imports: [CommonModule],
	templateUrl: './button.component.html',
	styleUrl: './button.component.less',
	animations: [
		trigger('ripple', [
			transition(':enter', useAnimation(rippleAnimation)),
		]),
	],
	host: {
		'[class]': 'disabled() ? "disabled" : ""',
		'[style.display]': 'block() ? "block" : "inline-block"',
	}
})
export class ButtonComponent {
	constructor() { }
	/** 按钮大小 */
	size = input<ButtonSize>('middle', { alias: 'buttonSize' });
	/** 按钮类型 */
	type = input<ButtonType>('default', { alias: 'buttonType' });
	/** 按钮形状 */
	shape = input<ButtonShape>('default', { alias: 'buttonShape' });
	/** 是否禁用 */
	disabled = input(false, { transform: booleanAttribute, alias: 'buttonDisabled' });
	/** 按钮颜色 */
	color = input<ButtonColor>('primary', { alias: 'buttonColor' });
	/** 内容 */
	content = input<string>(undefined, { alias: 'buttonContent' });
	/** 是否撑满父元素 */
	block = input(false, { transform: booleanAttribute, alias: 'buttonBlock' });

	ngOnInit() { }

	ripple: { x?: number; y?: number; size?: number } = {};
	
	/**
	 * 创建波纹
	 * @param event 事件
	 */
	createRipple(event: MouseEvent) {
		const button = event.target as HTMLElement;
		const rect = button.getBoundingClientRect();
		const size = Math.max(rect.width, rect.height) * 2; // 动态计算波纹大小
		const x = event.clientX - rect.left - size / 2;
		const y = event.clientY - rect.top - size / 2;
		this.ripple = { x, y, size };
		// 移除波纹
		setTimeout(() => {
			this.ripple = {};
		}, 800);
	}
}


