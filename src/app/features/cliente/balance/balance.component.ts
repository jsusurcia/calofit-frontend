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
        <!-- Calorie Trend Chart -->
        <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 animate-fade-in-up">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-[#146aff]"><lucide-angular [img]="ActivityIcon" [size]="18" /></div>
            <div>
              <h3 class="text-sm font-semibold text-gray-800">Tendencia de Calorías</h3>
              <p class="text-xs text-gray-400">Consumidas vs quemadas por día</p>
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

        <!-- Weight History Chart -->
        <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 animate-fade-in-up">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center text-[#f4b400]"><lucide-angular [img]="ScaleIcon" [size]="18" /></div>
            <div>
              <h3 class="text-sm font-semibold text-gray-800">Historial de Peso</h3>
              <p class="text-xs text-gray-400">Evolución de tu peso corporal</p>
            </div>
          </div>
          @if (weightChartData()) {
            <div class="h-72">
              <canvas
                baseChart
                [type]="'line'"
                [data]="weightChartData()!"
                [options]="lineChartOptions"
              ></canvas>
            </div>
          } @else {
            <div class="h-72 flex items-center justify-center text-sm text-gray-400">
              No hay datos de peso disponibles
            </div>
          }
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
  readonly weightChartData = signal<any>(null);

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

  readonly lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` Peso: ${ctx.parsed.y} kg`,
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
          callback: (val: number) => `${val} kg`,
        },
      },
    },
    elements: {
      line: { tension: 0.4 },
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

    // Calorie trend
    this.http
      .get<CaloriaTendencia[]>(`http://localhost:8000/dashboard/clientes/${clienteId}/calorias-tendencia`)
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
                {
                  label: 'Quemadas',
                  data: data.map(d => d.quemadas),
                  backgroundColor: '#f4b400',
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

    // Weight history
    this.http
      .get<PesoHistorial[]>(`http://localhost:8000/dashboard/clientes/${clienteId}/peso-historial`)
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.weightChartData.set({
              labels: data.map(d => d.fecha),
              datasets: [
                {
                  label: 'Peso',
                  data: data.map(d => d.peso),
                  borderColor: '#146aff',
                  backgroundColor: 'rgba(20, 106, 255, 0.08)',
                  fill: true,
                  pointBackgroundColor: '#146aff',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  borderWidth: 2.5,
                },
              ],
            });
          }
          checkDone();
        },
        error: () => {
          if (!this.error()) {
            this.error.set('Error al cargar historial de peso.');
          }
          checkDone();
        },
      });
  }
}
