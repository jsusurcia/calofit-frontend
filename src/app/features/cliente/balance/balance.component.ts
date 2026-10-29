import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Mic, Flame, Utensils, Sunrise, Apple, Soup, Moon } from 'lucide-angular';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

interface CaloriaTendencia {
  dia: string;
  consumidas: number;
  quemadas: number;
}

interface ComidaRegistrada {
  id: number;
  ids?: number[];
  momento: string;
  nombre: string;
  alimentos?: string[];
  macros: { calorias: number; proteinas: number; carbohidratos: number; grasas: number };
  hora_registro: string | null;
}

interface ResumenDiario {
  resumen: {
    calorias_consumidas: number;
    proteinas_consumidas: number;
    carbohidratos_consumidos: number;
    grasas_consumidas: number;
  };
  plan_nutricional: {
    calorias_objetivo: number;
    proteinas_objetivo_g: number;
    carbohidratos_objetivo_g: number;
    grasas_objetivo_g: number;
  };
  ai_insight: string;
  comidas_registradas?: ComidaRegistrada[];
}

interface MomentoConfig {
  key: string;
  label: string;
  icon: any;
  box: string;
  /** Valores de `momento` que guarda el backend y que corresponden a esta tarjeta. */
  momentos: string[];
}

const MOMENTOS: MomentoConfig[] = [
  { key: 'desayuno', label: 'Desayuno', icon: Sunrise, box: 'bg-amber-100 text-amber-700', momentos: ['desayuno'] },
  { key: 'snack', label: 'Snack', icon: Apple, box: 'bg-green-pale text-teal-deep', momentos: ['merienda', 'snack'] },
  { key: 'almuerzo', label: 'Almuerzo', icon: Soup, box: 'bg-cyan-ring/20 text-teal-mid', momentos: ['almuerzo'] },
  { key: 'cena', label: 'Cena', icon: Moon, box: 'bg-cyan-ring/20 text-teal-mid', momentos: ['cena'] },
];

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const NOMBRES_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const RING_RADIO = 84;
const RING_LARGO = 2 * Math.PI * RING_RADIO;

@Component({
  selector: 'app-balance',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <p class="text-sm font-medium text-teal-mid">{{ fechaHoy }}</p>
          <h1 class="text-2xl lg:text-4xl font-extrabold text-teal-deep">Tu balance de hoy</h1>
        </div>
        <a routerLink="/cliente/chat"
           class="hidden sm:inline-flex items-center gap-2 px-5 py-3 bg-teal-mid text-white font-bold rounded-2xl shadow-lg shadow-teal-mid/25 hover:bg-teal-deep transition-colors shrink-0">
          <lucide-angular [img]="MicIcon" [size]="18" />
          Registrar comida
        </a>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-4 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
            <p class="text-sm text-ink-soft">Cargando tu balance...</p>
          </div>
        </div>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{{ error() }}</div>
      }

      @if (!loading() && resumen(); as r) {
        <!-- Calorías y macronutrientes -->
        <section class="bg-white rounded-3xl border border-green-cream p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-14 items-center animate-fade-in-up">
          <!-- Anillo -->
          <div class="flex flex-col items-center gap-5">
            <div class="relative w-52 h-52 lg:w-64 lg:h-64">
              <svg viewBox="0 0 200 200" class="w-full h-full -rotate-90">
                <circle cx="100" cy="100" [attr.r]="ringRadio" fill="none" stroke-width="18" class="stroke-green-cream" />
                <circle cx="100" cy="100" [attr.r]="ringRadio" fill="none" stroke-width="18" stroke-linecap="round"
                        [attr.stroke-dasharray]="ringLargo"
                        [attr.stroke-dashoffset]="ringOffset()"
                        [ngClass]="excedeMeta() ? 'stroke-amber-500' : 'stroke-cyan-ring'"
                        class="transition-all duration-1000 ease-out" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-4xl lg:text-5xl font-extrabold text-teal-deep">{{ r.resumen.calorias_consumidas | number:'1.0-0' }}</span>
                <span class="text-sm lg:text-base text-ink-soft">de {{ r.plan_nutricional.calorias_objetivo | number:'1.0-0' }} kcal</span>
              </div>
            </div>
            <span class="px-5 py-2 rounded-full text-sm font-semibold"
                  [ngClass]="excedeMeta() ? 'bg-amber-100 text-amber-800' : 'bg-cyan-ring/20 text-teal-deep'">
              @if (excedeMeta()) {
                Superaste tu meta en {{ caloriasRestantes() * -1 | number:'1.0-0' }} kcal
              } @else {
                Te quedan {{ caloriasRestantes() | number:'1.0-0' }} kcal
              }
            </span>
          </div>

          <!-- Macros -->
          <div class="min-w-0">
            <h2 class="text-2xl font-extrabold text-teal-deep">Macronutrientes</h2>
            <p class="text-sm text-ink-soft mt-1">Así vas con tus metas del día.</p>
            <div class="mt-6 space-y-6">
              @for (m of macros(); track m.label) {
                <div>
                  <div class="flex items-baseline justify-between">
                    <span class="flex items-center gap-2.5 font-semibold text-ink">
                      <span class="w-3 h-3 rounded-sm" [ngClass]="m.color"></span>{{ m.label }}
                    </span>
                    <span class="text-ink-soft"><span class="font-bold text-ink">{{ m.consumido | number:'1.0-0' }}</span> / {{ m.objetivo | number:'1.0-0' }} g</span>
                  </div>
                  <div class="mt-2 h-3 rounded-full bg-green-cream overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700" [ngClass]="m.color" [style.width.%]="m.pct"></div>
                  </div>
                  <p class="mt-1.5 text-sm text-ink-soft">{{ m.estado }}</p>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Comidas de hoy -->
        <section class="bg-white rounded-3xl border border-green-cream p-5 lg:p-8 animate-fade-in-up">
          <div class="flex flex-wrap items-center gap-4">
            <div class="w-12 h-12 shrink-0 rounded-2xl bg-teal-mid/10 text-teal-deep flex items-center justify-center">
              <lucide-angular [img]="UtensilsIcon" [size]="22" />
            </div>
            <div class="min-w-0">
              <h2 class="text-2xl font-extrabold text-teal-deep">Comidas de hoy</h2>
              <p class="text-sm text-ink-soft">Todo lo que registraste, por tiempo de comida</p>
            </div>
            <span class="sm:ml-auto px-4 py-2 rounded-full bg-cream-2 text-ink text-sm font-semibold">
              {{ totalRegistros() }} {{ totalRegistros() === 1 ? 'registro' : 'registros' }} · {{ comidasConRegistro() }} de {{ tarjetas().length }} comidas
            </span>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            @for (t of tarjetas(); track t.key) {
              <div class="rounded-2xl bg-cream border border-green-cream p-4">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center" [ngClass]="t.box">
                    <lucide-angular [img]="t.icon" [size]="20" />
                  </div>
                  <h3 class="text-lg font-extrabold text-teal-deep">{{ t.label }}</h3>
                  @if (t.registros.length) {
                    <div class="ml-auto flex items-baseline gap-3 text-right">
                      <span class="text-sm text-ink-soft">{{ t.registros.length }} {{ t.registros.length === 1 ? 'registro' : 'registros' }}</span>
                      <span class="text-lg font-extrabold text-ink">{{ t.kcal | number:'1.0-0' }} kcal</span>
                    </div>
                  }
                </div>

                <div class="mt-4 space-y-3">
                  @for (c of t.registros; track c.id) {
                    <div class="rounded-xl bg-white border border-green-cream p-4">
                      <div class="flex items-start justify-between gap-3">
                        <p class="text-ink leading-snug">{{ c.nombre }}</p>
                        <span class="shrink-0 font-extrabold text-ink">{{ c.macros.calorias | number:'1.0-0' }} kcal</span>
                      </div>
                      <p class="mt-2 text-sm text-ink-soft">
                        @if (c.hora_registro) { <span class="mr-2">{{ c.hora_registro.slice(0, 5) }}</span> }
                        P {{ c.macros.proteinas | number:'1.0-0' }} · C {{ c.macros.carbohidratos | number:'1.0-0' }} · G {{ c.macros.grasas | number:'1.0-0' }} g
                      </p>
                    </div>
                  } @empty {
                    <div class="rounded-xl border-2 border-dashed border-green-cream px-4 py-6 text-center text-sm text-ink-soft">
                      Aún no registras nada aquí.
                    </div>
                  }
                </div>
              </div>
            }

            @if (otros().length) {
              <div class="rounded-2xl bg-cream border border-green-cream p-4">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 shrink-0 rounded-xl bg-cream-2 text-ink-soft flex items-center justify-center">
                    <lucide-angular [img]="UtensilsIcon" [size]="20" />
                  </div>
                  <h3 class="text-lg font-extrabold text-teal-deep">Otros</h3>
                  <div class="ml-auto flex items-baseline gap-3 text-right">
                    <span class="text-sm text-ink-soft">{{ otros().length }} {{ otros().length === 1 ? 'registro' : 'registros' }}</span>
                    <span class="text-lg font-extrabold text-ink">{{ otrosKcal() | number:'1.0-0' }} kcal</span>
                  </div>
                </div>
                <div class="mt-4 space-y-3">
                  @for (c of otros(); track c.id) {
                    <div class="rounded-xl bg-white border border-green-cream p-4">
                      <div class="flex items-start justify-between gap-3">
                        <p class="text-ink leading-snug">{{ c.nombre }}</p>
                        <span class="shrink-0 font-extrabold text-ink">{{ c.macros.calorias | number:'1.0-0' }} kcal</span>
                      </div>
                      <p class="mt-2 text-sm text-ink-soft">
                        @if (c.hora_registro) { <span class="mr-2">{{ c.hora_registro.slice(0, 5) }}</span> }
                        P {{ c.macros.proteinas | number:'1.0-0' }} · C {{ c.macros.carbohidratos | number:'1.0-0' }} · G {{ c.macros.grasas | number:'1.0-0' }} g
                      </p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Semana + consejo -->
        <section class="grid grid-cols-1 xl:grid-cols-[1fr_minmax(0,420px)] gap-5 lg:gap-6 animate-fade-in-up">
          <div class="bg-white rounded-3xl border border-green-cream p-6 lg:p-8">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-2xl font-extrabold text-teal-deep">Calorías de tu semana</h2>
                @if (promedioSemana() > 0) {
                  <p class="mt-1 text-sm text-ink-soft">
                    Promedio: <span class="font-bold text-ink">{{ promedioSemana() | number:'1.0-0' }} kcal/día</span> en los días registrados
                  </p>
                }
              </div>
              @if (racha() >= 2) {
                <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-pale text-teal-deep text-sm font-semibold">
                  <lucide-angular [img]="FlameIcon" [size]="16" /> {{ racha() }} días seguidos registrando
                </span>
              }
            </div>

            <!-- Gráfico de barras -->
            <div class="mt-8">
              <div class="relative h-52 border-b-2 border-green-cream">
                <!-- Línea de la meta -->
                <div class="absolute left-0 right-0 border-t-2 border-dashed border-ink-soft/40" [style.bottom.%]="metaLineaPct()">
                  <span class="absolute right-0 -top-5 text-xs font-semibold text-ink-soft">Meta {{ metaCalorias() | number:'1.0-0' }}</span>
                </div>
                <div class="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4 px-1">
                  @for (d of semana(); track d.label) {
                    <div class="group relative flex-1 h-full flex items-end justify-center">
                      @if (d.consumidas > 0) {
                        <div class="w-full max-w-[56px] rounded-t-lg bg-cyan-ring transition-all duration-700" [style.height.%]="d.pct"></div>
                        <span class="absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-white border border-green-cream shadow-sm text-xs font-bold text-ink whitespace-nowrap"
                              [style.bottom.%]="d.pct"
                              [ngClass]="d.esHoy ? 'mb-1' : 'mb-1 hidden group-hover:block'">
                          {{ d.consumidas | number:'1.0-0' }} kcal
                        </span>
                      } @else {
                        <div class="w-full max-w-[56px] h-10 rounded-t-lg border-2 border-dashed border-green-cream"></div>
                      }
                    </div>
                  }
                </div>
              </div>
              <div class="flex justify-between gap-2 sm:gap-4 px-1 mt-2">
                @for (d of semana(); track d.label) {
                  <span class="flex-1 text-center text-xs sm:text-sm" [ngClass]="d.esHoy ? 'font-bold text-ink' : 'text-ink-soft'">{{ d.esHoy ? 'Hoy' : d.label }}</span>
                }
              </div>
            </div>

            <p class="mt-5 text-sm text-ink-soft">{{ notaSemana() }}</p>
          </div>

          <!-- Consejo de CaloCoach -->
          <div class="bg-teal-deep rounded-3xl p-6 lg:p-8 text-white flex flex-col">
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 shrink-0 rounded-full bg-cream flex items-center justify-center">
                <img src="/perezoso.png" alt="CaloCoach" class="w-10 h-10 object-contain" />
              </div>
              <div>
                <p class="text-xs font-bold tracking-wider text-cyan-ring">CONSEJO DE CALOCOACH</p>
                <h3 class="text-xl font-extrabold leading-tight">{{ consejo().titulo }}</h3>
              </div>
            </div>
            <p class="mt-5 text-white/80 leading-relaxed">{{ consejo().texto }}</p>
            <a routerLink="/cliente/chat"
               class="mt-6 xl:mt-auto self-start inline-flex px-5 py-3 rounded-xl bg-cyan-ring text-teal-deep font-bold hover:brightness-95 transition">
              Preguntarle algo
            </a>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";
    :host { display: block; }
  `]
})
export class BalanceComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly MicIcon = Mic;
  readonly UtensilsIcon = Utensils;
  readonly FlameIcon = Flame;

  readonly ringRadio = RING_RADIO;
  readonly ringLargo = RING_LARGO;

  readonly resumen = signal<ResumenDiario | null>(null);
  readonly tendencia = signal<CaloriaTendencia[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly hoy = new Date();
  readonly fechaHoy = (() => {
    const mes = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(this.hoy);
    return `${NOMBRES_DIA[this.hoy.getDay()]} ${this.hoy.getDate()} de ${mes}`;
  })();

  // ---- calorías ----

  readonly metaCalorias = computed(() => this.resumen()?.plan_nutricional.calorias_objetivo ?? 0);
  readonly caloriasConsumidas = computed(() => this.resumen()?.resumen.calorias_consumidas ?? 0);
  readonly caloriasRestantes = computed(() => this.metaCalorias() - this.caloriasConsumidas());
  readonly excedeMeta = computed(() => this.caloriasRestantes() < 0);

  readonly ringOffset = computed(() => {
    const meta = this.metaCalorias();
    const pct = meta > 0 ? Math.min(this.caloriasConsumidas() / meta, 1) : 0;
    return RING_LARGO * (1 - pct);
  });

  readonly macros = computed(() => {
    const r = this.resumen();
    if (!r) return [];
    const filas = [
      { label: 'Proteínas', color: 'bg-teal-mid', consumido: r.resumen.proteinas_consumidas, objetivo: r.plan_nutricional.proteinas_objetivo_g },
      { label: 'Carbohidratos', color: 'bg-amber-500', consumido: r.resumen.carbohidratos_consumidos, objetivo: r.plan_nutricional.carbohidratos_objetivo_g },
      { label: 'Grasas', color: 'bg-purple-500', consumido: r.resumen.grasas_consumidas, objetivo: r.plan_nutricional.grasas_objetivo_g },
    ];
    return filas.map(f => {
      const diff = Math.round(f.objetivo - f.consumido);
      return {
        ...f,
        pct: f.objetivo > 0 ? Math.min((f.consumido / f.objetivo) * 100, 100) : 0,
        estado: diff > 0 ? `Te faltan ${diff} g` : diff < 0 ? `Te pasaste ${-diff} g` : 'Meta cumplida',
      };
    });
  });

  // ---- comidas de hoy ----

  private readonly registrosHoy = computed(() => {
    const lista = [...(this.resumen()?.comidas_registradas ?? [])];
    // el backend las entrega de la más reciente a la más antigua; en la tarjeta van en orden cronológico
    return lista.sort((a, b) => (a.hora_registro ?? '').localeCompare(b.hora_registro ?? ''));
  });

  readonly tarjetas = computed(() =>
    MOMENTOS.map(m => {
      const registros = this.registrosHoy().filter(c => m.momentos.includes((c.momento ?? '').toLowerCase()));
      return { ...m, registros, kcal: registros.reduce((suma, c) => suma + c.macros.calorias, 0) };
    }),
  );

  readonly totalRegistros = computed(() => this.registrosHoy().length);
  readonly comidasConRegistro = computed(() => this.tarjetas().filter(t => t.registros.length > 0).length);

  readonly otros = computed(() => {
    const conocidos = MOMENTOS.flatMap(m => m.momentos);
    return this.registrosHoy().filter(c => !conocidos.includes((c.momento ?? '').toLowerCase()));
  });

  readonly otrosKcal = computed(() => this.otros().reduce((suma, c) => suma + c.macros.calorias, 0));

  // ---- semana ----

  readonly semana = computed(() => {
    const datos = this.tendencia();
    const maximo = Math.max(this.metaCalorias(), ...datos.map(d => d.consumidas), 1) * 1.12;
    return datos.map((d, i) => {
      const fecha = new Date(this.hoy.getFullYear(), this.hoy.getMonth(), this.hoy.getDate() - (datos.length - 1 - i));
      return {
        label: `${NOMBRES_CORTOS[fecha.getDay()]} ${fecha.getDate()}`,
        nombreDia: new Intl.DateTimeFormat('es-PE', { weekday: 'long' }).format(fecha),
        consumidas: d.consumidas,
        pct: (d.consumidas / maximo) * 100,
        esHoy: i === datos.length - 1,
      };
    });
  });

  readonly metaLineaPct = computed(() => {
    const datos = this.tendencia();
    const maximo = Math.max(this.metaCalorias(), ...datos.map(d => d.consumidas), 1) * 1.12;
    return (this.metaCalorias() / maximo) * 100;
  });

  readonly promedioSemana = computed(() => {
    const registrados = this.tendencia().filter(d => d.consumidas > 0);
    return registrados.length ? registrados.reduce((s, d) => s + d.consumidas, 0) / registrados.length : 0;
  });

  /** Días seguidos con comidas registradas; si hoy aún no hay registros, se cuenta desde ayer. */
  readonly racha = computed(() => {
    const datos = this.tendencia();
    let i = datos.length - 1;
    if (i >= 0 && datos[i].consumidas === 0) i--;
    let racha = 0;
    while (i >= 0 && datos[i].consumidas > 0) { racha++; i--; }
    return racha;
  });

  readonly notaSemana = computed(() => {
    const sinRegistro = this.semana().filter(d => !d.esHoy && d.consumidas === 0);
    const ayuda = 'Pasa el cursor sobre cada barra para ver el total.';
    if (sinRegistro.length === 1) return `El ${sinRegistro[0].nombreDia} no registraste comidas. ${ayuda}`;
    if (sinRegistro.length > 1) return `Algunos días no registraste comidas. ${ayuda}`;
    return ayuda;
  });

  readonly consejo = computed(() => {
    const r = this.resumen();
    if (!r) return { titulo: '', texto: '' };
    const consumidas = r.resumen.calorias_consumidas;
    const meta = r.plan_nutricional.calorias_objetivo;
    const proteinaFalta = Math.round(r.plan_nutricional.proteinas_objetivo_g - r.resumen.proteinas_consumidas);

    if (consumidas === 0) {
      return {
        titulo: 'Aún no registras nada hoy',
        texto: 'Cuéntale a CaloCoach lo que comiste y él calcula las calorías y macros por ti. Registrar a tiempo hace tu balance más preciso.',
      };
    }
    if (consumidas > meta * 1.1) {
      return {
        titulo: 'Hoy superaste tu meta',
        texto: `Vas ${Math.round(consumidas - meta)} kcal por encima. No pasa nada: mañana retomas tu menú. Si te da hambre, elige verduras o fruta.`,
      };
    }
    if (proteinaFalta >= 15) {
      return {
        titulo: `Te faltan ${proteinaFalta} g de proteína`,
        texto: 'Un huevo duro, yogur natural o un poco de pollo desmenuzado te ayudan a completarla.',
      };
    }
    return {
      titulo: 'Vas muy bien hoy',
      texto: 'Sigue registrando lo que comes: así tu balance y tu menú se mantienen al día.',
    };
  });

  constructor() {
    this.cargar(true);
  }

  private cargar(inicial = false): void {
    const clienteId = this.auth.userId();
    if (!clienteId) return;

    if (inicial) this.loading.set(true);
    this.error.set(null);

    let pendientes = 2;
    const listo = () => { if (--pendientes === 0) this.loading.set(false); };

    this.http.get<ResumenDiario>(`${environment.apiUrl}/dashboard/clientes/${clienteId}/resumen-diario`).subscribe({
      next: (data) => { this.resumen.set(data); listo(); },
      error: () => { this.error.set('Error al cargar el resumen diario.'); listo(); },
    });

    this.http.get<CaloriaTendencia[]>(`${environment.apiUrl}/dashboard/clientes/${clienteId}/calorias-tendencia`).subscribe({
      next: (data) => { this.tendencia.set(data ?? []); listo(); },
      error: () => { this.tendencia.set([]); listo(); },
    });
  }
}
