import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Book, User, Borrowing } from '../../../core/models';

@Component({
  selector: 'app-borrowing-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
  templateUrl: './borrowing-form.component.html',
  styleUrls: ['./borrowing-form.component.scss'],
})
export class BorrowingFormComponent {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  userRole = this.authService.userRole;

  borrowForm: FormGroup = this.fb.group({
    bookId: [null, [Validators.required]],
    userId: [null],
  });

  returnForm: FormGroup = this.fb.group({
    borrowingId: ['', [Validators.required]],
  });

  activeTab = signal<'borrow' | 'return'>('borrow');
  loading = false;
  books = signal<Book[]>([]);
  users = signal<User[]>([]);

  onTabChange(tab: 'borrow' | 'return'): void {
    this.activeTab.set(tab);
    if (tab === 'borrow') {
      this.searchBooks();
      if (this.canBorrowForOthers()) {
        this.loadUsers();
      }
    }
  }

  canBorrowForOthers(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }

  searchBooks(): void {
    this.apiService.get<{ content: Book[] }>('/books', { page: '0', size: '200' }).subscribe({
      next: (res) => this.books.set(res.content.filter(b => b.availableCopies > 0)),
    });
  }

  loadUsers(): void {
    this.apiService.get<{ content: User[] }>('/users', { page: '0', size: '200' }).subscribe({
      next: (res) => this.users.set(res.content),
    });
  }

  onBorrow(): void {
    if (this.borrowForm.invalid) {
      return;
    }
    this.loading = true;
    const body: { bookId: number; userId?: number } = { bookId: this.borrowForm.value.bookId };
    if (this.canBorrowForOthers() && this.borrowForm.value.userId) {
      body.userId = this.borrowForm.value.userId;
    }
    this.apiService.post<Borrowing>('/borrowings', body).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Book borrowed successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/borrowings']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err?.error?.message ?? 'Failed to borrow book', 'Close', { duration: 5000 });
      },
    });
  }

  onReturn(): void {
    if (this.returnForm.invalid) {
      return;
    }
    this.loading = true;
    const borrowingId = this.returnForm.value.borrowingId;
    this.apiService.post<Borrowing>(`/borrowings/${borrowingId}/return`, {}).subscribe({
      next: (borrowing) => {
        this.loading = false;
        let msg = 'Book returned successfully!';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.router.navigate(['/borrowings/all']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err?.error?.message ?? 'Failed to return book', 'Close', { duration: 5000 });
      },
    });
  }

  canReturnBooks(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }
}
