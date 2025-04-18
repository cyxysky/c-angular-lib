import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MenuComponent, MenuItem } from './menu.component';
import { By } from '@angular/platform-browser';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let mockItems: MenuItem[];

  beforeEach(async () => {
    mockItems = [
      {
        key: '1',
        title: '菜单1',
        children: [
          {
            key: '1-1',
            title: '子菜单1-1'
          },
          {
            key: '1-2',
            title: '子菜单1-2'
          }
        ]
      },
      {
        key: '2',
        title: '菜单2'
      }
    ];

    await TestBed.configureTestingModule({
      imports: [MenuComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    component.items = mockItems;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with closed submenus', () => {
    expect(component.internalItems[0].isOpen).toBeFalsy();
  });

  it('should toggle submenu when clicked in inline mode', () => {
    component.mode = 'inline';
    fixture.detectChanges();
    
    const spy = spyOn(component.openChange, 'emit');
    const menuItem = component.internalItems[0];
    
    component.toggleSubMenu(menuItem);
    fixture.detectChanges();
    
    expect(menuItem.isOpen).toBeTruthy();
    expect(spy).toHaveBeenCalledWith({ item: menuItem, open: true });
    
    component.toggleSubMenu(menuItem);
    fixture.detectChanges();
    
    expect(menuItem.isOpen).toBeFalsy();
    expect(spy).toHaveBeenCalledWith({ item: menuItem, open: false });
  });

  it('should select menu item when clicked', () => {
    const spy = spyOn(component.menuItemClick, 'emit');
    const menuItem = component.internalItems[1]; // 菜单2，没有子菜单
    
    component.onMenuItemClick(menuItem);
    fixture.detectChanges();
    
    expect(menuItem.selected).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ key: '2' }));
  });

  it('should open submenu on mouseenter in horizontal mode', fakeAsync(() => {
    component.mode = 'horizontal';
    fixture.detectChanges();
    
    const spy = spyOn(component.openChange, 'emit');
    const menuItem = component.internalItems[0];
    
    component.onMouseEnterSubmenu(menuItem);
    tick(51); // 略大于hoverDelay的值
    fixture.detectChanges();
    
    expect(menuItem.isOpen).toBeTruthy();
    expect(spy).toHaveBeenCalledWith({ item: menuItem, open: true });
  }));

  it('should close submenu on mouseleave in horizontal mode', fakeAsync(() => {
    component.mode = 'horizontal';
    fixture.detectChanges();
    
    const menuItem = component.internalItems[0];
    menuItem.isOpen = true;
    fixture.detectChanges();
    
    const spy = spyOn(component.openChange, 'emit');
    
    component.onMouseLeaveSubmenu(menuItem);
    tick(201); // 略大于离开定时器延迟
    fixture.detectChanges();
    
    expect(menuItem.isOpen).toBeFalsy();
    expect(spy).toHaveBeenCalledWith({ item: menuItem, open: false });
  }));

  it('should not open submenu on mouseenter in inline mode', fakeAsync(() => {
    component.mode = 'inline';
    fixture.detectChanges();
    
    const spy = spyOn(component.openChange, 'emit');
    const menuItem = component.internalItems[0];
    
    component.onMouseEnterSubmenu(menuItem);
    tick(100);
    fixture.detectChanges();
    
    expect(menuItem.isOpen).toBeFalsy();
    expect(spy).not.toHaveBeenCalled();
  }));

  it('should open parent menus when setting selectedKeys', () => {
    component.mode = 'inline';
    component.selectedKeys = ['1-1']; // 选中子菜单1-1
    component.ngOnChanges({
      selectedKeys: { 
        currentValue: ['1-1'], 
        previousValue: [], 
        firstChange: false, 
        isFirstChange: () => false 
      }
    });
    fixture.detectChanges();
    
    // 父菜单应该被展开
    expect(component.internalItems[0].isOpen).toBeTruthy();
    // 子菜单应该被选中
    expect(component.internalItems[0].children![0].selected).toBeTruthy();
  });

  it('should clean up timers on destroy', () => {
    const clearTimeoutSpy = spyOn(window, 'clearTimeout');
    component.ngOnDestroy();
    
    // 由于我们没有设置任何定时器，无法确切知道会调用多少次clearTimeout
    // 但我们可以确认它被调用了
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
