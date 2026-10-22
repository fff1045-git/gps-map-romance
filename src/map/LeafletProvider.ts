import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '../core/geo';
import {
  createMarkerElement,
  updateMarkerElement,
  type CircleSpec,
  type MapProvider,
  type MarkerSpec,
  type ScreenPoint,
} from './MapProvider';

export type FallbackTiles = 'satellite' | 'osm';

/**
 * 키 없이 쓰는 개발용 폴백 지도.
 * - satellite: Esri World Imagery. 출처 표기 필수, 상용 서비스에는 Esri 약관 확인 필요.
 * - osm: OpenStreetMap 공식 타일. 개발·소량 트래픽용(OSMF 타일 이용 정책).
 */
const TILES: Record<FallbackTiles, { url: string; attribution: string; maxNativeZoom: number }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxNativeZoom: 18,
  },
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
  },
};

interface MarkerEntry {
  marker: L.Marker;
  el: HTMLElement;
  spec: MarkerSpec;
}

export class LeafletProvider implements MapProvider {
  readonly name: string;
  private map!: L.Map;
  private markers = new Map<string, MarkerEntry>();
  private circles = new Map<string, L.Circle>();

  constructor(private readonly tiles: FallbackTiles = 'satellite') {
    this.name = `leaflet-${tiles}`;
  }

  async mount(el: HTMLElement, center: LatLng, zoom: number): Promise<void> {
    this.map = L.map(el, { zoomControl: false }).setView([center.lat, center.lng], zoom);
    const t = TILES[this.tiles];
    L.tileLayer(t.url, { attribution: t.attribution, maxNativeZoom: t.maxNativeZoom, maxZoom: 20 }).addTo(this.map);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  setCenter(pos: LatLng, animate = false): void {
    this.map.setView([pos.lat, pos.lng], this.map.getZoom(), { animate });
  }

  getCenter(): LatLng {
    const c = this.map.getCenter();
    return { lat: c.lat, lng: c.lng };
  }

  setZoom(zoom: number): void {
    this.map.setZoom(zoom);
  }

  setMarker(spec: MarkerSpec): void {
    const entry = this.markers.get(spec.id);
    if (entry) {
      updateMarkerElement(entry.el, spec, entry.spec.html);
      entry.marker.setLatLng([spec.pos.lat, spec.pos.lng]);
      if (spec.zIndex !== entry.spec.zIndex) entry.marker.setZIndexOffset(spec.zIndex ?? 0);
      entry.spec = spec;
      return;
    }
    const el = createMarkerElement(spec);
    const marker = L.marker([spec.pos.lat, spec.pos.lng], {
      icon: L.divIcon({ html: el, className: 'mk-leaflet', iconSize: [0, 0], iconAnchor: [0, 0] }),
      zIndexOffset: spec.zIndex ?? 0,
      keyboard: false,
    }).addTo(this.map);
    marker.on('click', () => this.markers.get(spec.id)?.spec.onClick?.());
    this.markers.set(spec.id, { marker, el, spec });
  }

  removeMarker(id: string): void {
    this.markers.get(id)?.marker.remove();
    this.markers.delete(id);
  }

  setCircle(spec: CircleSpec): void {
    const c = this.circles.get(spec.id);
    if (c) {
      c.setLatLng([spec.center.lat, spec.center.lng]).setRadius(spec.radiusM);
      return;
    }
    this.circles.set(
      spec.id,
      L.circle([spec.center.lat, spec.center.lng], {
        radius: spec.radiusM,
        color: spec.color,
        weight: 2,
        fillOpacity: spec.fillOpacity ?? 0.12,
        interactive: false,
      }).addTo(this.map),
    );
  }

  removeCircle(id: string): void {
    this.circles.get(id)?.remove();
    this.circles.delete(id);
  }

  onClick(cb: (pos: LatLng) => void): void {
    this.map.on('click', (e: L.LeafletMouseEvent) => cb({ lat: e.latlng.lat, lng: e.latlng.lng }));
  }

  onUserPan(cb: () => void): void {
    this.map.on('dragstart', () => cb());
  }

  latLngToScreen(pos: LatLng): ScreenPoint {
    const p = this.map.latLngToContainerPoint([pos.lat, pos.lng]);
    return { x: p.x, y: p.y };
  }

  screenToLatLng(p: ScreenPoint): LatLng {
    const c = this.map.containerPointToLatLng([p.x, p.y]);
    return { lat: c.lat, lng: c.lng };
  }

  destroy(): void {
    this.map.remove();
    this.markers.clear();
    this.circles.clear();
  }
}
