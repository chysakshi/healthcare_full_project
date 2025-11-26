import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';
import { Appointment } from '../../core/models/healthcare.models';

@Component({
  selector: 'app-patient-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-dashboard.page.html',
  styleUrl: './patient-dashboard.page.scss'
})
export class PatientDashboardPageComponent implements OnInit {
  protected readonly patientId = 'p-001';
  protected upcomingAppointments = 0;
  protected activePrescriptions = 0;
  protected pendingReports = 0;
  protected pendingInvoices = 0;
  protected nextAppointmentLabel = 'No upcoming appointments';
  protected readonly recentActivity: string[] = [];

  constructor(private readonly healthcareDataService: HealthcareDataService) {}

  ngOnInit(): void {
    this.healthcareDataService.getAppointmentsForPatient(this.patientId).subscribe((appointments) => {
      const upcoming = appointments
        .filter((appointment) => appointment.status === 'scheduled')
        .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

      this.upcomingAppointments = upcoming.length;
      this.nextAppointmentLabel = this.formatNextAppointment(upcoming[0]);
    });

    this.healthcareDataService.getPrescriptionsForPatient(this.patientId).subscribe((prescriptions) => {
      this.activePrescriptions = prescriptions.length;
    });

    this.healthcareDataService.getReportsForPatient(this.patientId).subscribe((reports) => {
      this.pendingReports = reports.filter((report) => report.status === 'pending').length;
    });

    this.healthcareDataService.getInvoicesForPatient(this.patientId).subscribe((invoices) => {
      this.pendingInvoices = invoices.filter((invoice) => invoice.status !== 'paid').length;
    });

    this.recentActivity.push(
      'Appointment confirmed with Dr. Arjun Mehra',
      'Prescription updated for cardiovascular care',
      'Invoice posted to billing history'
    );
  }

  private formatNextAppointment(appointment: Appointment | undefined): string {
    if (!appointment) {
      return 'No upcoming appointments';
    }

    return `${new Date(appointment.startsAt).toLocaleString()} - ${appointment.reason}`;
  }
}
