import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    // 카카오 디벨로퍼스에 등록한 도메인(http://localhost:5175)과 맞춰야 하므로 포트를 고정한다.
    port: 5175,
    strictPort: true,
    // 휴대폰 GPS 테스트용 HTTPS 터널 주소 허용 (README "휴대폰에서 해 보기")
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
