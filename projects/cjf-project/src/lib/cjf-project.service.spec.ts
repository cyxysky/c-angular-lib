import { TestBed } from '@angular/core/testing';

import { CjfProjectService } from './cjf-project.service';

describe('CjfProjectService', () => {
  let service: CjfProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CjfProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
