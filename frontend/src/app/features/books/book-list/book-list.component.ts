import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast.service';
import type { Book } from '../../../core/models';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
  ],
  styleUrl: './book-list.component.scss',
  template: `
    <div class="book-list">
      <!-- Header -->
      <div class="book-list__header">
        <div>
          <h1 class="book-list__title">کتاب‌ها</h1>
          <p class="book-list__subtitle">
            {{ totalElements() }} کتاب در فهرست
          </p>
        </div>
        @if (canManage()) {
          <a routerLink="/books/new" class="book-list__add-btn">
            <svg class="book-list__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            افزودن کتاب
          </a>
        }
      </div>

      <!-- Search -->
      <div class="book-list__search-wrapper">
        <input
          type="text"
          [formControl]="searchControl"
          placeholder="جستجو بر اساس عنوان، نویسنده یا شابک..."
          class="book-list__search-input"
        />
        <div class="book-list__search-icon">
          <svg class="book-list__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="book-list__loading">
          <div class="book-list__spinner"></div>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && books().length === 0) {
        <div class="book-list__empty">
          <div class="book-list__empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3 class="book-list__empty-title">کتابی یافت نشد</h3>
          <p class="book-list__empty-text">
            @if (searchControl.value) {
              نتیجه‌ای برای «{{ searchControl.value }}» یافت نشد. عبارت دیگری جستجو کنید.
            } @else {
              فهرست کتاب‌ها خالی است. اولین کتاب را اضافه کنید.
            }
          </p>
        </div>
      }

      <!-- Book Grid -->
      @if (!loading() && books().length > 0) {
        <div class="book-list__grid">
          @for (book of books(); track book.id) {
            <div
              class="book-list__card"
              (click)="onRowClick(book)"
            >
              <div class="book-list__card-inner">
                <!-- Call number spine -->
                <div class="book-list__spine-wrapper">
                  <div class="book-list__spine"
                       [style.background]="spineColors[spineColorIndex(book.id)]">
                    <span class="book-list__spine-text">
                      {{ isbnLastFour(book.isbn) }}
                    </span>
                  </div>
                </div>

                <!-- Book info -->
                <div class="book-list__card-body">
                  <h3 class="book-list__card-title">
                    {{ book.title }}
                  </h3>
                  <p class="book-list__card-author">{{ book.author }}</p>

                  <div class="book-list__card-meta">
                    <span>شابک {{ book.isbn }}</span>
                    @if (book.publisher || book.publicationYear) {
                      <span>&middot;</span>
                      <span>
                        @if (book.publisher) { {{ book.publisher }} }
                        @if (book.publicationYear) { {{ book.publicationYear }} }
                      </span>
                    }
                  </div>

                  <!-- Availability -->
                  <div class="book-list__availability">
                    @if (book.availableCopies > 0) {
                      <div class="book-list__status book-list__status--available">
                        <span class="book-list__dot book-list__dot--success"></span>
                        <span class="book-list__status-text book-list__status-text--success">
                          {{ book.availableCopies }} موجود
                        </span>
                      </div>
                    } @else {
                      <div class="book-list__status book-list__status--unavailable">
                        <span class="book-list__dot book-list__dot--danger"></span>
                        <span class="book-list__status-text book-list__status-text--danger">
                          ناموجود
                        </span>
                      </div>
                    }
                    <span class="book-list__total-copies">
                      / {{ book.copiesCount }} کل
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="book-list__pagination">
            <button
              class="book-list__page-btn"
              [disabled]="pageIndex === 0"
              (click)="prevPage()"
            >
              <svg class="book-list__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              قبلی
            </button>
            <span class="book-list__page-info">
              {{ pageIndex + 1 }} از {{ totalPages() }}
            </span>
            <button
              class="book-list__page-btn"
              [disabled]="(pageIndex + 1) >= totalPages()"
              (click)="nextPage()"
            >
              بعدی
              <svg class="book-list__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class BookListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  books = signal<Book[]>([]);
  totalElements = signal(0);
  loading = signal(false);
  userRole = this.authService.userRole;

  searchControl = new FormControl('');

  pageIndex = 0;
  pageSize = 10;

  spineColors = ['#2C5282', '#1A365D', '#3A6BA5', '#4A7DB5', '#1E4D8C', '#0D3B6F'];

  ngOnInit(): void {
    this.loadBooks();
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadBooks();
      });
  }

  loadBooks(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.pageIndex),
      size: String(this.pageSize),
    };
    const search = this.searchControl.value?.trim();
    if (search) {
      params['search'] = search;
    }
    this.apiService.get<{ content: Book[]; totalElements: number }>('/books', params).subscribe({
      next: (res) => {
        this.books.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.books.set([]);
        this.loading.set(false);
        this.toastService.show('Failed to load books', 'error');
      },
    });
  }

  totalPages(): number {
    return Math.ceil(this.totalElements() / this.pageSize);
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.loadBooks();
    }
  }

  nextPage(): void {
    if ((this.pageIndex + 1) < this.totalPages()) {
      this.pageIndex++;
      this.loadBooks();
    }
  }

  onRowClick(book: Book): void {
    this.router.navigate(['/books', book.id]);
  }

  canManage(): boolean {
    const role = this.userRole();
    return role === 'LIBRARIAN' || role === 'ADMIN';
  }

  spineColorIndex(bookId: number): number {
    return Math.abs(bookId * 31 + 7) % this.spineColors.length;
  }

  isbnLastFour(isbn: string): string {
    const digits = (isbn || '').replace(/\D/g, '');
    return digits.slice(-4) || '----';
  }
}
