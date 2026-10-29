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
    <div class="relative min-h-screen md:h-screen md:min-h-0 overflow-hidden bg-cream-2 md:bg-cream flex flex-col md:items-center md:justify-center md:px-6 md:py-4">
      <!-- Decorative rings -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute rounded-full border-[18px] md:border-[26px] border-cyan-ring/30
                    w-[420px] h-[420px] -top-52 left-[30%]
                    md:w-[640px] md:h-[640px] md:-top-80 md:left-auto md:-right-48">
          <span class="absolute left-[14%] top-[82%] w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-cyan-ring bg-cream"></span>
        </div>
        <div class="absolute rounded-full border-[14px] md:border-[20px] border-green-pale/70
                    w-[300px] h-[300px] top-16 -left-56
                    md:w-[440px] md:h-[440px] md:top-auto md:-bottom-60 md:-left-52">
          <span class="absolute left-[62%] top-[9%] w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-green-leaf bg-cream"></span>
        </div>
      </div>

      <!-- Mobile header -->
      <div class="relative z-10 md:hidden text-center pt-12 pb-10 px-6">
        <img src="/logo-calofit.png" alt="Logo de Calofit" class="w-44 h-auto mx-auto" />
        <p class="mt-3 text-base font-semibold text-teal-mid">Tu ritmo, tus calorías, tus resultados</p>
      </div>

      <div class="relative z-10 w-full flex-1 flex flex-col md:flex-none md:max-w-md animate-fade-in-up">
        <!-- Login Card -->
        <div class="flex-1 flex flex-col bg-white px-6 pt-8 pb-8 rounded-t-[2rem] shadow-[0_-8px_30px_-12px_rgba(23,62,64,0.15)]
                    md:flex-none md:rounded-[2rem] md:px-10 md:py-[clamp(1rem,3.5vh,2.5rem)] md:border md:border-green-cream md:shadow-xl md:shadow-teal-deep/10">
          <!-- Logo & Title -->
          <div class="mb-6 md:mb-[clamp(0.75rem,2.5vh,1.5rem)] md:text-center">
            <img src="/logo-calofit.png" alt="Logo de Calofit" class="hidden md:block mx-auto w-auto md:h-[clamp(5rem,17vh,10rem)] md:mb-[clamp(0.25rem,1.5vh,1rem)]" />
            <h1 class="text-2xl md:text-3xl font-extrabold text-teal-deep">¡Hola de nuevo!</h1>
            <p class="mt-1 text-sm md:text-base text-ink-soft">Ingresa para seguir avanzando a tu ritmo.</p>
          </div>

          <!-- Pending Account Alert -->
          @if (pendingAccount()) {
            <div class="mb-6 animate-fade-in-up">
              <div class="flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
                <svg class="w-5 h-5 mt-0.5 shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Tu cuenta está <strong>pendiente de activación</strong>. Contacta al administrador para verificar tu pago.</span>
              </div>
            </div>
          }

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
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex-1 flex flex-col">
            <div class="space-y-5 md:space-y-[clamp(0.75rem,2.2vh,1.25rem)] mb-8 md:mb-0">
              <!-- Email Field -->
              <div>
                <label for="email" class="block mb-2 text-sm font-semibold text-ink">Correo electrónico</label>
                <div class="relative">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-mid pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2.5"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.5 7l8.5 6 8.5-6"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    formControlName="email"
                    placeholder="tucorreo@dominio.pe"
                    autocomplete="email"
                    class="w-full pl-12 pr-4 py-3.5 md:py-[clamp(0.6rem,1.8vh,0.875rem)] text-sm text-ink placeholder:text-ink-soft/50 bg-cream border border-green-cream rounded-2xl
                           focus:outline-none focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid
                           transition-all duration-200"
                    [class.border-danger-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  />
                </div>
                @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                  <p class="mt-1.5 text-xs text-danger-500 pl-1">Ingresa un correo válido</p>
                }
              </div>

              <!-- Password Field -->
              <div>
                <label for="password" class="block mb-2 text-sm font-semibold text-ink">Contraseña</label>
                <div class="relative">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-mid pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <rect x="5" y="10.5" width="14" height="9.5" rx="2"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 10.5V8a4 4 0 118 0v2.5"/>
                  </svg>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="password"
                    formControlName="password"
                    placeholder="Tu contraseña"
                    autocomplete="current-password"
                    class="w-full pl-12 pr-12 py-3.5 md:py-[clamp(0.6rem,1.8vh,0.875rem)] text-sm text-ink placeholder:text-ink-soft/50 bg-cream border border-green-cream rounded-2xl
                           focus:outline-none focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid
                           transition-all duration-200"
                    [class.border-danger-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-ink hover:text-teal-mid transition-colors p-1"
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
                </div>
                @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                  <p class="mt-1.5 text-xs text-danger-500 pl-1">La contraseña es requerida</p>
                }
              </div>

              <!-- Remember Me + Forgot Password -->
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2.5 cursor-pointer group">
                  <div class="relative">
                    <input type="checkbox" formControlName="rememberMe" class="peer sr-only" />
                    <div class="w-5 h-5 border-2 border-ink-soft/40 rounded-md bg-white
                                peer-checked:bg-teal-mid peer-checked:border-teal-mid
                                peer-focus-visible:ring-2 peer-focus-visible:ring-teal-mid/30
                                transition-all duration-200 group-hover:border-teal-mid
                                flex items-center justify-center">
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  </div>
                  <span class="text-sm text-ink-soft select-none">Recordarme</span>
                </label>
                <a routerLink="/forgot-password" class="text-sm font-semibold text-teal-mid hover:text-teal-deep transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading()"
              class="mt-auto md:mt-[clamp(0.75rem,2.5vh,1.5rem)] w-full py-4 md:py-[clamp(0.7rem,2vh,1rem)] px-6 bg-teal-mid text-white font-bold rounded-2xl
                     hover:bg-teal-deep active:bg-teal-deep
                     focus:outline-none focus:ring-2 focus:ring-teal-mid/50 focus:ring-offset-2
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg shadow-teal-mid/25
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
          <div class="mt-6 md:mt-[clamp(0.75rem,3vh,2rem)] md:pt-[clamp(0.75rem,2.5vh,1.5rem)] md:border-t md:border-green-cream text-center">
            <p class="text-sm text-ink-soft">
              ¿No tienes una cuenta?
              <a [href]="whatsappUrl" target="_blank" rel="noopener noreferrer" class="font-semibold text-teal-mid hover:text-teal-deep transition-colors">
                Contacta al administrador
              </a>
            </p>
          </div>
        </div>

        <!-- Bottom branding (desktop) -->
        <p class="hidden md:block text-center md:mt-[clamp(0.5rem,2vh,1.5rem)] text-xs text-ink-soft">
          © {{ currentYear }} Calofit · Tu ritmo, tus calorías, tus resultados
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
  pendingAccount = signal(false);

  currentYear = new Date().getFullYear();
  readonly whatsappUrl = 'https://wa.me/51959540598';

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
    this.pendingAccount.set(false);

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService.login(email!, password!, rememberMe ?? false).subscribe({
      next: () => {
        const redirectRoute = this.authService.getRedirectRoute();
        this.router.navigate([redirectRoute]);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 403) {
          this.pendingAccount.set(true);
        } else {
          const message =
            err.error?.detail ||
            err.error?.message ||
            'Credenciales incorrectas. Verifica tu correo y contraseña.';
          this.errorMessage.set(message);
        }
      },
    });
  }
}
