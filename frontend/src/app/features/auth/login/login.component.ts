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
    <div class="min-h-screen flex">
      <!-- Left Panel — Brand & CTA -->
      <div class="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-wood">
        <!-- Decorative bookshelf pattern -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-0 left-0 w-full h-full"
               style="background-image: repeating-linear-gradient(
                 0deg,
                 transparent,
                 transparent 58px,
                 rgb(255 255 255 / 0.3) 58px,
                 rgb(255 255 255 / 0.3) 60px
               ),
               repeating-linear-gradient(
                 90deg,
                 transparent,
                 transparent 80px,
                 rgb(255 255 255 / 0.1) 80px,
                 rgb(255 255 255 / 0.1) 82px
               ); background-size: 100% 60px, 82px 100%;">
          </div>
        </div>

        <!-- Warm gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-br from-wood via-wood-light to-brass/60"></div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <!-- Top: Logo -->
          <div>
            <a routerLink="/" class="inline-flex items-center gap-3 group">
              <div class="w-10 h-10 rounded-xl bg-brass flex items-center justify-center
                          text-white font-bold text-lg shadow-lg shadow-brass/40
                          group-hover:scale-105 transition-transform duration-300">
                &#x1F4DA;
              </div>
              <span class="text-xl font-bold tracking-tight">&#x62A9;&#x62A7;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;</span>
            </a>
          </div>

          <!-- Middle: Hero text -->
          <div class="flex-1 flex flex-col justify-center -mt-12">
            <h1 class="text-4xl xl:text-5xl font-extrabold leading-tight mb-6">
              &#x62C;&#x647;&#x627;&#x646; &#x6A9;&#x62A;&#x627;&#x628;&#x200C;&#x647;&#x627; &#x645;&#x6A9;&#x627;&#x646; &#x62A;&#x648; &#x6CC;&#x6A9; &#x642;&#x641;&#x633;&#x647;&#x200C;&#x627;&#x6CC; &#x62F;&#x6A9;&#x644;
            </h1>
            <p class="text-lg text-white/80 leading-relaxed max-w-md">
              &#x647;&#x632;&#x627;&#x631;&#x627;&#x646; &#x6A9;&#x62A;&#x627;&#x628; &#x631;&#x648; &#x62C;&#x62F;&#x62A;&#x648; &#x627;&#x32C;&#x627;&#x631;&#x647; &#x6A9;&#x646;&#x6CC;&#x62F;&#x60C; &#x631;&#x632;&#x631;&#x648; &#x6A9;&#x646;&#x6CC;&#x62F; &#x648; &#x62A;&#x648;&#x6CC; &#x6CC;&#x6A9; &#x642;&#x641;&#x633;&#x647;&#x200C;&#x627;&#x6CC; &#x62E;&#x648;&#x62F; &#x62F;&#x627;&#x631;&#x6CC;&#x62F;
            </p>

            <!-- Quick stats -->
            <div class="flex gap-8 mt-8">
              <div>
                <div class="text-3xl font-extrabold text-brass-light">+5000</div>
                <div class="text-sm text-white/60 mt-1">&#x6A9;&#x62A;&#x627;&#x628;</div>
              </div>
              <div>
                <div class="text-3xl font-extrabold text-brass-light">24/7</div>
                <div class="text-sm text-white/60 mt-1">&#x62F;&#x633;&#x62A;&#x631;&#x633;&#x6CC; &#x627;&#x645;&#x627;&#x646;&#x62A;</div>
              </div>
              <div>
                <div class="text-3xl font-extrabold text-brass-light">&#x31B5;/&#x32B0;</div>
                <div class="text-sm text-white/60 mt-1">&#x62C;&#x631;&#x6CC;&#x645;&#x647; &#x62A;&#x623;&#x62E;&#x6CC;&#x631;</div>
              </div>
            </div>
          </div>

          <!-- Bottom: Trust / quote -->
          <div class="border-t border-white/15 pt-6">
            <p class="text-sm text-white/50 italic">
              &#x22;&#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x648;&#x627;&#x646;&#x6CC; &#x628;&#x627;&#x646;&#x6A9;&#x200C;&#x647;&#x627;&#x6CC; &#x631;&#x648;&#x634;&#x200C;&#x647;&#x627;&#x6CC; &#x631;&#x648;&#x634;&#x646;&#x200C;&#x6A9;&#x631;&#x627;&#x646; &#x627;&#x633;&#x62A;&#x22;
            </p>
          </div>
        </div>
      </div>

      <!-- Right Panel — Login Form -->
      <div class="flex-1 flex items-center justify-center px-6 py-12 bg-paper">
        <div class="w-full max-w-md">
          <!-- Mobile logo (visible only on small screens) -->
          <div class="lg:hidden text-center mb-10">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                        bg-wood text-white text-2xl shadow-lg mb-4">
              &#x1F4DA;
            </div>
            <h1 class="text-2xl font-extrabold text-ink">&#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;</h1>
          </div>

          <!-- Welcome text -->
          <div class="mb-8">
            <h2 class="text-3xl font-extrabold text-ink mb-2">
              &#x62E;&#x648;&#x634; &#x622;&#x645;&#x62F;&#x6CC;&#x62F; &#x1F44B;
            </h2>
            <p class="text-slate-light">
              &#x628;&#x631;&#x627;&#x6CC; &#x627;&#x62F;&#x627;&#x645;&#x647;&#x60C; &#x648;&#x627;&#x631;&#x62F; &#x634;&#x648;&#x6CC;&#x62F;
            </p>
          </div>

          <!-- Booking CTA card -->
          <a routerLink="/register"
             class="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-parchment to-white
                    border border-brass/20 hover:border-brass/50 hover:shadow-lg
                    hover:shadow-brass/10 transition-all duration-300 mb-8 group cursor-pointer">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brass/15 flex items-center justify-center
                        text-2xl group-hover:scale-110 transition-transform duration-300">
              &#x1F516;
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-ink group-hover:text-wood transition-colors">
                &#x639;&#x636;&#x648;&#x6CC;&#x62A; &#x646;&#x62F;&#x627;&#x631;&#x6CC;&#x60C; &#x646;&#x648;&#x628;&#x62A; &#x628;&#x648;&#x62F;&#x646;
              </div>
              <div class="text-sm text-slate-light mt-0.5">
                &#x6A9;&#x645;&#x62A;&#x631; &#x627;&#x632; ۳ &#x62F;&#x642;&#x6CC;&#x642;&#x647; &#x2014; &#x62B;&#x628;&#x62A; &#x646;&#x627;&#x645; &#x648; &#x627;&#x645;&#x627;&#x646;&#x62A; &#x631;&#x627;&#x6CC;&#x6AF;&#x627;&#x646;
              </div>
            </div>
            <div class="flex-shrink-0 text-brass text-xl group-hover:translate-x-1 transition-transform duration-300 rtl:group-hover:-translate-x-1">
              &#x2190;
            </div>
          </a>

          <!-- Error message -->
          @if (errorMessage) {
            <div class="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-3
                        animate-[shake_0.3s_ease-in-out]">
              <span class="text-danger text-lg flex-shrink-0 mt-0.5">&#x26A0;&#xFE0F;</span>
              <div>
                <div class="text-sm font-medium text-danger">&#x648;&#x631;&#x648;&#x62F; &#x646;&#x627;&#x645;&#x648;&#x641;&#x642;</div>
                <div class="text-sm text-danger/80 mt-0.5">{{ errorMessage }}</div>
              </div>
              <button (click)="errorMessage = ''"
                      class="ml-auto flex-shrink-0 text-danger/50 hover:text-danger transition-colors">
                &#x2715;
              </button>
            </div>
          }

          <!-- Login form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Username -->
            <div>
              <label for="username" class="block text-sm font-medium text-ink mb-1.5">
                &#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC;
              </label>
              <div class="relative">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-light text-lg">
                  &#x1F464;
                </span>
                <input
                  id="username"
                  type="text"
                  formControlName="username"
                  placeholder="username"
                  autocomplete="username"
                  class="input-field !pr-10 text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-ink mb-1.5">
                &#x631;&#x645;&#x632; &#x639;&#x628;&#x648;&#x631;
              </label>
              <div class="relative">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-light text-lg">
                  &#x1F512;
                </span>
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                  autocomplete="current-password"
                  class="input-field !pr-10 text-left"
                  dir="ltr"
                />
                <button type="button"
                        (click)="showPassword = !showPassword"
                        class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light
                               hover:text-ink transition-colors text-lg"
                        tabindex="-1">
                  {{ showPassword ? '&#x1F648;' : '&#x1F649;' }}
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loginForm.invalid || loading"
              class="btn btn-primary w-full !py-3 !text-base !rounded-xl
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:shadow-lg hover:shadow-wood/20 transition-all duration-300">
              @if (loading) {
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  &#x62F;&#x631; &#x62D;&#x627;&#x644; &#x648;&#x631;&#x648;&#x62F;...
                </span>
              } @else {
                <span class="inline-flex items-center gap-2">
                  &#x648;&#x631;&#x648;&#x62F; &#x628;&#x647; &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;
                  <span class="text-lg">&#x1F3E0;</span>
                </span>
              }
            </button>
          </form>

          <!-- Register link -->
          <p class="mt-8 text-center text-sm text-slate-light">
            &#x62D;&#x633;&#x627;&#x628; &#x646;&#x62F;&#x627;&#x631;&#x6CC;&#x62F;&#x60C;
            <a routerLink="/register"
               class="text-brass hover:text-brass-light font-semibold underline underline-offset-4
                      decoration-brass/30 hover:decoration-brass transition-all">
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
