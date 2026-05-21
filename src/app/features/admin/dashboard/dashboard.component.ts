import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, User, Users, Activity } from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="animate-fade-in-up">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900">
          ¡Hola, {{ auth.fullName() }}!
        </h1>
        <p class="text-gray-500 mt-1.5 text-sm md:text-base">
          Bienvenido al panel de administración de CaloFit
        </p>
      </div>

      <!-- Navigation Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <!-- Gestión de Usuarios -->
        <a routerLink="/admin/usuarios"
           class="group relative bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
          <!-- Accent top bar -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-primary-500 rounded-t-2xl"></div>
          <!-- Background decoration -->
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div class="relative">
            <div class="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary-100 transition-colors duration-300 text-[#146aff]">
              <lucide-angular [img]="UserIcon" [size]="28" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Gestión de usuarios</h3>
            <p class="text-sm text-gray-500 leading-relaxed mb-6">
              Administra el equipo: administradores, nutricionistas y coaches de la plataforma.
            </p>
            <div class="flex items-center text-primary-500 text-sm font-semibold group-hover:gap-2 transition-all duration-300">
              <span>Ir a usuarios</span>
              <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </a>

        <!-- Gestión de Clientes -->
        <a routerLink="/admin/clientes"
           class="group relative bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-success-500 rounded-t-2xl"></div>
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-success-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div class="relative">
            <div class="w-14 h-14 bg-success-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-success-100 transition-colors duration-300 text-emerald-600">
              <lucide-angular [img]="UsersIcon" [size]="28" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Gestión de clientes</h3>
            <p class="text-sm text-gray-500 leading-relaxed mb-6">
              Visualiza todos los clientes registrados en la plataforma y gestiona sus perfiles.
            </p>
            <div class="flex items-center text-success-600 text-sm font-semibold group-hover:gap-2 transition-all duration-300">
              <span>Ver clientes</span>
              <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </a>

        <!-- Estadísticas (Coming Soon) -->
        <div class="group relative bg-white rounded-2xl border border-gray-200 p-6 md:p-8 opacity-60 cursor-not-allowed overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gray-300 rounded-t-2xl"></div>

          <div class="relative">
            <div class="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-5 text-gray-300">
              <lucide-angular [img]="ActivityIcon" [size]="28" />
            </div>
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-lg font-bold text-gray-400">Estadísticas</h3>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-100 text-accent-700">
                Próximamente
              </span>
            </div>
            <p class="text-sm text-gray-400 leading-relaxed mb-6">
              Métricas y resumen general de la plataforma con gráficos y KPIs.
            </p>
            <div class="flex items-center text-gray-400 text-sm font-semibold">
              <span>No disponible</span>
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

      <!-- Quick Stats Banner -->
      <div class="mt-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 md:p-8 text-white">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold">Panel de administración</h3>
            <p class="text-primary-100 text-sm mt-1">
              Gestiona usuarios, clientes y supervisa la plataforma CaloFit desde aquí.
            </p>
          </div>
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium">Sistema operativo</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";
  `]
})
export class AdminDashboardComponent {
  auth = inject(AuthService);

  readonly UserIcon = User;
  readonly UsersIcon = Users;
  readonly ActivityIcon = Activity;
}
