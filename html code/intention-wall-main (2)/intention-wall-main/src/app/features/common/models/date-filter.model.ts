export class DateFilter {
    fromDate: Date | undefined = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    toDate: Date | undefined = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // 0 means the last day of the previous month
    selectedFromDate: Date | undefined = this.fromDate;
    selectedToDate: Date | undefined = this.toDate;
}