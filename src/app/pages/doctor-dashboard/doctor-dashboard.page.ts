import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';
import { Appointment, DoctorProfile, EncounterNote, Prescription, User } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-doctor-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-dashboard.page.html',
  styleUrl: './doctor-dashboard.page.scss'
})
export class DoctorDashboardPageComponent implements OnInit {
  protected readonly dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
  protected readonly noteAppointments: Array<{ id: string; label: string }> = [];
  protected readonly encounterNotes: Array<{
    title: string;
    patientName: string;
    createdAt: string;
    diagnosis: string;
    followUpInstructions: string;
  }> = [];
  protected readonly prescriptionAppointments: Array<{ id: string; label: string }> = [];
  protected readonly recentPrescriptions: Array<{
    patientName: string;
    medication: string;
    dosage: string;
    durationDays: number;
    issuedAt: string;
    instructions: string;
  }> = [];
  protected actionMessage = '';
  protected scheduleMessage = '';
  protected noteMessage = '';
  protected noteError = '';
  protected prescriptionMessage = '';
  protected prescriptionError = '';
  protected shiftStart = '09:00';
  protected shiftEnd = '17:00';
  protected consultationFee = 0;
  protected acceptingAppointments = true;
  protected readonly selectedDays = new Set<string>();
  protected selectedAppointmentId = '';
  protected noteTitle = '';
  protected noteSummary = '';
  protected noteDiagnosis = '';
  protected noteFollowUpInstructions = '';
  protected selectedPrescriptionAppointmentId = '';
  protected prescriptionMedication = '';
  protected prescriptionDosage = '';
  protected prescriptionDurationDays = 7;
  protected prescriptionInstructions = '';

  private readonly usersMap = new Map<string, User>();
  private doctorProfile: DoctorProfile | null = null;

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

    this.healthcareDataService.getDoctorProfileByUserId(this.doctorId).subscribe((entry) => {
      this.doctorProfile = entry?.profile ?? null;
      if (!this.doctorProfile) {
        return;
      }

      this.shiftStart = this.doctorProfile.shiftStart;
      this.shiftEnd = this.doctorProfile.shiftEnd;
      this.consultationFee = this.doctorProfile.consultationFee;
      this.acceptingAppointments = this.doctorProfile.acceptingAppointments;
      this.selectedDays.clear();
      this.doctorProfile.availableDays.forEach((day) => this.selectedDays.add(day));
    });

    this.refreshAppointments();

    this.healthcareDataService.getReports().subscribe((reports) => {
      this.pendingReviews = reports.filter((report) => report.doctorId === this.doctorId && report.status === 'pending').length;
    });

    this.healthcareDataService.getPrescriptionsForDoctor(this.doctorId).subscribe((prescriptions) => {
      this.prescriptionRequests = prescriptions.length;
      this.populateRecentPrescriptions(prescriptions);
    });

    this.healthcareDataService.getEncounterNotesForDoctor(this.doctorId).subscribe((notes) => {
      this.encounterNotes.splice(
        0,
        this.encounterNotes.length,
        ...notes
          .slice()
          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
          .map((note) => ({
            title: note.title,
            patientName: this.resolvePatientName(note.patientId),
            createdAt: new Date(note.createdAt).toLocaleString(),
            diagnosis: note.diagnosis,
            followUpInstructions: note.followUpInstructions
          }))
      );
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

  protected toggleAvailableDay(day: string, isChecked: boolean): void {
    if (isChecked) {
      this.selectedDays.add(day);
    } else {
      this.selectedDays.delete(day);
    }
  }

  protected isDaySelected(day: string): boolean {
    return this.selectedDays.has(day);
  }

  protected saveAvailability(): void {
    if (this.shiftStart >= this.shiftEnd) {
      this.scheduleMessage = 'Shift end time must be later than shift start time.';
      return;
    }

    if (!this.selectedDays.size) {
      this.scheduleMessage = 'Select at least one available day.';
      return;
    }

    const updated = this.healthcareDataService.updateDoctorProfile(this.doctorId, {
      availableDays: [...this.selectedDays],
      shiftStart: this.shiftStart,
      shiftEnd: this.shiftEnd,
      acceptingAppointments: this.acceptingAppointments,
      consultationFee: this.consultationFee
    });

    if (!updated) {
      this.scheduleMessage = 'Could not update availability settings.';
      return;
    }

    this.doctorProfile = updated;
    this.scheduleMessage = 'Schedule and availability updated.';
  }

  protected saveEncounterNote(): void {
    if (!this.selectedAppointmentId || !this.noteTitle.trim() || !this.noteSummary.trim() || !this.noteDiagnosis.trim()) {
      this.noteError = 'Complete the appointment selection, title, summary, and diagnosis before saving.';
      this.noteMessage = '';
      return;
    }

    try {
      this.healthcareDataService.addEncounterNote({
        appointmentId: this.selectedAppointmentId,
        doctorId: this.doctorId,
        title: this.noteTitle,
        summary: this.noteSummary,
        diagnosis: this.noteDiagnosis,
        followUpInstructions: this.noteFollowUpInstructions
      });

      this.noteMessage = 'Encounter note saved successfully.';
      this.noteError = '';
      this.selectedAppointmentId = '';
      this.noteTitle = '';
      this.noteSummary = '';
      this.noteDiagnosis = '';
      this.noteFollowUpInstructions = '';
    } catch {
      this.noteError = 'Could not save encounter note for this appointment.';
      this.noteMessage = '';
    }
  }

  protected savePrescription(): void {
    if (
      !this.selectedPrescriptionAppointmentId ||
      !this.prescriptionMedication.trim() ||
      !this.prescriptionDosage.trim() ||
      this.prescriptionDurationDays <= 0
    ) {
      this.prescriptionError = 'Select an appointment and complete medication, dosage, and duration before issuing.';
      this.prescriptionMessage = '';
      return;
    }

    try {
      this.healthcareDataService.addPrescription({
        appointmentId: this.selectedPrescriptionAppointmentId,
        doctorId: this.doctorId,
        medication: this.prescriptionMedication,
        dosage: this.prescriptionDosage,
        durationDays: this.prescriptionDurationDays,
        instructions: this.prescriptionInstructions
      });

      this.prescriptionMessage = 'Prescription issued successfully.';
      this.prescriptionError = '';
      this.selectedPrescriptionAppointmentId = '';
      this.prescriptionMedication = '';
      this.prescriptionDosage = '';
      this.prescriptionDurationDays = 7;
      this.prescriptionInstructions = '';
    } catch {
      this.prescriptionError = 'Could not issue prescription for this appointment.';
      this.prescriptionMessage = '';
    }
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

      this.noteAppointments.splice(
        0,
        this.noteAppointments.length,
        ...appointments
          .filter((appointment) => appointment.status !== 'requested' && appointment.status !== 'cancelled')
          .map((appointment) => ({
            id: appointment.id,
            label: `${this.resolvePatientName(appointment.patientId)} | ${new Date(appointment.startsAt).toLocaleString()} | ${appointment.reason}`
          }))
      );

      this.prescriptionAppointments.splice(
        0,
        this.prescriptionAppointments.length,
        ...appointments
          .filter((appointment) => appointment.status !== 'requested' && appointment.status !== 'cancelled')
          .map((appointment) => ({
            id: appointment.id,
            label: `${this.resolvePatientName(appointment.patientId)} | ${new Date(appointment.startsAt).toLocaleString()} | ${appointment.reason}`
          }))
      );
    });
  }

  private populateRecentPrescriptions(prescriptions: Prescription[]): void {
    this.recentPrescriptions.splice(
      0,
      this.recentPrescriptions.length,
      ...prescriptions
        .slice()
        .sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
        .map((prescription) => ({
          patientName: this.resolvePatientName(prescription.patientId),
          medication: prescription.medication,
          dosage: prescription.dosage,
          durationDays: prescription.durationDays,
          issuedAt: new Date(prescription.issuedAt).toLocaleString(),
          instructions: prescription.instructions ?? 'No additional instructions.'
        }))
    );
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
