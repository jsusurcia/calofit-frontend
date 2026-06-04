import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AdminService, ClienteAdmin, CreateClientePayload } from '../../../core/services/admin.service';
import { LucideAngularModule, TriangleAlert, Users, UserPlus, X } from 'lucide-angular';

@Component({
  selector: 'app-admin-clientes',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Clientes</h1>
          @if (!loading()) {
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
              {{ filteredClientes().length }}
            </span>
          }
        </div>
        <button (click)="showCreateModal.set(true)"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#146aff] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-[#146aff]/20 cursor-pointer">
          <lucide-angular [img]="UserPlusIcon" [size]="16" />
          Nuevo cliente
        </button>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative max-w-md">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por nombre o email..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <p class="text-sm text-gray-500">Cargando clientes...</p>
        </div>
      }

      <!-- Error -->
      @if (error() && !loading()) {
        <div class="bg-white rounded-2xl border border-red-200 p-8 text-center">
          <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
            <lucide-angular [img]="TriangleAlertIcon" [size]="22" />
          </div>
          <p class="text-red-600 font-medium mb-1">Error al cargar clientes</p>
          <p class="text-sm text-gray-400 mb-4">{{ error() }}</p>
          <button (click)="loadClientes()" class="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors cursor-pointer">
            Reintentar
          </button>
        </div>
      }

      <!-- Content -->
      @if (!loading() && !error()) {
        @if (filteredClientes().length === 0) {
          <div class="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
              <lucide-angular [img]="UsersIcon" [size]="28" />
            </div>
            <p class="text-gray-500 font-medium">
              {{ searchQuery() ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados' }}
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
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Teléfono</th>
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Estado</th>
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Perfil</th>
                    <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Creación</th>
                    <th class="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (c of filteredClientes(); track c.id) {
                    <tr class="hover:bg-gray-50/50 transition-colors">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span class="text-primary-700 font-bold text-xs">{{ (c.nombre || '?').charAt(0).toUpperCase() }}</span>
                          </div>
                          <span class="text-sm font-medium text-gray-900">{{ c.nombre }} {{ c.apellido }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">{{ c.email }}</td>
                      <td class="px-6 py-4 text-sm text-gray-500">{{ c.telefono || '—' }}</td>
                      <td class="px-6 py-4">
                        @if (c.is_active) {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Activo
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Inactivo
                          </span>
                        }
                      </td>
                      <td class="px-6 py-4">
                        @if (c.is_profile_complete) {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Completo</span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Incompleto</span>
                        }
                      </td>
                      <td class="px-6 py-4 text-xs text-gray-400">{{ c.fecha_creacion | date:'dd/MM/yyyy' }}</td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-1">
                          <button (click)="viewDetail(c)"
                            class="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer">
                            Ver
                          </button>
                          <button (click)="deleteTargetId.set(c.id)"
                            class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer" title="Eliminar">
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
            @for (c of filteredClientes(); track c.id) {
              <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span class="text-primary-700 font-bold text-sm">{{ (c.nombre || '?').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">{{ c.nombre }} {{ c.apellido }}</p>
                      <p class="text-xs text-gray-500">{{ c.email }}</p>
                    </div>
                  </div>
                  @if (c.is_active) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Activo</span>
                  } @else {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Inactivo</span>
                  }
                </div>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button (click)="viewDetail(c)" class="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer">Ver</button>
                  <button (click)="deleteTargetId.set(c.id)" class="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">Eliminar</button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Create Modal -->
    @if (showCreateModal()) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeCreate()">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-bold text-gray-900">Nuevo cliente</h3>
            <button (click)="closeCreate()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <lucide-angular [img]="XIcon" [size]="18" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Email <span class="text-red-400">*</span></label>
              <input type="email" [(ngModel)]="form.email" placeholder="juan@ejemplo.com"
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña <span class="text-red-400">*</span></label>
              <input type="password" [(ngModel)]="form.password" placeholder="Mínimo 6 caracteres"
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input type="tel" [(ngModel)]="form.telefono" placeholder="999 999 999 (opcional)"
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all" />
            </div>
            @if (createError()) {
              <p class="text-xs text-red-500">{{ createError() }}</p>
            }
          </div>
          <div class="px-6 pb-6 flex gap-3">
            <button (click)="closeCreate()"
              class="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="createCliente()" [disabled]="creating()"
              class="flex-1 py-2.5 text-sm font-semibold text-white bg-[#146aff] hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer">
              @if (creating()) {
                <span class="flex items-center justify-center gap-2">
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creando...
                </span>
              } @else {
                Crear cliente
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Detail Modal -->
    @if (detailCliente()) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="detailCliente.set(null)">
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-bold text-gray-900">Detalle del cliente</h3>
            <button (click)="detailCliente.set(null)" class="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <lucide-angular [img]="XIcon" [size]="18" />
            </button>
          </div>
          <div class="p-6 space-y-3">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-primary-700 font-bold text-xl">{{ (detailCliente()!.nombre || '?').charAt(0).toUpperCase() }}</span>
              </div>
              <div>
                <p class="font-semibold text-gray-900">{{ detailCliente()!.nombre }} {{ detailCliente()!.apellido }}</p>
                <p class="text-sm text-gray-400">{{ detailCliente()!.email }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2">
              <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-1">Estado cuenta</p>
                @if (detailCliente()!.is_active) {
                  <span class="text-sm font-semibold text-emerald-600">Activo</span>
                } @else {
                  <span class="text-sm font-semibold text-red-500">Inactivo</span>
                }
              </div>
              <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-1">Perfil</p>
                <span class="text-sm font-semibold" [ngClass]="detailCliente()!.is_profile_complete ? 'text-blue-600' : 'text-gray-500'">
                  {{ detailCliente()!.is_profile_complete ? 'Completo' : 'Incompleto' }}
                </span>
              </div>
              <div class="bg-gray-50 rounded-xl p-3 col-span-2">
                <p class="text-xs text-gray-400 mb-1">Teléfono</p>
                <p class="text-sm font-medium text-gray-700">{{ detailCliente()!.telefono || '—' }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-3 col-span-2">
                <p class="text-xs text-gray-400 mb-1">Fecha de registro</p>
                <p class="text-sm font-medium text-gray-700">{{ detailCliente()!.fecha_creacion | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirm Modal -->
    @if (deleteTargetId() !== null) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="deleteTargetId.set(null)">
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up p-6 text-center" (click)="$event.stopPropagation()">
          <div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-angular [img]="TriangleAlertIcon" [size]="26" class="text-red-500" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Confirmar eliminación</h3>
          <p class="text-sm text-gray-500 mb-6">
            ¿Eliminar a <span class="font-semibold text-gray-700">{{ getClienteName(deleteTargetId()!) }}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div class="flex gap-3">
            <button (click)="deleteTargetId.set(null)"
              class="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="confirmDelete()" [disabled]="deleting()"
              class="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl transition-colors cursor-pointer">
              {{ deleting() ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`@reference "../../../../styles.css";`]
})
export class AdminClientesComponent {
  private adminService = inject(AdminService);
  private toastr = inject(ToastrService);

  readonly TriangleAlertIcon = TriangleAlert;
  readonly UsersIcon = Users;
  readonly UserPlusIcon = UserPlus;
  readonly XIcon = X;

  clientes = signal<ClienteAdmin[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  deleteTargetId = signal<number | null>(null);
  deleting = signal(false);
  showCreateModal = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);
  detailCliente = signal<ClienteAdmin | null>(null);

  form: CreateClientePayload = { email: '', password: '', telefono: '' };

  filteredClientes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.clientes();
    if (!q) return list;
    return list.filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  constructor() {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getClientes().subscribe({
      next: (res) => { this.clientes.set(res); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.detail || 'Error al cargar clientes'); this.loading.set(false); },
    });
  }

  getClienteName(id: number): string {
    const c = this.clientes().find(x => x.id === id);
    return c ? `${c.nombre} ${c.apellido}` : '';
  }

  viewDetail(c: ClienteAdmin): void {
    this.detailCliente.set(c);
  }

  closeCreate(): void {
    this.showCreateModal.set(false);
    this.createError.set(null);
    this.form = { email: '', password: '', telefono: '' };
  }

  createCliente(): void {
    this.createError.set(null);
    if (!this.form.email.trim()) { this.createError.set('Email requerido.'); return; }
    if (!this.form.password || this.form.password.length < 6) { this.createError.set('Contraseña mínimo 6 caracteres.'); return; }

    const payload: CreateClientePayload = {
      email: this.form.email.trim(),
      password: this.form.password,
      ...(this.form.telefono?.trim() ? { telefono: this.form.telefono.trim() } : {}),
    };

    this.creating.set(true);
    this.adminService.createCliente(payload).subscribe({
      next: (res) => {
        this.clientes.update(list => [res, ...list]);
        this.creating.set(false);
        this.closeCreate();
        this.toastr.success('Cliente creado correctamente', '¡Éxito!');
      },
      error: (err) => {
        this.createError.set(err?.error?.detail || 'Error al crear el cliente.');
        this.creating.set(false);
      },
    });
  }

  confirmDelete(): void {
    const id = this.deleteTargetId();
    if (id === null) return;
    this.deleting.set(true);
    this.adminService.deleteCliente(id).subscribe({
      next: () => {
        this.clientes.update(list => list.filter(c => c.id !== id));
        this.deleteTargetId.set(null);
        this.deleting.set(false);
        this.toastr.success('Cliente eliminado', 'Éxito');
      },
      error: (err) => {
        this.deleting.set(false);
        this.toastr.error(err?.error?.detail || 'Error al eliminar', 'Error');
      },
    });
  }
}
