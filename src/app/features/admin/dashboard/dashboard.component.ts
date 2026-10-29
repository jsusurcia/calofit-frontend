import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, AdminDashboard, PagoAdmin, ClienteAdmin } from '../../../core/services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, UserCheck, UserX, Clock, TrendingUp, CheckCircle, Check, X, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up space-y-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-teal-deep">
            ¡Hola, {{ auth.fullName() }}!
          </h1>
          <p class="text-ink-soft mt-1 text-sm">Esto es lo que necesita tu atención hoy.</p>
        </div>
        <button (click)="loadAll()" class="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 md:py-2 text-sm font-medium text-teal-mid bg-white border border-green-cream rounded-xl hover:bg-cream-2 transition-colors cursor-pointer shrink-0">
          <lucide-angular [img]="RefreshIcon" [size]="15" />
          Actualizar
        </button>
      </div>

      <!-- KPI cards -->
      @if (loadingStats() || loadingClientes()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white rounded-2xl border border-green-cream p-5 animate-pulse">
              <div class="h-4 bg-cream-2 rounded mb-4 w-2/3"></div>
              <div class="h-8 bg-cream-2 rounded w-1/3"></div>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Clientes activos -->
          <div class="bg-white rounded-2xl border border-green-cream p-5 shadow-sm">
            <div class="flex items-start justify-between gap-2 mb-3">
              <p class="text-sm font-medium text-ink-soft">Clientes activos</p>
              <div class="w-9 h-9 shrink-0 bg-green-pale rounded-xl flex items-center justify-center text-teal-mid">
                <lucide-angular [img]="UserCheckIcon" [size]="17" />
              </div>
            </div>
            <p class="text-3xl font-extrabold text-teal-deep">{{ activos() }}</p>
            <div class="mt-3 h-1.5 rounded-full bg-green-cream overflow-hidden">
              <div class="h-full rounded-full bg-green-leaf" [style.width.%]="pct(activos(), clientes().length)"></div>
            </div>
            <p class="mt-2 text-xs text-ink-soft">de {{ clientes().length }} registrados</p>
          </div>

          <!-- Perfiles incompletos -->
          <div class="bg-white rounded-2xl border border-green-cream p-5 shadow-sm">
            <div class="flex items-start justify-between gap-2 mb-3">
              <p class="text-sm font-medium text-ink-soft">Perfiles incompletos</p>
              <div class="w-9 h-9 shrink-0 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                <lucide-angular [img]="UserXIcon" [size]="17" />
              </div>
            </div>
            <p class="text-3xl font-extrabold text-teal-deep">{{ incompletos().length }}</p>
            <div class="mt-3 h-1.5 rounded-full bg-green-cream overflow-hidden">
              <div class="h-full rounded-full bg-amber-400" [style.width.%]="pct(incompletos().length, clientes().length)"></div>
            </div>
            <p class="mt-2 text-xs text-ink-soft">sin datos, la IA no arma su menú</p>
          </div>

          <!-- Pagos por confirmar -->
          <div class="bg-white rounded-2xl border border-green-cream p-5 shadow-sm">
            <div class="flex items-start justify-between gap-2 mb-3">
              <p class="text-sm font-medium text-ink-soft">Pagos por confirmar</p>
              <div class="w-9 h-9 shrink-0 bg-cyan-ring/20 rounded-xl flex items-center justify-center text-teal-mid">
                <lucide-angular [img]="ClockIcon" [size]="17" />
              </div>
            </div>
            <p class="text-3xl font-extrabold text-teal-deep">{{ pagos().length }}</p>
            <p class="mt-5 text-xs text-ink-soft">esperan tu confirmación</p>
          </div>

          <!-- Ingresos del mes -->
          <div class="bg-white rounded-2xl border border-green-cream p-5 shadow-sm">
            <div class="flex items-start justify-between gap-2 mb-3">
              <p class="text-sm font-medium text-ink-soft">Ingresos de {{ monthName }}</p>
              <div class="w-9 h-9 shrink-0 bg-green-pale rounded-xl flex items-center justify-center text-green-leaf">
                <lucide-angular [img]="TrendingUpIcon" [size]="17" />
              </div>
            </div>
            <p class="text-3xl font-extrabold text-teal-deep">S/ {{ (stats()?.ingresos_mes ?? 0) | number:'1.0-0' }}</p>
            <p class="mt-5 text-xs text-ink-soft">
              @if (stats()?.pagos_aprobados_mes != null) {
                {{ stats()!.pagos_aprobados_mes }} {{ stats()!.pagos_aprobados_mes === 1 ? 'membresía aprobada' : 'membresías aprobadas' }}
              } @else {
                acumulado del mes
              }
            </p>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div class="lg:col-span-3 space-y-6">
          <!-- Pagos por confirmar -->
          <section class="bg-white rounded-2xl border border-green-cream shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4">
              <div class="flex items-center gap-2.5">
                <h2 class="text-lg font-bold text-teal-deep">Pagos por confirmar</h2>
                @if (pagos().length > 0) {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    {{ pagos().length }} {{ pagos().length === 1 ? 'pendiente' : 'pendientes' }}
                  </span>
                }
              </div>
              <a routerLink="/admin/pagos" class="text-sm text-teal-mid hover:text-teal-deep font-medium">Ver todos los pagos</a>
            </div>

            @if (loadingPagos()) {
              <div class="flex items-center justify-center py-12 border-t border-green-cream">
                <div class="w-8 h-8 border-3 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
              </div>
            } @else if (pagos().length === 0) {
              <div class="flex flex-col items-center justify-center py-12 gap-2 border-t border-green-cream">
                <div class="w-12 h-12 bg-green-pale rounded-full flex items-center justify-center text-teal-mid">
                  <lucide-angular [img]="CheckCircleIcon" [size]="24" />
                </div>
                <p class="text-sm text-ink-soft">Sin pagos por confirmar</p>
              </div>
            } @else {
              <div class="divide-y divide-green-cream border-t border-green-cream">
                @for (pago of pagos().slice(0, 5); track pago.id) {
                  <div class="flex items-center gap-3 px-6 py-3.5">
                    <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                         [ngClass]="initials(pago.client_nombre) === '?' ? 'bg-cream-2 text-ink-soft' : 'bg-green-pale text-teal-deep'">
                      {{ initials(pago.client_nombre) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-ink truncate">{{ pago.client_nombre || pago.client_email }}</p>
                      <p class="text-xs text-ink-soft truncate">
                        {{ pago.concepto || 'Membresía' }} · {{ formatPagoDate(pago.fecha_pago) }}
                        @if (pago.monto != null) { · S/ {{ pago.monto | number:'1.2-2' }} }
                      </p>
                    </div>
                    <button (click)="rechazar(pago)" [disabled]="procesandoId() === pago.id"
                      aria-label="Rechazar pago"
                      class="w-10 h-10 shrink-0 flex items-center justify-center text-red-700 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer">
                      <lucide-angular [img]="XIcon" [size]="16" />
                    </button>
                    <button (click)="aprobar(pago)" [disabled]="procesandoId() === pago.id"
                      class="h-10 px-4 shrink-0 flex items-center gap-1.5 text-sm font-semibold text-white bg-teal-mid rounded-xl hover:bg-teal-deep transition-colors disabled:opacity-50 cursor-pointer">
                      @if (procesandoId() === pago.id) {
                        <span class="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
                      } @else {
                        <lucide-angular [img]="CheckIcon" [size]="15" />
                      }
                      Aprobar
                    </button>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Últimos registrados -->
          <section class="bg-white rounded-2xl border border-green-cream shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4">
              <h2 class="text-lg font-bold text-teal-deep">Últimos registrados</h2>
              <a routerLink="/admin/clientes" class="text-sm text-teal-mid hover:text-teal-deep font-medium">Ir a clientes</a>
            </div>
            @if (loadingClientes()) {
              <div class="flex items-center justify-center py-12 border-t border-green-cream">
                <div class="w-8 h-8 border-3 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
              </div>
            } @else if (ultimos().length === 0) {
              <p class="py-10 text-center text-sm text-ink-soft border-t border-green-cream">Aún no hay clientes registrados</p>
            } @else {
              <div class="divide-y divide-green-cream border-t border-green-cream">
                @for (c of ultimos(); track c.id) {
                  <div class="flex items-center gap-3 px-6 py-3.5">
                    <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                         [ngClass]="fullName(c) ? 'bg-green-pale text-teal-deep' : 'bg-cream-2 text-ink-soft'">
                      {{ initials(fullName(c)) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold truncate" [ngClass]="fullName(c) ? 'text-ink' : 'text-ink-soft'">
                        {{ fullName(c) || 'Sin nombre aún' }}
                      </p>
                      <p class="text-xs text-ink-soft truncate">{{ c.email }}</p>
                    </div>
                    <span class="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold shrink-0"
                          [ngClass]="c.is_profile_complete ? 'bg-green-pale text-teal-deep' : 'bg-amber-100 text-amber-800'">
                      {{ c.is_profile_complete ? 'Perfil completo' : 'Perfil incompleto' }}
                    </span>
                    <span class="w-14 text-right text-sm text-ink-soft shrink-0">{{ shortDate(c.fecha_creacion) }}</span>
                  </div>
                }
              </div>
            }
          </section>
        </div>

        <!-- Requieren atención -->
        <section class="lg:col-span-2 bg-white rounded-2xl border border-green-cream shadow-sm overflow-hidden">
          <div class="px-6 py-4">
            <h2 class="text-lg font-bold text-teal-deep">Requieren atención</h2>
            <p class="mt-1 text-sm text-ink-soft">
              Perfiles incompletos: escríbeles para que completen sus datos y la IA pueda armar su menú.
            </p>
          </div>
          @if (loadingClientes()) {
            <div class="flex items-center justify-center py-12 border-t border-green-cream">
              <div class="w-8 h-8 border-3 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
            </div>
          } @else if (atencion().length === 0) {
            <div class="flex flex-col items-center justify-center py-10 gap-2 border-t border-green-cream">
              <div class="w-12 h-12 bg-green-pale rounded-full flex items-center justify-center text-teal-mid">
                <lucide-angular [img]="CheckCircleIcon" [size]="24" />
              </div>
              <p class="text-sm text-ink-soft">Todo al día</p>
            </div>
          } @else {
            <div class="divide-y divide-green-cream border-t border-green-cream">
              @for (c of atencion().slice(0, 5); track c.id) {
                <div class="flex items-center gap-3 px-6 py-3">
                  <div class="w-10 h-10 shrink-0 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                    {{ initials(fullName(c)) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-ink truncate">{{ fullName(c) || c.email }}</p>
                    <p class="text-xs text-ink-soft truncate">Registrado {{ timeAgo(c.fecha_creacion) }}</p>
                  </div>
                  <a routerLink="/admin/clientes" class="text-sm font-semibold text-teal-mid hover:text-teal-deep px-2">Ver</a>
                </div>
              }
            </div>
            <div class="px-6 py-4 border-t border-green-cream">
              <a routerLink="/admin/clientes" class="text-sm font-medium text-teal-mid hover:text-teal-deep">
                Ver los {{ atencion().length }} en Clientes
              </a>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`@reference "../../../../styles.css";`]
})
export class AdminDashboardComponent {
  auth = inject(AuthService);
  private adminService = inject(AdminService);
  private toastr = inject(ToastrService);

  readonly UserCheckIcon = UserCheck;
  readonly UserXIcon = UserX;
  readonly ClockIcon = Clock;
  readonly TrendingUpIcon = TrendingUp;
  readonly CheckCircleIcon = CheckCircle;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly RefreshIcon = RefreshCw;

  private readonly now = new Date();
  readonly monthName = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(this.now);

  stats = signal<AdminDashboard | null>(null);
  pagos = signal<PagoAdmin[]>([]);
  clientes = signal<ClienteAdmin[]>([]);
  loadingStats = signal(false);
  loadingPagos = signal(false);
  loadingClientes = signal(false);
  procesandoId = signal<number | null>(null);

  activos = computed(() => this.clientes().filter((c) => c.is_active).length);
  incompletos = computed(() => this.clientes().filter((c) => !c.is_profile_complete));
  // Pagaron (cuenta activa) pero aún no completan su perfil
  atencion = computed(() => this.incompletos().filter((c) => c.is_active));
  ultimos = computed(() =>
    [...this.clientes()]
      .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
      .slice(0, 4),
  );

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.loadStats();
    this.loadPagos();
    this.loadClientes();
  }

  private loadStats(): void {
    this.loadingStats.set(true);
    this.adminService.getDashboard().subscribe({
      next: (res) => { this.stats.set(res); this.loadingStats.set(false); },
      error: () => { this.loadingStats.set(false); },
    });
  }

  private loadPagos(): void {
    this.loadingPagos.set(true);
    this.adminService.getPagosPendientes().subscribe({
      next: (res) => { this.pagos.set(res); this.loadingPagos.set(false); },
      error: () => { this.loadingPagos.set(false); },
    });
  }

  private loadClientes(): void {
    this.loadingClientes.set(true);
    this.adminService.getClientes().subscribe({
      next: (res) => { this.clientes.set(res); this.loadingClientes.set(false); },
      error: () => { this.loadingClientes.set(false); },
    });
  }

  aprobar(pago: PagoAdmin): void {
    this.procesandoId.set(pago.id);
    this.adminService.aprobarPago(pago.id).subscribe({
      next: () => {
        this.toastr.success(`Pago de ${pago.client_nombre || pago.client_email} aprobado`, '¡Aprobado!');
        this.procesandoId.set(null);
        this.loadAll();
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al aprobar pago', 'Error');
        this.procesandoId.set(null);
      },
    });
  }

  rechazar(pago: PagoAdmin): void {
    if (!confirm(`¿Rechazar el pago de ${pago.client_nombre || pago.client_email}?`)) return;
    this.procesandoId.set(pago.id);
    this.adminService.rechazarPago(pago.id).subscribe({
      next: () => {
        this.toastr.success('Pago rechazado', 'Listo');
        this.procesandoId.set(null);
        this.loadAll();
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al rechazar pago', 'Error');
        this.procesandoId.set(null);
      },
    });
  }

  // ---- helpers de presentación ----

  pct(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  fullName(c: ClienteAdmin): string {
    return `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim();
  }

  initials(name: string | null | undefined): string {
    const n = (name ?? '').trim();
    if (!n || n.includes('@')) return '?';
    const parts = n.split(/\s+/);
    return ((parts[0][0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  shortDate(iso: string): string {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(d).replace('.', '');
    return `${day} ${month}`;
  }

  formatPagoDate(iso: string): string {
    const d = new Date(iso);
    if (d.toDateString() === this.now.toDateString()) {
      const time = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
      return `hoy, ${time}`;
    }
    return this.shortDate(iso);
  }

  timeAgo(iso: string): string {
    const days = Math.floor((this.now.getTime() - new Date(iso).getTime()) / 86_400_000);
    if (days < 1) return 'hoy';
    if (days === 1) return 'hace 1 día';
    if (days < 7) return `hace ${days} días`;
    if (days < 30) {
      const w = Math.floor(days / 7);
      return `hace ${w} ${w === 1 ? 'semana' : 'semanas'}`;
    }
    const m = Math.floor(days / 30);
    return `hace ${m} ${m === 1 ? 'mes' : 'meses'}`;
  }
}
