import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { User } from '../../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgClass],
  styleUrl: './profile.component.scss',
  template: `
    <div class="profile">
      <h1 class="profile__title">&#x200F;&#x67E;&#x631;&#x648;&#x641;&#x627;&#x6CC;&#x644; &#x645;&#x646;</h1>

      @if (loading()) {
        <div class="profile__loading">
          <div class="profile__spinner"></div>
        </div>
      } @else if (user(); as u) {
        <div class="profile__card">
          <!-- Header -->
          <div class="profile__header">
            <h2 class="profile__header-name">
              {{ u.firstName }} {{ u.lastName }}
            </h2>
            <span class="profile__badge"
                  [ngClass]="{
                    'profile__badge--admin': u.role === 'ADMIN',
                    'profile__badge--librarian': u.role === 'LIBRARIAN',
                    'profile__badge--user': u.role === 'USER'
                  }">
              {{ u.role === 'ADMIN' ? '&#x645;&#x62F;&#x6CC;&#x631;' : u.role === 'LIBRARIAN' ? '&#x6A9;&#x62A;&#x627;&#x628;&#x62F;&#x627;&#x631;' : '&#x6A9;&#x627;&#x631;&#x628;&#x631;' }}
            </span>
          </div>

          <!-- Form -->
          <div class="profile__body">
            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile__form">
              <div class="profile__field">
                <label class="profile__label">&#x200F;&#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC;</label>
                <input type="text" formControlName="username"
                       class="profile__input profile__input--readonly"
                       readonly />
              </div>

              <div class="profile__field">
                <label class="profile__label">&#x200F;&#x627;&#x6CC;&#x645;&#x6CC;&#x644;</label>
                <input type="email" formControlName="email"
                       class="profile__input"
                       [class.profile__input--error]="profileForm.get('email')?.invalid
                                            && profileForm.get('email')?.touched" />
                @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
                  <p class="profile__hint profile__hint--error">&#x200F;&#x627;&#x6CC;&#x645;&#x6CC;&#x644; &#x645;&#x639;&#x62A;&#x628;&#x631; &#x627;&#x644;&#x632;&#x627;&#x645;&#x6CC; &#x627;&#x633;&#x62A;</p>
                }
              </div>

              <div class="profile__row">
                <div class="profile__field">
                  <label class="profile__label">&#x200F;&#x646;&#x627;&#x645;</label>
                  <input type="text" formControlName="firstName"
                         class="profile__input"
                         [class.profile__input--error]="profileForm.get('firstName')?.invalid
                                              && profileForm.get('firstName')?.touched" />
                  @if (profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched) {
                    <p class="profile__hint profile__hint--error">&#x200F;&#x627;&#x644;&#x632;&#x627;&#x645;&#x6CC;</p>
                  }
                </div>
                <div class="profile__field">
                  <label class="profile__label">&#x200F;&#x646;&#x627;&#x645; &#x62E;&#x627;&#x646;&#x648;&#x627;&#x62F;&#x6AF;&#x6CC;</label>
                  <input type="text" formControlName="lastName"
                         class="profile__input"
                         [class.profile__input--error]="profileForm.get('lastName')?.invalid
                                              && profileForm.get('lastName')?.touched" />
                  @if (profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched) {
                    <p class="profile__hint profile__hint--error">&#x200F;&#x627;&#x644;&#x632;&#x627;&#x645;&#x6CC;</p>
                  }
                </div>
              </div>

              <div class="profile__field">
                <label class="profile__label">&#x200F;&#x645;&#x648;&#x628;&#x627;&#x6CC;&#x644; (&#x627;&#x62E;&#x62A;&#x6CC;&#x627;&#x631;&#x6CC;)</label>
                <input type="text" formControlName="mobile"
                       class="profile__input profile__input--mono"
                       placeholder="0912..." />
              </div>

              <div class="profile__actions">
                <button type="submit" class="profile__submit"
                        [disabled]="profileForm.invalid || saving()">
                  @if (saving()) {
                    <span class="profile__submit-spinner"></span>
                    &#x200F;&#x62F;&#x631; &#x62D;&#x627;&#x644; &#x630;&#x62E;&#x6CC;&#x631;&#x647;...
                  } @else {
                    <svg class="profile__submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    &#x200F;&#x630;&#x62E;&#x6CC;&#x631;&#x647; &#x62A;&#x63A;&#x6CC;&#x6CC;&#x631;&#x627;&#x62A;
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
export class ProfileComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  user = signal<User | null>(null);
  loading = signal(true);
  saving = signal(false);

  profileForm: FormGroup = this.fb.group({
    username: [{ value: '', disabled: true }],
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    mobile: [''],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.apiService.get<User>('/users/me').subscribe({
      next: (user) => {
        this.user.set(user);
        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobile: user.mobile ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('&#x628;&#x627;&#x631;&#x6AF;&#x630;&#x627;&#x631;&#x6CC; &#x67E;&#x631;&#x648;&#x641;&#x627;&#x6CC;&#x644; &#x646;&#x627;&#x645;&#x648;&#x641;&#x642; &#x628;&#x648;&#x62F;', 'error');
      },
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }
    this.saving.set(true);
    const formValue = { ...this.profileForm.getRawValue() };
    this.apiService.put<User>('/users/me', formValue).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.user.set(updated);
        this.toast.show('&#x67E;&#x631;&#x648;&#x641;&#x627;&#x6CC;&#x644; &#x628;&#x627; &#x645;&#x648;&#x641;&#x642;&#x6CC;&#x62A; &#x628;&#x631;&#x648;&#x632;&#x631;&#x633;&#x627;&#x646;&#x6CC; &#x634;&#x62F;!', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err?.error?.message ?? 'Failed to update profile', 'error');
      },
    });
  }
}
