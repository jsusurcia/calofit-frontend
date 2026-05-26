import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Flame, LayoutDashboard, Bot, Activity, LogOut, UtensilsCrossed, MessageSquare } from 'lucide-angular';

@Component({
  selector: 'app-cliente-layout',
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <!-- Mobile backdrop -->
    @if (sidebarOpen()) {
      <div
        class="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
        (click)="sidebarOpen.set(false)"
      ></div>
    }

    <div class="flex h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.lg:translate-x-0]="true"
      >
        <!-- Logo -->
        <div class="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
          <lucide-angular [img]="FlameIcon" [size]="22" class="text-[#146aff]" />
          <span class="text-xl font-bold text-primary-500 tracking-tight">CaloFit</span>
        </div>

        <!-- User Info -->
        <div class="px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">
              {{ initials() }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ auth.fullName() }}</p>
              <p class="text-xs text-gray-400">Cliente</p>
            </div>
          </div>
        </div>

        <!-- Nav Links -->
        <nav class="flex-1 px-3 py-4 space-y-1">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-primary-50 text-primary-600 font-semibold"
              [routerLinkActiveOptions]="{ exact: link.exact }"
              (click)="sidebarOpen.set(false)"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
            >
              <lucide-angular [img]="link.icon" [size]="18" class="shrink-0 group-hover:scale-110 transition-transform" />
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>

        <!-- Logout -->
        <div class="px-3 pb-4 mt-auto">
          <button
            (click)="logout()"
            class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-danger-600 hover:bg-danger-50 transition-all duration-200 cursor-pointer"
          >
            <lucide-angular [img]="LogOutIcon" [size]="18" class="shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Mobile Header -->
        <header class="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            (click)="sidebarOpen.set(true)"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span class="text-lg font-bold text-primary-500 flex items-center gap-1.5">
            <lucide-angular [img]="FlameIcon" [size]="18" class="text-[#146aff]" />
            CaloFit
          </span>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto">
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
export class ClienteLayoutComponent {
  readonly auth = inject(AuthService);
  readonly sidebarOpen = signal(false);

  readonly FlameIcon = Flame;
  readonly LogOutIcon = LogOut;

  readonly UtensilsCrossedIcon = UtensilsCrossed;

  readonly navLinks = [
    { path: '/cliente/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/cliente/chat', icon: MessageSquare, label: 'Coach IA', exact: false },
    { path: '/cliente/nutricion', icon: Bot, label: 'Nutrición IA', exact: false },
    { path: '/cliente/balance', icon: Activity, label: 'Balance', exact: false },
    { path: '/cliente/templates', icon: UtensilsCrossed, label: 'Recetas', exact: false },
  ];

  readonly initials = () => {
    const name = this.auth.fullName();
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]?.toUpperCase()).slice(0, 2).join('');
  };

  logout(): void {
    this.auth.logout();
  }
}
