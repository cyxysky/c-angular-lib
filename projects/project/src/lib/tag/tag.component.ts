import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostBinding, input, output, booleanAttribute, model, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TagColor = 'primary' | 'success' | 'warning' | 'danger' | string;

@Component({
  selector: 'lib-tag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.less',
  exportAs: 'libTag'
})
export class TagComponent {
  /** 标签是否可以关闭 */
  closable = input(false, { transform: booleanAttribute });
  /** 标签是否可选中 */
  checkable = input(false, { transform: booleanAttribute });
  /** 标签色彩，可选值: primary, success, warning, danger 或自定义色值 */
  color = input<TagColor>('primary');
  /** 标签是否禁用 */
  disabled = input(false, { transform: booleanAttribute });
  /** 标签内容 */
  content = input<string>('');
  /** 标签是否被选中 */
  checked = model<boolean>(false);
  /** 关闭标签时的事件 */
  close = output<string>();
  /** 点击标签时的事件 */
  checkedChange = output<boolean>();

  // 使用 computed 替代旧的方法
  isPresetColor = computed(() => {
    return ['primary', 'success', 'warning', 'danger'].indexOf(this.color() || '') !== -1;
  });

  // 使用 computed 替代 updateClassMap
  tagCustomClass = computed(() => {
    return {
      [`lib-tag-${this.color()}`]: this.isPresetColor(),
    };
  });

  // 使用 computed 替代 updateStyleMap
  tagStyle = computed(() => {
    if (this.color() && !this.isPresetColor()) {
      return {
        backgroundColor: this.color(),
        color: '#fff'
      };
    }
    return {};
  });

  closeTag(e: MouseEvent): void {
    e.stopPropagation();
    if (!this.disabled()) {
      this.close.emit('close');
    }
  }

  handleClick(): void {
    if (this.checkable() && !this.disabled()) {
      const newValue = !this.checked();
      this.checked.set(newValue);
      this.checkedChange.emit(newValue);
    }
  }
}
