import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:8000';

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
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface PagoAdmin {
  id: number;
  client_id: number;
  client_nombre: string;
  client_email: string;
  metodo_pago: 'yape' | 'efectivo';
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  monto: number | null;
  concepto: string | null;
  comprobante_url: string | null;
  fecha_pago: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${API}/admin/dashboard`);
  }

  getClientes(): Observable<ClienteAdmin[]> {
    return this.http.get<ClienteAdmin[]>(`${API}/admin/clientes`);
  }

  createCliente(data: CreateClientePayload): Observable<ClienteAdmin> {
    return this.http.post<ClienteAdmin>(`${API}/admin/clientes`, data);
  }

  deleteCliente(id: number): Observable<unknown> {
    return this.http.delete(`${API}/admin/clientes/${id}`);
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
