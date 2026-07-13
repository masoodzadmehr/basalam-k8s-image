import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="px-4 py-2.5 rounded-md shadow-lg text-sm font-medium cursor-pointer
                 transition-all animate-[slideIn_0.2s_ease-out] max-w-sm"
          [ngClass]="{
            'bg-success text-white': toast.type === 'success',
            'bg-danger text-white': toast.type === 'error',
            'bg-ink text-white': toast.type === 'info'
          }"
          (click)="toastService.dismiss(toast.id)"
        >{{ toast.message }}</div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
