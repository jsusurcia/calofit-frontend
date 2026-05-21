import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, LayoutDashboard, User, Users, LogOut } from 'lucide-angular';

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

    <div class="flex h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.lg:translate-x-0]="true">

        <!-- Logo & branding -->
        <div class="px-6 py-5 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <span class="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 class="text-lg font-bold text-gray-900 tracking-tight">CaloFit</h1>
              <p class="text-xs text-gray-500 font-medium">Panel Administrador</p>
            </div>
          </div>
        </div>

        <!-- User info -->
        <div class="px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-primary-700 font-semibold text-sm">
                {{ auth.fullName().charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ auth.fullName() }}</p>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-900 text-white">
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
              routerLinkActive="bg-primary-50 text-primary-700 border-primary-500"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 border-l-[3px] border-transparent"
              (click)="sidebarOpen.set(false)">
              <lucide-angular [img]="item.icon" [size]="18" class="shrink-0" />
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Logout -->
        <div class="px-3 py-4 border-t border-gray-100">
          <button
            (click)="auth.logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-danger-50 hover:text-danger-600 transition-all duration-200 cursor-pointer">
            <lucide-angular [img]="LogOutIcon" [size]="18" class="shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main content area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top bar (mobile) -->
        <header class="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            (click)="sidebarOpen.set(!sidebarOpen())"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-xs">C</span>
            </div>
            <span class="font-semibold text-gray-900 text-sm">CaloFit Admin</span>
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
  sidebarOpen = signal(false);

  readonly LogOutIcon = LogOut;

  navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: '/admin/dashboard', exact: true },
    { icon: User, label: 'Usuarios', route: '/admin/usuarios', exact: false },
    { icon: Users, label: 'Clientes', route: '/admin/clientes', exact: false },
  ];
}
