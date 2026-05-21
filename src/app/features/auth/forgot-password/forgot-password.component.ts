import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="hero-gradient min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <!-- Decorative background elements -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-100/40 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-100/40 rounded-full blur-3xl"></div>
      </div>

      <!-- Card -->
      <div class="relative w-full max-w-md animate-fade-in-up">
        <div class="bg-white rounded-2xl shadow-xl shadow-primary-500/5 border border-gray-100 p-8 sm:p-10">
          <!-- Logo & Title -->
          <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-14 h-14 bg-primary-50 rounded-2xl mb-3">
              <span class="text-2xl">🔐</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Recuperar contraseña</h1>
            <p class="mt-1.5 text-sm text-gray-500">
              {{ stepDescription() }}
            </p>
          </div>

          <!-- Step Indicator -->
          <div class="flex items-center justify-center gap-2 mb-8">
            @for (s of [1, 2, 3]; track s) {
              <div class="flex items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  [class]="s <= currentStep()
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'bg-gray-100 text-gray-400'"
                >
                  @if (s < currentStep()) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  } @else {
                    {{ s }}
                  }
                </div>
                @if (s < 3) {
                  <div
                    class="w-8 h-0.5 mx-1 transition-all duration-300"
                    [class]="s < currentStep() ? 'bg-primary-500' : 'bg-gray-200'"
                  ></div>
                }
              </div>
            }
          </div>

          <!-- Error Alert -->
          @if (errorMessage()) {
            <div class="mb-5 animate-fade-in-up">
              <div class="flex items-start gap-3 bg-danger-50 border border-danger-100 text-danger-700 px-4 py-3 rounded-xl text-sm">
                <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            </div>
          }

          <!-- Step 1: Email -->
          @if (currentStep() === 1) {
            <form [formGroup]="emailForm" (ngSubmit)="submitEmail()" class="space-y-5 animate-fade-in-up">
              <div class="relative">
                <input
                  type="email"
                  id="email"
                  formControlName="email"
                  placeholder=" "
                  class="peer w-full px-4 pt-5 pb-2 text-sm text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                         transition-all duration-200"
                  [class.border-danger-400]="emailForm.get('email')?.invalid && emailForm.get('email')?.touched"
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
                @if (emailForm.get('email')?.invalid && emailForm.get('email')?.touched) {
                  <p class="mt-1.5 text-xs text-danger-500 pl-1">Ingresa un correo válido</p>
                }
              </div>

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
                  <span>Enviando...</span>
                } @else {
                  <span>Enviar código</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                }
              </button>
            </form>
          }

          <!-- Step 2: Verification Code -->
          @if (currentStep() === 2) {
            <form [formGroup]="codeForm" (ngSubmit)="submitCode()" class="space-y-5 animate-fade-in-up">
              <div class="text-center mb-2">
                <p class="text-sm text-gray-500">
                  Código enviado a <span class="font-semibold text-gray-700">{{ savedEmail() }}</span>
                </p>
              </div>

              <!-- 6-digit Code Input -->
              <div class="relative">
                <input
                  type="text"
                  id="code"
                  formControlName="code"
                  placeholder=" "
                  maxlength="6"
                  class="peer w-full px-4 pt-5 pb-2 text-sm text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl
                         tracking-[0.5em] text-center font-mono text-lg
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                         transition-all duration-200"
                  [class.border-danger-400]="codeForm.get('code')?.invalid && codeForm.get('code')?.touched"
                />
                <label
                  for="code"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none
                         transition-all duration-200
                         peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary-500
                         peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Código de 6 dígitos
                </label>
                @if (codeForm.get('code')?.invalid && codeForm.get('code')?.touched) {
                  <p class="mt-1.5 text-xs text-danger-500 pl-1">El código debe tener 6 dígitos</p>
                }
              </div>

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
                  <span>Verificando...</span>
                } @else {
                  <span>Verificar código</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                }
              </button>

              <!-- Resend code -->
              <div class="text-center">
                <button
                  type="button"
                  (click)="resendCode()"
                  [disabled]="resendCooldown() > 0"
                  class="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors disabled:text-gray-400"
                >
                  @if (resendCooldown() > 0) {
                    Reenviar código en {{ resendCooldown() }}s
                  } @else {
                    ¿No recibiste el código? Reenviar
                  }
                </button>
              </div>
            </form>
          }

          <!-- Step 3: New Password -->
          @if (currentStep() === 3) {
            <form [formGroup]="passwordForm" (ngSubmit)="submitPassword()" class="space-y-5 animate-fade-in-up">
              <!-- New Password -->
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  id="newPassword"
                  formControlName="newPassword"
                  placeholder=" "
                  class="peer w-full px-4 pt-5 pb-2 pr-12 text-sm text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                         transition-all duration-200"
                  [class.border-danger-400]="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched"
                />
                <label
                  for="newPassword"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none
                         transition-all duration-200
                         peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary-500
                         peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Nueva contraseña
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
                @if (passwordForm.get('newPassword')?.hasError('required') && passwordForm.get('newPassword')?.touched) {
                  <p class="mt-1.5 text-xs text-danger-500 pl-1">La contraseña es requerida</p>
                } @else if (passwordForm.get('newPassword')?.hasError('minlength') && passwordForm.get('newPassword')?.touched) {
                  <p class="mt-1.5 text-xs text-danger-500 pl-1">Mínimo 8 caracteres</p>
                }
              </div>

              <!-- Password Strength Indicator -->
              @if (passwordForm.get('newPassword')?.value) {
                <div class="space-y-2">
                  <div class="flex gap-1">
                    @for (i of [1, 2, 3, 4]; track i) {
                      <div
                        class="h-1 flex-1 rounded-full transition-all duration-300"
                        [class]="i <= passwordStrength()
                          ? (passwordStrength() <= 1 ? 'bg-danger-500' : passwordStrength() <= 2 ? 'bg-warning-500' : passwordStrength() <= 3 ? 'bg-accent-400' : 'bg-success-500')
                          : 'bg-gray-200'"
                      ></div>
                    }
                  </div>
                  <p class="text-xs" [class]="passwordStrength() <= 1 ? 'text-danger-500' : passwordStrength() <= 2 ? 'text-warning-500' : passwordStrength() <= 3 ? 'text-accent-500' : 'text-success-600'">
                    {{ passwordStrengthLabel() }}
                  </p>
                </div>
              }

              <!-- Confirm Password -->
              <div class="relative">
                <input
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  placeholder=" "
                  class="peer w-full px-4 pt-5 pb-2 pr-12 text-sm text-gray-900 bg-gray-50/50 border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                         transition-all duration-200"
                  [class.border-danger-400]="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched"
                />
                <label
                  for="confirmPassword"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none
                         transition-all duration-200
                         peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary-500
                         peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Confirmar contraseña
                </label>
                <button
                  type="button"
                  (click)="showConfirmPassword.set(!showConfirmPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  @if (showConfirmPassword()) {
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
                @if (passwordForm.get('confirmPassword')?.hasError('required') && passwordForm.get('confirmPassword')?.touched) {
                  <p class="mt-1.5 text-xs text-danger-500 pl-1">Confirma tu contraseña</p>
                } @else if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched) {
                  <p class="mt-1.5 text-xs text-danger-500 pl-1">Las contraseñas no coinciden</p>
                }
              </div>

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
                  <span>Actualizando...</span>
                } @else {
                  <span>Cambiar contraseña</span>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                }
              </button>
            </form>
          }

          <!-- Back to Login -->
          <div class="mt-6 text-center">
            <a
              routerLink="/login"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Volver al inicio de sesión
            </a>
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
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentStep = signal(1);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  savedEmail = signal('');
  savedCode = signal('');
  resendCooldown = signal(0);

  currentYear = new Date().getFullYear();

  // Forms
  emailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  codeForm = new FormGroup({
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
      Validators.pattern(/^\d{6}$/),
    ]),
  });

  passwordForm = new FormGroup(
    {
      newPassword: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: this.passwordMatchValidator }
  );

  // Computed
  stepDescription = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return 'Ingresa tu correo para recibir un código de recuperación';
      case 2:
        return 'Ingresa el código de 6 dígitos que enviamos a tu correo';
      case 3:
        return 'Crea una nueva contraseña segura para tu cuenta';
      default:
        return '';
    }
  });

  passwordStrength = computed(() => {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  });

  passwordStrengthLabel = computed(() => {
    switch (this.passwordStrength()) {
      case 0:
      case 1:
        return 'Débil';
      case 2:
        return 'Regular';
      case 3:
        return 'Buena';
      case 4:
        return 'Excelente';
      default:
        return '';
    }
  });

  // Validators
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Step 1: Send email
  submitEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const email = this.emailForm.get('email')!.value!;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.savedEmail.set(email);
        this.currentStep.set(2);
        this.loading.set(false);
        this.startResendCooldown();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.detail || 'No se pudo enviar el código. Verifica tu correo.'
        );
      },
    });
  }

  // Step 2: Verify code
  submitCode(): void {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const code = this.codeForm.get('code')!.value!;

    this.authService.verifyResetCode(this.savedEmail(), code).subscribe({
      next: () => {
        this.savedCode.set(code);
        this.currentStep.set(3);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.detail || 'Código inválido o expirado. Inténtalo de nuevo.'
        );
      },
    });
  }

  // Step 3: Reset password
  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const newPassword = this.passwordForm.get('newPassword')!.value!;

    this.authService
      .resetPassword(this.savedEmail(), this.savedCode(), newPassword)
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/login'], {
            state: {
              message: '¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión.',
            },
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err.error?.detail || 'No se pudo actualizar la contraseña. Inténtalo de nuevo.'
          );
        },
      });
  }

  // Resend code with cooldown
  resendCode(): void {
    if (this.resendCooldown() > 0) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword(this.savedEmail()).subscribe({
      next: () => {
        this.loading.set(false);
        this.startResendCooldown();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.detail || 'No se pudo reenviar el código.'
        );
      },
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    const interval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(interval);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }
}
