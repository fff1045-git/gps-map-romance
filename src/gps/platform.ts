import { Capacitor } from '@capacitor/core';
import type { PlayerFix } from '../game/rules';
import { BrowserGps, getCurrentFix } from './BrowserGps';
import { CapacitorGps, getCurrentFixNative } from './CapacitorGps';
import type { LocationSource } from './LocationSource';

/**
 * 실행 환경별 위치 공급원을 고르는 유일한 곳.
 * 앱(Android, 나중에 iOS)이면 Capacitor 플러그인, 브라우저면 navigator.geolocation.
 */
export const isNativeApp = Capacitor.isNativePlatform();

export function createGps(): LocationSource {
  return isNativeApp ? new CapacitorGps() : new BrowserGps();
}

export function getStartFix(): Promise<PlayerFix | null> {
  return isNativeApp ? getCurrentFixNative() : getCurrentFix();
}
