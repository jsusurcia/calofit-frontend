import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, CreditCard, CheckCircle, CircleX, Eye, RefreshCw, Clock, Banknote, Smartphone } from 'lucide-angular';

const API = 'http://calofitbackendmarketing-production.up.railway.app';

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
}

type EstadoFiltro = '' | 'pendiente' | 'aprobado' | 'rechazado';

@Component({
  selector: 'app-pagos-pendientes',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Pagos</h1>
          <p class="text-sm text-gray-400 mt-0.5">Historial y gestión de pagos</p>
        </div>
        <button (click)="loadPagos()" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
          <lucide-angular [img]="RefreshIcon" [size]="15" />
          Actualizar
        </button>
      </div>

      <!-- Search + Filtro -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <div class="relative max-w-lg">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text" [ngModel]="searchQuery()" (ngModelChange)="onQueryChange($event)"
            placeholder="Buscar por nombre, email o teléfono..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
        </div>
        <div class="flex gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
          @for (tab of estadoTabs; track tab.value) {
            <button
              (click)="setFiltro(tab.value)"
              class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              [ngClass]="filtroEstado() === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'"
            >
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-3 border-blue-200 border-t-[#146aff] rounded-full animate-spin"></div>
            <span class="text-sm text-gray-400">Cargando pagos...</span>
          </div>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && pagos().length === 0) {
        <div class="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <lucide-angular [img]="CreditCardIcon" [size]="32" />
          </div>
          <h3 class="text-lg font-semibold text-gray-700">Sin pagos</h3>
          <p class="text-sm text-gray-400 mt-1">
            {{ searchQuery() ? 'No se encontraron pagos con esa búsqueda' : 'No hay pagos registrados' }}
          </p>
        </div>
      }

      @if (!loading() && pagos().length > 0) {
        <!-- Desktop Table -->
        <div class="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50/50">
                  <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Cliente</th>
                  <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Método</th>
                  <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Concepto</th>
                  <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Monto</th>
                  <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Fecha</th>
                  <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Estado</th>
                  <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Comprobante</th>
                  <th class="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (pago of pagos(); track pago.id) {
                  <tr class="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                    <td class="px-5 py-4">
                      <p class="text-sm font-semibold text-gray-800">{{ pago.client_nombre }}</p>
                      <p class="text-xs text-gray-400">{{ pago.client_email }}</p>
                      @if (pago.client_phone) {
                        <p class="text-xs text-gray-400">{{ pago.client_phone }}</p>
                      }
                    </td>
                    <td class="px-5 py-4">
                      @if (pago.metodo_pago) {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          [ngClass]="pago.metodo_pago === 'yape' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'">
                          <lucide-angular [img]="pago.metodo_pago === 'yape' ? SmartphoneIcon : BanknoteIcon" [size]="12" />
                          {{ pago.metodo_pago === 'yape' ? 'Yape' : 'Efectivo' }}
                        </span>
                      } @else {
                        <span class="text-xs text-gray-300">—</span>
                      }
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-600">{{ pago.concepto || '—' }}</td>
                    <td class="px-5 py-4 text-center">
                      <span class="text-sm font-semibold text-gray-800">
                        {{ pago.monto != null ? ('S/ ' + (pago.monto | number:'1.2-2')) : '—' }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-center text-xs text-gray-500">
                      {{ pago.fecha_pago | date:'dd/MM/yyyy HH:mm' }}
                    </td>
                    <td class="px-5 py-4 text-center">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        [ngClass]="{
                          'bg-yellow-50 text-yellow-700': pago.estado === 'pendiente',
                          'bg-emerald-50 text-emerald-700': pago.estado === 'aprobado',
                          'bg-red-50 text-red-600': pago.estado === 'rechazado'
                        }">
                        <lucide-angular [size]="11"
                          [img]="pago.estado === 'aprobado' ? CheckCircleIcon : pago.estado === 'rechazado' ? CircleXIcon : ClockIcon" />
                        {{ pago.estado | titlecase }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-center">
                      @if (pago.comprobante_url) {
                        <button (click)="openComprobante(pago.comprobante_url)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                          <lucide-angular [img]="EyeIcon" [size]="13" />
                          Ver
                        </button>
                      } @else {
                        <span class="text-xs text-gray-300">—</span>
                      }
                    </td>
                    <td class="px-5 py-4 text-right">
                      @if (pago.estado === 'pendiente') {
                        <div class="flex items-center justify-end gap-2">
                          <button (click)="openAprobar(pago)" [disabled]="procesando()"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer">
                            <lucide-angular [img]="CheckCircleIcon" [size]="13" />
                            Aprobar
                          </button>
                          <button (click)="openRechazar(pago)" [disabled]="procesando()"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer">
                            <lucide-angular [img]="CircleXIcon" [size]="13" />
                            Rechazar
                          </button>
                        </div>
                      } @else {
                        <span class="text-xs text-gray-300">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-3">
          @for (pago of pagos(); track pago.id) {
            <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ pago.client_nombre }}</p>
                  <p class="text-xs text-gray-400">{{ pago.client_email }}</p>
                  @if (pago.client_phone) {
                    <p class="text-xs text-gray-400">{{ pago.client_phone }}</p>
                  }
                </div>
                <div class="flex flex-col items-end gap-1">
                  @if (pago.metodo_pago) {
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      [ngClass]="pago.metodo_pago === 'yape' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'">
                      {{ pago.metodo_pago === 'yape' ? 'Yape' : 'Efectivo' }}
                    </span>
                  }
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="{
                      'bg-yellow-50 text-yellow-700': pago.estado === 'pendiente',
                      'bg-emerald-50 text-emerald-700': pago.estado === 'aprobado',
                      'bg-red-50 text-red-600': pago.estado === 'rechazado'
                    }">
                    {{ pago.estado | titlecase }}
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p class="text-gray-400">Concepto</p>
                  <p class="text-gray-700 font-medium">{{ pago.concepto || '—' }}</p>
                </div>
                <div>
                  <p class="text-gray-400">Monto</p>
                  <p class="text-gray-700 font-semibold">{{ pago.monto != null ? ('S/ ' + (pago.monto | number:'1.2-2')) : '—' }}</p>
                </div>
              </div>
              <div class="flex gap-2">
                @if (pago.comprobante_url) {
                  <button (click)="openComprobante(pago.comprobante_url)"
                    class="flex-1 py-2 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    Ver comprobante
                  </button>
                }
                @if (pago.estado === 'pendiente') {
                  <button (click)="openAprobar(pago)" [disabled]="procesando()"
                    class="flex-1 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer">
                    Aprobar
                  </button>
                  <button (click)="openRechazar(pago)" [disabled]="procesando()"
                    class="flex-1 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer">
                    Rechazar
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
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
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" (click)="aprobarTarget.set(null)">
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold text-gray-900 mb-1">Aprobar pago</h3>
          <p class="text-sm text-gray-400 mb-5">
            Selecciona el medio de pago de <span class="font-semibold text-gray-700">{{ aprobarTarget()!.client_nombre }}</span>
          </p>
          <div class="flex gap-3 mb-6">
            <button type="button" (click)="metodoAprobacion.set('yape')"
              class="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all cursor-pointer"
              [ngClass]="metodoAprobacion() === 'yape'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'">
              <lucide-angular [img]="SmartphoneIcon" [size]="22" />
              <span class="text-sm font-semibold">Yape</span>
            </button>
            <button type="button" (click)="metodoAprobacion.set('efectivo')"
              class="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all cursor-pointer"
              [ngClass]="metodoAprobacion() === 'efectivo'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'">
              <lucide-angular [img]="BanknoteIcon" [size]="22" />
              <span class="text-sm font-semibold">Efectivo</span>
            </button>
          </div>
          <div class="flex gap-3">
            <button (click)="aprobarTarget.set(null)"
              class="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="confirmarAprobacion()" [disabled]="!metodoAprobacion() || procesando()"
              class="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer">
              {{ procesando() ? 'Aprobando...' : 'Confirmar' }}
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

  readonly RefreshIcon = RefreshCw;
  readonly CheckCircleIcon = CheckCircle;
  readonly CircleXIcon = CircleX;
  readonly EyeIcon = Eye;
  readonly CreditCardIcon = CreditCard;
  readonly ClockIcon = Clock;
  readonly SmartphoneIcon = Smartphone;
  readonly BanknoteIcon = Banknote;
  readonly estadoTabs: { label: string; value: EstadoFiltro }[] = [
    { label: 'Todos', value: '' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Aprobado', value: 'aprobado' },
  ];

  pagos = signal<PagoListItem[]>([]);
  loading = signal(false);
  procesando = signal(false);
  comprobanteUrl = signal<string | null>(null);
  rechazarTarget = signal<PagoListItem | null>(null);
  aprobarTarget = signal<PagoListItem | null>(null);
  metodoAprobacion = signal<'yape' | 'efectivo' | null>(null);
  notasRechazar = '';
  filtroEstado = signal<EstadoFiltro>('');
  searchQuery = signal('');

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadPagos();
  }

  onQueryChange(q: string): void {
    this.searchQuery.set(q);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadPagos(), 400);
  }

  setFiltro(estado: EstadoFiltro): void {
    this.filtroEstado.set(estado);
    this.loadPagos();
  }

  loadPagos(): void {
    this.loading.set(true);
    const q = this.searchQuery().trim();
    const estado = this.filtroEstado();

    const params: Record<string, string> = {};
    if (estado) params['estado'] = estado;

    const endpoint = q ? `${API}/pagos/buscar` : `${API}/pagos/lista`;
    if (q) params['q'] = q;

    this.http.get<PagoListItem[]>(endpoint, { params }).subscribe({
      next: (res) => { this.pagos.set(res); this.loading.set(false); },
      error: () => { this.toastr.error('Error al cargar pagos', 'Error'); this.loading.set(false); },
    });
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
  }

  confirmarAprobacion(): void {
    const target = this.aprobarTarget();
    const metodo = this.metodoAprobacion();
    if (!target || !metodo) return;
    this.procesando.set(true);
    this.http.put(`${API}/pagos/${target.id}/aprobar`, { metodo_pago: metodo }).subscribe({
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
