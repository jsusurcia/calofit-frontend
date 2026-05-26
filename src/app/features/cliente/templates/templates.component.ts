import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, RecetaTemplate, TemplateFilters } from '../../../core/services/cliente.service';
import { LucideAngularModule, UtensilsCrossed, RefreshCw, Filter } from 'lucide-angular';

@Component({
  selector: 'app-templates',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <div class="animate-fade-in-up">
        <h1 class="text-2xl font-bold text-gray-800">Recetas y Templates</h1>
        <p class="text-sm text-gray-400 mt-1">Encuentra recetas adaptadas a tu objetivo y presupuesto</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in-up">
        <div class="flex items-center gap-2 mb-4">
          <lucide-angular [img]="FilterIcon" [size]="16" class="text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-700">Filtros</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Tipo -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Tipo</label>
            <select [(ngModel)]="filters.tipo" (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all">
              <option value="">Todos</option>
              <option value="desayuno">Desayuno</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <!-- Presupuesto -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Presupuesto</label>
            <select [(ngModel)]="filters.budget" (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all">
              <option value="">Cualquiera</option>
              <option value="economico">Económico</option>
              <option value="moderado">Moderado</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <!-- Estilo -->
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Estilo</label>
            <select [(ngModel)]="filters.style" (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-[#146aff]/20 focus:border-[#146aff] outline-none transition-all">
              <option value="">Cualquiera</option>
              <option value="peruano">Peruano</option>
              <option value="vegetariano">Vegetariano</option>
              <option value="alto_proteina">Alto en proteína</option>
              <option value="ligero">Ligero</option>
              <option value="express">Express</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-3 border-primary-100 border-t-[#146aff] rounded-full animate-spin"></div>
            <p class="text-sm text-gray-400">Cargando recetas...</p>
          </div>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && templates().length === 0) {
        <div class="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <lucide-angular [img]="UtensilsIcon" [size]="32" />
          </div>
          <h3 class="text-base font-semibold text-gray-600">Sin recetas disponibles</h3>
          <p class="text-sm text-gray-400 mt-1">Prueba cambiando los filtros</p>
          <button (click)="resetFilters()"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors cursor-pointer">
            <lucide-angular [img]="RefreshIcon" [size]="14" />
            Limpiar filtros
          </button>
        </div>
      }

      <!-- Grid -->
      @if (!loading() && templates().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
          @for (t of templates(); track t.id) {
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <!-- Card Header -->
              <div class="px-5 py-4 border-b border-gray-50">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-semibold text-gray-900 leading-snug">{{ t.nombre }}</h3>
                  <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                    [ngClass]="tipoClass(t.tipo)">
                    {{ t.tipo }}
                  </span>
                </div>
              </div>
              <!-- Macros -->
              <div class="px-5 py-3 grid grid-cols-4 gap-2 border-b border-gray-50">
                <div class="text-center">
                  <p class="text-xs text-gray-400">kcal</p>
                  <p class="text-sm font-bold text-gray-800">{{ t.calorias }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-400">Prot.</p>
                  <p class="text-sm font-bold text-[#146aff]">{{ t.proteinas_g }}g</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-400">Carbs</p>
                  <p class="text-sm font-bold text-[#f4b400]">{{ t.carbohidratos_g }}g</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-400">Grasa</p>
                  <p class="text-sm font-bold text-red-400">{{ t.grasas_g }}g</p>
                </div>
              </div>
              <!-- Ingredients -->
              @if (t.ingredientes_principales.length) {
                <div class="px-5 py-3">
                  <p class="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">Ingredientes principales</p>
                  <div class="flex flex-wrap gap-1.5">
                    @for (ing of t.ingredientes_principales.slice(0, 4); track ing) {
                      <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{{ ing }}</span>
                    }
                    @if (t.ingredientes_principales.length > 4) {
                      <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-400">+{{ t.ingredientes_principales.length - 4 }}</span>
                    }
                  </div>
                </div>
              }
              <!-- Budget/Style badges -->
              <div class="px-5 pb-4 flex gap-1.5">
                @if (t.budget) {
                  <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 capitalize">{{ budgetLabel(t.budget) }}</span>
                }
                @if (t.style) {
                  <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 capitalize">{{ styleLabel(t.style) }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`@reference "../../../../styles.css";`]
})
export class TemplatesComponent {
  private clienteService = inject(ClienteService);

  readonly UtensilsIcon = UtensilsCrossed;
  readonly RefreshIcon = RefreshCw;
  readonly FilterIcon = Filter;

  templates = signal<RecetaTemplate[]>([]);
  loading = signal(false);

  filters: TemplateFilters = { tipo: '', budget: '', style: '' };

  constructor() {
    this.loadTemplates();
  }

  onFilterChange(): void {
    this.loadTemplates();
  }

  resetFilters(): void {
    this.filters = { tipo: '', budget: '', style: '' };
    this.loadTemplates();
  }

  private loadTemplates(): void {
    const cleanFilters: TemplateFilters = {};
    if (this.filters.tipo) cleanFilters.tipo = this.filters.tipo;
    if (this.filters.budget) cleanFilters.budget = this.filters.budget;
    if (this.filters.style) cleanFilters.style = this.filters.style;

    this.loading.set(true);
    this.clienteService.getTemplates(cleanFilters).subscribe({
      next: (res) => { this.templates.set(res); this.loading.set(false); },
      error: () => { this.templates.set([]); this.loading.set(false); },
    });
  }

  tipoClass(tipo: string): string {
    const map: Record<string, string> = {
      desayuno: 'bg-amber-100 text-amber-700',
      almuerzo: 'bg-blue-100 text-blue-700',
      cena: 'bg-indigo-100 text-indigo-700',
      snack: 'bg-green-100 text-green-700',
    };
    return map[tipo] ?? 'bg-gray-100 text-gray-600';
  }

  budgetLabel(b: string): string {
    const m: Record<string, string> = { economico: 'Económico', moderado: 'Moderado', premium: 'Premium' };
    return m[b] ?? b;
  }

  styleLabel(s: string): string {
    const m: Record<string, string> = {
      peruano: 'Peruano', vegetariano: 'Vegetariano',
      alto_proteina: 'Alto proteína', ligero: 'Ligero', express: 'Express',
    };
    return m[s] ?? s;
  }
}
