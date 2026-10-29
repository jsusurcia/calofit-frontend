import { Component, signal, inject, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Mic, Send, Bot, User, MicOff, Check, Sunrise, Apple, Soup, Moon } from 'lucide-angular';
import { DashboardRefreshService } from '../../../core/services/dashboard-refresh.service';
import { ChatService, ChatHistorialItem, ChatRespuesta, PropuestaSwap } from '../../../core/services/chat.service';
import { Observable } from 'rxjs';

interface RegistroInfo {
  alimentos: string[];
  kcal: string | null;
  /** Avisos que el backend agrega tras el total (alimentos restringidos, cantidades inusuales). */
  avisos: string | null;
}

interface ChatMessage {
  id?: number;
  text: string;
  sender: 'user' | 'bot';
  time: Date;
  /** Respuesta a un registro de comida (se muestra con encabezado "Registrado"). */
  registro?: RegistroInfo;
  /** Cambio de comida propuesto, a la espera de confirmación. */
  propuesta?: PropuestaSwap;
  /** La propuesta ya se confirmó, se pidió otra o la conversación siguió. */
  resuelta?: boolean;
}

const SCROLL_TOP_THRESHOLD = 80;
/** Una propuesta del historial solo sigue vigente (con botones) si es la última y es reciente. */
const PROPUESTA_VIGENCIA_MS = 24 * 60 * 60 * 1000;

const DIAS_NUMERO: Record<string, number> = {
  lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 7,
};
const TIPOS_COMIDA: Record<string, string> = {
  desayuno: 'desayuno', snack: 'media_manana', almuerzo: 'almuerzo', cena: 'cena',
};

const RE_CONFIRMAR =
  /^(si|sip|dale|ok|okay|va|claro|perfecto|listo|bueno|de acuerdo|esta bien)( (cambiala|cambialo|hazlo|ponlo|dale|por favor|porfa|gracias|aplicalo))?$|^(cambiala|cambialo|hazlo|ponlo|aplicalo|me gusta|adelante)$/;
const RE_OTRA_OPCION =
  /^(otra|otro|otra opcion|otra alternativa|otra mas|otra por favor|otra porfa|otro plato|dame otra|dame otro|dame otra opcion|algo diferente|otra cosa|no me gusta|no me convence)$/;

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full bg-cream w-full">
      <!-- Header (en móvil el título lo muestra el layout) -->
      <div class="hidden lg:flex bg-white border-b border-green-cream px-6 py-4 items-center gap-3 shrink-0">
        <div class="w-11 h-11 rounded-2xl bg-green-pale text-teal-deep flex items-center justify-center">
          <lucide-angular [img]="BotIcon" [size]="22" />
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-teal-deep leading-tight">CaloCoach</h2>
          <p class="text-sm text-ink-soft">Registra tus comidas, cambia platos o pregúntale lo que quieras</p>
        </div>
      </div>

      <!-- Messages Area -->
      <div #scrollMe (scroll)="onScroll()" class="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        @if (cargandoHistorial()) {
          <div class="flex justify-center py-2">
            <div class="w-5 h-5 border-2 border-green-cream border-t-teal-mid rounded-full animate-spin"></div>
          </div>
        }

        @if (!cargandoInicial() && messages().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-green-pale rounded-full flex items-center justify-center mb-4 text-teal-deep">
              <lucide-angular [img]="BotIcon" [size]="32" />
            </div>
            <p class="text-ink font-semibold">¡Hola! Soy tu asistente de nutrición.</p>
            <p class="text-sm text-ink-soft max-w-xs mt-1">Cuéntame qué comiste, pídeme cambiar un plato de tu menú o pregúntame lo que necesites.</p>
          </div>
        }

        @for (msg of messages(); track $index) {
          <div class="flex" [ngClass]="msg.sender === 'user' ? 'justify-end' : 'justify-start'">
            <div class="flex gap-3 max-w-[90%] md:max-w-[70%]" [ngClass]="{'flex-row-reverse': msg.sender === 'user'}">
              <div class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1"
                   [ngClass]="msg.sender === 'user' ? 'bg-teal-mid/10 text-teal-mid' : 'bg-green-pale text-teal-deep'">
                <lucide-angular [img]="msg.sender === 'user' ? UserIcon : BotIcon" [size]="16" />
              </div>

              <div class="min-w-0">
                @if (msg.registro; as reg) {
                  <!-- Respuesta a un registro de comida -->
                  <div class="bg-white border border-green-cream rounded-2xl rounded-tl-sm shadow-sm overflow-hidden min-w-[240px]">
                    <div class="flex items-center gap-2 px-4 py-2.5 bg-green-pale text-teal-deep text-sm font-semibold">
                      <lucide-angular [img]="CheckIcon" [size]="16" /> Registrado
                    </div>
                    <div class="px-4 py-3">
                      <ul class="space-y-1">
                        @for (alimento of reg.alimentos; track $index) {
                          <li class="flex items-start gap-2 text-[15px] text-ink">
                            <span class="mt-2 w-1.5 h-1.5 rounded-full bg-green-leaf shrink-0"></span>{{ alimento }}
                          </li>
                        }
                      </ul>
                      @if (reg.kcal) {
                        <p class="mt-3 text-sm text-ink-soft">≈ {{ reg.kcal }} kcal en total</p>
                      }
                      @if (reg.avisos) {
                        <p class="mt-3 text-xs text-amber-800 whitespace-pre-line">{{ reg.avisos }}</p>
                      }
                      <a routerLink="/cliente/balance" class="mt-3 inline-block text-sm font-semibold text-teal-mid hover:text-teal-deep">Ver mi balance de hoy</a>
                    </div>
                  </div>
                } @else if (msg.propuesta; as prop) {
                  <!-- Propuesta de cambio de comida -->
                  <div class="bg-white border border-green-cream rounded-2xl rounded-tl-sm shadow-sm p-4">
                    <p class="text-[15px] text-ink">{{ msg.text }}</p>
                    <div class="mt-3 flex items-center gap-3 rounded-2xl bg-cream border border-green-cream p-3">
                      <div class="w-11 h-11 shrink-0 rounded-xl bg-cyan-ring/20 text-teal-mid flex items-center justify-center">
                        <lucide-angular [img]="iconoComida(prop.tipo_comida)" [size]="20" />
                      </div>
                      <p class="font-semibold text-ink leading-snug">{{ prop.plato }}</p>
                    </div>
                    @if (!msg.resuelta) {
                      <div class="mt-3 flex flex-wrap gap-2">
                        <button (click)="confirmarPropuesta(msg)" [disabled]="loading()"
                          class="px-4 py-2 rounded-xl bg-teal-mid text-white text-sm font-semibold hover:bg-teal-deep disabled:opacity-50 transition-colors cursor-pointer">
                          Sí, cámbiala
                        </button>
                        <button (click)="otraOpcion(msg)" [disabled]="loading()"
                          class="px-4 py-2 rounded-xl border border-green-cream bg-white text-teal-mid text-sm font-semibold hover:bg-cream-2 disabled:opacity-50 transition-colors cursor-pointer">
                          Otra opción
                        </button>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="px-4 py-3 rounded-2xl shadow-sm"
                       [ngClass]="msg.sender === 'user'
                         ? 'bg-teal-mid text-white rounded-tr-sm'
                         : 'bg-white text-ink border border-green-cream rounded-tl-sm'">
                    <p class="text-[15px] leading-relaxed whitespace-pre-wrap">{{ msg.text }}</p>
                  </div>
                }
                <span class="block mt-1 px-1 text-[11px] text-ink-soft" [ngClass]="msg.sender === 'user' ? 'text-right' : 'text-left'">
                  {{ msg.time | date:'HH:mm' }}
                </span>
              </div>
            </div>
          </div>
        }

        @if (loading()) {
          <div class="flex justify-start">
            <div class="flex gap-3 max-w-[85%]">
              <div class="w-8 h-8 shrink-0 rounded-full bg-green-pale text-teal-deep flex items-center justify-center mt-1">
                <lucide-angular [img]="BotIcon" [size]="16" />
              </div>
              <div class="p-4 bg-white border border-green-cream rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                <div class="w-2 h-2 bg-green-leaf/60 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-green-leaf/60 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
                <div class="w-2 h-2 bg-green-leaf/60 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Input Area (en móvil deja espacio para el botón de voz elevado de la barra inferior) -->
      <div class="bg-cream border-t border-green-cream px-4 md:px-8 pt-4 pb-9 lg:pb-4 shrink-0">
        <div class="flex items-center gap-3">
          <!-- Botón Micrófono -->
          <button type="button"
            (click)="toggleRecording()"
            class="shrink-0 h-14 w-14 sm:w-auto sm:px-6 rounded-2xl flex items-center justify-center gap-2 text-white font-bold shadow-lg transition-colors cursor-pointer"
            [ngClass]="isRecording() ? 'bg-red-600 shadow-red-600/25 animate-pulse' : 'bg-teal-mid hover:bg-teal-deep shadow-teal-mid/25'"
            [attr.aria-label]="isRecording() ? 'Detener' : 'Hablar'"
          >
            <lucide-angular [img]="isRecording() ? MicOffIcon : MicIcon" [size]="22" />
            <span class="hidden sm:inline">{{ isRecording() ? 'Escuchando...' : 'Hablar' }}</span>
          </button>

          <!-- Input de texto + Enviar -->
          <div class="flex-1 flex items-center gap-2 bg-white rounded-2xl border border-green-cream pl-4 pr-2 focus-within:border-teal-mid focus-within:ring-2 focus-within:ring-teal-mid/15 transition-all">
            <textarea
              [(ngModel)]="inputText"
              (keydown.enter)="onEnter($event)"
              placeholder="O escríbele a CaloCoach..."
              class="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[52px] py-3.5 text-[15px] text-ink placeholder:text-ink-soft/60 outline-none"
              rows="1"
            ></textarea>
            <button
              (click)="sendMessage()"
              [disabled]="!inputText.trim() || loading()"
              aria-label="Enviar"
              class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              [ngClass]="inputText.trim() ? 'bg-teal-mid text-white hover:bg-teal-deep' : 'bg-cream-2 text-ink-soft'"
            >
              <lucide-angular [img]="SendIcon" [size]="18" class="ml-0.5" />
            </button>
          </div>
        </div>
        <p class="hidden lg:block mt-2 text-xs text-ink-soft">
          Toca <span class="font-bold">Hablar</span> y cuéntame qué comiste, como si le contaras a un amigo.
        </p>
      </div>
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";
    :host { display: block; height: 100%; }
  `]
})
export class ChatComponent implements OnInit {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  private chatService = inject(ChatService);
  private refreshService = inject(DashboardRefreshService);

  readonly BotIcon = Bot;
  readonly UserIcon = User;
  readonly MicIcon = Mic;
  readonly MicOffIcon = MicOff;
  readonly SendIcon = Send;
  readonly CheckIcon = Check;

  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  isRecording = signal(false);
  cargandoInicial = signal(true);
  cargandoHistorial = signal(false);
  inputText = '';

  private hayMas = false;

  private recognition: any;
  private synth = window.speechSynthesis;

  constructor() {
    this.initSpeechRecognition();
  }

  ngOnInit() {
    this.cargarHistorialInicial();
  }

  iconoComida(tipo: string) {
    switch (tipo) {
      case 'desayuno': return Sunrise;
      case 'media_manana': return Apple;
      case 'almuerzo': return Soup;
      default: return Moon;
    }
  }

  private cargarHistorialInicial() {
    this.cargandoInicial.set(true);
    this.chatService.obtenerHistorial().subscribe({
      next: (res) => {
        this.messages.set(this.marcarVigencia(res.mensajes.map(m => this.toChatMessage(m))));
        this.hayMas = res.hay_mas;
        this.cargandoInicial.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.cargandoInicial.set(false);
      }
    });
  }

  private toChatMessage(m: ChatHistorialItem): ChatMessage {
    const sender = m.role === 'user' ? 'user' : 'bot';
    const registro = sender === 'bot' ? this.parseRegistro(m.content) : null;
    const propuesta = sender === 'bot' && !registro ? this.parsePropuesta(m.content) : null;
    return {
      id: m.id,
      // Con propuesta, el plato se muestra en su tarjeta; el texto queda solo con el encabezado
      text: propuesta ? m.content.split('\n')[0] : m.content,
      sender,
      time: new Date(m.created_at),
      registro: registro ?? undefined,
      propuesta: propuesta ?? undefined,
      // Las propuestas del historial se dan por resueltas salvo la última (ver marcarVigencia)
      resuelta: propuesta ? true : undefined,
    };
  }

  /**
   * Las propuestas de cambio se guardan como texto:
   * "¡Claro! Te propongo para tu snack del Miercoles:\n{plato}" o
   * "Otra opción para tu snack del Miércoles:\n{plato}".
   */
  private parsePropuesta(text: string): PropuestaSwap | null {
    const m = text.match(/^(?:¡Claro! Te propongo para tu|Otra opción para tu) (.+?) del ([^\s:]+):\n([\s\S]+)$/);
    if (!m) return null;
    const quitarTildes = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const tipo = TIPOS_COMIDA[quitarTildes(m[1])];
    const diaNumero = DIAS_NUMERO[quitarTildes(m[2])];
    const plato = m[3].trim();
    if (!tipo || !diaNumero || !plato) return null;
    return { dia: m[2], dia_numero: diaNumero, tipo_comida: tipo, plato };
  }

  /** En la carga inicial, la propuesta del último mensaje (si es reciente) sigue pendiente. */
  private marcarVigencia(lista: ChatMessage[]): ChatMessage[] {
    const ultimo = lista[lista.length - 1];
    if (ultimo?.propuesta && Date.now() - ultimo.time.getTime() < PROPUESTA_VIGENCIA_MS) {
      ultimo.resuelta = false;
    }
    return lista;
  }

  /**
   * Las respuestas a un registro de comida tienen el formato:
   * "Registrado ✅ Anoté lo que comiste hoy:\n{alimentos separados por coma}\n\nTotal: 625 kcal | P: ..."
   */
  private parseRegistro(text: string): RegistroInfo | null {
    if (!/^Registrado\s*✅/.test(text)) return null;
    const lineas = text.split('\n').map(l => l.trim());
    const alimentos = (lineas[1] ?? '').split(/,\s*/).map(a => a.trim()).filter(Boolean);
    if (!alimentos.length) return null;
    const kcal = text.match(/Total:\s*([\d.,]+)\s*kcal/i)?.[1] ?? null;
    const iTotal = lineas.findIndex(l => /^Total:/i.test(l));
    const avisos = iTotal >= 0 ? lineas.slice(iTotal + 1).filter(Boolean).join('\n') : '';
    return { alimentos, kcal, avisos: avisos || null };
  }

  onScroll() {
    const container = this.myScrollContainer?.nativeElement;
    if (!container) return;
    if (container.scrollTop <= SCROLL_TOP_THRESHOLD) {
      this.cargarMensajesAntiguos();
    }
  }

  private cargarMensajesAntiguos() {
    if (!this.hayMas || this.cargandoHistorial()) return;

    const idMasAntiguo = this.messages()[0]?.id;
    if (idMasAntiguo === undefined) return;

    this.cargandoHistorial.set(true);
    const container = this.myScrollContainer?.nativeElement;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    this.chatService.obtenerHistorial(idMasAntiguo).subscribe({
      next: (res) => {
        this.messages.update(m => [...res.mensajes.map(x => this.toChatMessage(x)), ...m]);
        this.hayMas = res.hay_mas;
        this.cargandoHistorial.set(false);

        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      },
      error: () => {
        this.cargandoHistorial.set(false);
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        const el = this.myScrollContainer?.nativeElement;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      } catch (err) { }
    }, 50);
  }

  private initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      const { webkitSpeechRecognition }: any = window;
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';

      this.recognition.onstart = () => {
        this.isRecording.set(true);
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.inputText = (this.inputText + ' ' + finalTranscript).trim();
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.isRecording.set(false);
      };

      this.recognition.onend = () => {
        this.isRecording.set(false);
        if (this.inputText.trim()) {
           this.sendMessage();
        }
      };
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }

  toggleRecording() {
    if (!this.recognition) {
      alert('El dictado por voz no está soportado en tu navegador. Usa Chrome.');
      return;
    }

    if (this.isRecording()) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  speakResponse(text: string) {
    if (this.synth) {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      this.synth.speak(utterance);
    }
  }

  onEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

  // ---- propuestas de cambio de comida ----

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private propuestaPendiente(): ChatMessage | null {
    const ultimas = [...this.messages()].reverse();
    return ultimas.find(m => m.propuesta && !m.resuelta) ?? null;
  }

  private resolverPropuestas(): void {
    this.messages.update(msgs => msgs.map(m => (m.propuesta && !m.resuelta ? { ...m, resuelta: true } : m)));
  }

  confirmarPropuesta(msg: ChatMessage, textoUsuario = 'Sí, cámbiala'): void {
    if (!msg.propuesta || this.loading()) return;
    this.resolverPropuestas();
    this.enviarAccion(textoUsuario, this.chatService.confirmarSwap(msg.propuesta, textoUsuario));
  }

  otraOpcion(msg: ChatMessage, textoUsuario = 'Otra opción'): void {
    if (!msg.propuesta || this.loading()) return;
    this.resolverPropuestas();
    this.enviarAccion(textoUsuario, this.chatService.otraOpcionSwap(msg.propuesta, textoUsuario));
  }

  /** Muestra el mensaje del cliente, ejecuta la acción y agrega la respuesta de CaloCoach. */
  private enviarAccion(textoUsuario: string, request$: Observable<ChatRespuesta>): void {
    this.messages.update(m => [...m, { text: textoUsuario, sender: 'user', time: new Date() }]);
    this.loading.set(true);
    this.scrollToBottom();
    if (this.synth) this.synth.cancel();

    request$.subscribe({
      next: (res) => this.agregarRespuesta(res),
      error: () => this.agregarError(),
    });
  }

  private agregarRespuesta(res: ChatRespuesta): void {
    const replyMsg: ChatMessage = {
      text: res.reply,
      sender: 'bot',
      time: new Date(),
      registro: res.action_taken === 'registrar' ? this.parseRegistro(res.reply) ?? undefined : undefined,
      propuesta: res.action_taken === 'swap_propuesta' ? res.propuesta ?? undefined : undefined,
    };
    this.messages.update(m => [...m, replyMsg]);
    this.loading.set(false);
    this.scrollToBottom();

    this.speakResponse(replyMsg.propuesta ? `${res.reply} ${replyMsg.propuesta.plato}` : res.reply);

    // Actualizar el menú / balance cuando se aplicó un cambio o se registró una comida
    if (res.action_taken === 'swap' || res.action_taken === 'registrar') {
      this.refreshService.refresh();
    }
  }

  private agregarError(): void {
    const errorMsg: ChatMessage = { text: 'Ocurrió un error al conectarse con el asistente.', sender: 'bot', time: new Date() };
    this.messages.update(m => [...m, errorMsg]);
    this.loading.set(false);
    this.scrollToBottom();
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.loading()) return;

    // Si hay un cambio propuesto, "sí, cámbiala" / "otra opción" escritos también funcionan
    const pendiente = this.propuestaPendiente();
    if (pendiente) {
      const norm = this.normalizar(text);
      if (RE_CONFIRMAR.test(norm)) {
        this.inputText = '';
        this.confirmarPropuesta(pendiente, text);
        return;
      }
      if (RE_OTRA_OPCION.test(norm)) {
        this.inputText = '';
        this.otraOpcion(pendiente, text);
        return;
      }
      // Otro tema: la propuesta deja de estar vigente
      this.resolverPropuestas();
    }

    this.inputText = '';
    this.messages.update(m => [...m, { text, sender: 'user', time: new Date() }]);
    this.loading.set(true);
    this.scrollToBottom();

    if (this.synth) this.synth.cancel();

    this.chatService.enviarMensaje(text).subscribe({
      next: (res) => this.agregarRespuesta(res),
      error: () => this.agregarError(),
    });
  }
}
