#!/bin/bash
# 사용: gen_cg.sh <캐릭터id> <장면 설명>  → art/characters/raw/<id>_ending.png (가로 1536x1024 엔딩 CG)
# 기준 그림(raw/<id>_base.png)을 첨부해 같은 인물·같은 화풍으로 장면 일러스트를 그린다. 배경 제거는 하지 않는다.
DIR="$(cd "$(dirname "$0")" && pwd)"
ID="$1"; SCENE="$2"
STYLE="Art style: exactly the same flashy premium mobile gacha splash-art anime style, coloring, line art and character design as the attached reference image (same face, hair, eyes and outfit details). Full illustrated background (this is an ending CG event illustration for a dating-sim game), cinematic composition, high saturation, strong rim light, sparkling atmosphere. The character is the same clearly ADULT woman as in the reference, modest fully covering outfit, non-sexualized. The player/viewer is never shown except possibly one hand at the frame edge. No text, no letters, no logo, no signature, no watermark. Landscape 1536x1024."
PROMPT="첨부한 그림 속 인물을 그대로(같은 얼굴·머리·옷·화풍) 써서 새 장면 일러스트 한 장을 만들어 이 폴더의 raw/${ID}_ending.png 로 저장하고, 저장한 경로만 답해. 첨부 원본은 고치지 마. 다른 파일은 만들거나 고치지 마.

Scene: ${SCENE}

${STYLE}"
printf '%s' "$PROMPT" | ~/bin/codex.cmd exec --skip-git-repo-check -s workspace-write -C "$DIR" -i "$DIR/raw/${ID}_base.png" -o "$DIR/raw/${ID}_ending.txt" - > "$DIR/raw/${ID}_ending.log" 2>&1
echo "done ${ID}_ending exit=$?"
