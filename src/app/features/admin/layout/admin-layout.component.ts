import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { LucideAngularModule, LayoutDashboard, Users, LogOut, CreditCard } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <!-- Mobile overlay -->
    @if (sidebarOpen()) {
      <div
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        (click)="sidebarOpen.set(false)">
      </div>
    }

    <div class="flex h-screen bg-cream">
      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-teal-deep flex flex-col transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.lg:translate-x-0]="true">

        <!-- Logo & branding -->
        <div class="px-6 py-5">
          <div class="flex items-center gap-3">
            <img src="/perezoso.png" alt="Calofit" class="w-11 h-11 object-contain shrink-0" />
            <div>
              <h1 class="text-lg font-bold text-white tracking-tight">Calofit</h1>
              <p class="text-xs text-white/60 font-medium">Panel Administrador</p>
            </div>
          </div>
        </div>

        <!-- User info -->
        <div class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-green-pale rounded-full flex items-center justify-center">
              <span class="text-teal-deep font-semibold text-sm">
                {{ auth.fullName().charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate">{{ auth.fullName() }}</p>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-mid text-white">
                Admin
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-white/10 text-white"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200"
              (click)="sidebarOpen.set(false)">
              <lucide-angular [img]="item.icon" [size]="18" class="shrink-0" />
              <span class="flex-1">{{ item.label }}</span>
              @if (item.route === '/admin/pagos' && pagosPendientesCount() > 0) {
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-cyan-ring text-teal-deep">
                  {{ pagosPendientesCount() > 9 ? '9+' : pagosPendientesCount() }}
                </span>
              }
            </a>
          }
        </nav>

        <!-- Logout -->
        <div class="px-3 py-4">
          <button
            (click)="auth.logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 cursor-pointer">
            <lucide-angular [img]="LogOutIcon" [size]="18" class="shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main content area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top bar (mobile) -->
        <header class="lg:hidden bg-teal-deep px-4 py-3 flex items-center gap-3">
          <button
            (click)="sidebarOpen.set(!sidebarOpen())"
            aria-label="Abrir menú"
            class="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div class="flex items-center gap-2">
            <img src="/perezoso.png" alt="Calofit" class="w-8 h-8 object-contain" />
            <span class="font-bold text-white text-base tracking-tight">Calofit</span>
          </div>
          <div class="ml-auto w-9 h-9 bg-green-pale rounded-full flex items-center justify-center">
            <span class="text-teal-deep font-semibold text-sm">
              {{ auth.fullName().charAt(0).toUpperCase() }}
            </span>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";

    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  private adminService = inject(AdminService);
  sidebarOpen = signal(false);
  pagosPendientesCount = signal(0);

  readonly LogOutIcon = LogOut;

  navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: '/admin/dashboard', exact: true },
    { icon: Users, label: 'Clientes', route: '/admin/clientes', exact: false },
    { icon: CreditCard, label: 'Pagos', route: '/admin/pagos', exact: false },
  ];

  constructor() {
    this.loadPagosBadge();
  }

  private loadPagosBadge(): void {
    this.adminService.getPagosPendientes().subscribe({
      next: (res) => this.pagosPendientesCount.set(res.length),
      error: () => {},
    });
  }
}
