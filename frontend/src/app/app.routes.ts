import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'books', pathMatch: 'full' },
      {
        path: 'books',
        loadComponent: () => import('./features/books/book-list/book-list.component').then(m => m.BookListComponent),
      },
      {
        path: 'books/new',
        loadComponent: () => import('./features/books/book-form/book-form.component').then(m => m.BookFormComponent),
        data: { roles: ['LIBRARIAN', 'ADMIN'] },
        canActivate: [roleGuard],
      },
      {
        path: 'books/:id',
        loadComponent: () => import('./features/books/book-detail/book-detail.component').then(m => m.BookDetailComponent),
      },
      {
        path: 'books/:id/edit',
        loadComponent: () => import('./features/books/book-form/book-form.component').then(m => m.BookFormComponent),
        data: { roles: ['LIBRARIAN', 'ADMIN'] },
        canActivate: [roleGuard],
      },
      {
        path: 'borrowings',
        loadComponent: () => import('./features/borrowings/borrowing-list/borrowing-list.component').then(m => m.BorrowingListComponent),
      },
      {
        path: 'borrowings/all',
        loadComponent: () => import('./features/borrowings/borrowing-list/borrowing-list.component').then(m => m.BorrowingListComponent),
        data: { roles: ['LIBRARIAN', 'ADMIN'] },
        canActivate: [roleGuard],
      },
      {
        path: 'borrowings/overdue',
        loadComponent: () => import('./features/borrowings/borrowing-list/borrowing-list.component').then(m => m.BorrowingListComponent),
        data: { roles: ['LIBRARIAN', 'ADMIN'] },
        canActivate: [roleGuard],
      },
      {
        path: 'borrowings/new',
        loadComponent: () => import('./features/borrowings/borrowing-form/borrowing-form.component').then(m => m.BorrowingFormComponent),
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/reservations/reservation-list/reservation-list.component').then(m => m.ReservationListComponent),
      },
      {
        path: 'reservations/all',
        loadComponent: () => import('./features/reservations/reservation-list/reservation-list.component').then(m => m.ReservationListComponent),
        data: { roles: ['LIBRARIAN', 'ADMIN'] },
        canActivate: [roleGuard],
      },
      {
        path: 'fines',
        loadComponent: () => import('./features/fines/fine-list/fine-list.component').then(m => m.FineListComponent),
      },
      {
        path: 'fines/all',
        loadComponent: () => import('./features/fines/fine-list/fine-list.component').then(m => m.FineListComponent),
        data: { roles: ['LIBRARIAN', 'ADMIN'] },
        canActivate: [roleGuard],
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent),
        data: { roles: ['LIBRARIAN', 'ADMIN'] },
        canActivate: [roleGuard],
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/users/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'admin/roles',
        loadComponent: () => import('./features/admin/role-management/role-management.component').then(m => m.RoleManagementComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard],
      },
      {
        path: 'admin/config',
        loadComponent: () => import('./features/admin/system-config/system-config.component').then(m => m.SystemConfigComponent),
        data: { roles: ['ADMIN'] },
        canActivate: [roleGuard],
      },
    ],
  },
];
