import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" (click)="onCancel()"></div>
        <div class="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
          <h2 class="font-display text-xl font-semibold text-ink mb-2">{{ title }}</h2>
          <p class="text-slate text-sm mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button class="btn btn-secondary" (click)="onCancel()">{{ cancelLabel }}</button>
            <button class="btn btn-danger" (click)="onConfirm()">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: ``,
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';

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
