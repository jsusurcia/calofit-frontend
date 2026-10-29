import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Activity, LogOut, UtensilsCrossed, MessageCircle, Calendar, Mic, User, CreditCard, ClipboardList } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, Subscription } from 'rxjs';

const NAV_COUNT_KEY = 'calofit_nav_count';
const SURVEY_DONE_KEY = 'calofit_survey_done';
const SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSenEP-LrQnc1ElRS27ioHwwfPVZ8iiKz7-yZlmfEKYgto8Vdw/viewform?usp=dialog';
const NAV_THRESHOLD = 5;

@Component({
  selector: 'app-cliente-layout',
  imports: [CommonModule, RouterModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <!-- Survey Gate Modal -->
    @if (showSurveyModal()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center text-center gap-5">
          <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <lucide-angular [img]="ClipboardIcon" [size]="32" class="text-primary-600" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">¡Tu opinión nos importa!</h2>
            <p class="text-gray-500 text-sm leading-relaxed">
              Antes de continuar, nos gustaría conocer tu experiencia con Calofit hasta ahora. Solo toma un minuto.
            </p>
          </div>
          <button
            (click)="openSurvey()"
            class="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer text-sm"
          >
            Responder encuesta
          </button>
          <p class="text-xs text-gray-400">Debes responder la encuesta para seguir usando la app.</p>
        </div>
      </div>
    }

    <div class="flex h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside
        class="hidden lg:flex w-72 shrink-0 bg-white border-r border-green-cream flex-col px-4 py-6"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 px-2 mb-6">
          <div class="w-11 h-11 shrink-0 rounded-2xl bg-green-cream flex items-center justify-center">
            <img src="/perezoso.png" alt="Calofit" class="w-9 h-9 object-contain" />
          </div>
          <span class="text-2xl font-extrabold text-teal-deep tracking-tight">Calofit</span>
        </div>

        <!-- User Info -->
        <a routerLink="/cliente/perfil"
           class="flex items-center gap-3 p-3 mb-6 rounded-2xl bg-cream border border-green-cream hover:bg-cream-2 transition-colors cursor-pointer">
          <div class="w-11 h-11 rounded-full bg-green-pale text-teal-deep flex items-center justify-center font-bold text-sm shrink-0">
            {{ initials() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-ink truncate">{{ auth.fullName() }}</p>
            <p class="text-xs text-ink-soft truncate">{{ auth.currentUser()?.email }}</p>
          </div>
        </a>

        <!-- Nav Links -->
        <nav class="flex-1 space-y-1">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-teal-mid/10 text-teal-deep font-semibold"
              [routerLinkActiveOptions]="{ exact: link.exact }"
              class="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-ink-soft hover:bg-cream-2 hover:text-teal-deep transition-all duration-200"
            >
              <lucide-angular [img]="link.icon" [size]="20" class="shrink-0 text-teal-mid" />
              <span>{{ link.label }}</span>
            </a>
          }
        </nav>

        <!-- Voice CTA -->
        <div class="mt-4 rounded-3xl bg-teal-deep p-5">
          <h3 class="text-base font-bold text-white">¿Ya comiste algo?</h3>
          <p class="mt-1 text-sm text-white/70">Cuéntaselo a CaloCoach con tu voz y lo registra por ti.</p>
          <a routerLink="/cliente/chat"
             class="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-cyan-ring text-teal-deep text-sm font-bold hover:brightness-95 transition cursor-pointer">
            <lucide-angular [img]="MicIcon" [size]="18" />
            Registrar con voz
          </a>
        </div>

        <!-- Logout -->
        <button
          (click)="logout()"
          class="mt-3 flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-ink-soft hover:bg-cream-2 hover:text-teal-deep transition-all duration-200 cursor-pointer"
        >
          <lucide-angular [img]="LogOutIcon" [size]="20" class="shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Mobile Header -->
        <header class="lg:hidden flex items-center gap-3 px-4 pt-4 pb-3 bg-cream">
          <div class="w-12 h-12 shrink-0 rounded-2xl bg-green-cream flex items-center justify-center">
            <img src="/perezoso.png" alt="Calofit" class="w-9 h-9 object-contain" />
          </div>
          <div class="min-w-0">
            <p class="text-sm text-ink-soft truncate">Hola, {{ firstName() }}</p>
            <h1 class="text-2xl font-extrabold text-teal-deep leading-tight truncate">{{ pageTitle() }}</h1>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>

        <!-- Mobile bottom navigation -->
        <nav class="lg:hidden relative z-10 shrink-0 bg-white border-t border-green-cream px-2 pb-[env(safe-area-inset-bottom)]">
          <div class="grid grid-cols-5">
            @for (link of bottomLinksLeft; track link.path) {
              <a
                [routerLink]="link.path"
                routerLinkActive="text-teal-mid font-semibold"
                [routerLinkActiveOptions]="{ exact: link.exact }"
                class="flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] text-ink-soft"
              >
                <lucide-angular [img]="link.icon" [size]="20" />
                <span>{{ link.label }}</span>
              </a>
            }

            <!-- Voice button (sobresale de la barra) -->
            <div class="relative">
              <a
                routerLink="/cliente/chat"
                aria-label="Registrar con voz"
                class="absolute left-1/2 -top-6 -translate-x-1/2 w-16 h-16 rounded-full bg-teal-mid text-white flex items-center justify-center ring-4 ring-white shadow-lg shadow-teal-deep/25 active:scale-95 transition-transform"
              >
                <lucide-angular [img]="MicIcon" [size]="26" />
              </a>
            </div>

            @for (link of bottomLinksRight; track link.path) {
              <a
                [routerLink]="link.path"
                routerLinkActive="text-teal-mid font-semibold"
                [routerLinkActiveOptions]="{ exact: link.exact }"
                class="flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] text-ink-soft"
              >
                <lucide-angular [img]="link.icon" [size]="20" />
                <span>{{ link.label }}</span>
              </a>
            }
          </div>
        </nav>
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
export class ClienteLayoutComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly showSurveyModal = signal(false);

  readonly LogOutIcon = LogOut;
  readonly ClipboardIcon = ClipboardList;
  readonly UtensilsCrossedIcon = UtensilsCrossed;
  readonly UserIcon = User;
  readonly MicIcon = Mic;

  private routerSub?: Subscription;

  readonly navLinks = [
    { path: '/cliente/plan-semanal', icon: Calendar, label: 'Mi menú', exact: true },
    { path: '/cliente/chat', icon: MessageCircle, label: 'CaloCoach', exact: false },
    { path: '/cliente/balance', icon: Activity, label: 'Balance', exact: false },
    { path: '/cliente/perfil', icon: User, label: 'Perfil', exact: false },
  ];

  readonly bottomLinksLeft = [
    { path: '/cliente/plan-semanal', icon: Calendar, label: 'Menú', exact: true },
    { path: '/cliente/balance', icon: Activity, label: 'Balance', exact: false },
  ];
  readonly bottomLinksRight = [
    { path: '/cliente/chat', icon: MessageCircle, label: 'Coach', exact: false },
    { path: '/cliente/perfil', icon: User, label: 'Perfil', exact: false },
  ];

  private readonly currentUrl = signal(this.router.url);

  readonly firstName = computed(() => (this.auth.currentUser()?.name ?? '').trim().split(/\s+/)[0] || '');

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/cliente/editar-perfil')) return 'Perfil';
    return this.navLinks.find(l => url.startsWith(l.path))?.label ?? 'Calofit';
  });

  readonly initials = () => {
    const name = this.auth.fullName();
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]?.toUpperCase()).slice(0, 2).join('');
  };

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(e => this.currentUrl.set((e as NavigationEnd).urlAfterRedirects));
  }

  ngOnInit(): void {
    if (localStorage.getItem(SURVEY_DONE_KEY)) return;

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const count = Number(localStorage.getItem(NAV_COUNT_KEY) ?? 0) + 1;
        localStorage.setItem(NAV_COUNT_KEY, String(count));
        if (count >= NAV_THRESHOLD) {
          this.showSurveyModal.set(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  openSurvey(): void {
    window.open(SURVEY_URL, '_blank');
    localStorage.setItem(SURVEY_DONE_KEY, '1');
    this.showSurveyModal.set(false);
    this.routerSub?.unsubscribe();
  }

  logout(): void {
    this.auth.logout();
  }
}
