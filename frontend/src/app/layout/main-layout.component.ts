import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
    label: string;
    icon: string;
    route: string;
    roles?: string[];
}

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterModule, NgClass],
    styleUrl: './main-layout.component.scss',
    template: `
    <!-- Mobile sidebar overlay -->
    @if (sidebarOpen) {
    <div class="sidebar-overlay" (click)="closeSidebar()">
        <div class="sidebar-overlay-bg"></div>
    </div>
    }

    <div class="layout-root">
        <!-- Sidebar -->
        <aside
            class="sidebar"
            [class.sidebar--open]="sidebarOpen"
            [class.sidebar--collapsed]="sidebarCollapsed()"
        >
            <!-- Sidebar header -->
            <div class="sidebar-header">
                <div class="sidebar-brand">
                    <div class="sidebar-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke-linecap="round"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke-linecap="round"/>
                            <line x1="8" y1="7" x2="16" y2="7" stroke-linecap="round"/>
                            <line x1="8" y1="11" x2="14" y2="11" stroke-linecap="round"/>
                        </svg>
                    </div>
                    @if (!sidebarCollapsed()) {
                    <div class="sidebar-brand-text">
                        <div class="sidebar-brand-name">کتابخانه</div>
                        <div class="sidebar-brand-sub">سامانه مدیریت</div>
                    </div>
                    }
                </div>
            </div>

            <!-- Navigation -->
            <nav class="sidebar-nav">
                @for (item of filteredNavItems; track item.label) {
                <a
                    [routerLink]="[item.route]"
                    (click)="closeSidebar()"
                    class="nav-item"
                    [ngClass]="{ 'nav-item--active': isActive(item.route) }"
                    [attr.title]="sidebarCollapsed() ? item.label : null"
                >
                    <span class="nav-item-icon">
                        @switch (item.icon) {
                            @case ('books') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                <line x1="8" y1="7" x2="16" y2="7"/>
                                <line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                            }
                            @case ('borrowings') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                            }
                            @case ('reservations') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            }
                            @case ('fines') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"/>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                            }
                            @case ('notifications') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                            }
                            @case ('profile') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            }
                            @case ('manage-books') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            }
                            @case ('all-borrowings') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                                <rect x="9" y="3" width="6" height="4" rx="1"/>
                                <path d="M9 14l2 2 4-4"/>
                            </svg>
                            }
                            @case ('return-book') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="9 10 4 15 9 20"/>
                                <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
                            </svg>
                            }
                            @case ('all-reservations') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            }
                            @case ('locations') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            }
                            @case ('users') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            }
                            @case ('role-management') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                            }
                            @case ('system-config') {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                            }
                            @default {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                            </svg>
                            }
                        }
                    </span>
                    @if (!sidebarCollapsed()) {
                    <span class="nav-item-label">{{ item.label }}</span>
                    }
                </a>
                }
            </nav>

            <!-- Sidebar footer -->
            <div class="sidebar-footer">
                <div class="sidebar-footer-role">
                    <span class="sidebar-footer-dot"></span>
                    @if (!sidebarCollapsed()) {
                    <span>{{ userRole() || 'کاربر' }}</span>
                    }
                </div>
            </div>
        </aside>

        <!-- Main content area -->
        <div class="main-area">
            <!-- Top bar -->
            <header class="topbar">
                <div class="topbar-left">
                    <!-- Mobile hamburger -->
                    <button
                        class="topbar-btn topbar-hamburger"
                        (click)="toggleSidebar()"
                        aria-label="باز کردن منو"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <line x1="3" y1="12" x2="21" y2="12"/>
                            <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                    </button>

                    <!-- Desktop collapse toggle -->
                    <button
                        class="topbar-btn topbar-collapse"
                        (click)="toggleSidebarCollapse()"
                        aria-label="بستن نوار کناری"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="3" x2="9" y2="21"/>
                        </svg>
                    </button>

                    <h1 class="topbar-title">سامانه مدیریت کتابخانه</h1>
                </div>

                <div class="topbar-right">
                    <!-- Search -->
                    <div class="topbar-search">
                        <svg class="topbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            type="text"
                            class="topbar-search-input"
                            placeholder="جستجو..."
                        />
                    </div>

                    <!-- Notifications -->
                    <button
                        class="topbar-btn topbar-notif-btn"
                        (click)="navigateTo('/notifications')"
                        aria-label="اعلان‌ها"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        @if (unreadNotifications > 0) {
                        <span class="topbar-notif-badge">
                            {{ unreadNotifications > 99 ? '+99' : unreadNotifications }}
                        </span>
                        }
                    </button>

                    <!-- User menu -->
                    <div class="user-menu-wrapper">
                        <button
                            class="user-menu-trigger"
                            (click)="toggleUserMenu()"
                            aria-label="منوی کاربری"
                        >
                            <div class="user-avatar">
                                <span class="user-avatar-text">{{ userInitials() }}</span>
                            </div>
                            <span class="user-menu-name">{{ userName() }}</span>
                            <svg class="user-menu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>

                        @if (userMenuOpen) {
                        <div class="user-dropdown">
                            <button
                                class="user-dropdown-item"
                                (click)="navigateTo('/profile'); userMenuOpen = false"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span>پروفایل</span>
                            </button>
                            <div class="user-dropdown-divider"></div>
                            <button
                                class="user-dropdown-item user-dropdown-item--logout"
                                (click)="logout()"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                    <polyline points="16 17 21 12 16 7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                                <span>خروج</span>
                            </button>
                        </div>
                        }

                        <!-- Click-away backdrop -->
                        @if (userMenuOpen) {
                        <div class="user-dropdown-backdrop" (click)="userMenuOpen = false"></div>
                        }
                    </div>
                </div>
            </header>

            <!-- Page content -->
            <main class="main-content">
                <div class="main-content-inner">
                    <router-outlet></router-outlet>
                </div>
            </main>

            <!-- Footer -->
            <footer class="main-footer">
                <span>&copy; ۱۴۰۵ سامانه مدیریت کتابخانه</span>
                <span class="main-footer-version">نسخه ۱.۰</span>
            </footer>
        </div>
    </div>
  `,
})
export class MainLayoutComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly userRole = this.authService.userRole;
    protected sidebarOpen = false;
    protected sidebarCollapsed = signal(false);
    protected userMenuOpen = false;

    protected readonly allNavItems: NavItem[] = [
        { label: 'کتاب‌ها', icon: 'books', route: '/books' },
        { label: 'امانت‌های من', icon: 'borrowings', route: '/borrowings' },
        { label: 'رزروهای من', icon: 'reservations', route: '/reservations' },
        { label: 'جریمه‌های من', icon: 'fines', route: '/fines' },
        { label: 'اعلان‌ها', icon: 'notifications', route: '/notifications' },
        { label: 'پروفایل', icon: 'profile', route: '/profile' },
        { label: 'مدیریت کتاب‌ها', icon: 'manage-books', route: '/books', roles: ['LIBRARIAN', 'ADMIN'] },
        { label: 'تمام امانت‌ها', icon: 'all-borrowings', route: '/borrowings/all', roles: ['LIBRARIAN', 'ADMIN'] },
        { label: 'بازگشت کتاب', icon: 'return-book', route: '/borrowings/overdue', roles: ['LIBRARIAN', 'ADMIN'] },
        { label: 'تمام رزروها', icon: 'all-reservations', route: '/reservations/all', roles: ['LIBRARIAN', 'ADMIN'] },
        { label: 'مکان‌ها', icon: 'locations', route: '/locations', roles: ['LIBRARIAN', 'ADMIN'] },
        { label: 'کاربران', icon: 'users', route: '/users', roles: ['LIBRARIAN', 'ADMIN'] },
        { label: 'مدیریت نقش‌ها', icon: 'role-management', route: '/admin/roles', roles: ['ADMIN'] },
        { label: 'تنظیمات سیستم', icon: 'system-config', route: '/admin/config', roles: ['ADMIN'] },
    ];

    get filteredNavItems(): NavItem[] {
        const role = this.userRole();
        return this.allNavItems.filter(
            item => !item.roles || item.roles.includes(role),
        );
    }

    get unreadNotifications(): number {
        return 0;
    }

    userName(): string {
        const user = this.authService.currentUser();
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user?.username || 'کاربر';
    }

    userInitials(): string {
        const user = this.authService.currentUser();
        if (user?.firstName && user?.lastName) {
            return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
        }
        if (user?.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return '?';
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    toggleSidebarCollapse(): void {
        this.sidebarCollapsed.update(v => !v);
    }

    isActive(route: string): boolean {
        return this.router.url === route || this.router.url.startsWith(route + '/');
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
        this.sidebarOpen = false;
    }

    toggleUserMenu(): void {
        this.userMenuOpen = !this.userMenuOpen;
    }

    logout(): void {
        this.userMenuOpen = false;
        this.authService.logout();
    }
}
