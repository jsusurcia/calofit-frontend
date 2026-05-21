import { Component, signal, inject, ElementRef, viewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardRefreshService } from '../../../core/services/dashboard-refresh.service';
import { LucideAngularModule, Bot, User } from 'lucide-angular';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-nutricion-chat',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full bg-gray-50">
      <!-- Header -->
      <div class="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-200">
        <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-[#146aff]">
          <lucide-angular [img]="BotIcon" [size]="18" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-gray-800">Nutrición IA</h2>
          <p class="text-xs text-gray-400">Tu asistente nutricional inteligente</p>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-4" #chatContainer>
        @for (msg of messages(); track $index) {
          <div
            class="flex animate-fade-in-up"
            [ngClass]="{ 'justify-end': msg.role === 'user', 'justify-start': msg.role === 'ai' }"
          >
            <!-- AI Avatar -->
            @if (msg.role === 'ai') {
              <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-[#146aff] flex-shrink-0 mr-2 mt-1">
                <lucide-angular [img]="BotIcon" [size]="14" />
              </div>
            }

            <div
              class="max-w-[75%] px-4 py-3 text-sm leading-relaxed"
              [ngClass]="{
                'bg-primary-500 text-white rounded-2xl rounded-br-md': msg.role === 'user',
                'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100': msg.role === 'ai'
              }"
            >
              <div class="whitespace-pre-wrap" [innerHTML]="formatMessage(msg.content)"></div>
              <p
                class="text-[10px] mt-1.5"
                [ngClass]="{ 'text-white/60': msg.role === 'user', 'text-gray-400': msg.role === 'ai' }"
              >
                {{ msg.timestamp | date:'HH:mm' }}
              </p>
            </div>

            <!-- User Avatar -->
            @if (msg.role === 'user') {
              <div class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 ml-2 mt-1">
                <lucide-angular [img]="UserIcon" [size]="14" />
              </div>
            }
          </div>
        }

        <!-- Typing Indicator -->
        @if (loading()) {
          <div class="flex justify-start animate-fade-in-up">
            <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-[#146aff] flex-shrink-0 mr-2 mt-1">
              <lucide-angular [img]="BotIcon" [size]="14" />
            </div>
            <div class="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-5 py-3.5">
              <div class="flex items-center gap-1.5">
                <span class="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                <span class="typing-dot w-2 h-2 bg-gray-400 rounded-full" style="animation-delay: 0.15s"></span>
                <span class="typing-dot w-2 h-2 bg-gray-400 rounded-full" style="animation-delay: 0.3s"></span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Input Area -->
      <div class="px-4 py-3 bg-white border-t border-gray-200">
        <form (ngSubmit)="sendMessage()" class="flex items-center gap-2">
          <input
            [(ngModel)]="userInput"
            name="message"
            type="text"
            placeholder="Escribe tu pregunta..."
            class="flex-1 px-5 py-3 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            [disabled]="loading()"
            autocomplete="off"
          />
          <button
            type="submit"
            [disabled]="loading() || !userInput.trim()"
            class="w-11 h-11 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";

    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    .typing-dot {
      animation: typingBounce 1.2s ease-in-out infinite;
    }
  `]
})
export class NutricionChatComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly BotIcon = Bot;
  readonly UserIcon = User;
  private readonly dashboardRefresh = inject(DashboardRefreshService);
  private readonly chatContainer = viewChild<ElementRef>('chatContainer');

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  userInput = '';

  ngOnInit(): void {
    const clientId = this.auth.userId();
    if (!clientId) { this.setGreeting(); return; }

    const saved = localStorage.getItem(`chat_${clientId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<{ role: 'user' | 'ai'; content: string; timestamp: string }>;
        this.messages.set(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        this.scrollToBottom();
        return;
      } catch { /* fall through to greeting */ }
    }
    this.setGreeting();
  }

  private setGreeting(): void {
    this.messages.set([{
      role: 'ai',
      content: '¡Hola! Soy tu asistente nutricional de CaloFit. ¿En qué puedo ayudarte hoy? 🥗',
      timestamp: new Date(),
    }]);
  }

  private saveToStorage(): void {
    const clientId = this.auth.userId();
    if (!clientId) return;
    localStorage.setItem(`chat_${clientId}`, JSON.stringify(this.messages()));
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.loading()) return;

    const clientId = this.auth.userId();
    if (!clientId) return;

    const historial = this.messages()
      .slice(-10)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

    this.messages.update(msgs => [
      ...msgs,
      { role: 'user', content: text, timestamp: new Date() },
    ]);
    this.saveToStorage();
    this.userInput = '';
    this.loading.set(true);
    this.scrollToBottom();

    this.http
      .post<any>('http://localhost:8000/asistente/consultar', {
        mensaje: text,
        historial,
      })
      .subscribe({
        next: (res) => {
          // The backend returns two different response shapes:
          // 1. Standard chat: { respuesta_ia, intencion, respuesta_estructurada, ... }
          // 2. Imperative food log: { success, mensaje, tipo_detectado, balance_actualizado, ... }
          const isDirectLog = res.success !== undefined && !res.respuesta_ia;
          const texto = isDirectLog
            ? (res.mensaje || 'Registro procesado.')
            : (res.respuesta_ia || '')
              .replace(/\*{0,2}\[CALOFIT_INTENT:[A-Z_]+\]\*{0,2}/g, '')
              .trim();

          this.messages.update(msgs => [
            ...msgs,
            { role: 'ai', content: texto, timestamp: new Date() },
          ]);
          this.saveToStorage();

          // Trigger dashboard refresh when food was logged:
          // - Direct log handler: success === true && tipo_detectado === 'comida'
          // - Standard chat with intent: intencion is LOG or SUCCESS
          const shouldRefresh = isDirectLog
            ? (res.success && res.tipo_detectado === 'comida')
            : (res.intencion === 'LOG' || res.intencion === 'SUCCESS');
          if (shouldRefresh) {
            this.dashboardRefresh.refresh();
          }

          this.loading.set(false);
          this.scrollToBottom();
        },
        error: () => {
          this.messages.update(msgs => [
            ...msgs,
            {
              role: 'ai',
              content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo. 😔',
              timestamp: new Date(),
            },
          ]);
          this.saveToStorage();
          this.loading.set(false);
          this.scrollToBottom();
        },
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = this.chatContainer()?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  formatMessage(text: string): string {
    if (!text) return '';
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return formatted;
  }
}
