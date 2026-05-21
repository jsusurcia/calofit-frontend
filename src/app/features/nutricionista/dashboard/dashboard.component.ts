import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { LucideAngularModule, Users, ClipboardList, TriangleAlert, TrendingUp, PartyPopper, CircleAlert } from 'lucide-angular';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface NutriStats {
  total_pacientes: number;
  validaciones_pendientes: number;
  alertas_criticas: number;
  adherencia_media: number;
  tendencia_adherencia: number[];
  alertas_recientes: Array<{
    id: number;
    paciente: string;
    problema: string;
    urgencia: string;
    tipo: string;
  }>;
}

@Component({
  selector: 'app-nutricionista-dashboard',
  imports: [CommonModule, BaseChartDirective, LucideAngularModule],
  template: `
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-sm text-gray-500 mt-1">Resumen general de tu práctica</p>
    </div>

    <!-- Loading State -->
    <div *ngIf="loading()" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-3 border-blue-200 border-t-[#146aff] rounded-full animate-spin"></div>
        <span class="text-sm text-gray-400">Cargando datos...</span>
      </div>
    </div>

    <!-- Content -->
    <div *ngIf="!loading() && stats()">
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <!-- Total Pacientes -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="h-1 bg-[#146aff]"></div>
          <div class="p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Pacientes</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats()!.total_pacientes }}</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#146aff]"><lucide-angular [img]="UsersIcon" [size]="22" /></div>
            </div>
          </div>
        </div>

        <!-- Validaciones Pendientes -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="h-1 bg-orange-400"></div>
          <div class="p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Validaciones Pendientes</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats()!.validaciones_pendientes }}</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500"><lucide-angular [img]="ClipboardListIcon" [size]="22" /></div>
            </div>
          </div>
        </div>

        <!-- Alertas Críticas -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="h-1 bg-red-500"></div>
          <div class="p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Alertas Críticas</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats()!.alertas_criticas }}</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500"><lucide-angular [img]="TriangleAlertIcon" [size]="22" /></div>
            </div>
          </div>
        </div>

        <!-- Adherencia Media -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="h-1 bg-emerald-500"></div>
          <div class="p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Adherencia Media</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats()!.adherencia_media }}%</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><lucide-angular [img]="TrendingUpIcon" [size]="22" /></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart & Alerts Row -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Adherencia Chart -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Tendencia de adherencia</h2>
          <div class="h-64">
            <canvas baseChart
              [type]="'bar'"
              [data]="chartData()"
              [options]="chartOptions">
            </canvas>
          </div>
        </div>

        <!-- Alertas Recientes -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Alertas recientes</h2>

          <div *ngIf="stats()!.alertas_recientes.length === 0" class="flex flex-col items-center py-10 text-gray-400 gap-2">
            <lucide-angular [img]="PartyPopperIcon" [size]="36" class="text-emerald-400" />
            <p class="text-sm">No hay alertas recientes</p>
          </div>

          <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
            <div *ngFor="let alerta of stats()!.alertas_recientes"
              class="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-800">{{ alerta.paciente }}</p>
                  <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ alerta.problema }}</p>
                </div>
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <span [class]="getUrgenciaBadge(alerta.urgencia)"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    {{ alerta.urgencia }}
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#146aff] text-[#146aff] bg-blue-50/50">
                    {{ alerta.tipo }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="!loading() && error()" class="flex flex-col items-center justify-center py-20 text-center gap-3">
      <lucide-angular [img]="CircleAlertIcon" [size]="48" class="text-gray-300" />
      <h3 class="text-lg font-semibold text-gray-700">Error al cargar datos</h3>
      <p class="text-sm text-gray-400 mt-1">{{ error() }}</p>
      <button (click)="loadStats()" class="mt-4 px-5 py-2 bg-[#146aff] text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
        Reintentar
      </button>
    </div>
  `,
})
export class NutricionistaDashboardComponent implements OnInit {
  private http = inject(HttpClient);

  readonly UsersIcon = Users;
  readonly ClipboardListIcon = ClipboardList;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly TrendingUpIcon = TrendingUp;
  readonly PartyPopperIcon = PartyPopper;
  readonly CircleAlertIcon = CircleAlert;

  stats = signal<NutriStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 11 },
          color: '#94a3b8',
          callback: (v: number) => `${v}%`,
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#94a3b8' },
      },
    },
  };

  chartData = signal<any>({
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [],
        backgroundColor: 'rgba(20, 106, 255, 0.8)',
        hoverBackgroundColor: 'rgba(20, 106, 255, 1)',
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.6,
      },
    ],
  });

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<NutriStats>('http://localhost:8000/nutricionista/stats').subscribe({
      next: (res) => {
        this.stats.set(res);
        this.chartData.set({
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          datasets: [
            {
              data: res.tendencia_adherencia ?? [],
              backgroundColor: 'rgba(20, 106, 255, 0.8)',
              hoverBackgroundColor: 'rgba(20, 106, 255, 1)',
              borderRadius: 8,
              borderSkipped: false,
              barPercentage: 0.6,
            },
          ],
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'No se pudieron cargar las estadísticas');
        this.loading.set(false);
      },
    });
  }

  getUrgenciaBadge(urgencia: string): string {
    const u = urgencia?.toLowerCase();
    if (u === 'alta') return 'bg-red-50 text-red-700';
    if (u === 'media') return 'bg-yellow-50 text-yellow-700';
    return 'bg-emerald-50 text-emerald-700';
  }
}
