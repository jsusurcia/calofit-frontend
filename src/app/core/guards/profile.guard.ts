import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const profileGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (user?.type === 'client' && !user.is_profile_complete) {
    router.navigate(['/cliente/onboarding']);
    return false;
  }

  return true;
};
