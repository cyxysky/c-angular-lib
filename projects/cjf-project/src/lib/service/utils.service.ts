import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  transformBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    } else {
      if (value === 'true' || value === '') {
        return true;
      } else if (value === 'false') {
        return false;
      }
    }
    return true;
  }

}
