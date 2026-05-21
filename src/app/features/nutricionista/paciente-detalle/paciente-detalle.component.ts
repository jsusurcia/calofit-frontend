import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { BaseChartDirective } from 'ng2-charts';
import { LucideAngularModule, TrendingDown, Activity, CalendarDays, Target, Bot, BadgeCheck, Ban, Stethoscope } from 'lucide-angular';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface PacienteProgreso {
  id: number;
  nombre: string;
  objetivo: string;
  focus_objetivo: string;
  semana_status: string;
  historial_peso: Array<{ fecha: string; valor: number }>;
  historial_imc: Array<{ fecha: string; valor: number }>;
  alertas_salud: Array<{
    id: number;
    tipo: string;
    descripcion: string;
    severidad: string;
    estado: string;
    fecha: string;
  }>;
  metabolismo_estimado: {
    tmb: number;
    calorias_objetivo: number;
    proteinas_g: number;
    carbohidratos_g: number;
    grasas_g: number;
    distribucion: any;
  };
  today_summary: {
    calorias_consumidas: number;
    calorias_quemadas: number;
    proteinas: number;
    carbos: number;
    grasas: number;
  };
  recommended_foods: string[];
  forbidden_foods: string[];
  medical_conditions: string[];
  coach_notes: string;
  nutri_weekly_note: string;
  ai_strategic_focus: string;
  is_strategic_guide_validated: boolean;
}

interface DayPlan {
  dia: string;
  calorias: number;
  proteinas: number;
  carbos: number;
  grasas: number;
}

@Component({
  selector: 'app-paciente-detalle',
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, LucideAngularModule],
  template: `
    <!-- Loading -->
    <div *ngIf="loading()" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-3 border-blue-200 border-t-[#146aff] rounded-full animate-spin"></div>
        <span class="text-sm text-gray-400">Cargando perfil del paciente...</span>
      </div>
    </div>

    <div *ngIf="!loading() && progreso()" class="space-y-6 pb-10">
      <!-- ═══════════════ HEADER ═══════════════ -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <a routerLink="/nutricionista/pacientes"
            class="flex items-center gap-1 text-sm text-gray-400 hover:text-[#146aff] transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver
          </a>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ progreso()!.nombre }}</h1>
            <div class="flex items-center gap-2 mt-1">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#146aff]">
                {{ progreso()!.objetivo }}
              </span>
              <span [class]="getSemanaBadge(progreso()!.semana_status)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize">
                {{ progreso()!.semana_status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════ TODAY SUMMARY ═══════════════ -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Cal. consumidas</p>
          <p class="text-xl font-bold text-gray-900 mt-1">{{ progreso()!.today_summary.calorias_consumidas | number:'1.0-0' }}</p>
          <p class="text-[10px] text-gray-400">kcal</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Cal. quemadas</p>
          <p class="text-xl font-bold text-orange-500 mt-1">{{ progreso()!.today_summary.calorias_quemadas | number:'1.0-0' }}</p>
          <p class="text-[10px] text-gray-400">kcal</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Proteínas</p>
          <p class="text-xl font-bold text-emerald-600 mt-1">{{ progreso()!.today_summary.proteinas | number:'1.0-0' }}</p>
          <p class="text-[10px] text-gray-400">g</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Carbohidratos</p>
          <p class="text-xl font-bold text-[#146aff] mt-1">{{ progreso()!.today_summary.carbos | number:'1.0-0' }}</p>
          <p class="text-[10px] text-gray-400">g</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Grasas</p>
          <p class="text-xl font-bold text-yellow-500 mt-1">{{ progreso()!.today_summary.grasas | number:'1.0-0' }}</p>
          <p class="text-[10px] text-gray-400">g</p>
        </div>
      </div>

      <!-- ═══════════════ CHARTS ROW ═══════════════ -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Weight History -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><lucide-angular [img]="TrendingDownIcon" [size]="16" class="text-[#146aff]" /> Historial de Peso</h2>
          <div class="h-64" *ngIf="weightChartData()">
            <canvas baseChart
              [type]="'line'"
              [data]="weightChartData()"
              [options]="lineChartOptions">
            </canvas>
          </div>
          <p *ngIf="!progreso()!.historial_peso.length" class="text-sm text-gray-400 text-center py-10">Sin datos de peso registrados</p>
        </div>

        <!-- BMI History -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><lucide-angular [img]="ActivityIcon" [size]="16" class="text-[#146aff]" /> Historial de IMC</h2>
          <div class="h-64" *ngIf="imcChartData()">
            <canvas baseChart
              [type]="'line'"
              [data]="imcChartData()"
              [options]="lineChartOptions">
            </canvas>
          </div>
          <p *ngIf="!progreso()!.historial_imc.length" class="text-sm text-gray-400 text-center py-10">Sin datos de IMC registrados</p>
        </div>
      </div>

      <!-- ═══════════════ WEEKLY PLAN ═══════════════ -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2"><lucide-angular [img]="CalendarDaysIcon" [size]="16" class="text-[#146aff]" /> Plan Semanal</h2>
          <button (click)="savePlan()" [disabled]="savingPlan()"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ savingPlan() ? 'Guardando...' : 'Guardar plan' }}
          </button>
        </div>

        <div *ngIf="loadingPlan()" class="text-center py-8 text-sm text-gray-400">Cargando plan...</div>

        <div *ngIf="!loadingPlan()" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Día</th>
                <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Calorías</th>
                <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Proteínas (g)</th>
                <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Carbos (g)</th>
                <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Grasas (g)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of weeklyPlan(); let i = index" class="border-b border-gray-50">
                <td class="px-3 py-2">
                  <span class="text-sm font-medium text-gray-700">{{ day.dia }}</span>
                </td>
                <td class="px-3 py-2">
                  <input type="number" [(ngModel)]="day.calorias" [name]="'cal_'+i"
                    class="w-full text-center text-sm px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                </td>
                <td class="px-3 py-2">
                  <input type="number" [(ngModel)]="day.proteinas" [name]="'prot_'+i"
                    class="w-full text-center text-sm px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                </td>
                <td class="px-3 py-2">
                  <input type="number" [(ngModel)]="day.carbos" [name]="'carb_'+i"
                    class="w-full text-center text-sm px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                </td>
                <td class="px-3 py-2">
                  <input type="number" [(ngModel)]="day.grasas" [name]="'gras_'+i"
                    class="w-full text-center text-sm px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══════════════ STRATEGIC GUIDE ═══════════════ -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><lucide-angular [img]="TargetIcon" [size]="16" class="text-[#146aff]" /> Guía Estratégica</h2>

        <!-- AI Focus -->
        <div *ngIf="progreso()!.ai_strategic_focus" class="mb-6 p-4 rounded-xl border-2 border-[#146aff]/20 bg-blue-50/30">
          <div class="flex items-start gap-2">
            <lucide-angular [img]="BotIcon" [size]="18" class="mt-0.5 text-[#146aff] shrink-0" />
            <div>
              <p class="text-xs font-semibold text-[#146aff] uppercase tracking-wider mb-1">Enfoque Estratégico IA</p>
              <p class="text-sm text-gray-700 leading-relaxed">{{ progreso()!.ai_strategic_focus }}</p>
            </div>
          </div>
        </div>

        <!-- Chips Sections -->
        <div class="space-y-5">
          <!-- Recommended Foods -->
          <div>
            <label class="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2"><lucide-angular [img]="BadgeCheckIcon" [size]="14" class="text-emerald-600" /> Alimentos recomendados</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span *ngFor="let food of recommendedFoods(); let i = index"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                {{ food }}
                <button (click)="removeChip('recommended', i)" class="ml-0.5 hover:text-emerald-900 cursor-pointer">✕</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input type="text" [(ngModel)]="newRecommended" placeholder="Añadir alimento..."
                (keydown.enter)="addChip('recommended')"
                class="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
              <button (click)="addChip('recommended')" class="px-3 py-1.5 text-xs font-semibold text-[#146aff] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">Añadir</button>
            </div>
          </div>

          <!-- Forbidden Foods -->
          <div>
            <label class="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2"><lucide-angular [img]="BanIcon" [size]="14" class="text-red-500" /> Alimentos prohibidos</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span *ngFor="let food of forbiddenFoods(); let i = index"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                {{ food }}
                <button (click)="removeChip('forbidden', i)" class="ml-0.5 hover:text-red-900 cursor-pointer">✕</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input type="text" [(ngModel)]="newForbidden" placeholder="Añadir alimento..."
                (keydown.enter)="addChip('forbidden')"
                class="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
              <button (click)="addChip('forbidden')" class="px-3 py-1.5 text-xs font-semibold text-[#146aff] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">Añadir</button>
            </div>
          </div>

          <!-- Medical Conditions -->
          <div>
            <label class="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2"><lucide-angular [img]="StethoscopeIcon" [size]="14" class="text-purple-500" /> Condiciones médicas</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span *ngFor="let cond of medicalConditions(); let i = index"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                {{ cond }}
                <button (click)="removeChip('medical', i)" class="ml-0.5 hover:text-purple-900 cursor-pointer">✕</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input type="text" [(ngModel)]="newMedical" placeholder="Añadir condición..."
                (keydown.enter)="addChip('medical')"
                class="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
              <button (click)="addChip('medical')" class="px-3 py-1.5 text-xs font-semibold text-[#146aff] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">Añadir</button>
            </div>
          </div>

          <!-- Nutri Weekly Note -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">📝 Nota semanal del nutricionista</label>
            <textarea [(ngModel)]="nutriWeeklyNote" rows="3"
              placeholder="Escribe tu nota semanal para este paciente..."
              class="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all resize-none"></textarea>
          </div>
        </div>

        <button (click)="saveStrategicGuide()" [disabled]="savingGuide()"
          class="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
          {{ savingGuide() ? 'Guardando...' : 'Guardar guía estratégica' }}
        </button>
      </div>

      <!-- ═══════════════ VALIDATE PLAN ═══════════════ -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-900">✅ Validar Plan Semanal</h2>
            <p class="text-xs text-gray-400 mt-0.5">Al validar, el paciente podrá visualizar su plan actualizado</p>
          </div>
          <button (click)="validatePlan()" [disabled]="validating()"
            class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ validating() ? 'Validando...' : 'Validar plan' }}
          </button>
        </div>
      </div>

      <!-- ═══════════════ COACH NOTE ═══════════════ -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">💬 Nota para el entrenador</h2>
        <textarea [(ngModel)]="coachNote" rows="3"
          placeholder="Escribe una nota para el coach de este paciente..."
          class="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all resize-none"></textarea>
        <button (click)="saveCoachNote()" [disabled]="savingCoachNote()"
          class="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
          {{ savingCoachNote() ? 'Guardando...' : 'Guardar nota' }}
        </button>
      </div>

      <!-- ═══════════════ HEALTH ALERTS ═══════════════ -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">🚨 Alertas de Salud</h2>

        <div *ngIf="!progreso()!.alertas_salud.length" class="text-center py-8">
          <span class="text-3xl block mb-2">✨</span>
          <p class="text-sm text-gray-400">No hay alertas de salud activas</p>
        </div>

        <div class="space-y-3">
          <div *ngFor="let alerta of progreso()!.alertas_salud"
            class="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-semibold text-gray-800">{{ alerta.tipo }}</span>
                  <span [class]="getSeveridadBadge(alerta.severidad)"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize">
                    {{ alerta.severidad }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 leading-relaxed">{{ alerta.descripcion }}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 capitalize">
                  {{ alerta.estado }}
                </span>
                <p class="text-[10px] text-gray-400 mt-1">{{ alerta.fecha | date:'dd/MM/yyyy' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="!loading() && error()" class="flex flex-col items-center justify-center py-20 text-center">
      <span class="text-5xl mb-4">😕</span>
      <h3 class="text-lg font-semibold text-gray-700">Error al cargar paciente</h3>
      <p class="text-sm text-gray-400 mt-1">{{ error() }}</p>
      <a routerLink="/nutricionista/pacientes"
        class="mt-4 px-5 py-2 bg-[#146aff] text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
        Volver a pacientes
      </a>
    </div>
  `,
})
export class PacienteDetalleComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  readonly TrendingDownIcon = TrendingDown;
  readonly ActivityIcon = Activity;
  readonly CalendarDaysIcon = CalendarDays;
  readonly TargetIcon = Target;
  readonly BotIcon = Bot;
  readonly BadgeCheckIcon = BadgeCheck;
  readonly BanIcon = Ban;
  readonly StethoscopeIcon = Stethoscope;
  private toastr = inject(ToastrService);

  private pacienteId: number = 0;

  progreso = signal<PacienteProgreso | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Plan signals
  weeklyPlan = signal<DayPlan[]>([]);
  loadingPlan = signal(false);
  savingPlan = signal(false);

  // Strategic guide signals
  recommendedFoods = signal<string[]>([]);
  forbiddenFoods = signal<string[]>([]);
  medicalConditions = signal<string[]>([]);
  nutriWeeklyNote = '';
  savingGuide = signal(false);
  newRecommended = '';
  newForbidden = '';
  newMedical = '';

  // Coach note
  coachNote = '';
  savingCoachNote = signal(false);

  // Validate
  validating = signal(false);

  // Chart data
  weightChartData = signal<any>(null);
  imcChartData = signal<any>(null);

  lineChartOptions: any = {
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
      },
    },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 }, color: '#94a3b8' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8', maxRotation: 45 },
      },
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: 4, hoverRadius: 6 },
    },
  };

  ngOnInit() {
    this.pacienteId = Number(this.route.snapshot.params['id']);
    if (this.pacienteId) {
      this.loadProgreso();
      this.loadPlan();
    }
  }

  // ─── Data Loading ───

  loadProgreso() {
    this.loading.set(true);
    this.error.set(null);
    this.http
      .get<PacienteProgreso>(`http://localhost:8000/nutricionista/cliente/${this.pacienteId}/progreso`)
      .subscribe({
        next: (res) => {
          this.progreso.set(res);
          this.initFromProgreso(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.detail ?? 'Error al cargar datos del paciente');
          this.loading.set(false);
        },
      });
  }

  private initFromProgreso(p: PacienteProgreso) {
    // Chips
    this.recommendedFoods.set([...(p.recommended_foods ?? [])]);
    this.forbiddenFoods.set([...(p.forbidden_foods ?? [])]);
    this.medicalConditions.set([...(p.medical_conditions ?? [])]);
    this.nutriWeeklyNote = p.nutri_weekly_note ?? '';
    this.coachNote = p.coach_notes ?? '';

    // Weight chart
    if (p.historial_peso?.length) {
      this.weightChartData.set({
        labels: p.historial_peso.map((h) => this.formatDate(h.fecha)),
        datasets: [
          {
            data: p.historial_peso.map((h) => h.valor),
            borderColor: '#146aff',
            backgroundColor: 'rgba(20, 106, 255, 0.08)',
            fill: true,
            pointBackgroundColor: '#146aff',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      });
    }

    // IMC chart
    if (p.historial_imc?.length) {
      this.imcChartData.set({
        labels: p.historial_imc.map((h) => this.formatDate(h.fecha)),
        datasets: [
          {
            data: p.historial_imc.map((h) => h.valor),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            fill: true,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      });
    }
  }

  loadPlan() {
    this.loadingPlan.set(true);
    this.http
      .get<any>(`http://localhost:8000/nutricionista/cliente/${this.pacienteId}/plan`)
      .subscribe({
        next: (res) => {
          const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          if (Array.isArray(res) && res.length > 0) {
            this.weeklyPlan.set(
              res.map((d: any, i: number) => ({
                dia: d.dia ?? days[i] ?? `Día ${i + 1}`,
                calorias: d.calorias ?? 0,
                proteinas: d.proteinas ?? 0,
                carbos: d.carbos ?? 0,
                grasas: d.grasas ?? 0,
              }))
            );
          } else {
            this.weeklyPlan.set(
              days.map((dia) => ({ dia, calorias: 0, proteinas: 0, carbos: 0, grasas: 0 }))
            );
          }
          this.loadingPlan.set(false);
        },
        error: () => {
          const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
          this.weeklyPlan.set(
            days.map((dia) => ({ dia, calorias: 0, proteinas: 0, carbos: 0, grasas: 0 }))
          );
          this.loadingPlan.set(false);
        },
      });
  }

  // ─── Save Actions ───

  savePlan() {
    this.savingPlan.set(true);
    this.http
      .put(`http://localhost:8000/nutricionista/cliente/${this.pacienteId}/plan`, this.weeklyPlan())
      .subscribe({
        next: () => {
          this.toastr.success('Plan semanal guardado correctamente', '¡Listo!');
          this.savingPlan.set(false);
        },
        error: (err) => {
          this.toastr.error(err?.error?.detail ?? 'Error al guardar plan', 'Error');
          this.savingPlan.set(false);
        },
      });
  }

  saveStrategicGuide() {
    this.savingGuide.set(true);
    const body = {
      recommended_foods: this.recommendedFoods(),
      forbidden_foods: this.forbiddenFoods(),
      medical_conditions: this.medicalConditions(),
      nutri_weekly_note: this.nutriWeeklyNote,
    };
    this.http
      .post(`http://localhost:8000/nutricionista/actualizar-guia-estrategica/${this.pacienteId}`, body)
      .subscribe({
        next: () => {
          this.toastr.success('Guía estratégica actualizada', '¡Listo!');
          this.savingGuide.set(false);
        },
        error: (err) => {
          this.toastr.error(err?.error?.detail ?? 'Error al guardar guía', 'Error');
          this.savingGuide.set(false);
        },
      });
  }

  validatePlan() {
    this.validating.set(true);
    this.http
      .post(`http://localhost:8000/nutricionista/validar-plan/${this.pacienteId}`, {})
      .subscribe({
        next: () => {
          this.toastr.success('Plan validado exitosamente', '✅ Validado');
          this.validating.set(false);
          this.loadProgreso();
        },
        error: (err) => {
          this.toastr.error(err?.error?.detail ?? 'Error al validar plan', 'Error');
          this.validating.set(false);
        },
      });
  }

  saveCoachNote() {
    this.savingCoachNote.set(true);
    this.http
      .put(`http://localhost:8000/nutricionista/cliente/${this.pacienteId}/nota-entrenador`, {
        nota: this.coachNote,
      })
      .subscribe({
        next: () => {
          this.toastr.success('Nota guardada correctamente', '¡Listo!');
          this.savingCoachNote.set(false);
        },
        error: (err) => {
          this.toastr.error(err?.error?.detail ?? 'Error al guardar nota', 'Error');
          this.savingCoachNote.set(false);
        },
      });
  }

  // ─── Chip Helpers ───

  addChip(type: 'recommended' | 'forbidden' | 'medical') {
    if (type === 'recommended' && this.newRecommended.trim()) {
      this.recommendedFoods.update((f) => [...f, this.newRecommended.trim()]);
      this.newRecommended = '';
    } else if (type === 'forbidden' && this.newForbidden.trim()) {
      this.forbiddenFoods.update((f) => [...f, this.newForbidden.trim()]);
      this.newForbidden = '';
    } else if (type === 'medical' && this.newMedical.trim()) {
      this.medicalConditions.update((c) => [...c, this.newMedical.trim()]);
      this.newMedical = '';
    }
  }

  removeChip(type: 'recommended' | 'forbidden' | 'medical', index: number) {
    if (type === 'recommended') {
      this.recommendedFoods.update((f) => f.filter((_, i) => i !== index));
    } else if (type === 'forbidden') {
      this.forbiddenFoods.update((f) => f.filter((_, i) => i !== index));
    } else {
      this.medicalConditions.update((c) => c.filter((_, i) => i !== index));
    }
  }

  // ─── Badge Helpers ───

  getSemanaBadge(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'validado') return 'bg-emerald-50 text-emerald-700';
    if (s === 'pendiente') return 'bg-orange-50 text-orange-700';
    return 'bg-gray-100 text-gray-500';
  }

  getSeveridadBadge(severidad: string): string {
    const s = severidad?.toLowerCase();
    if (s === 'alta') return 'bg-red-50 text-red-700';
    if (s === 'media') return 'bg-yellow-50 text-yellow-700';
    return 'bg-emerald-50 text-emerald-700';
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
}
