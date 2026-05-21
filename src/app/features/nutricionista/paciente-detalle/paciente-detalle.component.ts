import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { BaseChartDirective } from 'ng2-charts';
import { LucideAngularModule, TrendingDown, Activity, CalendarDays, Target, Bot, BadgeCheck, Ban, Stethoscope, CreditCard, Plus, Eye, RefreshCw, Smartphone, Banknote, CircleX } from 'lucide-angular';
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

interface Pago {
  id: number;
  metodo_pago: 'yape' | 'efectivo';
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  monto: number | null;
  concepto: string | null;
  comprobante_url: string | null;
  fecha_pago: string;
  notas_admin: string | null;
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
          <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><lucide-angular [img]="TrendingDownIcon" [size]="16" class="text-[#146aff]" /> Historial de peso</h2>
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
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2"><lucide-angular [img]="CalendarDaysIcon" [size]="16" class="text-[#146aff]" /> Plan semanal</h2>
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
        <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><lucide-angular [img]="TargetIcon" [size]="16" class="text-[#146aff]" /> Guía estratégica</h2>

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
            <h2 class="text-base font-semibold text-gray-900">✅ Validar plan semanal</h2>
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

      <!-- ═══════════════ PAGOS ═══════════════ -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900 flex items-center gap-2">
            <lucide-angular [img]="CreditCardIcon" [size]="16" class="text-[#146aff]" />
            Pagos
          </h2>
          <button (click)="openPagoModal()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
            <lucide-angular [img]="PlusIcon" [size]="13" />
            Registrar pago
          </button>
        </div>

        @if (loadingPagos()) {
          <div class="flex items-center justify-center py-8">
            <div class="w-6 h-6 border-2 border-blue-200 border-t-[#146aff] rounded-full animate-spin"></div>
          </div>
        }

        @if (!loadingPagos() && pagos().length === 0) {
          <p class="text-center text-sm text-gray-400 py-6">Sin pagos registrados</p>
        }

        @if (!loadingPagos() && pagos().length > 0) {
          <div class="space-y-2">
            @for (pago of pagos(); track pago.id) {
              <div class="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                    [ngClass]="pago.metodo_pago === 'yape' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'">
                    <lucide-angular [img]="pago.metodo_pago === 'yape' ? SmartphoneIcon : BanknoteIcon" [size]="15" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">
                      {{ pago.concepto || 'Sin concepto' }}
                      @if (pago.monto != null) { <span class="text-gray-500">— S/ {{ pago.monto | number:'1.2-2' }}</span> }
                    </p>
                    <p class="text-xs text-gray-400">{{ pago.fecha_pago | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                </div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="getEstadoPagoBadge(pago.estado)">
                  {{ pago.estado }}
                </span>
              </div>
            }
          </div>
        }
      </div>

      <!-- ═══════════════ HEALTH ALERTS ═══════════════ -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">🚨 Alertas de salud</h2>

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

    <!-- Registrar Pago Modal -->
    @if (showPagoModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" (click)="closePagoModal()">
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-gray-900">Registrar pago</h3>
            <button (click)="closePagoModal()" class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <lucide-angular [img]="CircleXIcon" [size]="20" />
            </button>
          </div>

          @if (pagoStep() === 1) {
            <p class="text-sm text-gray-500 mb-4">Selecciona el método de pago</p>
            <div class="grid grid-cols-2 gap-3">
              <button (click)="pagoMetodo.set('yape'); pagoStep.set(2)"
                class="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer">
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  <lucide-angular [img]="SmartphoneIcon" [size]="24" />
                </div>
                <span class="text-sm font-semibold text-gray-700">Yape</span>
              </button>
              <button (click)="pagoMetodo.set('efectivo'); pagoStep.set(2)"
                class="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <lucide-angular [img]="BanknoteIcon" [size]="24" />
                </div>
                <span class="text-sm font-semibold text-gray-700">Efectivo</span>
              </button>
            </div>
          }

          @if (pagoStep() === 2) {
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="pagoMetodo() === 'yape' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'">
                  <lucide-angular [img]="pagoMetodo() === 'yape' ? SmartphoneIcon : BanknoteIcon" [size]="12" />
                  {{ pagoMetodo() === 'yape' ? 'Yape' : 'Efectivo' }}
                </span>
                <button (click)="pagoStep.set(1)" class="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">Cambiar</button>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Monto (S/)</label>
                <input type="number" [(ngModel)]="pagoMonto" placeholder="0.00" min="0" step="0.01"
                  class="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Concepto</label>
                <input type="text" [(ngModel)]="pagoConcepto" placeholder="Membresía"
                  class="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
              </div>

              @if (pagoMetodo() === 'yape') {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Comprobante (imagen)</label>
                  <input type="file" accept="image/*" (change)="onFileChange($event)"
                    class="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all cursor-pointer" />
                </div>
                <div class="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                  <lucide-angular [img]="SmartphoneIcon" [size]="14" class="shrink-0 mt-0.5" />
                  <span>El paciente debe enviar foto del comprobante por WhatsApp. El admin validará el pago manualmente.</span>
                </div>
              }

              <div class="flex gap-3 pt-1">
                <button (click)="closePagoModal()"
                  class="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button (click)="registerPago()" [disabled]="registrando()"
                  class="flex-1 py-2.5 text-sm font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
                  {{ registrando() ? 'Registrando...' : 'Registrar pago' }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }

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
  readonly CreditCardIcon = CreditCard;
  readonly PlusIcon = Plus;
  readonly EyeIcon = Eye;
  readonly SmartphoneIcon = Smartphone;
  readonly BanknoteIcon = Banknote;
  readonly CircleXIcon = CircleX;
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

  // Pagos
  pagos = signal<Pago[]>([]);
  loadingPagos = signal(false);
  showPagoModal = signal(false);
  pagoStep = signal<1 | 2>(1);
  pagoMetodo = signal<'yape' | 'efectivo' | null>(null);
  pagoMonto = '';
  pagoConcepto = 'Membresía';
  pagoFile: File | null = null;
  registrando = signal(false);

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
      this.loadPagos();
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
          const detalles = res?.detalles_diarios;
          if (Array.isArray(detalles) && detalles.length > 0) {
            this.weeklyPlan.set(
              detalles.map((d: any, i: number) => ({
                dia: days[i] ?? `Día ${i + 1}`,
                calorias: d.calorias_dia ?? 0,
                proteinas: d.proteinas_g ?? 0,
                carbos: d.carbohidratos_g ?? 0,
                grasas: d.grasas_g ?? 0,
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
    const payload = {
      detalles_diarios: this.weeklyPlan().map((d) => ({
        calorias_dia: d.calorias,
        proteinas_g: d.proteinas,
        carbohidratos_g: d.carbos,
        grasas_g: d.grasas,
        estado: 'oficial',
      })),
    };
    this.http
      .put(`http://localhost:8000/nutricionista/cliente/${this.pacienteId}/plan`, payload)
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

  // ─── Pagos ───

  loadPagos() {
    this.loadingPagos.set(true);
    this.http.get<Pago[]>(`http://localhost:8000/pagos/cliente/${this.pacienteId}`).subscribe({
      next: (res) => {
        this.pagos.set(res);
        this.loadingPagos.set(false);
      },
      error: () => this.loadingPagos.set(false),
    });
  }

  openPagoModal() {
    this.pagoStep.set(1);
    this.pagoMetodo.set(null);
    this.pagoMonto = '';
    this.pagoConcepto = 'Membresía';
    this.pagoFile = null;
    this.showPagoModal.set(true);
  }

  closePagoModal() {
    this.showPagoModal.set(false);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.pagoFile = input.files?.[0] ?? null;
  }

  registerPago() {
    const metodo = this.pagoMetodo();
    if (!metodo) return;
    this.registrando.set(true);
    const body = {
      client_id: this.pacienteId,
      metodo_pago: metodo,
      monto: this.pagoMonto ? Number(this.pagoMonto) : null,
      concepto: this.pagoConcepto || 'Membresía',
    };
    this.http.post<{ id: number }>('http://localhost:8000/pagos/registrar', body).subscribe({
      next: (pago) => {
        if (metodo === 'yape' && this.pagoFile) {
          const fd = new FormData();
          fd.append('file', this.pagoFile);
          this.http.post(`http://localhost:8000/pagos/${pago.id}/comprobante`, fd).subscribe({
            next: () => this.finishPago(),
            error: () => this.finishPago(),
          });
        } else {
          this.finishPago();
        }
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al registrar pago', 'Error');
        this.registrando.set(false);
      },
    });
  }

  private finishPago() {
    this.toastr.success('Pago registrado. Pendiente de validación admin', 'Registrado');
    this.registrando.set(false);
    this.closePagoModal();
    this.loadPagos();
  }

  getEstadoPagoBadge(estado: string): string {
    if (estado === 'aprobado') return 'bg-emerald-50 text-emerald-700';
    if (estado === 'rechazado') return 'bg-red-50 text-red-600';
    return 'bg-yellow-50 text-yellow-700';
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
