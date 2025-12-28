import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';
import { Appointment, User } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-doctor-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-dashboard.page.html',
  styleUrl: './doctor-dashboard.page.scss'
})
export class DoctorDashboardPageComponent implements OnInit {
  protected doctorId = 'd-001';
  protected todaysAppointments = 0;
  protected pendingReviews = 0;
  protected prescriptionRequests = 0;
  protected inClinicCount = 0;
  protected virtualCount = 0;
  protected readonly consultationQueue: string[] = [];
  protected readonly appointmentRequests: Array<{
    id: string;
    startsAt: string;
    startsAtIso: string;
    patientName: string;
    mode: string;
    reason: string;
    status: string;
  }> = [];
  protected actionMessage = '';
  private readonly usersMap = new Map<string, User>();

  constructor(
    private readonly healthcareDataService: HealthcareDataService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const loggedInUser = this.authService.currentUser;
    if (loggedInUser?.role === 'doctor') {
      this.doctorId = loggedInUser.id;
    }

    this.healthcareDataService.getUsers().subscribe((users) => {
      this.usersMap.clear();
      for (const user of users) {
        this.usersMap.set(user.id, user);
      }
      this.refreshAppointments();
    });

    this.refreshAppointments();

    this.healthcareDataService.getReports().subscribe((reports) => {
      this.pendingReviews = reports.filter((report) => report.doctorId === this.doctorId && report.status === 'pending').length;
    });

    this.healthcareDataService.getPrescriptions().subscribe((prescriptions) => {
      this.prescriptionRequests = prescriptions.filter((prescription) => prescription.doctorId === this.doctorId).length;
    });
  }

  protected approveAppointment(appointmentId: string): void {
    this.healthcareDataService.updateAppointmentStatus(appointmentId, 'scheduled');
    this.actionMessage = 'Appointment approved successfully.';
  }

  protected completeAppointment(appointmentId: string): void {
    this.healthcareDataService.updateAppointmentStatus(appointmentId, 'completed');
    this.actionMessage = 'Appointment marked as completed.';
  }

  protected cancelAppointment(appointmentId: string): void {
    this.healthcareDataService.updateAppointmentStatus(appointmentId, 'cancelled');
    this.actionMessage = 'Appointment cancelled.';
  }

  protected rescheduleAppointment(appointmentId: string, currentStartsAtIso: string): void {
    const nextSlot = new Date(currentStartsAtIso);
    nextSlot.setDate(nextSlot.getDate() + 1);
    this.healthcareDataService.rescheduleAppointment(appointmentId, nextSlot.toISOString());
    this.actionMessage = 'Appointment rescheduled for the next available day.';
  }

  private refreshAppointments(): void {
    this.healthcareDataService.getAppointmentsForDoctor(this.doctorId).subscribe((appointments) => {
      const today = new Date().toDateString();
      const todaysList = appointments.filter(
        (appointment) =>
          new Date(appointment.startsAt).toDateString() === today &&
          ['requested', 'scheduled', 'rescheduled', 'checked-in'].includes(appointment.status)
      );

      this.todaysAppointments = todaysList.length;
      this.inClinicCount = todaysList.filter((appointment) => appointment.mode === 'in-clinic').length;
      this.virtualCount = todaysList.filter((appointment) => appointment.mode === 'virtual').length;

      this.consultationQueue.splice(0, this.consultationQueue.length, ...this.mapQueueEntries(todaysList));
      this.appointmentRequests.splice(
        0,
        this.appointmentRequests.length,
        ...appointments
          .slice()
          .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
          .map((appointment) => ({
            id: appointment.id,
            startsAt: new Date(appointment.startsAt).toLocaleString(),
            startsAtIso: appointment.startsAt,
            patientName: this.resolvePatientName(appointment.patientId),
            mode: appointment.mode,
            reason: appointment.reason,
            status: appointment.status
          }))
      );
    });
  }

  protected canApprove(status: string): boolean {
    return status === 'requested' || status === 'rescheduled';
  }

  protected canComplete(status: string): boolean {
    return status === 'scheduled' || status === 'checked-in';
  }

  protected canReschedule(status: string): boolean {
    return status !== 'completed' && status !== 'cancelled';
  }

  private mapQueueEntries(appointments: Appointment[]): string[] {
    if (!appointments.length) {
      return ['No scheduled consultations today.'];
    }

    return appointments
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      .map((appointment) => `${new Date(appointment.startsAt).toLocaleTimeString()} - ${appointment.reason}`);
  }

  private resolvePatientName(patientId: string): string {
    return this.usersMap.get(patientId)?.fullName ?? 'Patient';
  }
}
