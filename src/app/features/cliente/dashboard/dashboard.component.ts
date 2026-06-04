import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Sparkles, RefreshCcw, Calendar, Bot, ClipboardList, Clock } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';

interface PlanSemanal {
  plan_id: number | null;
  objetivo: string;
  dias: DiaPlan[];
}

interface DiaPlan {
  dia_numero: number;
  comidas: Record<string, string>;
}

@Component({
  selector: 'app-cliente-dashboard',
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <!-- Page Title -->
      <div class="animate-fade-in-up">
        <h1 class="text-2xl font-bold text-gray-800">Mi menú semanal</h1>
        <p class="text-sm text-gray-400 mt-1">Plan de alimentación inteligente y flexible</p>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p class="text-sm text-gray-400">Cargando tu menú...</p>
          </div>
        </div>
      }

      @if (error()) {
        <div class="bg-danger-50 border border-danger-200 text-danger-700 rounded-xl p-4 text-sm">
          {{ error() }}
        </div>
      }

      @if (data(); as plan) {
        @if (plan.plan_id) {
          <!-- Banner de Recordatorio -->
          @if (!hasReminderTime() && !reminderSaved()) {
            <div class="bg-primary-50 border border-primary-200 rounded-2xl p-5 shadow-sm animate-fade-in-up flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="bg-primary-100 p-2 rounded-full text-primary-600">
                  <lucide-angular [img]="ClockIcon" [size]="24" />
                </div>
                <div>
                  <h3 class="text-primary-800 font-bold text-sm md:text-base">¡Acelera tus resultados!</h3>
                  <p class="text-primary-600 text-xs md:text-sm">Configura a qué hora quieres que te recordemos registrar tus comidas diarias. Así la IA calculará tus macros automáticamente.</p>
                </div>
              </div>
              <div class="flex items-center gap-2 w-full md:w-auto">
                <input type="time" [(ngModel)]="reminderTimeInput" class="px-3 py-2 border border-primary-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-primary-500 w-full md:w-auto">
                <button (click)="saveReminderTime()" [disabled]="savingReminder()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50">
                  @if(savingReminder()) {
                    <lucide-angular [img]="RefreshIcon" [size]="16" class="animate-spin" />
                  } @else {
                    Guardar
                  }
                </button>
              </div>
            </div>
          }

          <!-- Tabs de Días -->
          <div class="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide animate-fade-in-up">
            @for (dia of plan.dias; track dia.dia_numero) {
              <button 
                (click)="diaSeleccionado.set(dia.dia_numero)"
                class="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer"
                [ngClass]="diaSeleccionado() === dia.dia_numero ? 'bg-primary-500 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'"
              >
                {{ getNombreDia(dia.dia_numero) }}
              </button>
            }
          </div>

          <!-- Comidas del Día Seleccionado -->
          @if (diaActual(); as diaInfo) {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
              @for (tipo of ['desayuno', 'media_manana', 'almuerzo', 'cena']; track tipo) {
                @if (diaInfo.comidas[tipo]) {
                  <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative group overflow-hidden">

                    <div class="flex justify-between items-start mb-3">
                      <h3 class="text-sm font-bold text-primary-600 uppercase tracking-wide">
                        {{ formatearTipoComida(tipo) }}
                      </h3>
                      <button
                        (click)="hacerSwap(plan.plan_id, diaInfo.dia_numero, tipo, diaInfo.comidas[tipo])"
                        [disabled]="swapping() !== null"
                        class="p-2 bg-gray-50 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded-full transition-colors cursor-pointer"
                        title="Cambiar comida"
                      >
                        <lucide-angular [img]="RefreshIcon" [size]="18" [class.animate-spin]="swapping() === tipo" />
                      </button>
                    </div>

                    <p class="text-gray-800 font-medium text-lg mb-2 leading-tight">
                      {{ diaInfo.comidas[tipo] }}
                    </p>

                    @if (swapping() === tipo) {
                      <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-2xl">
                        <lucide-angular [img]="RefreshIcon" [size]="24" class="text-primary-500 animate-spin" />
                        <span class="text-sm font-medium text-primary-600">Buscando alternativa...</span>
                      </div>
                    }

                    <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                }
              }
            </div>
          }
        } @else {
          <!-- Sin Plan -->
          <div class="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm animate-fade-in-up">
            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <lucide-angular [img]="CalendarIcon" [size]="32" />
            </div>
            <h3 class="text-lg font-bold text-gray-900">Aún no tienes un plan</h3>
            
            <div class="mt-6">
              @if (isProfileComplete()) {
                <button (click)="generarPlan()" [disabled]="generatingPlan()"
                  class="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors inline-block cursor-pointer flex items-center justify-center gap-2 mx-auto">
                  @if (generatingPlan()) {
                    <lucide-angular [img]="RefreshIcon" [size]="18" class="animate-spin" />
                    Generando...
                  } @else {
                    Generar plan semanal
                  }
                </button>
              } @else {
                <a routerLink="/cliente/onboarding" class="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors inline-block cursor-pointer">
                  Comenzar Onboarding
                </a>
              }
            </div>
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
  private readonly auth = inject(AuthService);

  readonly SparklesIcon = Sparkles;
  readonly RefreshIcon = RefreshCcw;
  readonly CalendarIcon = Calendar;
  readonly BotIcon = Bot;
  readonly ClipboardIcon = ClipboardList;
  readonly ClockIcon = Clock;

  readonly data = signal<PlanSemanal | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly diaSeleccionado = signal<number>(1);
  readonly swapping = signal<string | null>(null);
  readonly generatingPlan = signal(false);
  
  readonly reminderTimeInput = signal<string>('20:00');
  readonly savingReminder = signal(false);
  readonly reminderSaved = signal(false);

  readonly hasReminderTime = computed(() => {
    return !!this.auth.currentUser()?.meal_reminder_time;
  });

  readonly isProfileComplete = computed(() => {
    return this.auth.currentUser()?.is_profile_complete ?? false;
  });

  readonly diaActual = computed(() => {
    const plan = this.data();
    if (!plan || !plan.dias) return null;
    return plan.dias.find(d => d.dia_numero === this.diaSeleccionado()) || plan.dias[0];
  });

  constructor() {
    this.loadPlan();
  }

  private loadPlan(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<PlanSemanal>('http://localhost:8000/nutricion/plan-actual')
      .subscribe({
        next: (res) => {
          this.data.set(res);
          // Set to current day if possible
          const currentDay = new Date().getDay(); // 0=Sun, 1=Mon...
          const localDay = currentDay === 0 ? 7 : currentDay;
          if (res.dias && res.dias.find(d => d.dia_numero === localDay)) {
            this.diaSeleccionado.set(localDay);
          } else if (res.dias && res.dias.length > 0) {
            this.diaSeleccionado.set(res.dias[0].dia_numero);
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el plan semanal. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  hacerSwap(planId: number, diaNumero: number, tipoComida: string, comidaActual: string) {
    if (this.swapping()) return;
    this.swapping.set(tipoComida);

    this.http.post<any>(`http://localhost:8000/nutricion/${planId}/dia/${diaNumero}/swap`, {
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
    
    this.http.post<any>('http://localhost:8000/nutricion/generar-plan-automatico', {}).subscribe({
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

  getNombreDia(numero: number): string {
    const dias: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
    return dias[numero] || 'Día ' + numero;
  }

  saveReminderTime() {
    if (!this.reminderTimeInput() || this.savingReminder()) return;
    this.savingReminder.set(true);

    this.http.put<any>('http://localhost:8000/clientes/perfil', {
      meal_reminder_time: this.reminderTimeInput()
    }).subscribe({
      next: (res) => {
        this.savingReminder.set(false);
        this.reminderSaved.set(true);
        // Actualizar el auth service
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

  formatearTipoComida(tipo: string): string {
    if (tipo === 'media_manana') return 'Media Mañana';
    return tipo;
  }
}
