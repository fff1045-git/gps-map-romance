# GPS 지도 연애

카카오 위성 지도(스카이뷰) 위에서 내 주변 실제 카페·대학교·공원으로 걸어가 캐릭터를 만나는 1인용 연애 게임입니다.
만나면 비주얼노벨식 대화가 열리고, 선택지에 따라 호감도가 바뀝니다. 캐릭터 3명, 각 5화, 호감도에 따라 해피 엔딩이나 친구 엔딩으로 끝납니다.

- 웹: Vite + TypeScript. 앱: [Capacitor](https://capacitorjs.com) Android(디버그 APK).
- 서버는 없습니다. 진행은 브라우저(앱) 저장소 `localStorage`의 `gps-romance/save`에 저장됩니다.
- GPS 몬스터 수집 게임(`C:\c_b\map`)을 복사해서 출발했고, 지도·GPS·시뮬레이터 코드를 같이 씁니다.
- 설계: [docs/superpowers/specs/2026-10-22-gps-romance-design.md](docs/superpowers/specs/2026-10-22-gps-romance-design.md)

## 실행

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:5175> 를 엽니다. **포트는 5175로 고정**입니다(다른 GPS 게임들이 5173·5174를 씁니다).

- PC(localhost)에서는 **시뮬레이터**로 시작합니다. WASD·방향키로 걷고 Shift로 달립니다. 지도를 누르면 300m 안이면 걸어가고, 더 멀면 순간이동합니다.
- 시작 위치는 `?at=` 지정 → 현재 위치 → 마지막 위치 순서입니다. 셋 다 없으면 검색창이나 지도 클릭으로 고르라는 안내가 뜹니다. 고정 기본 좌표는 없습니다.
- URL 옵션: `?sim=1|0`(시뮬레이터 강제), `?map=kakao|leaflet`, `?tiles=satellite|osm`, `?at=37.5663,126.9779`(시작 위치 강제, 테스트용).
- 개발용 콘솔 도우미: `__game.state.skipRest()`(쉬는 시간 끝내기), `__game.source.teleport({lat, lng})`(시뮬레이터 순간이동).

### 테스트

```bash
npm test          # 단위 테스트(vitest)
npm run build     # 타입 검사 + 빌드
```

## 카카오맵 설정

`.env.example`을 `.env.local`로 복사하고 카카오 **JavaScript 키**를 넣습니다. `.env.local`은 git에 올라가지 않습니다.

```
VITE_KAKAO_JS_KEY=카카오_JavaScript_키
```

카카오 디벨로퍼스 → 내 애플리케이션(앱 ID 1611654) → 플랫폼 → Web → **사이트 도메인**에 다음이 있어야 합니다.

- **`http://localhost:5175`** ← 이 게임의 개발 서버. **아직 등록되지 않았다면 추가해 주세요.** 없으면 위쪽에 "카카오 SDK 스크립트를 불러오지 못했습니다"가 뜨고 개발용 지도(Esri 위성)로 대신 그립니다.
- `https://localhost` ← Android 앱(WebView). 이미 등록돼 있습니다.

카카오 지도를 못 쓰면(키 없음·도메인 미등록·네트워크) Leaflet + Esri 위성 타일로 대신 그리고, **장소 검색도 쓸 수 없어서 캐릭터는 가상 지점("골목 카페", "동네 도서관", "작은 공원")에 나타납니다.**

| 변수 | 값 | 기본 |
|---|---|---|
| `VITE_MAP_PROVIDER` | `kakao` / `leaflet` | `kakao` |
| `VITE_KAKAO_JS_KEY` | 카카오 JavaScript 키 | (없음) |
| `VITE_KAKAO_MAP_TYPE` | `hybrid`(위성+지명) / `skyview`(위성만) | `hybrid` |
| `VITE_FALLBACK_TILES` | `satellite` / `osm` | `satellite` |

## 게임 규칙

| 캐릭터 | 나이·직업 | 나타나는 곳(카카오 장소 검색) |
|---|---|---|
| 한서윤 | 27, 동네 카페 바리스타 | 카페(CE7) |
| 윤채아 | 25, 천문학 대학원생 | "대학교"·"도서관" 키워드, 문화시설(CT1) |
| 강도하 | 29, 물리치료사·러닝 크루 리더 | "공원" 키워드, 관광명소(AT4) |

- 내 위치 반경 1km 안에서 그 유형의 실제 장소를 찾고, 1시간마다 그중 한 곳에 캐릭터가 서 있습니다(같은 시간이면 같은 곳). 400m 넘게 움직이면 주변 장소를 다시 찾습니다.
- 검색 결과가 없으면 근처 200~600m의 가상 지점에 나타납니다. 정해진 장소는 그 1시간 동안 걸어가는 도중에 바뀌지 않습니다.
- **40m 안**에 들어가 지도에서 캐릭터를 누르면 만남이 시작됩니다. GPS 오차가 ±100m보다 나쁘면 막힙니다.
- 만남: 대사창을 누르면(또는 Space·Enter) 다음 줄로 넘어갑니다. 선택지(1·2·3 키)에 따라 호감도가 −5~+10 바뀌고, 캐릭터 표정(기본·웃음·부끄러움)이 바뀝니다. 선택지 순서는 섞여서 나옵니다.
- 한 화를 끝까지 보면 저장되고, 그 캐릭터는 **1시간 쉰 뒤 다른 장소**에 나타납니다. 중간에 ✕ 나가기(또는 Esc)를 누르면 저장하지 않고 다음에 그 화를 처음부터 봅니다.
- 5화가 끝날 때 호감도가 **60 이상이면 해피 엔딩**(엔딩 CG), 아니면 친구 엔딩입니다. 엔딩을 본 캐릭터는 더 나오지 않습니다. 💌 인연 → 진행도 초기화로 처음부터 할 수 있습니다.
- 호감도 단계: 낯선 사이(0) · 아는 사이(15) · 친구(35) · 설렘(60) · 연인(해피 엔딩).
- 💌 인연: 캐릭터별 호감도·단계·지금 있는 곳과 거리·다음 만남까지 남은 시간. 🖼️ 앨범: 본 표정 일러스트와 엔딩 CG(누르면 크게 보기).
- 만남 화면 배경은 후면 카메라(📷로 켜고 끔)입니다. 카메라 권한이 없거나 끄면 장소 유형별 그림 배경을 씁니다.
- 국내(대한민국)에서만 나타납니다.

## 캐릭터 그림

모든 캐릭터는 성인으로 설정한 오리지널 캐릭터입니다. Codex(GPT 이미지 생성)로 만들었습니다.

- `art/characters/gen.sh <id> <설명>`: 마젠타 단색 배경 스탠딩을 새로 그립니다. `gen.sh <id> <표정 지시> raw/<기준>.png`는 기준 그림을 편집해서 표정만 바꿉니다.
- `art/characters/key.py <원본> <결과>`: 마젠타 배경을 지운 투명 PNG(긴 변 1200px).
- `art/characters/gen_cg.sh <id> <장면>`: 기준 그림을 첨부해 같은 인물로 엔딩 CG(1536×1024)를 그립니다.
- 최종 그림은 `public/characters/`(`<id>_neutral|smile|shy.png`, `<id>_ending.jpg`)에 있습니다. 원본(`art/characters/raw`)과 지난 시안(`art/characters/v1`)은 git에 올리지 않습니다.

## Android 앱(APK) — Capacitor

appId `com.gpsromance.app`, 앱 이름 "GPS 지도 연애". Android 프로젝트는 `android/`에 있습니다. 앱에서는 실제 GPS로 시작하고, 아래쪽 🕹️ 버튼으로 시뮬레이터로 바꿀 수 있습니다.

준비(한 번): JDK 21은 Android Studio 내장(`C:\Program Files\Android\Android Studio\jbr`), Android SDK는 `%LOCALAPPDATA%\Android\Sdk`. `android/local.properties`는 PC마다 다르므로 git에 올리지 않습니다.

```bash
npm run android:sync
```

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; .\android\gradlew.bat -p android assembleDebug
```

결과: `android/app/build/outputs/apk/debug/app-debug.apk`. USB 디버깅으로 설치하려면:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r android\app\build\outputs\apk\debug\app-debug.apk
```

앱 권한: 위치(정밀·대략), 카메라(만남 화면 배경), 인터넷. 위치는 **"정확한 위치"** 를 켜야 40m 안에서 만날 수 있습니다.
디버그 APK는 개인 테스트용입니다. iOS는 Mac에서 `npx cap add ios`로 붙입니다.

## 휴대폰 브라우저에서 해 보기

브라우저는 HTTPS(또는 localhost)에서만 위치를 줍니다. `npm run dev` 뒤 `cloudflared tunnel --url http://localhost:5175` 같은 터널을 열고, 받은 HTTPS 주소를 카카오 사이트 도메인에 추가한 다음 휴대폰에서 `?sim=0`을 붙여 엽니다.

## 구조

```
src/
  main.ts              시작 위치·위치 소스·지도 마커·만남 연결
  app/                 설정(config), 지도 위 UI(hud: 칩·토스트·인연 목록·앨범)
  core/                거리 계산, 국내 영역, 시드 난수
  gps/                 브라우저·Capacitor GPS, 위치 필터, 시뮬레이터
  map/                 카카오/Leaflet 어댑터(마커·원·로드뷰·장소 검색·주변 장소 검색)
  game/                GameState(진행·쉬는 시간·만남 확인), placement(장소 고르기·가상 지점),
                       PlaceFinder(주변 실제 장소 찾기), storage(localStorage), rules(거리·정확도)
  romance/             heroes(캐릭터·단계·조사), Meeting(비주얼노벨 화면), camera(후면 카메라),
                       story/(이야기 엔진 + 캐릭터별 5화)
```

이야기를 고치려면 `src/romance/story/<id>.ts`를 고칩니다. 선택지는 **첫 번째가 가장 좋은 답, 마지막이 가장 나쁜 답**이 되게 적습니다(화면에서는 섞어 보여 주고, 테스트가 이 규칙으로 해피·친구 엔딩이 모두 나오는지 확인합니다).

## 알려진 한계

- 카카오 지도·장소 검색은 `http://localhost:5175`를 카카오 도메인에 등록하기 전에는 개발 서버에서 확인하지 못했습니다(가상 지점으로만 확인).
- 실제 폰에서 GPS·후면 카메라 배경은 아직 확인하지 못했습니다. PC 브라우저에서는 카메라가 막혀 그림 배경으로 바뀌는 것까지 확인했습니다.
- 장소 검색은 한 번에 조건마다 최대 15곳(카카오 한 페이지)만 씁니다. 건물 안 장소도 그대로 씁니다.
- 앱 화면이 꺼지면 위치가 멈춥니다(백그라운드 위치 추적 없음).
