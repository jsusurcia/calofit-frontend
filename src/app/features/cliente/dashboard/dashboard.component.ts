import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, RefreshCcw, Calendar, Bell, Check, Sunrise, Apple, Soup, Moon, Sparkles, Target, Activity } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { textoParaRegistro } from '../../../core/utils/texto-registro';

interface PlanSemanal {
  plan_id: number | null;
  objetivo: string;
  dias: DiaPlan[];
}

interface DiaPlan {
  dia_numero: number;
  comidas: Record<string, string>;
}

interface BalanceDia {
  fecha: string;
  resumen: { calorias_consumidas: number; objetivo_diario: number };
  comidas_registradas: { id: number; momento: string | null }[];
}

interface PerfilResumen {
  goal: string;
  activity_level: string;
  medical_conditions: string[];
}

interface MealConfig {
  key: string;
  label: string;
  icon: any;
  box: string;
  /** Momento que se envía al backend (log-inteligente) y se guarda en comida_registros. */
  momento: string;
}

const NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const NOMBRES_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

@Component({
  selector: 'app-cliente-dashboard',
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule],
  template: `
    <div class="p-4 lg:p-8 max-w-7xl mx-auto space-y-5 lg:space-y-6">
      <!-- Header (el título en móvil lo muestra el layout) -->
      <div class="flex items-start justify-between gap-4 animate-fade-in-up">
        <div class="hidden lg:block">
          <h1 class="text-3xl font-extrabold text-teal-deep">Mi menú semanal</h1>
          @if (data()?.objetivo; as objetivo) {
            <p class="text-sm text-ink-soft mt-1">
              Armado por la IA para tu objetivo: <span class="font-bold text-ink">{{ objetivo.toLowerCase() }}</span>, a tu ritmo.
            </p>
          } @else if (data() && !data()!.plan_id) {
            <p class="text-sm text-ink-soft mt-1">Bienvenido a Calofit, {{ firstName() }}. Empecemos por tu primera semana.</p>
          }
        </div>

        @if (data()?.plan_id && (hasReminderTime() || reminderSaved())) {
          <!-- Recordatorio (compacto, solo escritorio) -->
          <div class="hidden lg:flex items-center gap-3 bg-white border border-green-cream rounded-2xl px-4 py-3 shrink-0">
            <div class="w-11 h-11 rounded-xl bg-cyan-ring/20 text-teal-mid flex items-center justify-center">
              <lucide-angular [img]="BellIcon" [size]="20" />
            </div>
            @if (editingReminder()) {
              <input type="time" [(ngModel)]="reminderTimeInput"
                class="px-3 py-2 border border-green-cream rounded-xl text-sm text-ink bg-cream focus:outline-none focus:border-teal-mid">
              <button (click)="saveReminderTime()" [disabled]="savingReminder()"
                class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-mid hover:bg-teal-deep disabled:opacity-50 cursor-pointer">
                {{ savingReminder() ? 'Guardando...' : 'Guardar' }}
              </button>
              <button (click)="editingReminder.set(false)" class="text-sm font-medium text-ink-soft hover:text-teal-deep cursor-pointer">Cancelar</button>
            } @else {
              <div>
                <p class="text-xs text-ink-soft">Te recordamos registrar a las</p>
                <p class="text-base font-bold text-ink">{{ formatReminder(auth.currentUser()?.meal_reminder_time || reminderTimeInput()) }}</p>
              </div>
              <button (click)="startEditReminder()" class="ml-4 text-sm font-semibold text-teal-mid hover:text-teal-deep cursor-pointer">Cambiar</button>
            }
          </div>
        }
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-4 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
            <p class="text-sm text-ink-soft">Cargando tu menú...</p>
          </div>
        </div>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {{ error() }}
        </div>
      }

      @if (data(); as plan) {
        @if (plan.plan_id) {
          <!-- Banner de Recordatorio (primera vez) -->
          @if (!hasReminderTime() && !reminderSaved()) {
            <div class="bg-cyan-ring/10 border border-cyan-ring/40 rounded-2xl p-5 animate-fade-in-up flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="w-11 h-11 shrink-0 rounded-xl bg-cyan-ring/25 text-teal-mid flex items-center justify-center">
                  <lucide-angular [img]="BellIcon" [size]="20" />
                </div>
                <div>
                  <h3 class="text-teal-deep font-bold text-sm md:text-base">¡Acelera tus resultados!</h3>
                  <p class="text-ink-soft text-xs md:text-sm">Configura a qué hora quieres que te recordemos registrar tus comidas diarias. Así la IA calculará tus macros automáticamente.</p>
                </div>
              </div>
              <div class="flex items-center gap-2 w-full md:w-auto">
                <input type="time" [(ngModel)]="reminderTimeInput"
                  class="px-3 py-2 border border-green-cream rounded-xl text-sm text-ink bg-white focus:outline-none focus:border-teal-mid w-full md:w-auto">
                <button (click)="saveReminderTime()" [disabled]="savingReminder()"
                  class="bg-teal-mid hover:bg-teal-deep text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50">
                  @if (savingReminder()) {
                    <lucide-angular [img]="RefreshIcon" [size]="16" class="animate-spin" />
                  } @else {
                    Guardar
                  }
                </button>
              </div>
            </div>
          }

          <!-- Selector de días -->
          <div class="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-7 scrollbar-hide animate-fade-in-up">
            @for (dia of plan.dias; track dia.dia_numero) {
              <button
                (click)="seleccionarDia(dia.dia_numero)"
                class="shrink-0 min-w-[76px] lg:min-w-0 flex flex-col items-center justify-center gap-0.5 py-3 rounded-2xl border transition-all cursor-pointer"
                [ngClass]="diaSeleccionado() === dia.dia_numero
                  ? 'bg-teal-mid border-teal-mid text-white shadow-md shadow-teal-mid/20'
                  : 'bg-white border-green-cream text-ink hover:bg-cream-2'">
                <span class="text-sm font-medium" [ngClass]="diaSeleccionado() === dia.dia_numero ? 'text-white/90' : 'text-ink-soft'">
                  {{ nombreCorto(dia.dia_numero) }}
                </span>
                <span class="text-2xl font-extrabold leading-none">{{ fechaDia(dia.dia_numero).getDate() }}</span>
                @if (esHoy(dia.dia_numero)) {
                  <span class="text-[10px] font-bold tracking-wider" [ngClass]="diaSeleccionado() === dia.dia_numero ? 'text-white/90' : 'text-teal-mid'">HOY</span>
                }
              </button>
            }
          </div>

          @if (diaActual(); as diaInfo) {
            <!-- Resumen del día -->
            <div class="bg-white rounded-2xl border border-green-cream p-5 lg:px-7 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 items-center animate-fade-in-up">
              <div>
                <h2 class="text-xl font-extrabold text-teal-deep">{{ tituloDia() }}</h2>
                <p class="text-sm text-ink-soft mt-1">
                  @if (balance(); as b) {
                    ≈ {{ b.resumen.calorias_consumidas | number:'1.0-0' }} kcal consumidas · tu meta es {{ b.resumen.objetivo_diario | number:'1.0-0' }} kcal
                  } @else {
                    — kcal consumidas
                  }
                </p>
              </div>
              <div>
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="font-semibold text-ink">{{ esHoy(diaInfo.dia_numero) ? 'Comidas de hoy' : 'Comidas del día' }}</span>
                  <span class="text-ink-soft">{{ registradasCount() }} de {{ comidasVisibles().length }} registradas</span>
                </div>
                <div class="h-2.5 rounded-full bg-green-cream overflow-hidden">
                  <div class="h-full rounded-full bg-green-leaf transition-all duration-500" [style.width.%]="progresoPct()"></div>
                </div>
              </div>
            </div>

            <!-- Comidas del día -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-in-up">
              @for (meal of comidasVisibles(); track meal.key) {
                <div class="bg-white rounded-2xl p-5 border border-green-cream relative overflow-hidden flex flex-col">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" [ngClass]="meal.box">
                      <lucide-angular [img]="meal.icon" [size]="22" />
                    </div>
                    <h3 class="text-lg font-extrabold text-teal-deep">{{ meal.label }}</h3>
                  </div>

                  <p class="text-ink leading-relaxed flex-1">{{ diaInfo.comidas[meal.key] }}</p>

                  <div class="mt-4 pt-4 border-t border-green-cream flex items-center gap-3">
                    @if (estaRegistrada(meal)) {
                      <span class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-green-pale text-teal-deep text-sm font-semibold">
                        <lucide-angular [img]="CheckIcon" [size]="16" /> Registrado
                      </span>
                    } @else if (esHoy(diaInfo.dia_numero)) {
                      <button
                        (click)="registrarComida(meal, diaInfo.comidas[meal.key])"
                        [disabled]="registrando() !== null"
                        class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-[1.5px] border-teal-mid text-teal-mid text-sm font-semibold hover:bg-teal-mid hover:text-white disabled:opacity-50 transition-colors cursor-pointer">
                        @if (registrando() === meal.key) {
                          <lucide-angular [img]="RefreshIcon" [size]="16" class="animate-spin" /> Registrando...
                        } @else {
                          <lucide-angular [img]="CheckIcon" [size]="16" /> Lo comí
                        }
                      </button>
                    }
                    <button
                      (click)="hacerSwap(plan.plan_id, diaInfo.dia_numero, meal.key, diaInfo.comidas[meal.key])"
                      [disabled]="swapping() !== null"
                      aria-label="Cambiar plato"
                      class="ml-auto shrink-0 inline-flex items-center justify-center gap-2 w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-xl border border-green-cream sm:border-transparent text-ink-soft hover:text-teal-deep hover:bg-cream-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50">
                      <lucide-angular [img]="RefreshIcon" [size]="16" [class.animate-spin]="swapping() === meal.key" />
                      <span class="hidden sm:inline">Cambiar plato</span>
                    </button>
                  </div>

                  @if (swapping() === meal.key) {
                    <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-2xl">
                      <lucide-angular [img]="RefreshIcon" [size]="24" class="text-teal-mid animate-spin" />
                      <span class="text-sm font-medium text-teal-deep">Buscando alternativa...</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        } @else {
          <!-- Sin Plan: bienvenida -->
          <div class="relative overflow-hidden bg-white rounded-3xl border border-green-cream p-6 md:p-10 animate-fade-in-up">
            <!-- Anillo decorativo -->
            <div class="absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full border-[16px] border-cyan-ring/20 pointer-events-none hidden md:block" aria-hidden="true">
              <span class="absolute left-[8%] top-[78%] w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-cyan-ring bg-white"></span>
            </div>

            <div class="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              <div class="w-32 h-32 md:w-56 md:h-56 shrink-0 rounded-full bg-green-cream flex items-center justify-center mx-auto md:mx-0">
                <img src="/perezoso.png" alt="Calofit" class="w-24 h-24 md:w-44 md:h-44 object-contain" />
              </div>

              <div class="min-w-0">
                <h2 class="text-2xl md:text-4xl font-extrabold text-teal-deep leading-tight">Tu menú de la semana te espera</h2>

                @if (isProfileComplete()) {
                  <p class="mt-3 text-ink-soft md:text-lg md:max-w-xl">
                    La IA arma 4 comidas al día, de lunes a domingo, con platos que puedes encontrar fácil. Lo hará con estos datos de tu perfil:
                  </p>

                  @if (perfil(); as p) {
                    <div class="mt-4 flex flex-wrap gap-2">
                      <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-mid/10 text-teal-deep text-sm font-medium">
                        <lucide-angular [img]="TargetIcon" [size]="16" /> Objetivo: {{ p.goal.toLowerCase() }}
                      </span>
                      <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-mid/10 text-teal-deep text-sm font-medium">
                        <lucide-angular [img]="ActivityIcon" [size]="16" /> {{ actividadLabel(p.activity_level) }}
                      </span>
                      @if (condicionesMedicas(); as condiciones) {
                        <span class="inline-flex items-center px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                          Condiciones médicas: {{ condiciones }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-4 py-2 rounded-full bg-cream-2 text-ink text-sm font-medium">
                          Sin condiciones médicas
                        </span>
                      }
                    </div>
                  }

                  <button (click)="generarPlan()" [disabled]="generatingPlan()"
                    class="mt-6 w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-teal-mid text-white font-bold rounded-2xl shadow-lg shadow-teal-mid/25 hover:bg-teal-deep transition-colors cursor-pointer disabled:opacity-60">
                    @if (generatingPlan()) {
                      <lucide-angular [img]="RefreshIcon" [size]="18" class="animate-spin" />
                      Generando tu menú...
                    } @else {
                      <lucide-angular [img]="SparklesIcon" [size]="18" />
                      Generar mi menú
                    }
                  </button>
                } @else {
                  <p class="mt-3 text-ink-soft md:text-lg md:max-w-xl">
                    Primero cuéntanos sobre ti: con tu objetivo y tu nivel de actividad, la IA arma tu menú de la semana.
                  </p>
                  <a routerLink="/cliente/onboarding"
                    class="mt-6 w-full md:w-auto inline-flex items-center justify-center px-7 py-3.5 bg-teal-mid text-white font-bold rounded-2xl shadow-lg shadow-teal-mid/25 hover:bg-teal-deep transition-colors cursor-pointer">
                    Completar mi perfil
                  </a>
                }
              </div>
            </div>
          </div>

          <!-- Cómo funciona -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
            @for (paso of pasos; track paso.n) {
              <div class="bg-white rounded-2xl border border-green-cream p-6">
                <div class="w-10 h-10 rounded-full bg-teal-mid text-white flex items-center justify-center text-sm font-bold">{{ paso.n }}</div>
                <h3 class="mt-4 text-lg font-extrabold text-teal-deep">{{ paso.titulo }}</h3>
                <p class="mt-2 text-sm text-ink-soft">{{ paso.texto }}</p>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";
    :host { display: block; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ClienteDashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly toastr = inject(ToastrService);
  readonly auth = inject(AuthService);

  readonly RefreshIcon = RefreshCcw;
  readonly CalendarIcon = Calendar;
  readonly BellIcon = Bell;
  readonly CheckIcon = Check;
  readonly SparklesIcon = Sparkles;
  readonly TargetIcon = Target;
  readonly ActivityIcon = Activity;

  readonly pasos = [
    { n: 1, titulo: 'Genera tu menú', texto: 'Si un plato no te convence, cámbialo por otro con un toque.' },
    { n: 2, titulo: 'Cuéntale lo que comes', texto: 'Háblale a CaloCoach y él calcula las calorías y macros por ti.' },
    { n: 3, titulo: 'Mira tu avance', texto: 'En Balance ves cómo vas en el día y en la semana, sin presión.' },
  ];

  readonly meals: MealConfig[] = [
    { key: 'desayuno', label: 'Desayuno', icon: Sunrise, box: 'bg-amber-100 text-amber-700', momento: 'desayuno' },
    { key: 'media_manana', label: 'Snack', icon: Apple, box: 'bg-green-pale text-teal-deep', momento: 'merienda' },
    { key: 'almuerzo', label: 'Almuerzo', icon: Soup, box: 'bg-cyan-ring/20 text-teal-mid', momento: 'almuerzo' },
    { key: 'cena', label: 'Cena', icon: Moon, box: 'bg-cyan-ring/20 text-teal-mid', momento: 'cena' },
  ];

  readonly data = signal<PlanSemanal | null>(null);
  readonly balance = signal<BalanceDia | null>(null);
  readonly perfil = signal<PerfilResumen | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly diaSeleccionado = signal<number>(1);
  readonly swapping = signal<string | null>(null);
  readonly registrando = signal<string | null>(null);
  readonly generatingPlan = signal(false);

  readonly reminderTimeInput = signal<string>('20:00');
  readonly savingReminder = signal(false);
  readonly reminderSaved = signal(false);
  readonly editingReminder = signal(false);

  private readonly today = new Date();
  private readonly monday = (() => {
    const d = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  })();

  readonly hasReminderTime = computed(() => {
    return !!this.auth.currentUser()?.meal_reminder_time;
  });

  readonly firstName = computed(() => (this.auth.currentUser()?.name ?? '').trim().split(/\s+/)[0] || '');

  /** Condiciones médicas como texto, o '' si no tiene ninguna. */
  readonly condicionesMedicas = computed(() => {
    const lista = (this.perfil()?.medical_conditions ?? []).filter(c => c && c.trim().toLowerCase() !== 'ninguna');
    return lista.join(', ');
  });

  readonly isProfileComplete = computed(() => {
    return this.auth.currentUser()?.is_profile_complete ?? false;
  });

  readonly diaActual = computed(() => {
    const plan = this.data();
    if (!plan || !plan.dias) return null;
    return plan.dias.find(d => d.dia_numero === this.diaSeleccionado()) || plan.dias[0];
  });

  readonly comidasVisibles = computed(() => {
    const dia = this.diaActual();
    return dia ? this.meals.filter(m => !!dia.comidas[m.key]) : [];
  });

  readonly registradasCount = computed(() => this.comidasVisibles().filter(m => this.estaRegistrada(m)).length);

  readonly progresoPct = computed(() => {
    const total = this.comidasVisibles().length;
    return total ? Math.round((this.registradasCount() / total) * 100) : 0;
  });

  readonly tituloDia = computed(() => {
    const n = this.diaActual()?.dia_numero ?? 1;
    const fecha = this.fechaDia(n);
    const mes = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(fecha);
    const texto = `${this.getNombreDia(n)} ${fecha.getDate()} de ${mes}`;
    return this.esHoy(n) ? `Hoy, ${texto}` : texto;
  });

  constructor() {
    this.loadPlan();
  }

  // ---- fechas de la semana actual ----

  fechaDia(numero: number): Date {
    const d = new Date(this.monday);
    d.setDate(d.getDate() + numero - 1);
    return d;
  }

  esHoy(numero: number): boolean {
    return this.fechaDia(numero).toDateString() === this.today.toDateString();
  }

  nombreCorto(numero: number): string {
    return NOMBRES_CORTOS[numero - 1] ?? `Día ${numero}`;
  }

  getNombreDia(numero: number): string {
    return NOMBRES_DIA[numero - 1] ?? `Día ${numero}`;
  }

  private isoDate(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  seleccionarDia(numero: number): void {
    this.diaSeleccionado.set(numero);
    this.loadBalance();
  }

  // ---- carga de datos ----

  private loadPlan(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<PlanSemanal>(`${environment.apiUrl}/nutricion/plan-actual`)
      .subscribe({
        next: (res) => {
          this.data.set(res);
          const currentDay = this.today.getDay(); // 0=Dom, 1=Lun...
          const localDay = currentDay === 0 ? 7 : currentDay;
          if (res.dias && res.dias.find(d => d.dia_numero === localDay)) {
            this.diaSeleccionado.set(localDay);
          } else if (res.dias && res.dias.length > 0) {
            this.diaSeleccionado.set(res.dias[0].dia_numero);
          }
          this.loading.set(false);
          if (res.plan_id) this.loadBalance();
          else if (this.isProfileComplete()) this.loadPerfil();
        },
        error: () => {
          this.error.set('No se pudo cargar el plan semanal. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  /** Datos del perfil que la IA usará para armar el menú (se muestran antes de generarlo). */
  private loadPerfil(): void {
    this.http.get<PerfilResumen>(`${environment.apiUrl}/clientes/perfil`).subscribe({
      next: (res) => this.perfil.set(res),
      error: () => this.perfil.set(null),
    });
  }

  actividadLabel(nivel: string): string {
    const etiquetas: Record<string, string> = {
      sedentario: 'Actividad sedentaria',
      ligero: 'Actividad ligera',
      moderado: 'Actividad moderada',
      intenso: 'Actividad intensa',
      'muy intenso': 'Actividad muy intensa',
    };
    return etiquetas[(nivel ?? '').trim().toLowerCase()] ?? `Actividad: ${(nivel ?? '').toLowerCase()}`;
  }

  /** Consumo, meta y comidas registradas de la fecha del día seleccionado. */
  private loadBalance(): void {
    const fecha = this.isoDate(this.fechaDia(this.diaSeleccionado()));
    this.http.get<BalanceDia>(`${environment.apiUrl}/balance/hoy`, { params: { fecha } }).subscribe({
      next: (res) => {
        // Descarta respuestas de un día que ya no está seleccionado
        if (this.isoDate(this.fechaDia(this.diaSeleccionado())) === fecha) this.balance.set(res);
      },
      error: () => this.balance.set(null),
    });
  }

  estaRegistrada(meal: MealConfig): boolean {
    const registros = this.balance()?.comidas_registradas ?? [];
    return registros.some(r => (r.momento ?? '').toLowerCase() === meal.momento);
  }

  // ---- acciones ----

  registrarComida(meal: MealConfig, texto: string): void {
    if (this.registrando()) return;
    this.registrando.set(meal.key);

    this.http.post<any>(`${environment.apiUrl}/asistente/log-inteligente`, {
      mensaje: textoParaRegistro(texto),
      momento: meal.momento,
    }).subscribe({
      next: (res) => {
        this.registrando.set(null);
        if (res?.success === false) {
          this.toastr.warning(res.mensaje || 'No pude registrar esa comida.', 'Revisa tu registro');
          return;
        }
        this.toastr.success(`${meal.label} registrado`, '¡Listo!');
        this.loadBalance();
      },
      error: (err) => {
        this.registrando.set(null);
        this.toastr.error(err?.error?.detail || 'No se pudo registrar la comida.', 'Error');
      },
    });
  }

  hacerSwap(planId: number, diaNumero: number, tipoComida: string, comidaActual: string) {
    if (this.swapping()) return;
    this.swapping.set(tipoComida);

    this.http.post<any>(`${environment.apiUrl}/nutricion/${planId}/dia/${diaNumero}/swap`, {
      tipo_comida: tipoComida,
      comida_actual: comidaActual
    }).subscribe({
      next: (res) => {
        if (res.success) {
          const actualData = this.data();
          if (actualData) {
            const diaIndex = actualData.dias.findIndex(d => d.dia_numero === diaNumero);
            if (diaIndex !== -1) {
              actualData.dias[diaIndex].comidas = res.dia_comidas;
              this.data.set({ ...actualData });
            }
          }
        }
        this.swapping.set(null);
      },
      error: () => {
        alert('Hubo un error al intentar cambiar la comida.');
        this.swapping.set(null);
      }
    });
  }

  generarPlan() {
    if (this.generatingPlan()) return;
    this.generatingPlan.set(true);

    this.http.post<any>(`${environment.apiUrl}/nutricion/generar-plan-automatico`, {}).subscribe({
      next: () => {
        this.generatingPlan.set(false);
        this.loadPlan();
      },
      error: (err) => {
        console.error(err);
        alert('Hubo un error al generar tu plan. Por favor intenta de nuevo.');
        this.generatingPlan.set(false);
      }
    });
  }

  // ---- recordatorio ----

  startEditReminder(): void {
    const actual = this.auth.currentUser()?.meal_reminder_time;
    if (actual) this.reminderTimeInput.set(actual);
    this.editingReminder.set(true);
  }

  formatReminder(hhmm: string | null | undefined): string {
    const [h, m] = (hhmm ?? '20:00').split(':').map(Number);
    const d = new Date(2000, 0, 1, h || 0, m || 0);
    return d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  saveReminderTime() {
    if (!this.reminderTimeInput() || this.savingReminder()) return;
    this.savingReminder.set(true);

    this.http.put<any>(`${environment.apiUrl}/clientes/perfil`, {
      meal_reminder_time: this.reminderTimeInput()
    }).subscribe({
      next: () => {
        this.savingReminder.set(false);
        this.reminderSaved.set(true);
        this.editingReminder.set(false);
        const currentUser = this.auth.currentUser();
        if (currentUser) {
          this.auth.updateCurrentUser({
            ...currentUser,
            meal_reminder_time: this.reminderTimeInput()
          });
        }
      },
      error: (err) => {
        console.error(err);
        alert('Hubo un error al guardar el recordatorio.');
        this.savingReminder.set(false);
      }
    });
  }
}
