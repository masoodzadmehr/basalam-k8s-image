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
  styleUrl: './system-config.component.scss',
  template: `
    <div class="sys-config">
      <div class="sys-config__header">
        <h1 class="sys-config__title">&#x200F;&#x62A;&#x646;&#x638;&#x6CC;&#x645;&#x627;&#x62A; &#x633;&#x6CC;&#x633;&#x62A;&#x645;</h1>
        <p class="sys-config__subtitle">&#x200F;&#x645;&#x62F;&#x6CC;&#x631;&#x6CC;&#x62A; &#x642;&#x648;&#x627;&#x646;&#x6CC;&#x646; &#x627;&#x645;&#x627;&#x646;&#x62A; &#x628;&#x631;&#x627;&#x6CC; &#x62A;&#x645;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x627;&#x646;</p>
      </div>

      @if (loading()) {
        <div class="sys-config__loading">
          <div class="sys-config__spinner"></div>
        </div>
      } @else {
        <div class="sys-config__card">
          <form [formGroup]="configForm" (ngSubmit)="onSubmit()" class="sys-config__form">
            <div class="sys-config__grid">
              <div class="sys-config__field">
                <label class="sys-config__label">
                  <svg class="sys-config__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  &#x200F;&#x62D;&#x62F;&#x627;&#x6A9;&#x62B;&#x631; &#x6A9;&#x62A;&#x627;&#x628; &#x628;&#x631;&#x627;&#x6CC; &#x647;&#x631; &#x6A9;&#x627;&#x631;&#x628;&#x631;
                </label>
                <input type="number" formControlName="maxBooksPerUser"
                       class="sys-config__input" min="1" />
                @if (configForm.get('maxBooksPerUser')?.invalid) {
                  <p class="sys-config__hint sys-config__hint--error">&#x200F;&#x62D;&#x62F;&#x627;&#x642;&#x644; &#x6F1;</p>
                }
              </div>

              <div class="sys-config__field">
                <label class="sys-config__label">
                  <svg class="sys-config__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  &#x200F;&#x645;&#x62F;&#x62A; &#x627;&#x645;&#x627;&#x646;&#x62A; (&#x631;&#x648;&#x632;)
                </label>
                <input type="number" formControlName="loanDurationDays"
                       class="sys-config__input" min="1" />
                @if (configForm.get('loanDurationDays')?.invalid) {
                  <p class="sys-config__hint sys-config__hint--error">&#x200F;&#x62D;&#x62F;&#x627;&#x642;&#x644; &#x6F1;</p>
                }
              </div>

              <div class="sys-config__field">
                <label class="sys-config__label">
                  <svg class="sys-config__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                  </svg>
                  &#x200F;&#x645;&#x62F;&#x62A; &#x62A;&#x645;&#x62F;&#x6CC;&#x62F; (&#x631;&#x648;&#x632;)
                </label>
                <input type="number" formControlName="extendDurationDays"
                       class="sys-config__input" min="1" />
                @if (configForm.get('extendDurationDays')?.invalid) {
                  <p class="sys-config__hint sys-config__hint--error">&#x200F;&#x62D;&#x62F;&#x627;&#x642;&#x644; &#x6F1;</p>
                }
              </div>

              <div class="sys-config__field">
                <label class="sys-config__label">
                  <svg class="sys-config__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                  &#x200F;&#x62D;&#x62F;&#x627;&#x6A9;&#x62B;&#x631; &#x62A;&#x645;&#x62F;&#x6CC;&#x62F;
                </label>
                <input type="number" formControlName="maxExtensions"
                       class="sys-config__input" min="0" />
                @if (configForm.get('maxExtensions')?.invalid) {
                  <p class="sys-config__hint sys-config__hint--error">&#x200F;&#x6F0; &#x6CC;&#x627; &#x628;&#x6CC;&#x634;&#x62A;&#x631;</p>
                }
              </div>

              <div class="sys-config__field">
                <label class="sys-config__label">
                  <svg class="sys-config__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  &#x200F;&#x62C;&#x631;&#x6CC;&#x645;&#x647; &#x631;&#x648;&#x632;&#x627;&#x646;&#x647; (&#x631;&#x6CC;&#x627;&#x644;)
                </label>
                <input type="number" formControlName="finePerDayIrt"
                       class="sys-config__input sys-config__input--mono" min="0" />
                @if (configForm.get('finePerDayIrt')?.invalid) {
                  <p class="sys-config__hint sys-config__hint--error">&#x200F;&#x6F0; &#x6CC;&#x627; &#x628;&#x6CC;&#x634;&#x62A;&#x631;</p>
                }
              </div>
            </div>

            <div class="sys-config__actions">
              <button type="submit" class="sys-config__submit"
                      [disabled]="configForm.invalid || saving()">
                @if (saving()) {
                  <span class="sys-config__submit-spinner"></span>
                  &#x200F;&#x62F;&#x631; &#x62D;&#x627;&#x644; &#x630;&#x62E;&#x6CC;&#x631;&#x647;...
                } @else {
                  <svg class="sys-config__submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  &#x200F;&#x630;&#x62E;&#x6CC;&#x631;&#x647; &#x62A;&#x646;&#x638;&#x6CC;&#x645;&#x627;&#x62A;
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
        this.toast.show('&#x62A;&#x646;&#x638;&#x6CC;&#x645;&#x627;&#x62A; &#x628;&#x627; &#x645;&#x648;&#x641;&#x642;&#x6CC;&#x62A; &#x628;&#x631;&#x648;&#x632;&#x631;&#x633;&#x627;&#x646;&#x6CC; &#x634;&#x62F;!', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err?.error?.message ?? 'Failed to update configuration', 'error');
      },
    });
  }
}
