import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Invoice, User } from '../../core/models/healthcare.models';
import { AuthService } from '../../core/services/auth.service';
import { HealthcareDataService } from '../../core/services/healthcare-data.service';

type InvoiceFilter = 'all' | 'pending' | 'paid' | 'overdue';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing.page.html',
  styleUrl: './billing.page.scss'
})
export class BillingPageComponent implements OnInit {
  protected currentUser: User | null = null;
  protected readonly invoices: Invoice[] = [];
  protected readonly filteredInvoices: Invoice[] = [];
  protected selectedFilter: InvoiceFilter = 'all';
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
      this.applyFilter(this.selectedFilter);
      this.isLoading = false;
    });
  }

  protected applyFilter(filter: InvoiceFilter): void {
    this.selectedFilter = filter;
    this.filteredInvoices.splice(
      0,
      this.filteredInvoices.length,
      ...this.invoices.filter((invoice) => filter === 'all' || invoice.status === filter)
    );
  }

  protected payInvoice(invoiceId: string): void {
    if (!this.currentUser || this.currentUser.role !== 'patient') {
      return;
    }

    try {
      this.healthcareDataService.markInvoiceAsPaid(invoiceId, this.currentUser.id);
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