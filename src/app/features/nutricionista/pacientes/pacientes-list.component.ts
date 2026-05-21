import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Search, Users } from 'lucide-angular';

interface Paciente {
  id: number;
  full_name: string;
  email: string;
  goal: string;
  weight: number;
  nutri_id: number;
  coach_id: number;
  adherencia: number;
  alerta: string;
  alerta_nivel: string;
  gender: string;
  is_validated: boolean;
  is_profile_complete: boolean;
  dni: string;
  semana_status: string;
}

@Component({
  selector: 'app-pacientes-list',
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-gray-900">Pacientes</h1>
        <span *ngIf="pacientes().length > 0"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#146aff]">
          {{ filteredPacientes().length }}
        </span>
      </div>
      <button (click)="showModal.set(true)"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#146aff] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Crear paciente express
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <lucide-angular [img]="SearchIcon" [size]="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (ngModelChange)="filterPacientes()"
          placeholder="Buscar por nombre o email..."
          class="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading()" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-3 border-blue-200 border-t-[#146aff] rounded-full animate-spin"></div>
        <span class="text-sm text-gray-400">Cargando pacientes...</span>
      </div>
    </div>

    <!-- Desktop Table -->
    <div *ngIf="!loading() && filteredPacientes().length > 0" class="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Nombre</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Objetivo</th>
              <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Peso (kg)</th>
              <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Adherencia (%)</th>
              <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Semana</th>
              <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Alerta</th>
              <th class="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredPacientes()" class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td class="px-5 py-3.5">
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ p.full_name }}</p>
                  <p class="text-xs text-gray-400">{{ p.email }}</p>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-sm text-gray-600">{{ p.goal || '—' }}</span>
              </td>
              <td class="px-5 py-3.5 text-center">
                <span class="text-sm font-medium text-gray-700">{{ p.weight | number:'1.1-1' }}</span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2 justify-center">
                  <div class="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                      [style.width.%]="p.adherencia"
                      [class]="p.adherencia >= 70 ? 'bg-emerald-500' : p.adherencia >= 40 ? 'bg-yellow-400' : 'bg-red-400'">
                    </div>
                  </div>
                  <span class="text-xs font-semibold text-gray-600 w-8 text-right">{{ p.adherencia }}%</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-center">
                <span [class]="getSemanaBadge(p.semana_status)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize">
                  {{ p.semana_status || '—' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-center">
                <span [class]="getAlertaBadge(p.alerta_nivel)"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {{ p.alerta || '—' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <a [routerLink]="['/nutricionista/paciente', p.id]"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#146aff] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  Ver perfil
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Cards -->
    <div *ngIf="!loading() && filteredPacientes().length > 0" class="md:hidden space-y-3">
      <div *ngFor="let p of filteredPacientes()" class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="text-sm font-semibold text-gray-800">{{ p.full_name }}</p>
            <p class="text-xs text-gray-400">{{ p.email }}</p>
          </div>
          <div class="flex gap-1.5">
            <span [class]="getSemanaBadge(p.semana_status)"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize">
              {{ p.semana_status }}
            </span>
            <span [class]="getAlertaBadge(p.alerta_nivel)"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold">
              {{ p.alerta || '—' }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 mb-3 text-center">
          <div>
            <p class="text-[10px] text-gray-400 uppercase">Objetivo</p>
            <p class="text-xs font-medium text-gray-700 mt-0.5">{{ p.goal || '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] text-gray-400 uppercase">Peso</p>
            <p class="text-xs font-medium text-gray-700 mt-0.5">{{ p.weight | number:'1.1-1' }} kg</p>
          </div>
          <div>
            <p class="text-[10px] text-gray-400 uppercase">Adherencia</p>
            <p class="text-xs font-medium text-gray-700 mt-0.5">{{ p.adherencia }}%</p>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-3">
          <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all"
              [style.width.%]="p.adherencia"
              [class]="p.adherencia >= 70 ? 'bg-emerald-500' : p.adherencia >= 40 ? 'bg-yellow-400' : 'bg-red-400'">
            </div>
          </div>
        </div>

        <a [routerLink]="['/nutricionista/paciente', p.id]"
          class="flex items-center justify-center gap-1 w-full py-2 text-xs font-semibold text-[#146aff] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          Ver perfil
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="!loading() && filteredPacientes().length === 0 && pacientes().length > 0" class="flex flex-col items-center justify-center py-16 text-center">
      <span class="text-4xl mb-3">🔍</span>
      <p class="text-sm text-gray-400">No se encontraron pacientes con "{{ searchTerm }}"</p>
    </div>

    <div *ngIf="!loading() && pacientes().length === 0 && !error()" class="flex flex-col items-center justify-center py-20 text-center gap-3">
      <lucide-angular [img]="UsersIcon" [size]="48" class="text-gray-200" />
      <h3 class="text-lg font-semibold text-gray-700">Sin pacientes aún</h3>
      <p class="text-sm text-gray-400">Crea tu primer paciente para comenzar</p>
    </div>

    <!-- Create Modal -->
    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div (click)="closeModal()" class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <button (click)="closeModal()"
          class="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div class="mb-5">
          <h2 class="text-lg font-bold text-gray-900">Crear paciente</h2>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
          <button (click)="modalTab.set('express')"
            class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer"
            [ngClass]="modalTab() === 'express' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
            Express (DNI)
          </button>
          <button (click)="modalTab.set('completo')"
            class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer"
            [ngClass]="modalTab() === 'completo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
            Completo
          </button>
        </div>

        <!-- Tab Express -->
        <div *ngIf="modalTab() === 'express'" class="space-y-4">
          <p class="text-xs text-gray-400 -mt-2">El DNI se usa como contraseña temporal. El paciente la cambiará al ingresar.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" [(ngModel)]="newEmail" name="email"
              placeholder="paciente@email.com"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">DNI</label>
            <input type="text" [(ngModel)]="newDni" name="dni"
              placeholder="12345678A"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
          </div>
          <div class="flex gap-3 pt-1">
            <button type="button" (click)="closeModal()"
              class="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="button" (click)="createExpressPaciente()" [disabled]="creating()"
              class="flex-1 py-2.5 text-sm font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
              {{ creating() ? 'Creando...' : 'Crear paciente' }}
            </button>
          </div>
        </div>

        <!-- Tab Completo -->
        <div *ngIf="modalTab() === 'completo'" class="space-y-4">
          <p class="text-xs text-gray-400 -mt-2">Crea el paciente con contraseña personalizada y datos opcionales.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Email <span class="text-red-400">*</span></label>
            <input type="email" [(ngModel)]="compEmail" name="compEmail"
              placeholder="paciente@email.com"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña <span class="text-red-400">*</span></label>
            <input type="password" [(ngModel)]="compPassword" name="compPassword"
              placeholder="Mínimo 6 caracteres"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input type="text" [(ngModel)]="compFirstName" name="compFirstName"
                placeholder="Nombre"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Apellido paterno</label>
              <input type="text" [(ngModel)]="compLastNamePaternal" name="compLastNamePaternal"
                placeholder="Apellido paterno"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Apellido materno</label>
            <input type="text" [(ngModel)]="compLastNameMaternal" name="compLastNameMaternal"
              placeholder="Apellido materno (opcional)"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all" />
          </div>
          <div class="flex gap-3 pt-1">
            <button type="button" (click)="closeModal()"
              class="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="button" (click)="createCompletoPaciente()" [disabled]="creating()"
              class="flex-1 py-2.5 text-sm font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
              {{ creating() ? 'Creando...' : 'Crear paciente' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PacientesListComponent implements OnInit {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  readonly SearchIcon = Search;
  readonly UsersIcon = Users;

  pacientes = signal<Paciente[]>([]);
  filteredPacientes = signal<Paciente[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showModal = signal(false);
  creating = signal(false);
  modalTab = signal<'express' | 'completo'>('express');

  searchTerm = '';
  newEmail = '';
  newDni = '';

  compEmail = '';
  compPassword = '';
  compFirstName = '';
  compLastNamePaternal = '';
  compLastNameMaternal = '';

  ngOnInit() {
    this.loadPacientes();
  }

  loadPacientes() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Paciente[]>('http://localhost:8000/nutricionista/clientes').subscribe({
      next: (res) => {
        this.pacientes.set(res);
        this.filteredPacientes.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Error al cargar pacientes');
        this.loading.set(false);
      },
    });
  }

  filterPacientes() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredPacientes.set(this.pacientes());
      return;
    }
    this.filteredPacientes.set(
      this.pacientes().filter(
        (p) =>
          p.full_name?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term)
      )
    );
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalTab.set('express');
    this.newEmail = '';
    this.newDni = '';
    this.compEmail = '';
    this.compPassword = '';
    this.compFirstName = '';
    this.compLastNamePaternal = '';
    this.compLastNameMaternal = '';
  }

  createExpressPaciente(): void {
    if (!this.newEmail || !this.newDni) {
      this.toastr.warning('Email y DNI son requeridos', 'Atención');
      return;
    }
    this.creating.set(true);
    this.http
      .post('http://localhost:8000/nutricionista/clientes/express', {
        email: this.newEmail,
        dni: this.newDni,
        assigned_coach_id: null,
      })
      .subscribe({
        next: () => {
          this.toastr.success('Paciente creado exitosamente', '¡Listo!');
          this.closeModal();
          this.creating.set(false);
          this.loadPacientes();
        },
        error: (err) => {
          this.toastr.error(err?.error?.detail ?? 'Error al crear paciente', 'Error');
          this.creating.set(false);
        },
      });
  }

  createCompletoPaciente(): void {
    if (!this.compEmail || !this.compPassword) {
      this.toastr.warning('Email y contraseña son requeridos', 'Atención');
      return;
    }
    if (this.compPassword.length < 6) {
      this.toastr.warning('La contraseña debe tener al menos 6 caracteres', 'Atención');
      return;
    }
    this.creating.set(true);
    const body: any = { email: this.compEmail, password: this.compPassword };
    if (this.compFirstName) body.first_name = this.compFirstName;
    if (this.compLastNamePaternal) body.last_name_paternal = this.compLastNamePaternal;
    if (this.compLastNameMaternal) body.last_name_maternal = this.compLastNameMaternal;

    this.http.post('http://localhost:8000/clientes/admin-crear', body).subscribe({
      next: () => {
        this.toastr.success('Paciente creado exitosamente', '¡Listo!');
        this.closeModal();
        this.creating.set(false);
        this.loadPacientes();
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al crear paciente', 'Error');
        this.creating.set(false);
      },
    });
  }

  createPaciente(): void {
    this.createExpressPaciente();
  }

  getSemanaBadge(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'validado') return 'bg-emerald-50 text-emerald-700';
    if (s === 'pendiente') return 'bg-orange-50 text-orange-700';
    return 'bg-gray-100 text-gray-500';
  }

  getAlertaBadge(nivel: string): string {
    const n = nivel?.toLowerCase();
    if (n === 'alto') return 'bg-red-50 text-red-700';
    if (n === 'medio') return 'bg-yellow-50 text-yellow-700';
    if (n === 'bajo') return 'bg-emerald-50 text-emerald-700';
    return 'bg-gray-100 text-gray-500';
  }
}
