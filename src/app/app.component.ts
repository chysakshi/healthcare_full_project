import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected readonly navItems = [
    { label: 'Login', link: '/login' },
    { label: 'Patient Dashboard', link: '/patient/dashboard' },
    { label: 'Doctor Dashboard', link: '/doctor/dashboard' },
    { label: 'Admin Dashboard', link: '/admin/dashboard' }
  ];
}
