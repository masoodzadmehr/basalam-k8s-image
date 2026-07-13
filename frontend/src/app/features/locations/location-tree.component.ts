import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast.service';
import type { Location, User } from '../../core/models';

@Component({
  selector: 'app-location-tree',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink">Locations</h1>
          <p class="text-ink-muted text-sm mt-1">Physical library layout — halls, bookshelves, and shelves</p>
        </div>
        @if (canManageLocations()) {
          <button class="btn btn-accent btn-sm" (click)="openAddForm('HALL', null)">
            Add Hall
          </button>
        }
      </div>

      <!-- Add / Edit forms -->
      @if (showAddForm() || showEditForm()) {
        <div class="card !p-5 border-accent/20 bg-accent-subtle">
          <h3 class="font-display text-base font-bold text-ink mb-4">
            @if (showAddForm()) { Add {{ addFormType() }} }
            @if (showEditForm()) { Edit {{ editFormType() }} }
          </h3>
          <form [formGroup]="showAddForm() ? addForm : editForm"
                (ngSubmit)="showAddForm() ? onAddSubmit() : onEditSubmit()"
                class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-ink-light mb-1">Name</label>
              <input type="text" [formControlName]="'name'"
                     class="input-field" placeholder="Enter name" />
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-light mb-1">Description</label>
              <input type="text" [formControlName]="'description'"
                     class="input-field" placeholder="Enter description" />
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-light mb-1">Librarian (optional)</label>
              <select [formControlName]="'librarianUserId'" class="input-field">
                <option [ngValue]="null">None</option>
                @for (lib of librarians(); track lib.id) {
                  <option [ngValue]="lib.id">{{ lib.firstName }} {{ lib.lastName }}</option>
                }
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn btn-ghost btn-sm" (click)="cancelAdd(); cancelEdit()">Cancel</button>
              <button type="submit" class="btn btn-accent btn-sm"
                      [disabled]="(showAddForm() ? addForm : editForm).invalid || saving()">
                @if (saving()) { Saving... } @else { Save }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Delete Confirm Modal -->
      @if (showDeleteConfirm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm"
             (click)="cancelDelete()">
          <div class="card !p-6 max-w-sm w-full mx-4 shadow-xl" (click)="$event.stopPropagation()">
            <h3 class="font-display text-lg font-bold text-ink mb-2">
              Delete {{ deleteTarget()?.type }}
            </h3>
            <p class="text-sm text-ink-light mb-5 leading-relaxed">
              Are you sure you want to delete "{{ deleteTarget()?.name }}"? This cannot be undone.
            </p>
            <div class="flex justify-end gap-2">
              <button class="btn btn-ghost btn-sm" (click)="cancelDelete()">Cancel</button>
              <button class="btn btn-accent btn-sm" [disabled]="deleting()" (click)="confirmDelete()">
                @if (deleting()) { Deleting... } @else { Delete }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center py-16">
          <div class="animate-spin h-8 w-8 border-2 border-ink/15 border-t-ink rounded-full"></div>
        </div>
      }

      <!-- Tree -->
      @if (!loading()) {
        <div class="card !p-0 overflow-hidden">
          @for (hall of halls(); track hall.id) {
            <!-- Hall Level -->
            <div class="border-b border-border last:border-b-0">
              <div class="flex items-center gap-3 p-3 px-4 hover:bg-page transition-colors">
                <button class="w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink
                               transition-colors leading-none text-xs font-mono"
                        (click)="toggleHall(hall.id)">
                  {{ isHallExpanded(hall.id) ? '&#9660;' : '&#9654;' }}
                </button>
                <span class="text-base">&#x1F3E2;</span>
                <div class="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                  <span class="font-bold text-ink text-sm">{{ hall.name }}</span>
                  @if (hall.description) {
                    <span class="text-ink-muted text-xs">&mdash; {{ hall.description }}</span>
                  }
                  @if (getLibrarianName(hall.librarianUserId)) {
                    <span class="badge badge-info text-[0.625rem]">
                      {{ getLibrarianName(hall.librarianUserId) }}
                    </span>
                  }
                </div>
                @if (canManageLocations()) {
                  <div class="flex gap-0.5 flex-shrink-0">
                    <button class="w-7 h-7 flex items-center justify-center rounded
                                   text-ink-muted hover:text-ink hover:bg-page transition-colors text-xs font-bold"
                            (click)="openAddForm('BOOKSHELF', hall.id)" title="Add Bookshelf">+</button>
                    <button class="w-7 h-7 flex items-center justify-center rounded
                                   text-ink-muted hover:text-ink hover:bg-page transition-colors text-xs"
                            (click)="openEditForm(hall)" title="Edit Hall">&#x270E;</button>
                    <button class="w-7 h-7 flex items-center justify-center rounded
                                   text-ink-muted hover:text-danger hover:bg-danger-subtle transition-colors text-xs"
                            (click)="deleteLocation(hall)" title="Delete Hall">&#x1F5D1;</button>
                  </div>
                }
              </div>

              <!-- Bookshelf Level -->
              @if (isHallExpanded(hall.id)) {
                @for (bs of bookshelves.get(hall.id) || []; track bs.id) {
                  <div class="border-t border-border">
                    <div class="flex items-center gap-3 p-3 pr-4 mr-10 hover:bg-page transition-colors">
                      <button class="w-6 h-6 flex items-center justify-center text-ink-muted hover:text-ink
                                     transition-colors leading-none text-xs font-mono"
                              (click)="toggleBookshelf(bs.id)">
                        {{ isBookshelfExpanded(bs.id) ? '&#9660;' : '&#9654;' }}
                      </button>
                      <span class="text-base">&#x1F4DA;</span>
                      <div class="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                        <span class="font-medium text-ink text-sm">{{ bs.name }}</span>
                        @if (bs.description) {
                          <span class="text-ink-muted text-xs">&mdash; {{ bs.description }}</span>
                        }
                        @if (getLibrarianName(bs.librarianUserId)) {
                          <span class="badge badge-info text-[0.625rem]">
                            {{ getLibrarianName(bs.librarianUserId) }}
                          </span>
                        }
                      </div>
                      @if (canManageLocations()) {
                        <div class="flex gap-0.5 flex-shrink-0">
                          <button class="w-7 h-7 flex items-center justify-center rounded
                                         text-ink-muted hover:text-ink hover:bg-page transition-colors text-xs font-bold"
                                  (click)="openAddForm('SHELF', bs.id)" title="Add Shelf">+</button>
                          <button class="w-7 h-7 flex items-center justify-center rounded
                                         text-ink-muted hover:text-ink hover:bg-page transition-colors text-xs"
                                  (click)="openEditForm(bs)" title="Edit Bookshelf">&#x270E;</button>
                          <button class="w-7 h-7 flex items-center justify-center rounded
                                         text-ink-muted hover:text-danger hover:bg-danger-subtle transition-colors text-xs"
                                  (click)="deleteLocation(bs)" title="Delete Bookshelf">&#x1F5D1;</button>
                        </div>
                      }
                    </div>

                    <!-- Shelf Level -->
                    @if (isBookshelfExpanded(bs.id)) {
                      @for (shelf of shelves.get(bs.id) || []; track shelf.id) {
                        <div class="border-t border-border-light">
                          <div class="flex items-center gap-3 p-3 pr-4 mr-20 hover:bg-page transition-colors">
                            <span class="w-6"></span>
                            <span class="text-base">&#x1F4E6;</span>
                            <div class="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                              <span class="text-ink text-sm">{{ shelf.name }}</span>
                              @if (shelf.description) {
                                <span class="text-ink-muted text-xs">&mdash; {{ shelf.description }}</span>
                              }
                              @if (getLibrarianName(shelf.librarianUserId)) {
                                <span class="badge badge-info text-[0.625rem]">
                                  {{ getLibrarianName(shelf.librarianUserId) }}
                                </span>
                              }
                            </div>
                            @if (canManageLocations()) {
                              <div class="flex gap-0.5 flex-shrink-0">
                                <button class="w-7 h-7 flex items-center justify-center rounded
                                               text-ink-muted hover:text-ink hover:bg-page transition-colors text-xs"
                                        (click)="openEditForm(shelf)" title="Edit Shelf">&#x270E;</button>
                                <button class="w-7 h-7 flex items-center justify-center rounded
                                               text-ink-muted hover:text-danger hover:bg-danger-subtle transition-colors text-xs"
                                        (click)="deleteLocation(shelf)" title="Delete Shelf">&#x1F5D1;</button>
                              </div>
                            }
                          </div>
                        </div>
                      }
                      @if ((shelves.get(bs.id) || []).length === 0) {
                        <div class="mr-20 py-2 px-4 text-ink-muted text-xs">
                          No shelves in this bookshelf.
                        </div>
                      }
                    }
                  </div>
                }
                @if ((bookshelves.get(hall.id) || []).length === 0) {
                  <div class="mr-10 py-2 px-4 text-ink-muted text-xs">
                    No bookshelves in this hall.
                  </div>
                }
              }
            </div>
          }
          @if (halls().length === 0) {
            <div class="empty-state">
              <div class="empty-state-icon">&#x1F3E2;</div>
              <h3 class="empty-state-title">No locations yet</h3>
              <p class="empty-state-text">Add a hall to start organizing your physical library layout.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class LocationTreeComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

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

  showDeleteConfirm = signal(false);
  deleteTarget = signal<Location | null>(null);
  deleting = signal(false);

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
        this.toast.show(`${type} created successfully!`, 'success');
        this.loadLocations();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err?.error?.message ?? `Failed to create ${type}`, 'error');
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
        this.toast.show('Location updated!', 'success');
        this.loadLocations();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.show(err?.error?.message ?? 'Failed to update', 'error');
      },
    });
  }

  deleteLocation(location: Location): void {
    this.deleteTarget.set(location);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const location = this.deleteTarget();
    if (!location) { return; }
    this.deleting.set(true);

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
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
        this.deleteTarget.set(null);
        this.toast.show(`${location.type} deleted`, 'success');
        this.loadLocations();
        const expHalls = this.expandedHalls();
        const expBs = this.expandedBookshelves();
        expHalls.delete(location.id);
        expBs.delete(location.id);
        this.expandedHalls.set(new Set(expHalls));
        this.expandedBookshelves.set(new Set(expBs));
      },
      error: (err) => {
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
        this.deleteTarget.set(null);
        this.toast.show(err?.error?.message ?? 'Failed to delete', 'error');
      },
    });
  }
}
