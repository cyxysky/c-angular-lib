import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, TemplateRef, viewChild, ViewChild, ViewContainerRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkOverlayOrigin, Overlay, OverlayConfig, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import user from './user';
import * as _ from 'lodash';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { BooleanInput } from 'ng-zorro-antd/core/types';
import { trigger, state, style, transition, animate } from '@angular/animations';

export enum ORDER_TYPE {
  LETTER = 'LETTER',
  ORGA = 'ORGA'
}

@Component({
  selector: 'lib-user-select',
  imports: [CommonModule, FormsModule, OverlayModule],
  templateUrl: './user-select.component.html',
  styleUrl: './user-select.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: () => UserSelectComponent,
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('openClose', [
      state(
        'open',
        style({
          height: '100%',
        }),
      ),
      state(
        'closed',
        style({
          height: '0',
        }),
      ),
      transition('open => closed', [animate('0.1s')]),
      transition('closed => open', [animate('0.1s')]),
    ]),
  ]
})
export class UserSelectComponent implements ControlValueAccessor {
  /** 弹出浮层高度 */
  @Input() optionPanelHeight: number = 400;
  /** 选项高度 */
  @Input() optionHeight: number = 32;
  /** 可选类型 */
  @Input() type: Array<ORDER_TYPE> = [ORDER_TYPE.LETTER, ORDER_TYPE.ORGA];
  /** 数据为空占位符 */
  @Input() placeHolder: string = '请选择';
  /** 是否允许清空 */
  @Input() get allowClear() { return this._allowClear; }
  set allowClear(value: BooleanInput) {
    this._allowClear = coerceBooleanProperty(value);
  }
  /** 浮层初始位置 */
  @ViewChild(CdkOverlayOrigin, { static: false }) _overlayOrigin!: CdkOverlayOrigin;
  /** 浮层tamplet对象 */
  @ViewChild('overlay', { static: false }) overlayTemplate!: TemplateRef<any>;
  /** 首字母索引滚动盒子 */
  @ViewChild('scrollBox', { static: false }) scrollBox!: ElementRef;
  constructor(
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    public cdr: ChangeDetectorRef
  ) {
  }

  public readonly letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  public optionAreaHeight = `calc(${this.optionPanelHeight}px - 60px)`;
  public users: Array<any> = [];
  public _data: any = [];
  public selectedOrder: ORDER_TYPE = ORDER_TYPE.LETTER;
  public overlayRef!: OverlayRef | null;
  public lettersRange: Array<{ letter: string, start: number, end: number }> = [];
  public letterMap: Map<string, number> = new Map();
  public selectedLetter: string = 'A';
  public _allowClear = true;
  public modalState : 'open' | 'closed' = 'closed';
  public ORDER_TYPE = ORDER_TYPE;
  ngOnInit() {
    this.users = this.initUserListAndScroll(user);
    this.cdr.detectChanges();
  }

  /**
   * 初始化用户数组
   * @param users 用户数组
   * @returns 完成排序的用户数组
   */
  public initUserListAndScroll(users: Array<any>): Array<any> {
    let user = _.filter(users, user => user.state !== 1).sort((a, b) => a.pinYin[0].localeCompare(b.pinYin[0]));
    let letterCount = _.countBy(user, item => item.pinYin[0]);
    let usersObj: any = {};
    let userArray = [];
    _.forEach(user, item => {
      !usersObj[item.pinYin[0]] && (usersObj[item.pinYin[0]] = []);
      usersObj[item.pinYin[0]] && (usersObj[item.pinYin[0]].push(item));
    });
    for (let key in usersObj) {
      userArray.push({
        letter: key.toUpperCase(),
        array: usersObj[key]
      })
    }
    this.lettersRange = this.initScrollLengthRange(letterCount);
    return userArray;
  }

  /**
   * 初始化滚动时显示字符数量范围
   * @param letterCount 字符数量
   */
  public initScrollLengthRange(letterCount: any): Array<{ letter: string, start: number, end: number }> | any {
    if (!letterCount) return;
    this.letterMap.clear();
    let lengthRange = [];
    let start = 0;
    for (let k in letterCount) {
      let letter = k.toUpperCase();
      this.letterMap.set(letter, start);
      lengthRange.push({
        letter: letter,
        start: start,
        end: start + 40 + letterCount[k] * this.optionHeight
      });
      start += 40 + letterCount[k] * this.optionHeight;
    }
    return lengthRange;
  }

  /**
   * 选择排序类型
   * @param type 类型
   */
  public selectOrderType(type: ORDER_TYPE): void {
    this.selectedOrder = type;
    this.cdr.detectChanges();
  }

  /**
   * 选择用户
   * @param userId 用户id
   */
  public selectUser(userId: any): void {
    if (this._data.includes(userId)) {
      _.pull(this._data, userId)
      this.onChange(this._data);
      this.updateOverlayRefPosition();
      this.cdr.detectChanges();
      return;
    }
    this._data.push(userId);
    this.onChange(this._data);
    this.updateOverlayRefPosition();
    this.cdr.detectChanges();
  }

  /**
   * 移除用户
   * @param userId 用户id
   */
  public removeUser(event: Event, userId: any): void {
    event.stopPropagation();
    _.pull(this._data, userId);
    this.onChange(this._data);
    this.updateOverlayRefPosition();
    this.cdr.detectChanges();
  }

  /**
   * 按首字母排序滚动事件
   * @param event 滚动事件
   */
  public onLetterScroll(event: any): void {
    let scrollTop = event.target.scrollTop;
    let letter = _.filter(this.lettersRange, letterPosition => scrollTop >= letterPosition.start && letterPosition.end >= scrollTop);
    letter && letter[0]?.letter && (this.selectedLetter = letter[0].letter);
    this.cdr.detectChanges();
  }

  /**
   * 选择对应的字母，滚动条自动跳转
   * @param letter 选择的字母
   */
  public selectLetter(letter: string): void {
    this.selectedLetter = letter;
    if (this.letterMap.has(letter)) {
      this.scrollBox.nativeElement.scrollTop = this.letterMap.get(letter) as number;
    }
    this.cdr.detectChanges();
  }

  /**
   * 异步更新浮层位置
   */
  public updateOverlayRefPosition(): void {
    let timer = setTimeout(() => {
      this.overlayRef && this.overlayRef.updatePosition();
      this.cdr.detectChanges();
      clearTimeout(timer);
    })
  }

  /**
   * 清空数据
   */
  public clear(event: Event): void {
    event.stopPropagation();
    this._data = [];
    this.onChange(this._data);
    this.cdr.detectChanges();
  }

  /**
   * 打开弹窗
   */
  public openModal(): void {
    if(this.overlayRef) return;
    const config = new OverlayConfig();
    let positionStrategy = this.overlay.position().flexibleConnectedTo(this._overlayOrigin.elementRef).withPositions([
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
      },
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
      }
    ]).withPush(false).withGrowAfterOpen(true).withLockedPosition(false);
    config.scrollStrategy = this.overlay.scrollStrategies.reposition();
    config.positionStrategy = positionStrategy;
    config.hasBackdrop = false;
    config.width = this._overlayOrigin.elementRef.nativeElement.clientWidth;
    config.height = this.optionPanelHeight;
    config.disposeOnNavigation = true;
    let overlayRef = this.overlay.create(config);
    this.overlayRef = overlayRef;
    // 点击背景，关闭浮层
    overlayRef.outsidePointerEvents().subscribe(() => {
      console.log('asdasd')
      this.modalState = 'closed';
      let closeTimer = setTimeout(() => {
        clearTimeout(closeTimer);
        overlayRef.dispose();
        this.overlayRef = null;
      }, 200)
    });
    overlayRef.attach(new TemplatePortal(this.overlayTemplate, this.viewContainerRef));
    this.modalState = 'open';
    this.cdr.detectChanges();
    this.modalState = 'open';
  }

  /** ngModel实现接口 */
  public onTouch = (): void => { };
  public onChange = (value: any): void => { }
  public writeValue(obj: any): void {
    this._data = obj;
    this.cdr.detectChanges();
  }
  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  public registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
  public setDisabledState?(isDisabled: boolean): void {
    throw new Error('Method not implemented.');
  }

}
