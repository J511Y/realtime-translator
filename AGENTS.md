# 포르투갈 여행 실시간 번역 프로젝트 에이전트 가이드

## 프로젝트 목표

포르투갈 여행자를 위한 실시간 음성 및 이미지 번역 웹 애플리케이션 개발

## 핵심 기술 스택

- **Next.js 15+** (App Router, Server Components 필수)
- **TypeScript** (엄격 모드)
- **Tailwind CSS** (스타일링)
- **OpenAI Realtime API** (음성 번역)
- **Google Vision API** 또는 **Gemini Vision** (이미지 OCR)

## 개발 원칙

### 1. 아키텍처

- **Server Components 우선**: 가능한 모든 컴포넌트는 서버 컴포넌트로 구현
- **Client Components 최소화**: WebRTC, getUserMedia 등 브라우저 API가 필요한 경우에만 사용
- **API 라우트 활용**: 모든 외부 API 호출은 Next.js API 라우트를 통해 처리

### 1-1. 폴더 구조(아키텍처) 및 책임

아래 구조를 기준으로 기능을 확장한다.

```
realtime-translator/
  app/                      # Next.js App Router 엔트리
    (routes)/               # 라우트 그룹(선택)
    api/                    # 외부 API 프록시/세션 발급 등 서버 경계
  components/               # UI 컴포넌트(가능하면 Server Component)
  features/                 # 기능 단위(번역/ocr 등) 모듈(선택)
  lib/                      # 외부 SDK 클라이언트, 공통 유틸
  services/                 # 서비스 레이어(비즈니스 로직, 오케스트레이션)
  repositories/             # 데이터 접근 계층(선택: 스토리지/캐시 등)
  types/                    # 공용 타입
  .windsurf/                # Windsurf 워크스페이스 설정(Workflows/Rules/Hooks)
```

### 1-2. 레이어 분리 원칙(반드시 준수)

- **UI 레이어**: `app/`, `components/`는 UI와 사용자 상호작용 중심으로 구성한다.
- **서비스 레이어**: `services/`는 비즈니스 규칙과 오케스트레이션을 담당한다.
  - 예: 번역 세션 생성, 모델 선택에 따른 분기, 비용/레이트리밋 제어, 에러 표준화
- **외부 연동 레이어**: `lib/`는 공급사 SDK 및 HTTP 호출 등 “기술 구현”을 담당한다.
  - 예: OpenAI/Gemini/Vision 호출 클라이언트, 요청/응답 매핑
- **데이터 접근 레이어(선택)**: `repositories/`는 캐시/스토리지/DB 등 데이터 I/O를 담당한다.

금지:

- `app/` 또는 `components/`에서 외부 API를 직접 호출하거나(키 노출 위험) 공급사별 로직을 직접 구현하지 않는다.
- `lib/`에서 화면 상태/렌더링/브라우저 API에 의존하는 로직을 넣지 않는다.

### 1-3. 디렉토리별 명확한 규칙

- `app/`
  - 라우트/페이지 구성만 담당한다.
  - 외부 호출은 `app/api/*` 또는 `services/*`를 통해서만 수행한다.
- `app/api/`
  - **외부 API 키를 사용하는 유일한 서버 경계**로 취급한다.
  - 요청 검증/에러 변환/응답 스키마를 표준화한다.
- `components/`
  - 기본은 Server Component.
  - 브라우저 API 필요 시에만 `'use client'`.
- `services/`
  - 기능 단위 서비스(예: `translationService`, `ocrService`)로 분리한다.
  - 모델 선택/폴백/비용 제어 로직은 서비스 레이어에서 중앙집중 관리한다.
- `lib/`
  - 공급사별 클라이언트는 파일/폴더로 분리한다.
  - 입력/출력 타입을 명확히 하고 any를 사용하지 않는다.
- `types/`
  - API 응답/요청, 도메인 모델 타입을 중앙 관리한다.

### 2. 음성 번역 구현

- **OpenAI Realtime API** 사용 (Web Speech API 대신)
- **WebSocket 연결**로 실시성 확보
- **WebRTC**로 브라우저 네이티브 오디오 처리
- 음성 감정, 톤, 속도 보존 기능 구현

### 3. 이미지 처리 구현

- **WebRTC getUserMedia**로 카메라 스트리밍
- **Google Vision API** 또는 **Gemini 2.5 Pro Vision**으로 OCR
- **Tesseract.js 사용 금지**: 성능이 현저히 낮음 (벤치마크 기준)
- 실시간 이미지 분석 및 번역 기능 구현

### 4. 모델 선택 기능

```typescript
// 반드시 이 구조 따를 것
const AVAILABLE_MODELS = {
  translation: {
    openai: 'gpt-4o-realtime',
    gemini: 'gemini-2.5-pro',
  },
  ocr: {
    google: 'cloud-vision',
    azure: 'document-intelligence',
    gemini: 'gemini-2.5-pro-vision',
  },
};
```

## 코딩 컨벤션

### 파일 명명

- 컴포넌트: `PascalCase.tsx`
- 훅: `useCamelCase.ts`
- 유틸리티: `camelCase.ts`
- 타입: `camelCase.ts`
- API 라우트: `route.ts`

### 컴포넌트 구조

```typescript
// Server Component (기본)
export function ComponentName() {
  return <div>...</div>
}

// Client Component (필요시만)
'use client'

export function ComponentName() {
  return <div>...</div>
}
```

### API 라우트 구조

```typescript
// app/api/translation/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // API 로직
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## 보안 규칙

- **API 키 절대 노출 금지**: 모든 API 키는 환경변수로 관리
- **클라이언트에 API 키 직접 전달 금지**
- **CORS 설정**: 개발/운영 환경에 맞게 적절히 설정
- **에러 핸들링**: 사용자에게 기술적 정보 노출 금지

## 주석 및 문서화

- **모든 주석은 한국어로 작성** (사용자 요구사항)
- **docstring도 한국어로 작성**
- **복잡한 로직에는 반드시 주석 추가**

## 성능 최적화

- **실시간 처리**: 음성/이미지 지연 시간 최소화
- **메모리 관리**: WebSocket 연결 적절히 정리
- **번들 최적화**: Next.js 자동 최적화 활용

## 테스트

- **단위 테스트**: 핵심 비즈니스 로직
- **통합 테스트**: API 연동
- **E2E 테스트**: 사용자 시나리오 기반

## 배포 고려사항

- **Vercel 배포** 권장 (Next.js 최적화)
- **환경변수 관리**: 각 환경에 맞게 설정
- **API 요금 모니터링**: OpenAI, Google API 사용량 추적

## 금지사항

- ❌ Tesseract.js 사용 (성능 문제)
- ❌ Web Speech API 사용 (Realtime API가 우수)
- ❌ API 키 하드코딩
- ❌ Default Export (Named Export 사용)
- ❌ Any 타입 사용 (엄격한 TypeScript)

## 협업 및 인프라 설정 (업데이트됨)

### 1. 품질 관리 및 자동화

- **Lint/Format**: ESLint (Next.js + TS + Boundaries) 및 Prettier 적용
  - Named Export 사용 강제 (Page/Layout 등 Next.js 예약 파일 제외)
  - 레이어드 아키텍처 의존성 검증 (eslint-plugin-boundaries)
- **Git Hooks**: Husky + lint-staged를 통한 커밋 전 자동 검사
- **CI/CD**: GitHub Actions를 통한 자동화된 빌드 및 테스트 (Lint -> Type Check -> Unit -> E2E)

### 2. 테스트 환경

- **Unit/Component Test**: Jest + React Testing Library (`__tests__/`)
- **E2E Test**: Playwright (`e2e/`)
- **수행 명령어**:
  - `npm test`: 단위 테스트 실행
  - `npm run test:e2e`: E2E 테스트 실행

### 3. 문서 및 가이드라인

- **README.md**: 프로젝트 개요 및 환경 설정 가이드
- **CONTRIBUTING.md**: 브랜치 전략, 작업 프로세스, 커밋 컨벤션
- **Templates**: Issue/Pull Request 템플릿 적용

## 우선순위 (진행 현황)

1. **✅ 기초 인프라 및 협업 틀 구축**
2. **실시간 음성 번역** 구현 (진행 예정)
3. **이미지 OCR 및 번역** 구현
4. **모델 선택 UI** 구현
5. **성능 최적화** 및 테스트

이 가이드를 따라 프로젝트를 개발하면 포르투갈 여행자에게 최고의 실시간 번역 경험을 제공할 수 있습니다.
