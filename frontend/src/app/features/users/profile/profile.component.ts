import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { User } from '../../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

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
        this.snackBar.open('Failed to load profile', 'Close', { duration: 5000 });
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
        this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.message ?? 'Failed to update profile', 'Close', { duration: 5000 });
      },
    });
  }
}
