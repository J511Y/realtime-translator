# Realtime Translator (포르투갈 여행 실시간 번역기)

포르투갈 여행자를 위한 실시간 음성 및 이미지 번역 웹 애플리케이션입니다.

## 🚀 기술 스택

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Realtime Audio**: OpenAI Realtime API
- **OCR/Vision**: Google Vision API / Gemini Vision
- **Testing**: Jest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions

## 🛠️ 개발 환경 설정

### 사전 요구 사항

- Node.js 20+
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 브라우저 설치 (Playwright)
npx playwright install chromium

# 로컬 개발 서버 실행
npm run dev
```

### 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 필요한 API 키를 입력하세요.

```bash
cp .env.example .env.local
```

## 🧪 테스트 및 품질 관리

```bash
# Lint 검사 및 수정
npm run lint

# 타입 체크
npm run type-check

# 단위 테스트 실행 (Jest)
npm test

# E2E 테스트 실행 (Playwright)
npm run test:e2e
```

## 🏗️ 아키텍처 규칙

본 프로젝트는 레이어드 아키텍처를 따르며, 각 레이어간 참조 규칙이 엄격히 제한됩니다. (AGENTS.md 참조)

- `app/`, `components/`: UI 레이어
- `services/`: 비즈니스 로직 및 오케스트레이션
- `lib/`: 외부 SDK 및 기술 구현
- `repositories/`: 데이터 접근 계층

## 🤝 협업 가이드

- **커밋 컨벤션**: Conventional Commits 준수
- **코드 스타일**: Prettier 및 ESLint 자동 적용 (저장 시 자동 수정 권장)
- **PR 규칙**: 모든 테스트 통과 및 AGENTS.md 가이드라인 준수 필수
- **주석**: 모든 주석과 Docstring은 **한국어**로 작성합니다.
