---
description: Next.js 15 프로젝트 부트스트랩 워크플로우
auto_execution_mode: 1
---

# Next.js 15 프로젝트 부트스트랩

1. 현재 상태 확인
   - 현재 저장소 구조를 요약한다.
   - 이미 존재하는 설정 파일(`package.json`, `tsconfig.json`, `tailwind.config.*`)이 있는지 확인한다.

2. 기본 스캐폴딩 생성
   - Next.js 15+ App Router 기반으로 프로젝트 초기화 명령을 제안한다.
   - TypeScript/ESLint/Tailwind를 포함하도록 한다.

3. 아키텍처 스켈레톤 구성
   - `app/` 기반으로 페이지, 레이아웃, 전역 스타일의 최소 구성을 만든다.
   - Server Component 우선 원칙을 적용한다.

4. 환경변수/보안 셋업
   - `.env.example`을 만들고 필요한 키들을 정의한다.
   - 클라이언트로 키가 노출되지 않도록 API Route 경유 구조를 강제한다.

5. 실행/검증
   - 로컬 실행 명령을 안내한다.
   - 브라우저에서 기본 페이지가 잘 뜨는지 확인한다.
