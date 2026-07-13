import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        toast.show('Access denied', 'error');
      } else if (error.status >= 500) {
        toast.show('Server error. Please try again.', 'error');
      } else if (error.status === 400) {
        const msg = error.error?.message || 'Invalid request';
        toast.show(msg, 'error');
      }
      return throwError(() => error);
    })
  );
};
