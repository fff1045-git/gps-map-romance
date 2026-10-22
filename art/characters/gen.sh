#!/bin/bash
# 사용: gen.sh <파일id> <캐릭터 설명>            → art/characters/raw/<파일id>.png (새로 그림)
#       gen.sh <파일id> <표정 지시> <기준그림.png> → 기준 그림을 편집해 표정만 바꿈
# Codex(GPT 이미지 생성)로 미연시 스탠딩 일러스트를 마젠타 단색 배경에 그린다. 배경 제거는 key.py.
DIR="$(cd "$(dirname "$0")" && pwd)"
ID="$1"; DESC="$2"; BASE="$3"
STYLE="Art style (follow exactly): flashy premium mobile gacha game character splash art, strongly stylized anime (NOT semi-realistic). Face: large expressive anime eyes with gradient irises and sparkling multi-layer highlights, small simple nose, small simple mouth, smooth simplified face, fresh lively look. High saturation and high contrast: vivid jewel-tone colors, deep crisp shadows, strong colored rim light, glossy hair with sharp specular bands, a few subtle sparkle accents near the character only. Very clean thin line art, crisp two-step cel shading. Outfit: one coherent, clean game-character uniform design with a clear silhouette, a single strong point color, and a few neat details (badge, trim, ribbon); no messy layering, no random extra garments. Pose: dynamic and lively (slight lean, turned shoulders, expressive hand gesture), still fully inside the frame. The character is a clearly ADULT woman in her mid-to-late twenties (adult proportions, NOT childlike, NOT a teenager), modest outfit that fully covers chest and torso (no cleavage, no bare midriff, no short skirt), non-sexualized pose. Standing sprite framed from head to mid-thigh, centered, head near the top with a small margin, portrait 1024x1536. Background: perfectly flat solid pure magenta (#FF00FF) everywhere, no floor, no cast shadow, no glow on the background, no halo, no text, no logo, no signature, no border. The character must not contain any magenta, hot pink or purple colors. ORIGINAL character for an indie game: she must not resemble any real person or any existing game, anime or manga character."
if [ -z "$BASE" ]; then
  PROMPT="이미지 생성 도구로 아래 캐릭터 그림 한 장을 만들어 이 폴더의 raw/${ID}.png 로 저장하고, 저장한 경로만 답해. 다른 파일은 만들거나 고치지 마.

Character: ${DESC}

${STYLE}"
  IMG=()
else
  PROMPT="첨부한 그림을 편집해(새로 그리지 말고). 얼굴 표정만 바꾸고 나머지(인물 디자인, 머리, 옷, 자세, 구도, 크기, 위치, 화풍, 마젠타 단색 배경)는 그대로 둬. 결과를 이 폴더의 raw/${ID}.png 로 저장하고(원본 덮어쓰기 금지), 저장한 경로만 답해. 다른 파일은 만들거나 고치지 마.

Expression change: ${DESC}

${STYLE}"
  IMG=(-i "$BASE")
fi
printf '%s' "$PROMPT" | ~/bin/codex.cmd exec --skip-git-repo-check -s workspace-write -C "$DIR" "${IMG[@]}" -o "$DIR/raw/${ID}.txt" - > "$DIR/raw/${ID}.log" 2>&1
echo "done $ID exit=$?"
