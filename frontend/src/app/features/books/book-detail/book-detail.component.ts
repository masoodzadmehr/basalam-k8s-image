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
    <div class="space-y-6">
      <!-- Back button & Title -->
      <div class="flex items-center gap-4">
        <a routerLink="/books" class="btn btn-secondary btn-sm inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>
        <h1 class="font-display text-2xl text-ink">
          @if (book(); as b) { {{ b.title }} }
        </h1>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-wood"></div>
        </div>
      }

      <!-- Book Detail -->
      @if (!loading() && book(); as b) {
        <div class="card p-6 space-y-6">
          <!-- Metadata Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span class="block text-sm text-slate-light font-medium">Author</span>
              <span class="text-ink">{{ b.author }}</span>
            </div>
            <div>
              <span class="block text-sm text-slate-light font-medium">ISBN</span>
              <span class="text-ink font-mono">{{ b.isbn }}</span>
            </div>
            @if (b.publisher) {
              <div>
                <span class="block text-sm text-slate-light font-medium">Publisher</span>
                <span class="text-ink">{{ b.publisher }}</span>
              </div>
            }
            @if (b.publicationYear) {
              <div>
                <span class="block text-sm text-slate-light font-medium">Publication Year</span>
                <span class="text-ink">{{ b.publicationYear }}</span>
              </div>
            }
            <div>
              <span class="block text-sm text-slate-light font-medium">Total Copies</span>
              <span class="text-ink">{{ b.copiesCount }}</span>
            </div>
            <div>
              <span class="block text-sm text-slate-light font-medium">Available Copies</span>
              @if (b.availableCopies > 0) {
                <span class="badge badge-available ml-1">{{ b.availableCopies }} / {{ b.copiesCount }}</span>
              } @else {
                <span class="badge badge-overdue ml-1">{{ b.availableCopies }} / {{ b.copiesCount }}</span>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-3 pt-4 border-t border-wood-light">
            @if (canBorrow()) {
              <button class="btn btn-primary" (click)="borrowBook()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Borrow
              </button>
            }
            @if (canReserve()) {
              <button class="btn btn-secondary" (click)="reserveBook()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Reserve
              </button>
            }
            @if (canManageBooks()) {
              <button class="btn btn-secondary" (click)="editBook()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            }
            @if (canDeleteBooks()) {
              <button class="btn btn-danger" (click)="showDeleteConfirm.set(true)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            }
          </div>
        </div>
      }

      <!-- Book Not Found -->
      @if (!loading() && !book()) {
        <div class="card text-center py-12 text-slate-light">
          Book not found.
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="showDeleteConfirm.set(false)">
          <div class="bg-paper rounded-xl shadow-xl p-6 max-w-md mx-4 space-y-4" (click)="$event.stopPropagation()">
            <h3 class="font-display text-lg text-ink">Delete Book</h3>
            <p class="text-slate">Are you sure you want to delete "{{ book()?.title }}"?</p>
            <div class="flex justify-end gap-3">
              <button class="btn btn-secondary" (click)="showDeleteConfirm.set(false)">Cancel</button>
              <button class="btn btn-danger" (click)="confirmDelete()">Delete</button>
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
}
