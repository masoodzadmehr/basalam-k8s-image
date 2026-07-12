import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import type { Book, Location } from '../../../core/models';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss'],
})
export class BookFormComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

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
      error: () => this.snackBar.open('Failed to load shelves', 'Close', { duration: 5000 }),
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
        this.snackBar.open('Failed to load book', 'Close', { duration: 5000 });
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
          this.snackBar.open('Book updated successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/books', this.bookId]);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err?.error?.message ?? 'Failed to update book', 'Close', { duration: 5000 });
        },
      });
    } else {
      this.apiService.post<Book>('/books', formValue).subscribe({
        next: (book) => {
          this.saving.set(false);
          this.snackBar.open('Book created successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/books', book.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(err?.error?.message ?? 'Failed to create book', 'Close', { duration: 5000 });
        },
      });
    }
  }
}
