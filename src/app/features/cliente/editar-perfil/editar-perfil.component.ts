import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, ChevronLeft, TrendingDown, ArrowLeftRight, Dumbbell, Check } from 'lucide-angular';
import { environment } from '../../../../environments/environment';

const API_URL = environment.apiUrl;

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

type CondicionKey = 'ninguna' | 'diabetes' | 'hipertension' | 'asma';

@Component({
  selector: 'app-editar-perfil',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="p-4 lg:p-8 max-w-5xl mx-auto space-y-5 lg:space-y-6">

      <!-- Encabezado -->
      <div class="animate-fade-in-up">
        <a routerLink="/cliente/perfil" class="inline-flex items-center gap-1 text-sm font-medium text-teal-mid hover:text-teal-deep">
          <lucide-angular [img]="ChevronLeftIcon" [size]="16" />
          Volver a mi perfil
        </a>
        <h1 class="mt-2 text-3xl lg:text-4xl font-extrabold text-teal-deep">Editar perfil</h1>
        <p class="mt-1 text-ink-soft">Con estos datos calculamos tu meta diaria y armamos tu menú.</p>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-4 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
            <p class="text-sm text-ink-soft">Cargando datos...</p>
          </div>
        </div>
      }

      @if (!loading()) {
        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">{{ error() }}</div>
        }

        <!-- Tus medidas -->
        <section class="bg-white rounded-3xl border border-green-cream p-6 lg:p-8 animate-fade-in-up">
          <h2 class="text-xl font-extrabold text-teal-deep">Tus medidas</h2>
          <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label for="peso" class="block text-sm font-medium text-ink mb-2">Peso</label>
              <div class="relative">
                <input id="peso" type="number" [(ngModel)]="weight" name="weight" min="25" max="350" step="0.1"
                  class="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-green-cream bg-cream text-ink focus:outline-none focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid transition-all" />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none">kg</span>
              </div>
            </div>
            <div>
              <label for="estatura" class="block text-sm font-medium text-ink mb-2">Estatura</label>
              <div class="relative">
                <input id="estatura" type="number" [(ngModel)]="height" name="height" min="60" max="250"
                  class="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-green-cream bg-cream text-ink focus:outline-none focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid transition-all" />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none">cm</span>
              </div>
            </div>
            <div class="rounded-2xl bg-cream-2 px-5 py-3.5 flex items-center gap-3 h-[52px]">
              <span class="text-sm text-ink-soft">IMC estimado</span>
              <span class="text-xl font-extrabold text-teal-deep">{{ imcEstimado() ?? '—' }}</span>
            </div>
          </div>
        </section>

        <!-- Objetivo -->
        <section class="bg-white rounded-3xl border border-green-cream p-6 lg:p-8 animate-fade-in-up">
          <h2 class="text-xl font-extrabold text-teal-deep">¿Cuál es tu objetivo?</h2>
          <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (o of objetivos; track o.value) {
              <button type="button" (click)="goal = o.value"
                class="relative text-left rounded-2xl border-2 p-5 transition-colors cursor-pointer"
                [ngClass]="goal === o.value ? 'border-teal-mid bg-teal-mid/5' : 'border-green-cream bg-white hover:bg-cream'">
                @if (goal === o.value) {
                  <span class="absolute top-4 right-4 w-7 h-7 rounded-full bg-teal-mid text-white flex items-center justify-center">
                    <lucide-angular [img]="CheckIcon" [size]="14" />
                  </span>
                }
                <span class="w-11 h-11 rounded-xl flex items-center justify-center text-teal-mid"
                      [ngClass]="goal === o.value ? 'bg-white' : 'bg-cream-2'">
                  <lucide-angular [img]="o.icon" [size]="20" />
                </span>
                <span class="block mt-4 text-lg font-extrabold text-teal-deep">{{ o.label }}</span>
                <span class="block mt-1 text-sm text-ink-soft">{{ o.desc }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Actividad -->
        <section class="bg-white rounded-3xl border border-green-cream p-6 lg:p-8 animate-fade-in-up">
          <h2 class="text-xl font-extrabold text-teal-deep">¿Qué tan activo eres?</h2>
          <div class="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            @for (a of niveles; track a.value; let i = $index) {
              <button type="button" (click)="activityLevel = a.value"
                class="text-left rounded-2xl border-2 p-4 transition-colors cursor-pointer"
                [ngClass]="activityLevel === a.value ? 'border-teal-mid bg-teal-mid/5' : 'border-green-cream bg-white hover:bg-cream'">
                <!-- Barras de intensidad -->
                <span class="flex items-end gap-1 h-5" aria-hidden="true">
                  @for (n of [1, 2, 3, 4]; track n) {
                    <span class="w-1.5 rounded-full"
                          [style.height.px]="8 + n * 4"
                          [ngClass]="n <= i + 1 ? 'bg-teal-mid' : 'bg-green-cream'"></span>
                  }
                </span>
                <span class="block mt-3 font-extrabold text-teal-deep">{{ a.value }}</span>
                <span class="block mt-0.5 text-sm text-ink-soft">{{ a.desc }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Condiciones médicas -->
        <section class="bg-white rounded-3xl border border-green-cream p-6 lg:p-8 animate-fade-in-up">
          <h2 class="text-xl font-extrabold text-teal-deep">Condiciones médicas</h2>
          <p class="mt-1 text-ink-soft">La IA las tiene en cuenta al armar tu menú. Marca todas las que apliquen.</p>
          <div class="mt-4 flex flex-wrap gap-3">
            @for (c of opcionesCondicion; track c.key) {
              <button type="button" (click)="toggleCondicion(c.key)"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-medium transition-colors cursor-pointer"
                [ngClass]="conditions[c.key]
                  ? 'bg-teal-mid border-teal-mid text-white'
                  : 'bg-white border-green-cream text-ink hover:bg-cream-2'">
                @if (conditions[c.key]) { <lucide-angular [img]="CheckIcon" [size]="16" /> }
                {{ c.label }}
              </button>
            }
          </div>

          <div class="mt-5 max-w-xl">
            <label for="otra" class="block text-sm font-medium text-ink mb-2">
              Otra condición <span class="font-normal text-ink-soft">(opcional)</span>
            </label>
            <input id="otra" type="text" [ngModel]="otraCondicion" (ngModelChange)="onOtraCondicion($event)" name="otra" maxlength="120"
              placeholder="Ej. intolerancia a la lactosa"
              class="w-full px-4 py-3.5 rounded-2xl border border-green-cream bg-cream text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid transition-all" />
          </div>
        </section>

        <!-- Acciones -->
        <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <p class="text-sm text-ink-soft">Al guardar, recalculamos tu meta diaria de calorías y macros.</p>
          <div class="flex items-center gap-3">
            <a routerLink="/cliente/perfil"
               class="flex-1 sm:flex-none text-center px-6 py-3.5 rounded-2xl bg-white border border-green-cream text-ink font-semibold hover:bg-cream-2 transition-colors">
              Cancelar
            </a>
            <button (click)="save()" [disabled]="saving() || loading()"
              class="flex-1 sm:flex-none px-7 py-3.5 rounded-2xl bg-teal-mid text-white font-bold shadow-lg shadow-teal-mid/25 hover:bg-teal-deep disabled:opacity-50 transition-colors cursor-pointer">
              {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
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

  readonly ChevronLeftIcon = ChevronLeft;
  readonly CheckIcon = Check;

  readonly objetivos = [
    { value: 'Perder peso', label: 'Perder peso', icon: TrendingDown, desc: 'Un déficit calórico suave, sin dietas extremas.' },
    { value: 'Mantener peso', label: 'Mantener peso', icon: ArrowLeftRight, desc: 'Comer equilibrado y sostener lo que ya lograste.' },
    { value: 'Ganar masa', label: 'Ganar masa muscular', icon: Dumbbell, desc: 'Más proteína y calorías para acompañar tu entreno.' },
  ];

  readonly niveles = [
    { value: 'Sedentario', desc: 'Poco o nada de ejercicio' },
    { value: 'Ligero', desc: '1–3 días por semana' },
    { value: 'Moderado', desc: '3–5 días por semana' },
    { value: 'Intenso', desc: '6–7 días por semana' },
  ];

  readonly opcionesCondicion: { key: CondicionKey; label: string }[] = [
    { key: 'ninguna', label: 'Ninguna' },
    { key: 'diabetes', label: 'Diabetes' },
    { key: 'hipertension', label: 'Hipertensión' },
    { key: 'asma', label: 'Asma' },
  ];

  weight = 0;
  height = 0;
  activityLevel = 'Moderado';
  goal = 'Mantener peso';
  otraCondicion = '';
  conditions: Record<CondicionKey, boolean> = {
    ninguna: false,
    diabetes: false,
    hipertension: false,
    asma: false,
  };

  ngOnInit(): void {
    this.http.get<PerfilResponse>(`${API_URL}/clientes/perfil`).subscribe({
      next: (data) => {
        this.weight = data.weight;
        this.height = data.height;
        // "Muy intenso" ya no es una opción: se muestra como "Intenso"
        this.activityLevel = data.activity_level === 'Muy intenso' ? 'Intenso' : data.activity_level;
        this.goal = data.goal;
        this.prefillConditions(data.medical_conditions ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el perfil. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  imcEstimado(): string | null {
    if (!this.weight || !this.height || this.height < 60) return null;
    return (this.weight / Math.pow(this.height / 100, 2)).toFixed(1);
  }

  toggleCondicion(key: CondicionKey): void {
    if (key === 'ninguna') {
      // "Ninguna" excluye a las demás
      this.conditions = { ninguna: !this.conditions.ninguna, diabetes: false, hipertension: false, asma: false };
      if (this.conditions.ninguna) this.otraCondicion = '';
      return;
    }
    this.conditions[key] = !this.conditions[key];
    if (this.conditions[key]) this.conditions.ninguna = false;
  }

  onOtraCondicion(valor: string): void {
    this.otraCondicion = valor;
    if (valor.trim()) this.conditions.ninguna = false;
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
    const sinTildes = (c: string) => c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const conocidas = ['ninguna', 'diabetes', 'hipertension', 'asma'];
    const normalizadas = apiConditions.map(sinTildes);

    this.conditions = {
      ninguna: apiConditions.length === 0 || normalizadas.includes('ninguna'),
      diabetes: normalizadas.includes('diabetes'),
      hipertension: normalizadas.includes('hipertension'),
      asma: normalizadas.includes('asma'),
    };
    // Las condiciones que no están entre las opciones van al campo "Otra condición"
    this.otraCondicion = apiConditions.filter(c => !conocidas.includes(sinTildes(c))).join(', ');
    if (this.otraCondicion) this.conditions.ninguna = false;
  }

  private buildConditionsArray(): string[] {
    if (this.conditions.ninguna) return [];
    const result: string[] = [];
    if (this.conditions.diabetes) result.push('Diabetes');
    if (this.conditions.hipertension) result.push('Hipertensión');
    if (this.conditions.asma) result.push('Asma');
    const otra = this.otraCondicion.trim();
    if (otra) result.push(otra);
    return result;
  }
}
