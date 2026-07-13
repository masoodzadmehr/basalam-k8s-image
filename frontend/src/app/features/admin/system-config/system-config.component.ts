import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/toast.service';
import type { BorrowingConfig } from '../../../core/models';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 class="font-display text-2xl font-extrabold text-ink">System Configuration</h1>
        <p class="text-ink-muted text-sm mt-1">Control borrowing rules for all users</p>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin h-8 w-8 border-2 border-ink/15 border-t-ink rounded-full"></div>
        </div>
      } @else {
        <div class="card !p-6">
          <form [formGroup]="configForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-ink-light mb-1.5">Max Books Per User</label>
                <input type="number" formControlName="maxBooksPerUser"
                       class="input-field" min="1" />
                @if (configForm.get('maxBooksPerUser')?.invalid) {
                  <p class="text-danger text-xs mt-1">At least 1</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-ink-light mb-1.5">Loan Duration (days)</label>
                <input type="number" formControlName="loanDurationDays"
                       class="input-field" min="1" />
                @if (configForm.get('loanDurationDays')?.invalid) {
                  <p class="text-danger text-xs mt-1">At least 1</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-ink-light mb-1.5">Extend Duration (days)</label>
                <input type="number" formControlName="extendDurationDays"
                       class="input-field" min="1" />
                @if (configForm.get('extendDurationDays')?.invalid) {
                  <p class="text-danger text-xs mt-1">At least 1</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-ink-light mb-1.5">Max Extensions</label>
                <input type="number" formControlName="maxExtensions"
                       class="input-field" min="0" />
                @if (configForm.get('maxExtensions')?.invalid) {
                  <p class="text-danger text-xs mt-1">0 or more</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-ink-light mb-1.5">Fine Per Day (IRR)</label>
                <input type="number" formControlName="finePerDayIrt"
                       class="input-field" min="0" />
                @if (configForm.get('finePerDayIrt')?.invalid) {
                  <p class="text-danger text-xs mt-1">0 or more</p>
                }
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-border">
              <button type="submit" class="btn btn-accent"
                      [disabled]="configForm.invalid || saving()">
                @if (saving()) {
                  <span class="inline-block animate-spin h-4 w-4 border-2 border-white
                               border-t-transparent rounded-full mr-2 align-middle"></span>
                  Saving...
                } @else {
                  Save Configuration
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class SystemConfigComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);

  configForm: FormGroup = this.fb.group({
    maxBooksPerUser: [3, [Validators.required, Validators.min(1)]],
    loanDurationDays: [14, [Validators.required, Validators.min(1)]],
    extendDurationDays: [7, [Validators.required, Validators.min(1)]],
    maxExtensions: [1, [Validators.required, Validators.min(0)]],
    finePerDayIrt: [1000, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading.set(true);
    this.apiService.get<BorrowingConfig>('/config/borrowing').subscribe({
      next: (config) => {
        this.configForm.patchValue(config);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('Failed to load configuration', 'error');
      },
    });
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      return;
    }
    this.saving.set(true);
    this.apiService.put<BorrowingConfig>('/config/borrowing', this.configForm.value).subscribe({
      next: (config) => {
        this.saving.set(false);
        this.configForm.patchValue(config);
        this.toast.show('Configuration updated successfully!', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err?.error?.message ?? 'Failed to update configuration', 'error');
      },
    });
  }
}
