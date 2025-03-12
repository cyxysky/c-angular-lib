import { Component, effect, resource, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProjectModule } from '../../projects/cjf-project/src/public-api';
import { of, delay } from 'rxjs';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { ScrollingModule } from '@angular/cdk/scrolling';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProjectModule, NzMenuModule, ScrollingModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = 'project';
  show = signal(false);
  mySignal = signal(0);
  nowComponent = signal('user-select')
  constructor() {
    effect(() => {
      console.log('change')
    })
    // setInterval(() => {
    //   this.mySignal.update(value =>  value + 1)
    // }, 2000)
    // resource({
    //   request: () => [this.mySignal(), this.show()],
    //   loader: async ({request: id}) => {
    //     console.log(id);
    //   }
    // })
  }



  ngOnInit() {
    of(true).pipe(delay(2000)).subscribe((data) => {
      console.log(data)
      this.show.set(data)
    })
    // const obs$ = toObservable(this.mySignal);
    // obs$.subscribe(value => console.log(value));
    // mySignal.set(1);
    // mySignal.set(2);
    // mySignal.set(3);

  }
}
