import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { routerGuardGuard } from './router-guard-guard';

describe('routerGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => routerGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
