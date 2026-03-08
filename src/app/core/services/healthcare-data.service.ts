import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import {
  AppNotification,
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
  notificationsSeed,
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
  private readonly invoicesSubject = new BehaviorSubject<Invoice[]>([...invoicesSeed]);
  private readonly notificationsSubject = new BehaviorSubject<AppNotification[]>([...notificationsSeed]);

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

  getUsersByRole(role: UserRole): Observable<User[]> {
    return this.usersSubject.asObservable().pipe(map((users) => users.filter((user) => user.role === role)));
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

  setUserActiveStatus(userId: string, isActive: boolean): User | null {
    return this.updateUser(userId, { isActive });
  }

  createManagedUser(payload: {
    fullName: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
    phone?: string;
    bloodGroup?: string;
    emergencyContact?: string;
    specialization?: string;
    experienceYears?: number;
    consultationFee?: number;
    languages?: string[];
    availableDays?: string[];
    shiftStart?: string;
    shiftEnd?: string;
    acceptingAppointments?: boolean;
    rating?: number;
  }): { user: User; profile?: DoctorProfile } {
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (this.findUserByEmail(normalizedEmail)) {
      throw new Error('A user with this email already exists.');
    }

    const identifierPrefix = payload.role === 'doctor' ? 'd' : 'p';
    const user: User = {
      id: `${identifierPrefix}-${Date.now()}`,
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      password: payload.password.trim(),
      role: payload.role,
      isActive: true,
      phone: payload.phone?.trim(),
      bloodGroup: payload.bloodGroup,
      emergencyContact: payload.emergencyContact?.trim()
    };

    this.usersSubject.next([...this.usersSubject.value, user]);

    if (payload.role !== 'doctor') {
      return { user };
    }

    const profile: DoctorProfile = {
      id: `dp-${Date.now()}`,
      userId: user.id,
      specialization: payload.specialization?.trim() || 'General Medicine',
      experienceYears: payload.experienceYears ?? 1,
      consultationFee: payload.consultationFee ?? 800,
      languages: payload.languages?.length ? payload.languages : ['English'],
      availableDays: payload.availableDays?.length ? payload.availableDays : ['Mon', 'Wed', 'Fri'],
      shiftStart: payload.shiftStart ?? '09:00',
      shiftEnd: payload.shiftEnd ?? '17:00',
      acceptingAppointments: payload.acceptingAppointments ?? true,
      rating: payload.rating ?? 4.5
    };

    this.doctorProfilesSubject.next([...this.doctorProfilesSubject.value, profile]);
    return { user, profile };
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

  reassignAppointmentDoctor(appointmentId: string, doctorId: string): Appointment {
    const appointment = this.appointmentsSubject.value.find((entry) => entry.id === appointmentId);
    if (!appointment) {
      throw new Error('Appointment was not found.');
    }

    const doctor = this.usersSubject.value.find((entry) => entry.id === doctorId && entry.role === 'doctor' && entry.isActive);
    const profile = this.getDoctorProfileSnapshotByUserId(doctorId);
    const startsAtDate = new Date(appointment.startsAt);

    if (!doctor || !profile || !this.isDoctorAvailableForSlot(profile, startsAtDate)) {
      throw new Error('Selected doctor is unavailable for this appointment slot.');
    }

    let updatedAppointment: Appointment | null = null;

    this.appointmentsSubject.next(
      this.appointmentsSubject.value.map((entry) => {
        if (entry.id !== appointmentId) {
          return entry;
        }

        updatedAppointment = {
          ...entry,
          doctorId
        };

        return updatedAppointment;
      })
    );

    if (!updatedAppointment) {
      throw new Error('Appointment reassignment failed.');
    }

    return updatedAppointment;
  }

  adminRescheduleAppointment(appointmentId: string, startsAt: string): Appointment {
    const appointment = this.appointmentsSubject.value.find((entry) => entry.id === appointmentId);
    if (!appointment) {
      throw new Error('Appointment was not found.');
    }

    const startsAtDate = new Date(startsAt);
    const profile = this.getDoctorProfileSnapshotByUserId(appointment.doctorId);
    if (!profile || !this.isDoctorAvailableForSlot(profile, startsAtDate)) {
      throw new Error('Assigned doctor is unavailable for the selected schedule.');
    }

    let updatedAppointment: Appointment | null = null;

    this.appointmentsSubject.next(
      this.appointmentsSubject.value.map((entry) => {
        if (entry.id !== appointmentId) {
          return entry;
        }

        updatedAppointment = {
          ...entry,
          startsAt: startsAtDate.toISOString(),
          status: 'rescheduled'
        };

        return updatedAppointment;
      })
    );

    if (!updatedAppointment) {
      throw new Error('Appointment reschedule failed.');
    }

    return updatedAppointment;
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
    return this.invoicesSubject
      .asObservable()
      .pipe(map((invoices) => invoices.filter((invoice) => invoice.patientId === patientId)));
  }

  getInvoicesForUser(userId: string, role: UserRole): Observable<Invoice[]> {
    return this.invoicesSubject.asObservable().pipe(
      map((invoices) => {
        if (role === 'admin') {
          return invoices;
        }

        return invoices.filter((invoice) => invoice.patientId === userId);
      })
    );
  }

  markInvoiceAsPaid(invoiceId: string, actorId?: string): Invoice {
    let updatedInvoice: Invoice | null = null;

    this.invoicesSubject.next(
      this.invoicesSubject.value.map((invoice) => {
        if (invoice.id !== invoiceId) {
          return invoice;
        }

        if (actorId && invoice.patientId !== actorId) {
          throw new Error('Invoice payment is not allowed for this user.');
        }

        updatedInvoice = {
          ...invoice,
          status: 'paid'
        };

        return updatedInvoice;
      })
    );

    if (!updatedInvoice) {
      throw new Error('Invoice was not found.');
    }

    return updatedInvoice;
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
    return this.invoicesSubject.asObservable();
  }

  getNotificationsForUser(userId: string, role: UserRole): Observable<AppNotification[]> {
    return this.notificationsSubject.asObservable().pipe(
      map((notifications) =>
        notifications
          .filter(
            (notification) =>
              notification.recipientId === userId ||
              notification.recipientRole === role ||
              notification.recipientRole === 'all'
          )
          .sort((left, right) => {
            const leftTimestamp = new Date(left.remindAt ?? left.createdAt).getTime();
            const rightTimestamp = new Date(right.remindAt ?? right.createdAt).getTime();
            return rightTimestamp - leftTimestamp;
          })
      )
    );
  }

  markNotificationRead(notificationId: string, userId: string, role: UserRole): AppNotification {
    let updatedNotification: AppNotification | null = null;

    this.notificationsSubject.next(
      this.notificationsSubject.value.map((notification) => {
        if (notification.id !== notificationId) {
          return notification;
        }

        if (
          notification.recipientId !== userId &&
          notification.recipientRole !== role &&
          notification.recipientRole !== 'all'
        ) {
          throw new Error('Notification cannot be marked for this user.');
        }

        updatedNotification = {
          ...notification,
          read: true
        };

        return updatedNotification;
      })
    );

    if (!updatedNotification) {
      throw new Error('Notification was not found.');
    }

    return updatedNotification;
  }

  markAllNotificationsRead(userId: string, role: UserRole): number {
    let updatedCount = 0;

    this.notificationsSubject.next(
      this.notificationsSubject.value.map((notification) => {
        if (
          notification.read ||
          (notification.recipientId !== userId && notification.recipientRole !== role && notification.recipientRole !== 'all')
        ) {
          return notification;
        }

        updatedCount += 1;
        return {
          ...notification,
          read: true
        };
      })
    );

    return updatedCount;
  }

  snoozeNotification(notificationId: string, userId: string, role: UserRole, minutes = 60): AppNotification {
    let updatedNotification: AppNotification | null = null;

    this.notificationsSubject.next(
      this.notificationsSubject.value.map((notification) => {
        if (notification.id !== notificationId) {
          return notification;
        }

        if (
          notification.recipientId !== userId &&
          notification.recipientRole !== role &&
          notification.recipientRole !== 'all'
        ) {
          throw new Error('Notification cannot be snoozed for this user.');
        }

        const remindAt = new Date(Date.now() + minutes * 60000).toISOString();
        updatedNotification = {
          ...notification,
          remindAt,
          read: false
        };

        return updatedNotification;
      })
    );

    if (!updatedNotification) {
      throw new Error('Notification was not found.');
    }

    return updatedNotification;
  }

  syncRemindersForUser(userId: string, role: UserRole): void {
    const now = new Date();
    const reminders: AppNotification[] = [];

    if (role === 'patient') {
      this.appointmentsSubject.value
        .filter(
          (appointment) =>
            appointment.patientId === userId &&
            ['requested', 'scheduled', 'rescheduled'].includes(appointment.status) &&
            new Date(appointment.startsAt).getTime() > now.getTime()
        )
        .forEach((appointment) => {
          reminders.push({
            id: `rem-ap-${appointment.id}-${userId}`,
            recipientId: userId,
            category: 'appointment',
            title: 'Upcoming Consultation Reminder',
            body: `Appointment ${appointment.id} is scheduled on ${new Date(appointment.startsAt).toLocaleString()}.`,
            createdAt: now.toISOString(),
            remindAt: appointment.startsAt,
            read: false,
            priority: 'high'
          });
        });

      this.invoicesSubject.value
        .filter((invoice) => invoice.patientId === userId && invoice.status !== 'paid')
        .forEach((invoice) => {
          reminders.push({
            id: `rem-inv-${invoice.id}-${userId}`,
            recipientId: userId,
            category: 'billing',
            title: invoice.status === 'overdue' ? 'Overdue Invoice Alert' : 'Pending Invoice Reminder',
            body: `Invoice ${invoice.id} for INR ${invoice.amount} is currently ${invoice.status}.`,
            createdAt: now.toISOString(),
            read: false,
            priority: invoice.status === 'overdue' ? 'high' : 'medium'
          });
        });
    }

    if (role === 'doctor') {
      this.appointmentsSubject.value
        .filter(
          (appointment) =>
            appointment.doctorId === userId &&
            ['requested', 'scheduled', 'rescheduled'].includes(appointment.status) &&
            new Date(appointment.startsAt).getTime() > now.getTime()
        )
        .forEach((appointment) => {
          reminders.push({
            id: `rem-doc-ap-${appointment.id}-${userId}`,
            recipientId: userId,
            category: 'appointment',
            title: 'Provider Schedule Reminder',
            body: `You have an upcoming ${appointment.mode} appointment at ${new Date(appointment.startsAt).toLocaleString()}.`,
            createdAt: now.toISOString(),
            remindAt: appointment.startsAt,
            read: false,
            priority: 'medium'
          });
        });
    }

    if (role === 'admin') {
      this.appointmentsSubject.value
        .filter(
          (appointment) =>
            ['requested', 'scheduled'].includes(appointment.status) &&
            new Date(appointment.startsAt).getTime() > now.getTime()
        )
        .forEach((appointment) => {
          reminders.push({
            id: `rem-admin-ap-${appointment.id}`,
            recipientRole: 'admin',
            category: 'appointment',
            title: 'Operational Appointment Watch',
            body: `Track appointment ${appointment.id} (${appointment.status}) planned for ${new Date(appointment.startsAt).toLocaleString()}.`,
            createdAt: now.toISOString(),
            remindAt: appointment.startsAt,
            read: false,
            priority: 'medium'
          });
        });

      this.invoicesSubject.value
        .filter((invoice) => invoice.status === 'overdue')
        .forEach((invoice) => {
          reminders.push({
            id: `rem-admin-inv-${invoice.id}`,
            recipientRole: 'admin',
            category: 'billing',
            title: 'Overdue Billing Escalation',
            body: `Invoice ${invoice.id} for patient ${invoice.patientId} is overdue (INR ${invoice.amount}).`,
            createdAt: now.toISOString(),
            read: false,
            priority: 'high'
          });
        });
    }

    if (!reminders.length) {
      return;
    }

    this.upsertNotifications(reminders);
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

  private upsertNotifications(notifications: AppNotification[]): void {
    const notificationMap = new Map(this.notificationsSubject.value.map((notification) => [notification.id, notification]));

    notifications.forEach((notification) => {
      const existing = notificationMap.get(notification.id);
      notificationMap.set(notification.id, {
        ...notification,
        createdAt: existing?.createdAt ?? notification.createdAt,
        read: existing?.read ?? notification.read,
        remindAt: notification.remindAt ?? existing?.remindAt
      });
    });

    this.notificationsSubject.next(Array.from(notificationMap.values()));
  }
}
