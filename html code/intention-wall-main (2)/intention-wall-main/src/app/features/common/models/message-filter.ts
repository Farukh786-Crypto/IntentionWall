export class MessageFilter {
    selectZoneId: number | null = null;
    selectTraditionId: number | null = null;
    selectCountryId: number | null = null;
    selectdateRange: { fromDate: Date | undefined; toDate: Date | undefined } = ({ fromDate: undefined, toDate: undefined });
}