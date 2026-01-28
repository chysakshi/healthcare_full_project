export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  bloodGroup?: string;
  emergencyContact?: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  languages: string[];
  availableDays: string[];
  shiftStart: string;
  shiftEnd: string;
  acceptingAppointments: boolean;
  rating: number;
}

export type AppointmentStatus = 'requested' | 'scheduled' | 'rescheduled' | 'checked-in' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startsAt: string;
  status: AppointmentStatus;
  mode: 'in-clinic' | 'virtual';
  reason: string;
}

export interface Prescription {
  id: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  issuedAt: string;
  medication: string;
  dosage: string;
  durationDays: number;
  instructions?: string;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  doctorId: string;
  reportType: string;
  createdAt: string;
  status: 'pending' | 'ready';
}

export interface Invoice {
  id: string;
  patientId: string;
  amount: number;
  issuedAt: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface EncounterNote {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  createdAt: string;
  title: string;
  summary: string;
  diagnosis: string;
  followUpInstructions: string;
}

export interface MessageThread {
  id: string;
  patientId: string;
  doctorId: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
}
