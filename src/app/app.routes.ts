import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AppDataService } from './core/app-data.service';

const adminOnly = () => {
  const router = inject(Router);
  return inject(AppDataService).getCurrentUser()?.role === 'admin'
    ? true
    : router.createUrlTree(['/']);
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage)
  },
  {
    path: 'admin',
    canActivate: [adminOnly],
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage)
  },
  {
    path: 'available',
    loadComponent: () => import('./available/available.page').then((m) => m.AvailablePage)
  },
  {
    path: 'department',
    loadComponent: () => import('./department/department.page').then((m) => m.DepartmentPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./setting/setting.page').then((m) => m.SettingsPage)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
