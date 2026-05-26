import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, CreditCard, CheckCircle, CircleX, Eye, RefreshCw, Clock, Banknote, Smartphone, Plus } from 'lucide-angular';
import { AdminService, ClienteAdmin, RegistrarPagoPayload } from '../../../core/services/admin.service';

const API = 'http://localhost:8000';

interface PagoListItem {
  id: number;
  client_id: number;
  client_nombre: string;
  client_email: string;
  metodo_pago: 'yape' | 'efectivo';
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  monto: number | null;
  concepto: string | null;
  comprobante_url: string | null;
  fecha_pago: string;
}

@Component({
  selector: 'app-pagos-pendientes',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Cola de pagos</h1>
          <p class="text-sm text-gray-400 mt-0.5">Pagos pendientes de validación</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="loadPagos()" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <lucide-angular [img]="RefreshIcon" [size]="15" />
            Actualizar
          </button>
          <button (click)="openRegistrar()" class="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-[#146aff]/20 cursor-pointer">
            <lucide-angular [img]="PlusIcon" [size]="15" />
            Registrar pago
          </button>
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
          <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <lucide-angular [img]="CheckCircleIcon" [size]="32" />
          </div>
          <h3 class="text-lg font-semibold text-gray-700">Sin pagos pendientes</h3>
          <p class="text-sm text-gray-400 mt-1">Todos los pagos han sido procesados</p>
        </div>
      }

      <!-- Table -->
      @if (!loading() && pagos().length > 0) {
        <!-- Desktop -->
        <div class="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50/50">
                  <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Paciente</th>
                  <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Método</th>
                  <th class="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Concepto</th>
                  <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Monto</th>
                  <th class="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Fecha</th>
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
                    </td>
                    <td class="px-5 py-4">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        [ngClass]="pago.metodo_pago === 'yape' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'">
                        <lucide-angular [img]="pago.metodo_pago === 'yape' ? SmartphoneIcon : BanknoteIcon" [size]="12" />
                        {{ pago.metodo_pago === 'yape' ? 'Yape' : 'Efectivo' }}
                      </span>
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
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="aprobar(pago)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer">
                          <lucide-angular [img]="CheckCircleIcon" [size]="13" />
                          Aprobar
                        </button>
                        <button (click)="openRechazar(pago)"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                          <lucide-angular [img]="CircleXIcon" [size]="13" />
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Mobile cards -->
        <div class="md:hidden space-y-3">
          @for (pago of pagos(); track pago.id) {
            <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ pago.client_nombre }}</p>
                  <p class="text-xs text-gray-400">{{ pago.client_email }}</p>
                </div>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="pago.metodo_pago === 'yape' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'">
                  {{ pago.metodo_pago === 'yape' ? 'Yape' : 'Efectivo' }}
                </span>
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
                <button (click)="aprobar(pago)"
                  class="flex-1 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer">
                  Aprobar
                </button>
                <button (click)="openRechazar(pago)"
                  class="flex-1 py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                  Rechazar
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Registrar Pago Modal -->
    @if (showRegistrar()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" (click)="showRegistrar.set(false)">
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Registrar pago</h3>

          <div class="space-y-4">
            <!-- Cliente -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Cliente <span class="text-red-400">*</span></label>
              <select [(ngModel)]="registrarForm.client_id"
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all bg-white">
                <option [value]="0" disabled>Seleccionar cliente...</option>
                @for (c of clientes(); track c.id) {
                  <option [value]="c.id">{{ c.nombre }} {{ c.apellido }} — {{ c.email }}</option>
                }
              </select>
            </div>

            <!-- Método de pago -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Método de pago <span class="text-red-400">*</span></label>
              <div class="flex gap-3">
                <button type="button" (click)="registrarForm.metodo_pago = 'efectivo'"
                  class="flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all cursor-pointer"
                  [ngClass]="registrarForm.metodo_pago === 'efectivo' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'">
                  Efectivo
                </button>
                <button type="button" (click)="registrarForm.metodo_pago = 'yape'"
                  class="flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all cursor-pointer"
                  [ngClass]="registrarForm.metodo_pago === 'yape' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'">
                  Yape
                </button>
              </div>
            </div>

            <!-- Monto -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Monto (S/) <span class="text-red-400">*</span></label>
              <input type="number" [(ngModel)]="registrarForm.monto" min="0" step="0.50" placeholder="0.00" readonly
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>

            <!-- Concepto -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Concepto</label>
              <input type="text" [(ngModel)]="registrarForm.concepto" placeholder="Suscripción" readonly
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button (click)="showRegistrar.set(false)"
              class="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="submitRegistrar()" [disabled]="registrando()"
              class="flex-1 py-2.5 text-sm font-semibold text-white bg-[#146aff] rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
              {{ registrando() ? 'Registrando...' : 'Registrar' }}
            </button>
          </div>
        </div>
      </div>
    }

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
  readonly PlusIcon = Plus;

  pagos = signal<PagoListItem[]>([]);
  clientes = signal<ClienteAdmin[]>([]);
  loading = signal(false);
  procesando = signal(false);
  registrando = signal(false);
  comprobanteUrl = signal<string | null>(null);
  rechazarTarget = signal<PagoListItem | null>(null);
  showRegistrar = signal(false);
  notasRechazar = '';

  registrarForm: RegistrarPagoPayload = { client_id: 0, metodo_pago: 'efectivo', monto: 7.00, concepto: 'Suscripción' };

  ngOnInit() {
    this.loadPagos();
    this.adminService.getClientes().subscribe({ next: (res) => this.clientes.set(res), error: () => {} });
  }

  openRegistrar(): void {
    this.registrarForm = { client_id: 0, metodo_pago: 'efectivo', monto: 7.00, concepto: 'Suscripción' };
    this.showRegistrar.set(true);
  }

  submitRegistrar(): void {
    if (!this.registrarForm.client_id) { this.toastr.warning('Selecciona un cliente', ''); return; }
    if (!this.registrarForm.monto || this.registrarForm.monto <= 0) { this.toastr.warning('Ingresa un monto válido', ''); return; }
    this.registrando.set(true);
    this.adminService.registrarPago(this.registrarForm).subscribe({
      next: () => {
        this.toastr.success('Pago registrado correctamente', '¡Registrado!');
        this.showRegistrar.set(false);
        this.registrando.set(false);
        this.loadPagos();
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al registrar pago', 'Error');
        this.registrando.set(false);
      },
    });
  }

  loadPagos(): void {
    this.loading.set(true);
    this.http.get<PagoListItem[]>(`${API}/pagos/pendientes`).subscribe({
      next: (res) => {
        this.pagos.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Error al cargar pagos pendientes', 'Error');
        this.loading.set(false);
      },
    });
  }

  openComprobante(url: string): void {
    this.comprobanteUrl.set(url);
  }

  openRechazar(pago: PagoListItem): void {
    this.rechazarTarget.set(pago);
    this.notasRechazar = '';
  }

  aprobar(pago: PagoListItem): void {
    this.procesando.set(true);
    this.http.put(`${API}/pagos/${pago.id}/aprobar`, {}).subscribe({
      next: () => {
        this.toastr.success(`Pago de ${pago.client_nombre} aprobado`, '¡Aprobado!');
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
        this.toastr.success(`Pago rechazado`, 'Rechazado');
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
