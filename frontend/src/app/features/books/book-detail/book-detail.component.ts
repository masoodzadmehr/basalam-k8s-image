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
  template: `
    <div class="max-w-3xl space-y-6">
      <!-- Back -->
      <a routerLink="/books" class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors group">
        <svg class="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to catalog
      </a>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-ink/15 border-t-ink"></div>
        </div>
      }

      <!-- Book Detail -->
      @if (!loading() && book(); as b) {
        <div class="card !p-0 overflow-hidden">
          <!-- Header with spine -->
          <div class="flex items-start gap-0">
            <div class="flex-shrink-0 w-16 self-stretch bg-spine flex items-center justify-center">
              <span class="text-white font-mono text-xs font-semibold tracking-widest
                           [writing-mode:vertical-rl] rotate-180 leading-tight p-2">
                {{ isbnLastFour(b.isbn) }}
              </span>
            </div>
            <div class="flex-1 p-6 min-w-0">
              <h1 class="font-display text-2xl font-extrabold text-ink leading-snug mb-1">{{ b.title }}</h1>
              <p class="text-ink-light text-sm">{{ b.author }}</p>
            </div>
          </div>

          <hr class="divider" />

          <!-- Metadata Grid -->
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt class="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">ISBN</dt>
                <dd class="text-sm text-ink font-mono">{{ b.isbn }}</dd>
              </div>
              @if (b.publisher) {
                <div>
                  <dt class="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">Publisher</dt>
                  <dd class="text-sm text-ink">{{ b.publisher }}</dd>
                </div>
              }
              @if (b.publicationYear) {
                <div>
                  <dt class="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">Publication Year</dt>
                  <dd class="text-sm text-ink">{{ b.publicationYear }}</dd>
                </div>
              }
              <div>
                <dt class="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">Copies</dt>
                <dd class="text-sm text-ink">
                  {{ b.copiesCount }} total
                  @if (b.availableCopies > 0) {
                    <span class="text-success font-medium"> &mdash; {{ b.availableCopies }} available</span>
                  } @else {
                    <span class="text-danger font-medium"> &mdash; none available</span>
                  }
                </dd>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border">
              @if (canBorrow()) {
                <button class="btn btn-accent" (click)="borrowBook()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  Borrow
                </button>
              }
              @if (canReserve()) {
                <button class="btn btn-secondary" (click)="reserveBook()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Reserve
                </button>
              }
              @if (canManageBooks()) {
                <button class="btn btn-secondary" (click)="editBook()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit
                </button>
              }
              @if (canDeleteBooks()) {
                <button class="btn btn-ghost !text-danger hover:!bg-danger-subtle" (click)="showDeleteConfirm.set(true)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Delete
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Book Not Found -->
      @if (!loading() && !book()) {
        <div class="empty-state">
          <div class="empty-state-icon">&#x1F50D;</div>
          <h3 class="empty-state-title">Book not found</h3>
          <p class="empty-state-text">The book you're looking for doesn't exist or has been removed.</p>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm"
             (click)="showDeleteConfirm.set(false)">
          <div class="card !p-6 max-w-sm mx-4 space-y-4 shadow-xl" (click)="$event.stopPropagation()">
            <h3 class="font-display text-lg font-bold text-ink">Delete Book</h3>
            <p class="text-sm text-ink-light leading-relaxed">
              Are you sure you want to delete "{{ book()?.title }}"? This action cannot be undone.
            </p>
            <div class="flex justify-end gap-2 pt-2">
              <button class="btn btn-ghost" (click)="showDeleteConfirm.set(false)">Cancel</button>
              <button class="btn btn-accent" (click)="confirmDelete()">Delete</button>
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
