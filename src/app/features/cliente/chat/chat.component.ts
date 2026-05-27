import { Component, signal, inject, ElementRef, ViewChild, AfterViewChecked, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Mic, Send, Bot, User, MicOff } from 'lucide-angular';
import { DashboardRefreshService } from '../../../core/services/dashboard-refresh.service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  time: Date;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-gray-50 max-w-4xl mx-auto w-full">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4 flex flex-col justify-center shrink-0">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <lucide-angular [img]="BotIcon" [size]="24" class="text-primary-600" />
          CaloCoach
        </h2>
        <p class="text-sm text-gray-500">Pídeme cambios en tu menú o hazme consultas de nutrición.</p>
      </div>

      <!-- Messages Area -->
      <div #scrollMe class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        @if (messages().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <lucide-angular [img]="BotIcon" [size]="32" class="text-gray-500" />
            </div>
            <p class="text-gray-600 font-medium">¡Hola! Soy tu asistente de nutrición.</p>
            <p class="text-sm text-gray-500 max-w-xs mt-1">Presiona el micrófono y dime "Cambia mi almuerzo de hoy" o pregúntame lo que necesites.</p>
          </div>
        }
        
        @for (msg of messages(); track $index) {
          <div class="flex" [ngClass]="{'justify-end': msg.sender === 'user', 'justify-start': msg.sender === 'bot'}">
            <div class="flex gap-3 max-w-[85%] md:max-w-[75%]" [ngClass]="{'flex-row-reverse': msg.sender === 'user'}">
              <div class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1"
                   [ngClass]="msg.sender === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-green-100 text-green-600'">
                <lucide-angular [img]="msg.sender === 'user' ? UserIcon : BotIcon" [size]="16" />
              </div>
              <div class="p-3 rounded-2xl shadow-sm relative"
                   [ngClass]="msg.sender === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'">
                <p class="text-[15px] leading-relaxed whitespace-pre-wrap">{{ msg.text }}</p>
                <span class="text-[10px] absolute -bottom-5" [ngClass]="msg.sender === 'user' ? 'right-1 text-gray-400' : 'left-1 text-gray-400'">
                  {{ msg.time | date:'HH:mm' }}
                </span>
              </div>
            </div>
          </div>
        }

        @if (loading()) {
          <div class="flex justify-start">
            <div class="flex gap-3 max-w-[85%]">
              <div class="w-8 h-8 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-1">
                <lucide-angular [img]="BotIcon" [size]="16" />
              </div>
              <div class="p-4 bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
                <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Input Area -->
      <div class="bg-white border-t border-gray-200 p-4 shrink-0 pb-safe">
        <div class="flex items-end gap-2 bg-gray-50 rounded-3xl p-2 border border-gray-200 focus-within:border-primary-400 focus-within:bg-white transition-all shadow-sm">
          
          <!-- Botón Micrófono -->
          <button type="button" 
            (click)="toggleRecording()"
            class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors mb-0.5"
            [ngClass]="isRecording() ? 'bg-red-500 text-white animate-pulse shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
          >
            <lucide-angular [img]="isRecording() ? MicOffIcon : MicIcon" [size]="20" />
          </button>

          <!-- Input de texto -->
          <textarea 
            [(ngModel)]="inputText"
            (keydown.enter)="onEnter($event)"
            placeholder="Escribe tu mensaje..."
            class="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 text-[15px] outline-none"
            rows="1"
          ></textarea>

          <!-- Botón Enviar -->
          <button 
            (click)="sendMessage()"
            [disabled]="!inputText.trim() || loading()"
            class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors mb-0.5"
            [ngClass]="inputText.trim() ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md' : 'bg-gray-100 text-gray-400'"
          >
            <lucide-angular [img]="SendIcon" [size]="18" class="ml-0.5" />
          </button>
        </div>
        <div class="text-center mt-2">
           <span class="text-[11px] text-gray-400" *ngIf="isRecording()">Escuchando... Di algo como "Cambia mi almuerzo"</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @reference "../../../../styles.css";
    :host { display: block; }
    .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
  `]
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  private http = inject(HttpClient);
  private refreshService = inject(DashboardRefreshService);

  readonly BotIcon = Bot;
  readonly UserIcon = User;
  readonly MicIcon = Mic;
  readonly MicOffIcon = MicOff;
  readonly SendIcon = Send;

  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  inputText = '';
  isRecording = signal(false);

  private recognition: any;
  private synth = window.speechSynthesis;

  constructor() {
    this.initSpeechRecognition();
    
    // Save to localStorage whenever messages change
    effect(() => {
      const msgs = this.messages();
      if (msgs.length > 0) {
        localStorage.setItem('calofit_coach_chat', JSON.stringify(msgs));
      }
    });
  }

  ngOnInit() {
    // Load from localStorage
    const saved = localStorage.getItem('calofit_coach_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.messages.set(parsed.map((m: any) => ({
          ...m,
          time: new Date(m.time)
        })));
      } catch (e) {
        console.error('Error parsing chat history', e);
      }
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
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
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
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
        // Opcional: enviar automáticamente si hay texto
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
      this.synth.cancel(); // Detener si está hablando
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05; // Un poco más rápido y natural
      this.synth.speak(utterance);
    }
  }

  onEnter(event: Event) {
    event.preventDefault();
    this.sendMessage();
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.loading()) return;

    this.inputText = '';
    const newMsg: ChatMessage = { text, sender: 'user', time: new Date() };
    this.messages.update(m => [...m, newMsg]);
    this.loading.set(true);
    
    // Stop speaking if user types
    if (this.synth) this.synth.cancel();

    this.http.post<any>('http://localhost:8000/chat/mensaje', { message: text }).subscribe({
      next: (res) => {
        const replyMsg: ChatMessage = { text: res.reply, sender: 'bot', time: new Date() };
        this.messages.update(m => [...m, replyMsg]);
        this.loading.set(false);
        
        // Speak the reply
        this.speakResponse(res.reply);

        // Refresh dashboard on swap or food registration
        if (res.action_taken === 'swap' || res.action_taken === 'registrar') {
            this.refreshService.refresh();
        }
      },
      error: () => {
        const errorMsg: ChatMessage = { text: 'Ocurrió un error al conectarse con el asistente.', sender: 'bot', time: new Date() };
        this.messages.update(m => [...m, errorMsg]);
        this.loading.set(false);
      }
    });
  }
}
