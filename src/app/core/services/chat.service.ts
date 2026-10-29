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

/** Cambio de comida propuesto por CaloCoach, pendiente de que el cliente lo confirme. */
export interface PropuestaSwap {
  dia: string;
  dia_numero: number;
  tipo_comida: string;
  plato: string;
}

export interface ChatRespuesta {
  reply: string;
  /** 'registrar' | 'swap' | 'swap_propuesta' | null */
  action_taken: string | null;
  propuesta?: PropuestaSwap | null;
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

  enviarMensaje(message: string): Observable<ChatRespuesta> {
    return this.http.post<ChatRespuesta>(`${API}/chat/mensaje`, { message });
  }

  /** Aplica al menú una comida propuesta antes. */
  confirmarSwap(propuesta: PropuestaSwap, textoUsuario?: string): Observable<ChatRespuesta> {
    return this.http.post<ChatRespuesta>(`${API}/chat/swap/confirmar`, {
      dia_numero: propuesta.dia_numero,
      tipo_comida: propuesta.tipo_comida,
      nueva_comida: propuesta.plato,
      texto_usuario: textoUsuario,
    });
  }

  /** Pide otra alternativa para la misma comida (sin aplicarla). */
  otraOpcionSwap(propuesta: PropuestaSwap, textoUsuario?: string): Observable<ChatRespuesta> {
    return this.http.post<ChatRespuesta>(`${API}/chat/swap/otra`, {
      dia_numero: propuesta.dia_numero,
      tipo_comida: propuesta.tipo_comida,
      plato_anterior: propuesta.plato,
      texto_usuario: textoUsuario,
    });
  }
}
