import { Component, signal, inject, ElementRef, viewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardRefreshService } from '../../../core/services/dashboard-refresh.service';
import { ClienteService, PlanNutricional } from '../../../core/services/cliente.service';
import { ToastrService } from 'ngx-toastr';
import { LucideAngularModule, Bot, User, Mic, MicOff, Sparkles, ChevronDown, ChevronUp } from 'lucide-angular';

interface CalofitCard {
  titulo: string;
  ingredientes: string;
  pasos: string;
  stats: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  cards?: CalofitCard[];
}

const NUTRITION_LOG_REGEX = /^(?:me\s+)?(?:com[ií]|tom[eé]|almorc[eé]|cen[eé]|desayun[eé]|beb[ií]|ingeri)\b/i;

@Component({
  selector: 'app-nutricion-chat',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      <!-- Plan Section -->
      <div class="bg-white border-b border-gray-200">
        <!-- Plan header -->
        <div class="flex items-center justify-between px-5 py-3 cursor-pointer" (click)="planExpanded.set(!planExpanded())">
          <div class="flex items-center gap-2">
            <lucide-angular [img]="SparklesIcon" [size]="16" class="text-[#146aff]" />
            <span class="text-sm font-semibold text-gray-800">Plan nutricional</span>
            @if (activePlan()) {
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Activo</span>
            }
          </div>
          <lucide-angular [img]="planExpanded() ? ChevronUpIcon : ChevronDownIcon" [size]="16" class="text-gray-400" />
        </div>

        @if (planExpanded()) {
          <div class="px-5 pb-4">
            @if (loadingPlan()) {
              <div class="flex items-center gap-2 py-3">
                <div class="w-5 h-5 border-2 border-primary-200 border-t-[#146aff] rounded-full animate-spin"></div>
                <span class="text-sm text-gray-400">Cargando plan...</span>
              </div>
            }

            @if (!loadingPlan() && !activePlan()) {
              <div class="flex flex-col items-center gap-3 py-4 text-center">
                <p class="text-sm text-gray-500">No tienes un plan nutricional activo.</p>
                <button (click)="generarPlan()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#146aff] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-[#146aff]/20 cursor-pointer">
                  <lucide-angular [img]="SparklesIcon" [size]="15" />
                  Consultar mi plan
                </button>
              </div>
            }

            @if (!loadingPlan() && activePlan()) {
              <div class="space-y-2">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-gray-400">Estado:</span>
                  <span class="text-xs font-semibold text-emerald-600 capitalize">{{ activePlan()!.status }}</span>
                  <span class="text-xs text-gray-400 ml-auto">{{ activePlan()!.created_at | date:'dd/MM/yyyy' }}</span>
                </div>
                @for (dia of activePlan()!.dias.slice(0, 2); track dia.dia) {
                  <div class="bg-gray-50 rounded-xl p-3">
                    <p class="text-xs font-semibold text-gray-700 mb-1.5 capitalize">{{ dia.dia }}</p>
                    <div class="space-y-1">
                      @for (comida of dia.comidas; track comida.tipo) {
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-600 capitalize">{{ comida.tipo }}: {{ comida.nombre }}</span>
                          <span class="text-gray-400 font-medium">{{ comida.calorias }} kcal</span>
                        </div>
                      }
                    </div>
                  </div>
                }
                @if (activePlan()!.dias.length > 2) {
                  <p class="text-xs text-gray-400 text-center">+{{ activePlan()!.dias.length - 2 }} días más en el plan</p>
                }
                <button (click)="generarPlan()"
                  class="w-full mt-1 py-2 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors cursor-pointer">
                  Consultar plan con IA
                </button>
              </div>
            }
          </div>
        }
      </div>

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
              <div class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0 ml-2 mt-1">
                <lucide-angular [img]="UserIcon" [size]="14" />
              </div>
            }
          </div>
        }

        <!-- Typing Indicator -->
        @if (loading()) {
          <div class="flex justify-start animate-fade-in-up">
            <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-[#146aff] shrink-0 mr-2 mt-1">
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
            [placeholder]="listening() ? 'Escuchando...' : 'Escribe o pregunta con voz...'"
            class="flex-1 px-5 py-3 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            [class.border-red-400]="listening()"
            [class.ring-2]="listening()"
            [class.ring-red-100]="listening()"
            [disabled]="loading()"
            autocomplete="off"
          />
          <!-- Mic Button -->
          @if (speechSupported) {
            <button
              type="button"
              (click)="toggleListening()"
              [disabled]="loading()"
              [class]="listening()
                ? 'w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 cursor-pointer animate-pulse'
                : 'w-11 h-11 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 cursor-pointer'"
              [title]="listening() ? 'Detener grabación' : 'Hablar'"
            >
              <lucide-angular [img]="listening() ? MicOffIcon : MicIcon" [size]="18" />
            </button>
          }
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
export class NutricionChatComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly clienteService = inject(ClienteService);
  private readonly toastr = inject(ToastrService);

  readonly BotIcon = Bot;
  readonly UserIcon = User;
  readonly MicIcon = Mic;
  readonly MicOffIcon = MicOff;
  readonly SparklesIcon = Sparkles;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  private readonly dashboardRefresh = inject(DashboardRefreshService);
  private readonly chatContainer = viewChild<ElementRef>('chatContainer');

  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  readonly listening = signal(false);
  readonly activePlan = signal<PlanNutricional | null>(null);
  readonly loadingPlan = signal(false);
  readonly planExpanded = signal(true);
  userInput = '';

  readonly speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  private recognition: any = null;

  ngOnDestroy(): void {
    this.stopListening();
  }

  toggleListening(): void {
    if (this.listening()) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private startListening(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-PE';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;
    this.recognition.maxAlternatives = 1;

    let finalTranscript = '';

    this.recognition.onstart = () => this.listening.set(true);

    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      this.userInput = (finalTranscript + interim).trim();
    };

    this.recognition.onend = () => {
      if (this.listening()) {
        try { this.recognition?.start(); } catch { /* ya reiniciando */ }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      this.listening.set(false);
      this.recognition = null;
    };

    this.recognition.start();
  }

  private stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.listening.set(false);
  }

  ngOnInit(): void {
    this.loadPlanes();
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

  private loadPlanes(): void {
    this.loadingPlan.set(true);
    this.clienteService.getPlanes().subscribe({
      next: (planes) => {
        const active = planes.find(p => p.status === 'aprobado_ia' || p.status === 'activo') ?? planes[0] ?? null;
        this.activePlan.set(active);
        this.loadingPlan.set(false);
      },
      error: () => { this.loadingPlan.set(false); },
    });
  }

  generarPlan(): void {
    this.planExpanded.set(false);
    this.userInput = 'Muéstrame mi plan nutricional personalizado';
    this.sendMessage();
  }

  private setGreeting(): void {
    this.messages.set([{
      role: 'ai',
      content: '¡Hola! Soy tu asistente nutricional de Calofit. ¿En qué puedo ayudarte hoy? 🥗',
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
          const cards = isDirectLog ? [] : this.parseCalofitResponse(rawText);
          const texto = (isDirectLog ? rawText : this.stripCalofitTags(rawText))
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

  parseCalofitResponse(raw: string): CalofitCard[] {
    const cards: CalofitCard[] = [];
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

  private stripCalofitTags(raw: string): string {
    return raw.replace(/\[CALOFIT_[A-Z]+\][\s\S]*?\[\/CALOFIT_[A-Z]+\]/g, '').trim();
  }
}
