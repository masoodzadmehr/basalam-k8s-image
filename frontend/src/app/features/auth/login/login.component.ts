import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { LoginRequest } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-page">
      <!-- Background ambient decoration -->
      <div class="bg-ambient" aria-hidden="true">
        <div class="bg-blob bg-blob--1"></div>
        <div class="bg-blob bg-blob--2"></div>
        <div class="bg-blob bg-blob--3"></div>
      </div>

      <div class="login-shell">
        <!--
          Brand Panel — visible on desktop (>=768px).
          Dark blue gradient side with logo, tagline, and feature bullets.
        -->
        <section class="brand" aria-label="branding">
          <div class="brand-inner">
            <div class="brand-logo">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="7" width="42" height="34" rx="4" stroke="currentColor" stroke-width="2.5"/>
                <path d="M3 19h42" stroke="currentColor" stroke-width="2.5"/>
                <circle cx="14" cy="13" r="1.8" fill="currentColor"/>
                <circle cx="21" cy="13" r="1.8" fill="currentColor"/>
                <path d="M11 28h10M11 35h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h2 class="brand-name">&#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;</h2>
            <p class="brand-tagline">
              &#x633;&#x627;&#x645;&#x627;&#x646;&#x647; &#x645;&#x62F;&#x6CC;&#x631;&#x6CC;&#x62A; &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647; &#x648; &#x627;&#x645;&#x627;&#x646;&#x62A; &#x6A9;&#x62A;&#x627;&#x628;
            </p>

            <ul class="brand-features">
              <li class="brand-feature">
                <span class="brand-feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <span>جستجوی پیشرفته در میان هزاران کتاب</span>
              </li>
              <li class="brand-feature">
                <span class="brand-feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <span>رزرو و امانت آنلاین کتاب</span>
              </li>
              <li class="brand-feature">
                <span class="brand-feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </span>
                <span>اعلان‌های هوشمند برای موعد تحویل</span>
              </li>
            </ul>
          </div>
          <div class="brand-pattern" aria-hidden="true"></div>
        </section>

        <!--
          Form Panel — the primary interaction surface.
          Full-width on mobile; right half on desktop.
        -->
        <main class="form-panel">
          <div class="form-card">

            <!-- Mobile-only: condensed header shown when the brand panel is hidden -->
            <header class="form-header-mobile">
              <h1 class="form-title">&#x648;&#x631;&#x648;&#x62F; &#x628;&#x647; &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;</h1>
              <p class="form-subtitle">&#x628;&#x631;&#x627;&#x6CC; &#x627;&#x62F;&#x627;&#x645;&#x647; &#x628;&#x647; &#x62D;&#x633;&#x627;&#x628; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC; &#x62E;&#x648;&#x62F; &#x648;&#x627;&#x631;&#x62F; &#x634;&#x648;&#x6CC;&#x62F;</p>
            </header>

            <!--
              Register callout — a friendly nudge for new users.
              Entire row is clickable; subtle lift on hover.
            -->
            <a routerLink="/register" class="register-callout">
              <span class="register-callout-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </span>
              <span class="register-callout-body">
                <span class="register-callout-title">&#x62D;&#x633;&#x627;&#x628; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC; &#x646;&#x62F;&#x627;&#x631;&#x6CC;&#x62F;&#x60C;</span>
                <span class="register-callout-desc">&#x62B;&#x628;&#x62A; &#x646;&#x627;&#x645; &#x6A9;&#x646;&#x6CC;&#x62F; &#x648; &#x628;&#x647; &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647; &#x628;&#x67E;&#x6CC;&#x648;&#x646;&#x62F;&#x6CC;&#x62F;</span>
              </span>
              <span class="register-callout-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </span>
            </a>

            <!-- Section divider -->
            <div class="section-divider">
              <span class="section-divider-label">&#x6CC;&#x627; &#x648;&#x631;&#x648;&#x62F; &#x628;&#x627; &#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC;</span>
            </div>

            <!--
              Global error — appears when the server returns an auth failure.
              Uses a slide-down animation and semantic role="alert".
            -->
            @if (errorMessage) {
              <div class="error-banner" role="alert">
                <span class="error-banner-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </span>
                <p class="error-banner-text">{{ errorMessage }}</p>
                <button type="button" (click)="errorMessage = ''" class="error-banner-close" aria-label="&#x628;&#x633;&#x62A;&#x646;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            }

            <!-- Login form -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate class="login-form">
              <!-- Username -->
              <div class="field">
                <label for="username" class="field-label">
                  &#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC;
                </label>
                <div class="field-input-group">
                  <input
                    id="username"
                    type="text"
                    formControlName="username"
                    placeholder="username"
                    autocomplete="username"
                    class="field-input"
                    dir="ltr"
                  />
                  <span class="field-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                </div>
                @if (loginForm.get('username')?.invalid && loginForm.get('username')?.touched) {
                  <p class="field-hint field-hint--error" role="alert">&#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC; &#x632;&#x627;&#x631;&#x645;&#x6CC; &#x627;&#x633;&#x62A;</p>
                }
              </div>

              <!-- Password -->
              <div class="field">
                <label for="password" class="field-label">
                  &#x631;&#x645;&#x632; &#x639;&#x628;&#x648;&#x631;
                </label>
                <div class="field-input-group">
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                    autocomplete="current-password"
                    class="field-input field-input--has-suffix"
                    dir="ltr"
                  />
                  <span class="field-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <button
                    type="button"
                    (click)="showPassword = !showPassword"
                    class="field-input-suffix"
                    [attr.aria-label]="showPassword ? '&#x645;&#x62E;&#x641;&#x6CC; &#x6A9;&#x631;&#x62F;&#x646; &#x631;&#x645;&#x632; &#x639;&#x628;&#x648;&#x631;' : '&#x646;&#x645;&#x627;&#x6CC;&#x634; &#x631;&#x645;&#x632; &#x639;&#x628;&#x648;&#x631;'"
                    tabindex="-1"
                  >
                    @if (showPassword) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    } @else {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                  <p class="field-hint field-hint--error" role="alert">&#x631;&#x645;&#x632; &#x639;&#x628;&#x648;&#x631; &#x632;&#x627;&#x631;&#x645;&#x6CC; &#x627;&#x633;&#x62A;</p>
                }
              </div>

              <!-- Submit -->
              <button
                type="submit"
                [disabled]="loginForm.invalid || loading"
                class="submit-btn"
                [class.submit-btn--busy]="loading"
              >
                @if (loading) {
                  <svg class="submit-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                  <span>&#x62F;&#x631; &#x62D;&#x627;&#x644; &#x648;&#x631;&#x648;&#x62F;...</span>
                } @else {
                  <span>&#x648;&#x631;&#x648;&#x62F; &#x628;&#x647; &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;</span>
                  <svg class="submit-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                }
              </button>
            </form>

            <!-- Footer link -->
            <p class="form-footer">
              &#x62D;&#x633;&#x627;&#x628; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC; &#x646;&#x62F;&#x627;&#x631;&#x6CC;&#x62F;&#x60C;
              <a routerLink="/register" class="form-footer-link">&#x62B;&#x628;&#x62A; &#x646;&#x627;&#x645; &#x6A9;&#x646;&#x6CC;&#x62F;</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  loading = false;
  errorMessage = '';
  showPassword = false;

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const request: LoginRequest = this.loginForm.value;
    this.authService.login(request).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/books']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message
          ?? 'ورود ناموفق بود. لطفاً نام کاربری و رمز عبور خود را بررسی کنید.';
        this.toastService.show(this.errorMessage, 'error');
      },
    });
  }
}
