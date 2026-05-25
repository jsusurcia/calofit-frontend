import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:8000';

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

  getPerfil(): Observable<PerfilCliente> {
    return this.http.get<PerfilCliente>(`${API}/clientes/perfil`);
  }

  updatePerfil(data: Partial<PerfilCliente>): Observable<PerfilCliente> {
    return this.http.put<PerfilCliente>(`${API}/clientes/perfil`, data);
  }

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${API}/dashboard`);
  }

  generarPlan(): Observable<PlanNutricional> {
    return this.http.post<PlanNutricional>(`${API}/nutricion/planes`, {});
  }

  getPlanes(): Observable<PlanNutricional[]> {
    return this.http.get<PlanNutricional[]>(`${API}/nutricion/planes`);
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
