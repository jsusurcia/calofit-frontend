import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

const API = 'http://localhost:8000';

interface PerfilPayload {
  first_name: string;
  last_name_paternal: string;
  last_name_maternal: string;
  birth_date: string;
  gender: string;
  weight: number;
  height: number;
  activity_level: string;
  goal: string;
  medical_conditions: string[];
  is_profile_complete: boolean;
}

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">

        <!-- Logo / Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-[#146aff] rounded-2xl mb-4 shadow-lg">
            <span class="text-2xl text-white font-bold">C</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Bienvenido a Calofit</h1>
          <p class="text-sm text-gray-400 mt-1">Completa tu perfil para comenzar</p>
        </div>

        <!-- Step Indicator -->
        <div class="flex items-center justify-center gap-3 mb-8">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              [ngClass]="step() === 1 ? 'bg-[#146aff] text-white' : 'bg-emerald-500 text-white'">
              @if (step() === 1) { 1 } @else { ✓ }
            </div>
            <span class="text-sm font-medium" [ngClass]="step() === 1 ? 'text-gray-900' : 'text-gray-400'">
              Datos personales
            </span>
          </div>
          <div class="w-8 h-px bg-gray-200"></div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              [ngClass]="step() === 2 ? 'bg-[#146aff] text-white' : 'bg-gray-100 text-gray-400'">
              2
            </div>
            <span class="text-sm font-medium" [ngClass]="step() === 2 ? 'text-gray-900' : 'text-gray-400'">
              Datos físicos
            </span>
          </div>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          <!-- Step 1 -->
          @if (step() === 1) {
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre <span class="text-red-400">*</span></label>
                  <input type="text" [(ngModel)]="firstName" name="firstName"
                    placeholder="Juan"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Apellido paterno <span class="text-red-400">*</span></label>
                  <input type="text" [(ngModel)]="lastNamePaternal" name="lastNamePaternal"
                    placeholder="García"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Apellido materno</label>
                <input type="text" [(ngModel)]="lastNameMaternal" name="lastNameMaternal"
                  placeholder="López (opcional)"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Fecha de nacimiento <span class="text-red-400">*</span></label>
                <input type="date" [(ngModel)]="birthDate" name="birthDate"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Género <span class="text-red-400">*</span></label>
                <div class="flex gap-3">
                  <label class="flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                    [ngClass]="gender === 'M' ? 'border-[#146aff] bg-blue-50' : 'border-gray-200 hover:border-gray-300'">
                    <input type="radio" [(ngModel)]="gender" name="gender" value="M" class="accent-[#146aff]" />
                    <span class="text-sm font-medium text-gray-700">Masculino</span>
                  </label>
                  <label class="flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
                    [ngClass]="gender === 'F' ? 'border-[#146aff] bg-blue-50' : 'border-gray-200 hover:border-gray-300'">
                    <input type="radio" [(ngModel)]="gender" name="gender" value="F" class="accent-[#146aff]" />
                    <span class="text-sm font-medium text-gray-700">Femenino</span>
                  </label>
                </div>
              </div>

              @if (step1Error()) {
                <p class="text-xs text-red-500">{{ step1Error() }}</p>
              }

              <button (click)="goStep2()"
                class="w-full py-3 bg-[#146aff] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors mt-2">
                Continuar
              </button>
            </div>
          }

          <!-- Step 2 -->
          @if (step() === 2) {
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Peso (kg) <span class="text-red-400">*</span></label>
                  <input type="number" [(ngModel)]="weight" name="weight" min="1" step="0.1"
                    placeholder="70"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Altura (cm) <span class="text-red-400">*</span></label>
                  <input type="number" [(ngModel)]="height" name="height" min="1"
                    placeholder="170"
                    class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Nivel de actividad</label>
                <select [(ngModel)]="activityLevel" name="activityLevel"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all">
                  <option value="Sedentario">Sedentario</option>
                  <option value="Ligero">Ligero</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Intenso">Intenso</option>
                  <option value="Muy intenso">Muy intenso</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Objetivo</label>
                <select [(ngModel)]="goal" name="goal"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all">
                  <option value="Perder peso">Perder peso</option>
                  <option value="Mantener peso">Mantener peso</option>
                  <option value="Ganar masa">Ganar masa</option>
                </select>
              </div>

              <!-- Medical Conditions chips -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Condiciones médicas</label>
                <div class="flex gap-2 mb-2 flex-wrap">
                  @for (condition of medicalConditions(); track condition) {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#146aff] text-xs font-medium rounded-full">
                      {{ condition }}
                      <button type="button" (click)="removeCondition(condition)"
                        class="text-[#146aff] hover:text-red-500 transition-colors leading-none cursor-pointer">×</button>
                    </span>
                  }
                </div>
                <div class="flex gap-2">
                  <input type="text" [(ngModel)]="conditionInput" name="conditionInput"
                    placeholder="Ej: Diabetes tipo 2"
                    (keydown.enter)="$event.preventDefault(); addCondition()"
                    class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                  <button type="button" (click)="addCondition()"
                    class="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                    Agregar
                  </button>
                </div>
              </div>

              @if (step2Error()) {
                <p class="text-xs text-red-500">{{ step2Error() }}</p>
              }

              <div class="flex gap-3 pt-2">
                <button type="button" (click)="step.set(1)"
                  class="flex-1 py-3 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                  Atrás
                </button>
                <button type="button" (click)="submit()" [disabled]="submitting()"
                  class="flex-1 py-3 bg-[#146aff] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
                  {{ submitting() ? 'Guardando...' : 'Completar perfil' }}
                </button>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<1 | 2>(1);
  readonly submitting = signal(false);
  readonly step1Error = signal<string | null>(null);
  readonly step2Error = signal<string | null>(null);
  readonly medicalConditions = signal<string[]>([]);

  firstName = '';
  lastNamePaternal = '';
  lastNameMaternal = '';
  birthDate = '';
  gender = 'M';

  weight: number | null = null;
  height: number | null = null;
  activityLevel = 'Moderado';
  goal = 'Mantener peso';
  conditionInput = '';

  goStep2(): void {
    this.step1Error.set(null);
    if (!this.firstName.trim()) {
      this.step1Error.set('El nombre es requerido.');
      return;
    }
    if (!this.lastNamePaternal.trim()) {
      this.step1Error.set('El apellido paterno es requerido.');
      return;
    }
    if (!this.birthDate) {
      this.step1Error.set('La fecha de nacimiento es requerida.');
      return;
    }
    const hoy = new Date();
    const nacimiento = new Date(this.birthDate);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    if (nacimiento >= hoy || edad < 1 || edad > 120) {
      this.step1Error.set('Ingresa una fecha de nacimiento válida.');
      return;
    }
    if (!this.gender) {
      this.step1Error.set('Selecciona un género.');
      return;
    }
    this.step.set(2);
  }

  addCondition(): void {
    const val = this.conditionInput.trim();
    if (!val) return;
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(val)) return;
    if (!this.medicalConditions().includes(val)) {
      this.medicalConditions.update(list => [...list, val]);
    }
    this.conditionInput = '';
  }

  removeCondition(condition: string): void {
    this.medicalConditions.update(list => list.filter(c => c !== condition));
  }

  submit(): void {
    this.step2Error.set(null);
    if (!this.weight || this.weight <= 0) {
      this.step2Error.set('Ingresa un peso válido.');
      return;
    }
    if (!this.height || this.height <= 0) {
      this.step2Error.set('Ingresa una altura válida.');
      return;
    }

    this.submitting.set(true);

    const payload: PerfilPayload = {
      first_name: this.firstName.trim(),
      last_name_paternal: this.lastNamePaternal.trim(),
      last_name_maternal: this.lastNameMaternal.trim(),
      birth_date: this.birthDate,
      gender: this.gender,
      weight: this.weight,
      height: this.height,
      activity_level: this.activityLevel,
      goal: this.goal,
      medical_conditions: this.medicalConditions(),
      is_profile_complete: true,
    };

    this.http.put(`${API}/clientes/perfil`, payload).subscribe({
      next: () => {
        this.http.get<any>(`${API}/clientes/perfil`).subscribe({
          next: (perfil) => {
            this.auth.updateCurrentUser(perfil);
            this.router.navigate(['/cliente/dashboard']);
          },
          error: () => {
            const user = this.auth.currentUser();
            if (user) {
              this.auth.updateCurrentUser({ ...user, is_profile_complete: true });
            }
            this.router.navigate(['/cliente/dashboard']);
          },
        });
      },
      error: (err) => {
        this.step2Error.set(err?.error?.detail ?? 'Error al guardar perfil. Intenta de nuevo.');
        this.submitting.set(false);
      },
    });
  }
}
