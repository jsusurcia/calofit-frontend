import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Flame } from 'lucide-angular';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="hero-gradient min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <!-- Decorative background elements -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-100/40 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-100/40 rounded-full blur-3xl"></div>
      </div>

      <!-- Login Card -->
      <div class="relative w-full max-w-md animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-xl shadow-primary-500/5 border border-gray-100 p-8 sm:p-10">
          <!-- Logo & Title -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-4 text-[#146aff]">
              <lucide-angular [img]="FlameIcon" [size]="32" />
            </div>
            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">
              Calo<span class="text-primary-500">Fit</span>
            </h1>
            <p class="mt-2 text-sm text-gray-500 font-medium">Tu nutrición inteligente</p>
          </div>

          <!-- Error Alert -->
          @if (errorMessage()) {
            <div class="mb-6 animate-fade-in-up">
              <div class="flex items-start gap-3 bg-danger-50 border border-danger-100 text-danger-700 px-4 py-3 rounded-xl text-sm">
                <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            </div>
          }

          <!-- Success Alert (e.g. from password reset) -->
          @if (successMessage()) {
            <div class="mb-6 animate-fade-in-up">
              <div class="flex items-start gap-3 bg-success-50 border border-success-100 text-success-700 px-4 py-3 rounded-xl text-sm">
                <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{{ successMessage() }}</span>
              </div>
            </div>
          }

          <!-- Login Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Email Field -->
            <div class="relative">
              <input
                type="email"
                id="email"
                formControlName="email"
                placeholder=" "
                class="peer w-full px-4 pt-5 pb-2 text-sm text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                       transition-all duration-200"
                [class.border-danger-400]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              />
              <label
                for="email"
                class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none
                       transition-all duration-200
                       peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary-500
                       peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
              >
                Correo electrónico
              </label>
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <p class="mt-1.5 text-xs text-danger-500 pl-1">Ingresa un correo válido</p>
              }
            </div>

            <!-- Password Field -->
            <div class="relative">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                formControlName="password"
                placeholder=" "
                class="peer w-full px-4 pt-5 pb-2 pr-12 text-sm text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                       transition-all duration-200"
                [class.border-danger-400]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              />
              <label
                for="password"
                class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none
                       transition-all duration-200
                       peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary-500
                       peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
              >
                Contraseña
              </label>
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                @if (showPassword()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                }
              </button>
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <p class="mt-1.5 text-xs text-danger-500 pl-1">La contraseña es requerida</p>
              }
            </div>

            <!-- Remember Me + Forgot Password -->
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer group">
                <div class="relative">
                  <input
                    type="checkbox"
                    formControlName="rememberMe"
                    class="peer sr-only"
                  />
                  <div class="w-5 h-5 border-2 border-gray-300 rounded-md
                              peer-checked:bg-primary-500 peer-checked:border-primary-500
                              transition-all duration-200
                              group-hover:border-primary-400
                              flex items-center justify-center">
                    <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
                <span class="text-sm text-gray-600 select-none">Recordarme</span>
              </label>
              <a
                routerLink="/forgot-password"
                class="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-3.5 px-6 bg-primary-500 text-white font-semibold rounded-xl
                     hover:bg-primary-600 active:bg-primary-700
                     focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-200 transform hover:shadow-lg hover:shadow-primary-500/25
                     flex items-center justify-center gap-2"
            >
              @if (loading()) {
                <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Iniciando sesión...</span>
              } @else {
                <span>Iniciar sesión</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              }
            </button>
          </form>

          <!-- Footer -->
          <div class="mt-8 pt-6 border-t border-gray-100 text-center">
            <p class="text-sm text-gray-500">
              ¿No tienes una cuenta?
              <a href="#" class="font-semibold text-primary-500 hover:text-primary-600 transition-colors ml-1">
                Contacta a tu nutricionista
              </a>
            </p>
          </div>
        </div>

        <!-- Bottom branding -->
        <p class="text-center mt-6 text-xs text-gray-400">
          © {{ currentYear }} CaloFit · Todos los derechos reservados
        </p>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly FlameIcon = Flame;

  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  currentYear = new Date().getFullYear();

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false),
  });

  constructor() {
    // Check for success message from password reset redirect
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { message?: string } | undefined;
    if (state?.message) {
      this.successMessage.set(state.message);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService.login(email!, password!, rememberMe ?? false).subscribe({
      next: () => {
        const redirectRoute = this.authService.getRedirectRoute();
        this.router.navigate([redirectRoute]);
      },
      error: (err) => {
        this.loading.set(false);
        const message =
          err.error?.detail ||
          err.error?.message ||
          'Credenciales incorrectas. Verifica tu correo y contraseña.';
        this.errorMessage.set(message);
      },
    });
  }
}
