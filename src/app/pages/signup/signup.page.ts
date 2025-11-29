import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.scss'
})
export class SignupPageComponent {
  protected isSubmitting = false;
  protected errorMessage = '';

  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, email, password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage = 'Password and confirm password must match.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.signup({
      fullName,
      email,
      password,
      role: 'patient'
    }).subscribe((result) => {
      this.isSubmitting = false;

      if (!result.success || !result.user) {
        this.errorMessage = result.message ?? 'Account creation failed. Please try again.';
        return;
      }

      void this.router.navigate(['/patient/dashboard']);
    });
  }
}
