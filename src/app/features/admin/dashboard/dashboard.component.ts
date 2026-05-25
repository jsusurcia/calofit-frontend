import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService, AdminDashboard, PagoAdmin } from '../../../core/services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Users, UserCheck, CreditCard, TrendingUp, CheckCircle, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">
            ¡Hola, {{ auth.fullName() }}!
          </h1>
          <p class="text-gray-500 mt-1 text-sm">Panel de administración CaloFit</p>
        </div>
        <button (click)="loadAll()" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
          <lucide-angular [img]="RefreshIcon" [size]="15" />
          Actualizar
        </button>
      </div>

      <!-- Stats Cards -->
      @if (loadingStats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div class="h-4 bg-gray-100 rounded mb-3 w-2/3"></div>
              <div class="h-8 bg-gray-100 rounded w-1/2"></div>
            </div>
          }
        </div>
      }

      @if (!loadingStats() && stats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Clientes -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total clientes</p>
              <div class="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-[#146aff]">
                <lucide-angular [img]="UsersIcon" [size]="17" />
              </div>
            </div>
            <p class="text-3xl font-bold text-gray-900">{{ stats()!.total_clientes }}</p>
          </div>
          <!-- Clientes Activos -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Activos</p>
              <div class="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <lucide-angular [img]="UserCheckIcon" [size]="17" />
              </div>
            </div>
            <p class="text-3xl font-bold text-gray-900">{{ stats()!.clientes_activos }}</p>
          </div>
          <!-- Pagos Pendientes -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pagos pendientes</p>
              <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                [ngClass]="stats()!.pagos_pendientes > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'">
                <lucide-angular [img]="CreditCardIcon" [size]="17" />
              </div>
            </div>
            <p class="text-3xl font-bold" [ngClass]="stats()!.pagos_pendientes > 0 ? 'text-amber-600' : 'text-gray-900'">
              {{ stats()!.pagos_pendientes }}
            </p>
          </div>
          <!-- Ingresos Mes -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ingresos del mes</p>
              <div class="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <lucide-angular [img]="TrendingUpIcon" [size]="17" />
              </div>
            </div>
            <p class="text-3xl font-bold text-gray-900">S/ {{ stats()!.ingresos_mes | number:'1.0-0' }}</p>
          </div>
        </div>
      }

      <!-- Pagos Pendientes Quick List -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <h2 class="text-base font-semibold text-gray-900">Pagos pendientes</h2>
            @if (pagos().length > 0) {
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                {{ pagos().length }}
              </span>
            }
          </div>
          <a routerLink="/admin/pagos" class="text-xs text-primary-600 hover:underline font-medium">Ver todos</a>
        </div>

        @if (loadingPagos()) {
          <div class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-3 border-primary-100 border-t-[#146aff] rounded-full animate-spin"></div>
          </div>
        }

        @if (!loadingPagos() && pagos().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 gap-2">
            <div class="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
              <lucide-angular [img]="CheckCircleIcon" [size]="24" />
            </div>
            <p class="text-sm text-gray-400">Sin pagos pendientes</p>
          </div>
        }

        @if (!loadingPagos() && pagos().length > 0) {
          <div class="divide-y divide-gray-50">
            @for (pago of pagos().slice(0, 5); track pago.id) {
              <div class="flex items-center justify-between px-6 py-4">
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ pago.client_nombre }}</p>
                  <p class="text-xs text-gray-400">
                    {{ pago.metodo_pago === 'yape' ? 'Yape' : 'Efectivo' }}
                    @if (pago.monto != null) { · S/ {{ pago.monto | number:'1.2-2' }} }
                  </p>
                </div>
                <button (click)="aprobar(pago)" [disabled]="procesandoId() === pago.id"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer">
                  @if (procesandoId() === pago.id) {
                    <span class="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                  } @else {
                    <lucide-angular [img]="CheckCircleIcon" [size]="12" />
                  }
                  Aprobar
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Quick Nav -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a routerLink="/admin/clientes"
          class="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-4">
          <div class="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-[#146aff] group-hover:bg-primary-100 transition-colors">
            <lucide-angular [img]="UsersIcon" [size]="22" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">Gestión de clientes</h3>
            <p class="text-xs text-gray-400 mt-0.5">Crear, activar y gestionar clientes</p>
          </div>
        </a>
        <a routerLink="/admin/pagos"
          class="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-4">
          <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
            <lucide-angular [img]="CreditCardIcon" [size]="22" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">Aprobar pagos</h3>
            <p class="text-xs text-gray-400 mt-0.5">Validar comprobantes y activar clientes</p>
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`@reference "../../../../styles.css";`]
})
export class AdminDashboardComponent {
  auth = inject(AuthService);
  private adminService = inject(AdminService);
  private toastr = inject(ToastrService);

  readonly UsersIcon = Users;
  readonly UserCheckIcon = UserCheck;
  readonly CreditCardIcon = CreditCard;
  readonly TrendingUpIcon = TrendingUp;
  readonly CheckCircleIcon = CheckCircle;
  readonly RefreshIcon = RefreshCw;

  stats = signal<AdminDashboard | null>(null);
  pagos = signal<PagoAdmin[]>([]);
  loadingStats = signal(false);
  loadingPagos = signal(false);
  procesandoId = signal<number | null>(null);

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.loadStats();
    this.loadPagos();
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

  aprobar(pago: PagoAdmin): void {
    this.procesandoId.set(pago.id);
    this.adminService.aprobarPago(pago.id).subscribe({
      next: () => {
        this.toastr.success(`Pago de ${pago.client_nombre} aprobado`, '¡Aprobado!');
        this.procesandoId.set(null);
        this.loadAll();
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al aprobar pago', 'Error');
        this.procesandoId.set(null);
      },
    });
  }
}
