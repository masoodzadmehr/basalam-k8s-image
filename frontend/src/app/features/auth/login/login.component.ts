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
    <div class="min-h-screen flex flex-col bg-page">
      <div class="flex-1 flex items-center justify-center px-4 py-16">
        <div class="w-full max-w-[26rem]">

          <!-- Printer's Mark — the signature element -->
          <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-md
                        bg-ink text-white mb-5">
              <span class="font-mono text-2xl font-bold tracking-tighter leading-none">&#x425;</span>
            </div>
            <h1 class="font-display text-2xl font-extrabold text-ink leading-tight mb-1.5">
              &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;
            </h1>
            <p class="text-ink-muted text-sm max-w-xs mx-auto leading-relaxed">
              &#x648;&#x627;&#x631;&#x62F; &#x634;&#x648;&#x6CC;&#x62F; &#x2014; &#x6A9;&#x627;&#x62A;&#x627;&#x644;&#x648;&#x6AF; &#x6A9;&#x62A;&#x627;&#x628;&#x200C;&#x647;&#x627;&#x6CC; &#x62E;&#x648;&#x62F; &#x631;&#x627; &#x62C;&#x62F;&#x6CC;&#x62F;&#x648; &#x647;&#x645;&#x631;&#x627;&#x647; &#x6A9;&#x646;&#x6CC;&#x62F;
            </p>
          </div>

          <!-- Register CTA -->
          <a routerLink="/register"
             class="flex items-center gap-3 p-4 rounded-lg border border-border
                    hover:border-ink-light transition-colors duration-150 mb-8 group bg-surface">
            <div class="flex-shrink-0 w-10 h-10 rounded-md bg-page flex items-center justify-center
                        text-lg group-hover:scale-105 transition-transform duration-200">
              &#x1F516;
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-ink group-hover:text-accent transition-colors">
                &#x639;&#x636;&#x648;&#x6CC;&#x62A; &#x646;&#x62F;&#x627;&#x631;&#x6CC;&#x60C; &#x646;&#x648;&#x628;&#x62A; &#x628;&#x648;&#x62F;&#x646;
              </div>
              <div class="text-xs text-ink-muted mt-0.5">
                &#x6A9;&#x645;&#x62A;&#x631; &#x627;&#x632; ۳ &#x62F;&#x642;&#x6CC;&#x642;&#x647; &#x2014; &#x62B;&#x628;&#x62A; &#x646;&#x627;&#x645; &#x648; &#x627;&#x645;&#x627;&#x646;&#x62A; &#x631;&#x627;&#x6CC;&#x6AF;&#x627;&#x646;
              </div>
            </div>
            <div class="flex-shrink-0 text-ink-muted text-sm font-mono transition-transform duration-200
                        group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
              &rarr;
            </div>
          </a>

          <!-- Error message -->
          @if (errorMessage) {
            <div class="mb-6 p-4 rounded-md bg-danger-subtle border border-danger/20 flex items-start gap-3
                        animate-[shake_0.3s_ease-in-out]">
              <span class="text-danger text-base flex-shrink-0 mt-px">&#x26A0;&#xFE0F;</span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-danger">&#x648;&#x631;&#x648;&#x62F; &#x646;&#x627;&#x645;&#x648;&#x641;&#x642;</div>
                <div class="text-sm text-danger/80 mt-0.5 leading-relaxed">{{ errorMessage }}</div>
              </div>
              <button (click)="errorMessage = ''"
                      class="flex-shrink-0 text-danger/50 hover:text-danger transition-colors p-0.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          }

          <!-- Login form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Username -->
            <div>
              <label for="username" class="block text-sm font-medium text-ink-light mb-1.5">
                &#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC;
              </label>
              <input
                id="username"
                type="text"
                formControlName="username"
                placeholder="username"
                autocomplete="username"
                class="input-field text-left"
                dir="ltr"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-ink-light mb-1.5">
                &#x631;&#x645;&#x632; &#x639;&#x628;&#x648;&#x631;
              </label>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                  autocomplete="current-password"
                  class="input-field text-left !pr-10"
                  dir="ltr"
                />
                <button type="button"
                        (click)="showPassword = !showPassword"
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted
                               hover:text-ink transition-colors p-1"
                        tabindex="-1">
                  @if (showPassword) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M15 12a3 3 0 01-6.672.672M21 12c-1.058 3.298-4.51 6-9 6a9.6 9.6 0 01-4.5-1.125M3 3l18 18"/>
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loginForm.invalid || loading"
              class="btn btn-primary w-full !py-2.5 !text-sm !rounded-md
                     disabled:opacity-40 disabled:cursor-not-allowed">
              @if (loading) {
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  &#x62F;&#x631; &#x62D;&#x627;&#x644; &#x648;&#x631;&#x648;&#x62F;...
                </span>
              } @else {
                &#x648;&#x631;&#x648;&#x62F; &#x628;&#x647; &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;
              }
            </button>
          </form>

          <!-- Register link -->
          <p class="mt-8 text-center text-sm text-ink-muted">
            &#x62D;&#x633;&#x627;&#x628; &#x646;&#x62F;&#x627;&#x631;&#x6CC;&#x62F;&#x60C;
            <a routerLink="/register"
               class="text-accent hover:text-accent-hover font-semibold underline underline-offset-4
                      decoration-accent/30 hover:decoration-accent transition-all">
              &#x6AB;&#x62B;&#x628;&#x62A; &#x646;&#x627;&#x645; &#x6A9;&#x646;&#x6CC;&#x62F;
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
    :host {
      display: block;
    }
  `],
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
        this.errorMessage = err?.error?.message ?? 'Login failed. Please check your credentials.';
        this.toastService.show(this.errorMessage, 'error');
      },
    });
  }
}
