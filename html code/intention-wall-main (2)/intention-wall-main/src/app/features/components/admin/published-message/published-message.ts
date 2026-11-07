import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Message, STATUS } from '../../../common/models';
import { Table, TableModule } from 'primeng/table';
import { SelectChangeEvent, SelectModule } from 'primeng/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationuserService } from '../../../common/services/applicationuser.service';
import { ApiHandlerService } from '../../../common/services';
import { LookupStore } from '../../../common/services/api-store';
import { FormsModule } from '@angular/forms';
import { Adminrightsidemessagepanel } from '../adminrightsidemessagepanel/adminrightsidemessagepanel';
import { Adminleftsidepanel } from '../adminleftsidepanel/adminleftsidepanel';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { PopoverModule } from 'primeng/popover';
import { DatePicker } from 'primeng/datepicker';
import { InputIconModule } from 'primeng/inputicon';
import { MessageFilterService } from '../../../common/services/message-filter.service';
import { MessageFilter } from '../../../common/models/message-filter';
import { MessagePagination } from '../../../common/models/pagination.model';
import { DateFilter } from '../../../common/models/date-filter.model';
import { Subject } from 'rxjs';
import { ConfigurationService } from '../../../common/services/configure.service';

@Component({
  imports: [CommonModule, FormsModule, Adminrightsidemessagepanel, Adminleftsidepanel, TableModule, ButtonModule, DatePicker, InputTextModule, SelectModule, IconFieldModule, PopoverModule, FormsModule, InputIconModule],
  selector: 'IntentionWall-published-message',
  styleUrl: './published-message.scss',
  templateUrl: './published-message.html',
})

export class PublishedMessage implements OnInit, OnDestroy {
  // services
  private readonly apiHandler = inject(ApiHandlerService);
  private readonly applicationUserService = inject(ApplicationuserService);
  private readonly messageFilterService = inject(MessageFilterService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lookupStore = inject(LookupStore);
  readonly countriesList = this.lookupStore.countriesListOptions;
  readonly traditionList = this.lookupStore.traditionListOptions;
  readonly zoneList = this.lookupStore.zonesListOptions;
  readonly messageList = signal<Message[]>([]);
  private searchSubject = new Subject<string>();

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
    this.lookupStore.loadAdminMessagesSelectOption();
    this.lookupStore.loadSetting();
    this.initializeStatus();

  }

  initializeStatus() {
    this.messageFilterService.selectedStatus = STATUS.Approved;
    this.messageFilterService.pageSize = this.configurationService.backendPageSize;
    this.getWalls();
  }

  getWalls(targetBackendPage?: number) {
    // page request
    const pageToLoad = targetBackendPage ?? this.messageFilterService.page;
    // params build 
    const params = { ...this.messageFilterService.buildQueryParams(), page: pageToLoad }
    // api called 
    this.apiHandler.execute({
      apiCall: () => this.applicationUserService.getAllMessage(params),
      errorMessage: 'Unable to load messages. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.Data?.Messages)) {
          this.messageList.set(res.Data?.Messages ?? []);
          this.messagePagination.totalRecords = res.Data.TotalCount;
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

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  isCollpased(value: boolean) {
    this.collapsed = value;
  }

  onZoneChange(Id: SelectChangeEvent) {
    this.resetPage();
    const zoneId = Id.value;
    this.messageFilter.selectZoneId = zoneId
    // passed paramter to getWalls()
    this.messageFilterService.selectZoneId = zoneId;
    this.messageFilterService.selectedStatus = STATUS.Rejected;
    // called api here..
    this.messageFilterService.pageSize = this.configurationService.backendPageSize;
    this.getWalls();
  }

  onTraditionChange(Id: SelectChangeEvent) {
    this.resetPage();
    const traditionId = Id.value;
    this.messageFilter.selectTraditionId = traditionId;
    // passed Parameter To getWalls()
    this.messageFilterService.selectTraditionId = traditionId;
    this.messageFilterService.selectedStatus = STATUS.Rejected;

    // called api here..
    this.messageFilterService.pageSize = this.configurationService.backendPageSize;
    this.getWalls();
  }

  onCountryChange(Id: SelectChangeEvent) {
    this.resetPage();
    const countryId = Id.value;
    this.messageFilter.selectCountryId = countryId;
    // passed Parameter To getWalls()
    this.messageFilterService.selectCountryId = countryId;
    this.messageFilterService.selectedStatus = STATUS.Rejected;
    // called api here..
    this.messageFilterService.pageSize = this.configurationService.backendPageSize;
    this.getWalls();
  }

  ResetFilter(table: Table) {
    this.messageFilterService.clearFilters();
    table.clear();
    this.ResetSelect();
    this.messagePagination = new MessagePagination();
    // this.messagePagination.pageNumber.set(1);
    this.messageList.set([]);
    // after reset called api again
    this.initializeStatus();
  }

  private ResetSelect() {
    this.messageFilter = new MessageFilter();
  }

  dateFilter = new DateFilter();

  applyDateFilter(popover: any): void {
    this.resetPage();
    // passed Parameter To getWalls()
    this.messageFilterService.selectedFromDate = this.dateFilter.fromDate;
    this.messageFilterService.selectedToDate = this.dateFilter.toDate;
    // called api here..
    this.getWalls();
    popover.hide();
  }


  get dateRangeLabel(): string {
    if (!this.dateFilter.fromDate || !this.dateFilter.toDate) {
      return 'Select Date Range';
    }
    return `${this.formatDate(this.dateFilter.fromDate)} - ${this.formatDate(this.dateFilter.toDate)}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  }

  DetailPanelOpened(value: boolean) {
    this.isViewOpened.set(value);
  }


  messageReviewed(intention: Message) {
    // called admin right panel component here
    this.isViewOpened.set(true);
    this.message = intention;
  }

  onPageChange(event: any) {
    this.messagePagination.page = (event.first / event.rows) + 1
    this.messagePagination.pageSize = this.configurationService.adminPageSize;
    // called api here
    this.getWalls();
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

  get backendEndPage(): number {
    return Math.min(this.batchStartPage + this.pagesPerBackendBatch - 1, this.totalPages);
  }
  get visibleStartPage(): number {
    const currentPage = this.messagePagination.pageNumber();
    return (
      Math.floor((currentPage - this.batchStartPage) / this.visiblePageCount) * this.visiblePageCount) + this.batchStartPage;
  }

  get visibleEndPage(): number {
    return Math.min(this.visibleStartPage + this.visiblePageCount - 1, this.backendEndPage);
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

  paginatedMessages(): any[] {
    this.messagePagination.pageSize = this.configurationService.adminPageSize ?? this.messagePagination.pageSize;
    const pageInsideBatch =
      this.messagePagination.pageNumber() - this.batchStartPage;
    const startIndex =
      pageInsideBatch * this.messagePagination.pageSize;
    const endIndex =
      startIndex + this.messagePagination.pageSize;

    return this.messageList().slice(
      startIndex,
      endIndex
    );
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
    return (this.messagePagination.pageNumber() === this.batchStartPage && this.batchStartPage > 1);
  }

  get hasNextBatch(): boolean {
    return (this.messagePagination.pageNumber() === this.backendEndPage && this.backendEndPage < this.totalPages);
  }

  nextBatch(): void {
    const nextBackendPage =
      this.messagePagination.backendpage + 1;

    // only call API
    // Do not change pagination before API response
    this.getWalls(nextBackendPage);
  }

  previousBatch(): void {
    if (this.messagePagination.backendpage <= 1) {
      return;
    }
    const previousBackendPage = this.messagePagination.backendpage - 1;

    // only call API
    // Do not change pagination before API response
    this.getWalls(previousBackendPage);
  }

  resetPage() {
    this.messagePagination = new MessagePagination();
  }

  onMessageApproved(approvedMessageId: string) {
    if (!approvedMessageId) {
      return;
    }
    if (approvedMessageId) {
      this.messageList.update(messages => messages.filter(a => a.Id !== approvedMessageId));
    }

    this.messagePagination.totalRecords = Math.max(
      0,
      this.messagePagination.totalRecords - 1
    );
    const currentPage = this.messagePagination.pageNumber();
    const newTotalPages = Math.ceil(
      this.messagePagination.totalRecords /
      this.configurationService.adminPageSize
    );
    if (currentPage > newTotalPages) {
      this.messagePagination.pageNumber.set(
        Math.max(1, newTotalPages)
      );
    }
  }

  clearDateFilter() {
    // called service function here ..
    this.messageFilterService.clearFilters();
  }

  ngOnDestroy(): void {
    this.clearDateFilter();
    this.lookupStore.clearZoneList();
    this.lookupStore.clearLookStorage();
    this.ResetSelect()
  }

}
