/**
 * 만남 화면 배경용 후면 카메라. 몬스터 게임의 AR 조우 화면(ArEncounter)에서 카메라 부분만 가져왔다.
 * 권한 거부·카메라 없음이면 reject하고, 부른 쪽이 그림 배경으로 바꾼다.
 */

const AR_PREF_KEY = 'gps-romance/ar';

export function readArPref(): boolean {
  try {
    return localStorage.getItem(AR_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function writeArPref(on: boolean) {
  try {
    localStorage.setItem(AR_PREF_KEY, on ? 'on' : 'off');
  } catch {
    /* 저장 못 해도 이번 만남에는 지장 없음 */
  }
}

export function cameraErrorMessage(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return '카메라 권한이 없어 그림 배경으로 바꿨어요';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return '카메라를 찾지 못해 그림 배경으로 바꿨어요';
  if (name === 'NotReadableError') return '다른 앱이 카메라를 쓰고 있어 그림 배경으로 바꿨어요';
  return '카메라를 켜지 못해 그림 배경으로 바꿨어요';
}

/** 후면 카메라를 video에 연결한다. onEnded는 도중에 끊겼을 때(다른 앱이 가져감 등). */
export async function startCamera(video: HTMLVideoElement, onEnded: () => void): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('insecure'), { name: window.isSecureContext ? 'NotFoundError' : 'SecurityError' });
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
  });
  video.srcObject = stream;
  const track = stream.getVideoTracks()[0];
  if (!track || track.readyState === 'ended') {
    queueMicrotask(onEnded);
  } else {
    track.addEventListener('ended', onEnded);
  }
  await video.play().catch(() => undefined);
  return stream;
}

export function stopCamera(video: HTMLVideoElement, stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
  video.srcObject = null;
}
