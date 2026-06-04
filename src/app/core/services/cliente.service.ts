import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

export interface PerfilCliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  is_profile_complete: boolean;
  is_active: boolean;
}

export interface PlanNutricional {
  id: number;
  status: string;
  created_at: string;
  dias: PlanDia[];
}

export interface PlanDia {
  dia: string;
  comidas: PlanComida[];
}

export interface PlanComida {
  tipo: string;
  nombre: string;
  calorias: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
}

export interface RecetaTemplate {
  id: number;
  nombre: string;
  tipo: string;
  calorias: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  ingredientes_principales: string[];
  budget: string;
  style: string;
}

export interface TemplateFilters {
  tipo?: string;
  budget?: string;
  style?: string;
}

export interface RegistroComida {
  nombre: string;
  calorias: number;
  proteinas_g?: number;
  carbohidratos_g?: number;
  grasas_g?: number;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  getPerfil(): Observable<PerfilCliente> {
    return this.http.get<PerfilCliente>(`${API}/clientes/perfil`);
  }

  updatePerfil(data: Partial<PerfilCliente>): Observable<PerfilCliente> {
    return this.http.put<PerfilCliente>(`${API}/clientes/perfil`, data);
  }

  getDashboard(): Observable<any> {
    const id = this.auth.userId();
    return this.http.get<any>(`${API}/dashboard/clientes/${id}/resumen-diario`);
  }

  getPlanes(): Observable<PlanNutricional[]> {
    const id = this.auth.userId();
    return this.http.get<any>(`${API}/dashboard/clientes/${id}/resumen-diario`).pipe(
      map(r => r?.plan_nutricional ? [r.plan_nutricional] : [])
    );
  }

  getTemplates(filters: TemplateFilters = {}): Observable<RecetaTemplate[]> {
    let params = new HttpParams();
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    if (filters.budget) params = params.set('budget', filters.budget);
    if (filters.style) params = params.set('style', filters.style);
    return this.http.get<RecetaTemplate[]>(`${API}/nutrition/templates`, { params });
  }

  consultarAsistente(mensaje: string): Observable<any> {
    return this.http.post<any>(`${API}/asistente/consultar`, { mensaje });
  }

  registrarComida(data: RegistroComida): Observable<unknown> {
    return this.http.post(`${API}/nutricion/registro`, data);
  }

  getBalance(): Observable<any> {
    return this.http.get<any>(`${API}/balance`);
  }
}
