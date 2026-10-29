import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AdminService, ClienteAdmin, CreateClientePayload } from '../../../core/services/admin.service';
import { LucideAngularModule, TriangleAlert, Users, UserPlus, UserX, UserCheck, X } from 'lucide-angular';

type StatusFilter = 'todos' | 'activos' | 'inactivos' | 'incompleto';

@Component({
  selector: 'app-admin-clientes',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl md:text-3xl font-extrabold text-teal-deep">Clientes</h1>
            @if (!loading()) {
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-pale text-teal-deep">
                {{ filteredClientes().length }}
              </span>
            }
          </div>
          <p class="text-ink-soft mt-1 text-sm">Crea cuentas, revisa perfiles y gestiona el acceso de tus usuarios.</p>
        </div>
        <button (click)="showCreateModal.set(true)"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-mid text-white text-sm font-semibold rounded-xl hover:bg-teal-deep transition-colors shadow-md shadow-teal-mid/20 cursor-pointer">
          <lucide-angular [img]="UserPlusIcon" [size]="16" />
          Nuevo cliente
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-green-cream shadow-sm overflow-hidden">
        <!-- Toolbar: search + filters -->
        <div class="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-green-cream">
          <div class="relative w-full lg:max-w-sm">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
              placeholder="Buscar por nombre o correo"
              class="w-full pl-10 pr-4 py-2.5 border border-green-cream rounded-xl text-sm text-ink placeholder:text-ink-soft/60 bg-cream focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid outline-none transition-all">
          </div>
          <div class="flex gap-2 overflow-x-auto lg:ml-auto -mx-1 px-1 pb-1 lg:pb-0">
            @for (f of filterOptions; track f.key) {
              <button (click)="statusFilter.set(f.key)"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-colors cursor-pointer"
                [ngClass]="statusFilter() === f.key
                  ? 'bg-teal-mid border-teal-mid text-white'
                  : 'bg-white border-green-cream text-ink-soft hover:bg-cream-2'">
                {{ f.label }}
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  [ngClass]="statusFilter() === f.key ? 'bg-white/20 text-white' : 'bg-cream-2 text-ink-soft'">
                  {{ counts()[f.key] }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="p-12 flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-4 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
            <p class="text-sm text-ink-soft">Cargando clientes...</p>
          </div>
        }

        <!-- Error -->
        @if (error() && !loading()) {
          <div class="p-8 text-center">
            <div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
              <lucide-angular [img]="TriangleAlertIcon" [size]="22" />
            </div>
            <p class="text-red-600 font-medium mb-1">Error al cargar clientes</p>
            <p class="text-sm text-ink-soft mb-4">{{ error() }}</p>
            <button (click)="loadClientes()" class="px-4 py-2 bg-teal-mid text-white text-sm font-semibold rounded-xl hover:bg-teal-deep transition-colors cursor-pointer">
              Reintentar
            </button>
          </div>
        }

        <!-- Content -->
        @if (!loading() && !error()) {
          @if (filteredClientes().length === 0) {
            <div class="p-12 text-center">
              <div class="w-14 h-14 bg-cream-2 rounded-full flex items-center justify-center mx-auto mb-3 text-ink-soft/50">
                <lucide-angular [img]="UsersIcon" [size]="28" />
              </div>
              <p class="text-ink-soft font-medium">
                {{ searchQuery() || statusFilter() !== 'todos' ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados' }}
              </p>
            </div>
          }

          @if (filteredClientes().length > 0) {
            <!-- Desktop Table -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-cream border-b border-green-cream">
                    <th class="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Cliente</th>
                    <th class="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Estado</th>
                    <th class="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Perfil</th>
                    <th class="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Registro</th>
                    <th class="text-right text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-green-cream">
                  @for (c of filteredClientes(); track c.id) {
                    <tr class="hover:bg-cream/70 transition-colors">
                      <td class="px-6 py-3.5">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                               [ngClass]="fullName(c) ? 'bg-green-pale text-teal-deep' : 'bg-cream-2 text-ink-soft'">
                            {{ initials(c) }}
                          </div>
                          <div class="flex flex-col min-w-0">
                            <span class="text-sm font-semibold" [ngClass]="fullName(c) ? 'text-ink' : 'text-ink-soft'">
                              {{ fullName(c) || 'Sin nombre aún' }}
                            </span>
                            <span class="text-xs text-ink-soft">{{ c.email }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-3.5">
                        @if (c.is_active) {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-pale text-teal-deep">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-leaf"></span>Activo
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Inactivo
                          </span>
                        }
                      </td>
                      <td class="px-6 py-3.5">
                        @if (c.is_profile_complete) {
                          <span class="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-pale text-teal-deep">Completo</span>
                        } @else {
                          <span class="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Incompleto</span>
                        }
                      </td>
                      <td class="px-6 py-3.5 text-sm text-ink-soft">{{ c.fecha_creacion | date:'dd/MM/yyyy' }}</td>
                      <td class="px-6 py-3.5">
                        <div class="flex items-center justify-end gap-2">
                          <button (click)="viewDetail(c)"
                            class="px-4 py-2 text-sm font-medium text-teal-mid bg-white border border-green-cream hover:bg-cream-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap">
                            Ver detalle
                          </button>
                          <button (click)="statusTargetId.set(c.id)"
                            [title]="c.is_active ? 'Deshabilitar' : 'Reactivar'"
                            [attr.aria-label]="c.is_active ? 'Deshabilitar cliente' : 'Reactivar cliente'"
                            class="w-10 h-10 flex items-center justify-center border rounded-xl transition-colors cursor-pointer"
                            [ngClass]="c.is_active
                              ? 'text-red-700 bg-white border-red-200 hover:bg-red-50'
                              : 'text-teal-deep bg-green-pale border-green-leaf/40 hover:bg-green-leaf/30'">
                            <lucide-angular [img]="c.is_active ? UserXIcon : UserCheckIcon" [size]="16" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Mobile Cards -->
            <div class="md:hidden divide-y divide-green-cream">
              @for (c of filteredClientes(); track c.id) {
                <div class="p-4">
                  <div class="flex items-start justify-between gap-2 mb-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                           [ngClass]="fullName(c) ? 'bg-green-pale text-teal-deep' : 'bg-cream-2 text-ink-soft'">
                        {{ initials(c) }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold truncate" [ngClass]="fullName(c) ? 'text-ink' : 'text-ink-soft'">
                          {{ fullName(c) || 'Sin nombre aún' }}
                        </p>
                        <p class="text-xs text-ink-soft truncate">{{ c.email }}</p>
                      </div>
                    </div>
                    @if (c.is_active) {
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-pale text-teal-deep">Activo</span>
                    } @else {
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Inactivo</span>
                    }
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                          [ngClass]="c.is_profile_complete ? 'bg-green-pale text-teal-deep' : 'bg-amber-100 text-amber-800'">
                      {{ c.is_profile_complete ? 'Perfil completo' : 'Perfil incompleto' }}
                    </span>
                    <div class="flex items-center gap-2">
                      <button (click)="viewDetail(c)" class="px-3 py-1.5 text-xs font-medium text-teal-mid bg-white border border-green-cream hover:bg-cream-2 rounded-lg transition-colors cursor-pointer">Ver detalle</button>
                      <button (click)="statusTargetId.set(c.id)" class="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer"
                        [ngClass]="c.is_active
                          ? 'text-red-700 bg-white border-red-200 hover:bg-red-50'
                          : 'text-teal-deep bg-green-pale border-green-leaf/40 hover:bg-green-leaf/30'">
                        {{ c.is_active ? 'Deshabilitar' : 'Reactivar' }}
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>

    <!-- Create Modal -->
    @if (showCreateModal()) {
      <div class="fixed inset-0 bg-teal-deep/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeCreate()">
        <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up p-6 sm:p-7" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-12 h-12 shrink-0 bg-cyan-ring/20 rounded-2xl flex items-center justify-center text-teal-mid">
              <lucide-angular [img]="UserPlusIcon" [size]="22" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-xl font-extrabold text-teal-deep">Nuevo cliente</h3>
              <p class="text-sm text-ink-soft mt-0.5">Comparte estos datos para su primer ingreso.</p>
            </div>
            <button (click)="closeCreate()" aria-label="Cerrar" class="p-1.5 rounded-lg text-ink hover:bg-cream-2 transition-colors cursor-pointer">
              <lucide-angular [img]="XIcon" [size]="20" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-ink mb-1.5">Correo electrónico <span class="text-red-700">*</span></label>
              <input type="email" [(ngModel)]="form.email" placeholder="cliente@correo.com"
                class="w-full px-4 py-3 rounded-2xl border border-green-cream bg-cream text-sm text-ink placeholder:text-ink-soft/60 focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid outline-none transition-all" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-ink mb-1.5">Contraseña temporal <span class="text-red-700">*</span></label>
              <input type="password" [(ngModel)]="form.password" placeholder="Mínimo 8 caracteres"
                class="w-full px-4 py-3 rounded-2xl border border-green-cream bg-cream text-sm text-ink placeholder:text-ink-soft/60 focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid outline-none transition-all" />
              <p class="mt-1.5 text-xs text-ink-soft">El cliente deberá cambiarla en su primer ingreso.</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-ink mb-1.5">Teléfono <span class="font-normal text-ink-soft">(opcional)</span></label>
              <input type="tel" [(ngModel)]="form.telefono" placeholder="999 999 999"
                class="w-full px-4 py-3 rounded-2xl border border-green-cream bg-cream text-sm text-ink placeholder:text-ink-soft/60 focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid outline-none transition-all" />
            </div>
            @if (createError()) {
              <p class="text-xs text-red-700">{{ createError() }}</p>
            }
          </div>

          <div class="mt-6 flex gap-3">
            <button (click)="closeCreate()"
              class="flex-1 py-3 text-sm font-semibold text-ink-soft bg-white border border-green-cream hover:bg-cream-2 rounded-2xl transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="createCliente()" [disabled]="creating()"
              class="flex-1 py-3 text-sm font-bold text-white bg-teal-mid hover:bg-teal-deep disabled:opacity-50 rounded-2xl transition-colors cursor-pointer">
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
      <div class="fixed inset-0 bg-teal-deep/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="detailCliente.set(null)">
        <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up p-6 sm:p-7" (click)="$event.stopPropagation()">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-lg font-bold"
                 [ngClass]="fullName(detailCliente()!) ? 'bg-green-pale text-teal-deep' : 'bg-cream-2 text-ink-soft'">
              {{ initials(detailCliente()!) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-xl font-extrabold truncate" [ngClass]="fullName(detailCliente()!) ? 'text-teal-deep' : 'text-ink-soft'">
                {{ fullName(detailCliente()!) || 'Sin nombre aún' }}
              </h3>
              <p class="text-sm text-ink-soft truncate">{{ detailCliente()!.email }}</p>
            </div>
            <button (click)="detailCliente.set(null)" aria-label="Cerrar" class="p-1.5 rounded-lg text-ink hover:bg-cream-2 transition-colors cursor-pointer">
              <lucide-angular [img]="XIcon" [size]="20" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-cream border border-green-cream rounded-2xl p-4">
              <p class="text-xs font-medium text-ink-soft mb-2">Estado de la cuenta</p>
              @if (detailCliente()!.is_active) {
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-pale text-teal-deep">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-leaf"></span>Activo
                </span>
              } @else {
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Inactivo
                </span>
              }
            </div>
            <div class="bg-cream border border-green-cream rounded-2xl p-4">
              <p class="text-xs font-medium text-ink-soft mb-2">Perfil</p>
              <span class="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="detailCliente()!.is_profile_complete ? 'bg-green-pale text-teal-deep' : 'bg-amber-100 text-amber-800'">
                {{ detailCliente()!.is_profile_complete ? 'Completo' : 'Incompleto' }}
              </span>
            </div>
            <div class="bg-cream border border-green-cream rounded-2xl p-4">
              <p class="text-xs font-medium text-ink-soft mb-2">Teléfono</p>
              <p class="text-sm" [ngClass]="detailCliente()!.telefono ? 'font-semibold text-ink' : 'text-ink-soft'">
                {{ detailCliente()!.telefono || 'No registrado' }}
              </p>
            </div>
            <div class="bg-cream border border-green-cream rounded-2xl p-4">
              <p class="text-xs font-medium text-ink-soft mb-2">Fecha de registro</p>
              <p class="text-sm font-semibold text-ink">{{ detailCliente()!.fecha_creacion | date:'dd/MM/yyyy · HH:mm' }}</p>
            </div>
          </div>

          <button (click)="detailCliente.set(null)"
            class="mt-4 w-full py-3 text-sm font-semibold text-teal-mid bg-white border border-green-cream hover:bg-cream-2 rounded-2xl transition-colors cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    }

    <!-- Disable / Reactivate Confirm Modal -->
    @if (statusTarget(); as target) {
      <div class="fixed inset-0 bg-teal-deep/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="statusTargetId.set(null)">
        <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up p-6 sm:p-7 text-center" (click)="$event.stopPropagation()">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
               [ngClass]="target.is_active ? 'bg-red-100 text-red-700' : 'bg-green-pale text-teal-deep'">
            <lucide-angular [img]="target.is_active ? UserXIcon : UserCheckIcon" [size]="28" />
          </div>
          <h3 class="text-xl font-extrabold text-teal-deep mb-2">
            {{ target.is_active ? '¿Deshabilitar' : '¿Reactivar' }} a {{ displayName(target) }}?
          </h3>
          <p class="text-sm text-ink-soft mb-6">
            @if (target.is_active) {
              Perderá el acceso a Calofit hasta que lo reactives. Sus datos se conservan.
            } @else {
              Recuperará el acceso a Calofit con su cuenta actual.
            }
          </p>
          <div class="flex gap-3">
            <button (click)="statusTargetId.set(null)"
              class="flex-1 py-3 text-sm font-semibold text-ink-soft bg-white border border-green-cream hover:bg-cream-2 rounded-2xl transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="confirmStatusChange()" [disabled]="updatingStatus()"
              class="flex-1 py-3 text-sm font-bold text-white disabled:opacity-50 rounded-2xl transition-colors cursor-pointer"
              [ngClass]="target.is_active ? 'bg-red-700 hover:bg-red-800' : 'bg-teal-mid hover:bg-teal-deep'">
              @if (updatingStatus()) {
                {{ target.is_active ? 'Deshabilitando...' : 'Reactivando...' }}
              } @else {
                {{ target.is_active ? 'Sí, deshabilitar' : 'Sí, reactivar' }}
              }
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
  readonly UserXIcon = UserX;
  readonly UserCheckIcon = UserCheck;
  readonly UsersIcon = Users;
  readonly UserPlusIcon = UserPlus;
  readonly XIcon = X;

  clientes = signal<ClienteAdmin[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  statusFilter = signal<StatusFilter>('todos');
  statusTargetId = signal<number | null>(null);
  updatingStatus = signal(false);
  statusTarget = computed(() => this.clientes().find(c => c.id === this.statusTargetId()) ?? null);
  showCreateModal = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);
  detailCliente = signal<ClienteAdmin | null>(null);

  form: CreateClientePayload = { email: '', password: '', telefono: '' };

  readonly filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'activos', label: 'Activos' },
    { key: 'inactivos', label: 'Inactivos' },
    { key: 'incompleto', label: 'Perfil incompleto' },
  ];

  counts = computed<Record<StatusFilter, number>>(() => {
    const list = this.clientes();
    return {
      todos: list.length,
      activos: list.filter(c => c.is_active).length,
      inactivos: list.filter(c => !c.is_active).length,
      incompleto: list.filter(c => !c.is_profile_complete).length,
    };
  });

  filteredClientes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();
    return this.clientes().filter(c => {
      if (filter === 'activos' && !c.is_active) return false;
      if (filter === 'inactivos' && c.is_active) return false;
      if (filter === 'incompleto' && c.is_profile_complete) return false;
      if (!q) return true;
      return `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
    });
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

  fullName(c: ClienteAdmin): string {
    return `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim();
  }

  initials(c: ClienteAdmin): string {
    const parts = this.fullName(c).split(/\s+/).filter(Boolean);
    return parts.length ? ((parts[0][0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() : '?';
  }

  displayName(c: ClienteAdmin): string {
    return this.fullName(c) || c.email;
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
    if (!this.form.password || this.form.password.length < 8) { this.createError.set('Contraseña mínimo 8 caracteres.'); return; }

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

  confirmStatusChange(): void {
    const target = this.statusTarget();
    if (!target) return;
    const disabling = target.is_active;
    const request$ = disabling
      ? this.adminService.deshabilitarCliente(target.id)
      : this.adminService.reactivarCliente(target.id);

    this.updatingStatus.set(true);
    request$.subscribe({
      next: () => {
        this.clientes.update(list => list.map(c => c.id === target.id ? { ...c, is_active: !disabling } : c));
        this.statusTargetId.set(null);
        this.updatingStatus.set(false);
        this.toastr.success(disabling ? 'Cliente deshabilitado' : 'Cliente reactivado', 'Éxito');
      },
      error: (err) => {
        this.updatingStatus.set(false);
        this.toastr.error(
          err?.error?.detail || (disabling ? 'Error al deshabilitar' : 'Error al reactivar'),
          'Error',
        );
      },
    });
  }
}
