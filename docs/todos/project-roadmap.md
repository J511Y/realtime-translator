# 포르투갈 여행 실시간 번역기 프로젝트 로드맵

## 📋 프로젝트 개요

포르투갈 여행자를 위한 실시간 음성 및 이미지 번역 웹 애플리케이션

## ✅ 완료된 작업 (2025-01-03 기준)

### 1. 기초 인프라 및 협업 환경 구축

- [x] Next.js 15+ App Router 기반 프로젝트 초기화
- [x] TypeScript 엄격 모드 설정 및 기본 타입 정의
- [x] 레이어드 아키텍처 폴더 구조 생성
- [x] ESLint + Prettier + eslint-plugin-boundaries 설정
- [x] Husky + lint-staged Git Hook 설정
- [x] Jest & React Testing Library + Playwright 테스트 환경
- [x] GitHub Actions CI/CD 워크플로우
- [x] 협업 문서 및 템플릿 (README, CONTRIBUTING, Issue/PR 템플릿)
- [x] OpenAI Realtime API 2025 최신 문서 작성

## 🚀 진행 중인 작업

### 현재 단계: 실시간 음성 번역 기능 구현

## 📅 우선순위별 남은 작업 목록

### Phase 1: 실시간 음성 번역 기능 (우선순위: 높음)

#### 1.1 서버 측 구현 ✅

- [x] **Ephemeral Token 발급 API 구현** `app/api/realtime/session/route.ts`
  - [x] OpenAI Realtime API 연동
  - [x] 환경변수 검증 및 에러 처리
  - [x] 세션 만료 시간 관리
  - [x] 요청 속도 제한 구현

#### 1.2 클라이언트 측 WebRTC 구현 ✅

- [x] **Realtime 클라이언트 라이브러리** `lib/openai/realtime-client.ts`
  - [x] RTCPeerConnection 설정 및 관리
  - [x] 마이크 접근 및 오디오 스트림 처리
  - [x] SDP Offer/Answer 교환 로직
  - [x] DataChannel을 통한 이벤트 통신
  - [x] 오디오 재생 및 출력 처리

#### 1.3 번역 서비스 레이어 ✅

- [x] **번역 비즈니스 로직** `lib/hooks/useRealtimeTranslation.ts` (React Hook으로 구현)
  - [x] 언어 감지 및 번역 방향 설정
  - [x] 세션 상태 관리 (idle, listening, processing, speaking)
  - [x] 에러 복구 및 재연결 로직
  - [x] 번역 히스토리 관리

#### 1.4 React UI 컴포넌트

- [ ] **실시간 번역 인터페이스** `components/realtime/`
  - [ ] TranslationInterface.tsx (메인 컴포넌트)
  - [ ] AudioVisualizer.tsx (음성 입력 시각화)
  - [ ] TranslationDisplay.tsx (번역 결과 표시)
  - [ ] LanguageSelector.tsx (언어 선택)
  - [ ] ConnectionStatus.tsx (연결 상태 표시)

#### 1.5 타입 정의 및 유틸리티 ✅

- [x] **Realtime API 타입** `types/realtime.ts`
  - [x] 세션 생성/응답 타입 정의
  - [x] 에러 처리 타입
  - [x] WebRTC 연결 관련 타입
  - [x] 번역 세션 상태 타입
  - [x] 서버/클라이언트 이벤트 타입

### Phase 2: 이미지 OCR 및 번역 기능 (우선순위: 중간)

#### 2.1 카메라 및 이미지 처리

- [ ] **카메라 접근 및 스트리밍** `components/camera/`
  - [ ] CameraCapture.tsx (실시간 카메라 뷰)
  - [ ] ImagePreview.tsx (캡처된 이미지 미리보기)
  - [ ] 이미지 크롭 및 편집 기능

#### 2.2 OCR 서비스 구현

- [ ] **다중 OCR 제공업체 지원** `services/ocr/`
  - [ ] Google Vision API 클라이언트
  - [ ] Azure Document Intelligence 클라이언트
  - [ ] Gemini 2.5 Pro Vision 클라이언트
  - [ ] OCR 제공업체 폴백 로직

#### 2.3 이미지 번역 API

- [ ] **이미지 처리 엔드포인트** `app/api/ocr/`
  - [ ] 이미지 업로드 및 검증
  - [ ] OCR 텍스트 추출
  - [ ] 텍스트 번역 및 응답

### Phase 3: 모델 선택 및 설정 UI (우선순위: 낮음)

#### 3.1 설정 관리

- [ ] **모델 선택 인터페이스** `components/settings/`
  - [ ] ModelSelector.tsx (번역/OCR 모델 선택)
  - [ ] QualitySettings.tsx (음질, 지연시간 설정)
  - [ ] LanguagePreferences.tsx (언어 쌍 설정)

#### 3.2 사용자 프리퍼런스

- [ ] **설정 저장소** `lib/storage/`
  - [ ] LocalStorage 기반 설정 관리
  - [ ] 사용자 프로필 및 즐겨찾기
  - [ ] 번역 히스토리 저장

### Phase 4: 성능 최적화 및 고급 기능

#### 4.1 성능 최적화

- [ ] **지연시간 최소화**
  - [ ] 오디오 청크 크기 최적화
  - [ ] WebRTC 연결 품질 모니터링
  - [ ] 네트워크 적응형 품질 조정

#### 4.2 고급 번역 기능

- [ ] **컨텍스트 인식 번역**
  - [ ] 대화 컨텍스트 유지
  - [ ] 전문 용어 사전 지원
  - [ ] 번역 톤 및 스타일 조정

#### 4.3 오프라인 지원

- [ ] **PWA 기능 구현**
  - [ ] Service Worker 설정
  - [ ] 오프라인 기본 문구 지원
  - [ ] 캐시된 번역 결과 활용

## 🔧 기술적 요구사항

### 필수 환경변수

```bash
OPENAI_API_KEY=sk-...          # OpenAI Realtime API (필수)
GOOGLE_API_KEY=AIza...         # Google Vision OCR (선택)
AZURE_API_KEY=...              # Azure Document Intelligence (선택)
AZURE_ENDPOINT=https://...     # Azure 엔드포인트 (선택)
```

### 브라우저 지원

- Chrome/Edge: WebRTC 완전 지원
- Safari: WebRTC 부분 지원 (폴백 로직 필요)
- Firefox: WebRTC 지원 (테스트 필요)

### 성능 목표

- 첫 번역 응답: < 500ms
- 오디오 지연시간: < 200ms
- 이미지 OCR 처리: < 3초
- 번들 크기: < 2MB (gzipped)

## 📈 테스트 계획

### 단위 테스트

- [ ] Realtime 클라이언트 로직
- [ ] 번역 서비스 함수
- [ ] 에러 처리 및 복구
- [ ] 유틸리티 함수

### 통합 테스트

- [ ] OpenAI Realtime API 연동
- [ ] OCR 제공업체 API 연동
- [ ] WebRTC 연결 시나리오
- [ ] 에러 상황별 처리

### E2E 테스트

- [ ] 실시간 번역 전체 플로우
- [ ] 이미지 번역 전체 플로우
- [ ] 모바일 브라우저 테스트
- [ ] 네트워크 불안정 상황 테스트

## 🚀 배포 전략

### 개발 환경

- Vercel Preview Deployment (PR별 자동 배포)
- 환경변수 검증 및 모니터링

### 프로덕션 환경

- Vercel Production Deployment
- API 사용량 모니터링 및 알림
- 에러 추적 (Sentry 등)
- 성능 모니터링 (Web Vitals)

## 📊 성공 지표

### 기술적 지표

- 번역 정확도 > 90%
- 평균 응답 시간 < 500ms
- 세션 성공률 > 95%
- 재연결 성공률 > 90%

### 사용자 경험 지표

- 사용자 만족도 > 4.5/5
- 세션 지속 시간 > 5분
- 재방문률 > 60%
- 모바일 사용성 점수 > 90점

---

## 👥 에이전트 협업 가이드

### 작업 할당 및 진행

1. **Phase별 순차 진행**: Phase 1 완료 후 Phase 2 착수
2. **우선순위 준수**: 높은 우선순위 작업 먼저 완료
3. **테스트 우선**: 구현과 동시에 테스트 코드 작성
4. **문서 업데이트**: 구현 완료 시 관련 문서 즉시 업데이트

### 진행 상황 공유

- [ ] 각 작업 완료 시 이 파일의 체크박스 업데이트
- [ ] 주요 이슈 발생 시 `docs/issues/` 폴더에 문서화
- [ ] 새로운 아이디어나 개선사항은 `docs/ideas/` 폴더에 기록

### 코드 품질 관리

- [ ] 모든 커밋 전 lint 및 test 통과
- [ ] 타입스크립트 엄격 모드 준수
- [ ] 레이어드 아키텍처 의존성 규칙 준수
- [ ] 한국어 주석 및 docstring 작성

**마지막 업데이트**: 2026-01-11
**다음 리뷰 예정**: Phase 1 완료 후
