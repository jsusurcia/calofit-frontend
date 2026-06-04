import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import {
  LucideAngularModule,
  Scale,
  Ruler,
  Activity,
  Target,
  Stethoscope,
  X,
  Save,
} from 'lucide-angular';

const API_URL = 'http://localhost:8000';

interface PerfilResponse {
  weight: number;
  height: number;
  activity_level: string;
  goal: string;
  medical_conditions: string[];
}

interface UpdateResponse {
  message: string;
  cliente: unknown;
  plan_recalculado: boolean;
}

@Component({
  selector: 'app-editar-perfil',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

      <!-- ── Header ── -->
      <div class="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Editar Perfil</h1>
          <p class="text-sm text-gray-400 mt-1">
            Actualiza tu información personal y métricas de salud para un seguimiento preciso.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <a routerLink="/cliente/perfil"
             class="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <lucide-angular [img]="XIcon" [size]="14" />
            Cancelar
          </a>
          <button (click)="save()" [disabled]="saving() || loading()"
            class="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer">
            <lucide-angular [img]="SaveIcon" [size]="15" />
            {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p class="text-sm text-gray-400">Cargando datos...</p>
          </div>
        </div>
      }

      <!-- Formulario -->
      @if (!loading()) {

        <!-- Error global -->
        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {{ error() }}
          </div>
        }

        <!-- ── Tarjeta principal ── -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <!-- Encabezado de la tarjeta -->
          <div class="px-6 pt-6 pb-5">
            <h2 class="text-lg font-bold text-gray-900">Datos de Salud</h2>
            <p class="text-sm text-gray-400 mt-0.5">Actualiza tus medidas biométricas y preferencias personales.</p>
          </div>

          <hr class="border-gray-100" />

          <!-- ── Métricas Vitales ── -->
          <div class="px-6 py-6">
            <div class="flex items-center gap-2 mb-5">
              <lucide-angular [img]="ScaleIcon" [size]="17" class="text-indigo-500" />
              <h3 class="text-sm font-semibold text-gray-800">Métricas Vitales</h3>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <!-- Peso -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                <div class="relative">
                  <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <lucide-angular [img]="ScaleIcon" [size]="16" />
                  </div>
                  <input type="number" [(ngModel)]="weight" name="weight" min="25" max="350" step="0.1"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
                </div>
                <p class="text-xs text-gray-400 mt-1.5">Ingresa tu peso actual en kilogramos.</p>
              </div>

              <!-- Estatura -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Estatura (cm)</label>
                <div class="relative">
                  <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <lucide-angular [img]="RulerIcon" [size]="16" />
                  </div>
                  <input type="number" [(ngModel)]="height" name="height" min="60" max="250"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
                </div>
                <p class="text-xs text-gray-400 mt-1.5">Ingresa tu altura total en centímetros.</p>
              </div>

            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- ── Nivel de Actividad + Objetivo de Salud ── -->
          <div class="px-6 py-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">

              <!-- Nivel de Actividad -->
              <div>
                <div class="flex items-center gap-2 mb-4">
                  <lucide-angular [img]="ActivityIcon" [size]="17" class="text-indigo-500" />
                  <h3 class="text-sm font-semibold text-gray-800">Nivel de Actividad</h3>
                </div>
                <select [(ngModel)]="activityLevel" name="activityLevel"
                  class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all">
                  <option value="Sedentario">Sedentario (Poca o ninguna actividad)</option>
                  <option value="Ligero">Ligero (Ejercicio 1-3 días/semana)</option>
                  <option value="Moderado">Moderado (Ejercicio 3-5 días/semana)</option>
                  <option value="Intenso">Intenso (Ejercicio 6-7 días/semana)</option>
                  <option value="Muy intenso">Muy intenso (Ejercicio diario intenso)</option>
                </select>
              </div>

              <!-- Objetivo de Salud -->
              <div>
                <div class="flex items-center gap-2 mb-4">
                  <lucide-angular [img]="TargetIcon" [size]="17" class="text-indigo-500" />
                  <h3 class="text-sm font-semibold text-gray-800">Objetivo de Salud</h3>
                </div>
                <div class="space-y-3">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="radio" [(ngModel)]="goal" name="goal" value="Perder peso"
                      class="accent-indigo-500 w-4 h-4 cursor-pointer" />
                    <span class="text-sm text-gray-700">Perder peso</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="radio" [(ngModel)]="goal" name="goal" value="Mantener peso"
                      class="accent-indigo-500 w-4 h-4 cursor-pointer" />
                    <span class="text-sm text-gray-700">Mantener peso</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="radio" [(ngModel)]="goal" name="goal" value="Ganar masa"
                      class="accent-indigo-500 w-4 h-4 cursor-pointer" />
                    <span class="text-sm text-gray-700">Aumentar masa muscular</span>
                  </label>
                </div>
              </div>

            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- ── Condiciones Médicas ── -->
          <div class="px-6 py-6">
            <div class="flex items-center gap-2 mb-5">
              <lucide-angular [img]="StethoscopeIcon" [size]="17" class="text-indigo-500" />
              <h3 class="text-sm font-semibold text-gray-800">Condiciones Médicas</h3>
            </div>
            <div class="grid grid-cols-2 gap-y-4 gap-x-8">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="conditions.ninguna" name="ninguna"
                  class="accent-indigo-500 w-4 h-4 rounded cursor-pointer" />
                <span class="text-sm text-gray-700">Ninguna</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="conditions.diabetes" name="diabetes"
                  class="accent-indigo-500 w-4 h-4 rounded cursor-pointer" />
                <span class="text-sm text-gray-700">Diabetes</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="conditions.hipertension" name="hipertension"
                  class="accent-indigo-500 w-4 h-4 rounded cursor-pointer" />
                <span class="text-sm text-gray-700">Hipertensión</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="conditions.asma" name="asma"
                  class="accent-indigo-500 w-4 h-4 rounded cursor-pointer" />
                <span class="text-sm text-gray-700">Asma</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="conditions.otra" name="otra"
                  class="accent-indigo-500 w-4 h-4 rounded cursor-pointer" />
                <span class="text-sm text-gray-400 italic">Otra condición...</span>
              </label>
            </div>
          </div>

        </div>
      }
    </div>
  `,
})
export class EditarPerfilComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly ScaleIcon = Scale;
  readonly RulerIcon = Ruler;
  readonly ActivityIcon = Activity;
  readonly TargetIcon = Target;
  readonly StethoscopeIcon = Stethoscope;
  readonly XIcon = X;
  readonly SaveIcon = Save;

  weight = 0;
  height = 0;
  activityLevel = 'Moderado';
  goal = 'Mantener peso';
  conditions = {
    ninguna: false,
    diabetes: false,
    hipertension: false,
    asma: false,
    otra: false,
  };

  ngOnInit(): void {
    this.http.get<PerfilResponse>(`${API_URL}/clientes/perfil`).subscribe({
      next: (data) => {
        this.weight = data.weight;
        this.height = data.height;
        this.activityLevel = data.activity_level;
        this.goal = data.goal;
        this.prefillConditions(data.medical_conditions);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el perfil. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.error.set(null);

    if (!this.weight || this.weight < 25 || this.weight > 350) {
      this.error.set('El peso debe estar entre 25 y 350 kg.');
      return;
    }
    if (!this.height || this.height < 60 || this.height > 250) {
      this.error.set('La altura debe estar entre 60 y 250 cm.');
      return;
    }
    const imc = this.weight / Math.pow(this.height / 100, 2);
    if (imc < 10 || imc > 90) {
      this.error.set(`La combinación de peso y altura genera un IMC de ${imc.toFixed(1)}, fuera de rango. Verifica los valores.`);
      return;
    }

    this.saving.set(true);

    const payload = {
      weight: this.weight,
      height: this.height,
      activity_level: this.activityLevel,
      goal: this.goal,
      medical_conditions: this.buildConditionsArray(),
    };

    this.http.patch<UpdateResponse>(`${API_URL}/clientes/datos`, payload).subscribe({
      next: (res) => {
        const title = '¡Perfil actualizado!';
        const msg = res.plan_recalculado
          ? 'Tu plan nutricional fue recalculado automáticamente.'
          : 'Los cambios se guardaron correctamente.';
        this.toastr.success(msg, title);
        this.router.navigate(['/cliente/perfil']);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'No se pudo guardar. Intenta de nuevo.');
        this.saving.set(false);
      },
    });
  }

  private prefillConditions(apiConditions: string[]): void {
    const normalized = apiConditions.map(c => c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
    this.conditions.ninguna = apiConditions.length === 0 || normalized.includes('ninguna');
    this.conditions.diabetes = normalized.includes('diabetes');
    this.conditions.hipertension = normalized.includes('hipertension');
    this.conditions.asma = normalized.includes('asma');
    this.conditions.otra = apiConditions.some(
      c => !['ninguna', 'diabetes', 'hipertensión', 'hipertension', 'asma'].includes(c.toLowerCase())
    );
  }

  private buildConditionsArray(): string[] {
    if (this.conditions.ninguna) return [];
    const result: string[] = [];
    if (this.conditions.diabetes) result.push('Diabetes');
    if (this.conditions.hipertension) result.push('Hipertensión');
    if (this.conditions.asma) result.push('Asma');
    return result;
  }
}
