import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, CreditCard, Smartphone, Banknote, CheckCircle } from 'lucide-angular';

const API = 'http://localhost:8000';
const MONTO = 15;

@Component({
  selector: 'app-pago',
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-lg mx-auto space-y-6">
      <div class="animate-fade-in-up">
        <h1 class="text-2xl font-bold text-gray-800">Registrar pago</h1>
        <p class="text-sm text-gray-400 mt-1">Envía tu comprobante de membresía mensual</p>
      </div>

      @if (enviado()) {
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center animate-fade-in-up">
          <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <lucide-angular [img]="CheckCircleIcon" [size]="32" />
          </div>
          <h3 class="text-lg font-bold text-gray-800">¡Pago registrado!</h3>
          <p class="text-sm text-gray-500 mt-1">Tu comprobante fue enviado. El equipo lo revisará pronto.</p>
          <button (click)="reiniciar()"
            class="mt-6 px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors cursor-pointer">
            Registrar otro pago
          </button>
        </div>
      } @else {
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 animate-fade-in-up">

          <!-- Precio -->
          <div class="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                <lucide-angular [img]="CreditCardIcon" [size]="20" />
              </div>
              <div>
                <p class="text-xs text-primary-500 font-medium uppercase tracking-wide">Membresía mensual</p>
                <p class="text-xs text-primary-400">Acceso completo a CaloFit</p>
              </div>
            </div>
            <p class="text-2xl font-bold text-primary-700">S/ {{ MONTO }}.00</p>
          </div>

          <!-- Medio de pago -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">Medio de pago</label>
            <div class="flex gap-3">
              <button type="button" (click)="metodoPago.set('yape')"
                class="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer"
                [ngClass]="metodoPago() === 'yape'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'">
                <lucide-angular [img]="SmartphoneIcon" [size]="22" />
                <span class="text-sm font-semibold">Yape</span>
              </button>
              <button type="button" (click)="metodoPago.set('efectivo')"
                class="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer"
                [ngClass]="metodoPago() === 'efectivo'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'">
                <lucide-angular [img]="BanknoteIcon" [size]="22" />
                <span class="text-sm font-semibold">Efectivo</span>
              </button>
            </div>
          </div>

          <!-- Comprobante -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Comprobante de pago</label>
            <label class="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all"
              [ngClass]="comprobante() ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'">
              @if (comprobante()) {
                <img [src]="comprobantePreview()" alt="Vista previa" class="h-full w-full object-contain rounded-xl p-1" />
              } @else {
                <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span class="text-xs text-gray-400">Toca para subir foto del comprobante</span>
              }
              <input type="file" accept="image/*" class="hidden" (change)="onFileChange($event)" />
            </label>
          </div>

          @if (error()) {
            <p class="text-xs text-red-500">{{ error() }}</p>
          }

          <button (click)="enviar()" [disabled]="enviando()"
            class="w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2">
            @if (enviando()) {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Enviando...
            } @else {
              Enviar comprobante
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`@reference "../../../../styles.css";`]
})
export class PagoComponent {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  readonly CreditCardIcon = CreditCard;
  readonly SmartphoneIcon = Smartphone;
  readonly BanknoteIcon = Banknote;
  readonly CheckCircleIcon = CheckCircle;
  readonly MONTO = MONTO;

  metodoPago = signal<'yape' | 'efectivo' | null>(null);
  comprobante = signal<File | null>(null);
  comprobantePreview = signal<string | null>(null);
  enviando = signal(false);
  enviado = signal(false);
  error = signal<string | null>(null);

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.comprobante.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.comprobantePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  enviar(): void {
    this.error.set(null);
    if (!this.metodoPago()) { this.error.set('Selecciona un medio de pago.'); return; }
    if (!this.comprobante()) { this.error.set('Adjunta el comprobante de pago.'); return; }

    const formData = new FormData();
    formData.append('metodo_pago', this.metodoPago()!);
    formData.append('monto', String(MONTO));
    formData.append('concepto', 'Membresía');
    formData.append('comprobante', this.comprobante()!);

    this.enviando.set(true);
    this.http.post(`${API}/pagos/registrar`, formData).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviado.set(true);
      },
      error: (err) => {
        this.toastr.error(err?.error?.detail ?? 'Error al enviar el pago. Intenta de nuevo.', 'Error');
        this.enviando.set(false);
      },
    });
  }

  reiniciar(): void {
    this.metodoPago.set(null);
    this.comprobante.set(null);
    this.comprobantePreview.set(null);
    this.enviado.set(false);
    this.error.set(null);
  }
}
