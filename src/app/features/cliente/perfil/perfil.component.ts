import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  LucideAngularModule,
  User,
  Mail,
  Activity,
  Scale,
  Ruler,
  Target,
  Shield,
  Pencil,
} from 'lucide-angular';

const API_URL = 'http://localhost:8000';

interface PerfilResponse {
  id: number;
  first_name: string;
  last_name_paternal: string;
  last_name_maternal: string;
  email: string;
  birth_date: string;
  weight: number;
  height: number;
  gender: string;
  activity_level: string;
  goal: string;
  workout_type: string;
  session_duration: number;
  medical_conditions: string[];
  profile_picture_url: string | null;
  is_profile_complete: boolean;
  meal_reminder_time: string;
}

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p class="text-sm text-gray-400">Cargando perfil...</p>
          </div>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {{ error() }}
        </div>
      }

      <!-- Contenido -->
      @if (!loading() && !error() && perfil()) {

        <!-- ── Header ── -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          <!-- Avatar -->
          <div class="w-24 h-24 rounded-full flex-shrink-0 ring-4 ring-primary-100 overflow-hidden">
            @if (perfil()!.profile_picture_url) {
              <img [src]="perfil()!.profile_picture_url" alt="Foto de perfil" class="w-full h-full object-cover" />
            } @else {
              <div class="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold">
                {{ initials() }}
              </div>
            }
          </div>

          <!-- Nombre e info -->
          <div class="flex-1 min-w-0">
            <h1 class="text-3xl font-bold text-gray-900">{{ fullName() }}</h1>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-gray-500">
              <span class="flex items-center gap-1.5">
                <lucide-angular [img]="MailIcon" [size]="14" />
                {{ perfil()!.email }}
              </span>
              <span class="text-gray-300 hidden sm:inline">•</span>
              <span class="font-semibold text-gray-700">ID: {{ perfil()!.id }}</span>
            </div>
          </div>

          <!-- Botón editar -->
          <button class="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer shrink-0">
            <lucide-angular [img]="PencilIcon" [size]="15" />
            Editar Perfil
          </button>
        </div>

        <hr class="border-gray-100" />

        <!-- ── Body ── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- ===== Columna izquierda (2/3) ===== -->
          <div class="lg:col-span-2 space-y-5">

            <!-- Información Personal -->
            <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div class="flex items-center gap-2 mb-5">
                <lucide-angular [img]="UserIcon" [size]="17" class="text-indigo-500" />
                <h2 class="text-base font-semibold text-gray-800">Información Personal</h2>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                <div>
                  <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Nombre Completo</p>
                  <p class="text-sm font-medium text-gray-800">{{ fullName() }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                  <p class="text-sm font-medium text-gray-800">{{ perfil()!.email }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Fecha de Nacimiento</p>
                  <p class="text-sm font-medium text-gray-800">{{ formatBirthDate(perfil()!.birth_date) }}</p>
                </div>
                <div>
                  <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Edad Calculada</p>
                  <p class="text-sm font-medium text-gray-800">{{ calcularEdad(perfil()!.birth_date) }} años</p>
                </div>
              </div>
            </div>

            <!-- Métricas de Salud -->
            <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div class="flex items-center gap-2 mb-5">
                <lucide-angular [img]="ActivityIcon" [size]="17" class="text-indigo-500" />
                <h2 class="text-base font-semibold text-gray-800">Métricas de Salud</h2>
              </div>
              <div class="grid grid-cols-3 gap-4 text-center">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                    <lucide-angular [img]="ScaleIcon" [size]="22" class="text-indigo-400" />
                  </div>
                  <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Peso Actual</p>
                  <p class="text-lg font-bold text-gray-800">{{ perfil()!.weight }} kg</p>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                    <lucide-angular [img]="RulerIcon" [size]="22" class="text-indigo-400" />
                  </div>
                  <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Estatura</p>
                  <p class="text-lg font-bold text-gray-800">{{ perfil()!.height }} cm</p>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                    <lucide-angular [img]="UserIcon" [size]="22" class="text-indigo-400" />
                  </div>
                  <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Género</p>
                  <p class="text-lg font-bold text-gray-800">{{ generoTexto(perfil()!.gender) }}</p>
                </div>
              </div>
            </div>

            <!-- Nivel de Actividad + Objetivo Principal -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <!-- Nivel de Actividad -->
              <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                  <lucide-angular [img]="ActivityIcon" [size]="17" class="text-indigo-500" />
                  <h2 class="text-base font-semibold text-gray-800">Nivel de Actividad</h2>
                </div>
                <div class="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3">
                  <div class="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <lucide-angular [img]="ActivityIcon" [size]="16" class="text-indigo-500" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-indigo-600">{{ perfil()!.activity_level }}</p>
                    <p class="text-xs text-gray-500">{{ actividadDescripcion(perfil()!.activity_level) }}</p>
                  </div>
                </div>
              </div>

              <!-- Objetivo Principal -->
              <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                  <lucide-angular [img]="TargetIcon" [size]="17" [ngClass]="goalIconClass(perfil()!.goal)" />
                  <h2 class="text-base font-semibold text-gray-800">Objetivo Principal</h2>
                </div>
                <div class="flex items-center gap-3 rounded-xl px-4 py-3" [ngClass]="goalBgClass(perfil()!.goal)">
                  <div class="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <lucide-angular [img]="TargetIcon" [size]="16" [ngClass]="goalIconClass(perfil()!.goal)" />
                  </div>
                  <div>
                    <p class="text-sm font-bold" [ngClass]="goalTextClass(perfil()!.goal)">{{ perfil()!.goal }}</p>
                    <p class="text-xs text-gray-500">{{ goalDescripcion(perfil()!.goal) }}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- ===== Columna derecha (1/3) ===== -->
          <div class="space-y-5">

            <!-- IMC -->
            @let imc = calcularIMC(perfil()!.weight, perfil()!.height);
            @let estadoImc = estadoIMC(imc);

            <div class="rounded-2xl p-6 border border-indigo-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-indigo-100">
              <p class="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-4">
                Índice de Masa Corporal (IMC)
              </p>
              <div class="flex flex-col items-center gap-1 py-4">
                <p class="text-6xl font-black text-gray-900 tracking-tight leading-none">{{ imc }}</p>
                <p class="text-sm text-indigo-400 mt-1">kg/m²</p>
                <span class="mt-3 px-6 py-1.5 text-white text-sm font-bold rounded-full shadow-sm" [ngClass]="estadoImc.clase">
                  Estado: {{ estadoImc.texto }}
                </span>
              </div>
              <p class="text-xs text-center text-indigo-500 leading-relaxed mt-4">
                {{ descripcionIMC(imc) }}
              </p>
            </div>

            <!-- Condiciones Médicas -->
            <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div class="flex items-center gap-2 mb-4">
                <lucide-angular [img]="ShieldIcon" [size]="17" class="text-indigo-500" />
                <h2 class="text-base font-semibold text-gray-800">Condiciones Médicas</h2>
              </div>
              @if (perfil()!.medical_conditions.length > 0) {
                <div class="flex flex-wrap gap-2">
                  @for (cond of perfil()!.medical_conditions; track cond) {
                    <span class="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {{ cond }}
                    </span>
                  }
                </div>
              } @else {
                <p class="text-sm text-gray-400">Sin condiciones médicas registradas.</p>
              }
            </div>

          </div>
        </div>
      }
    </div>
  `,
})
export class PerfilComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly perfil = signal<PerfilResponse | null>(null);

  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly ActivityIcon = Activity;
  readonly ScaleIcon = Scale;
  readonly RulerIcon = Ruler;
  readonly TargetIcon = Target;
  readonly ShieldIcon = Shield;
  readonly PencilIcon = Pencil;

  ngOnInit(): void {
    this.http.get<PerfilResponse>(`${API_URL}/clientes/perfil`).subscribe({
      next: (data) => {
        this.perfil.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el perfil. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  fullName(): string {
    const p = this.perfil();
    if (!p) return '';
    return `${p.first_name} ${p.last_name_paternal} ${p.last_name_maternal}`.trim();
  }

  initials(): string {
    const p = this.perfil();
    if (!p) return '?';
    return (p.first_name[0] + p.last_name_paternal[0]).toUpperCase();
  }

  formatBirthDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  calcularEdad(dateStr: string): number {
    const hoy = new Date();
    const nac = new Date(dateStr + 'T00:00:00');
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  generoTexto(g: string): string {
    return g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : g;
  }

  calcularIMC(peso: number, altura: number): number {
    if (!altura) return 0;
    const alturaM = altura / 100;
    return Math.round((peso / (alturaM * alturaM)) * 100) / 100;
  }

  estadoIMC(imc: number): { texto: string; clase: string } {
    if (!imc) return { texto: 'Sin datos', clase: 'bg-gray-400' };
    if (imc < 18.5) return { texto: 'Bajo peso', clase: 'bg-yellow-500' };
    if (imc < 25) return { texto: 'Normal', clase: 'bg-green-500' };
    if (imc < 30) return { texto: 'Sobrepeso', clase: 'bg-orange-500' };
    return { texto: 'Obesidad', clase: 'bg-red-500' };
  }

  descripcionIMC(imc: number): string {
    if (!imc) return 'No hay datos suficientes para calcular el IMC.';
    if (imc < 18.5) return 'Tu IMC indica que estás por debajo del rango de peso saludable.';
    if (imc < 25) return 'Tu IMC indica que te encuentras en un rango de peso saludable para tu estatura.';
    if (imc < 30) return 'Tu IMC indica un ligero exceso de peso respecto a tu estatura.';
    return 'Tu IMC indica obesidad. Se recomienda consultar a un profesional de salud.';
  }

  actividadDescripcion(nivel: string): string {
    const map: Record<string, string> = {
      'Sedentario': 'Poca o ninguna actividad',
      'Ligero': 'Ejercicio 1-3 días/semana',
      'Moderado': 'Ejercicio 3-5 días/semana',
      'Intenso': 'Ejercicio 6-7 días/semana',
      'Muy intenso': 'Ejercicio diario intenso',
    };
    return map[nivel] ?? nivel;
  }

  goalDescripcion(goal: string): string {
    const map: Record<string, string> = {
      'Perder peso': 'Enfoque en déficit calórico',
      'Mantener peso': 'Equilibrio calórico',
      'Ganar masa': 'Superávit calórico',
    };
    return map[goal] ?? goal;
  }

  goalBgClass(goal: string): string {
    switch (goal) {
      case 'Perder peso': return 'bg-rose-50';
      case 'Mantener peso': return 'bg-blue-50';
      case 'Ganar masa': return 'bg-emerald-50';
      default: return 'bg-gray-50';
    }
  }

  goalTextClass(goal: string): string {
    switch (goal) {
      case 'Perder peso': return 'text-rose-500';
      case 'Mantener peso': return 'text-blue-500';
      case 'Ganar masa': return 'text-emerald-600';
      default: return 'text-gray-600';
    }
  }

  goalIconClass(goal: string): string {
    switch (goal) {
      case 'Perder peso': return 'text-rose-400';
      case 'Mantener peso': return 'text-blue-400';
      case 'Ganar masa': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  }
}
