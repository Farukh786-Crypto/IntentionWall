import { Component, DestroyRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectChangeEvent, SelectModule } from 'primeng/select';
import { PopoverModule } from 'primeng/popover';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { Adminleftsidepanel } from '../adminleftsidepanel/adminleftsidepanel';
import { ApiHandlerService } from '../../../common/services';
import { DropdownOption, Message, Records } from '../../../common/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageFilter } from '../../../common/models/message-filter';
import { MessagePagination } from '../../../common/models/pagination.model';
import { DateFilter } from '../../../common/models/date-filter.model';
import { AdminService } from '../../../common/services/admin.service';
import { AuditLogParams } from '../../../common/models/audit-logs-parameters.model';
import { ConfigurationService } from '../../../common/services/configure.service';
import { MessageFilterService } from '../../../common/services/message-filter.service';
@Component({
  imports: [CommonModule, FormsModule, Adminleftsidepanel, TableModule, ButtonModule, InputTextModule, SelectModule, IconFieldModule, PopoverModule, DatePicker, FormsModule, InputIconModule],
  selector: 'IntentionWall-audit-logs',
  styleUrl: './audit-logs.scss',
  templateUrl: './audit-logs.html',
})

export class AuditLogs implements OnInit, OnDestroy {
  // services
  private readonly apiHandler = inject(ApiHandlerService);
  private readonly adminService = inject(AdminService);
  private readonly messageFilterService = inject(MessageFilterService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly destroyRef = inject(DestroyRef);
  auditLogParams = new AuditLogParams();
  readonly actionList = signal<DropdownOption[]>([]);
  readonly performedByList = signal<DropdownOption[]>([]);
  readonly recordLists = signal<Records[]>([]);

  isViewOpened = signal<boolean>(false);
  collapsed: boolean = false;
  @ViewChild('dt1') dt1!: Table;

  // select option Model class
  messageFilter = new MessageFilter();
  // page Model class class 
  messagePagination = new MessagePagination();
  // pass to Input() 
  message!: Message;
  private readonly visiblePageCount = 5;


  ngOnInit(): void {
    this.getAuditFilters();
    this.initializeStatus();
  }

  initializeStatus() {
    this.auditLogParams.pageSize = this.configurationService.backendPageSize;
    // called api here
    this.getAuditLogs();
  }


  getAuditFilters() {
    // get Audit Filters
    this.apiHandler.execute({
      apiCall: () => this.adminService.getAuditFilters(),
      successMessage: 'Audit filters loaded successfully.',
      errorMessage: 'Unable to load audit filters. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success && res.Data) {
          if (Array.isArray(res.Data.actions) && Array.isArray(res.Data.performedBy)) {
            this.actionList.set(res.Data.actions.map((action: string) => ({
              label: action,
              value: action
            })));
            this.performedByList.set(res.Data.performedBy.map((action: string) => ({
              label: action,
              value: action
            })));
          }
        }
      }
    })
  }


  getAuditLogs(targetBackendPage?: number) {
    // page Request
    const pageToLoad = targetBackendPage ?? this.auditLogParams.page;
    // params build 
    const params = {
      ...this.auditLogParams.buildAuditQueryParams(),
      page: pageToLoad
    }
    // get Audit Logs api here
    this.apiHandler.execute({
      apiCall: () => this.adminService.getAuditLogs(params),
      errorMessage: 'Unable to load audit logs. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success && res.Data) {
          this.messagePagination.totalRecords = res.Data.TotalCount;
          this.recordLists.set(res.Data.Records);
          // update backend pages
          this.messagePagination.backendpage = pageToLoad;
          // update UI Pagination
          this.messagePagination.pageNumber.set(
            ((pageToLoad - 1) *
              this.pagesPerBackendBatch) + 1
          );
        }
      }
    })

  }

  isCollpased(value: boolean) {
    this.collapsed = value;
  }

  onModuleChange(event: SelectChangeEvent) {
    this.resetPage()
    this.auditLogParams.action = event.value;
    this.auditLogParams.pageSize = this.configurationService.backendPageSize;
    this.getAuditLogs();
  }

  onPerformedChange(event: SelectChangeEvent) {
    this.resetPage()
    this.auditLogParams.performedby = event.value;
    this.auditLogParams.pageSize = this.configurationService.backendPageSize;
    this.getAuditLogs();
  }

  ResetFilter(table: Table) {
    this.auditLogParams = new AuditLogParams();
    table.clear();
    this.ResetSelect();
    this.messagePagination = new MessagePagination();
    this.initializeStatus();
  }

  private ResetSelect() {
    this.messageFilter = new MessageFilter();
  }

  dateFilter = new DateFilter();

  applyDateFilter(popover: any): void {
    this.resetPage();
    // passed Parameter To getWalls()
    this.auditLogParams.fromDate = this.dateFilter.fromDate;
    this.auditLogParams.toDate = this.dateFilter.toDate;
    // called api here..
    this.getAuditLogs();
    popover.hide();
  }


  get dateRangeLabel(): string {
    if (!this.dateFilter.fromDate || !this.dateFilter.toDate) {
      return 'Select Date Range';
    }

    return `${this.formatDate(this.dateFilter.fromDate)} - ${this.formatDate(this.dateFilter.toDate)}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  DetailPanelOpened(value: boolean) {
    this.isViewOpened.set(value);
  }

  messageReviewed(intention: Message) {
    // called admin right panel component here
    this.isViewOpened.set(true);
    this.message = intention;
  }

  get backendEndPage(): number {
    return Math.min(
      this.batchStartPage + this.pagesPerBackendBatch - 1,
      this.totalPages
    );
  }
  get visibleStartPage(): number {
    const currentPage = this.messagePagination.pageNumber();

    return (
      Math.floor(
        (currentPage - this.batchStartPage) / this.visiblePageCount
      ) * this.visiblePageCount
    ) + this.batchStartPage;
  }

  get visibleEndPage(): number {
    return Math.min(
      this.visibleStartPage + this.visiblePageCount - 1,
      this.backendEndPage
    );
  }

  // visible pages logic
  get visiblePages(): number[] {
    const pages: number[] = [];

    for (let page = this.visibleStartPage; page <= this.visibleEndPage; page++) {
      pages.push(page);
    }
    return pages;
  }

  previousPageBatch(): void {
    if (this.visibleStartPage <= this.batchStartPage) {
      return;
    }

    this.messagePagination.pageNumber.set(
      this.visibleStartPage - this.visiblePageCount
    );
  }

  nextPageBatch(): void {
    if (this.visibleEndPage >= this.backendEndPage) {
      return;
    }
    this.messagePagination.pageNumber.set(
      this.visibleStartPage + this.visiblePageCount
    );
  }

  onPageChange(event: any) {
    this.messagePagination.page = (event.first / event.rows) + 1
    this.messagePagination.pageSize = this.configurationService.adminPageSize;
  }

  get totalPages(): number {
    this.messagePagination.pageSize = this.configurationService.adminPageSize ?? this.messagePagination.pageSize;
    return Math.ceil(this.messagePagination.totalRecords / this.messagePagination.pageSize);
  }

  get pagesPerBackendBatch(): number {
    return Math.ceil(this.configurationService.backendPageSize / this.configurationService.adminPageSize);
  }

  get batchStartPage(): number {
    return ((this.messagePagination.backendpage - 1) * this.pagesPerBackendBatch) + 1;
  }

  get batchEndPage(): number {
    return Math.min(this.messagePagination.backendpage * this.pagesPerBackendBatch, this.totalPages);
  }

  get batchPages(): number[] {
    const pages: number[] = [];
    for (let page = this.batchStartPage; page <= this.batchEndPage; page++) {
      pages.push(page);
    }
    return pages;
  }

  paginatedMessages(): any[] {
    this.messagePagination.pageSize = this.configurationService.adminPageSize ?? this.messagePagination.pageSize;
    const pageInsideBatch = this.messagePagination.pageNumber() - this.batchStartPage;
    const startIndex = pageInsideBatch * this.messagePagination.pageSize;
    const endIndex = startIndex + this.messagePagination.pageSize;
    return this.recordLists().slice(startIndex, endIndex);
  }

  loadPageData(page: number): void {
    this.messagePagination.pageNumber.set(page);
  }

  previousPage(): void {
    if (this.messagePagination.pageNumber() > this.visibleStartPage) {
      this.messagePagination.pageNumber.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.messagePagination.pageNumber() < this.backendEndPage) {
      this.messagePagination.pageNumber.update(page => page + 1);
    }
  }

  get hasPreviousBatch(): boolean {
    return (
      this.messagePagination.pageNumber() === this.batchStartPage && this.batchStartPage > 1
    );
  }

  get hasNextBatch(): boolean {
    return (
      this.messagePagination.pageNumber() === this.backendEndPage && this.backendEndPage < this.totalPages
    );
  }

  nextBatch(): void {
    const nextBackendPage = this.messagePagination.backendpage + 1;
  }

  previousBatch(): void {
    if (this.messagePagination.backendpage <= 1) {
      return;
    }
  }

  resetPage() {
    this.messagePagination = new MessagePagination();
  }

  clearDateFilter() {
    // called service function here ..
    this.auditLogParams.clearFilters();
  }

  ngOnDestroy(): void {
    this.clearDateFilter();
    this.ResetSelect()
  }

}
