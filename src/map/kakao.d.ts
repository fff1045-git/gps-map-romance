// 카카오맵 JavaScript SDK 중 이 프로젝트가 쓰는 부분만 최소 선언.
// 전체 API: https://apis.map.kakao.com/web/documentation/
declare namespace kakao.maps {
  function load(cb: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }
  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }
  enum MapTypeId {
    ROADMAP = 1,
    SKYVIEW = 2,
    HYBRID = 3,
  }
  interface MapOptions {
    center: LatLng;
    level?: number;
  }
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    panTo(latlng: LatLng): void;
    setLevel(level: number): void;
    getLevel(): number;
    setMapTypeId(id: MapTypeId): void;
    getProjection(): MapProjection;
    relayout(): void;
  }
  interface MapProjection {
    containerPointFromCoords(latlng: LatLng): Point;
    coordsFromContainerPoint(point: Point): LatLng;
  }
  interface CustomOverlayOptions {
    position: LatLng;
    content: HTMLElement | string;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
    map?: Map;
  }
  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | Roadview | null): void;
    getPosition(): LatLng;
    setPosition(pos: LatLng): void;
    setZIndex(z: number): void;
    /** 로드뷰에서만. 로드뷰 화면 중앙(카메라 높이)이 0, 단위 m. */
    setAltitude(altitude: number): void;
    getAltitude(): number;
    /** 로드뷰에서만. 이 거리(m) 안에 있을 때만 보인다. */
    setRange(range: number): void;
  }
  interface CircleOptions {
    center: LatLng;
    radius: number;
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    map?: Map;
  }
  class Circle {
    constructor(options: CircleOptions);
    setMap(map: Map | null): void;
    setPosition(pos: LatLng): void;
    setRadius(r: number): void;
    setOptions(options: Partial<CircleOptions>): void;
  }
  interface Viewpoint {
    pan: number;
    tilt: number;
    zoom: number;
  }
  interface RoadviewProjection {
    viewpointFromCoords(position: LatLng, altitude: number): Viewpoint;
  }
  class Roadview {
    constructor(container: HTMLElement);
    setPanoId(panoId: number, position: LatLng): void;
    getPosition(): LatLng;
    setViewpoint(viewpoint: Viewpoint): void;
    getProjection(): RoadviewProjection;
    relayout(): void;
  }
  class RoadviewClient {
    getNearestPanoId(position: LatLng, radius: number, cb: (panoId: number | null) => void): void;
  }
  namespace services {
    enum Status {
      OK = 'OK',
      ZERO_RESULT = 'ZERO_RESULT',
      ERROR = 'ERROR',
    }
    interface PlaceRow {
      id: string;
      place_name: string;
      address_name: string;
      road_address_name: string;
      x: string;
      y: string;
    }
    interface AddressRow {
      address_name: string;
      x: string;
      y: string;
    }
    interface PlacesSearchOptions {
      location?: LatLng;
      radius?: number;
      sort?: SortBy;
    }
    enum SortBy {
      ACCURACY = 'accuracy',
      DISTANCE = 'distance',
    }
    class Places {
      keywordSearch(query: string, cb: (rows: PlaceRow[], status: Status) => void, options?: PlacesSearchOptions): void;
      categorySearch(code: string, cb: (rows: PlaceRow[], status: Status) => void, options?: PlacesSearchOptions): void;
    }
    class Geocoder {
      addressSearch(query: string, cb: (rows: AddressRow[], status: Status) => void): void;
    }
  }
  namespace event {
    function addListener(target: unknown, type: string, handler: (e: { latLng: LatLng }) => void): void;
  }
}

interface Window {
  kakao?: typeof kakao;
}
