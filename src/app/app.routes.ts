import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { onboardingGuard } from './core/guards/onboarding.guard';
import { profileGuard } from './core/guards/profile.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'cliente',
    canActivate: [authGuard, roleGuard],
    data: { allowedTypes: ['client'] },
    loadComponent: () =>
      import('./features/cliente/layout/cliente-layout.component').then(
        (m) => m.ClienteLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'onboarding',
        canActivate: [authGuard, onboardingGuard],
        loadComponent: () =>
          import('./features/cliente/onboarding/onboarding.component').then(
            (m) => m.OnboardingComponent
          ),
      },
      {
        path: 'dashboard',
        canActivate: [profileGuard],
        loadComponent: () =>
          import('./features/cliente/dashboard/dashboard.component').then(
            (m) => m.ClienteDashboardComponent
          ),
      },
      {
        path: 'nutricion',
        loadComponent: () =>
          import('./features/cliente/nutricion/nutricion-chat.component').then(
            (m) => m.NutricionChatComponent
          ),
      },
      {
        path: 'balance',
        loadComponent: () =>
          import('./features/cliente/balance/balance.component').then(
            (m) => m.BalanceComponent
          ),
      },
    ],
  },
  {
    path: 'nutricionista',
    canActivate: [authGuard, roleGuard],
    data: { allowedTypes: ['staff'], allowedRoles: ['nutricionista', 'coach'] },
    loadComponent: () =>
      import('./features/nutricionista/layout/nutricionista-layout.component').then(
        (m) => m.NutricionistaLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/nutricionista/dashboard/dashboard.component').then(
            (m) => m.NutricionistaDashboardComponent
          ),
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./features/nutricionista/pacientes/pacientes-list.component').then(
            (m) => m.PacientesListComponent
          ),
      },
      {
        path: 'paciente/:id',
        loadComponent: () =>
          import(
            './features/nutricionista/paciente-detalle/paciente-detalle.component'
          ).then((m) => m.PacienteDetalleComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { allowedTypes: ['staff'], allowedRoles: ['admin'] },
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/usuarios/usuarios.component').then(
            (m) => m.UsuariosComponent
          ),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/admin/clientes/clientes.component').then(
            (m) => m.AdminClientesComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
