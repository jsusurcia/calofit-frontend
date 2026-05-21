import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

interface UsuarioStaff {
  id: number;
  nombre: string;
  email: string;
  rol: 'Admin' | 'Nutricionista' | 'Coach';
  estado: 'Activo' | 'Inactivo';
}

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in-up">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
          <p class="text-sm text-gray-500 mt-1">Gestiona los miembros del equipo</p>
        </div>
        <button
          (click)="showModal.set(true)"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 active:bg-primary-700 transition-colors duration-200 shadow-md shadow-primary-500/20 cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Crear Usuario
        </button>
      </div>

      <!-- Table Card -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Nombre</th>
                <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Email</th>
                <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Rol</th>
                <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Estado</th>
                <th class="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (user of usuarios; track user.id) {
                <tr class="hover:bg-gray-50/50 transition-colors duration-150">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                           [class]="getAvatarClass(user.rol)">
                        {{ user.nombre.charAt(0) }}
                      </div>
                      <span class="text-sm font-medium text-gray-900">{{ user.nombre }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ user.email }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          [class]="getRolBadgeClass(user.rol)">
                      {{ user.rol }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 text-sm">
                      <span class="w-2 h-2 rounded-full" [class.bg-success-500]="user.estado === 'Activo'" [class.bg-gray-400]="user.estado !== 'Activo'"></span>
                      <span [class.text-success-700]="user.estado === 'Activo'" [class.text-gray-500]="user.estado !== 'Activo'" class="font-medium text-xs">
                        {{ user.estado }}
                      </span>
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        (click)="onEdit(user)"
                        class="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors duration-150 cursor-pointer"
                        title="Editar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                      <button
                        (click)="onDelete(user)"
                        class="p-2 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-50 transition-colors duration-150 cursor-pointer"
                        title="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden divide-y divide-gray-100">
          @for (user of usuarios; track user.id) {
            <div class="p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                       [class]="getAvatarClass(user.rol)">
                    {{ user.nombre.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ user.nombre }}</p>
                    <p class="text-xs text-gray-500">{{ user.email }}</p>
                  </div>
                </div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      [class]="getRolBadgeClass(user.rol)">
                  {{ user.rol }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5 text-xs">
                  <span class="w-2 h-2 rounded-full bg-success-500"></span>
                  <span class="text-success-700 font-medium">{{ user.estado }}</span>
                </span>
                <div class="flex items-center gap-1">
                  <button (click)="onEdit(user)" class="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button (click)="onDelete(user)" class="p-2 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-50 transition-colors cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Create User Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="showModal.set(false)">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up" (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="text-lg font-bold text-gray-900">Crear Usuario</h2>
              <button
                (click)="showModal.set(false)"
                class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="px-6 py-5 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre Completo</label>
                <input type="text" [(ngModel)]="newUser.nombre"
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                       placeholder="Ej: María López">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" [(ngModel)]="newUser.email"
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                       placeholder="email@ejemplo.com">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                <select [(ngModel)]="newUser.rol"
                        class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                  <option value="">Seleccionar rol...</option>
                  <option value="admin">Administrador</option>
                  <option value="nutricionista">Nutricionista</option>
                  <option value="coach">Coach</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                <input type="password" [(ngModel)]="newUser.password"
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                       placeholder="••••••••">
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                (click)="showModal.set(false)"
                class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                (click)="onCreateUser()"
                class="px-5 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/20 cursor-pointer">
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";
  `]
})
export class UsuariosComponent {
  private toastr = inject(ToastrService);

  showModal = signal(false);

  newUser = {
    nombre: '',
    email: '',
    rol: '',
    password: '',
  };

  usuarios: UsuarioStaff[] = [
    { id: 1, nombre: 'Admin Principal', email: 'admin@worldlight.com', rol: 'Admin', estado: 'Activo' },
    { id: 2, nombre: 'Dra. María López', email: 'maria@worldlight.com', rol: 'Nutricionista', estado: 'Activo' },
    { id: 3, nombre: 'Carlos Ruiz', email: 'carlos@worldlight.com', rol: 'Coach', estado: 'Activo' },
  ];

  getRolBadgeClass(rol: string): string {
    switch (rol) {
      case 'Admin':
        return 'bg-primary-900 text-white';
      case 'Nutricionista':
        return 'bg-primary-100 text-primary-700';
      case 'Coach':
        return 'bg-success-100 text-success-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getAvatarClass(rol: string): string {
    switch (rol) {
      case 'Admin':
        return 'bg-primary-100 text-primary-700';
      case 'Nutricionista':
        return 'bg-blue-100 text-blue-700';
      case 'Coach':
        return 'bg-success-100 text-success-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  onEdit(user: UsuarioStaff): void {
    this.toastr.info(`Edición de "${user.nombre}" próximamente`, 'Funcionalidad próximamente');
  }

  onDelete(user: UsuarioStaff): void {
    this.toastr.info(`Eliminación de "${user.nombre}" próximamente`, 'Funcionalidad próximamente');
  }

  onCreateUser(): void {
    this.toastr.info('La creación de usuarios estará disponible pronto', 'Funcionalidad próximamente');
    this.showModal.set(false);
    this.newUser = { nombre: '', email: '', rol: '', password: '' };
  }
}
