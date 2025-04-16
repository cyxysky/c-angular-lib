import { booleanAttribute, Component, Input, input, numberAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, useAnimation } from '@angular/animations';
import { rippleAnimation } from '../core/animation/ripple.animation';
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
		'[class]': 'disabled ? "disabled" : ""',
		'[style.pointer-events]': 'disabled ? "none" : "auto"',
		'[style.display]': 'block ? "block" : "inline-block"',
	}
})
export class ButtonComponent {
	/** 按钮大小 */
	@Input({ alias: 'buttonSize' }) size: ButtonSize = 'middle';
	/** 按钮类型 */
	@Input({ alias: 'buttonType' }) type: ButtonType = 'default';
	/** 按钮形状 */
	@Input({ alias: 'buttonShape' }) shape: ButtonShape = 'default';
	/** 是否禁用 */
	@Input({ alias: 'buttonDisabled', transform: booleanAttribute }) disabled: boolean = false;
	/** 按钮颜色 */
	@Input({ alias: 'buttonColor' }) color: ButtonColor = 'primary';
	/** 内容 */
	@Input({ alias: 'buttonContent' }) content: string | undefined;
	/** 是否撑满父元素 */
	@Input({ alias: 'buttonBlock', transform: booleanAttribute }) block: boolean = false;
	
	/** 波纹 */
	public ripple: { x?: number; y?: number; size?: number } = {};

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


