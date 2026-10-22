import type { LocationError, LocationSource } from './LocationSource';
import type { PlayerFix } from '../game/rules';

/** 브라우저 Geolocation API. 권한 요청은 첫 watchPosition 호출 때 브라우저가 띄운다. */
export class BrowserGps implements LocationSource {
  readonly kind = 'gps';
  private watchId: number | null = null;

  start(onFix: (fix: PlayerFix) => void, onError: (err: LocationError) => void): void {
    if (!('geolocation' in navigator)) {
      onError({ code: 'unsupported', message: '이 브라우저는 위치 기능을 지원하지 않습니다.' });
      return;
    }
    if (!window.isSecureContext) {
      onError({
        code: 'insecure',
        message: 'GPS는 HTTPS(또는 localhost)에서만 동작합니다. 휴대폰 테스트 방법은 README를 보세요.',
      });
      return;
    }
    this.watchId = navigator.geolocation.watchPosition(
      (p) =>
        onFix({
          pos: { lat: p.coords.latitude, lng: p.coords.longitude },
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp,
        }),
      (e) => onError(toLocationError(e)),
      { enableHighAccuracy: true, maximumAge: 2_000, timeout: 20_000 },
    );
  }

  stop(): void {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }
}

/**
 * 현재 위치를 한 번만 받는다(시작 위치용). PC에서도 Wi-Fi·IP로 대략 위치가 잡힌다.
 * 권한 거부·시간 초과·미지원이면 null. 대신 쓸 좌표를 정하는 건 호출하는 쪽 몫이다.
 */
export function getCurrentFix(timeoutMs = 8_000): Promise<PlayerFix | null> {
  if (!('geolocation' in navigator) || !window.isSecureContext) return Promise.resolve(null);
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          pos: { lat: p.coords.latitude, lng: p.coords.longitude },
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs },
    ),
  );
}

function toLocationError(e: GeolocationPositionError): LocationError {
  switch (e.code) {
    case e.PERMISSION_DENIED:
      return { code: 'denied', message: '위치 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.' };
    case e.TIMEOUT:
      return { code: 'timeout', message: '위치를 받는 데 시간이 너무 오래 걸립니다. 하늘이 트인 곳으로 이동해 보세요.' };
    default:
      return { code: 'unavailable', message: `위치를 알 수 없습니다. (${e.message})` };
  }
}
