import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

export interface AdminDashboard {
  total_clientes: number;
  clientes_activos: number;
  ingresos_mes: number;
  pagos_pendientes: number;
}

export interface ClienteAdmin {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  is_active: boolean;
  is_profile_complete: boolean;
  fecha_creacion: string;
}

export interface CreateClientePayload {
  email: string;
  password: string;
  telefono?: string;
}

export interface PagoAdmin {
  id: number;
  client_id: number;
  client_nombre: string;
  client_email: string;
  client_phone: string | null;
  metodo_pago: 'yape' | 'efectivo';
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  monto: number | null;
  concepto: string | null;
  comprobante_url: string | null;
  fecha_pago: string;
}

export interface RegistrarPagoPayload {
  client_id: number;
  metodo_pago: 'yape' | 'efectivo';
  monto: number;
  concepto: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${API}/admin/dashboard-stats`);
  }

  getClientes(): Observable<ClienteAdmin[]> {
    return this.http.get<ClienteAdmin[]>(`${API}/admin/clientes`);
  }

  createCliente(data: CreateClientePayload): Observable<ClienteAdmin> {
    return this.http.post<ClienteAdmin>(`${API}/clientes/admin-crear`, data);
  }

  deleteCliente(id: number): Observable<unknown> {
    return this.http.delete(`${API}/admin/clientes/${id}`);
  }

  registrarPago(data: RegistrarPagoPayload): Observable<unknown> {
    return this.http.post(`${API}/pagos/registrar`, data);
  }

  getPagosPendientes(): Observable<PagoAdmin[]> {
    return this.http.get<PagoAdmin[]>(`${API}/pagos/pendientes`);
  }

  aprobarPago(id: number): Observable<unknown> {
    return this.http.put(`${API}/pagos/${id}/aprobar`, {});
  }

  rechazarPago(id: number, notas?: string): Observable<unknown> {
    return this.http.put(`${API}/pagos/${id}/rechazar`, { notas_admin: notas || undefined });
  }
}
