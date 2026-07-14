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
  styleUrl: './book-form.component.scss',
  template: `
    <div class="book-form">
      <!-- Header -->
      <div class="book-form__header">
        <a routerLink="/books" class="book-form__back">
          <svg class="book-form__back-icon"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          بازگشت به فهرست
        </a>
        <h1 class="book-form__title">{{ editMode ? 'ویرایش کتاب' : 'افزودن کتاب' }}</h1>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="book-form__loading">
          <div class="book-form__spinner"></div>
        </div>
      }

      <!-- Form -->
      @if (!loading()) {
        <div class="book-form__card">
          <form [formGroup]="bookForm" (ngSubmit)="onSubmit()" class="book-form__form">
            <!-- Title -->
            <div class="book-form__field">
              <label for="title" class="book-form__label">عنوان</label>
              <input
                id="title"
                type="text"
                formControlName="title"
                placeholder="عنوان کتاب"
                class="book-form__input"
                [ngClass]="{ 'book-form__input--error': bookForm.get('title')?.invalid && bookForm.get('title')?.touched }"
              />
              @if (bookForm.get('title')?.invalid && bookForm.get('title')?.touched) {
                <p class="book-form__error">عنوان الزامی است</p>
              }
            </div>

            <!-- Author -->
            <div class="book-form__field">
              <label for="author" class="book-form__label">نویسنده</label>
              <input
                id="author"
                type="text"
                formControlName="author"
                placeholder="نام نویسنده"
                class="book-form__input"
                [ngClass]="{ 'book-form__input--error': bookForm.get('author')?.invalid && bookForm.get('author')?.touched }"
              />
              @if (bookForm.get('author')?.invalid && bookForm.get('author')?.touched) {
                <p class="book-form__error">نویسنده الزامی است</p>
              }
            </div>

            <!-- ISBN -->
            <div class="book-form__field">
              <label for="isbn" class="book-form__label">شابک</label>
              <input
                id="isbn"
                type="text"
                formControlName="isbn"
                placeholder="شابک ۱۰ یا ۱۳ رقمی"
                class="book-form__input book-form__input--mono"
                [ngClass]="{ 'book-form__input--error': bookForm.get('isbn')?.invalid && bookForm.get('isbn')?.touched }"
              />
              @if (bookForm.get('isbn')?.invalid && bookForm.get('isbn')?.touched) {
                <p class="book-form__error">شابک الزامی است</p>
              }
            </div>

            <!-- Publisher + Publication Year -->
            <div class="book-form__row">
              <div class="book-form__field">
                <label for="publisher" class="book-form__label">ناشر</label>
                <input
                  id="publisher"
                  type="text"
                  formControlName="publisher"
                  placeholder="ناشر (اختیاری)"
                  class="book-form__input"
                />
              </div>
              <div class="book-form__field">
                <label for="publicationYear" class="book-form__label">سال</label>
                <input
                  id="publicationYear"
                  type="number"
                  formControlName="publicationYear"
                  placeholder="مثلاً ۲۰۲۵"
                  class="book-form__input"
                />
              </div>
            </div>

            <!-- Copies + Shelf -->
            <div class="book-form__row">
              <div class="book-form__field">
                <label for="copiesCount" class="book-form__label">تعداد نسخه</label>
                <input
                  id="copiesCount"
                  type="number"
                  formControlName="copiesCount"
                  min="1"
                  class="book-form__input"
                  [ngClass]="{ 'book-form__input--error': bookForm.get('copiesCount')?.invalid && bookForm.get('copiesCount')?.touched }"
                />
                @if (bookForm.get('copiesCount')?.invalid && bookForm.get('copiesCount')?.touched) {
                  <p class="book-form__error">حداقل ۱ نسخه الزامی است</p>
                }
              </div>
              <div class="book-form__field">
                <label for="shelfId" class="book-form__label">قفسه</label>
                <select
                  id="shelfId"
                  formControlName="shelfId"
                  class="book-form__input"
                  [ngClass]="{ 'book-form__input--error': bookForm.get('shelfId')?.invalid && bookForm.get('shelfId')?.touched }"
                >
                  <option [ngValue]="null" disabled selected>انتخاب قفسه</option>
                  @for (shelf of shelves(); track shelf.id) {
                    <option [ngValue]="shelf.id">{{ shelf.name }}</option>
                  }
                </select>
                @if (bookForm.get('shelfId')?.invalid && bookForm.get('shelfId')?.touched) {
                  <p class="book-form__error">قفسه الزامی است</p>
                }
              </div>
            </div>

            <!-- Actions -->
            <div class="book-form__actions">
              <button type="button" class="book-form__btn book-form__btn--ghost" routerLink="/books">
                انصراف
              </button>
              <button type="submit" class="book-form__btn book-form__btn--accent"
                      [disabled]="bookForm.invalid || saving()">
                @if (saving()) {
                  <span class="book-form__btn-spinner"></span>
                }
                {{ editMode ? 'بروزرسانی' : 'ایجاد' }}
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
          this.toastService.show('کتاب با موفقیت بروزرسانی شد!', 'success');
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
          this.toastService.show('کتاب با موفقیت ایجاد شد!', 'success');
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
