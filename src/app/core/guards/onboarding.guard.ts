import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user || user.type !== 'client') {
    router.navigate(['/login']);
    return false;
  }

  if (user.is_profile_complete) {
    router.navigate(['/cliente/dashboard']);
    return false;
  }

  return true;
};
