import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedTypes: string[] = route.data['allowedTypes'] ?? [];
  const allowedRoles: string[] = route.data['allowedRoles'] ?? [];

  const userType = authService.userType();
  const userRole = authService.userRole();

  if (!userType) {
    router.navigate(['/login']);
    return false;
  }

  // Check type
  if (allowedTypes.length > 0 && !allowedTypes.includes(userType)) {
    router.navigate([authService.getRedirectRoute()]);
    return false;
  }

  // Check role (only for staff)
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    router.navigate([authService.getRedirectRoute()]);
    return false;
  }

  return true;
};
