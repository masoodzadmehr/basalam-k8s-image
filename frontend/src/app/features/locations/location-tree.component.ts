import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog.component';
import type { Location, User } from '../../core/models';

@Component({
  selector: 'app-location-tree',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  templateUrl: './location-tree.component.html',
  styleUrls: ['./location-tree.component.scss'],
})
export class LocationTreeComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  userRole = this.authService.userRole;
  loading = signal(true);

  halls = signal<Location[]>([]);
  bookshelves = new Map<number, Location[]>();
  shelves = new Map<number, Location[]>();
  librarians = signal<User[]>([]);

  expandedHalls = signal<Set<number>>(new Set());
  expandedBookshelves = signal<Set<number>>(new Set());

  showAddForm = signal(false);
  addFormType = signal<'HALL' | 'BOOKSHELF' | 'SHELF'>('HALL');
  addFormParentId = signal<number | null>(null);
  saving = signal(false);

  addForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    librarianUserId: [null],
  });

  showEditForm = signal(false);
  editFormId = signal<number | null>(null);
  editFormType = signal<'HALL' | 'BOOKSHELF' | 'SHELF'>('HALL');

  editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    librarianUserId: [null],
  });

  ngOnInit(): void {
    this.loadLocations();
    this.loadLibrarians();
  }

  loadLocations(): void {
    this.loading.set(true);
    this.apiService.get<Location[]>('/halls').subscribe({
      next: (halls) => {
        this.halls.set(halls);
        halls.forEach(hall => this.loadBookshelves(hall.id));
        if (halls.length === 0) {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  loadBookshelves(hallId: number): void {
    this.apiService.get<Location[]>(`/halls/${hallId}/bookshelves`).subscribe({
      next: (bshelves) => {
        this.bookshelves.set(hallId, bshelves);
        bshelves.forEach(bs => this.loadShelves(bs.id));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadShelves(bookshelfId: number): void {
    this.apiService.get<Location[]>(`/bookshelves/${bookshelfId}/shelves`).subscribe({
      next: (s) => this.shelves.set(bookshelfId, s),
    });
  }

  loadLibrarians(): void {
    this.apiService.get<{ content: User[] }>('/users', { page: '0', size: '200' }).subscribe({
      next: (res) => {
        this.librarians.set(res.content.filter(u => u.role === 'LIBRARIAN'));
      },
    });
  }

  toggleHall(hallId: number): void {
    const exp = this.expandedHalls();
    const next = new Set(exp);
    if (next.has(hallId)) { next.delete(hallId); } else { next.add(hallId); }
    this.expandedHalls.set(next);
  }

  toggleBookshelf(bsId: number): void {
    const exp = this.expandedBookshelves();
    const next = new Set(exp);
    if (next.has(bsId)) { next.delete(bsId); } else { next.add(bsId); }
    this.expandedBookshelves.set(next);
  }

  isHallExpanded(hallId: number): boolean {
    return this.expandedHalls().has(hallId);
  }

  isBookshelfExpanded(bsId: number): boolean {
    return this.expandedBookshelves().has(bsId);
  }

  canManageLocations(): boolean {
    return this.userRole() === 'ADMIN';
  }

  getLibrarianName(userId?: number): string {
    if (!userId) { return ''; }
    const lib = this.librarians().find(u => u.id === userId);
    return lib ? `${lib.firstName} ${lib.lastName}` : '';
  }

  openAddForm(type: 'HALL' | 'BOOKSHELF' | 'SHELF', parentId: number | null): void {
    this.addFormType.set(type);
    this.addFormParentId.set(parentId);
    this.addForm.reset({ name: '', description: '', librarianUserId: null });
    this.showAddForm.set(true);
    this.showEditForm.set(false);
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
  }

  onAddSubmit(): void {
    if (this.addForm.invalid) { return; }
    this.saving.set(true);
    const body = { ...this.addForm.value };
    const type = this.addFormType();
    const parentId = this.addFormParentId();

    let endpoint = '';
    if (type === 'HALL') {
      endpoint = '/halls';
    } else if (type === 'BOOKSHELF' && parentId) {
      endpoint = `/halls/${parentId}/bookshelves`;
    } else if (type === 'SHELF' && parentId) {
      endpoint = `/bookshelves/${parentId}/shelves`;
    }

    this.apiService.post<Location>(endpoint, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.showAddForm.set(false);
        this.snackBar.open(`${type} created successfully!`, 'Close', { duration: 3000 });
        this.loadLocations();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.message ?? `Failed to create ${type}`, 'Close', { duration: 5000 });
      },
    });
  }

  openEditForm(location: Location): void {
    this.editFormId.set(location.id);
    this.editFormType.set(location.type);
    this.editForm.patchValue({
      name: location.name,
      description: location.description ?? '',
      librarianUserId: location.librarianUserId ?? null,
    });
    this.showEditForm.set(true);
    this.showAddForm.set(false);
  }

  cancelEdit(): void {
    this.showEditForm.set(false);
  }

  onEditSubmit(): void {
    if (this.editForm.invalid) { return; }
    this.saving.set(true);
    const body = { ...this.editForm.value };
    const id = this.editFormId();
    const type = this.editFormType();
    let endpoint = '';
    if (type === 'HALL') {
      endpoint = `/halls/${id}`;
    } else if (type === 'BOOKSHELF') {
      endpoint = `/bookshelves/${id}`;
    } else {
      endpoint = `/shelves/${id}`;
    }

    this.apiService.put<Location>(endpoint, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.showEditForm.set(false);
        this.snackBar.open('Location updated!', 'Close', { duration: 3000 });
        this.loadLocations();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.message ?? 'Failed to update', 'Close', { duration: 5000 });
      },
    });
  }

  deleteLocation(location: Location): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: `Delete ${location.type}`,
        message: `Are you sure you want to delete "${location.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) { return; }
      let endpoint = '';
      if (location.type === 'HALL') {
        endpoint = `/halls/${location.id}`;
      } else if (location.type === 'BOOKSHELF') {
        endpoint = `/bookshelves/${location.id}`;
      } else {
        endpoint = `/shelves/${location.id}`;
      }
      this.apiService.delete<void>(endpoint).subscribe({
        next: () => {
          this.snackBar.open(`${location.type} deleted`, 'Close', { duration: 3000 });
          this.loadLocations();
          const expHalls = this.expandedHalls();
          const expBs = this.expandedBookshelves();
          expHalls.delete(location.id);
          expBs.delete(location.id);
          this.expandedHalls.set(new Set(expHalls));
          this.expandedBookshelves.set(new Set(expBs));
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message ?? 'Failed to delete', 'Close', { duration: 5000 });
        },
      });
    });
  }
}
