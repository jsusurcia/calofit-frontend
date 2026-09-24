import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

export interface ChatHistorialItem {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatHistorialResponse {
  mensajes: ChatHistorialItem[];
  hay_mas: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  obtenerHistorial(beforeId?: number, limite = 30): Observable<ChatHistorialResponse> {
    let params = new HttpParams().set('limite', limite);
    if (beforeId !== undefined) {
      params = params.set('before_id', beforeId);
    }
    return this.http.get<ChatHistorialResponse>(`${API}/chat/historial`, { params });
  }

  enviarMensaje(message: string): Observable<any> {
    return this.http.post<any>(`${API}/chat/mensaje`, { message });
  }
}
