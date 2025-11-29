import {
  Appointment,
  DoctorProfile,
  Invoice,
  MedicalReport,
  MessageThread,
  Prescription,
  User
} from '../models/healthcare.models';

export const usersSeed: User[] = [
  {
    id: 'p-001',
    fullName: 'Kavya Sharma',
    email: 'kavya.sharma@healthcare.com',
    password: 'Patient@123',
    role: 'patient',
    isActive: true
  },
  {
    id: 'p-002',
    fullName: 'Ravi Nair',
    email: 'ravi.nair@healthcare.com',
    password: 'Patient@123',
    role: 'patient',
    isActive: true
  },
  {
    id: 'd-001',
    fullName: 'Dr. Arjun Mehra',
    email: 'arjun.mehra@healthcare.com',
    password: 'Doctor@123',
    role: 'doctor',
    isActive: true
  },
  {
    id: 'd-002',
    fullName: 'Dr. Nisha Patel',
    email: 'nisha.patel@healthcare.com',
    password: 'Doctor@123',
    role: 'doctor',
    isActive: true
  },
  {
    id: 'a-001',
    fullName: 'Priya Verma',
    email: 'priya.verma@healthcare.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true
  }
];

export const doctorProfilesSeed: DoctorProfile[] = [
  { id: 'dp-001', userId: 'd-001', specialization: 'Cardiology', experienceYears: 11 },
  { id: 'dp-002', userId: 'd-002', specialization: 'General Medicine', experienceYears: 8 }
];

export const appointmentsSeed: Appointment[] = [
  {
    id: 'ap-001',
    patientId: 'p-001',
    doctorId: 'd-001',
    startsAt: '2026-04-21T17:30:00.000Z',
    status: 'scheduled',
    mode: 'virtual',
    reason: 'Follow-up consultation'
  },
  {
    id: 'ap-002',
    patientId: 'p-001',
    doctorId: 'd-002',
    startsAt: '2026-04-22T10:15:00.000Z',
    status: 'scheduled',
    mode: 'in-clinic',
    reason: 'Routine examination'
  },
  {
    id: 'ap-003',
    patientId: 'p-002',
    doctorId: 'd-001',
    startsAt: '2026-04-20T09:00:00.000Z',
    status: 'completed',
    mode: 'in-clinic',
    reason: 'Cardiology review'
  }
];

export const prescriptionsSeed: Prescription[] = [
  {
    id: 'pr-001',
    patientId: 'p-001',
    doctorId: 'd-001',
    issuedAt: '2026-04-19T09:30:00.000Z',
    medication: 'Amlodipine',
    dosage: '5 mg once daily',
    durationDays: 30
  },
  {
    id: 'pr-002',
    patientId: 'p-001',
    doctorId: 'd-002',
    issuedAt: '2026-04-15T10:00:00.000Z',
    medication: 'Vitamin D3',
    dosage: '60k IU weekly',
    durationDays: 56
  }
];

export const reportsSeed: MedicalReport[] = [
  {
    id: 'rp-001',
    patientId: 'p-001',
    doctorId: 'd-001',
    reportType: 'Lipid Profile',
    createdAt: '2026-04-20T06:00:00.000Z',
    status: 'pending'
  },
  {
    id: 'rp-002',
    patientId: 'p-002',
    doctorId: 'd-001',
    reportType: 'ECG',
    createdAt: '2026-04-18T06:00:00.000Z',
    status: 'ready'
  }
];

export const invoicesSeed: Invoice[] = [
  {
    id: 'inv-001',
    patientId: 'p-001',
    amount: 1850,
    issuedAt: '2026-04-18T10:00:00.000Z',
    status: 'pending'
  },
  {
    id: 'inv-002',
    patientId: 'p-001',
    amount: 920,
    issuedAt: '2026-04-11T10:00:00.000Z',
    status: 'paid'
  },
  {
    id: 'inv-003',
    patientId: 'p-002',
    amount: 2410,
    issuedAt: '2026-04-04T10:00:00.000Z',
    status: 'overdue'
  }
];

export const messageThreadsSeed: MessageThread[] = [
  {
    id: 'th-001',
    patientId: 'p-001',
    doctorId: 'd-001',
    lastMessage: 'Please continue medication and share your BP logs tomorrow.',
    unreadCount: 1,
    updatedAt: '2026-04-20T12:40:00.000Z'
  }
];
