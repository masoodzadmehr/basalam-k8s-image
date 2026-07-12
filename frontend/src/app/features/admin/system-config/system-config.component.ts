import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import type { BorrowingConfig } from '../../../core/models';

@Component({
  selector: 'app-system-config',
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
  ],
  templateUrl: './system-config.component.html',
  styleUrls: ['./system-config.component.scss'],
})
export class SystemConfigComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

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
        this.snackBar.open('Failed to load configuration', 'Close', { duration: 5000 });
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
        this.snackBar.open('Configuration updated successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.message ?? 'Failed to update configuration', 'Close', { duration: 5000 });
      },
    });
  }
}
