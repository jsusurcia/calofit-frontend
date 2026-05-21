import { Component, signal, inject, ElementRef, viewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardRefreshService } from '../../../core/services/dashboard-refresh.service';
import { LucideAngularModule, Bot, User } from 'lucide-angular';

interface CaloFitCard {
  titulo: string;
  ingredientes: string;
  pasos: string;
  stats: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  cards?: CaloFitCard[];
}

const NUTRITION_LOG_REGEX = /^(?:me\s+)?(?:com[ií]|tom[eé]|almorc[eé]|cen[eé]|desayun[eé]|beb[ií]|ingeri)\b/i;

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
              @if (msg.content) {
                <div class="whitespace-pre-wrap" [innerHTML]="formatMessage(msg.content)"></div>
              }
              @if (msg.cards && msg.cards.length > 0) {
                <div class="mt-2 space-y-3">
                  @for (card of msg.cards; track $index) {
                    <div class="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden text-xs">
                      <div class="px-3 py-2 bg-blue-50 border-b border-blue-100 font-semibold text-[#146aff]">
                        {{ card.titulo }}
                      </div>
                      @if (card.stats) {
                        <div class="px-3 py-2 border-b border-gray-100">
                          <span class="text-[10px] uppercase tracking-wide text-gray-400 block mb-0.5">Valores nutricionales</span>
                          <div class="whitespace-pre-wrap text-gray-600" [innerHTML]="formatMessage(card.stats)"></div>
                        </div>
                      }
                      @if (card.ingredientes) {
                        <div class="px-3 py-2 border-b border-gray-100">
                          <span class="text-[10px] uppercase tracking-wide text-gray-400 block mb-0.5">Ingredientes</span>
                          <div class="whitespace-pre-wrap text-gray-700" [innerHTML]="formatMessage(card.ingredientes)"></div>
                        </div>
                      }
                      @if (card.pasos) {
                        <div class="px-3 py-2">
                          <span class="text-[10px] uppercase tracking-wide text-gray-400 block mb-0.5">Preparación</span>
                          <div class="whitespace-pre-wrap text-gray-700" [innerHTML]="formatMessage(card.pasos)"></div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
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

    // Fix 2: detect "Comí X / Tomé X / Almorcé X" patterns → bypass LLM, force REGISTRAR_NUTRICION
    const isNutritionLog = NUTRITION_LOG_REGEX.test(text);

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
        ...(isNutritionLog ? { forzar_intencion: 'REGISTRAR_NUTRICION' } : {}),
      })
      .subscribe({
        next: (res) => {
          const isDirectLog = res.success !== undefined && !res.respuesta_ia;
          const rawText = isDirectLog ? (res.mensaje || 'Registro procesado.') : (res.respuesta_ia || '');

          // Fix 1: parse CALOFIT structured tags from respuesta_ia
          const cards = isDirectLog ? [] : this.parseCaloFitResponse(rawText);
          const texto = (isDirectLog ? rawText : this.stripCaloFitTags(rawText))
            .replace(/\*{0,2}\[CALOFIT_INTENT:[A-Z_]+\]\*{0,2}/g, '')
            .trim();

          this.messages.update(msgs => [
            ...msgs,
            { role: 'ai', content: texto, timestamp: new Date(), cards: cards.length ? cards : undefined },
          ]);
          this.saveToStorage();

          const shouldRefresh = isDirectLog
            ? (res.success && res.tipo_detectado === 'comida')
            : (res.intencion === 'LOG' || res.intencion === 'SUCCESS' || res.intencion === 'REGISTRAR_NUTRICION');
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

  parseCaloFitResponse(raw: string): CaloFitCard[] {
    const cards: CaloFitCard[] = [];
    const cardRegex = /\[CALOFIT_HEADER\](.*?)\[\/CALOFIT_HEADER\](.*?)(?=\[CALOFIT_HEADER\]|$)/gs;
    let match;
    while ((match = cardRegex.exec(raw)) !== null) {
      const block = match[2];
      cards.push({
        titulo: match[1].trim(),
        ingredientes: this.extractBlock(block, 'CALOFIT_LIST'),
        pasos: this.extractBlock(block, 'CALOFIT_ACTION'),
        stats: this.extractBlock(block, 'CALOFIT_STATS'),
      });
    }
    return cards;
  }

  private extractBlock(text: string, tag: string): string {
    const m = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`).exec(text);
    return m ? m[1].trim() : '';
  }

  private stripCaloFitTags(raw: string): string {
    return raw.replace(/\[CALOFIT_[A-Z]+\][\s\S]*?\[\/CALOFIT_[A-Z]+\]/g, '').trim();
  }
}
