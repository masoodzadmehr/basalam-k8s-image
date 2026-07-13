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
  template: `
    <div class="max-w-2xl mx-auto py-6 px-4 sm:px-6">
      <h1 class="font-display text-2xl font-bold text-ink mb-6">My Profile</h1>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-2 border-brass border-t-transparent rounded-full"></div>
        </div>
      } @else if (user(); as u) {
        <div class="card">
          <!-- Profile header -->
          <div class="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-wood/10
                      bg-brass-light/20">
            <div>
              <h2 class="font-display text-xl font-semibold text-ink">
                {{ u.firstName }} {{ u.lastName }}
              </h2>
            </div>
            <span class="badge text-sm font-medium"
                  [ngClass]="{
                    'badge-active': u.role === 'ADMIN',
                    'badge-pending': u.role === 'LIBRARIAN',
                    'badge-cancelled': u.role === 'USER'
                  }">
              {{ u.role }}
            </span>
          </div>

          <!-- Profile form -->
          <div class="p-6">
            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-slate mb-1">Username</label>
                <input type="text" formControlName="username"
                       class="input-field w-full bg-wood/5 text-slate cursor-not-allowed"
                       readonly />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate mb-1">Email</label>
                <input type="email" formControlName="email"
                       class="input-field w-full"
                       [class.border-danger]="profileForm.get('email')?.invalid
                                            && profileForm.get('email')?.touched" />
                @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
                  <p class="text-danger text-xs mt-1">Valid email is required</p>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-medium text-slate mb-1">First Name</label>
                  <input type="text" formControlName="firstName"
                         class="input-field w-full"
                         [class.border-danger]="profileForm.get('firstName')?.invalid
                                              && profileForm.get('firstName')?.touched" />
                  @if (profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched) {
                    <p class="text-danger text-xs mt-1">Required</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate mb-1">Last Name</label>
                  <input type="text" formControlName="lastName"
                         class="input-field w-full"
                         [class.border-danger]="profileForm.get('lastName')?.invalid
                                              && profileForm.get('lastName')?.touched" />
                  @if (profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched) {
                    <p class="text-danger text-xs mt-1">Required</p>
                  }
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate mb-1">Mobile (optional)</label>
                <input type="text" formControlName="mobile"
                       class="input-field w-full"
                       placeholder="0912..." />
              </div>

              <div class="flex justify-end pt-2">
                <button type="submit" class="btn btn-primary"
                        [disabled]="profileForm.invalid || saving()">
                  @if (saving()) {
                    <span class="inline-block animate-spin h-4 w-4 border-2 border-white
                                 border-t-transparent rounded-full mr-2 align-middle"></span>
                    Saving...
                  } @else {
                    Save Changes
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
        this.toast.show('Failed to load profile', 'error');
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
        this.toast.show('Profile updated successfully!', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err?.error?.message ?? 'Failed to update profile', 'error');
      },
    });
  }
}
