import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { LucideAngularModule, Activity, Scale } from 'lucide-angular';
import { environment } from '../../../../environments/environment';
import {
  Chart,
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { AuthService } from '../../../core/services/auth.service';

Chart.register(
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

interface CaloriaTendencia {
  dia: string;
  consumidas: number;
  quemadas: number;
}

interface PesoHistorial {
  fecha: string;
  peso: number;
}

interface ResumenDiario {
  resumen: {
    calorias_consumidas: number;
    proteinas_consumidas: number;
    carbohidratos_consumidos: number;
    grasas_consumidas: number;
    calorias_quemadas: number;
  };
  plan_nutricional: {
    calorias_objetivo: number;
    proteinas_objetivo_g: number;
    carbohidratos_objetivo_g: number;
    grasas_objetivo_g: number;
  };
  ai_insight: string;
  comidas_registradas?: any[];
}

@Component({
  selector: 'app-balance',
  imports: [CommonModule, BaseChartDirective, LucideAngularModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <!-- Page Title -->
      <div class="animate-fade-in-up">
        <h1 class="text-2xl font-bold text-gray-800">Balance</h1>
        <p class="text-sm text-gray-400 mt-1">Tendencias de calorías y evolución de peso</p>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p class="text-sm text-gray-400">Cargando datos...</p>
          </div>
        </div>
      }

      @if (error()) {
        <div class="bg-danger-50 border border-danger-200 text-danger-700 rounded-xl p-4 text-sm">
          {{ error() }}
        </div>
      }

      @if (!loading() && !error()) {
        <!-- Resumen Diario -->
        @if (resumenDiario()) {
          <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 animate-fade-in-up mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <lucide-angular [img]="ActivityIcon" [size]="18" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-800">Progreso de hoy</h3>
                <p class="text-sm text-gray-500">{{ resumenDiario()!.ai_insight }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <!-- Calorías -->
              <div class="flex flex-col items-center">
                <div class="relative w-28 h-28 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="10" fill="transparent" class="text-gray-100" />
                    <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="10" fill="transparent"
                            [attr.stroke-dasharray]="getDashArray(48)"
                            [attr.stroke-dashoffset]="getDashOffset(resumenDiario()!.resumen.calorias_consumidas, resumenDiario()!.plan_nutricional.calorias_objetivo, 48)"
                            class="text-primary-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div class="absolute flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-bold text-gray-800">{{ resumenDiario()!.resumen.calorias_consumidas | number:'1.0-0' }}</span>
                    <span class="text-[10px] text-gray-500 uppercase tracking-wider">de {{ resumenDiario()!.plan_nutricional.calorias_objetivo | number:'1.0-0' }}</span>
                  </div>
                </div>
                <span class="mt-3 font-medium text-gray-700 text-sm">Calorías</span>
              </div>

              <!-- Proteínas -->
              <div class="flex flex-col items-center">
                <div class="relative w-28 h-28 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="10" fill="transparent" class="text-gray-100" />
                    <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="10" fill="transparent"
                            [attr.stroke-dasharray]="getDashArray(48)"
                            [attr.stroke-dashoffset]="getDashOffset(resumenDiario()!.resumen.proteinas_consumidas, resumenDiario()!.plan_nutricional.proteinas_objetivo_g, 48)"
                            class="text-blue-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div class="absolute flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-bold text-gray-800">{{ resumenDiario()!.resumen.proteinas_consumidas | number:'1.0-0' }}g</span>
                    <span class="text-[10px] text-gray-500 uppercase tracking-wider">de {{ resumenDiario()!.plan_nutricional.proteinas_objetivo_g | number:'1.0-0' }}g</span>
                  </div>
                </div>
                <span class="mt-3 font-medium text-gray-700 text-sm">Proteínas</span>
              </div>

              <!-- Carbohidratos -->
              <div class="flex flex-col items-center">
                <div class="relative w-28 h-28 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="10" fill="transparent" class="text-gray-100" />
                    <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="10" fill="transparent"
                            [attr.stroke-dasharray]="getDashArray(48)"
                            [attr.stroke-dashoffset]="getDashOffset(resumenDiario()!.resumen.carbohidratos_consumidos, resumenDiario()!.plan_nutricional.carbohidratos_objetivo_g, 48)"
                            class="text-yellow-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div class="absolute flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-bold text-gray-800">{{ resumenDiario()!.resumen.carbohidratos_consumidos | number:'1.0-0' }}g</span>
                    <span class="text-[10px] text-gray-500 uppercase tracking-wider">de {{ resumenDiario()!.plan_nutricional.carbohidratos_objetivo_g | number:'1.0-0' }}g</span>
                  </div>
                </div>
                <span class="mt-3 font-medium text-gray-700 text-sm">Carbohidratos</span>
              </div>

              <!-- Grasas -->
              <div class="flex flex-col items-center">
                <div class="relative w-28 h-28 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="10" fill="transparent" class="text-gray-100" />
                    <circle cx="56" cy="56" r="48" stroke="currentColor" stroke-width="10" fill="transparent"
                            [attr.stroke-dasharray]="getDashArray(48)"
                            [attr.stroke-dashoffset]="getDashOffset(resumenDiario()!.resumen.grasas_consumidas, resumenDiario()!.plan_nutricional.grasas_objetivo_g, 48)"
                            class="text-red-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div class="absolute flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-bold text-gray-800">{{ resumenDiario()!.resumen.grasas_consumidas | number:'1.0-0' }}g</span>
                    <span class="text-[10px] text-gray-500 uppercase tracking-wider">de {{ resumenDiario()!.plan_nutricional.grasas_objetivo_g | number:'1.0-0' }}g</span>
                  </div>
                </div>
                <span class="mt-3 font-medium text-gray-700 text-sm">Grasas</span>
              </div>
            </div>
          </div>
        }

        <!-- Planificado vs Consumido hoy -->
        <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 animate-fade-in-up">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-[#146aff]"><lucide-angular [img]="ActivityIcon" [size]="18" /></div>
            <div>
              <h3 class="text-lg font-bold text-gray-800">Planificado vs Consumido hoy</h3>
              <p class="text-xs text-gray-400">Detalle de tus comidas registradas</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (momento of ['Desayuno', 'Almuerzo', 'Cena', 'Snack']; track momento) {
              <div class="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <h4 class="font-bold text-gray-800 mb-3 text-sm">{{ momento }}</h4>
                @if (getComidasPorMomento(momento).length > 0) {
                  <ul class="space-y-3">
                    @for (comida of getComidasPorMomento(momento); track comida.id) {
                      <li class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1">
                        <div class="flex justify-between items-start">
                          <span class="text-sm font-medium text-gray-800">{{ comida.nombre }}</span>
                          <span class="text-xs text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-full">{{ comida.macros.calorias }} kcal</span>
                        </div>
                        <div class="flex gap-3 text-[10px] text-gray-500 font-medium">
                          <span>P: {{ comida.macros.proteinas }}g</span>
                          <span>C: {{ comida.macros.carbohidratos }}g</span>
                          <span>G: {{ comida.macros.grasas }}g</span>
                        </div>
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="text-center py-4 bg-white rounded-lg border border-gray-100 border-dashed">
                    <p class="text-xs text-gray-400">Aún no has registrado nada</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Imagen Decorativa (Perezoso) -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up relative overflow-hidden h-72 md:h-80 w-full flex items-center justify-center">
          <img src="/perezoso.png" alt="Perezoso relajándose" class="absolute inset-0 w-full h-full object-cover" />
          <!-- Degradado inferior -->
          <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
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
export class BalanceComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly ActivityIcon = Activity;
  readonly ScaleIcon = Scale;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly calorieChartData = signal<any>(null);
  readonly resumenDiario = signal<ResumenDiario | null>(null);

  getDashArray(radius: number = 48) {
    return 2 * Math.PI * radius;
  }

  getDashOffset(consumido: number, objetivo: number, radius: number = 48) {
    if (!objetivo || objetivo <= 0) return this.getDashArray(radius);
    const pct = Math.min(consumido / objetivo, 1);
    return this.getDashArray(radius) * (1 - pct);
  }

  getComidasPorMomento(momento: string) {
    const r = this.resumenDiario();
    if (!r || !r.comidas_registradas) return [];
    return r.comidas_registradas.filter(c => c.momento.toLowerCase() === momento.toLowerCase() || (momento.toLowerCase() === 'snack' && c.momento.toLowerCase() === 'merienda'));
  }

  readonly barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: 'Inter', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} kcal`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#9ca3af' },
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#9ca3af',
          callback: (val: number) => val.toLocaleString(),
        },
        beginAtZero: true,
      },
    },
  };

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    const clienteId = this.auth.userId();
    if (!clienteId) return;

    this.loading.set(true);
    this.error.set(null);

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed >= 2) this.loading.set(false);
    };

    // Resumen Diario
    this.http
      .get<ResumenDiario>(`${environment.apiUrl}/dashboard/clientes/${clienteId}/resumen-diario`)
      .subscribe({
        next: (data) => {
          this.resumenDiario.set(data);
          checkDone();
        },
        error: () => {
          this.error.set('Error al cargar el resumen diario.');
          checkDone();
        },
      });

    // Calorie trend
    this.http
      .get<CaloriaTendencia[]>(`${environment.apiUrl}/dashboard/clientes/${clienteId}/calorias-tendencia`)
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.calorieChartData.set({
              labels: data.map(d => d.dia),
              datasets: [
                {
                  label: 'Consumidas',
                  data: data.map(d => d.consumidas),
                  backgroundColor: '#146aff',
                  borderRadius: 6,
                  borderSkipped: false,
                  barPercentage: 0.7,
                  categoryPercentage: 0.6,
                },
              ],
            });
          }
          checkDone();
        },
        error: () => {
          this.error.set('Error al cargar tendencias de calorías.');
          checkDone();
        },
      });
  }
}
