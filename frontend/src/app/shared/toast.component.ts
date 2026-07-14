import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium
                 cursor-pointer transition-all animate-[toast-in_0.25s_ease-out]
                 max-w-sm flex items-center gap-2.5 backdrop-blur-sm"
          [ngClass]="{
            'bg-success/95 text-white': toast.type === 'success',
            'bg-danger/95 text-white': toast.type === 'error',
            'bg-spine/95 text-white': toast.type === 'info'
          }"
          (click)="toastService.dismiss(toast.id)"
        >
          @if (toast.type === 'success') {
            <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          } @else if (toast.type === 'error') {
            <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toast-in {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
