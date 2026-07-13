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
        <h1 class="font-display text-2xl text-ink">Books</h1>
        @if (canManage()) {
          <a routerLink="/books/new" class="btn btn-primary inline-flex items-center gap-2 self-start">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Book
          </a>
        }
      </div>

      <!-- Search -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          [formControl]="searchControl"
          placeholder="Search by title, author, or ISBN..."
          class="input-field pl-10 w-full"
        />
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-wood"></div>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && books().length === 0) {
        <div class="card text-center py-12 text-slate-light">
          No books found.
        </div>
      }

      <!-- Book Grid -->
      @if (!loading() && books().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (book of books(); track book.id) {
            <div
              class="bg-white rounded-xl shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow p-5 space-y-3"
              [style.border-left-color]="shelfColors[bookColorIndices.get(book.id) ?? 0]"
              (click)="onRowClick(book)"
            >
              <!-- Title -->
              <h3 class="font-display text-lg text-ink leading-snug">{{ book.title }}</h3>

              <!-- Author -->
              <p class="text-sm text-slate-light">by {{ book.author }}</p>

              <!-- ISBN -->
              <p class="text-xs text-slate-light font-mono">ISBN: {{ book.isbn }}</p>

              <!-- Publisher & Year -->
              @if (book.publisher || book.publicationYear) {
                <p class="text-xs text-slate-light">
                  @if (book.publisher) { {{ book.publisher }} }
                  @if (book.publisher && book.publicationYear) { &middot; }
                  @if (book.publicationYear) { {{ book.publicationYear }} }
                </p>
              }

              <!-- Available Copies Badge -->
              <div>
                @if (book.availableCopies > 0) {
                  <span class="badge badge-available">{{ book.availableCopies }} available</span>
                } @else {
                  <span class="badge badge-borrowed">Unavailable</span>
                }
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-center gap-4 py-4">
          <button
            class="btn btn-secondary btn-sm"
            [disabled]="pageIndex === 0"
            (click)="prevPage()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <span class="text-sm text-slate-light">
            Page {{ pageIndex + 1 }} of {{ totalPages() || 1 }}
          </span>
          <button
            class="btn btn-secondary btn-sm"
            [disabled]="(pageIndex + 1) >= totalPages()"
            (click)="nextPage()"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
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

  shelfColors = ['#C8963E', '#5C4033', '#2D6A4F', '#B23B3B', '#3D4047', '#7B5F4F'];
  readonly bookColorIndices = new Map<number, number>();

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
        for (const book of res.content) {
          if (!this.bookColorIndices.has(book.id)) {
            this.bookColorIndices.set(book.id, Math.floor(Math.random() * this.shelfColors.length));
          }
        }
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
}
