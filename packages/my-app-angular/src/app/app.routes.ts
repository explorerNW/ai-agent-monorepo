import { Routes } from '@angular/router';
import { routerGuard } from './guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.Home),
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
    title: 'Home',
  },
  {
    path: 'activities',
    loadComponent: () => import('./pages/activities').then((m) => m.Activities),
    title: 'Activities',
    canMatch: [],
    canActivate: [routerGuard],
    canLoad: [],
    data: {
      preload: true,
    },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
    title: 'Not Found',
  },
];
