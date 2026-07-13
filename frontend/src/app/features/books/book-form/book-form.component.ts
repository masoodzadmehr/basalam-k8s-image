import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/toast.service';
import type { Book, Location } from '../../../core/models';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    NgClass,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/books" class="btn btn-secondary btn-sm inline-flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>
        <h1 class="font-display text-2xl text-ink">{{ editMode ? 'Edit Book' : 'Add Book' }}</h1>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-wood"></div>
        </div>
      }

      <!-- Form -->
      @if (!loading()) {
        <div class="card p-6">
          <form [formGroup]="bookForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Title -->
            <div>
              <label for="title" class="block text-sm font-medium text-ink mb-1">Title</label>
              <input
                id="title"
                type="text"
                formControlName="title"
                placeholder="Book title"
                class="input-field w-full"
                [ngClass]="{ 'border-danger': bookForm.get('title')?.invalid && bookForm.get('title')?.touched }"
              />
              @if (bookForm.get('title')?.invalid && bookForm.get('title')?.touched) {
                <p class="text-danger text-xs mt-1">Title is required</p>
              }
            </div>

            <!-- Author -->
            <div>
              <label for="author" class="block text-sm font-medium text-ink mb-1">Author</label>
              <input
                id="author"
                type="text"
                formControlName="author"
                placeholder="Author name"
                class="input-field w-full"
                [ngClass]="{ 'border-danger': bookForm.get('author')?.invalid && bookForm.get('author')?.touched }"
              />
              @if (bookForm.get('author')?.invalid && bookForm.get('author')?.touched) {
                <p class="text-danger text-xs mt-1">Author is required</p>
              }
            </div>

            <!-- ISBN -->
            <div>
              <label for="isbn" class="block text-sm font-medium text-ink mb-1">ISBN</label>
              <input
                id="isbn"
                type="text"
                formControlName="isbn"
                placeholder="ISBN-10 or ISBN-13"
                class="input-field w-full"
                [ngClass]="{ 'border-danger': bookForm.get('isbn')?.invalid && bookForm.get('isbn')?.touched }"
              />
              @if (bookForm.get('isbn')?.invalid && bookForm.get('isbn')?.touched) {
                <p class="text-danger text-xs mt-1">ISBN is required</p>
              }
            </div>

            <!-- Publisher -->
            <div>
              <label for="publisher" class="block text-sm font-medium text-ink mb-1">Publisher</label>
              <input
                id="publisher"
                type="text"
                formControlName="publisher"
                placeholder="Publisher (optional)"
                class="input-field w-full"
              />
            </div>

            <!-- Publication Year -->
            <div>
              <label for="publicationYear" class="block text-sm font-medium text-ink mb-1">Publication Year</label>
              <input
                id="publicationYear"
                type="number"
                formControlName="publicationYear"
                placeholder="e.g. 2025"
                class="input-field w-full"
              />
            </div>

            <!-- Copies Count -->
            <div>
              <label for="copiesCount" class="block text-sm font-medium text-ink mb-1">Copies Count</label>
              <input
                id="copiesCount"
                type="number"
                formControlName="copiesCount"
                min="1"
                class="input-field w-full"
                [ngClass]="{ 'border-danger': bookForm.get('copiesCount')?.invalid && bookForm.get('copiesCount')?.touched }"
              />
              @if (bookForm.get('copiesCount')?.invalid && bookForm.get('copiesCount')?.touched) {
                <p class="text-danger text-xs mt-1">At least 1 copy required</p>
              }
            </div>

            <!-- Shelf Location -->
            <div>
              <label for="shelfId" class="block text-sm font-medium text-ink mb-1">Shelf Location</label>
              <select
                id="shelfId"
                formControlName="shelfId"
                class="input-field w-full appearance-none bg-white"
                [ngClass]="{ 'border-danger': bookForm.get('shelfId')?.invalid && bookForm.get('shelfId')?.touched }"
              >
                <option [ngValue]="null" disabled selected>Select a shelf</option>
                @for (shelf of shelves(); track shelf.id) {
                  <option [ngValue]="shelf.id">{{ shelf.name }}</option>
                }
              </select>
              @if (bookForm.get('shelfId')?.invalid && bookForm.get('shelfId')?.touched) {
                <p class="text-danger text-xs mt-1">Shelf is required</p>
              }
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-wood-light">
              <button type="button" class="btn btn-secondary" routerLink="/books">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="bookForm.invalid || saving()">
                @if (saving()) {
                  <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 align-middle"></span>
                }
                {{ editMode ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
})
export class BookFormComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  editMode = false;
  bookId: number | null = null;
  loading = signal(false);
  saving = signal(false);
  shelves = signal<Location[]>([]);

  bookForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    author: ['', [Validators.required, Validators.maxLength(255)]],
    isbn: ['', [Validators.required, Validators.maxLength(20)]],
    publisher: ['', Validators.maxLength(255)],
    publicationYear: [null],
    copiesCount: [1, [Validators.required, Validators.min(1)]],
    shelfId: [null, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadShelves();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editMode = true;
      this.bookId = Number(idParam);
      this.bookForm.get('isbn')?.disable();
      this.loadBook(this.bookId);
    }
  }

  loadShelves(): void {
    this.apiService.get<Location[]>('/shelves').subscribe({
      next: (shelves) => this.shelves.set(shelves),
      error: () => this.toastService.show('Failed to load shelves', 'error'),
    });
  }

  loadBook(id: number): void {
    this.loading.set(true);
    this.apiService.get<Book>(`/books/${id}`).subscribe({
      next: (book) => {
        this.bookForm.patchValue({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          publisher: book.publisher ?? '',
          publicationYear: book.publicationYear ?? null,
          copiesCount: book.copiesCount,
          shelfId: book.shelfId,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.show('Failed to load book', 'error');
      },
    });
  }

  onSubmit(): void {
    if (this.bookForm.invalid) {
      return;
    }
    this.saving.set(true);
    const formValue = { ...this.bookForm.getRawValue() };
    if (formValue.publicationYear === '' || formValue.publicationYear === null) {
      formValue.publicationYear = null;
    }

    if (this.editMode && this.bookId) {
      this.apiService.put<Book>(`/books/${this.bookId}`, formValue).subscribe({
        next: () => {
          this.saving.set(false);
          this.toastService.show('Book updated successfully!', 'success');
          this.router.navigate(['/books', this.bookId]);
        },
        error: (err) => {
          this.saving.set(false);
          this.toastService.show(err?.error?.message ?? 'Failed to update book', 'error');
        },
      });
    } else {
      this.apiService.post<Book>('/books', formValue).subscribe({
        next: (book) => {
          this.saving.set(false);
          this.toastService.show('Book created successfully!', 'success');
          this.router.navigate(['/books', book.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.toastService.show(err?.error?.message ?? 'Failed to create book', 'error');
        },
      });
    }
  }
}
