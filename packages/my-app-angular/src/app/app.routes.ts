import { Routes } from '@angular/router';

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
