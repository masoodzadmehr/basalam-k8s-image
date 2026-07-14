import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { Book } from '../../../core/models';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [
    RouterModule,
  ],
  styleUrl: './book-detail.component.scss',
  template: `
    <div class="book-detail">
      <!-- Back -->
      <a routerLink="/books" class="book-detail__back">
        <svg class="book-detail__back-icon"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
        بازگشت به فهرست
      </a>

      <!-- Loading -->
      @if (loading()) {
        <div class="book-detail__loading">
          <div class="book-detail__spinner"></div>
        </div>
      }

      <!-- Book Detail -->
      @if (!loading() && book(); as b) {
        <div class="book-detail__card">
          <!-- Header with spine -->
          <div class="book-detail__header">
            <div class="book-detail__spine">
              <span class="book-detail__spine-text">
                {{ isbnLastFour(b.isbn) }}
              </span>
            </div>
            <div class="book-detail__header-body">
              <h1 class="book-detail__title">{{ b.title }}</h1>
              <p class="book-detail__author">{{ b.author }}</p>
            </div>
          </div>

          <hr class="book-detail__divider" />

          <!-- Metadata Grid -->
          <div class="book-detail__body">
            <dl class="book-detail__meta-grid">
              <div class="book-detail__meta-item">
                <dt class="book-detail__meta-label">شابک</dt>
                <dd class="book-detail__meta-value book-detail__meta-value--mono">{{ b.isbn }}</dd>
              </div>
              @if (b.publisher) {
                <div class="book-detail__meta-item">
                  <dt class="book-detail__meta-label">ناشر</dt>
                  <dd class="book-detail__meta-value">{{ b.publisher }}</dd>
                </div>
              }
              @if (b.publicationYear) {
                <div class="book-detail__meta-item">
                  <dt class="book-detail__meta-label">سال انتشار</dt>
                  <dd class="book-detail__meta-value">{{ b.publicationYear }}</dd>
                </div>
              }
              <div class="book-detail__meta-item">
                <dt class="book-detail__meta-label">تعداد نسخه</dt>
                <dd class="book-detail__meta-value">
                  {{ b.copiesCount }} نسخه
                  @if (b.availableCopies > 0) {
                    <span class="book-detail__available"> &mdash; {{ b.availableCopies }} موجود</span>
                  } @else {
                    <span class="book-detail__unavailable"> &mdash; ناموجود</span>
                  }
                </dd>
              </div>
            </dl>

            <!-- Actions -->
            <div class="book-detail__actions">
              @if (canBorrow()) {
                <button class="book-detail__btn book-detail__btn--accent" (click)="borrowBook()">
                  <svg class="book-detail__btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  امانت
                </button>
              }
              @if (canReserve()) {
                <button class="book-detail__btn book-detail__btn--secondary" (click)="reserveBook()">
                  <svg class="book-detail__btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  رزرو
                </button>
              }
              @if (canManageBooks()) {
                <button class="book-detail__btn book-detail__btn--secondary" (click)="editBook()">
                  <svg class="book-detail__btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  ویرایش
                </button>
              }
              @if (canDeleteBooks()) {
                <button class="book-detail__btn book-detail__btn--danger" (click)="showDeleteConfirm.set(true)">
                  <svg class="book-detail__btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  حذف
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Book Not Found -->
      @if (!loading() && !book()) {
        <div class="book-detail__not-found">
          <div class="book-detail__not-found-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3 class="book-detail__not-found-title">کتاب یافت نشد</h3>
          <p class="book-detail__not-found-text">کتاب مورد نظر وجود ندارد یا حذف شده است.</p>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm()) {
        <div class="book-detail__overlay" (click)="showDeleteConfirm.set(false)">
          <div class="book-detail__modal" (click)="$event.stopPropagation()">
            <h3 class="book-detail__modal-title">حذف کتاب</h3>
            <p class="book-detail__modal-text">
              آیا از حذف «{{ book()?.title }}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.
            </p>
            <div class="book-detail__modal-actions">
              <button class="book-detail__btn book-detail__btn--ghost" (click)="showDeleteConfirm.set(false)">
                انصراف
              </button>
              <button class="book-detail__btn book-detail__btn--accent" (click)="confirmDelete()">
                حذف
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class BookDetailComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  book = signal<Book | null>(null);
  loading = signal(true);
  showDeleteConfirm = signal(false);
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
        this.toastService.show('Failed to load book details', 'error');
      },
    });
  }

  borrowBook(): void {
    const b = this.book();
    if (!b) { return; }
    this.apiService.post('/borrowings', { bookId: b.id }).subscribe({
      next: () => {
        this.toastService.show('Book borrowed successfully!', 'success');
        this.loadBook(b.id);
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'Failed to borrow book', 'error');
      },
    });
  }

  reserveBook(): void {
    const b = this.book();
    if (!b) { return; }
    this.apiService.post('/reservations', { bookId: b.id }).subscribe({
      next: () => {
        this.toastService.show('Book reserved successfully!', 'success');
        this.loadBook(b.id);
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'Failed to reserve book', 'error');
      },
    });
  }

  editBook(): void {
    const b = this.book();
    if (b) {
      this.router.navigate(['/books', b.id, 'edit']);
    }
  }

  confirmDelete(): void {
    const b = this.book();
    if (!b) { return; }
    this.showDeleteConfirm.set(false);
    this.apiService.delete<void>(`/books/${b.id}`).subscribe({
      next: () => {
        this.toastService.show('Book deleted', 'success');
        this.router.navigate(['/books']);
      },
      error: (err) => {
        this.toastService.show(err?.error?.message ?? 'Failed to delete book', 'error');
      },
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

  isbnLastFour(isbn: string): string {
    const digits = (isbn || '').replace(/\D/g, '');
    return digits.slice(-4) || '----';
  }
}
