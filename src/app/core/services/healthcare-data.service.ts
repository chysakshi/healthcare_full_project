import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import {
  Appointment,
  DoctorProfile,
  EncounterNote,
  Invoice,
  MedicalReport,
  MessageThread,
  Prescription,
  UserRole,
  User
} from '../models/healthcare.models';
import {
  appointmentsSeed,
  doctorProfilesSeed,
  encounterNotesSeed,
  invoicesSeed,
  messageThreadsSeed,
  prescriptionsSeed,
  reportsSeed,
  usersSeed
} from '../data/healthcare.seed';

@Injectable({
  providedIn: 'root'
})
export class HealthcareDataService {
  private readonly usersSubject = new BehaviorSubject<User[]>([...usersSeed]);
  private readonly appointmentsSubject = new BehaviorSubject<Appointment[]>([...appointmentsSeed]);
  private readonly doctorProfilesSubject = new BehaviorSubject<DoctorProfile[]>([...doctorProfilesSeed]);
  private readonly encounterNotesSubject = new BehaviorSubject<EncounterNote[]>([...encounterNotesSeed]);
  private readonly prescriptionsSubject = new BehaviorSubject<Prescription[]>([...prescriptionsSeed]);
  private readonly messageThreadsSubject = new BehaviorSubject<MessageThread[]>([...messageThreadsSeed]);

  getUsers(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  getUsersSnapshot(): User[] {
    return this.usersSubject.value;
  }

  getUserById(userId: string): User | undefined {
    return this.usersSubject.value.find((user) => user.id === userId);
  }

  findUserByEmail(email: string): User | undefined {
    const normalizedEmail = email.trim().toLowerCase();
    return this.usersSubject.value.find((user) => user.email.toLowerCase() === normalizedEmail);
  }

  addUser(user: User): void {
    this.usersSubject.next([...this.usersSubject.value, user]);
  }

  updateUser(userId: string, changes: Partial<User>): User | null {
    let updatedUser: User | null = null;

    this.usersSubject.next(
      this.usersSubject.value.map((user) => {
        if (user.id !== userId) {
          return user;
        }

        updatedUser = { ...user, ...changes };
        return updatedUser;
      })
    );

    return updatedUser;
  }

  getDoctorProfiles(): Observable<DoctorProfile[]> {
    return this.doctorProfilesSubject.asObservable();
  }

  getDoctorProfileSnapshotByUserId(userId: string): DoctorProfile | undefined {
    return this.doctorProfilesSubject.value.find((profile) => profile.userId === userId);
  }

  updateDoctorProfile(userId: string, changes: Partial<DoctorProfile>): DoctorProfile | null {
    let updatedProfile: DoctorProfile | null = null;

    this.doctorProfilesSubject.next(
      this.doctorProfilesSubject.value.map((profile) => {
        if (profile.userId !== userId) {
          return profile;
        }

        updatedProfile = { ...profile, ...changes };
        return updatedProfile;
      })
    );

    return updatedProfile;
  }

  getDoctorDirectory(): Observable<Array<{ user: User; profile: DoctorProfile }>> {
    const doctors = this.usersSubject.value.filter((user) => user.role === 'doctor' && user.isActive);
    const profiles = this.doctorProfilesSubject.value;
    const directory = doctors
      .map((doctor) => {
        const profile = profiles.find((entry) => entry.userId === doctor.id);
        return profile ? { user: doctor, profile } : undefined;
      })
      .filter((entry): entry is { user: User; profile: DoctorProfile } => !!entry);

    return of(directory);
  }

  getDoctorProfileByUserId(userId: string): Observable<{ user: User; profile: DoctorProfile } | null> {
    const user = this.usersSubject.value.find((entry) => entry.id === userId && entry.role === 'doctor');
    const profile = this.doctorProfilesSubject.value.find((entry) => entry.userId === userId);

    if (!user || !profile) {
      return of(null);
    }

    return of({ user, profile });
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointmentsSubject.asObservable();
  }

  getAppointmentsForPatient(patientId: string): Observable<Appointment[]> {
    return this.appointmentsSubject
      .asObservable()
      .pipe(map((appointments) => appointments.filter((appointment) => appointment.patientId === patientId)));
  }

  getAppointmentsForDoctor(doctorId: string): Observable<Appointment[]> {
    return this.appointmentsSubject
      .asObservable()
      .pipe(map((appointments) => appointments.filter((appointment) => appointment.doctorId === doctorId)));
  }

  createAppointment(payload: {
    patientId: string;
    doctorId: string;
    startsAt: string;
    mode: 'in-clinic' | 'virtual';
    reason: string;
  }): Appointment {
    const profile = this.getDoctorProfileSnapshotByUserId(payload.doctorId);
    const startsAtDate = new Date(payload.startsAt);

    if (!profile || !this.isDoctorAvailableForSlot(profile, startsAtDate)) {
      throw new Error('Selected doctor is unavailable for the requested date/time.');
    }

    const appointment: Appointment = {
      id: `ap-${Date.now()}`,
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      startsAt: startsAtDate.toISOString(),
      status: 'requested',
      mode: payload.mode,
      reason: payload.reason.trim()
    };

    this.appointmentsSubject.next([appointment, ...this.appointmentsSubject.value]);
    return appointment;
  }

  updateAppointmentStatus(appointmentId: string, status: Appointment['status']): void {
    this.appointmentsSubject.next(
      this.appointmentsSubject.value.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, status } : appointment
      )
    );
  }

  rescheduleAppointment(appointmentId: string, startsAt: string): void {
    this.appointmentsSubject.next(
      this.appointmentsSubject.value.map((appointment) =>
        appointment.id === appointmentId
          ? {
              ...appointment,
              startsAt,
              status: 'rescheduled'
            }
          : appointment
      )
    );
  }

  getPrescriptionsForPatient(patientId: string): Observable<Prescription[]> {
    return this.prescriptionsSubject
      .asObservable()
      .pipe(map((prescriptions) => prescriptions.filter((prescription) => prescription.patientId === patientId)));
  }

  getPrescriptionsForDoctor(doctorId: string): Observable<Prescription[]> {
    return this.prescriptionsSubject
      .asObservable()
      .pipe(map((prescriptions) => prescriptions.filter((prescription) => prescription.doctorId === doctorId)));
  }

  addPrescription(payload: {
    appointmentId: string;
    doctorId: string;
    medication: string;
    dosage: string;
    durationDays: number;
    instructions: string;
  }): Prescription {
    const appointment = this.appointmentsSubject.value.find((entry) => entry.id === payload.appointmentId);
    if (!appointment || appointment.doctorId !== payload.doctorId) {
      throw new Error('Prescription cannot be created for this appointment.');
    }

    const prescription: Prescription = {
      id: `pr-${Date.now()}`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: payload.doctorId,
      issuedAt: new Date().toISOString(),
      medication: payload.medication.trim(),
      dosage: payload.dosage.trim(),
      durationDays: payload.durationDays,
      instructions: payload.instructions.trim()
    };

    this.prescriptionsSubject.next([prescription, ...this.prescriptionsSubject.value]);
    return prescription;
  }

  getReportsForPatient(patientId: string): Observable<MedicalReport[]> {
    return of(reportsSeed.filter((report) => report.patientId === patientId));
  }

  getInvoicesForPatient(patientId: string): Observable<Invoice[]> {
    return of(invoicesSeed.filter((invoice) => invoice.patientId === patientId));
  }

  getEncounterNotes(): Observable<EncounterNote[]> {
    return this.encounterNotesSubject.asObservable();
  }

  getEncounterNotesForPatient(patientId: string): Observable<EncounterNote[]> {
    return this.encounterNotesSubject
      .asObservable()
      .pipe(map((notes) => notes.filter((note) => note.patientId === patientId)));
  }

  getEncounterNotesForDoctor(doctorId: string): Observable<EncounterNote[]> {
    return this.encounterNotesSubject
      .asObservable()
      .pipe(map((notes) => notes.filter((note) => note.doctorId === doctorId)));
  }

  addEncounterNote(payload: {
    appointmentId: string;
    doctorId: string;
    title: string;
    summary: string;
    diagnosis: string;
    followUpInstructions: string;
  }): EncounterNote {
    const appointment = this.appointmentsSubject.value.find((entry) => entry.id === payload.appointmentId);
    if (!appointment || appointment.doctorId !== payload.doctorId) {
      throw new Error('Encounter note cannot be created for this appointment.');
    }

    const note: EncounterNote = {
      id: `en-${Date.now()}`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: payload.doctorId,
      createdAt: new Date().toISOString(),
      title: payload.title.trim(),
      summary: payload.summary.trim(),
      diagnosis: payload.diagnosis.trim(),
      followUpInstructions: payload.followUpInstructions.trim()
    };

    this.encounterNotesSubject.next([note, ...this.encounterNotesSubject.value]);
    return note;
  }

  getMessageThreads(): Observable<MessageThread[]> {
    return this.messageThreadsSubject.asObservable();
  }

  getMessageThreadsForUser(userId: string, role: UserRole): Observable<MessageThread[]> {
    return this.messageThreadsSubject.asObservable().pipe(
      map((threads) => {
        if (role === 'admin') {
          return threads;
        }

        return threads.filter((thread) => thread.patientId === userId || thread.doctorId === userId);
      })
    );
  }

  markThreadRead(threadId: string): void {
    this.messageThreadsSubject.next(
      this.messageThreadsSubject.value.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              unreadCount: 0
            }
          : thread
      )
    );
  }

  addThreadMessage(payload: {
    threadId: string;
    senderId: string;
    senderRole: UserRole;
    content: string;
  }): MessageThread {
    let updatedThread: MessageThread | null = null;
    const trimmedContent = payload.content.trim();
    if (!trimmedContent) {
      throw new Error('Message content is required.');
    }

    this.messageThreadsSubject.next(
      this.messageThreadsSubject.value.map((thread) => {
        if (thread.id !== payload.threadId) {
          return thread;
        }

        if (
          payload.senderRole !== 'admin' &&
          thread.patientId !== payload.senderId &&
          thread.doctorId !== payload.senderId
        ) {
          throw new Error('Message sender is not part of this thread.');
        }

        updatedThread = {
          ...thread,
          lastMessage: trimmedContent,
          unreadCount: thread.unreadCount + 1,
          updatedAt: new Date().toISOString(),
          messages: [
            ...thread.messages,
            {
              id: `msg-${Date.now()}`,
              senderId: payload.senderId,
              senderRole: payload.senderRole,
              content: trimmedContent,
              sentAt: new Date().toISOString()
            }
          ]
        };

        return updatedThread;
      })
    );

    if (!updatedThread) {
      throw new Error('Message thread was not found.');
    }

    return updatedThread;
  }

  getPrescriptions(): Observable<Prescription[]> {
    return this.prescriptionsSubject.asObservable();
  }

  getReports(): Observable<MedicalReport[]> {
    return of(reportsSeed);
  }

  getInvoices(): Observable<Invoice[]> {
    return of(invoicesSeed);
  }

  private isDoctorAvailableForSlot(profile: DoctorProfile, startsAt: Date): boolean {
    if (!profile.acceptingAppointments) {
      return false;
    }

    const dayToken = startsAt.toLocaleDateString('en-US', { weekday: 'short' });
    if (!profile.availableDays.includes(dayToken)) {
      return false;
    }

    const requestedTime = `${`${startsAt.getHours()}`.padStart(2, '0')}:${`${startsAt.getMinutes()}`.padStart(2, '0')}`;
    return requestedTime >= profile.shiftStart && requestedTime <= profile.shiftEnd;
  }
}
