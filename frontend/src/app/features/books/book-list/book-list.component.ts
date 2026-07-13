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
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink">Books</h1>
          <p class="text-ink-muted text-sm mt-1">
            {{ totalElements() }} book{{ totalElements() !== 1 ? 's' : '' }} in the catalog
          </p>
        </div>
        @if (canManage()) {
          <a routerLink="/books/new" class="btn btn-primary self-start">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Book
          </a>
        }
      </div>

      <!-- Search -->
      <div class="relative">
        <input
          type="text"
          [formControl]="searchControl"
          placeholder="Search by title, author, or ISBN..."
          class="input-field !pr-9"
        />
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-ink-muted">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-ink/15 border-t-ink"></div>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && books().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">&#x1F4DA;</div>
          <h3 class="empty-state-title">No books found</h3>
          <p class="empty-state-text">
            @if (searchControl.value) {
              No results for "{{ searchControl.value }}". Try a different search term.
            } @else {
              The catalog is empty. Add your first book to get started.
            }
          </p>
        </div>
      }

      <!-- Book Grid -->
      @if (!loading() && books().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (book of books(); track book.id) {
            <div
              class="card !p-0 cursor-pointer group transition-shadow duration-150 hover:shadow-md"
              (click)="onRowClick(book)"
            >
              <div class="flex">
                <!-- Call number spine -->
                <div class="flex-shrink-0 w-12 flex items-stretch">
                  <div class="w-full rounded-r-md flex items-center justify-center text-white text-[0.625rem]
                              font-mono font-semibold tracking-widest leading-tight p-1"
                       [style.background]="spineColors[spineColorIndex(book.id)]">
                    <span class="[writing-mode:vertical-rl] rotate-180">
                      {{ isbnLastFour(book.isbn) }}
                    </span>
                  </div>
                </div>

                <!-- Book info -->
                <div class="flex-1 p-4 min-w-0">
                  <h3 class="font-display text-lg font-bold text-ink leading-snug mb-1
                             group-hover:text-accent transition-colors duration-150">
                    {{ book.title }}
                  </h3>
                  <p class="text-sm text-ink-light mb-3">{{ book.author }}</p>

                  <div class="flex items-center gap-2 text-[0.6875rem] text-ink-muted font-mono mb-3">
                    <span>ISBN {{ book.isbn }}</span>
                    @if (book.publisher || book.publicationYear) {
                      <span>&middot;</span>
                      <span>
                        @if (book.publisher) { {{ book.publisher }} }
                        @if (book.publicationYear) { {{ book.publicationYear }} }
                      </span>
                    }
                  </div>

                  <!-- Availability -->
                  <div class="flex items-center gap-2">
                    @if (book.availableCopies > 0) {
                      <div class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
                        <span class="text-xs text-success font-medium">{{ book.availableCopies }} available</span>
                      </div>
                    } @else {
                      <div class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-danger"></span>
                        <span class="text-xs text-danger font-medium">Unavailable</span>
                      </div>
                    }
                    <span class="text-xs text-ink-muted">
                      / {{ book.copiesCount }} total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 py-2">
            <button
              class="btn btn-ghost btn-sm"
              [disabled]="pageIndex === 0"
              (click)="prevPage()"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Prev
            </button>
            <span class="text-sm text-ink-muted tabular-nums">
              {{ pageIndex + 1 }} of {{ totalPages() }}
            </span>
            <button
              class="btn btn-ghost btn-sm"
              [disabled]="(pageIndex + 1) >= totalPages()"
              (click)="nextPage()"
            >
              Next
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
