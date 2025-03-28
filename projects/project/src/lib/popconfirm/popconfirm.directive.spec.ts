import { PopconfirmDirective } from './popconfirm.directive';

describe('PopconfirmDirective', () => {
  it('should create an instance', () => {
    // 创建必要的模拟对象
    const elementRefMock = { nativeElement: document.createElement('div') };
    const rendererMock = jasmine.createSpyObj('Renderer2', ['setProperty', 'addClass', 'removeClass']);
    const viewContainerRefMock = jasmine.createSpyObj('ViewContainerRef', ['createEmbeddedView', 'clear']);
    
    // 使用模拟对象创建指令实例
    const directive = new PopconfirmDirective(elementRefMock, rendererMock, viewContainerRefMock);
    expect(directive).toBeTruthy();
  });
});
