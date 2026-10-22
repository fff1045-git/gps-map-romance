import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // 패키지명. 스토어에 올린 뒤에는 바꿀 수 없으니 출시 전에 확정할 것.
  appId: 'com.gpsromance.app',
  appName: 'GPS 지도 연애',
  webDir: 'dist',
  android: {
    // WebView 주소는 https://localhost (Capacitor 기본값).
    // 카카오 디벨로퍼스 JavaScript SDK 도메인에 https://localhost 를 등록해야 지도가 뜬다.
  },
};

export default config;
