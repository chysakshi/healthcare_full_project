import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly currentUser$ = this.authService.currentUser$;

  protected readonly navItems = [
    { label: 'Login', link: '/login' },
    { label: 'Signup', link: '/signup' },
    { label: 'Patient Dashboard', link: '/patient/dashboard' },
    { label: 'Doctor Dashboard', link: '/doctor/dashboard' },
    { label: 'Admin Dashboard', link: '/admin/dashboard' }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
