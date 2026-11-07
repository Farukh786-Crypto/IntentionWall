import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, DestroyRef, effect, ElementRef, HostListener, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ApiHandlerService, Scroll } from '../../../common/services';
import { ApplicationuserService } from '../../../common/services/applicationuser.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiResponse, ApplicationSetting, ColumnCount, Message, PUBLIC_WALL_CONFIG, settingkeyName, SettingKeys, StringEmpty } from '../../../common/models';
import { timer } from 'rxjs';
import { LookupStore } from '../../../common/services/api-store';

@Component({
  imports: [CommonModule],
  selector: 'IntentionWall-wall',
  styleUrl: './wall.scss',
  templateUrl: './wall.html',
})
export class Wall implements OnInit, AfterViewInit, OnDestroy {
  // inject service
  private readonly apiHandler = inject(ApiHandlerService);
  private scrollservice = inject(Scroll);
  private readonly applicationUserService = inject(ApplicationuserService);
  private readonly destroyRef = inject(DestroyRef);

  // variables
  readonly messageList = signal<Message[]>([]);
  messageCount = signal<number>(0);
  private readonly zoneStore = inject(LookupStore);
  readonly zoneList = this.zoneStore.zonesListOptions;
  selectedZoneId = signal<string | null>(null);
  pageNumber = PUBLIC_WALL_CONFIG.pageNumber;
  readonly cardMoveDurationSeconds = PUBLIC_WALL_CONFIG.cardMoveDurationSeconds;
  private isFirstPooling: boolean = true;
  shareModal = signal<boolean>(false);
  shareUrl = signal<string>(StringEmpty);
  shareCopied = signal<boolean>(false);
  // "Share via" links, same formats and text as the static site's updateShareChannelLinks().
  private readonly shareText = 'Join me on The Intention Wall';
  readonly whatsappShareHref = computed(() =>
    `https://wa.me/?text=${encodeURIComponent(`${this.shareText} ${this.shareUrl()}`)}`);
  readonly twitterShareHref = computed(() =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.shareUrl())}&text=${encodeURIComponent(this.shareText)}`);
  readonly gmailShareHref = computed(() =>
    `mailto:?subject=${encodeURIComponent('The Intention Wall')}&body=${encodeURIComponent(`${this.shareText}\n\n${this.shareUrl()}`)}`);
  readonly linkedInShareHref = computed(() =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.shareUrl())}`);
  readonly facebookShareHref = computed(() =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl())}`);
  isfocused = signal<boolean>(false);

  // Page scroll locks while the share modal or focus mode is open, like the static site.
  private readonly bodyClassEffect = effect(() => {
    document.body.classList.toggle('is-share-modal-open', this.shareModal());
    document.body.classList.toggle('is-wall-focus', this.isfocused());
  });
  // Column count follows the CSS breakpoints (767px / 1023px), like the static site's getWallColumnCount().
  private readonly oneColumnQuery = window.matchMedia('(max-width: 767px)');
  private readonly twoColumnQuery = window.matchMedia('(max-width: 1023px)');
  private readonly columnCount = signal(this.getColumnCount());
  private readonly minCardsPerColumn = 12;
  private pollingIntervalMinutes = 0;
  private pollingMessageCountInterval = 0;
  private pazeSettingVal = 0;
  private wallColumn1_InSeconds = PUBLIC_WALL_CONFIG.wallColumn1_InSeconds;
  private wallColumn2_InSeconds = PUBLIC_WALL_CONFIG.wallColumn2_InSeconds;
  private wallColumn3_InSeconds = PUBLIC_WALL_CONFIG.wallColumn3_InSeconds;
  readonly columns = computed((): Message[][] => {
    const items = this.messageList();
    const columnCount = this.columnCount();
    const buckets: Message[][] = Array.from({ length: columnCount }, () => []);

    items.forEach((message, index) => {
      buckets[index % columnCount].push(message);
    });

    return buckets.map((bucket) => {
      const source = bucket.length > 0 ? bucket : items;
      return this.repeatForDrift(source);
    });
  });

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();

    this.scrollservice.scrollToSection(sectionId);
  }

  private getColumnCount(): number {
    if (this.oneColumnQuery.matches) {
      return 1;
    }

    if (this.twoColumnQuery.matches) {
      return 2;
    }

    return ColumnCount;
  }

  // wall animation duration based on column count
  private getWallDurations(columnCount: number): string[] {
    if (columnCount === 1) {
      return [this.wallColumn1_InSeconds];
    }

    if (columnCount === 2) {
      return [this.wallColumn1_InSeconds, this.wallColumn2_InSeconds];
    }

    return [this.wallColumn1_InSeconds, this.wallColumn2_InSeconds, this.wallColumn3_InSeconds];
  }

  // animation duration for each generated column
  readonly columnDurations = computed(() => this.getWallDurations(this.columnCount()));

  private wallTabsScrollRaf: number | null = null;
  private wallTabsScrollDirection = 0;
  private wallTabsScrollCleanup: (() => void)[] = [];

  @ViewChild('wallTabsScroll') private wallTabsScroll!: ElementRef<HTMLElement>;
  @ViewChild('wallTabsStartEdge') private wallTabsStartEdge!: ElementRef<HTMLElement>;
  @ViewChild('wallTabsEndEdge') private wallTabsEndEdge!: ElementRef<HTMLElement>;
  @ViewChild('shareChannels') private shareChannels!: ElementRef<HTMLElement>;

  // "Share via" row: the arrow buttons exist only while the row overflows, and each hides at its end.
  readonly shareScroll = signal(
    { overflow: false, atStart: true, atEnd: true },
    { equal: (a, b) => a.overflow === b.overflow && a.atStart === b.atStart && a.atEnd === b.atEnd }
  );

  ngOnInit(): void {
    this.loadSettingsByKeys();

    // re-flow the wall when the viewport crosses a column breakpoint
    const updateColumnCount = (): void => { this.columnCount.set(this.getColumnCount()); };
    this.oneColumnQuery.addEventListener('change', updateColumnCount);
    this.twoColumnQuery.addEventListener('change', updateColumnCount);
    this.destroyRef.onDestroy(() => {
      // never leave the page locked when leaving this route
      document.body.classList.remove('is-share-modal-open', 'is-wall-focus');
      this.oneColumnQuery.removeEventListener('change', updateColumnCount);
      this.twoColumnQuery.removeEventListener('change', updateColumnCount);
    });
  }

  loadSettingsByKeys() {
    // Request Body
    const request = { keys: SettingKeys.join(',') };
    // post api called for get all setting configuration with keys.
    this.apiHandler.execute({
      apiCall: () => this.applicationUserService.showSettingBykeys(request),
      showSpinner: false
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success && Array.isArray(res.Data)) {
          // called private method here for extract key and get its value ..
          this.applySettings(res.Data);
          // called pooling api again 
          this.startPolling();
        }
      }
    })
  }

  // find pollingIntervalMinutes,pageSize,wallColumn keys
  private applySettings(settings: ApplicationSetting[]): void {
    this.wallColumn1_InSeconds = this.getSettingValue(settings, settingkeyName.wallColumn1InSeconds) ?? PUBLIC_WALL_CONFIG.wallColumn1_InSeconds;
    this.wallColumn2_InSeconds = this.getSettingValue(settings, settingkeyName.wallColumn2InSeconds) ?? PUBLIC_WALL_CONFIG.wallColumn2_InSeconds;
    this.wallColumn3_InSeconds = this.getSettingValue(settings, settingkeyName.wallColumn3InSeconds) ?? PUBLIC_WALL_CONFIG.wallColumn3_InSeconds;
    this.pollingIntervalMinutes = Number(this.getSettingValue(settings, settingkeyName.pollingIntervalMinutes) ?? PUBLIC_WALL_CONFIG.poolingIntervalMinutes);
    this.pollingMessageCountInterval = Number(this.getSettingValue(settings, settingkeyName.WallCountInMinutes) ?? PUBLIC_WALL_CONFIG.pollingMessageCountIntervalInMinutes);
    this.pazeSettingVal = Number(this.getSettingValue(settings, settingkeyName.publicPageSize)) ?? PUBLIC_WALL_CONFIG.publicPageSize;
  }

  private getSettingValue(settings: ApplicationSetting[], key: string): string | undefined {
    return settings.find(setting => setting.Key === key)?.Value;
  }

  startPolling(): void {
    // pooling Wall Message
    let poolingInterval = this.pollingIntervalMinutes * 60 * 1000;
    timer(0, poolingInterval).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.isFirstPooling) {
        this.pageNumber++;
      }
      this.isFirstPooling = false;
      this.getWalls();
    })
    // pooling Wall Message Count
    let poolingMessageCountInterval = this.pollingMessageCountInterval * 60 * 1000;
    timer(0, poolingMessageCountInterval).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.getWallsCount();
    })
  }

  // wall scroll here ..
  ngAfterViewInit(): void {
    this.initWallTabsScroll();
    this.initShareChannelsScroll();
  }

  // re-check the "Share via" row when it is resized (this also fires when the modal opens)
  private initShareChannelsScroll(): void {
    const row = this.shareChannels?.nativeElement;
    if (!row) {
      return;
    }

    const observer = new ResizeObserver(() => this.updateShareScroll());
    observer.observe(row);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  updateShareScroll(): void {
    const row = this.shareChannels?.nativeElement;
    if (!row) {
      return;
    }

    this.shareScroll.set({
      overflow: row.scrollWidth > row.clientWidth + 1,
      atStart: row.scrollLeft <= 1,
      atEnd: row.scrollLeft + row.clientWidth >= row.scrollWidth - 1
    });
  }

  // Scroll the "Share via" row by one option: the next option's left edge lands just inside the left arrow
  // (the row's scroll-padding is the width of the arrow and its fade), so it never ends up under it.
  scrollShareChannels(direction: -1 | 1): void {
    const row = this.shareChannels?.nativeElement;
    if (!row) {
      return;
    }

    const padding = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
    // layout offsets, so the modal's open animation (a transform) cannot skew them
    const options = Array.from(row.children as HTMLCollectionOf<HTMLElement>, option => ({
      left: option.offsetLeft - row.offsetLeft
    }));

    // the option that should sit at the arrow's edge next; none left means go to the end of the row
    const target = direction > 0
      ? options.find(option => option.left > row.scrollLeft + padding + 1)
      : [...options].reverse().find(option => option.left < row.scrollLeft + padding - 1);
    const left = target ? target.left - padding : (direction > 0 ? row.scrollWidth : 0);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // initialize horizontal wall tabs scrolling
  private initWallTabsScroll(): void {

    const scrollEl = this.wallTabsScroll?.nativeElement;
    const startEdge = this.wallTabsStartEdge?.nativeElement;
    const endEdge = this.wallTabsEndEdge?.nativeElement;

    if (!scrollEl || !startEdge || !endEdge) {
      return;
    }

    const updateEdges = (): void => {

      const {
        scrollLeft,
        scrollWidth,
        clientWidth
      } = scrollEl;

      const hasOverflow = scrollWidth > clientWidth + 1;

      const atStart = scrollLeft <= 1;

      const atEnd =
        scrollLeft + clientWidth >= scrollWidth - 1;

      startEdge.classList.toggle(
        'is-hidden',
        !hasOverflow || atStart
      );

      endEdge.classList.toggle(
        'is-hidden',
        !hasOverflow || atEnd
      );
    };

    const stopScroll = (): void => {

      this.wallTabsScrollDirection = 0;

    };

    const tick = (): void => {
      if (this.wallTabsScrollDirection === 0) {
        this.wallTabsScrollRaf = null;
        return;
      }

      const { scrollLeft, scrollWidth, clientWidth } = scrollEl;

      const atStart = scrollLeft <= 1;

      const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;

      if ((this.wallTabsScrollDirection < 0 && atStart) || (this.wallTabsScrollDirection > 0 && atEnd)) {
        stopScroll();
        updateEdges();
        this.wallTabsScrollRaf = null;
        return;
      }

      // scrolling speed
      scrollEl.scrollLeft += this.wallTabsScrollDirection * 5;

      updateEdges();
      this.wallTabsScrollRaf = requestAnimationFrame(tick);
    };

    const startScroll = (direction: number): void => {
      this.wallTabsScrollDirection = direction;
      if (!this.wallTabsScrollRaf) {
        this.wallTabsScrollRaf =
          requestAnimationFrame(tick);
      }
    };

    const onStartMouseEnter = (): void => { startScroll(-1); };

    const onStartMouseLeave = (): void => { stopScroll(); };

    const onEndMouseEnter = (): void => { startScroll(1); };

    const onEndMouseLeave = (): void => { stopScroll(); };

    const onScroll = (): void => { updateEdges(); };

    const onResize = (): void => { updateEdges(); };

    startEdge.addEventListener('mouseenter', onStartMouseEnter);

    startEdge.addEventListener('mouseleave', onStartMouseLeave);

    endEdge.addEventListener('mouseenter', onEndMouseEnter);

    endEdge.addEventListener('mouseleave', onEndMouseLeave);

    scrollEl.addEventListener('scroll', onScroll, { passive: true });

    window.addEventListener('resize', onResize);

    // keep cleanup functions
    this.wallTabsScrollCleanup = [
      () => { startEdge.removeEventListener('mouseenter', onStartMouseEnter); },

      () => { startEdge.removeEventListener('mouseleave', onStartMouseLeave); },

      () => { endEdge.removeEventListener('mouseenter', onEndMouseEnter); },

      () => { endEdge.removeEventListener('mouseleave', onEndMouseLeave); },

      () => {
        scrollEl.removeEventListener(
          'scroll',
          onScroll
        );
      },

      () => { window.removeEventListener('resize', onResize); }
    ];

    updateEdges();
  }

  getZones() {
    //called get zones api
    this.zoneStore.loadZones();
  }

  toggleWallFocusMode() {
    this.isfocused.update(val => !val);
  }

  // Escape closes only the topmost layer: the share modal sits above focus mode.
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.shareModal()) {
      this.closeShareWall();
      return;
    }

    if (this.isfocused()) {
      this.isfocused.set(false);
    }
  }

  getWallsCount() {
    // called get zones api
    this.apiHandler.execute({
      apiCall: () => this.applicationUserService.getAllApprovedMessagesCount(),
      showSpinner: false
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          this.messageCount.set(res.Data);
        }
      }
    })
  }

  getWalls(zoneId?: string) {
    // called get zones api
    this.apiHandler.execute({
      apiCall: () => this.applicationUserService.getAllApprovedMessages({ zoneId: zoneId, page: this.pageNumber, pageSize: this.pazeSettingVal }),
      showSpinner: false
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res && res.Data) {
          // if array empty then dont delete existing array element
          if (Array.isArray(res.Data.Messages) && res.Data.Messages.length > 0) {
            this.messageList.set(res.Data.Messages);
          }
          if (Array.isArray(res.Data.Messages) && res.Data.Messages.length === 0) {
            this.messageList.set([]);
          }
        }
      }
    })
  }

  // share functionality
  private getWallShareFullUrl(): string {
    const zone = this.getActiveZoneFilter();
    const base = `${window.location.origin}/intentionwall`;
    return zone ? `${base}?zone=${encodeURIComponent(zone)}#wall` : `${base}#wall`;
  }

  private getActiveZoneFilter(): string | null {
    const selectedZoneId = this.selectedZoneId();
    if (!selectedZoneId) {
      return null;
    }
    const selectedZone = this.zoneList().find(
      zone => zone.Id === selectedZoneId
    );
    return selectedZone?.Name ?? null;
  }

  shareWall() {
    const url = this.getWallShareFullUrl();
    this.shareUrl.set(url);
    // reset copy state
    this.shareCopied.set(false);
    // modal open
    this.shareModal.set(true);
  }

  closeShareWall() {
    this.shareModal.set(false);
  }

  // copies the share URL to clipboard
  async copyWallShareUrl(): Promise<void> {
    const url = this.shareUrl();
    if (!url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.shareCopied.set(true);
      // Reset after 2 seconds
      window.setTimeout(() => {
        this.shareCopied.set(false);
      }, 2000);

    } catch (error) {
      console.error(
        'Failed to copy share URL:',
        error
      );
    }
  }

  onAllWallsClick(): void {
    this.selectedZoneId.set(null);
    this.getWalls();
  }

  onMeesagesByZoneId(zoneId: string) {
    this.selectedZoneId.set(zoneId);
    this.getWalls(zoneId);
  }


  // repeat cards so the vertical wall drift has enough content
  private repeatForDrift(source: Message[]): Message[] {
    if (source.length === 0) {
      return [];
    }
    const copies = Math.max(1, Math.ceil(this.minCardsPerColumn / source.length));
    const looped: Message[] = [];
    for (let copy = 0; copy < copies; copy++) {
      looped.push(...source);
    }
    return looped;
  }

  ngOnDestroy(): void {
    // Stop automatic scrolling
    this.wallTabsScrollDirection = 0;
    // Cancel pending animation frame
    if (this.wallTabsScrollRaf !== null) {
      cancelAnimationFrame(
        this.wallTabsScrollRaf
      );
      this.wallTabsScrollRaf = null;
    }
    // Remove event listeners
    this.wallTabsScrollCleanup.forEach(
      cleanup => cleanup()
    );

    this.wallTabsScrollCleanup = [];
  }

}
