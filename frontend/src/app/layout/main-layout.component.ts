import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-main-layout',
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    RouterModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly userRole = this.authService.userRole;

  protected readonly allNavItems: NavItem[] = [
    { label: 'Books', icon: 'menu_book', route: '/books' },
    { label: 'My Borrowings', icon: 'book', route: '/borrowings' },
    { label: 'My Reservations', icon: 'event_available', route: '/reservations' },
    { label: 'My Fines', icon: 'money_off', route: '/fines' },
    { label: 'Manage Books', icon: 'library_books', route: '/books/new', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'All Borrowings', icon: 'receipt_long', route: '/borrowings/all', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'Return Book', icon: 'assignment_return', route: '/borrowings/overdue', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'Fines', icon: 'gavel', route: '/fines/all', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'My Locations', icon: 'place', route: '/locations', roles: ['LIBRARIAN'] },
    { label: 'All Locations', icon: 'map', route: '/locations', roles: ['ADMIN'] },
    { label: 'Users', icon: 'people', route: '/users', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'Reservations', icon: 'event_note', route: '/reservations/all', roles: ['LIBRARIAN', 'ADMIN'] },
    { label: 'Role Management', icon: 'admin_panel_settings', route: '/admin/roles', roles: ['ADMIN'] },
    { label: 'System Config', icon: 'settings', route: '/admin/config', roles: ['ADMIN'] },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    { label: 'Profile', icon: 'person', route: '/profile' },
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

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
  }
}
