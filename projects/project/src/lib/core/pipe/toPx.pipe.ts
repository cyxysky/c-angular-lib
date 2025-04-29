import { Pipe, PipeTransform } from "@angular/core";

// 创建分页大小选项格式化管道
@Pipe({
    name: 'toPx',
    standalone: true
})
export class ToPxPipe implements PipeTransform {
    transform(data: any): string {
        if (data === undefined || data === null) {
            return '';
        }
        if (typeof data === 'number') {
            return `${data}px`;
        }
        if (typeof data === 'string') {
            return data;
        }
        return '';
    }
}