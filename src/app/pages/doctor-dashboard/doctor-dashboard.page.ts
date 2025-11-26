import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';
import { Appointment } from '../../core/models/healthcare.models';

@Component({
  selector: 'app-doctor-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-dashboard.page.html',
  styleUrl: './doctor-dashboard.page.scss'
})
export class DoctorDashboardPageComponent implements OnInit {
  protected readonly doctorId = 'd-001';
  protected todaysAppointments = 0;
  protected pendingReviews = 0;
  protected prescriptionRequests = 0;
  protected inClinicCount = 0;
  protected virtualCount = 0;
  protected readonly consultationQueue: string[] = [];

  constructor(private readonly healthcareDataService: HealthcareDataService) {}

  ngOnInit(): void {
    this.healthcareDataService.getAppointmentsForDoctor(this.doctorId).subscribe((appointments) => {
      const today = new Date().toDateString();
      const todaysList = appointments.filter(
        (appointment) => new Date(appointment.startsAt).toDateString() === today && appointment.status === 'scheduled'
      );

      this.todaysAppointments = todaysList.length;
      this.inClinicCount = todaysList.filter((appointment) => appointment.mode === 'in-clinic').length;
      this.virtualCount = todaysList.filter((appointment) => appointment.mode === 'virtual').length;

      this.consultationQueue.splice(0, this.consultationQueue.length, ...this.mapQueueEntries(todaysList));
    });

    this.healthcareDataService.getReports().subscribe((reports) => {
      this.pendingReviews = reports.filter((report) => report.doctorId === this.doctorId && report.status === 'pending').length;
    });

    this.healthcareDataService.getPrescriptions().subscribe((prescriptions) => {
      this.prescriptionRequests = prescriptions.filter((prescription) => prescription.doctorId === this.doctorId).length;
    });
  }

  private mapQueueEntries(appointments: Appointment[]): string[] {
    if (!appointments.length) {
      return ['No scheduled consultations today.'];
    }

    return appointments
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      .map((appointment) => `${new Date(appointment.startsAt).toLocaleTimeString()} - ${appointment.reason}`);
  }
}
