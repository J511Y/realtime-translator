# CHANGELOG

## [2026-01-03] - 프로젝트 초기화 및 협업 인프라 구축

### Added

- Next.js 15+ (App Router) 기반 프로젝트 초기화
- TypeScript 엄격 모드 설정 및 기본 도메인 타입 정의 (`types/index.ts`)
- 협업을 위한 기본 폴더 구조 생성 (`components`, `features`, `lib`, `services`, `repositories`, `types`)
- ESLint + Prettier 설정
  - `eslint-plugin-boundaries`를 통한 레이어드 아키텍처 의존성 검증 규칙 추가
  - Named Export 사용 강제 (Page, Layout 등 Next.js 예약 파일 제외)
  - `any` 타입 사용 제한
- Husky + lint-staged 기반 Git Hook 설정 (커밋 전 Lint/Format 자동화)
- 테스트 환경 구축
  - Jest & React Testing Library (단위/컴포넌트 테스트)
  - Playwright (E2E 테스트)
  - 홈 페이지 렌더링 검증을 위한 기초 스모크 테스트 추가
- GitHub Actions CI 워크플로우 추가 (Lint, Type Check, Test 자동화)
- 협업 문서 및 템플릿 추가
  - `README.md` (프로젝트 개요 및 실행 방법)
  - `CONTRIBUTING.md` (작업 가이드라인)
  - Issue & Pull Request 템플릿
- 개발 환경 표준화 (`.editorconfig`, `.vscode/settings.json`)
