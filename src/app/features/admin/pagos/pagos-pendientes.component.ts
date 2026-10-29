import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, CreditCard, CheckCircle, CircleX, Eye, RefreshCw, Clock, Banknote, Smartphone, TrendingUp, Check, X } from 'lucide-angular';
import { environment } from '../../../../environments/environment';
import { AdminService, AdminDashboard } from '../../../core/services/admin.service';

const API = environment.apiUrl;

interface PagoListItem {
  id: number;
  client_id: number;
  client_nombre: string;
  client_email: string;
  client_phone: string | null;
  metodo_pago: 'yape' | 'efectivo';
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  monto: number | null;
  concepto: string | null;
  comprobante_url: string | null;
  fecha_pago: string;
  /** Pendiente en backend: nombre del admin que aprobó/rechazó el pago. */
  revisado_por?: string | null;
}

type EstadoFiltro = 'todos' | 'pendiente' | 'aprobado' | 'rechazado';

@Component({
  selector: 'app-pagos-pendientes',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-teal-deep">Pagos</h1>
          <p class="text-sm text-ink-soft mt-1">Historial y gestión de pagos</p>
        </div>
        <button (click)="loadPagos()" class="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 md:py-2 text-sm font-medium text-teal-mid bg-white border border-green-cream rounded-xl hover:bg-cream-2 transition-colors cursor-pointer shrink-0">
          <lucide-angular [img]="RefreshIcon" [size]="15" />
          Actualizar
        </button>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-2xl border border-green-cream shadow-sm p-5 flex items-center gap-4">
          <div class="w-12 h-12 shrink-0 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
            <lucide-angular [img]="ClockIcon" [size]="22" />
          </div>
          <div>
            <p class="text-2xl font-extrabold text-teal-deep leading-none">{{ counts().pendiente }}</p>
            <p class="text-sm text-ink-soft mt-1">por confirmar</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-green-cream shadow-sm p-5 flex items-center gap-4">
          <div class="w-12 h-12 shrink-0 bg-green-pale rounded-xl flex items-center justify-center text-green-leaf">
            <lucide-angular [img]="TrendingUpIcon" [size]="22" />
          </div>
          <div>
            <p class="text-2xl font-extrabold text-teal-deep leading-none">S/ {{ (stats()?.ingresos_mes ?? 0) | number:'1.0-0' }}</p>
            <p class="text-sm text-ink-soft mt-1">recibido en {{ monthName }}</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-green-cream shadow-sm p-5 flex items-center gap-4">
          <div class="w-12 h-12 shrink-0 bg-red-100 rounded-xl flex items-center justify-center text-red-700">
            <lucide-angular [img]="XIcon" [size]="22" />
          </div>
          <div>
            <p class="text-2xl font-extrabold text-teal-deep leading-none">{{ counts().rechazado }}</p>
            <p class="text-sm text-ink-soft mt-1">rechazados</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-green-cream shadow-sm overflow-hidden">
        <!-- Search + tabs -->
        <div class="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-green-cream">
          <div class="relative w-full lg:max-w-sm">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
              placeholder="Buscar por cliente o correo"
              class="w-full pl-10 pr-4 py-2.5 border border-green-cream rounded-xl text-sm text-ink placeholder:text-ink-soft/60 bg-cream focus:ring-2 focus:ring-teal-mid/20 focus:border-teal-mid outline-none transition-all">
          </div>
          <div class="flex gap-1 bg-cream-2 rounded-xl p-1 overflow-x-auto lg:ml-auto">
            @for (tab of estadoTabs; track tab.value) {
              <button (click)="filtroEstado.set(tab.value)"
                class="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer"
                [ngClass]="filtroEstado() === tab.value
                  ? 'bg-white text-teal-deep shadow-sm'
                  : 'text-ink-soft hover:text-teal-deep'">
                {{ tab.label }}
                <span class="text-xs font-semibold" [ngClass]="filtroEstado() === tab.value ? 'text-teal-mid' : 'text-ink-soft'">
                  {{ counts()[tab.value] }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex items-center justify-center py-20">
            <div class="flex flex-col items-center gap-3">
              <div class="w-10 h-10 border-4 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
              <span class="text-sm text-ink-soft">Cargando pagos...</span>
            </div>
          </div>
        }

        <!-- Empty -->
        @if (!loading() && pagos().length === 0) {
          <div class="p-16 text-center">
            <div class="w-16 h-16 bg-cream-2 rounded-full flex items-center justify-center mx-auto mb-4 text-ink-soft/60">
              <lucide-angular [img]="CreditCardIcon" [size]="32" />
            </div>
            <h3 class="text-lg font-semibold text-ink">Sin pagos</h3>
            <p class="text-sm text-ink-soft mt-1">
              {{ searchQuery() || filtroEstado() !== 'todos' ? 'No se encontraron pagos con esos filtros' : 'No hay pagos registrados' }}
            </p>
          </div>
        }

        @if (!loading() && pagos().length > 0) {
          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-cream border-b border-green-cream">
                  <th class="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Cliente</th>
                  <th class="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Fecha</th>
                  <th class="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Estado</th>
                  <th class="text-left text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Método</th>
                  <th class="text-right text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Monto</th>
                  <th class="text-right text-xs font-semibold text-ink-soft uppercase tracking-wider px-6 py-3.5">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-green-cream">
                @for (pago of pagos(); track pago.id) {
                  <tr class="hover:bg-cream/70 transition-colors">
                    <td class="px-6 py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                             [ngClass]="hasName(pago) ? 'bg-green-pale text-teal-deep' : 'bg-cream-2 text-ink-soft'">
                          {{ initials(pago) }}
                        </div>
                        <div class="flex flex-col min-w-0">
                          <span class="text-sm font-semibold text-ink">{{ hasName(pago) ? pago.client_nombre : pago.client_email }}</span>
                          <span class="text-xs text-ink-soft">{{ hasName(pago) ? pago.client_email : 'Sin nombre aún' }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-3.5 text-sm text-ink-soft whitespace-nowrap">{{ pago.fecha_pago | date:'dd/MM/yyyy · HH:mm' }}</td>
                    <td class="px-6 py-3.5">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                        [ngClass]="{
                          'bg-amber-100 text-amber-800': pago.estado === 'pendiente',
                          'bg-green-pale text-teal-deep': pago.estado === 'aprobado',
                          'bg-red-100 text-red-700': pago.estado === 'rechazado'
                        }">
                        <span class="w-1.5 h-1.5 rounded-full"
                          [ngClass]="{
                            'bg-amber-500': pago.estado === 'pendiente',
                            'bg-green-leaf': pago.estado === 'aprobado',
                            'bg-red-500': pago.estado === 'rechazado'
                          }"></span>
                        {{ estadoLabel(pago.estado) }}
                      </span>
                    </td>
                    <td class="px-6 py-3.5 text-sm">
                      @if (pago.estado === 'pendiente') {
                        <span class="text-ink-soft">Se define al aprobar</span>
                      } @else if (pago.estado === 'aprobado' && pago.metodo_pago) {
                        <span class="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                          [ngClass]="pago.metodo_pago === 'yape' ? 'bg-purple-100 text-purple-700' : 'bg-cyan-ring/20 text-teal-mid'">
                          {{ pago.metodo_pago === 'yape' ? 'Yape' : 'Efectivo' }}
                        </span>
                      } @else {
                        <span class="text-ink-soft">—</span>
                      }
                    </td>
                    <td class="px-6 py-3.5 text-right text-sm">
                      @if (pago.estado === 'aprobado' && pago.monto != null) {
                        <span class="font-bold text-ink">S/ {{ pago.monto | number:'1.2-2' }}</span>
                      } @else {
                        <span class="text-ink-soft">—</span>
                      }
                    </td>
                    <td class="px-6 py-3.5">
                      <div class="flex items-center justify-end gap-2">
                        @if (pago.comprobante_url) {
                          <button (click)="openComprobante(pago.comprobante_url)" title="Ver comprobante" aria-label="Ver comprobante"
                            class="w-10 h-10 shrink-0 flex items-center justify-center text-teal-mid bg-white border border-green-cream hover:bg-cream-2 rounded-xl transition-colors cursor-pointer">
                            <lucide-angular [img]="EyeIcon" [size]="16" />
                          </button>
                        }
                        @if (pago.estado === 'pendiente') {
                          <button (click)="openRechazar(pago)" [disabled]="procesando()" title="Rechazar" aria-label="Rechazar pago"
                            class="w-10 h-10 shrink-0 flex items-center justify-center text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                            <lucide-angular [img]="XIcon" [size]="16" />
                          </button>
                          <button (click)="openAprobar(pago)" [disabled]="procesando()"
                            class="h-10 px-4 shrink-0 flex items-center gap-1.5 text-sm font-semibold text-white bg-teal-mid rounded-xl hover:bg-teal-deep transition-colors disabled:opacity-50 cursor-pointer">
                            <lucide-angular [img]="CheckIcon" [size]="15" />
                            Aprobar
                          </button>
                        } @else if (pago.revisado_por) {
                          <span class="text-sm text-ink-soft whitespace-nowrap">
                            {{ pago.estado === 'aprobado' ? 'Aprobado' : 'Rechazado' }} por {{ pago.revisado_por }}
                          </span>
                        } @else if (!pago.comprobante_url) {
                          <span class="text-sm text-ink-soft">—</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden divide-y divide-green-cream">
            @for (pago of pagos(); track pago.id) {
              <div class="p-4">
                <div class="flex items-start justify-between gap-2 mb-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                         [ngClass]="hasName(pago) ? 'bg-green-pale text-teal-deep' : 'bg-cream-2 text-ink-soft'">
                      {{ initials(pago) }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-ink truncate">{{ hasName(pago) ? pago.client_nombre : pago.client_email }}</p>
                      <p class="text-xs text-ink-soft truncate">{{ hasName(pago) ? pago.client_email : 'Sin nombre aún' }}</p>
                    </div>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                    [ngClass]="{
                      'bg-amber-100 text-amber-800': pago.estado === 'pendiente',
                      'bg-green-pale text-teal-deep': pago.estado === 'aprobado',
                      'bg-red-100 text-red-700': pago.estado === 'rechazado'
                    }">
                    {{ estadoLabel(pago.estado) }}
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div>
                    <p class="text-ink-soft">Fecha</p>
                    <p class="text-ink font-medium">{{ pago.fecha_pago | date:'dd/MM/yyyy' }}</p>
                  </div>
                  <div>
                    <p class="text-ink-soft">Método</p>
                    <p class="text-ink font-medium">
                      {{ pago.estado === 'aprobado' && pago.metodo_pago ? (pago.metodo_pago === 'yape' ? 'Yape' : 'Efectivo') : (pago.estado === 'pendiente' ? 'Al aprobar' : '—') }}
                    </p>
                  </div>
                  <div>
                    <p class="text-ink-soft">Monto</p>
                    <p class="text-ink font-bold">{{ pago.estado === 'aprobado' && pago.monto != null ? ('S/ ' + (pago.monto | number:'1.2-2')) : '—' }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  @if (pago.comprobante_url) {
                    <button (click)="openComprobante(pago.comprobante_url)"
                      class="flex-1 py-2 text-xs font-semibold text-teal-mid bg-white border border-green-cream rounded-lg hover:bg-cream-2 transition-colors cursor-pointer">
                      Ver comprobante
                    </button>
                  }
                  @if (pago.estado === 'pendiente') {
                    <button (click)="openRechazar(pago)" [disabled]="procesando()"
                      class="flex-1 py-2 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer">
                      Rechazar
                    </button>
                    <button (click)="openAprobar(pago)" [disabled]="procesando()"
                      class="flex-1 py-2 text-xs font-semibold text-white bg-teal-mid rounded-lg hover:bg-teal-deep disabled:opacity-50 transition-colors cursor-pointer">
                      Aprobar
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <p class="px-6 py-3.5 text-sm text-ink-soft border-t border-green-cream">
            {{ pagos().length }} {{ pagos().length === 1 ? 'pago' : 'pagos' }} · El método y el monto se registran al aprobar
          </p>
        }
      </div>
    </div>

    <!-- Comprobante Modal -->
    @if (comprobanteUrl()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" (click)="comprobanteUrl.set(null)">
        <div class="relative max-w-lg w-full" (click)="$event.stopPropagation()">
          <button (click)="comprobanteUrl.set(null)"
            class="absolute -top-10 right-0 text-white/80 hover:text-white text-sm flex items-center gap-1 cursor-pointer">
            <lucide-angular [img]="CircleXIcon" [size]="18" /> Cerrar
          </button>
          <img [src]="comprobanteUrl()!" alt="Comprobante de pago"
            class="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
        </div>
      </div>
    }

    <!-- Aprobar Modal -->
    @if (aprobarTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-deep/40 backdrop-blur-sm" (click)="aprobarTarget.set(null)">
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7 animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between gap-4 mb-1">
            <h3 class="text-2xl font-extrabold text-teal-deep">Aprobar pago</h3>
            <button (click)="aprobarTarget.set(null)" aria-label="Cerrar" class="p-1.5 rounded-lg text-ink hover:bg-cream-2 transition-colors cursor-pointer">
              <lucide-angular [img]="XIcon" [size]="20" />
            </button>
          </div>
          <p class="text-sm text-ink-soft mb-5">
            ¿Cómo te pagó <span class="font-bold text-teal-deep">{{ hasName(aprobarTarget()!) ? aprobarTarget()!.client_nombre : aprobarTarget()!.client_email }}</span>?
          </p>

          <div class="grid grid-cols-2 gap-3 mb-6">
            <button type="button" (click)="metodoAprobacion.set('yape')"
              class="relative flex flex-col items-center gap-3 py-6 rounded-2xl border-2 transition-all cursor-pointer"
              [ngClass]="metodoAprobacion() === 'yape'
                ? 'border-teal-mid bg-cyan-ring/10'
                : 'border-green-cream bg-white hover:bg-cream'">
              @if (metodoAprobacion() === 'yape') {
                <span class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-teal-mid text-white flex items-center justify-center">
                  <lucide-angular [img]="CheckIcon" [size]="14" />
                </span>
              }
              <lucide-angular [img]="SmartphoneIcon" [size]="26" class="text-purple-700" />
              <span class="text-base font-medium text-ink">Yape</span>
            </button>
            <button type="button" (click)="metodoAprobacion.set('efectivo')"
              class="relative flex flex-col items-center gap-3 py-6 rounded-2xl border-2 transition-all cursor-pointer"
              [ngClass]="metodoAprobacion() === 'efectivo'
                ? 'border-teal-mid bg-cyan-ring/10'
                : 'border-green-cream bg-white hover:bg-cream'">
              @if (metodoAprobacion() === 'efectivo') {
                <span class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-teal-mid text-white flex items-center justify-center">
                  <lucide-angular [img]="CheckIcon" [size]="14" />
                </span>
              }
              <lucide-angular [img]="BanknoteIcon" [size]="26" class="text-teal-mid" />
              <span class="text-base font-medium text-ink">Efectivo</span>
            </button>
          </div>

          <label for="monto-recibido" class="block text-sm font-semibold text-ink mb-1.5">Monto recibido</label>
          <div class="flex items-center gap-2 px-4 py-3 rounded-2xl border border-green-cream bg-cream focus-within:ring-2 focus-within:ring-teal-mid/20 focus-within:border-teal-mid transition-all">
            <span class="text-sm font-bold text-ink-soft">S/</span>
            <input id="monto-recibido" type="number" min="0" step="0.01" inputmode="decimal"
              [ngModel]="montoAprobacion()" (ngModelChange)="montoAprobacion.set($event)"
              placeholder="15.00"
              class="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-ink-soft/60 outline-none" />
          </div>
          <p class="mt-1.5 text-xs text-ink-soft">Membresía mensual: S/ {{ montoMembresia | number:'1.2-2' }}. Cámbialo si aplicaste un descuento.</p>

          <div class="mt-6 flex gap-3">
            <button (click)="aprobarTarget.set(null)"
              class="flex-1 py-3 text-sm font-semibold text-ink-soft bg-white border border-green-cream rounded-2xl hover:bg-cream-2 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="confirmarAprobacion()" [disabled]="!metodoAprobacion() || !montoValido() || procesando()"
              class="flex-1 py-3 text-sm font-bold text-white bg-teal-mid rounded-2xl hover:bg-teal-deep disabled:opacity-50 transition-colors cursor-pointer">
              {{ procesando() ? 'Aprobando...' : 'Confirmar pago' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Rechazar Modal -->
    @if (rechazarTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" (click)="rechazarTarget.set(null)">
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold text-gray-900 mb-1">Rechazar pago</h3>
          <p class="text-sm text-gray-400 mb-4">
            Rechazar el pago de <span class="font-semibold text-gray-700">{{ rechazarTarget()!.client_nombre }}</span>
          </p>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
          <textarea [(ngModel)]="notasRechazar" rows="3" placeholder="Motivo del rechazo..."
            class="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] transition-all resize-none"></textarea>
          <div class="flex gap-3 mt-4">
            <button (click)="rechazarTarget.set(null)"
              class="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="rechazar()" [disabled]="procesando()"
              class="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer">
              {{ procesando() ? 'Rechazando...' : 'Rechazar pago' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class PagosPendientesComponent implements OnInit {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private adminService = inject(AdminService);

  readonly RefreshIcon = RefreshCw;
  readonly CheckCircleIcon = CheckCircle;
  readonly CircleXIcon = CircleX;
  readonly EyeIcon = Eye;
  readonly CreditCardIcon = CreditCard;
  readonly ClockIcon = Clock;
  readonly SmartphoneIcon = Smartphone;
  readonly BanknoteIcon = Banknote;
  readonly TrendingUpIcon = TrendingUp;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly estadoTabs: { label: string; value: EstadoFiltro }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Por confirmar', value: 'pendiente' },
    { label: 'Aprobados', value: 'aprobado' },
    { label: 'Rechazados', value: 'rechazado' },
  ];
  readonly monthName = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date());

  allPagos = signal<PagoListItem[]>([]);
  stats = signal<AdminDashboard | null>(null);
  loading = signal(false);
  procesando = signal(false);
  comprobanteUrl = signal<string | null>(null);
  rechazarTarget = signal<PagoListItem | null>(null);
  aprobarTarget = signal<PagoListItem | null>(null);
  metodoAprobacion = signal<'yape' | 'efectivo' | null>(null);
  readonly montoMembresia = 15;
  montoAprobacion = signal<number | null>(this.montoMembresia);
  montoValido = computed(() => {
    const m = this.montoAprobacion();
    return m != null && Number(m) > 0;
  });
  notasRechazar = '';
  filtroEstado = signal<EstadoFiltro>('todos');
  searchQuery = signal('');

  counts = computed<Record<EstadoFiltro, number>>(() => {
    const list = this.allPagos();
    return {
      todos: list.length,
      pendiente: list.filter(p => p.estado === 'pendiente').length,
      aprobado: list.filter(p => p.estado === 'aprobado').length,
      rechazado: list.filter(p => p.estado === 'rechazado').length,
    };
  });

  pagos = computed(() => {
    const estado = this.filtroEstado();
    const q = this.searchQuery().toLowerCase().trim();
    return this.allPagos().filter(p => {
      if (estado !== 'todos' && p.estado !== estado) return false;
      if (!q) return true;
      return (p.client_nombre ?? '').toLowerCase().includes(q) ||
        (p.client_email ?? '').toLowerCase().includes(q) ||
        (p.client_phone ?? '').toLowerCase().includes(q);
    });
  });

  ngOnInit(): void {
    this.loadPagos();
  }

  loadPagos(): void {
    this.loading.set(true);
    this.http.get<PagoListItem[]>(`${API}/pagos/lista`).subscribe({
      next: (res) => { this.allPagos.set(res); this.loading.set(false); },
      error: () => { this.toastr.error('Error al cargar pagos', 'Error'); this.loading.set(false); },
    });
    this.adminService.getDashboard().subscribe({
      next: (res) => this.stats.set(res),
    });
  }

  /** El backend devuelve el email como nombre cuando el cliente aún no lo registra. */
  hasName(p: PagoListItem): boolean {
    const n = (p.client_nombre ?? '').trim();
    return !!n && !n.includes('@');
  }

  initials(p: PagoListItem): string {
    if (!this.hasName(p)) return '?';
    const parts = p.client_nombre.trim().split(/\s+/);
    return ((parts[0][0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  estadoLabel(estado: PagoListItem['estado']): string {
    return estado === 'pendiente' ? 'Por confirmar' : estado === 'aprobado' ? 'Aprobado' : 'Rechazado';
  }

  openComprobante(url: string): void {
    this.comprobanteUrl.set(url);
  }

  openRechazar(pago: PagoListItem): void {
    this.rechazarTarget.set(pago);
    this.notasRechazar = '';
  }

  openAprobar(pago: PagoListItem): void {
    this.aprobarTarget.set(pago);
    this.metodoAprobacion.set(null);
    this.montoAprobacion.set(this.montoMembresia);
  }

  confirmarAprobacion(): void {
    const target = this.aprobarTarget();
    const metodo = this.metodoAprobacion();
    const monto = this.montoAprobacion();
    if (!target || !metodo || monto == null || !(Number(monto) > 0)) return;
    this.procesando.set(true);
    this.http.put(`${API}/pagos/${target.id}/aprobar`, { metodo_pago: metodo, monto: Number(monto) }).subscribe({
      next: () => {
        this.toastr.success(`Pago de ${target.client_nombre} aprobado`, '¡Aprobado!');
        this.aprobarTarget.set(null);
        this.procesando.set(false);
        this.loadPagos();
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al aprobar pago', 'Error');
        this.procesando.set(false);
      },
    });
  }

  rechazar(): void {
    const target = this.rechazarTarget();
    if (!target) return;
    this.procesando.set(true);
    this.http.put(`${API}/pagos/${target.id}/rechazar`, { notas_admin: this.notasRechazar || undefined }).subscribe({
      next: () => {
        this.toastr.success('Pago rechazado', 'Rechazado');
        this.rechazarTarget.set(null);
        this.procesando.set(false);
        this.loadPagos();
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al rechazar pago', 'Error');
        this.procesando.set(false);
      },
    });
  }
}
