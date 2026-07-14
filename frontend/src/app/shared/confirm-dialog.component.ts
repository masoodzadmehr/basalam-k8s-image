import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-ink/20 backdrop-blur-sm" (click)="onCancel()"></div>
        <div class="relative card !p-6 max-w-sm w-full mx-4 shadow-xl">
          <h2 class="font-display text-lg font-bold text-ink mb-2">{{ title }}</h2>
          <p class="text-sm text-ink-light mb-5 leading-relaxed">{{ message }}</p>
          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm" (click)="onCancel()">{{ cancelLabel }}</button>
            <button class="btn btn-accent btn-sm" (click)="onConfirm()">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: ``,
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'تایید';
  @Input() message = 'آیا اطمینان دارید؟';
  @Input() confirmLabel = 'تایید';
  @Input() cancelLabel = 'انصراف';

  @Output() confirmed = new EventEmitter<boolean>();

  onConfirm(): void {
    this.confirmed.emit(true);
    this.open = false;
  }

  onCancel(): void {
    this.confirmed.emit(false);
    this.open = false;
  }
}
