import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { LucideAngularModule, Sparkles, BadgeCheck, Bot, Clock, ClipboardList, Flame, Scale } from 'lucide-angular';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardRefreshService } from '../../../core/services/dashboard-refresh.service';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

/**
 * Backend response from GET /dashboard/clientes/{id}/resumen-diario
 *
 * Key: `dieta_recomendada` = TARGET macros/cals (what the user SHOULD eat)
 *      `resumen`           = CONSUMED values today (from ProgresoCalorias)
 *      `plan_nutricional`  = full plan details + status
 */
interface ResumenDiario {
  dieta_recomendada: {
    calorias_diarias: number;
    proteinas_g: number;
    carbohidratos_g: number;
    grasas_g: number;
    imc: number;
  };
  calorias_quemadas: number;
  /** Actual consumed values for today from ProgresoCalorias */
  resumen: {
    calorias_consumidas: number;
    calorias_quemadas: number;
  };
  plan_nutricional: {
    calorias_objetivo: number;
    proteinas_objetivo_g: number;
    carbohidratos_objetivo_g: number;
    grasas_objetivo_g: number;
    validado: boolean;
    estado_plan: string;
    mensaje_cliente: string;
    distribucion: {
      proteina_pct: number;
      carbohidratos_pct: number;
      grasas_pct: number;
    };
  };
  ai_insight: string;
}

/**
 * Backend response from GET /balance/hoy → { resumen: BalanceResumen, ... }
 * This is the most detailed source: includes consumed + target macros.
 */
interface BalanceResumen {
  calorias_consumidas: number;
  calorias_quemadas: number;
  calorias_restantes: number;
  objetivo_diario: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  proteinas_objetivo: number;
  carbohidratos_objetivo: number;
  grasas_objetivo: number;
}

@Component({
  selector: 'app-cliente-dashboard',
  imports: [CommonModule, BaseChartDirective, LucideAngularModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <!-- Page Title -->
      <div class="animate-fade-in-up">
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-sm text-gray-400 mt-1">Tu resumen nutricional de hoy</p>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p class="text-sm text-gray-400">Cargando tu resumen...</p>
          </div>
        </div>
      }

      @if (error()) {
        <div class="bg-danger-50 border border-danger-200 text-danger-700 rounded-xl p-4 text-sm">
          {{ error() }}
        </div>
      }

      @if (data(); as d) {
        <!-- AI Insight Banner -->
        <div class="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-5 text-white shadow-lg animate-fade-in-up">
          <div class="flex items-start gap-3">
            <lucide-angular [img]="SparklesIcon" [size]="22" class="flex-shrink-0 mt-0.5 text-white" />
            <div>
              <h3 class="font-semibold text-sm uppercase tracking-wide opacity-90 mb-1">Insight IA</h3>
              <p class="text-sm leading-relaxed opacity-95">{{ d.ai_insight }}</p>
            </div>
          </div>
        </div>

        <!-- Plan Status Banner -->
        <div
          class="rounded-2xl p-4 flex items-center gap-3 animate-fade-in-up"
          [ngClass]="planStatusClasses()"
        >
          <lucide-angular [img]="planStatusIconData()" [size]="20" class="flex-shrink-0" />
          <div>
            <p class="font-semibold text-sm">{{ planStatusLabel() }}</p>
            <p class="text-xs opacity-80 mt-0.5">{{ d.plan_nutricional.mensaje_cliente }}</p>
          </div>
        </div>

        <!-- Macro Ring Charts -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up">
          @for (macro of macros(); track macro.label) {
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center">
              <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{{ macro.label }}</h4>
              <div class="relative w-32 h-32">
                <canvas
                  baseChart
                  [type]="'doughnut'"
                  [data]="macro.chartData"
                  [options]="doughnutOptions"
                ></canvas>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-lg font-bold" [style.color]="macro.color">{{ macro.pct }}%</span>
                  <span class="text-[10px] text-gray-400">{{ macro.consumed | number:'1.0-0' }}g / {{ macro.target | number:'1.0-0' }}g</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Calorie Progress -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-fade-in-up">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-700">Calorías consumidas</h4>
            <span class="text-xs text-gray-400">
              {{ consumedCalories() | number:'1.0-0' }} / {{ targetCalories() | number:'1.0-0' }} kcal
            </span>
          </div>
          <div class="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700 ease-out"
              [style.width.%]="caloriePercent()"
              [ngClass]="{
                'bg-primary-500': caloriePercent() <= 100,
                'bg-danger-500': caloriePercent() > 100
              }"
            ></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">
            {{ caloriePercent() | number:'1.0-0' }}% de tu objetivo diario
          </p>
        </div>

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
          <!-- Calories Burned -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center text-[#f4b400]">
              <lucide-angular [img]="FlameIcon" [size]="24" />
            </div>
            <div>
              <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Calorías quemadas</p>
              <p class="text-2xl font-bold text-gray-800">{{ burnedCalories() | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400">kcal hoy</p>
            </div>
          </div>

          <!-- IMC Card -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-[#146aff]">
              <lucide-angular [img]="ScaleIcon" [size]="24" />
            </div>
            <div>
              <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">IMC actual</p>
              <p class="text-2xl font-bold text-gray-800">{{ d.dieta_recomendada.imc | number:'1.1-1' }}</p>
              <p class="text-xs text-gray-400">índice de masa corporal</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";

    :host {
      display: block;
    }
  `]
})
export class ClienteDashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly SparklesIcon = Sparkles;
  readonly FlameIcon = Flame;
  readonly ScaleIcon = Scale;

  readonly data = signal<ResumenDiario | null>(null);
  readonly balance = signal<BalanceResumen | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  /**
   * CONSUMED macros: prioritize /balance/hoy (most detailed), then
   * fall back to /resumen-diario.resumen, then 0.
   *
   * TARGET macros: prioritize /balance/hoy objectives, then
   * fall back to /resumen-diario.plan_nutricional objectives.
   *
   * IMPORTANT: `dieta_recomendada` contains TARGET values, NOT consumed.
   * The consumed values come from `resumen` (in resumen-diario) or
   * `balance.resumen` (in /balance/hoy).
   */
  readonly macros = computed(() => {
    const b = this.balance();
    const d = this.data();
    if (!d) return [];

    // Consumed: from /balance/hoy if available, otherwise 0
    // (resumen-diario doesn't return per-macro consumed breakdown)
    const consumedProteins = b?.proteinas_g ?? 0;
    const consumedCarbs = b?.carbohidratos_g ?? 0;
    const consumedFats = b?.grasas_g ?? 0;

    // Target: from /balance/hoy if available, otherwise from plan_nutricional
    const targetProteins = b?.proteinas_objetivo ?? d.plan_nutricional.proteinas_objetivo_g ?? 0;
    const targetCarbs = b?.carbohidratos_objetivo ?? d.plan_nutricional.carbohidratos_objetivo_g ?? 0;
    const targetFats = b?.grasas_objetivo ?? d.plan_nutricional.grasas_objetivo_g ?? 0;

    const items = [
      {
        label: 'Proteínas',
        consumed: consumedProteins,
        target: targetProteins,
        color: '#146aff',
        bgColor: '#e0edff',
      },
      {
        label: 'Carbohidratos',
        consumed: consumedCarbs,
        target: targetCarbs,
        color: '#f4b400',
        bgColor: '#fef3c7',
      },
      {
        label: 'Grasas',
        consumed: consumedFats,
        target: targetFats,
        color: '#ef4444',
        bgColor: '#fee2e2',
      },
    ];

    return items.map(item => {
      const pct = item.target > 0 ? Math.min(Math.round((item.consumed / item.target) * 100), 100) : 0;
      const remaining = Math.max(item.target - item.consumed, 0);
      return {
        ...item,
        pct,
        chartData: {
          labels: ['Consumido', 'Restante'],
          datasets: [{
            data: [item.consumed, remaining],
            backgroundColor: [item.color, item.bgColor],
            borderWidth: 0,
            borderRadius: 4,
          }],
        },
      };
    });
  });

  /** Consumed calories: from /balance/hoy or /resumen-diario.resumen */
  readonly consumedCalories = computed(() => {
    const b = this.balance();
    const d = this.data();
    return b?.calorias_consumidas ?? d?.resumen?.calorias_consumidas ?? 0;
  });

  /** Target calories: from /balance/hoy or plan_nutricional */
  readonly targetCalories = computed(() => {
    const b = this.balance();
    const d = this.data();
    return b?.objetivo_diario ?? d?.plan_nutricional?.calorias_objetivo ?? 0;
  });

  /** Burned calories: from /balance/hoy or /resumen-diario */
  readonly burnedCalories = computed(() => {
    const b = this.balance();
    const d = this.data();
    return b?.calorias_quemadas ?? d?.resumen?.calorias_quemadas ?? d?.calorias_quemadas ?? 0;
  });

  readonly caloriePercent = computed(() => {
    const consumed = this.consumedCalories();
    const target = this.targetCalories();
    if (target === 0) return 0;
    return Math.round((consumed / target) * 100);
  });

  readonly planStatusClasses = computed(() => {
    const d = this.data();
    if (!d) return '';
    switch (d.plan_nutricional.estado_plan) {
      case 'validado':
        return 'bg-success-50 border border-success-500/20 text-success-700';
      case 'provisional_ia':
        return 'bg-primary-50 border border-primary-500/20 text-primary-700';
      case 'en_revision':
        return 'bg-accent-50 border border-accent-500/20 text-accent-700';
      default:
        return 'bg-gray-50 border border-gray-200 text-gray-600';
    }
  });

  readonly planStatusIconData = computed(() => {
    const d = this.data();
    if (!d) return ClipboardList;
    switch (d.plan_nutricional.estado_plan) {
      case 'validado': return BadgeCheck;
      case 'provisional_ia': return Bot;
      case 'en_revision': return Clock;
      default: return ClipboardList;
    }
  });

  readonly planStatusLabel = computed(() => {
    const d = this.data();
    if (!d) return '';
    switch (d.plan_nutricional.estado_plan) {
      case 'validado': return 'Plan validado por nutricionista';
      case 'provisional_ia': return 'Plan provisional generado por IA';
      case 'en_revision': return 'Plan en revisión';
      default: return 'Estado del plan';
    }
  });

  constructor() {
    this.loadDashboard();
    inject(DashboardRefreshService).refresh$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.loadDashboard());
  }

  private loadDashboard(): void {
    const clienteId = this.auth.userId();
    if (!clienteId) return;

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      resumen: this.http.get<ResumenDiario>(
        `http://localhost:8000/dashboard/clientes/${clienteId}/resumen-diario`
      ),
      balance: this.http.get<{ resumen: BalanceResumen }>(
        'http://localhost:8000/balance/hoy'
      ).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ resumen, balance }) => {
        this.data.set(resumen);
        if (balance) this.balance.set(balance.resumen);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el resumen. Intenta de nuevo más tarde.');
        this.loading.set(false);
      },
    });
  }
}
