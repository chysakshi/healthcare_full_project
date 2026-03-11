import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DoctorProfile, User } from '../../core/models/healthcare.models';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

interface DirectoryDoctor {
  user: User;
  profile: DoctorProfile;
}

@Component({
  selector: 'app-doctor-directory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './doctor-directory.page.html',
  styleUrl: './doctor-directory.page.scss'
})
export class DoctorDirectoryPageComponent implements OnInit {
  protected readonly doctors: DirectoryDoctor[] = [];
  protected readonly filteredDoctors: DirectoryDoctor[] = [];
  protected readonly pagedDoctors: DirectoryDoctor[] = [];
  protected readonly specializationOptions: string[] = [];
  protected readonly dayOptions: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  protected searchQuery = '';
  protected selectedSpecialization = 'all';
  protected selectedDay = 'all';
  protected currentPage = 1;
  protected readonly pageSize = 4;
  protected totalPages = 1;

  constructor(private readonly healthcareDataService: HealthcareDataService) {}

  ngOnInit(): void {
    this.healthcareDataService.getDoctorDirectory().subscribe((directory) => {
      this.doctors.splice(0, this.doctors.length, ...directory);
      this.specializationOptions.splice(
        0,
        this.specializationOptions.length,
        ...Array.from(new Set(directory.map((entry) => entry.profile.specialization))).sort((left, right) =>
          left.localeCompare(right)
        )
      );
      this.applyFilters();
    });
  }

  protected applyFilters(): void {
    const normalizedQuery = this.searchQuery.trim().toLowerCase();

    this.filteredDoctors.splice(
      0,
      this.filteredDoctors.length,
      ...this.doctors.filter((doctor) => {
        const matchesQuery =
          !normalizedQuery ||
          doctor.user.fullName.toLowerCase().includes(normalizedQuery) ||
          doctor.profile.specialization.toLowerCase().includes(normalizedQuery) ||
          doctor.profile.languages.join(' ').toLowerCase().includes(normalizedQuery);

        const matchesSpecialization =
          this.selectedSpecialization === 'all' || doctor.profile.specialization === this.selectedSpecialization;

        const matchesDay = this.selectedDay === 'all' || doctor.profile.availableDays.includes(this.selectedDay);

        return matchesQuery && matchesSpecialization && matchesDay;
      })
    );

    this.currentPage = 1;
    this.refreshPagination();
  }

  protected previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage -= 1;
    this.refreshPagination();
  }

  protected nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage += 1;
    this.refreshPagination();
  }

  private refreshPagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredDoctors.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedDoctors.splice(0, this.pagedDoctors.length, ...this.filteredDoctors.slice(startIndex, endIndex));
  }
}
