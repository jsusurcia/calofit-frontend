import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, LayoutDashboard, Users } from 'lucide-angular';

@Component({
  selector: 'app-nutricionista-layout',
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <!-- Mobile Header -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-3">
        <button (click)="toggleSidebar()" class="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path *ngIf="!sidebarOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path *ngIf="sidebarOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <span class="text-lg font-bold text-gray-900">Calo<span class="text-[#146aff]">Fit</span></span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600">{{ auth.fullName() }}</span>
      </div>
    </div>

    <!-- Backdrop (mobile) -->
    <div
      *ngIf="sidebarOpen()"
      (click)="closeSidebar()"
      class="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity">
    </div>

    <!-- Sidebar -->
    <aside
      [class]="sidebarClasses()"
      class="fixed top-0 left-0 h-full z-50 flex flex-col bg-white border-r border-gray-100 shadow-lg lg:shadow-sm transition-transform duration-300 ease-in-out w-64">

      <!-- Logo -->
      <div class="px-6 py-6 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-[#146aff] flex items-center justify-center">
            <span class="text-white font-bold text-sm">CF</span>
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-900">Calo<span class="text-[#146aff]">Fit</span></h1>
            <p class="text-[10px] text-gray-400 font-medium -mt-0.5">Panel Nutricionista</p>
          </div>
        </div>
      </div>

      <!-- User Info -->
      <div class="px-6 py-4 border-b border-gray-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#146aff] to-blue-400 flex items-center justify-center text-white font-semibold text-sm">
            {{ userInitials() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ auth.fullName() }}</p>
            <span
              [class]="roleBadgeClass()"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5">
              {{ auth.userRole() === 'coach' ? 'Coach' : 'Nutricionista' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        @for (link of navLinks; track link.path) {
          <a
            [routerLink]="link.path"
            routerLinkActive="bg-blue-50 text-[#146aff] border-l-3 border-[#146aff]"
            [routerLinkActiveOptions]="{ exact: link.exact }"
            (click)="closeSidebar()"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group">
            <lucide-angular [img]="link.icon" [size]="18" class="shrink-0" />
            <span>{{ link.label }}</span>
          </a>
        }
      </nav>

      <!-- Logout -->
      <div class="px-3 py-4 border-t border-gray-100">
        <button
          (click)="auth.logout()"
          class="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-64 min-h-screen bg-gray-50/80 pt-16 lg:pt-0">
      <div class="p-4 sm:p-6 lg:p-8">
        <router-outlet />
      </div>
    </main>
  `,
})
export class NutricionistaLayoutComponent {
  readonly auth = inject(AuthService);

  sidebarOpen = signal(false);

  navLinks = [
    { path: '/nutricionista/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/nutricionista/pacientes', label: 'Pacientes', icon: Users, exact: false },
  ];

  userInitials = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return '??';
    return `${user.name?.charAt(0) ?? ''}${user.last_name?.charAt(0) ?? ''}`.toUpperCase();
  });

  roleBadgeClass = computed(() => {
    return this.auth.userRole() === 'coach'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-blue-50 text-[#146aff]';
  });

  sidebarClasses = computed(() => {
    return this.sidebarOpen()
      ? 'translate-x-0'
      : '-translate-x-full lg:translate-x-0';
  });

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
