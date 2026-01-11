# OpenAI Realtime API 이벤트 & 데이터 구조 2025

## 1. 핵심 이벤트 플로우

### 연결 및 세션 관리

```typescript
// 세션 초기화 (서버에서 자동 전송)
{
  type: 'session.created',
  session: {
    id: 'sess_xxx',
    model: 'gpt-4o-realtime-preview',
    expires_at: 1704067200,
    modalities: ['text', 'audio'],
    voice: 'verse'
  }
}

// 세션 설정 업데이트 (클라이언트 → 서버)
{
  type: 'session.update',
  session: {
    instructions: '번역 지시사항',
    voice: 'verse' | 'alloy' | 'echo',
    input_audio_format: 'pcm16' | 'opus',
    output_audio_format: 'pcm16' | 'opus' | 'mp3',
    input_audio_transcription: {
      model: 'whisper-1'
    },
    turn_detection: {
      type: 'server_vad' | 'none',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    },
    tools: [/* 함수 도구 정의 */],
    tool_choice: 'auto' | 'none' | 'required'
  }
}
```

## 2. 오디오 처리 이벤트

### 입력 오디오 (마이크 → OpenAI)

```typescript
// 오디오 데이터 전송 (WebSocket 전용)
{
  type: 'input_audio_buffer.append',
  audio: 'base64_encoded_audio_data'
}

// 오디오 입력 완료 신호
{
  type: 'input_audio_buffer.commit'
}

// 오디오 버퍼 초기화
{
  type: 'input_audio_buffer.clear'
}

// 음성 감지 시작 (서버 → 클라이언트)
{
  type: 'input_audio_buffer.speech_started',
  audio_start_ms: 1234,
  item_id: 'msg_xxx'
}

// 음성 감지 종료
{
  type: 'input_audio_buffer.speech_stopped',
  audio_end_ms: 5678,
  item_id: 'msg_xxx'
}
```

### 출력 오디오 (OpenAI → 스피커)

```typescript
// 오디오 응답 시작
{
  type: 'response.audio.started',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0
}

// 오디오 데이터 스트리밍
{
  type: 'response.audio.delta',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0,
  content_index: 0,
  delta: 'base64_encoded_audio_chunk'
}

// 오디오 응답 완료
{
  type: 'response.audio.done',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0
}
```

## 3. 텍스트 처리 이벤트

### 실시간 텍스트 스트리밍

```typescript
// 텍스트 응답 시작
{
  type: 'response.text.started',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0
}

// 텍스트 델타 스트리밍
{
  type: 'response.text.delta',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0,
  content_index: 0,
  delta: '번역된 텍스트 조각'
}

// 오디오 전사 (Whisper)
{
  type: 'response.audio_transcript.delta',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0,
  content_index: 0,
  delta: '인식된 음성 텍스트'
}

// 텍스트 응답 완료
{
  type: 'response.text.done',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0,
  content_index: 0
}
```

## 4. 응답 제어 이벤트

### 응답 생성 관리

```typescript
// 응답 생성 요청
{
  type: 'response.create',
  response: {
    modalities: ['text', 'audio'],
    instructions: '추가 지시사항',
    voice: 'verse',
    output_audio_format: 'opus',
    tools: [/* 이 응답에서만 사용할 도구 */],
    tool_choice: 'auto',
    temperature: 0.8,
    max_output_tokens: 4096
  }
}

// 응답 생성 시작
{
  type: 'response.created',
  response: {
    id: 'resp_xxx',
    status: 'in_progress',
    status_details: null,
    output: []
  }
}

// 응답 생성 완료
{
  type: 'response.done',
  response: {
    id: 'resp_xxx',
    status: 'completed' | 'cancelled' | 'failed',
    status_details: {
      type: 'max_output_tokens' | 'content_filter'
    },
    output: [
      {
        id: 'msg_xxx',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: '완성된 번역 텍스트'
          },
          {
            type: 'audio',
            audio: 'base64_complete_audio_data'
          }
        ]
      }
    ],
    usage: {
      input_tokens: 150,
      output_tokens: 200,
      input_token_details: {
        cached_tokens: 0,
        text_tokens: 100,
        audio_tokens: 50
      },
      output_token_details: {
        text_tokens: 150,
        audio_tokens: 50
      }
    }
  }
}

// 응답 취소
{
  type: 'response.cancel'
}
```

## 5. 함수 호출 이벤트

### Function Calling 플로우

```typescript
// 함수 호출 시작
{
  type: 'response.function_call_arguments.started',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0,
  call_id: 'call_xxx'
}

// 함수 인자 스트리밍
{
  type: 'response.function_call_arguments.delta',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0,
  call_id: 'call_xxx',
  delta: '{"city": "Lisbon"'
}

// 함수 호출 완료
{
  type: 'response.function_call_arguments.done',
  response_id: 'resp_xxx',
  item_id: 'msg_xxx',
  output_index: 0,
  call_id: 'call_xxx',
  name: 'get_weather',
  arguments: '{"city": "Lisbon"}'
}

// 함수 실행 결과 전송 (클라이언트 → 서버)
{
  type: 'conversation.item.create',
  item: {
    type: 'function_call_output',
    call_id: 'call_xxx',
    output: '{"temperature": 22, "condition": "sunny"}'
  }
}
```

## 6. 에러 및 상태 이벤트

### 에러 처리

```typescript
// 일반 에러
{
  type: 'error',
  error: {
    type: 'invalid_request_error' | 'authentication_error' | 'rate_limit_error',
    code: 'invalid_event_type' | 'session_expired' | 'audio_buffer_full',
    message: '상세 에러 메시지',
    param: null,
    event_id: 'event_xxx'
  }
}

// 응답 에러
{
  type: 'response.error',
  response_id: 'resp_xxx',
  error: {
    type: 'content_filter',
    code: 'content_filtered',
    message: '콘텐츠 필터에 의해 차단됨'
  }
}
```

### 속도 제한 및 사용량

```typescript
// 속도 제한 경고
{
  type: 'rate_limits.updated',
  rate_limits: [
    {
      name: 'requests',
      limit: 100,
      remaining: 85,
      reset_seconds: 60
    },
    {
      name: 'tokens',
      limit: 1000000,
      remaining: 950000,
      reset_seconds: 3600
    }
  ]
}
```

## 7. WebRTC vs WebSocket 이벤트 차이점

### WebRTC (브라우저 권장)

- **오디오 스트리밍**: RTCPeerConnection 오디오 트랙 사용
- **이벤트 통신**: DataChannel을 통한 JSON 메시지
- **지연 최소화**: 네이티브 오디오 처리, P2P 연결

### WebSocket (서버 권장)

- **오디오 스트리밍**: Base64 인코딩된 이벤트 메시지
- **이벤트 통신**: 동일한 WebSocket 연결
- **세밀한 제어**: 오디오 청크 크기, 타이밍 제어 가능

## 8. 번역 애플리케이션 특화 이벤트 패턴

### 실시간 번역 플로우

```typescript
// 1. 번역 세션 초기화
session.update → instructions: "한국어-포르투갈어 번역기"

// 2. 음성 입력 감지
input_audio_buffer.speech_started → 사용자 발화 시작

// 3. 실시간 응답 생성
response.create → modalities: ['text', 'audio']

// 4. 번역 결과 스트리밍
response.text.delta → 번역 텍스트 실시간 표시
response.audio.delta → 번역 음성 실시간 재생

// 5. 번역 완료
response.done → 번역 세션 완료, 다음 입력 대기
```

### 성능 모니터링 이벤트

```typescript
// 지연시간 측정 포인트
const latencyMetrics = {
  speech_start: Date.now(), // input_audio_buffer.speech_started
  first_token: Date.now(), // response.text.delta (첫 번째)
  first_audio: Date.now(), // response.audio.delta (첫 번째)
  completion: Date.now(), // response.done
};
```
