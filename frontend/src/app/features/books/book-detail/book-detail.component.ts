import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import type { Book } from '../../../core/models';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.scss'],
})
export class BookDetailComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  book = signal<Book | null>(null);
  loading = signal(true);
  userRole = this.authService.userRole;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBook(Number(id));
    }
  }

  loadBook(id: number): void {
    this.loading.set(true);
    this.apiService.get<Book>(`/books/${id}`).subscribe({
      next: (book) => {
        this.book.set(book);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load book details', 'Close', { duration: 5000 });
      },
    });
  }

  borrowBook(): void {
    const b = this.book();
    if (!b) { return; }
    this.apiService.post('/borrowings', { bookId: b.id }).subscribe({
      next: () => {
        this.snackBar.open('Book borrowed successfully!', 'Close', { duration: 3000 });
        this.loadBook(b.id);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to borrow book', 'Close', { duration: 5000 });
      },
    });
  }

  reserveBook(): void {
    const b = this.book();
    if (!b) { return; }
    this.apiService.post('/reservations', { bookId: b.id }).subscribe({
      next: () => {
        this.snackBar.open('Book reserved successfully!', 'Close', { duration: 3000 });
        this.loadBook(b.id);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Failed to reserve book', 'Close', { duration: 5000 });
      },
    });
  }

  editBook(): void {
    const b = this.book();
    if (b) {
      this.router.navigate(['/books', b.id, 'edit']);
    }
  }

  deleteBook(): void {
    const b = this.book();
    if (!b) { return; }
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Delete Book',
        message: `Are you sure you want to delete "${b.title}"?`,
        confirmLabel: 'Delete',
      },
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.apiService.delete<void>(`/books/${b.id}`).subscribe({
          next: () => {
            this.snackBar.open('Book deleted', 'Close', { duration: 3000 });
            this.router.navigate(['/books']);
          },
          error: (err) => {
            this.snackBar.open(err?.error?.message ?? 'Failed to delete book', 'Close', { duration: 5000 });
          },
        });
      }
    });
  }

  canBorrow(): boolean {
    const b = this.book();
    return b !== null && b.availableCopies > 0;
  }

  canReserve(): boolean {
    const b = this.book();
    return b !== null && b.availableCopies === 0;
  }

  canManageBooks(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }

  canDeleteBooks(): boolean {
    return this.userRole() === 'ADMIN';
  }
}
