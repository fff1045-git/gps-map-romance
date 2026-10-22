import { Geolocation, type Position } from '@capacitor/geolocation';
import type { PlayerFix } from '../game/rules';
import type { LocationError, LocationSource } from './LocationSource';

/**
 * 앱(Capacitor) 안에서 쓰는 GPS. 브라우저에서는 BrowserGps를 쓴다.
 * Android 12+는 사용자가 "대략적인 위치"만 허용할 수 있어서, 그 경우 경고를 띄우고 계속 받는다.
 */
export class CapacitorGps implements LocationSource {
  readonly kind = 'gps';
  private watchId: string | null = null;
  private stopped = false;

  start(onFix: (fix: PlayerFix) => void, onError: (err: LocationError) => void): void {
    this.stopped = false;
    void (async () => {
      const perm = await ensurePermission();
      if (perm.error) return onError(perm.error);
      if (perm.coarseOnly) {
        onError({
          code: 'coarse-only',
          message: '"대략적인 위치"만 허용돼서 캐릭터를 만나기 어려워요. 앱 설정 → 권한 → 위치에서 "정확한 위치 사용"을 켜 주세요.',
        });
      }
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 20_000, maximumAge: 2_000, minimumUpdateInterval: 1_000, interval: 2_000 },
        (pos, err) => {
          if (err) onError(toLocationError(err));
          else if (pos) onFix(toFix(pos));
        },
      );
      // start 직후 stop이 불렸을 수 있다
      if (this.stopped) void Geolocation.clearWatch({ id });
      else this.watchId = id;
    })().catch((e) => onError(toLocationError(e)));
  }

  stop(): void {
    this.stopped = true;
    if (this.watchId) void Geolocation.clearWatch({ id: this.watchId });
    this.watchId = null;
  }
}

/** 시작 위치용 한 번 측정. 권한을 이때 요청한다. 실패하면 null. */
export async function getCurrentFixNative(timeoutMs = 8_000): Promise<PlayerFix | null> {
  try {
    const perm = await ensurePermission();
    if (perm.error) return null;
    return toFix(await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 }));
  } catch {
    return null;
  }
}

async function ensurePermission(): Promise<{ error?: LocationError; coarseOnly?: boolean }> {
  try {
    let status = await Geolocation.checkPermissions();
    if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
      status = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
    }
    if (status.location === 'granted') return {};
    if (status.coarseLocation === 'granted') return { coarseOnly: true };
    return { error: { code: 'denied', message: '위치 권한이 거부되었습니다. 앱 설정 → 권한에서 위치를 허용해 주세요.' } };
  } catch (e) {
    // checkPermissions는 기기 위치 기능이 꺼져 있으면 예외를 던진다.
    return { error: toLocationError(e) };
  }
}

function toFix(p: Position): PlayerFix {
  return { pos: { lat: p.coords.latitude, lng: p.coords.longitude }, accuracy: p.coords.accuracy, timestamp: p.timestamp };
}

function toLocationError(e: unknown): LocationError {
  const err = e as { code?: string; message?: string };
  switch (err?.code) {
    case 'OS-PLUG-GLOC-0003':
      return { code: 'denied', message: '위치 권한이 거부되었습니다. 앱 설정 → 권한에서 위치를 허용해 주세요.' };
    case 'OS-PLUG-GLOC-0007':
    case 'OS-PLUG-GLOC-0009':
    case 'OS-PLUG-GLOC-0017':
      return { code: 'unavailable', message: '휴대폰의 위치 기능이 꺼져 있어요. 빠른 설정에서 위치를 켜 주세요.' };
    case 'OS-PLUG-GLOC-0010':
      return { code: 'timeout', message: '위치를 받는 데 시간이 너무 오래 걸립니다. 하늘이 트인 곳으로 이동해 보세요.' };
    default:
      if (/location services|disabled/i.test(err?.message ?? '')) {
        return { code: 'unavailable', message: '휴대폰의 위치 기능이 꺼져 있어요. 빠른 설정에서 위치를 켜 주세요.' };
      }
      return { code: 'unavailable', message: `위치를 알 수 없습니다. (${err?.message ?? String(e)})` };
  }
}
