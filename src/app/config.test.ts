import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

describe('readConfig', () => {
  it('브라우저 localhost에서는 시뮬레이터가 기본', () => {
    expect(readConfig({}, new URL('http://localhost:5175/')).useSimulator).toBe(true);
  });

  it('앱 WebView(https://localhost)에서는 실제 GPS가 기본', () => {
    expect(readConfig({}, new URL('https://localhost/'), true).useSimulator).toBe(false);
  });

  it('?sim=1 이면 앱에서도 시뮬레이터', () => {
    expect(readConfig({}, new URL('https://localhost/?sim=1'), true).useSimulator).toBe(true);
  });

  it('배포 주소에서는 실제 GPS가 기본', () => {
    expect(readConfig({}, new URL('https://example.pages.dev/')).useSimulator).toBe(false);
  });

  it('시작 위치는 ?at 이 있을 때만 정해진다 (기본 좌표 없음)', () => {
    expect(readConfig({}, new URL('http://localhost:5175/')).start).toBeNull();
    expect(readConfig({}, new URL('http://localhost:5175/?at=35.1798,129.075')).start).toEqual({ lat: 35.1798, lng: 129.075 });
  });
});
