import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { Book, User, Borrowing } from '../../../core/models';

@Component({
  selector: 'app-borrowing-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-xl mx-auto p-4 md:p-6">
      <h1 class="font-display text-2xl font-bold text-ink mb-1">Borrow / Return</h1>
      <p class="text-sm text-slate-light mb-6">Manage book borrowings and returns</p>

      <!-- Tab toggle -->
      <div class="flex gap-0 mb-6 border border-wood/20 rounded-lg overflow-hidden bg-white">
        <button class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
                [class.bg-wood]="activeTab() === 'borrow'"
                [class.text-white]="activeTab() === 'borrow'"
                [class.text-slate-light]="activeTab() !== 'borrow'"
                (click)="switchTab('borrow')">
          Borrow
        </button>
        <button class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
                [class.bg-wood]="activeTab() === 'return'"
                [class.text-white]="activeTab() === 'return'"
                [class.text-slate-light]="activeTab() !== 'return'"
                (click)="switchTab('return')">
          Return
        </button>
      </div>

      @if (activeTab() === 'borrow') {
        <div class="card">
          <h2 class="font-display text-lg font-semibold mb-4">Borrow a Book</h2>
          <form [formGroup]="borrowForm" (ngSubmit)="onBorrow()">
            <div class="mb-4">
              <label class="block text-sm font-medium text-ink mb-1.5">Book</label>
              <select formControlName="bookId" class="input-field" (focus)="searchBooks()" (click)="searchBooks()">
                <option [ngValue]="null" disabled>Select a book...</option>
                @for (book of books(); track book.id) {
                  <option [ngValue]="book.id">{{ book.title }} ({{ book.availableCopies }} available)</option>
                }
              </select>
              @if (borrowForm.get('bookId')?.invalid && borrowForm.get('bookId')?.touched) {
                <p class="text-danger text-xs mt-1">Book is required</p>
              }
            </div>

            @if (canBorrowForOthers()) {
              <div class="mb-4">
                <label class="block text-sm font-medium text-ink mb-1.5">User (optional)</label>
                <select formControlName="userId" class="input-field" (focus)="loadUsers()" (click)="loadUsers()">
                  <option [ngValue]="null">Myself</option>
                  @for (user of users(); track user.id) {
                    <option [ngValue]="user.id">{{ user.username }} ({{ user.firstName }} {{ user.lastName }})</option>
                  }
                </select>
              </div>
            }

            <div class="flex gap-2">
              <button type="submit"
                      class="btn btn-primary flex-1"
                      [disabled]="borrowForm.invalid || loading">
                @if (loading) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                }
                Borrow
              </button>
              <a routerLink="/borrowings" class="btn btn-secondary">Cancel</a>
            </div>
          </form>
        </div>
      }

      @if (activeTab() === 'return') {
        <div class="card">
          <h2 class="font-display text-lg font-semibold mb-4">Return a Book</h2>
          <form [formGroup]="returnForm" (ngSubmit)="onReturn()">
            <div class="mb-4">
              <label class="block text-sm font-medium text-ink mb-1.5">Borrowing ID</label>
              <input type="text" formControlName="borrowingId" class="input-field" placeholder="Enter the borrowing ID..." />
              @if (returnForm.get('borrowingId')?.invalid && returnForm.get('borrowingId')?.touched) {
                <p class="text-danger text-xs mt-1">Borrowing ID is required</p>
              }
            </div>

            <div class="flex gap-2">
              <button type="submit"
                      class="btn btn-brass flex-1"
                      [disabled]="returnForm.invalid || loading">
                @if (loading) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                }
                Return Book
              </button>
              <a routerLink="/borrowings" class="btn btn-secondary">Cancel</a>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class BorrowingFormComponent {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  userRole = this.authService.userRole;

  borrowForm = this.fb.group({
    bookId: [null as number | null, [Validators.required]],
    userId: [null as number | null],
  });

  returnForm = this.fb.group({
    borrowingId: ['', [Validators.required]],
  });

  activeTab = signal<'borrow' | 'return'>('borrow');
  loading = false;
  books = signal<Book[]>([]);
  users = signal<User[]>([]);
  private booksLoaded = false;
  private usersLoaded = false;

  switchTab(tab: 'borrow' | 'return'): void {
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
    if (this.booksLoaded) {
      return;
    }
    this.apiService.get<{ content: Book[] }>('/books', { page: '0', size: '200' }).subscribe({
      next: (res) => {
        this.books.set(res.content.filter(b => b.availableCopies > 0));
        this.booksLoaded = true;
      },
    });
  }

  loadUsers(): void {
    if (this.usersLoaded) {
      return;
    }
    this.apiService.get<{ content: User[] }>('/users', { page: '0', size: '200' }).subscribe({
      next: (res) => {
        this.users.set(res.content);
        this.usersLoaded = true;
      },
    });
  }

  onBorrow(): void {
    if (this.borrowForm.invalid) {
      this.borrowForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const body: { bookId: number; userId?: number } = { bookId: this.borrowForm.value.bookId! };
    if (this.canBorrowForOthers() && this.borrowForm.value.userId) {
      body.userId = this.borrowForm.value.userId;
    }
    this.apiService.post<Borrowing>('/borrowings', body).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.show('Book borrowed successfully!', 'success');
        this.router.navigate(['/borrowings']);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.show(err?.error?.message ?? 'Failed to borrow book', 'error');
      },
    });
  }

  onReturn(): void {
    if (this.returnForm.invalid) {
      this.returnForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const borrowingId = this.returnForm.value.borrowingId!;
    this.apiService.post<Borrowing>(`/borrowings/${borrowingId}/return`, {}).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.show('Book returned successfully!', 'success');
        this.router.navigate(['/borrowings/all']);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.show(err?.error?.message ?? 'Failed to return book', 'error');
      },
    });
  }
}
