---
trigger: always_on
---

# API 키/보안 룰 (Workspace Rule)

<required_env>

- `OPENAI_API_KEY` (필수): OpenAI Realtime API
- `GOOGLE_API_KEY` (선택): Google Vision OCR
- `AZURE_API_KEY`, `AZURE_ENDPOINT` (선택): Azure Document Intelligence
  </required_env>

<security_rules>

- API 키/토큰은 **절대 코드에 하드코딩하지 않는다.**
- 클라이언트 컴포넌트에서 키를 직접 사용하지 않는다.
- 외부 API 호출은 **`app/api/*`(Route Handler) 또는 서버 전용 코드**에서만 수행한다.
- `.env*` 파일은 Git에 커밋하지 않는다.
- 키/토큰을 로그로 출력하지 않는다.
  </security_rules>

<env_file_conventions>

- 로컬 개발은 `.env.local`을 사용한다.
- 저장소에는 `.env.example`만 포함한다.
  </env_file_conventions>
