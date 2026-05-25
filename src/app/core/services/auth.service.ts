import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  UserInfo,
  LoginRequest,
  LoginResponse,
  StaffRole,
} from '../models/user.model';

const API_URL = 'http://localhost:8000';
const TOKEN_KEY = 'calofit_token';
const USER_KEY = 'calofit_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<UserInfo | null>(this.loadUserFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly userType = computed(() => this._currentUser()?.type ?? null);
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly userId = computed(() => this._currentUser()?.id ?? null);
  readonly fullName = computed(() => {
    const u = this._currentUser();
    return u ? `${u.name} ${u.last_name}` : '';
  });

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string, rememberMe = false): Observable<LoginResponse> {
    const body: LoginRequest = {
      email,
      password,
      remember_me: rememberMe,
      user_type: 'auto',
    };
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, body).pipe(
      tap((res) => {
        this.storeSession(res);
      })
    );
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${API_URL}/auth/forgot-password`, { email });
  }

  verifyResetCode(email: string, resetCode: string): Observable<unknown> {
    return this.http.post(`${API_URL}/auth/verify-reset-code`, {
      email,
      reset_code: resetCode,
      new_password: '',
    });
  }

  resetPassword(email: string, resetCode: string, newPassword: string): Observable<unknown> {
    return this.http.post(`${API_URL}/auth/reset-password`, {
      email,
      reset_code: resetCode,
      new_password: newPassword,
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRedirectRoute(): string {
    const user = this._currentUser();
    if (!user) return '/login';

    if (user.type === 'client') {
      return user.is_profile_complete ? '/cliente/dashboard' : '/cliente/onboarding';
    }

    if (user.type === 'staff' && user.role === 'admin') {
      return '/admin/dashboard';
    }

    return '/login';
  }

  private storeSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user_info));
    this._currentUser.set(res.user_info);
  }

  updateCurrentUser(user: UserInfo): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadUserFromStorage(): UserInfo | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as UserInfo;
    } catch {
      return null;
    }
  }
}
