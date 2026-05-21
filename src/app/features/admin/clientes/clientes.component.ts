import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, TriangleAlert, Users } from 'lucide-angular';

interface ClienteAdmin {
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
  selector: 'app-admin-clientes',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Todos los Clientes</h1>
          @if (!loading()) {
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
              {{ filteredClientes().length }}
            </span>
          }
        </div>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative max-w-md">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por nombre o email..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white rounded-2xl border border-gray-200 p-12">
          <div class="flex flex-col items-center justify-center gap-3">
            <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500 font-medium">Cargando clientes...</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error() && !loading()) {
        <div class="bg-white rounded-2xl border border-danger-200 p-8 text-center">
          <div class="w-12 h-12 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-3 text-danger-500">
            <lucide-angular [img]="TriangleAlertIcon" [size]="22" />
          </div>
          <p class="text-danger-600 font-medium mb-2">Error al cargar clientes</p>
          <p class="text-sm text-gray-500 mb-4">{{ error() }}</p>
          <button (click)="loadClientes()" class="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors cursor-pointer">
            Reintentar
          </button>
        </div>
      }

      <!-- Content -->
      @if (!loading() && !error()) {
        <!-- Empty state -->
        @if (filteredClientes().length === 0) {
          <div class="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
              <lucide-angular [img]="UsersIcon" [size]="28" />
            </div>
            <p class="text-gray-500 font-medium">
              {{ searchQuery() ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados' }}
            </p>
          </div>
        }

        @if (filteredClientes().length > 0) {
          <!-- Desktop Table -->
          <div class="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Nombre</th>
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Email</th>
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">DNI</th>
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Objetivo</th>
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Peso</th>
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Estado perfil</th>
                    <th class="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (cliente of filteredClientes(); track cliente.id) {
                    <tr class="hover:bg-gray-50/50 transition-colors duration-150">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span class="text-primary-700 font-bold text-xs">{{ cliente.full_name.charAt(0).toUpperCase() }}</span>
                          </div>
                          <span class="text-sm font-medium text-gray-900">{{ cliente.full_name }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">{{ cliente.email }}</td>
                      <td class="px-6 py-4 text-sm text-gray-500 font-mono">{{ cliente.dni || '—' }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600 capitalize">{{ cliente.goal || '—' }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600 font-medium">{{ cliente.weight ? (cliente.weight + ' kg') : '—' }}</td>
                      <td class="px-6 py-4">
                        @if (cliente.is_profile_complete) {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-100 text-success-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-success-500"></span>
                            Completo
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-100 text-danger-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-danger-500"></span>
                            Incompleto
                          </span>
                        }
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-1">
                          <button
                            (click)="onViewProfile(cliente)"
                            class="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer">
                            Ver perfil
                          </button>
                          <button
                            (click)="deleteTargetId.set(cliente.id)"
                            class="p-2 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-50 transition-colors duration-150 cursor-pointer"
                            title="Eliminar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden space-y-3">
            @for (cliente of filteredClientes(); track cliente.id) {
              <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span class="text-primary-700 font-bold text-sm">{{ cliente.full_name.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">{{ cliente.full_name }}</p>
                      <p class="text-xs text-gray-500">{{ cliente.email }}</p>
                    </div>
                  </div>
                  @if (cliente.is_profile_complete) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-100 text-success-700">Completo</span>
                  } @else {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger-100 text-danger-700">Incompleto</span>
                  }
                </div>

                <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div>
                    <p class="text-gray-400 font-medium">DNI</p>
                    <p class="text-gray-700 font-mono">{{ cliente.dni || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 font-medium">Objetivo</p>
                    <p class="text-gray-700 capitalize">{{ cliente.goal || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 font-medium">Peso</p>
                    <p class="text-gray-700 font-medium">{{ cliente.weight ? (cliente.weight + ' kg') : '—' }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    (click)="onViewProfile(cliente)"
                    class="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer">
                    Ver perfil
                  </button>
                  <button
                    (click)="deleteTargetId.set(cliente.id)"
                    class="px-3 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer">
                    Eliminar
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Delete Confirmation Modal -->
      @if (deleteTargetId() !== null) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="deleteTargetId.set(null)">
          <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up" (click)="$event.stopPropagation()">
            <div class="p-6 text-center">
              <div class="w-14 h-14 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-7 h-7 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-2">Confirmar eliminación</h3>
              <p class="text-sm text-gray-500">
                ¿Estás seguro de eliminar a <span class="font-semibold text-gray-700">{{ getClienteName(deleteTargetId()!) }}</span>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div class="px-6 pb-6 flex items-center justify-center gap-3">
              <button
                (click)="deleteTargetId.set(null)"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                (click)="confirmDelete()"
                [disabled]="deleting()"
                class="px-5 py-2.5 text-sm font-semibold text-white bg-danger-500 hover:bg-danger-600 disabled:opacity-50 rounded-xl transition-colors shadow-md shadow-danger-500/20 cursor-pointer">
                @if (deleting()) {
                  <span class="flex items-center gap-2">
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Eliminando...
                  </span>
                } @else {
                  Eliminar
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";
  `]
})
export class AdminClientesComponent {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  readonly TriangleAlertIcon = TriangleAlert;
  readonly UsersIcon = Users;

  clientes = signal<ClienteAdmin[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  deleteTargetId = signal<number | null>(null);
  deleting = signal(false);

  filteredClientes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.clientes();
    if (!query) return list;
    return list.filter(c =>
      c.full_name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<ClienteAdmin[]>('http://localhost:8000/nutricionista/clientes').subscribe({
      next: (res) => {
        this.clientes.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'No se pudieron cargar los clientes');
        this.loading.set(false);
      },
    });
  }

  getClienteName(id: number): string {
    const c = this.clientes().find(x => x.id === id);
    return c?.full_name ?? '';
  }

  onViewProfile(cliente: ClienteAdmin): void {
    this.toastr.info(`Vista de perfil de "${cliente.full_name}" próximamente`, 'Funcionalidad próximamente');
  }

  confirmDelete(): void {
    const id = this.deleteTargetId();
    if (id === null) return;

    this.deleting.set(true);
    this.http.delete(`http://localhost:8000/nutricionista/cliente/${id}`).subscribe({
      next: () => {
        this.clientes.update(list => list.filter(c => c.id !== id));
        this.deleteTargetId.set(null);
        this.deleting.set(false);
        this.toastr.success('Cliente eliminado correctamente', 'Éxito');
      },
      error: (err) => {
        this.deleting.set(false);
        this.toastr.error(err?.error?.detail || 'Error al eliminar el cliente', 'Error');
      },
    });
  }
}
