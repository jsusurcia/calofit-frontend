import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastr = inject(ToastrService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        toastr.error('Tu sesión ha expirado. Inicia sesión nuevamente.', 'Sesión expirada');
        authService.logout();
      } else if (error.status === 403) {
        toastr.warning('No tienes permisos para esta acción.', 'Acceso denegado');
      } else if (error.status >= 400 && error.status < 500) {
        const message = error.error?.detail || error.error?.message || 'Error en la solicitud';
        toastr.error(message, 'Error');
      } else if (error.status >= 500) {
        toastr.error('Error interno del servidor. Intenta de nuevo más tarde.', 'Error del servidor');
      }
      return throwError(() => error);
    })
  );
};
