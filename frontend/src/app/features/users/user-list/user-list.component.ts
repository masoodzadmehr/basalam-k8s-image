import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import type { User } from '../../../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgClass],
  styleUrl: './user-list.component.scss',
  template: `
    <div class="user-list">
      <h1 class="user-list__title">&#x200F;&#x6A9;&#x627;&#x631;&#x628;&#x631;&#x627;&#x646;</h1>

      @if (loading()) {
        <div class="user-list__loading">
          <div class="user-list__spinner"></div>
        </div>
      } @else if (users().length === 0) {
        <div class="user-list__empty">
          <div class="user-list__empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 class="user-list__empty-title">&#x200F;&#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC; &#x6CC;&#x627;&#x641;&#x62A; &#x646;&#x634;&#x62F;</h3>
        </div>
      } @else {
        <div class="user-list__table-wrapper">
          <table class="user-list__table">
            <thead>
              <tr>
                <th>&#x200F;&#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC;</th>
                <th>&#x200F;&#x646;&#x627;&#x645;</th>
                <th>&#x200F;&#x646;&#x627;&#x645; &#x62E;&#x627;&#x646;&#x648;&#x627;&#x62F;&#x6AF;&#x6CC;</th>
                <th>&#x200F;&#x627;&#x6CC;&#x645;&#x6CC;&#x644;</th>
                <th>&#x200F;&#x646;&#x642;&#x634;</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="user-list__row"
                    (click)="selectedUser.set(selectedUser()?.id === user.id ? null : user)">
                  <td>{{ user.username }}</td>
                  <td>{{ user.firstName }}</td>
                  <td>{{ user.lastName }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="user-list__badge"
                          [ngClass]="{
                            'user-list__badge--admin': user.role === 'ADMIN',
                            'user-list__badge--librarian': user.role === 'LIBRARIAN',
                            'user-list__badge--user': user.role === 'USER'
                          }">
                      {{ user.role === 'ADMIN' ? '&#x645;&#x62F;&#x6CC;&#x631;' : user.role === 'LIBRARIAN' ? '&#x6A9;&#x62A;&#x627;&#x628;&#x62F;&#x627;&#x631;' : '&#x6A9;&#x627;&#x631;&#x628;&#x631;' }}
                    </span>
                  </td>
                  <td class="user-list__expand-icon-cell">
                    <svg class="user-list__expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Expanded user details -->
          @if (selectedUser(); as u) {
            <div class="user-list__details">
              <div class="user-list__details-grid">
                <div class="user-list__detail-item">
                  <span class="user-list__detail-label">&#x200F;&#x646;&#x627;&#x645; &#x6A9;&#x627;&#x631;&#x628;&#x631;&#x6CC;</span>
                  <p class="user-list__detail-value user-list__detail-value--bold">{{ u.username }}</p>
                </div>
                <div class="user-list__detail-item">
                  <span class="user-list__detail-label">&#x200F;&#x627;&#x6CC;&#x645;&#x6CC;&#x644;</span>
                  <p class="user-list__detail-value">{{ u.email }}</p>
                </div>
                <div class="user-list__detail-item">
                  <span class="user-list__detail-label">&#x200F;&#x645;&#x648;&#x628;&#x627;&#x6CC;&#x644;</span>
                  <p class="user-list__detail-value">{{ u.mobile ?? '&#x646;&#x62F;&#x627;&#x631;&#x62F;' }}</p>
                </div>
                <div class="user-list__detail-item">
                  <span class="user-list__detail-label">&#x200F;&#x646;&#x627;&#x645; &#x6A9;&#x627;&#x645;&#x644;</span>
                  <p class="user-list__detail-value">{{ u.firstName }} {{ u.lastName }}</p>
                </div>
                <div class="user-list__detail-item">
                  <span class="user-list__detail-label">&#x200F;&#x646;&#x642;&#x634;</span>
                  <p class="user-list__detail-value">
                    <span class="user-list__badge"
                          [ngClass]="{
                            'user-list__badge--admin': u.role === 'ADMIN',
                            'user-list__badge--librarian': u.role === 'LIBRARIAN',
                            'user-list__badge--user': u.role === 'USER'
                          }">
                      {{ u.role === 'ADMIN' ? '&#x645;&#x62F;&#x6CC;&#x631;' : u.role === 'LIBRARIAN' ? '&#x6A9;&#x62A;&#x627;&#x628;&#x62F;&#x627;&#x631;' : '&#x6A9;&#x627;&#x631;&#x628;&#x631;' }}
                    </span>
                  </p>
                </div>
                <div class="user-list__detail-item">
                  <span class="user-list__detail-label">&#x200F;&#x648;&#x636;&#x639;&#x6CC;&#x62A;</span>
                  <p class="user-list__detail-value"
                     [ngClass]="u.enabled ? 'user-list__status--active' : 'user-list__status--disabled'">
                    {{ u.enabled ? '&#x641;&#x639;&#x627;&#x644;' : '&#x63A;&#x6CC;&#x631;&#x641;&#x639;&#x627;&#x644;' }}
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Pagination -->
          <div class="user-list__pagination">
            <div class="user-list__pagination-info">
              {{ pageIndex * pageSize + 1 }}&ndash;{{ ((pageIndex + 1) * pageSize > totalElements() ? totalElements() : (pageIndex + 1) * pageSize) }}
              &#x627;&#x632; {{ totalElements() }}
            </div>
            <div class="user-list__pagination-controls">
              <select class="user-list__page-size"
                      [value]="pageSize"
                      (change)="onPageSizeChange($any($event.target).value)">
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="50">50</option>
              </select>
              <span class="user-list__per-page">&#x62F;&#x631; &#x635;&#x641;&#x62D;&#x647;</span>
              <div class="user-list__pagination-buttons">
                <button class="user-list__page-btn" [disabled]="pageIndex === 0" (click)="goToPage(0)">&#x627;&#x648;&#x644;&#x6CC;&#x646;</button>
                <button class="user-list__page-btn" [disabled]="pageIndex === 0" (click)="goToPage(pageIndex - 1)">&#x642;&#x628;&#x644;&#x6CC;</button>
                <span class="user-list__page-num">{{ pageIndex + 1 }} / {{ totalPages() || 1 }}</span>
                <button class="user-list__page-btn" [disabled]="(pageIndex + 1) * pageSize >= totalElements()" (click)="goToPage(pageIndex + 1)">&#x628;&#x639;&#x62F;&#x6CC;</button>
                <button class="user-list__page-btn" [disabled]="(pageIndex + 1) * pageSize >= totalElements()" (click)="goToPage(totalPages() - 1)">&#x622;&#x62E;&#x631;&#x6CC;&#x646;</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class UserListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  users = signal<User[]>([]);
  totalElements = signal(0);
  loading = signal(true);
  selectedUser = signal<User | null>(null);

  pageIndex = 0;
  pageSize = 10;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    const params: Record<string, string> = {
      page: String(this.pageIndex),
      size: String(this.pageSize),
    };
    this.apiService.get<{ content: User[]; totalElements: number }>('/users', params).subscribe({
      next: (res) => {
        this.users.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  totalPages(): number {
    return Math.ceil(this.totalElements() / this.pageSize) || 1;
  }

  goToPage(page: number): void {
    this.pageIndex = Math.max(0, Math.min(page, this.totalPages() - 1));
    this.selectedUser.set(null);
    this.loadUsers();
  }

  onPageSizeChange(size: string): void {
    this.pageSize = Number(size);
    this.pageIndex = 0;
    this.selectedUser.set(null);
    this.loadUsers();
  }
}
