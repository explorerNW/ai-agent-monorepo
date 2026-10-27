import { CanActivateFn } from '@angular/router';

export const routerGuard: CanActivateFn = (/*route, state*/) => {
  // console.log('route: ', route, 'state: ', state);
  return true;
};
