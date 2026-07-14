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
  styleUrl: './borrowing-form.component.scss',
  template: `
    <div class="max-w-xl mx-auto space-y-6">
      <div>
        <h1 class="font-display text-2xl font-extrabold text-ink">امانت / برگشت</h1>
        <p class="text-ink-muted text-sm mt-1">مدیریت امانت و برگشت کتاب‌ها</p>
      </div>

      <!-- Tab toggle -->
      <div class="flex rounded-md overflow-hidden border border-border">
        <button class="flex-1 py-2.5 text-sm font-medium text-center transition-colors duration-100"
                [class.bg-ink]="activeTab() === 'borrow'"
                [class.text-white]="activeTab() === 'borrow'"
                [class.text-ink-muted]="activeTab() !== 'borrow'"
                [class.hover:text-ink]="activeTab() !== 'borrow'"
                (click)="switchTab('borrow')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 inline-block ml-1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          امانت
        </button>
        <button class="flex-1 py-2.5 text-sm font-medium text-center transition-colors duration-100"
                [class.bg-ink]="activeTab() === 'return'"
                [class.text-white]="activeTab() === 'return'"
                [class.text-ink-muted]="activeTab() !== 'return'"
                [class.hover:text-ink]="activeTab() !== 'return'"
                (click)="switchTab('return')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 inline-block ml-1"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
          برگشت
        </button>
      </div>

      @if (activeTab() === 'borrow') {
        <div class="card">
          <h2 class="font-display text-lg font-bold mb-5">امانت کتاب</h2>
          <form [formGroup]="borrowForm" (ngSubmit)="onBorrow()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-ink-light mb-1.5">کتاب</label>
              <select formControlName="bookId" class="input-field" (focus)="searchBooks()" (click)="searchBooks()">
                <option [ngValue]="null" disabled>انتخاب کتاب...</option>
                @for (book of books(); track book.id) {
                  <option [ngValue]="book.id">{{ book.title }} ({{ book.availableCopies }} نسخه موجود)</option>
                }
              </select>
              @if (borrowForm.get('bookId')?.invalid && borrowForm.get('bookId')?.touched) {
                <p class="text-danger text-xs mt-1">کتاب الزامی است</p>
              }
            </div>

            @if (canBorrowForOthers()) {
              <div>
                <label class="block text-sm font-medium text-ink-light mb-1.5">کاربر (اختیاری)</label>
                <select formControlName="userId" class="input-field" (focus)="loadUsers()" (click)="loadUsers()">
                  <option [ngValue]="null">خودم</option>
                  @for (user of users(); track user.id) {
                    <option [ngValue]="user.id">{{ user.username }} ({{ user.firstName }} {{ user.lastName }})</option>
                  }
                </select>
              </div>
            }

            <div class="flex gap-2 pt-2">
              <button type="submit"
                      class="btn btn-accent flex-1"
                      [disabled]="borrowForm.invalid || loading">
                @if (loading) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                }
                امانت
              </button>
              <a routerLink="/borrowings" class="btn btn-ghost">انصراف</a>
            </div>
          </form>
        </div>
      }

      @if (activeTab() === 'return') {
        <div class="card">
          <h2 class="font-display text-lg font-bold mb-5">برگشت کتاب</h2>
          <form [formGroup]="returnForm" (ngSubmit)="onReturn()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-ink-light mb-1.5">شناسه امانت</label>
              <input type="text" formControlName="borrowingId"
                     class="input-field" placeholder="شناسه امانت را وارد کنید..." />
              @if (returnForm.get('borrowingId')?.invalid && returnForm.get('borrowingId')?.touched) {
                <p class="text-danger text-xs mt-1">شناسه امانت الزامی است</p>
              }
            </div>

            <div class="flex gap-2 pt-2">
              <button type="submit"
                      class="btn btn-accent flex-1"
                      [disabled]="returnForm.invalid || loading">
                @if (loading) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                }
                برگشت کتاب
              </button>
              <a routerLink="/borrowings" class="btn btn-ghost">انصراف</a>
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
        this.toastService.show('کتاب با موفقیت امانت داده شد!', 'success');
        this.router.navigate(['/borrowings']);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.show(err?.error?.message ?? 'خطا در امانت کتاب', 'error');
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
        this.toastService.show('کتاب با موفقیت برگشت داده شد!', 'success');
        this.router.navigate(['/borrowings/all']);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.show(err?.error?.message ?? 'خطا در برگشت کتاب', 'error');
      },
    });
  }
}
