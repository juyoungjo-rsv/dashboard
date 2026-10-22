# Sweetspot 썸네일 생성 플러그인

스위트스팟 인스타그램 포트폴리오 콘텐츠 썸네일을 피그마에서 자동 생성하는 플러그인입니다.

## 기능

- 🎨 **검정색/흰색 그라데이션** 선택
- 🖼️ **배경 이미지** 자동 삽입
- ✍️ **메인 문구** 입력 (시네마 폰트 예정)
- 📝 **서브 문구** 입력 (프리텐다드 폰트 예정)
- 🎯 **로고** 자동 배치 (파란색/흰색)
- ⚡ **원클릭 생성**

## 사용 방법

1. **그라데이션 색상 선택**
   - 검정색: 텍스트가 잘 보이는 어두운 배경
   - 흰색: 밝은 배경 이미지에 적합

2. **배경 이미지 선택**
   - "이미지 선택" 버튼 클릭
   - JPG/PNG 파일 선택

3. **메인 문구 입력**
   - 핵심 메시지 작성 (예: "팝업스토어 기획 방법 총정리")
   - 자동으로 2줄로 레이아웃됨

4. **서브 문구 입력** (선택)
   - 추가 설명 작성
   - 빈칸으로 둬도 됨

5. **생성 버튼 클릭**
   - 피그마 문서에 썸네일이 생성됨
   - 필요 시 세부 조정 가능

## 파일 구조

```
figma-thumbnail-plugin/
├── manifest.json          # 플러그인 메타데이터
├── plugin.ts             # 플러그인 로직 (TypeScript)
├── ui.html               # UI 마크업
├── ui.js                 # UI 스크립트
├── package.json          # 의존성
└── README.md            # 이 파일
```

## 설치 및 개발

1. **로컬 개발**
   ```bash
   cd figma-thumbnail-plugin
   npm install
   npm run build
   ```

2. **피그마 플러그인 추가**
   - Figma에서 "Plugins" → "Development" → "New plugin"
   - 이 폴더의 `manifest.json` 선택

3. **수정 사항 테스트**
   - `plugin.ts` 또는 `ui.js` 수정 후
   - 피그마에서 "Plugins" → "Development" → "Reload" 실행

## TODO (개선 예정)

- [ ] 폰트 변경: Roboto → 시네마 (Cinematic)
- [ ] 폰트 변경: Roboto → 프리텐다드 (Pretendard)
- [ ] 스위트스팟 공식 로고 이미지 삽입
- [ ] 로고 컬러 옵션 (파란색/흰색)
- [ ] 프리셋 저장 기능
- [ ] 배치 생성 (여러 개 한번에)
- [ ] 피그마 컴포넌트로 저장

## 작성자

Made by Claude Code | Sweetspot

## 라이선스

Internal use only
