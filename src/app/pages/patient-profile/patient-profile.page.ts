import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Appointment, EncounterNote, Invoice, MedicalReport, Prescription, User } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

@Component({
  selector: 'app-patient-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './patient-profile.page.html',
  styleUrl: './patient-profile.page.scss'
})
export class PatientProfilePageComponent implements OnInit {
  protected currentUser: User | null = null;
  protected saveMessage = '';
  protected saveError = '';

  protected totalAppointments = 0;
  protected completedAppointments = 0;
  protected activePrescriptions = 0;
  protected readyReports = 0;
  protected pendingReports = 0;
  protected pendingInvoices = 0;
  protected outstandingAmount = 0;
  protected encounterNotesCount = 0;

  protected readonly recentPrescriptions: Prescription[] = [];
  protected readonly recentReports: MedicalReport[] = [];
  protected readonly recentInvoices: Invoice[] = [];
  protected readonly recentAppointments: Appointment[] = [];
  protected readonly recentEncounterNotes: EncounterNote[] = [];

  protected readonly profileForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    bloodGroup: ['', [Validators.required]],
    emergencyContact: ['', [Validators.required, Validators.minLength(10)]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly healthcareDataService: HealthcareDataService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user) {
      return;
    }

    this.currentUser = user;
    this.profileForm.patchValue({
      fullName: user.fullName,
      phone: user.phone ?? '',
      bloodGroup: user.bloodGroup ?? '',
      emergencyContact: user.emergencyContact ?? ''
    });

    this.loadMedicalSummary(user.id);
  }

  protected saveProfile(): void {
    if (!this.currentUser) {
      this.saveError = 'Profile is unavailable for update.';
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.getRawValue();
    const updated = this.healthcareDataService.updateUser(this.currentUser.id, {
      fullName: formValue.fullName.trim(),
      phone: formValue.phone.trim(),
      bloodGroup: formValue.bloodGroup,
      emergencyContact: formValue.emergencyContact.trim()
    });

    if (!updated) {
      this.saveError = 'Unable to save profile changes.';
      return;
    }

    this.currentUser = updated;
    this.authService.setCurrentUser(updated);
    this.saveError = '';
    this.saveMessage = 'Profile updated successfully.';
  }

  private loadMedicalSummary(patientId: string): void {
    this.healthcareDataService.getAppointmentsForPatient(patientId).subscribe((appointments) => {
      this.totalAppointments = appointments.length;
      this.completedAppointments = appointments.filter((appointment) => appointment.status === 'completed').length;
      this.recentAppointments.splice(
        0,
        this.recentAppointments.length,
        ...appointments
          .slice()
          .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime())
          .slice(0, 4)
      );
    });

    this.healthcareDataService.getPrescriptionsForPatient(patientId).subscribe((prescriptions) => {
      this.activePrescriptions = prescriptions.length;
      this.recentPrescriptions.splice(
        0,
        this.recentPrescriptions.length,
        ...prescriptions
          .slice()
          .sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
          .slice(0, 4)
      );
    });

    this.healthcareDataService.getReportsForPatient(patientId).subscribe((reports) => {
      this.readyReports = reports.filter((report) => report.status === 'ready').length;
      this.pendingReports = reports.filter((report) => report.status === 'pending').length;
      this.recentReports.splice(
        0,
        this.recentReports.length,
        ...reports
          .slice()
          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
          .slice(0, 4)
      );
    });

    this.healthcareDataService.getInvoicesForPatient(patientId).subscribe((invoices) => {
      this.pendingInvoices = invoices.filter((invoice) => invoice.status !== 'paid').length;
      this.outstandingAmount = invoices
        .filter((invoice) => invoice.status !== 'paid')
        .reduce((total, invoice) => total + invoice.amount, 0);
      this.recentInvoices.splice(
        0,
        this.recentInvoices.length,
        ...invoices
          .slice()
          .sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
          .slice(0, 4)
      );
    });

    this.healthcareDataService.getEncounterNotesForPatient(patientId).subscribe((notes) => {
      this.encounterNotesCount = notes.length;
      this.recentEncounterNotes.splice(
        0,
        this.recentEncounterNotes.length,
        ...notes
          .slice()
          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
          .slice(0, 4)
      );
    });
  }
}
