import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';
import { Appointment, Invoice, MedicalReport, Prescription, User } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-patient-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-dashboard.page.html',
  styleUrl: './patient-dashboard.page.scss'
})
export class PatientDashboardPageComponent implements OnInit {
  protected patientId = 'p-001';
  protected upcomingAppointments = 0;
  protected activePrescriptions = 0;
  protected pendingReports = 0;
  protected pendingInvoices = 0;
  protected outstandingAmount = 0;
  protected nextAppointmentLabel = 'No upcoming appointments';
  protected readonly appointmentList: Array<{ dateTime: string; mode: string; doctor: string; reason: string }> = [];
  protected readonly prescriptionList: Prescription[] = [];
  protected readonly reportList: MedicalReport[] = [];
  protected readonly invoiceList: Invoice[] = [];
  protected readonly recentActivity: string[] = [];
  private readonly usersMap = new Map<string, User>();

  constructor(
    private readonly healthcareDataService: HealthcareDataService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const loggedInUser = this.authService.currentUser;
    if (loggedInUser?.role === 'patient') {
      this.patientId = loggedInUser.id;
    }

    this.healthcareDataService.getUsers().subscribe((users) => {
      this.usersMap.clear();
      for (const user of users) {
        this.usersMap.set(user.id, user);
      }
      this.refreshAppointments();
    });

    this.refreshAppointments();
    this.refreshPrescriptions();
    this.refreshReports();
    this.refreshInvoices();

    this.recentActivity.splice(
      0,
      this.recentActivity.length,
      'Appointment confirmation synced to your calendar',
      'Prescription timeline refreshed from provider records',
      'Billing summary updated with latest transaction statuses'
    );
  }

  private refreshAppointments(): void {
    this.healthcareDataService.getAppointmentsForPatient(this.patientId).subscribe((appointments) => {
      const upcoming = appointments
        .filter((appointment) => appointment.status === 'scheduled')
        .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

      this.upcomingAppointments = upcoming.length;
      this.nextAppointmentLabel = this.formatNextAppointment(upcoming[0]);
      this.appointmentList.splice(0, this.appointmentList.length, ...upcoming.map((appointment) => ({
        dateTime: new Date(appointment.startsAt).toLocaleString(),
        mode: appointment.mode,
        doctor: this.resolveDoctorName(appointment),
        reason: appointment.reason
      })));
    });
  }

  private refreshPrescriptions(): void {
    this.healthcareDataService.getPrescriptionsForPatient(this.patientId).subscribe((prescriptions) => {
      this.activePrescriptions = prescriptions.length;
      this.prescriptionList.splice(
        0,
        this.prescriptionList.length,
        ...prescriptions.sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
      );
    });
  }

  private refreshReports(): void {
    this.healthcareDataService.getReportsForPatient(this.patientId).subscribe((reports) => {
      this.pendingReports = reports.filter((report) => report.status === 'pending').length;
      this.reportList.splice(
        0,
        this.reportList.length,
        ...reports.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      );
    });
  }

  private refreshInvoices(): void {
    this.healthcareDataService.getInvoicesForPatient(this.patientId).subscribe((invoices) => {
      this.pendingInvoices = invoices.filter((invoice) => invoice.status !== 'paid').length;
      this.outstandingAmount = invoices
        .filter((invoice) => invoice.status !== 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0);
      this.invoiceList.splice(
        0,
        this.invoiceList.length,
        ...invoices.sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
      );
    });
  }

  private formatNextAppointment(appointment: Appointment | undefined): string {
    if (!appointment) {
      return 'No upcoming appointments';
    }

    return `${new Date(appointment.startsAt).toLocaleString()} - ${appointment.reason}`;
  }

  private resolveDoctorName(appointment: Appointment): string {
    const doctor = this.usersMap.get(appointment.doctorId);
    return doctor?.fullName ?? 'Assigned doctor';
  }
}
