# 기능 명세 및 설계 (Feature Specifications & Design)

본 문서는 실시간 번역 프로젝트의 핵심 기능에 대한 상세 명세와 설계를 기술합니다.

## 1. 실시간 음성 번역 (Realtime Voice Translation)

### 1.1 개요

사용자의 음성을 실시간으로 캡처하여 OpenAI Realtime API를 통해 포르투갈어(또는 한국어)로 즉시 번역하고 음성으로 출력합니다.

### 1.2 상세 기능

- **음성 캡처**: 브라우저 WebRTC API(`getUserMedia`)를 사용하여 오디오 스트림 확보
- **실시간 통신**: WebSocket을 통한 OpenAI Realtime API 연결
- **음성 합성(TTS)**: 번역된 텍스트를 자연스러운 음성으로 즉시 재생
- **상태 보존**: 음성 감정, 톤, 속도를 최대한 유지하여 번역

### 1.3 인터페이스 설계

- **Service**: `services/voiceTranslationService.ts`
- **Lib**: `lib/openai/realtime-client.ts`
- **Component**: `features/voice/VoiceTranslator.tsx`

---

## 2. 이미지 OCR 및 번역 (Image OCR & Translation)

### 2.1 개요

카메라로 촬영하거나 업로드한 이미지 내의 텍스트(메뉴판, 표지판 등)를 인식하여 번역합니다.

### 2.2 상세 기능

- **카메라 스트리밍**: 실시간 카메라 뷰파인더 구현
- **OCR 엔진**: Google Vision API 또는 Gemini Vision을 통한 텍스트 추출
- **오버레이 번역**: 원본 이미지 위의 텍스트 위치에 번역된 텍스트를 오버레이 표시
- **언어 자동 감지**: 소스 언어를 자동으로 감지하여 설정된 대상 언어로 번역

### 2.3 인터페이스 설계

- **Service**: `services/ocrService.ts`
- **Lib**: `lib/google/vision-client.ts`
- **Component**: `features/ocr/CameraTranslator.tsx`

---

## 3. 모델 선택 및 설정 (Model Selection & Config)

### 3.1 개요

사용자가 상황에 맞는 모델을 선택하고 설정을 관리합니다.

### 3.2 상세 기능

- **모델 스위칭**: OpenAI, Gemini, Google, Azure 등 공급사별 모델 선택
- **환경 설정**: 마이크/카메라 선택, 음성 속도, 자동 번역 여부 등 설정
- **비용 최적화**: 사용량 모니터링 및 저비용 모델 폴백 옵션

---

## 4. API 명세 (Draft)

### POST `/api/translation`

- **Request**: `{ text: string, source: string, target: string, model: string }`
- **Response**: `{ translatedText: string, model: string, usage: object }`

### POST `/api/ocr`

- **Request**: `FormData (image, targetLang)`
- **Response**: `{ extractedText: string, translatedText: string, blocks: Array }`
