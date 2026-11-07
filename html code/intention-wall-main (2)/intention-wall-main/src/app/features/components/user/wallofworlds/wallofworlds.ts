import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, ElementRef, HostListener, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { feature } from 'topojson-client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IZone, TotalSlides, WallMap, ZoneApiMapResponse } from '../../../common/models';
import { AdminService, ApiHandlerService, Scroll } from '../../../common/services';


const DefaultIcon = L.icon({
  iconRetinaUrl: 'leaflet/images/marker-icon-2x.png',
  iconUrl: 'leaflet/images/marker-icon.png',
  shadowUrl: 'leaflet/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

@Component({
  selector: 'IntentionWall-wallofworlds',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './wallofworlds.scss',
  templateUrl: './wallofworlds.html'
})
export class Wallofworlds implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly apiHandler = inject(ApiHandlerService);
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  private scrollservice = inject(Scroll);
  readonly currentSlide = signal(0);
  readonly isCarouselEnhanced = signal(false);
  readonly totalSlides = TotalSlides;

  // get the actual map div from Angular template
  @ViewChild('worldMap', { static: false })
  private worldMapElement!: ElementRef<HTMLDivElement>;
  // reference to zone chooser DOM element
  @ViewChild('zoneChooser', { static: false })
  private zoneChooserElement!: ElementRef<HTMLDivElement>;
  private readonly ZONE_CHOOSER_GAP = 16;
  private readonly ZONE_CHOOSER_MARGIN = 8;
  selectedWall: WallMap | null = null;
  wallOverlayOpened = signal<boolean>(false);
  private worldMap!: L.Map;
  zoneList = signal<IZone[]>([]);
  Walls: WallMap[] = [];
  // stores zones belonging to the clicked country.
  zoneChooserWalls: WallMap[] = [];
  zoneChooserOpened = signal<boolean>(false);

  private playingVideo: {
    iframe: HTMLIFrameElement;
    poster: HTMLElement;
    heading: HTMLElement | null;
    headingParent: Node | null;
    headingNext: ChildNode | null;
  } | null = null;

  private readonly WORLD_ATLAS_COUNTRY_NAMES: Record<string, string> = {
    'United States': 'United States of America',
    'Central African Republic': 'Central African Rep.',
    'Democratic Republic of the Congo': 'Dem. Rep. Congo',
    'Republic of the Congo': 'Congo',
    'Cote d\'Ivoire': 'Côte d\'Ivoire',
    'Equatorial Guinea': 'Eq. Guinea',
    'Eswatini': 'eSwatini',
    'Dominican Republic': 'Dominican Rep.',
    'Bosnia and Herzegovina': 'Bosnia and Herz.',
    'North Macedonia': 'Macedonia',
    'South Sudan': 'S. Sudan',
    'Solomon Islands': 'Solomon Is.',
    'Türkiye': 'Turkey'
  };

  private readonly WORLD_MAP_BASE_STYLE: L.PathOptions = {
    color: '#c9a36a',
    fillColor: '#2d202d',
    fillOpacity: 1,
    opacity: 0.95,
    weight: 0.8
  };

  // LIFECYCLE

  ngOnInit(): void {
    this.loadZones();
  }

  ngAfterViewInit(): void {
    this.isCarouselEnhanced.set(true);
  }

  previousSlide(): void {
    const current = this.currentSlide();
    if (current === 0) {
      return;
    }
    this.currentSlide.set(current - 1);
  }

  nextSlide(): void {
    const current = this.currentSlide();
    if (current === this.totalSlides - 1) {
      return;
    }
    this.currentSlide.set(current + 1);
  }

  // support left/right keyboard navigation
  onCarouselKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previousSlide();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextSlide();
    }
  }



  // open zone chooser when one country has multiple zones.
  private openZoneChooser(walls: WallMap[], trigger: HTMLElement): void {
    this.zoneChooserWalls = [...walls];
    this.zoneChooserOpened.set(true);
    // wait until Angular renders the chooser
    requestAnimationFrame(() => {
      this.positionZoneChooser(trigger);
    });
  }

  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    this.scrollservice.scrollToSection(sectionId);
  }

  // CHANGED: close zone chooser when user clicks outside it
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    if (!this.zoneChooserOpened()) {
      return;
    }

    const target = event.target as HTMLElement;

    // Keep chooser open when clicking inside chooser
    if (target.closest('#zone-chooser')) {
      return;
    }

    // Keep chooser open when clicking a map marker.
    // Marker click handler will decide whether to replace
    // the current chooser or open the sidebar.
    if (target.closest('.leaflet-marker-icon')) {
      return;
    }

    // Keep chooser open when clicking a country.
    // Country click handler will decide what to do.
    if (target.closest('.world-map__country--zone')) {
      return;
    }

    // CHANGED: clicked somewhere else
    this.closeZoneChooser();
  }

  // The chooser is positioned in px, so it goes stale when the viewport changes;
  // like the static site, close it on window resize.
  @HostListener('window:resize')
  onWindowResize(): void {
    this.closeZoneChooser();
  }

  // CHANGED: position chooser next to clicked map marker
  private positionZoneChooser(trigger: HTMLElement): void {

    const chooser = this.zoneChooserElement?.nativeElement;

    if (!chooser) {
      return;
    }

    const container = chooser.parentElement;

    if (!container) {
      return;
    }

    const box = container.getBoundingClientRect();

    const originX = box.left + container.clientLeft;
    const originY = box.top + container.clientTop;

    const dot = trigger
      .querySelector<HTMLElement>('.world-map-zone-marker__dot')
      ?.getBoundingClientRect();

    const label = trigger
      .querySelector<HTMLElement>('.world-map-zone-marker__label')
      ?.getBoundingClientRect();

    if (!dot || !label) {
      return;
    }

    const width = chooser.offsetWidth;
    const height = chooser.offsetHeight;

    const clamp = (value: number, max: number): number => {
      return Math.min(
        Math.max(value, this.ZONE_CHOOSER_MARGIN),
        max
      );
    };

    // CHANGED
    let top =
      label.top
      - this.ZONE_CHOOSER_GAP
      - height
      - originY;

    // CHANGED
    if (top < this.ZONE_CHOOSER_MARGIN) {
      top =
        dot.bottom
        + this.ZONE_CHOOSER_GAP
        - originY;
    }

    const left =
      dot.left
      + dot.width / 2
      - width / 2
      - originX;

    chooser.style.top = `${clamp(
      top,
      container.clientHeight
      - height
      - this.ZONE_CHOOSER_MARGIN
    )}px`;

    chooser.style.left = `${clamp(
      left,
      container.clientWidth
      - width
      - this.ZONE_CHOOSER_MARGIN
    )}px`;
  }

  // close zone chooser.
  closeZoneChooser(): void {
    this.zoneChooserOpened.set(false);
    this.zoneChooserWalls = [];
  }

  // select a specific zone from chooser.
  selectZoneFromChooser(wall: WallMap): void {
    this.closeZoneChooser();
    this.openWallOverlay(wall);
  }

  loadZones() {
    // api called here
    this.apiHandler.execute({
      apiCall: () => this.adminService.getZone(),
      showSpinner: false,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res && Array.isArray(res.Data)) {
            this.zoneList.set(res.Data);
            const zones = res.Data;
            // create one Wall object for each country
            const walls: WallMap[] = zones.flatMap(
              (zone: ZoneApiMapResponse) => {
                // make tradition array
                const traditions = (zone.ZoneTradition ?? '')
                  .split(',').map(item => item.trim())
                  .filter(item => item.length > 0)
                  .map(item => ({
                    id: item.toLowerCase().replace(/\s+/g, '-'),
                    label: item
                  }));
                return (zone.ZoneCountryList ?? []).map(
                  country => {
                    return {
                      name: zone.ZoneName,
                      label: zone.ZoneName,
                      // only this country belongs to this Wall
                      countries: [country.CountryName],
                      // use this country's coordinates
                      labelLat: country.Latitude,
                      labelLng: country.Longitude,
                      highlightColor: '#D96B68',
                      traditions: (zone.ZoneTradition ?? '').split(',').map((item) => item.trim()).filter(item => item.length > 0)
                        .map((item) => ({ id: item.toLocaleLowerCase().replace(/\s+/g, '-'), label: item })),
                      description: zone.Description
                    };
                  }
                );
              }
            );

            // Add all Wall records
            this.Walls.push(...walls);
          }
        },
        complete: () => {
          // after data comes then start to initialize map here
          this.initWorldMap();
        }
      });
  }

  // LOAD WORLD TOPOLOGY

  private async loadWorldTopology(): Promise<any> {
    const url = 'map/countries-110m.json';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Could not load world map data');
    }
    return response.json();
  }

  // BUILD COUNTRY -> WALL MAP

  private buildWallAtlasCountryMap(): Map<string, WallMap[]> {

    const map = new Map<string, WallMap[]>();
    // api response array Walls country name match with WORLD_ATLAS_COUNTRY_NAMES
    this.Walls.forEach(wall => {
      if (!wall) {
        return;
      }
      (wall.countries || []).forEach(country => {
        // Convert your API name to the map's name
        const atlasName = this.WORLD_ATLAS_COUNTRY_NAMES[country] || country;
        const walls = map.get(atlasName) ?? [];
        walls.push(wall);
        map.set(atlasName, walls);
      });

    });
    return map;
  }

  // CHECK VALID LAND POLYGON
  private isLandPolygon(featureData: any): boolean {
    const type = featureData.geometry?.type;
    if (type !== 'Polygon' && type !== 'MultiPolygon') { return false; }
    const name = featureData.properties?.name;
    if (name === 'Antarctica') { return false; }

    const id = String(featureData.id ?? '');
    if (id === '10' || id === '010') {
      return false;
    }
    return true;
  }

  // COUNTRY STYLE
  private worldMapCountryStyle(featureData: any, wallAtlasMap: Map<string, WallMap[]>, isHover = false): L.PathOptions {
    const countryName = featureData.properties?.name;
    const walls = countryName ? wallAtlasMap.get(countryName) ?? [] : [];
    const wall = walls[0];
    if (!wall) {
      return this.WORLD_MAP_BASE_STYLE;
    }
    const zoneColor = wall.highlightColor || '#0070d9';

    return {
      color: zoneColor,
      fillColor: zoneColor,
      fillOpacity: isHover ? 0.48 : 0.32,
      opacity: 1,
      weight: isHover ? 2.25 : 1.85
    };
  }

  // DATELINE / WRAPPED COUNTRY SUPPORT
  private shiftRingIfWrapped(ring: number[][]): number[][] {
    if (!ring || ring.length === 0) {
      return ring;
    }
    const shifted: number[][] = [];
    let previousLng = ring[0][0];

    shifted.push([previousLng, ring[0][1]]);

    for (let i = 1; i < ring.length; i++) {
      let lng = ring[i][0];
      const diff =
        lng - previousLng;
      if (diff > 180) {
        lng -= 360;
      }
      if (diff < -180) {
        lng += 360;
      }
      shifted.push([lng, ring[i][1]]);
      previousLng = lng;
    }

    return shifted;
  }

  private shiftGeometryIfWrapped(geometry: any): any {
    if (!geometry) {
      return geometry;
    }
    if (geometry.type === 'Polygon') {
      return {
        ...geometry, coordinates: geometry.coordinates.map(
          (ring: number[][]) =>
            this.shiftRingIfWrapped(ring)
        )
      };
    }

    if (geometry.type === 'MultiPolygon') {
      return {
        ...geometry, coordinates:
          geometry.coordinates.map(
            (polygon: number[][][]) =>
              polygon.map(
                ring =>
                  this.shiftRingIfWrapped(ring)
              )
          )
      };
    }
    return geometry;
  }

  private countriesForDisplay(countries: any): any {
    return {
      ...countries,
      features: countries.features
        .filter((featureData: any) =>
          this.isLandPolygon(featureData)
        )
        .map((featureData: any) => ({
          ...featureData,
          geometry:
            this.shiftGeometryIfWrapped(
              featureData.geometry
            )
        }))
    };
  }

  // WALL LABEL HTML
  // keep the exact label structure from the original design
  // CHANGED: create marker label for one or multiple zones.
  private worldMapZoneLabelHtml(walls: WallMap[]): string {
    const firstWall = walls[0];
    const color = firstWall.highlightColor || '#4da8ff';
    // if we have multiple zone then show zone name with , here
    const labels = walls.map(wall => wall.label).join(', ');

    return `
    <div
      class="world-map-zone-marker"
      style="--zone-color: ${color};"
    >

      <span
        class="world-map-zone-marker__label">
        ${labels}
      </span>

      <span
        class="world-map-zone-marker__dot"
        aria-hidden="true">
      </span>

    </div>
  `;
  }

  // OPEN WALL

  private openWallOverlay(wall: WallMap): void {
    // store selected wall for Angular template
    this.selectedWall = wall;
    // open Angular overlay
    this.wallOverlayOpened.set(true);
  }

  closeWallOverlay(): void {
    // close Angular overlay
    this.wallOverlayOpened.set(false);
    // clear selected wall
    this.selectedWall = null;
  }

  // INITIALIZE WORLD MAP
  private async initWorldMap(): Promise<void> {
    // CHANGED: use Angular ViewChild
    const mapElement = this.worldMapElement?.nativeElement;
    if (!mapElement) {
      console.error(
        'World map element not found'
      );
      return;
    }

    // Prevent duplicate map initialization
    if (this.worldMap) {
      this.worldMap.remove();
    }
    let topology: any;

    try {
      topology = await this.loadWorldTopology();
    } catch (error) {
      console.error('World map loading failed:', error);
      return;
    }

    const countriesObject = topology.objects?.countries;
    if (!countriesObject) {
      console.error('Countries data not found');
      return;
    }

    // CONVERT TO GEOJSON
    const countries = feature(topology, countriesObject) as any;
    const displayCountries = this.countriesForDisplay(countries);
    // BUILD WALL COUNTRY MAP

    const wallAtlasMap = this.buildWallAtlasCountryMap();

    // CREATE LEAFLET MAP

    this.worldMap = L.map(mapElement,
      {
        attributionControl: false,
        boxZoom: false,
        doubleClickZoom: false,
        dragging: false,
        fadeAnimation: false,
        keyboard: false,
        markerZoomAnimation: false,
        scrollWheelZoom: false,
        touchZoom: false,
        zoomAnimation: false,
        zoomControl: false,
        zoomSnap: 0.25,
        worldCopyJump: false
      }
    );

    // DRAW COUNTRIES
    const countriesLayer =
      L.geoJSON(displayCountries,
        {
          style: (featureData: any) => {
            return this.worldMapCountryStyle(featureData, wallAtlasMap);
          },

          onEachFeature: (featureData: any, layer: L.Layer) => {
            const countryName = featureData.properties?.name;
            const wall = countryName ? wallAtlasMap.get(countryName) ?? [] : [];
            // ONLY WALL COUNTRIES ARE CLICKABLE
            if (!wall) {
              return;
            }
            const path = layer as L.Path;

            // HOVER
            path.on('mouseover', () => {
              path.setStyle(this.worldMapCountryStyle(featureData, wallAtlasMap, true));
              if (path.bringToFront) {
                path.bringToFront();
              }
            }
            );

            path.on('mouseout', () => {
              path.setStyle(this.worldMapCountryStyle(featureData, wallAtlasMap, false));
            }
            );

            // CLICK sidebar called depends on zone
            path.on('click', () => {
              const countryName = featureData.properties?.name;
              const walls = countryName ? wallAtlasMap.get(countryName) ?? [] : [];

              if (!walls.length) {
                return;
              }

              if (walls.length === 1) {
                this.openWallOverlay(walls[0]);
                return;
              }

              // choose country here
              this.openZoneChooserFromCountry(walls);
            });
          }
        }
      );

    countriesLayer.addTo(this.worldMap);

    // MAP POSITION / ZOOM
    // use fixed center and zoom to match expected design
    this.worldMap.setView([20, 10], 2.15, { animate: false });

    // lock map to the designed zoom level
    const currentZoom = this.worldMap.getZoom();

    this.worldMap.setMinZoom(currentZoom);
    this.worldMap.setMaxZoom(currentZoom);
    // ADD WALL LABEL MARKERS

    // CHANGED: group zones that share the same country/marker location.
    const markerGroups = new Map<string, WallMap[]>();

    this.Walls.forEach(wall => {

      const key =
        `${wall.labelLat}_${wall.labelLng}`;

      const walls =
        markerGroups.get(key) ?? [];

      walls.push(wall);

      markerGroups.set(key, walls);
    });

    markerGroups.forEach(walls => {

      const firstWall = walls[0];

      if (firstWall.labelLat == null || firstWall.labelLng == null) {
        return;
      }

      const markerIcon = L.divIcon({
        className: 'world-map-zone-marker-wrap',

        // show all zone names when marker represents multiple zones.
        html: this.worldMapZoneLabelHtml(walls),

        iconSize: [140, 48],
        iconAnchor: [70, 48]
      });

      const marker =
        L.marker(
          [
            firstWall.labelLat,
            firstWall.labelLng
          ],
          {
            icon: markerIcon,
            interactive: true
          }
        );

      marker.on('click', () => {
        if (walls.length === 1) {
          this.openWallOverlay(walls[0]);
          return;
        }

        const trigger = marker.getElement();

        if (!trigger) {
          return;
        }

        this.openZoneChooser(walls, trigger);
      });

      marker.addTo(this.worldMap);
    });

    // FORCE LEAFLET TO RECALCULATE SIZE

    requestAnimationFrame(() => {
      if (this.worldMap) {
        this.worldMap.invalidateSize(
          false
        );
      }
    });
  }

  private openZoneChooserFromCountry(walls: WallMap[]): void {
    this.zoneChooserWalls = [...walls];
    this.zoneChooserOpened.set(true);
  }

  private restoreVideo(): void {
    if (!this.playingVideo) {
      return;
    }
    const { iframe, poster, heading, headingParent, headingNext } = this.playingVideo;
    iframe.replaceWith(poster);
    if (heading && headingParent) {
      heading.classList.remove('video-card__sr-heading');
      headingParent.insertBefore(
        heading,
        headingNext
      );
    }
    this.playingVideo = null;
  }

  private isVideoProvider(provider: string): boolean {
    return provider === 'youtube' || provider === 'vimeo';
  }

  // CHANGED: converts YouTube/Vimeo URL or ID into an embed URL.
  private videoEmbedUrl(provider: string, value: string): string | null {

    const providerName = provider.trim().toLowerCase();
    const videoValue = value.trim();

    if (!videoValue || !this.isVideoProvider(providerName)) {
      return null;
    }

    // Vimeo
    if (providerName === 'vimeo') {
      try {
        const url = new URL(videoValue);

        if (url.hostname === 'vimeo.com' || url.hostname === 'www.vimeo.com') {
          const pathParts = url.pathname.split('/').filter(Boolean);

          if (!pathParts.length) {
            return null;
          }
          const videoId = pathParts[0];
          // Vimeo private/unlisted videos can contain the hash
          // after the video ID.
          const hash = pathParts[1];
          return hash
            ? `https://player.vimeo.com/video/${videoId}?h=${encodeURIComponent(hash)}&autoplay=1`
            : `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }

        if (url.hostname === 'player.vimeo.com') {
          return videoValue;
        }
      } catch {
        // Continue below and try the value as a plain Vimeo ID.
      }

      // Plain Vimeo ID
      if (/^\d+$/.test(videoValue)) {
        return `https://player.vimeo.com/video/${videoValue}?autoplay=1`;
      }

      return null;
    }


    // YouTube
    if (providerName === 'youtube') {
      try {
        const url = new URL(videoValue);
        // youtube.com/watch?v=...
        if (url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com'
        ) {
          const videoId = url.searchParams.get('v');
          if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          }
          // youtube.com/embed/...
          const embedMatch = url.pathname.match(/^\/embed\/([^/]+)/);

          if (embedMatch) {
            return `https://www.youtube.com/embed/${embedMatch[1]}?autoplay=1`;
          }
        }

        // youtu.be/...
        if (url.hostname === 'youtu.be') {
          const videoId = url.pathname.split('/').filter(Boolean)[0];

          if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          }
        }
      } catch {
        // Continue below and try the value as a plain YouTube ID.
      }

      // Plain YouTube ID
      if (/^[A-Za-z0-9_-]{11}$/.test(videoValue)) {
        return `https://www.youtube.com/embed/${videoValue}?autoplay=1`;
      }

      return null;
    }

    return null;
  }

  // creates the iframe used when the user presses Play.
  private createVideoIframe(url: string, title: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.className = 'video-card__iframe';
    iframe.src = url;
    iframe.title = title;
    iframe.setAttribute(
      'allow',
      'autoplay; fullscreen; picture-in-picture'
    );
    iframe.setAttribute('allowfullscreen', ''
    );
    iframe.setAttribute('loading', 'eager');

    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin'
    );

    return iframe;
  }


  // called from the Angular Play button.
  playVideo(event: Event, provider: string, videoId: string, title: string): void {
    const button = event.currentTarget as HTMLButtonElement | null;
    if (!button) {
      return;
    }
    // embedded url here
    const url = this.videoEmbedUrl(provider, videoId);

    if (!url) {
      button.disabled = true;
      return;
    }
    // Stop any previously playing video.
    this.restoreVideo();

    const videoCard = button.closest('.video-card') as HTMLElement | null;

    if (!videoCard) {
      return;
    }

    const poster = button.closest('[data-video-poster]') as HTMLElement | null;

    if (!poster) {
      return;
    }

    const iframe = this.createVideoIframe(url, title || 'Video player');

    // Keep the heading in the DOM while the poster is removed.
    const heading = poster.querySelector('h1, h2, h3, h4, h5, h6') as HTMLElement | null;
    const headingParent = heading?.parentNode ?? null;
    const headingNext = heading?.nextSibling ?? null;

    if (heading) {
      heading.classList.add(
        'video-card__sr-heading'
      );
      poster.before(heading);
    }

    // Replace poster or thumbnail with iframe.
    poster.replaceWith(iframe);

    // Focus the newly created video.
    iframe.focus();

    this.playingVideo = { iframe, poster, heading, headingParent, headingNext };
  }


  // allows Angular HTML to enable/disable the Play button.
  isVideoAvailable(provider: string, videoId: string): boolean {
    return this.videoEmbedUrl(provider, videoId) !== null;
  }

  ngOnDestroy(): void {
    // destroy Leaflet map when Angular component is destroyed
    if (this.worldMap) {
      this.worldMap.remove();
    }
  }
}