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
  styleUrl: './location-tree.component.scss',
  template: `
    <div class="locations">
      <div class="locations__toolbar">
        <div>
          <h1 class="locations__title">&#x200F;&#x645;&#x6A9;&#x627;&#x646;&#x200C;&#x647;&#x627;</h1>
          <p class="locations__subtitle">&#x200F;&#x686;&#x6CC;&#x62F;&#x645;&#x627;&#x646; &#x641;&#x6CC;&#x632;&#x6CC;&#x6A9;&#x6CC; &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647; &mdash; &#x62A;&#x627;&#x644;&#x627;&#x631;&#x647;&#x627;&#x60C; &#x642;&#x641;&#x633;&#x647;&#x200C;&#x647;&#x627; &#x648; &#x637;&#x628;&#x642;&#x627;&#x62A;</p>
        </div>
        @if (canManageLocations()) {
          <button class="locations__add-btn" (click)="openAddForm('HALL', null)">
            <svg class="locations__add-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            &#x200F;&#x627;&#x641;&#x632;&#x648;&#x62F;&#x646; &#x62A;&#x627;&#x644;&#x627;&#x631;
          </button>
        }
      </div>

      <!-- Add / Edit forms -->
      @if (showAddForm() || showEditForm()) {
        <div class="locations__form-card">
          <h3 class="locations__form-title">
            @if (showAddForm()) {
              @if (addFormType() === 'HALL') {
                &#x200F;&#x627;&#x641;&#x632;&#x648;&#x62F;&#x646; &#x62A;&#x627;&#x644;&#x627;&#x631;
              } @else if (addFormType() === 'BOOKSHELF') {
                &#x200F;&#x627;&#x641;&#x632;&#x648;&#x62F;&#x646; &#x642;&#x641;&#x633;&#x647;
              } @else {
                &#x200F;&#x627;&#x641;&#x632;&#x648;&#x62F;&#x646; &#x637;&#x628;&#x642;&#x647;
              }
            }
            @if (showEditForm()) {
              @if (editFormType() === 'HALL') {
                &#x200F;&#x648;&#x6CC;&#x631;&#x627;&#x6CC;&#x634; &#x62A;&#x627;&#x644;&#x627;&#x631;
              } @else if (editFormType() === 'BOOKSHELF') {
                &#x200F;&#x648;&#x6CC;&#x631;&#x627;&#x6CC;&#x634; &#x642;&#x641;&#x633;&#x647;
              } @else {
                &#x200F;&#x648;&#x6CC;&#x631;&#x627;&#x6CC;&#x634; &#x637;&#x628;&#x642;&#x647;
              }
            }
          </h3>
          <form [formGroup]="showAddForm() ? addForm : editForm"
                (ngSubmit)="showAddForm() ? onAddSubmit() : onEditSubmit()"
                class="locations__form">
            <div class="locations__field">
              <label class="locations__label">&#x200F;&#x646;&#x627;&#x645;</label>
              <input type="text" [formControlName]="'name'"
                     class="locations__input" placeholder="&#x646;&#x627;&#x645; &#x631;&#x627; &#x648;&#x627;&#x631;&#x62F; &#x6A9;&#x646;&#x6CC;&#x62F;" />
            </div>
            <div class="locations__field">
              <label class="locations__label">&#x200F;&#x62A;&#x648;&#x636;&#x6CC;&#x62D;&#x627;&#x62A;</label>
              <input type="text" [formControlName]="'description'"
                     class="locations__input" placeholder="&#x62A;&#x648;&#x636;&#x6CC;&#x62D;&#x627;&#x62A; &#x631;&#x627; &#x648;&#x627;&#x631;&#x62F; &#x6A9;&#x646;&#x6CC;&#x62F;" />
            </div>
            <div class="locations__field">
              <label class="locations__label">&#x200F;&#x6A9;&#x62A;&#x627;&#x628;&#x62F;&#x627;&#x631; (&#x627;&#x62E;&#x62A;&#x6CC;&#x627;&#x631;&#x6CC;)</label>
              <select [formControlName]="'librarianUserId'" class="locations__input">
                <option [ngValue]="null">&#x200F;&#x647;&#x6CC;&#x686;&#x6A9;&#x62F;&#x627;&#x645;</option>
                @for (lib of librarians(); track lib.id) {
                  <option [ngValue]="lib.id">{{ lib.firstName }} {{ lib.lastName }}</option>
                }
              </select>
            </div>
            <div class="locations__form-actions">
              <button type="button" class="locations__btn locations__btn--ghost" (click)="cancelAdd(); cancelEdit()">&#x200F;&#x627;&#x646;&#x635;&#x631;&#x627;&#x641;</button>
              <button type="submit" class="locations__btn locations__btn--primary"
                      [disabled]="(showAddForm() ? addForm : editForm).invalid || saving()">
                @if (saving()) {
                  &#x200F;&#x62F;&#x631; &#x62D;&#x627;&#x644; &#x630;&#x62E;&#x6CC;&#x631;&#x647;...
                } @else {
                  &#x200F;&#x630;&#x62E;&#x6CC;&#x631;&#x647;
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Delete Confirm Modal -->
      @if (showDeleteConfirm()) {
        <div class="locations__modal" (click)="cancelDelete()">
          <div class="locations__modal-card" (click)="$event.stopPropagation()">
            <h3 class="locations__modal-title">
              &#x200F;&#x62D;&#x630;&#x641;
              @if (deleteTarget()?.type === 'HALL') {
                &#x62A;&#x627;&#x644;&#x627;&#x631;
              } @else if (deleteTarget()?.type === 'BOOKSHELF') {
                &#x642;&#x641;&#x633;&#x647;
              } @else {
                &#x637;&#x628;&#x642;&#x647;
              }
            </h3>
            <p class="locations__modal-text">
              &#x200F;&#x622;&#x6CC;&#x627; &#x627;&#x632; &#x62D;&#x630;&#x641; &#xAB;{{ deleteTarget()?.name }}&#xBB; &#x627;&#x637;&#x645;&#x6CC;&#x646;&#x627;&#x646; &#x62F;&#x627;&#x631;&#x6CC;&#x62F;&#x61F; &#x627;&#x6CC;&#x646; &#x639;&#x645;&#x644;&#x6CC;&#x627;&#x62A; &#x642;&#x627;&#x628;&#x644; &#x628;&#x627;&#x632;&#x6AF;&#x634;&#x62A; &#x646;&#x6CC;&#x633;&#x62A;.
            </p>
            <div class="locations__modal-actions">
              <button class="locations__btn locations__btn--ghost" (click)="cancelDelete()">&#x200F;&#x627;&#x646;&#x635;&#x631;&#x627;&#x641;</button>
              <button class="locations__btn locations__btn--danger" [disabled]="deleting()" (click)="confirmDelete()">
                @if (deleting()) {
                  &#x200F;&#x62F;&#x631; &#x62D;&#x627;&#x644; &#x62D;&#x630;&#x641;...
                } @else {
                  &#x200F;&#x62D;&#x630;&#x641;
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="locations__loading">
          <div class="locations__spinner"></div>
        </div>
      }

      <!-- Tree -->
      @if (!loading()) {
        <div class="locations__tree">
          @for (hall of halls(); track hall.id) {
            <div class="locations__hall">
              <!-- Hall Row -->
              <div class="locations__row locations__row--hall">
                <button class="locations__toggle"
                        (click)="toggleHall(hall.id)">
                  @if (isHallExpanded(hall.id)) {
                    <svg class="locations__toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  } @else {
                    <svg class="locations__toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  }
                </button>
                <span class="locations__node-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                    <path d="M9 9v.01"/>
                    <path d="M9 12v.01"/>
                    <path d="M9 15v.01"/>
                    <path d="M9 18v.01"/>
                  </svg>
                </span>
                <div class="locations__node-body">
                  <span class="locations__node-name">{{ hall.name }}</span>
                  @if (hall.description) {
                    <span class="locations__node-desc">&mdash; {{ hall.description }}</span>
                  }
                  @if (getLibrarianName(hall.librarianUserId)) {
                    <span class="locations__node-badge">
                      {{ getLibrarianName(hall.librarianUserId) }}
                    </span>
                  }
                </div>
                @if (canManageLocations()) {
                  <div class="locations__node-actions">
                    <button class="locations__action-btn" (click)="openAddForm('BOOKSHELF', hall.id)" title="&#x627;&#x641;&#x632;&#x648;&#x62F;&#x646; &#x642;&#x641;&#x633;&#x647;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <button class="locations__action-btn" (click)="openEditForm(hall)" title="&#x648;&#x6CC;&#x631;&#x627;&#x6CC;&#x634; &#x62A;&#x627;&#x644;&#x627;&#x631;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="locations__action-btn locations__action-btn--danger" (click)="deleteLocation(hall)" title="&#x62D;&#x630;&#x641; &#x62A;&#x627;&#x644;&#x627;&#x631;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>

              <!-- Bookshelf Level -->
              @if (isHallExpanded(hall.id)) {
                <div class="locations__children">
                  @for (bs of bookshelves.get(hall.id) || []; track bs.id) {
                    <div class="locations__bookshelf">
                      <div class="locations__row locations__row--bookshelf">
                        <button class="locations__toggle"
                                (click)="toggleBookshelf(bs.id)">
                          @if (isBookshelfExpanded(bs.id)) {
                            <svg class="locations__toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          } @else {
                            <svg class="locations__toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          }
                        </button>
                        <span class="locations__node-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            <line x1="8" y1="7" x2="16" y2="7"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                          </svg>
                        </span>
                        <div class="locations__node-body">
                          <span class="locations__node-name">{{ bs.name }}</span>
                          @if (bs.description) {
                            <span class="locations__node-desc">&mdash; {{ bs.description }}</span>
                          }
                          @if (getLibrarianName(bs.librarianUserId)) {
                            <span class="locations__node-badge">
                              {{ getLibrarianName(bs.librarianUserId) }}
                            </span>
                          }
                        </div>
                        @if (canManageLocations()) {
                          <div class="locations__node-actions">
                            <button class="locations__action-btn" (click)="openAddForm('SHELF', bs.id)" title="&#x627;&#x641;&#x632;&#x648;&#x62F;&#x646; &#x637;&#x628;&#x642;&#x647;">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                            </button>
                            <button class="locations__action-btn" (click)="openEditForm(bs)" title="&#x648;&#x6CC;&#x631;&#x627;&#x6CC;&#x634; &#x642;&#x641;&#x633;&#x647;">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button class="locations__action-btn locations__action-btn--danger" (click)="deleteLocation(bs)" title="&#x62D;&#x630;&#x641; &#x642;&#x641;&#x633;&#x647;">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>
                        }
                      </div>

                      <!-- Shelf Level -->
                      @if (isBookshelfExpanded(bs.id)) {
                        <div class="locations__shelves">
                          @for (shelf of shelves.get(bs.id) || []; track shelf.id) {
                            <div class="locations__row locations__row--shelf">
                              <span class="locations__toggle locations__toggle--spacer"></span>
                              <span class="locations__node-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                                </svg>
                              </span>
                              <div class="locations__node-body">
                                <span class="locations__node-name">{{ shelf.name }}</span>
                                @if (shelf.description) {
                                  <span class="locations__node-desc">&mdash; {{ shelf.description }}</span>
                                }
                                @if (getLibrarianName(shelf.librarianUserId)) {
                                  <span class="locations__node-badge">
                                    {{ getLibrarianName(shelf.librarianUserId) }}
                                  </span>
                                }
                              </div>
                              @if (canManageLocations()) {
                                <div class="locations__node-actions">
                                  <button class="locations__action-btn" (click)="openEditForm(shelf)" title="&#x648;&#x6CC;&#x631;&#x627;&#x6CC;&#x634; &#x637;&#x628;&#x642;&#x647;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                  </button>
                                  <button class="locations__action-btn locations__action-btn--danger" (click)="deleteLocation(shelf)" title="&#x62D;&#x630;&#x641; &#x637;&#x628;&#x642;&#x647;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                  </button>
                                </div>
                              }
                            </div>
                          }
                          @if ((shelves.get(bs.id) || []).length === 0) {
                            <div class="locations__empty-children">
                              &#x200F;&#x637;&#x628;&#x642;&#x647;&#x200C;&#x627;&#x6CC; &#x62F;&#x631; &#x627;&#x6CC;&#x646; &#x642;&#x641;&#x633;&#x647; &#x646;&#x6CC;&#x633;&#x62A;.
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                  @if ((bookshelves.get(hall.id) || []).length === 0) {
                    <div class="locations__empty-children">
                      &#x200F;&#x642;&#x641;&#x633;&#x647;&#x200C;&#x627;&#x6CC; &#x62F;&#x631; &#x627;&#x6CC;&#x646; &#x62A;&#x627;&#x644;&#x627;&#x631; &#x646;&#x6CC;&#x633;&#x62A;.
                    </div>
                  }
                </div>
              }
            </div>
          }
          @if (halls().length === 0) {
            <div class="locations__global-empty">
              <div class="locations__global-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18"/>
                  <path d="M5 21V7l8-4v18"/>
                  <path d="M19 21V11l-6-4"/>
                  <path d="M9 9v.01"/>
                  <path d="M9 12v.01"/>
                  <path d="M9 15v.01"/>
                  <path d="M9 18v.01"/>
                </svg>
              </div>
              <h3 class="locations__global-empty-title">&#x200F;&#x647;&#x646;&#x648;&#x632; &#x645;&#x6A9;&#x627;&#x646;&#x6CC; &#x62B;&#x628;&#x62A; &#x646;&#x634;&#x62F;&#x647;</h3>
              <p class="locations__global-empty-text">&#x200F;&#x628;&#x631;&#x627;&#x6CC; &#x634;&#x631;&#x648;&#x639; &#x686;&#x6CC;&#x62F;&#x645;&#x627;&#x646; &#x6A9;&#x62A;&#x627;&#x628;&#x62E;&#x627;&#x646;&#x647;&#x60C; &#x6CC;&#x6A9; &#x62A;&#x627;&#x644;&#x627;&#x631; &#x627;&#x636;&#x627;&#x641;&#x647; &#x6A9;&#x646;&#x6CC;&#x62F;.</p>
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
        this.toast.show(`&#x628;&#x627; &#x645;&#x648;&#x641;&#x642;&#x6CC;&#x62A; &#x627;&#x6CC;&#x62C;&#x627;&#x62F; &#x634;&#x62F;!`, 'success');
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
        this.toast.show('&#x628;&#x631;&#x648;&#x632;&#x631;&#x633;&#x627;&#x646;&#x6CC; &#x634;&#x62F;!', 'success');
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
        this.toast.show('&#x62D;&#x630;&#x641; &#x634;&#x62F;', 'success');
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
