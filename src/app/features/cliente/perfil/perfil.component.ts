import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Activity, Target, Pencil, LogOut } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const API_URL = environment.apiUrl;

interface PerfilResponse {
  id: number;
  first_name: string;
  last_name_paternal: string;
  last_name_maternal: string;
  email: string;
  birth_date: string;
  weight: number;
  height: number;
  gender: string;
  activity_level: string;
  goal: string;
  workout_type: string;
  session_duration: number;
  medical_conditions: string[];
  profile_picture_url: string | null;
  is_profile_complete: boolean;
  meal_reminder_time: string;
  created_at?: string | null;
}

interface MetaDiaria {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

interface TramoIMC {
  label: string;
  desde: number;
  hasta: number;
  color: string;
}

/** Escala visual del IMC: de 15 a 40 kg/m². */
const IMC_MIN = 15;
const IMC_MAX = 40;
const TRAMOS_IMC: TramoIMC[] = [
  { label: 'Bajo', desde: IMC_MIN, hasta: 18.5, color: 'bg-cream-2' },
  { label: 'Saludable', desde: 18.5, hasta: 25, color: 'bg-green-pale' },
  { label: 'Sobrepeso', desde: 25, hasta: 30, color: 'bg-amber-100' },
  { label: 'Obesidad', desde: 30, hasta: IMC_MAX, color: 'bg-red-100' },
];

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="p-4 lg:p-8 max-w-7xl mx-auto space-y-5 lg:space-y-6">

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-4 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
            <p class="text-sm text-ink-soft">Cargando perfil...</p>
          </div>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {{ error() }}
        </div>
      }

      @if (perfil(); as p) {
        <!-- Cabecera -->
        <section class="relative overflow-hidden bg-white rounded-3xl border border-green-cream p-6 lg:p-8 animate-fade-in-up">
          <div class="absolute -top-24 -right-20 w-[260px] h-[260px] lg:w-[360px] lg:h-[360px] rounded-full border-[14px] lg:border-[18px] border-cyan-ring/20 pointer-events-none" aria-hidden="true"></div>

          <div class="relative flex flex-col items-center text-center lg:flex-row lg:text-left gap-4 lg:gap-6">
            <div class="w-24 h-24 lg:w-32 lg:h-32 shrink-0 rounded-full bg-green-pale text-teal-deep flex items-center justify-center text-3xl lg:text-5xl font-extrabold">
              {{ initials() }}
            </div>

            <div class="min-w-0">
              <h1 class="text-2xl lg:text-4xl font-extrabold text-teal-deep">{{ fullName() }}</h1>
              <p class="text-ink-soft mt-1 lg:text-lg">
                {{ p.email }}<span class="lg:hidden"> · {{ edad() }} años</span>
              </p>
              <div class="hidden lg:flex flex-wrap gap-2 mt-3">
                <span class="px-3 py-1 rounded-full bg-cream-2 text-ink text-sm">{{ edad() }} años</span>
                <span class="px-3 py-1 rounded-full bg-cream-2 text-ink text-sm">{{ generoTexto(p.gender) }}</span>
                @if (enCalofitDesde(); as desde) {
                  <span class="px-3 py-1 rounded-full bg-cream-2 text-ink text-sm">En Calofit desde {{ desde }}</span>
                }
              </div>
            </div>

            <a routerLink="/cliente/editar-perfil"
               class="lg:ml-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-mid text-white font-bold rounded-2xl shadow-lg shadow-teal-mid/25 hover:bg-teal-deep transition-colors">
              <lucide-angular [img]="PencilIcon" [size]="16" />
              Editar perfil
            </a>
          </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-start">
          <!-- Columna principal -->
          <div class="lg:col-span-2 space-y-5 lg:space-y-6">

            <!-- Medidas (escritorio) -->
            <section class="hidden lg:block bg-white rounded-3xl border border-green-cream p-6 lg:p-8">
              <h2 class="text-xl font-extrabold text-teal-deep">Tus medidas</h2>
              <div class="mt-5 grid grid-cols-3 gap-4">
                <div class="rounded-2xl bg-cream border border-green-cream px-5 py-4">
                  <p class="text-sm text-ink-soft">Peso</p>
                  <p class="text-3xl font-extrabold text-teal-deep">{{ p.weight }} <span class="text-base font-bold">kg</span></p>
                </div>
                <div class="rounded-2xl bg-cream border border-green-cream px-5 py-4">
                  <p class="text-sm text-ink-soft">Estatura</p>
                  <p class="text-3xl font-extrabold text-teal-deep">{{ p.height }} <span class="text-base font-bold">cm</span></p>
                </div>
                <div class="rounded-2xl bg-cream border border-green-cream px-5 py-4">
                  <p class="text-sm text-ink-soft">Edad</p>
                  <p class="text-3xl font-extrabold text-teal-deep">{{ edad() }} <span class="text-base font-bold">años</span></p>
                </div>
              </div>
            </section>

            <!-- Medidas (móvil) -->
            <div class="lg:hidden grid grid-cols-3 gap-3">
              <div class="rounded-2xl bg-white border border-green-cream px-4 py-3">
                <p class="text-xs text-ink-soft">Peso</p>
                <p class="text-xl font-extrabold text-teal-deep">{{ p.weight }} <span class="text-xs font-bold">kg</span></p>
              </div>
              <div class="rounded-2xl bg-white border border-green-cream px-4 py-3">
                <p class="text-xs text-ink-soft">Estatura</p>
                <p class="text-xl font-extrabold text-teal-deep">{{ p.height }} <span class="text-xs font-bold">cm</span></p>
              </div>
              <div class="rounded-2xl bg-white border border-green-cream px-4 py-3">
                <p class="text-xs text-ink-soft">Género</p>
                <p class="text-xl font-extrabold text-teal-deep">{{ generoCorto(p.gender) }}</p>
              </div>
            </div>

            <!-- Objetivo y actividad -->
            <section class="bg-white rounded-3xl border border-green-cream p-5 lg:p-8">
              <h2 class="text-lg lg:text-xl font-extrabold text-teal-deep">Tu objetivo</h2>
              <div class="mt-4 lg:mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                <div class="flex items-center gap-4 rounded-2xl bg-teal-mid/10 px-4 py-4">
                  <div class="w-11 h-11 shrink-0 rounded-xl bg-white text-teal-mid flex items-center justify-center">
                    <lucide-angular [img]="TargetIcon" [size]="22" />
                  </div>
                  <div>
                    <p class="hidden lg:block text-sm text-ink-soft">Objetivo</p>
                    <p class="text-lg font-extrabold text-teal-deep leading-tight">{{ p.goal }}</p>
                    <p class="text-sm text-ink-soft">{{ goalDescripcion(p.goal) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 rounded-2xl bg-cream-2 px-4 py-4">
                  <div class="w-11 h-11 shrink-0 rounded-xl bg-white text-teal-mid flex items-center justify-center">
                    <lucide-angular [img]="ActivityIcon" [size]="22" />
                  </div>
                  <div>
                    <p class="hidden lg:block text-sm text-ink-soft">Nivel de actividad</p>
                    <p class="text-lg font-extrabold text-teal-deep leading-tight">
                      <span class="lg:hidden">{{ actividadMovil(p.activity_level) }}</span>
                      <span class="hidden lg:inline">{{ p.activity_level }}</span>
                    </p>
                    <p class="text-sm text-ink-soft">{{ actividadDescripcion(p.activity_level) }}</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Meta diaria -->
            @if (meta(); as m) {
              <section class="bg-white rounded-3xl border border-green-cream p-5 lg:p-8">
                <!-- Móvil -->
                <div class="lg:hidden">
                  <div class="flex items-baseline justify-between">
                    <h2 class="text-lg font-extrabold text-teal-deep">Tu meta diaria</h2>
                    <p class="text-2xl font-extrabold text-teal-deep">{{ m.calorias | number:'1.0-0' }} <span class="text-sm font-bold">kcal</span></p>
                  </div>
                  <div class="mt-4 grid grid-cols-3 gap-2">
                    <div class="rounded-xl bg-cream px-3 py-2.5">
                      <p class="flex items-center gap-1.5 text-xs text-ink-soft"><span class="w-2 h-2 rounded-sm bg-teal-mid"></span>Proteínas</p>
                      <p class="font-extrabold text-ink">{{ m.proteinas | number:'1.0-0' }} g</p>
                    </div>
                    <div class="rounded-xl bg-cream px-3 py-2.5">
                      <p class="flex items-center gap-1.5 text-xs text-ink-soft"><span class="w-2 h-2 rounded-sm bg-amber-500"></span>Carbos</p>
                      <p class="font-extrabold text-ink">{{ m.carbohidratos | number:'1.0-0' }} g</p>
                    </div>
                    <div class="rounded-xl bg-cream px-3 py-2.5">
                      <p class="flex items-center gap-1.5 text-xs text-ink-soft"><span class="w-2 h-2 rounded-sm bg-purple-500"></span>Grasas</p>
                      <p class="font-extrabold text-ink">{{ m.grasas | number:'1.0-0' }} g</p>
                    </div>
                  </div>
                </div>

                <!-- Escritorio -->
                <div class="hidden lg:grid grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 class="text-xl font-extrabold text-teal-deep">Tu meta diaria</h2>
                    <p class="mt-3 text-5xl font-extrabold text-teal-deep">{{ m.calorias | number:'1.0-0' }} <span class="text-lg font-bold">kcal</span></p>
                    <p class="mt-2 text-sm text-ink-soft">Calculada con tus medidas, tu actividad y tu objetivo. Se actualiza si editas tu perfil.</p>
                  </div>
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between rounded-xl bg-cream px-4 py-3">
                      <span class="flex items-center gap-3 text-ink"><span class="w-3 h-3 rounded-sm bg-teal-mid"></span>Proteínas</span>
                      <span class="font-bold text-ink">{{ m.proteinas | number:'1.0-0' }} g</span>
                    </div>
                    <div class="flex items-center justify-between rounded-xl bg-cream px-4 py-3">
                      <span class="flex items-center gap-3 text-ink"><span class="w-3 h-3 rounded-sm bg-amber-500"></span>Carbohidratos</span>
                      <span class="font-bold text-ink">{{ m.carbohidratos | number:'1.0-0' }} g</span>
                    </div>
                    <div class="flex items-center justify-between rounded-xl bg-cream px-4 py-3">
                      <span class="flex items-center gap-3 text-ink"><span class="w-3 h-3 rounded-sm bg-purple-500"></span>Grasas</span>
                      <span class="font-bold text-ink">{{ m.grasas | number:'1.0-0' }} g</span>
                    </div>
                  </div>
                </div>
              </section>
            }
          </div>

          <!-- Columna lateral -->
          <div class="space-y-5 lg:space-y-6">

            <!-- IMC -->
            <section class="bg-white rounded-3xl border border-green-cream p-5 lg:p-7">
              <div class="flex items-baseline justify-between lg:block">
                <h2 class="text-lg lg:text-xl font-extrabold text-teal-deep">
                  <span class="lg:hidden">Tu IMC</span><span class="hidden lg:inline">Índice de masa corporal</span>
                </h2>
                <p class="text-2xl lg:text-5xl font-extrabold text-teal-deep lg:mt-2">
                  {{ imc() | number:'1.1-1' }}<span class="hidden lg:inline text-base font-bold ml-2">kg/m²</span>
                </p>
              </div>

              @if (imc() > 0) {
                <!-- Escala -->
                <div class="mt-5 relative">
                  <div class="absolute -top-3 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-ink"
                       [style.left.%]="posicionIMC()"></div>
                  <div class="flex gap-1">
                    @for (t of tramosIMC; track t.label) {
                      <div class="h-2.5 rounded-full" [ngClass]="t.color" [style.width.%]="anchoTramo(t)"></div>
                    }
                  </div>
                  <div class="flex gap-1 mt-1.5">
                    @for (t of tramosIMC; track t.label) {
                      <span class="text-[11px] text-ink-soft truncate" [style.width.%]="anchoTramo(t)">{{ t.label }}</span>
                    }
                  </div>
                </div>

                <p class="mt-4 text-sm text-ink leading-relaxed">
                  Estás en el rango de <span class="font-bold">{{ rangoIMC() }}</span>. El IMC es solo una referencia: no distingue músculo de grasa. Tu menú y tu meta ya están pensados para tu objetivo.
                </p>
                <p class="hidden lg:block mt-3 text-xs text-ink-soft">Si tienes dudas sobre tu salud, un profesional puede orientarte.</p>
              } @else {
                <p class="mt-4 text-sm text-ink-soft">No hay datos suficientes para calcular el IMC.</p>
              }
            </section>

            <!-- Condiciones médicas -->
            <section class="bg-white rounded-3xl border border-green-cream p-5 lg:p-7">
              <h2 class="text-lg lg:text-xl font-extrabold text-teal-deep">Condiciones médicas</h2>
              @if (condiciones().length) {
                <div class="mt-3 flex flex-wrap gap-2">
                  @for (c of condiciones(); track c) {
                    <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">{{ c }}</span>
                  }
                </div>
              } @else {
                <p class="mt-3 text-ink-soft">
                  <span class="lg:hidden">No registraste ninguna.</span>
                  <span class="hidden lg:inline">No registraste ninguna. Si tienes alguna, agrégala para que la IA la tome en cuenta en tu menú.</span>
                </p>
              }
              <a routerLink="/cliente/editar-perfil" class="mt-3 inline-block font-semibold text-teal-mid hover:text-teal-deep">
                {{ condiciones().length ? 'Editar condiciones' : 'Agregar una condición' }}
              </a>
            </section>

            <!-- Datos de la cuenta -->
            <section class="bg-white rounded-3xl border border-green-cream p-5 lg:p-7">
              <h2 class="text-lg lg:text-xl font-extrabold text-teal-deep">Datos de la cuenta</h2>

              <!-- Móvil -->
              <dl class="lg:hidden mt-3 space-y-2">
                <div class="flex items-center justify-between">
                  <dt class="text-ink-soft">Nacimiento</dt>
                  <dd class="font-semibold text-ink">{{ formatBirthDateCorta(p.birth_date) }}</dd>
                </div>
                @if (enCalofitDesde(); as desde) {
                  <div class="flex items-center justify-between">
                    <dt class="text-ink-soft">En Calofit desde</dt>
                    <dd class="font-semibold text-ink">{{ desde }}</dd>
                  </div>
                }
              </dl>

              <!-- Escritorio -->
              <dl class="hidden lg:block mt-4 space-y-4">
                <div>
                  <dt class="text-sm text-ink-soft">Fecha de nacimiento</dt>
                  <dd class="text-lg font-bold text-ink">{{ formatBirthDate(p.birth_date) }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-ink-soft">Correo</dt>
                  <dd class="text-lg font-bold text-ink break-all">{{ p.email }}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        <!-- Cerrar sesión (solo móvil: en escritorio está en el menú lateral) -->
        <button (click)="logout()"
          class="lg:hidden w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-green-cream text-ink font-semibold hover:bg-cream-2 transition-colors cursor-pointer">
          <lucide-angular [img]="LogOutIcon" [size]="18" />
          Cerrar sesión
        </button>
      }
    </div>
  `,
})
export class PerfilComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly perfil = signal<PerfilResponse | null>(null);
  readonly meta = signal<MetaDiaria | null>(null);

  readonly ActivityIcon = Activity;
  readonly TargetIcon = Target;
  readonly PencilIcon = Pencil;
  readonly LogOutIcon = LogOut;
  readonly tramosIMC = TRAMOS_IMC;

  readonly condiciones = computed(() =>
    (this.perfil()?.medical_conditions ?? []).filter(c => c && c.trim().toLowerCase() !== 'ninguna'),
  );

  readonly edad = computed(() => {
    const p = this.perfil();
    return p?.birth_date ? this.calcularEdad(p.birth_date) : 0;
  });

  readonly imc = computed(() => {
    const p = this.perfil();
    return p ? this.calcularIMC(p.weight, p.height) : 0;
  });

  readonly enCalofitDesde = computed(() => {
    const creado = this.perfil()?.created_at;
    if (!creado) return '';
    const fecha = new Date(creado);
    if (isNaN(fecha.getTime())) return '';
    const mes = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(fecha);
    return `${mes} ${fecha.getFullYear()}`;
  });

  ngOnInit(): void {
    this.http.get<PerfilResponse>(`${API_URL}/clientes/perfil`).subscribe({
      next: (data) => {
        this.perfil.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el perfil. Intenta de nuevo.');
        this.loading.set(false);
      },
    });

    // Meta diaria (kcal y macros) que calcula el backend
    this.http.get<any>(`${API_URL}/balance/hoy`).subscribe({
      next: (res) => {
        const r = res?.resumen;
        if (r?.objetivo_diario) {
          this.meta.set({
            calorias: r.objetivo_diario,
            proteinas: r.proteinas_objetivo,
            carbohidratos: r.carbohidratos_objetivo,
            grasas: r.grasas_objetivo,
          });
        }
      },
      error: () => this.meta.set(null),
    });
  }

  logout(): void {
    this.auth.logout();
  }

  fullName(): string {
    const p = this.perfil();
    if (!p) return '';
    return `${p.first_name} ${p.last_name_paternal} ${p.last_name_maternal}`.trim();
  }

  initials(): string {
    const p = this.perfil();
    if (!p) return '?';
    return ((p.first_name?.[0] ?? '') + (p.last_name_paternal?.[0] ?? '')).toUpperCase() || '?';
  }

  formatBirthDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatBirthDateCorta(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  calcularEdad(dateStr: string): number {
    const hoy = new Date();
    const nac = new Date(dateStr + 'T00:00:00');
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  generoTexto(g: string): string {
    return g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : g;
  }

  generoCorto(g: string): string {
    return g === 'M' ? 'Masc.' : g === 'F' ? 'Fem.' : g;
  }

  calcularIMC(peso: number, altura: number): number {
    if (!altura || !peso) return 0;
    const alturaM = altura / 100;
    return Math.round((peso / (alturaM * alturaM)) * 100) / 100;
  }

  // ---- escala del IMC ----

  anchoTramo(t: TramoIMC): number {
    return ((t.hasta - t.desde) / (IMC_MAX - IMC_MIN)) * 100;
  }

  posicionIMC(): number {
    const pos = ((this.imc() - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100;
    return Math.min(100, Math.max(0, pos));
  }

  rangoIMC(): string {
    const imc = this.imc();
    if (imc < 18.5) return 'menos de 18.5';
    if (imc < 25) return '18.5 a 24.9';
    if (imc < 30) return '25 a 29.9';
    return '30 o más';
  }

  // ---- textos de objetivo y actividad ----

  actividadDescripcion(nivel: string): string {
    const map: Record<string, string> = {
      'Sedentario': 'Poca o ninguna actividad',
      'Ligero': 'Ejercicio 1–3 días por semana',
      'Moderado': 'Ejercicio 3–5 días por semana',
      'Intenso': 'Ejercicio 6–7 días por semana',
      'Muy intenso': 'Ejercicio diario intenso',
    };
    return map[nivel] ?? nivel;
  }

  /** "Moderado" → "Actividad moderada" (título de la tarjeta en móvil). */
  actividadMovil(nivel: string): string {
    const map: Record<string, string> = {
      'Sedentario': 'Actividad sedentaria',
      'Ligero': 'Actividad ligera',
      'Moderado': 'Actividad moderada',
      'Intenso': 'Actividad intensa',
      'Muy intenso': 'Actividad muy intensa',
    };
    return map[nivel] ?? nivel;
  }

  goalDescripcion(goal: string): string {
    const map: Record<string, string> = {
      'Perder peso': 'Con un déficit calórico suave',
      'Mantener peso': 'Con calorías de mantenimiento',
      'Ganar masa': 'Con un superávit calórico suave',
    };
    return map[goal] ?? goal;
  }
}
