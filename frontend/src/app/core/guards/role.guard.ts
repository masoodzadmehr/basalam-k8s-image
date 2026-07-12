import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route): boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: string[] = route.data?.['roles'] ?? [];
  const userRole = authService.userRole();

  if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
    return true;
  }

  router.navigate(['/books']);
  return false;
};
