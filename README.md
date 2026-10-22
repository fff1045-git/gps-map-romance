# GPS 생물 수집 게임

대한민국 어디서나 할 수 있는 위치 기반 수집 게임(포켓몬GO 방식)입니다.
위성 지도 위에 내 위치와 몬스터가 표시되고, 40m 안으로 걸어가서 몬스터를 누르면 카메라 화면(AR)에 몬스터가 나타납니다. 볼을 던져서 잡습니다.
생물은 미리 찍어 둔 자리가 아니라 내 주변에 규칙에 따라 생겨나고, 대한민국 밖에서는 나오지 않습니다.

- 지도: 카카오맵 스카이뷰(위성 + 도로·지명). 키가 없거나 불러오지 못하면 개발용 위성 타일(Esri)로 대신 표시합니다.
- 위치: 휴대폰은 실제 GPS를 쓰고, PC에서는 가짜 위치 시뮬레이터로 개발합니다.
- 저장: 브라우저(localStorage)에만 저장합니다. 서버는 없습니다.

## 실행

```bash
npm install
```

```bash
npm run dev
```

브라우저에서 <http://localhost:5173> 을 엽니다. 포트는 5173으로 고정되어 있습니다(카카오에 등록한 도메인과 맞추기 위해서). 5173이 이미 쓰이고 있으면 실행되지 않으니, 그 포트를 쓰는 프로그램을 먼저 종료하세요.

localhost에서 열면 **시뮬레이터 모드**로 시작합니다. 시작 위치는 다음 순서로 정합니다. 정해 둔 기본 좌표는 없습니다.

1. 현재 위치: 브라우저 위치 권한을 허용하면 PC에서도 Wi-Fi·IP 기준으로 대략 잡힙니다.
2. 마지막으로 플레이한 위치(브라우저에 저장됨)
3. 둘 다 없으면 전국 지도가 뜹니다. 위 검색창에서 장소를 찾거나 지도를 눌러 시작 위치를 고르세요.

| 조작 | 동작 |
|---|---|
| W A S D / 방향키 | 걷기 (초속 4m) |
| Shift를 누른 채 이동 | 달리기 (3배) |
| 지도 빈 곳 누르기 | 300m 안이면 그 지점까지 걸어가고, 더 멀면 순간이동 |
| 검색창 (카카오 지도에서만) | 장소·주소를 찾아 그곳으로 순간이동. 실제 GPS 모드에서는 지도만 옮김 |
| 몬스터 누르기 | 40m 안이면 AR 조우 화면, 밖이면 "N m 더 가까이" 안내 |
| 📍 내 위치 | 카메라를 다시 내 위치에 고정 (지도를 끌면 고정이 풀림) |
| 🛣️ 로드뷰 | 내 위치 50m 안의 카카오 로드뷰 사진 (카카오 지도에서만). 지금 잡을 수 있는 몬스터(획득 반경 40m 안)만 사진 속 땅 위에 서 있고(가까울수록 크게, 거리 표시 없음), 가장 가까운 몬스터 쪽을 보며 열립니다. 보이는 몬스터를 누르면 AR 조우. 없으면 "더 가까이 가 보세요" 안내 |
| 🎒 | 도감(보유 수·최고 CP, 못 잡은 몬스터는 실루엣). 아래에 진행도 초기화 버튼 |

URL 파라미터로 설정을 바꿀 수 있습니다.

| 파라미터 | 의미 |
|---|---|
| `?sim=0` / `?sim=1` | 실제 GPS / 시뮬레이터로 강제 |
| `?map=leaflet` | 카카오 대신 개발용 지도 |
| `?tiles=osm` | 개발용 지도를 위성 대신 OpenStreetMap 일반 지도로 |
| `?at=37.5663,126.9779` | 시작 위치 강제 (테스트용) |

### 테스트

```bash
npm test
```

```bash
npm run build
```

## 카카오맵 키 발급과 설정

1. <https://developers.kakao.com> 에 로그인한 뒤 **내 애플리케이션 → 애플리케이션 추가하기**를 누릅니다.
2. 앱의 **카카오맵** 사용 설정을 **ON**으로 바꿉니다.
3. **앱 키**에서 **JavaScript 키**를 복사합니다. REST API 키나 네이티브 앱 키는 쓰지 않습니다.
4. **플랫폼 → Web → 사이트 도메인**(JavaScript SDK 도메인)에 다음을 등록합니다.
   - `http://localhost:5173` (개발 서버)
   - 휴대폰 테스트나 배포에 쓰는 HTTPS 주소 (아래 참고)
5. 프로젝트 폴더에서 `.env.example`을 `.env.local`로 복사하고 키를 넣습니다.
   ```
   VITE_KAKAO_JS_KEY=복사한_JavaScript_키
   ```
6. 개발 서버를 다시 시작합니다. `.env.local`은 서버를 시작할 때만 읽습니다.

> **무료 쿼터 주의 (2026-07-21 정책):** 카드 등록(비즈월렛) 없이 쓸 수 있는 무료 쿼터는 **개발자 계정당 첫 번째로 활성화한 앱**에만 주어집니다. 이 게임용 앱이 그 첫 앱이어야 하고, 같은 계정으로 다른 앱을 더 만들어도 쿼터가 늘지 않습니다. 쿼터를 넘기면 지도 요청이 429 오류로 거절됩니다.
>
> 현재 이 프로젝트에는 카카오 앱 "오크밸리 gps"의 키가 `.env.local`에 들어 있습니다. 앱 이름일 뿐이고, 게임 무대와는 관계없습니다.

**키 보안:** JavaScript 키는 원래 브라우저에 노출되도록 만든 키입니다(빌드된 JS 파일 안에 들어갑니다). 그래서 보호 수단은 키를 숨기는 것이 아니라 **등록 도메인 제한**입니다. 모르는 도메인은 등록하지 마세요. `.env.local`은 `.gitignore`에 들어 있어 git에 올라가지 않습니다.

### 설정 값 (`.env.local`)

| 변수 | 값 | 기본 |
|---|---|---|
| `VITE_MAP_PROVIDER` | `kakao` / `leaflet` | `kakao` |
| `VITE_KAKAO_JS_KEY` | 카카오 JavaScript 키 | (없음) |
| `VITE_KAKAO_MAP_TYPE` | `hybrid`(위성+지명) / `skyview`(위성만) | `hybrid` |
| `VITE_FALLBACK_TILES` | `satellite` / `osm` | `satellite` |

## 키가 없을 때 (개발용 폴백)

키가 비어 있거나 카카오 SDK를 불러오지 못하면(키 오류, 등록되지 않은 도메인, 네트워크 문제) 화면 위쪽에 이유가 표시되고, Leaflet + Esri World Imagery 위성 타일로 대신 그립니다.

- Esri 위성 타일은 **개발·시연용**입니다. 공개 서비스로 운영하려면 Esri(ArcGIS) 약관을 확인하세요.
- OSM 타일(`?tiles=osm`)도 개발용입니다. OpenStreetMap 타일 서버는 대량 트래픽을 허용하지 않습니다.
- 두 타일 모두 지도 오른쪽 아래의 출처 표기를 지우면 안 됩니다.

## 휴대폰에서 해 보기 (실제 GPS)

브라우저는 **HTTPS**(또는 localhost)에서만 위치를 줍니다. PC의 `http://192.168.x.x:5173` 주소로 휴대폰에서 접속하면 GPS가 막힙니다. 방법은 두 가지입니다.

**A. 터널로 잠깐 테스트하기**
1. PC에서 `npm run dev`를 실행합니다.
2. 다른 터미널에서 터널을 엽니다. 예: [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/)
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
3. 출력된 `https://xxxx.trycloudflare.com` 주소를 카카오 앱의 사이트 도메인에 추가합니다. 이 주소는 터널을 열 때마다 바뀝니다.
4. 휴대폰에서 그 주소에 `?sim=0`을 붙여 열고, 위치 권한을 허용합니다.

**B. 고정 주소에 배포하기** (현장에서 실제로 걸어 볼 때 권장)
1. `npm run build`로 `dist/` 폴더를 만듭니다.
2. 정적 호스팅(Cloudflare Pages, Netlify, GitHub Pages 등)에 올립니다.
3. 받은 HTTPS 주소를 카카오 사이트 도메인에 한 번만 등록하면 됩니다.

배포 주소는 localhost가 아니므로 자동으로 실제 GPS 모드로 시작합니다.

알아 둘 점:
- 웹 페이지는 화면이 꺼지거나 다른 앱으로 넘어가면 GPS를 받지 못합니다. 게임 중에는 화면을 켜 두세요.
- GPS 정확도가 ±100m보다 나쁘면 획득이 막히고, 위쪽 표시에 "신호 약함"이 뜹니다.

## Android 앱(APK) 만들기 — Capacitor

웹 코드를 그대로 [Capacitor](https://capacitorjs.com)로 감싸서 APK를 만듭니다. Android 프로젝트는 `android/` 폴더에 있습니다.
앱에서는 실제 GPS 모드로 시작하고(`@capacitor/geolocation`), 아래쪽 🕹️ 버튼을 누르면 가짜 위치 시뮬레이터로 바꿀 수 있습니다.

### 처음 한 번 준비

1. **JDK 21**: Android Studio에 들어 있는 것을 씁니다(`C:\Program Files\Android\Android Studio\jbr`). 따로 설치하지 않아도 됩니다.
2. **Android SDK**: `%LOCALAPPDATA%\Android\Sdk`(platform 36, build-tools 36). `android/local.properties`에 경로가 들어 있습니다. 이 파일은 PC마다 다르므로 git에 올리지 않습니다.
3. **SDK 라이선스 수락** (직접 실행): 터미널에서 아래 명령을 실행하고 `y`로 답합니다.
   ```bash
   flutter doctor --android-licenses
   ```
4. **카카오 도메인 추가**: 앱 안의 WebView 주소는 `https://localhost`입니다. 카카오 디벨로퍼스 → 내 애플리케이션 → 플랫폼 → Web → 사이트 도메인에 **`https://localhost`** 를 추가하세요(개발 서버용 `http://localhost:5173`과는 별개입니다). 등록하지 않으면 앱에서 카카오 지도 대신 개발용 지도가 뜰 수 있습니다. (2026-10-18 에뮬레이터 테스트에서 WebView origin이 `https://localhost`인 것을 로그로 확인했고, 앱에서 카카오 위성 지도가 정상으로 떴습니다.)

### 빌드

웹을 빌드해서 `android/`에 복사합니다. 웹 코드나 `.env.local`을 바꿀 때마다 다시 실행해야 합니다.

```bash
npm run android:sync
```

디버그 APK를 만듭니다. PowerShell에서 실행:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; .\android\gradlew.bat -p android assembleDebug
```

결과물은 `android/app/build/outputs/apk/debug/app-debug.apk`입니다. Android Studio에서 `android` 폴더를 열고 ▶ 실행해도 됩니다.

### 휴대폰에 설치

**A. USB 디버깅으로 설치**
1. 휴대폰 설정 → 휴대전화 정보 → 소프트웨어 정보에서 **빌드번호**를 7번 눌러 개발자 옵션을 켭니다.
2. 개발자 옵션에서 **USB 디버깅**을 켜고 PC에 연결한 뒤, 휴대폰에 뜨는 "USB 디버깅 허용"을 승인합니다.
3. 설치합니다.
   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r android\app\build\outputs\apk\debug\app-debug.apk
   ```

**B. APK 파일로 설치**
1. `app-debug.apk`를 카카오톡 나에게 보내기, 구글 드라이브, USB 복사 등으로 휴대폰에 옮깁니다.
2. 휴대폰에서 파일을 열고, "출처를 알 수 없는 앱 설치"를 허용한 뒤 설치합니다.

앱 권한: 위치(정밀·대략), 카메라(AR 조우 화면), 인터넷. 카메라는 AR 화면을 처음 열 때 묻습니다.

처음 실행하면 위치 권한을 묻습니다. **"정확한 위치"** 를 켜고 "앱 사용 중에만 허용"을 고르세요. "대략적인 위치"만 허용하면 오차가 수백 m라서 생물을 잡을 수 없습니다. 이 경우 앱 위쪽에 안내가 뜹니다.

디버그 APK는 개인 테스트용입니다. 스토어에 올리려면 서명한 release 빌드(`assembleRelease` 또는 `bundleRelease`)가 필요합니다. 패키지명 `com.gpscollect.app`(`capacitor.config.ts`의 `appId`)은 스토어에 올린 뒤에는 바꿀 수 없습니다.

나중에 iOS를 붙일 때는 Mac에서 `npx cap add ios`를 실행합니다. 웹 코드에서 플랫폼을 가리는 곳은 `src/gps/platform.ts` 하나뿐입니다.

## 게임 규칙

- 플레이 영역은 대한민국입니다(`src/core/korea.ts`의 대략적인 경계). 영역 밖에서는 생물이 나오지 않고 위쪽에 안내가 뜹니다.
- 위경도를 약 80m 격자로 나누고, 칸마다 0~3마리를 둡니다. 배치는 **15분마다** 바뀝니다.
- 배치는 시드(`seed`)로 결정됩니다. 같은 장소, 같은 15분 안에서는 누가 열어도 같은 생물이 같은 자리에 있습니다.
- 한 번 잡은 스폰은 그 15분이 끝날 때까지 다시 나오지 않습니다.
- 몬스터는 테스트용 5종입니다(아래 "몬스터 카탈로그"). 스폰 위치는 그대로 결정적이고, 종류만 카탈로그 가중치로 정합니다.
- 몬스터가 도망치면 그 스폰은 15분 창이 끝날 때까지 사라집니다. 플레이어가 🏃 도망을 누르면 스폰은 남아서 다시 만날 수 있습니다.

조정할 값:

| 값 | 위치 |
|---|---|
| 획득 반경 40m, 정확도 한도 100m | `src/game/rules.ts`의 `DEFAULT_CAPTURE_CONFIG` |
| 격자 크기, 교체 주기, 칸당 최대 수, 시드 | `src/game/spawner.ts`의 `DEFAULT_SPAWN_CONFIG` |
| 지도 클릭 순간이동 기준 300m | `src/main.ts`의 `TELEPORT_OVER_M` |

## AR 조우 화면

지도에서 40m 안의 몬스터를 누르면 포켓몬 고처럼 카메라 화면에 몬스터가 나타납니다.

| 화면 요소 | 동작 |
|---|---|
| 배경 | 후면 카메라(`getUserMedia`, `facingMode: environment`). PC에서는 웹캠 |
| AR 토글(오른쪽 위) | 끄면 풀밭 일러스트 배경. 선택은 기기에 기억(`oakvalley-gps-game/ar`) |
| 카메라 실패 | 권한 거부·카메라 없음·다른 앱이 사용 중·HTTPS 아님·도중에 끊김이면 이번 조우만 자동으로 AR 끔과 안내 |
| 몬스터 위치 | AR 켬 + 자이로(DeviceOrientation)가 있으면 조우를 시작한 방향에 고정됩니다. 폰을 돌리면 화면 밖으로 나가고 가장자리에 ◀ ▶ 화살표가 뜹니다. 센서가 없는 PC나 AR 끔이면 화면 중앙 |
| 위쪽 | CP, 이름, 속성·희귀도, 🏃 도망(Esc) |
| 볼(아래 가운데) | 위로 밀어서 던집니다. 길게·빠르게 밀수록 멀리 갑니다. 키보드는 볼에 포커스를 두고 Space/Enter |
| 타깃 원 | 줄어드는 색 원. 원 안에 맞히면 Nice/Great/Excellent 보너스(원이 작을수록 큼). 색은 기본 포획 확률(초록 > 노랑 > 주황 > 빨강) |
| 📷 | 지금 화면(카메라 + 몬스터)을 PNG로 찍어 미리보기와 저장 링크 |
| 🎒 | 남은 기회 안내(1차는 자리만. 볼은 무제한) |

포획 규칙(`src/monsters/capture.ts`의 `DEFAULT_ENCOUNTER_RULES`):
- 명중하면 `희귀도별 기본 확률 × (1 − 0.35 × CP 위치) × 보너스 배수`로 포획합니다. 기본 확률은 흔함 55%, 조금 드묾 40%, 희귀 25%, 전설 12%이고, 결과는 2%~95%로 자릅니다.
- 실패하면 볼이 0~2번 흔들린 뒤 튀어나오고, 희귀도별 확률(8~25%)로 도망칩니다.
- 6번 던지고도 못 잡으면 무조건 도망칩니다.
- 잡으면 보관함(종류별 수)과 잡은 목록(`monsters`: 종류·CP·시각)에 저장됩니다. CP는 스폰 ID로 정해져서 같은 스폰은 다시 만나도 CP가 같습니다.

던지기 감도는 `src/ar/throw.ts`의 `DEFAULT_THROW_TUNING`, 자이로 시야각은 `src/ar/ArEncounter.ts`의 `H_FOV`·`V_FOV`에서 조정합니다.

### 몬스터 카탈로그

이미지는 Codex(GPT 이미지 생성)로 만든 오리지널 캐릭터이고, 매끈한 무광 인게임 3D 모델 스타일입니다. 마젠타 단색 배경으로 만든 뒤 배경을 지운 투명 PNG이고 `public/monsters/`에 있습니다. 데이터는 `src/monsters/catalog.ts`에 있습니다.

| 파일 | 역할 |
|---|---|
| `art/monsters/gen.sh <id> "<설명>"` | Codex로 그리기. 스타일 문구가 들어 있어 같은 화풍으로 맞춰진다. 결과는 `art/monsters/v2/raw/` |
| `art/monsters/key.py <원본> <결과>` | 마젠타 배경 제거(팔·다리 사이에 갇힌 배경까지), 번짐 제거, 자르기, 긴 변 640px. 남은 마젠타 화소 수를 출력(0이어야 정상) |
| `art/monsters/v1/` | 처음 만든 이미지(실사 질감이 많은 3D 렌더). 보관용 |

이미지 생성기의 안전 필터가 결과를 막을 때가 있습니다(`moderation_blocked`). 다시 시도하거나 디자인 설명을 바꾸면 됩니다. 솔방이는 솔방울 디자인이 두 번 막혀서 "분재 소나무를 인 이끼공"으로 바꿨습니다.

| 이름 | 속성 | 희귀도 | 스폰 가중치 | CP |
|---|---|---|---|---|
| 솔방이 | 🌿 풀 | 흔함 | 34 | 10–320 |
| 방울톡 | 💧 물 | 흔함 | 30 | 10–340 |
| 화로링 | 🔥 불 | 조금 드묾 | 18 | 120–700 |
| 몽돌이 | 🪨 바위 | 희귀 | 9 | 350–1300 |
| 찌릿콩 | ⚡ 전기 | 전설 | 3 | 900–2600 |

몬스터를 추가하려면 `public/monsters/<id>.png`를 넣고 `MONSTERS`에 항목을 하나 더합니다. 저장 데이터는 종류 ID로 기록하므로 기존 ID는 바꾸지 마세요.

## 구조

```
src/
  core/      geo.ts(하버사인 거리·미터 오프셋), random.ts(시드 난수), korea.ts(플레이 영역)
  game/      지도·GPS를 모르는 순수 게임 로직
             creatures · spawner · rules · GameState · storage(SaveStore 인터페이스)
  gps/       LocationSource 인터페이스, platform.ts(앱이면 CapacitorGps, 브라우저면 BrowserGps)
             BrowserGps · CapacitorGps(실제 GPS) · Simulator(가짜 위치) · PositionFilter(튐 제거·평활화)
  map/       MapProvider 인터페이스
             KakaoProvider · LeafletProvider · createProvider(선택·폴백)
  monsters/  catalog(5종·속성·희귀도·CP 범위·이미지) · capture(포획 확률·조우 상태 머신). DOM 없음
  ar/        ArEncounter(조우 화면: 카메라·자이로·던지기 연출) · throw(스와이프 → 낙하 지점, 명중 판정)
             orientation(자이로 각도 → 화면 오프셋) · ar.css
  app/       config(.env + URL 파라미터) · hud(화면 UI)
  main.ts    연결: 위치 → 보정 → 게임 상태 → 지도 마커·HUD, 몬스터 탭 → AR 조우 → 결과 저장
public/monsters/  몬스터 이미지(투명 PNG)
android/     Capacitor Android 프로젝트 (npx cap add android로 생성)
capacitor.config.ts  앱 ID·이름, 웹 결과물 폴더(dist)
```

- **로드뷰 속 몬스터:** `MapProvider.showStreetView(pos, el, markers)`에 마커를 넘기면 `KakaoProvider`가 로드뷰 `init` 뒤에 `CustomOverlay`로 세웁니다(고도 −2.3m = 카메라 높이만큼 내려 땅에 닿게, 보이는 거리 150m). 값은 `KakaoProvider.ts`의 `ROADVIEW_GROUND_ALTITUDE`·`ROADVIEW_RANGE_M`, 크기는 `main.ts`의 `roadviewSize`, 어떤 몬스터를 세울지는 `roadviewMonsters`(`GameState.check`가 ok인 것만).
- **지도 제공사 바꾸기:** `MapProvider`를 구현한 클래스를 하나 추가하고 `createProvider.ts`에 등록하면 됩니다. 게임 코드는 바꿀 필요가 없습니다.
- **서버 저장으로 바꾸기:** `SaveStore`(load/save/clear)를 구현해서 `main.ts`의 `LocalStorageStore` 자리에 넣습니다.
- 개발 중에는 브라우저 콘솔의 `__game`으로 상태를 볼 수 있습니다. 예: `__game.state.visibleSpawns(Date.now())`, `__game.state.monsters`.
- 조우 흐름: `GameState.beginEncounter`(거리·만료 확인, CP 결정) → `runEncounter`(AR 화면, `caught`/`fled`/`ran` 반환) → `GameState.finishEncounter`(저장).

## 알려진 한계와 다음에 할 일

- **갈 수 없는 곳에 스폰됨:** 바다, 호수, 건물 안, 고속도로 위에도 생물이 생깁니다. 1차 버전에서는 일부러 무시했습니다. 다음 단계에서 육지·도로 데이터(예: 카카오 로컬 API의 주변 장소, OSM 토지 이용 정보)로 걸러낼 수 있습니다.
- **국경 판정이 대략적임:** 휴전선과 대마도 근처는 경계가 정확하지 않습니다. 대신 국내 섬(백령도·울릉도·독도·제주·마라도)은 포함되도록 잡았습니다.
- **실제 GPS는 휴대폰에서 아직 확인하지 못했습니다:** 위 "휴대폰에서 해 보기"를 참고하세요.
- **AR은 실제 폰에서 아직 확인하지 못했습니다:** 자이로 방향 고정, 후면 카메라, 터치 스와이프 감도는 PC 브라우저에서 가짜 카메라·가짜 센서 이벤트로만 확인했습니다. 화면을 가로로 돌리면 자이로 방향이 맞지 않습니다(세로 화면 기준).
- **앱(WebView)에서 사진 저장:** 📷의 "저장" 링크(다운로드)는 Android WebView에서 동작하지 않을 수 있습니다. 미리보기 이미지를 길게 눌러 저장하거나, 다음 단계에서 Capacitor Filesystem/Share로 바꿉니다.
- **앱에서 화면이 꺼지면 위치가 멈춥니다:** 백그라운드 위치 추적은 넣지 않았습니다(배터리와 추가 권한 문제).
