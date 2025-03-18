import { Component, effect, resource, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProjectModule } from '../../projects/cjf-project/src/public-api';
import { of, delay, interval } from 'rxjs';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
@Component({
  selector: 'app-root',
  imports: [FormsModule, ProjectModule, NzMenuModule, ScrollingModule, NzInputModule, NzButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = 'project';
  show = signal(false);
  text = signal('hellossssssss');
  mySignal = signal({
    ok: 'false'
  });
  nowComponent = signal('input');
  checked = signal(false);
  onCheckedChange(checked: boolean) {
    this.checked.set(checked);
  }
  onClose(event: string) {
    console.log(event);
  }
  sets() {
    this.mySignal.set({
      ok: 'true'
    })
  }

  constructor() {
    effect(() => {
      console.log('change')
    })
    // resource({
    //   request: () => [this.mySignal(), this.show()],
    //   loader: async ({request: id}) => {
    //     console.log(id);
    //   }
    // })
  }

  test(value: any) {
    return value === '' ? false : true;
  }

  ngOnInit() {
    of(true).pipe(delay(2000)).subscribe((data) => {
      console.log(data)
      this.show.set(data)
    })
    interval(1000).subscribe((data) => {
      console.log(this.text())
      })
    // const obs$ = toObservable(this.mySignal);
    // obs$.subscribe(value => console.log(value));
    // mySignal.set(1);
    // mySignal.set(2);
    // mySignal.set(3);

  }

  cons(any:any){
    console.log(any)
  }
}
