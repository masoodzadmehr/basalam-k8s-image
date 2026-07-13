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
    <div class="max-w-2xl mx-auto py-6 px-4 sm:px-6">
      <h1 class="font-display text-2xl font-bold text-ink mb-6">System Configuration</h1>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-2 border-brass border-t-transparent rounded-full"></div>
        </div>
      } @else {
        <div class="card">
          <div class="p-6 border-b border-wood/10 bg-brass-light/20">
            <h2 class="font-display text-lg font-semibold text-ink">Borrowing Configuration</h2>
            <p class="text-sm text-slate-light mt-1">These settings control borrowing rules for all users</p>
          </div>
          <div class="p-6">
            <form [formGroup]="configForm" (ngSubmit)="onSubmit()">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-medium text-slate mb-1">Max Books Per User</label>
                  <input type="number" formControlName="maxBooksPerUser"
                         class="input-field w-full" min="1" />
                  @if (configForm.get('maxBooksPerUser')?.invalid) {
                    <p class="text-danger text-xs mt-1">Value must be at least 1</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate mb-1">Loan Duration (days)</label>
                  <input type="number" formControlName="loanDurationDays"
                         class="input-field w-full" min="1" />
                  @if (configForm.get('loanDurationDays')?.invalid) {
                    <p class="text-danger text-xs mt-1">Value must be at least 1</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate mb-1">Extend Duration (days)</label>
                  <input type="number" formControlName="extendDurationDays"
                         class="input-field w-full" min="1" />
                  @if (configForm.get('extendDurationDays')?.invalid) {
                    <p class="text-danger text-xs mt-1">Value must be at least 1</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate mb-1">Max Extensions</label>
                  <input type="number" formControlName="maxExtensions"
                         class="input-field w-full" min="0" />
                  @if (configForm.get('maxExtensions')?.invalid) {
                    <p class="text-danger text-xs mt-1">Value must be 0 or more</p>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate mb-1">Fine Per Day (IRR)</label>
                  <input type="number" formControlName="finePerDayIrt"
                         class="input-field w-full" min="0" />
                  @if (configForm.get('finePerDayIrt')?.invalid) {
                    <p class="text-danger text-xs mt-1">Value must be 0 or more</p>
                  }
                </div>
              </div>

              <div class="flex justify-end mt-8">
                <button type="submit" class="btn btn-primary"
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
