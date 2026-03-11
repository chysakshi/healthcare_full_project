import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, User } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

type InvoiceFilter = 'all' | 'pending' | 'paid' | 'overdue';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.page.html',
  styleUrl: './billing.page.scss'
})
export class BillingPageComponent implements OnInit {
  protected currentUser: User | null = null;
  protected readonly invoices: Invoice[] = [];
  protected readonly filteredInvoices: Invoice[] = [];
  protected readonly pagedInvoices: Invoice[] = [];
  protected selectedFilter: InvoiceFilter = 'all';
  protected searchQuery = '';
  protected currentPage = 1;
  protected readonly pageSize = 4;
  protected totalPages = 1;
  protected isLoading = true;
  protected billingMessage = '';
  protected billingError = '';
  protected pendingCount = 0;
  protected overdueCount = 0;
  protected paidCount = 0;
  protected totalOutstanding = 0;
  protected totalPaidAmount = 0;

  constructor(
    private readonly authService: AuthService,
    private readonly healthcareDataService: HealthcareDataService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (!user) {
      this.billingError = 'Billing is unavailable without an active session.';
      this.isLoading = false;
      return;
    }

    this.currentUser = user;

    this.healthcareDataService.getInvoicesForUser(user.id, user.role).subscribe((invoices) => {
      this.invoices.splice(
        0,
        this.invoices.length,
        ...invoices.slice().sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
      );
      this.refreshSummary();
      this.refreshFilteredInvoices();
      this.isLoading = false;
    });
  }

  protected applyFilter(filter: InvoiceFilter): void {
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.refreshFilteredInvoices();
  }

  protected applySearch(): void {
    this.currentPage = 1;
    this.refreshFilteredInvoices();
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

  private refreshFilteredInvoices(): void {
    const normalizedQuery = this.searchQuery.trim().toLowerCase();

    this.filteredInvoices.splice(
      0,
      this.filteredInvoices.length,
      ...this.invoices.filter((invoice) => {
        const matchesStatus = this.selectedFilter === 'all' || invoice.status === this.selectedFilter;
        const matchesSearch =
          !normalizedQuery ||
          invoice.id.toLowerCase().includes(normalizedQuery) ||
          invoice.patientId.toLowerCase().includes(normalizedQuery) ||
          invoice.status.toLowerCase().includes(normalizedQuery) ||
          `${invoice.amount}`.includes(normalizedQuery);

        return matchesStatus && matchesSearch;
      })
    );

    this.refreshPagination();
  }

  private refreshPagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredInvoices.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedInvoices.splice(0, this.pagedInvoices.length, ...this.filteredInvoices.slice(startIndex, endIndex));
  }

  protected payInvoice(invoiceId: string): void {
    if (!this.currentUser || this.currentUser.role !== 'patient') {
      return;
    }

    try {
      this.healthcareDataService.markInvoiceAsPaid(invoiceId, this.currentUser.id);
      this.refreshFilteredInvoices();
      this.billingMessage = 'Invoice payment recorded successfully.';
      this.billingError = '';
    } catch {
      this.billingError = 'Invoice payment could not be completed.';
      this.billingMessage = '';
    }
  }

  protected canPay(invoice: Invoice): boolean {
    return this.currentUser?.role === 'patient' && invoice.status !== 'paid';
  }

  protected get isAdminView(): boolean {
    return this.currentUser?.role === 'admin';
  }

  private refreshSummary(): void {
    this.pendingCount = this.invoices.filter((invoice) => invoice.status === 'pending').length;
    this.overdueCount = this.invoices.filter((invoice) => invoice.status === 'overdue').length;
    this.paidCount = this.invoices.filter((invoice) => invoice.status === 'paid').length;
    this.totalOutstanding = this.invoices
      .filter((invoice) => invoice.status !== 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    this.totalPaidAmount = this.invoices
      .filter((invoice) => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
  }
}