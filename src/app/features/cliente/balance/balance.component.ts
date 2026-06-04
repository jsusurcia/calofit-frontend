import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { LucideAngularModule, Activity, Scale } from 'lucide-angular';
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

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <!-- Calorías -->
              <div class="flex flex-col">
                <div class="flex justify-between mb-1 text-sm">
                  <span class="font-medium text-gray-700">Calorías</span>
                  <span class="text-gray-500">{{ resumenDiario()!.resumen.calorias_consumidas | number:'1.0-0' }} / {{ resumenDiario()!.plan_nutricional.calorias_objetivo | number:'1.0-0' }} kcal</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2.5">
                  <div class="bg-primary-500 h-2.5 rounded-full transition-all duration-500" [style.width.%]="(resumenDiario()!.resumen.calorias_consumidas / resumenDiario()!.plan_nutricional.calorias_objetivo) * 100 | number:'1.0-0'"></div>
                </div>
              </div>

              <!-- Proteínas -->
              <div class="flex flex-col">
                <div class="flex justify-between mb-1 text-sm">
                  <span class="font-medium text-gray-700">Proteínas</span>
                  <span class="text-gray-500">{{ resumenDiario()!.resumen.proteinas_consumidas | number:'1.0-0' }} / {{ resumenDiario()!.plan_nutricional.proteinas_objetivo_g | number:'1.0-0' }}g</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2.5">
                  <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" [style.width.%]="(resumenDiario()!.resumen.proteinas_consumidas / resumenDiario()!.plan_nutricional.proteinas_objetivo_g) * 100 | number:'1.0-0'"></div>
                </div>
              </div>

              <!-- Carbohidratos -->
              <div class="flex flex-col">
                <div class="flex justify-between mb-1 text-sm">
                  <span class="font-medium text-gray-700">Carbohidratos</span>
                  <span class="text-gray-500">{{ resumenDiario()!.resumen.carbohidratos_consumidos | number:'1.0-0' }} / {{ resumenDiario()!.plan_nutricional.carbohidratos_objetivo_g | number:'1.0-0' }}g</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2.5">
                  <div class="bg-yellow-500 h-2.5 rounded-full transition-all duration-500" [style.width.%]="(resumenDiario()!.resumen.carbohidratos_consumidos / resumenDiario()!.plan_nutricional.carbohidratos_objetivo_g) * 100 | number:'1.0-0'"></div>
                </div>
              </div>

              <!-- Grasas -->
              <div class="flex flex-col">
                <div class="flex justify-between mb-1 text-sm">
                  <span class="font-medium text-gray-700">Grasas</span>
                  <span class="text-gray-500">{{ resumenDiario()!.resumen.grasas_consumidas | number:'1.0-0' }} / {{ resumenDiario()!.plan_nutricional.grasas_objetivo_g | number:'1.0-0' }}g</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2.5">
                  <div class="bg-red-500 h-2.5 rounded-full transition-all duration-500" [style.width.%]="(resumenDiario()!.resumen.grasas_consumidas / resumenDiario()!.plan_nutricional.grasas_objetivo_g) * 100 | number:'1.0-0'"></div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Calorie Trend Chart -->
        <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 animate-fade-in-up">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-[#146aff]"><lucide-angular [img]="ActivityIcon" [size]="18" /></div>
            <div>
              <h3 class="text-sm font-semibold text-gray-800">Tendencia de calorías</h3>
              <p class="text-xs text-gray-400">Calorías consumidas por día</p>
            </div>
          </div>
          @if (calorieChartData()) {
            <div class="h-72">
              <canvas
                baseChart
                [type]="'bar'"
                [data]="calorieChartData()!"
                [options]="barChartOptions"
              ></canvas>
            </div>
          } @else {
            <div class="h-72 flex items-center justify-center text-sm text-gray-400">
              No hay datos de calorías disponibles
            </div>
          }
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
      .get<ResumenDiario>(`http://calofitbackendmarketing-production.up.railway.app/dashboard/clientes/${clienteId}/resumen-diario`)
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
      .get<CaloriaTendencia[]>(`http://calofitbackendmarketing-production.up.railway.app/dashboard/clientes/${clienteId}/calorias-tendencia`)
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
