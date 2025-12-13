import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/healthcare.models';

const roleRouteMap: Record<UserRole, string> = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard'
};

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const roleGuard = (role: UserRole): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const currentUser = authService.currentUser;

    if (!currentUser) {
      return router.createUrlTree(['/login']);
    }

    if (currentUser.role === 'admin') {
      return true;
    }

    return authService.hasRole(role) ? true : router.createUrlTree([roleRouteMap[currentUser.role]]);
  };
};

export const guestOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([roleRouteMap[authService.currentUser!.role]]);
};
