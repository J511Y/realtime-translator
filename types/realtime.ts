/**
 * OpenAI Realtime API 관련 타입 정의
 */

/** 지원하는 음성 종류 */
export type VoiceType =
  | 'verse'
  | 'alloy'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'shimmer';

/** 오디오 포맷 종류 */
export type AudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw';

/** 모달리티 종류 */
export type Modality = 'text' | 'audio';

/** 지연시간 힌트 */
export type LatencyHint = 'low' | 'balanced' | 'high';

/**
 * JSON Schema (Function Calling/Tools 파라미터 정의용)
 * - OpenAI Tool parameters는 JSON Schema의 subset을 사용
 */
export type JsonSchema =
  | JsonSchemaObject
  | JsonSchemaArray
  | JsonSchemaString
  | JsonSchemaNumber
  | JsonSchemaInteger
  | JsonSchemaBoolean
  | JsonSchemaNull;

export interface JsonSchemaBase {
  description?: string;
  title?: string;
}

export interface JsonSchemaObject extends JsonSchemaBase {
  type: 'object';
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
}

export interface JsonSchemaArray extends JsonSchemaBase {
  type: 'array';
  items: JsonSchema;
  minItems?: number;
  maxItems?: number;
}

export interface JsonSchemaString extends JsonSchemaBase {
  type: 'string';
  enum?: string[];
}

export interface JsonSchemaNumber extends JsonSchemaBase {
  type: 'number';
}

export interface JsonSchemaInteger extends JsonSchemaBase {
  type: 'integer';
}

export interface JsonSchemaBoolean extends JsonSchemaBase {
  type: 'boolean';
}

export interface JsonSchemaNull extends JsonSchemaBase {
  type: 'null';
}

/** 턴 감지 타입 */
export interface TurnDetection {
  type: 'server_vad' | 'none';
  threshold?: number;
  prefix_padding_ms?: number;
  silence_duration_ms?: number;
}

/** 입력 오디오 전사 설정 */
export interface InputAudioTranscription {
  model: 'whisper-1';
}

/**
 * 세션 생성 요청(검증 전) 입력
 * - request.json()의 결과를 그대로 신뢰할 수 없으므로 string 기반으로 받고 서버에서 검증/캐스팅한다.
 */
export interface CreateSessionRequestInput {
  instructions?: string;
  voice?: string;
  modalities?: string[];
  input_audio_format?: string;
  output_audio_format?: string;
}

/** 세션 생성 요청 */
export interface CreateSessionRequest {
  /** 번역 지시사항 */
  instructions: string;
  /** 음성 종류 (기본값: verse) */
  voice?: VoiceType;
  /** 모달리티 (기본값: ['text', 'audio']) */
  modalities?: Modality[];
  /** 입력 오디오 포맷 (기본값: pcm16) */
  input_audio_format?: AudioFormat;
  /** 출력 오디오 포맷 (기본값: opus) */
  output_audio_format?: AudioFormat;
  /** 턴 감지 설정 */
  turn_detection?: TurnDetection;
  /** 입력 오디오 전사 설정 */
  input_audio_transcription?: InputAudioTranscription;
  /** 지연시간 힌트 */
  latency_hint?: LatencyHint;
  /** 온도 설정 (0.0 ~ 1.0) */
  temperature?: number;
  /** 최대 출력 토큰 수 */
  max_output_tokens?: number;
}

/** 도구 정의 */
export interface Tool {
  type: 'function';
  name: string;
  description: string;
  parameters: JsonSchemaObject;
}

/** 세션 생성 응답 상세 */
export interface OpenAISessionResponse {
  id: string;
  object: 'realtime.session';
  model: string;
  expires_at: number;
  modalities: Modality[];
  instructions: string;
  voice: VoiceType;
  input_audio_format: AudioFormat;
  output_audio_format: AudioFormat;
  input_audio_transcription: InputAudioTranscription | null;
  turn_detection: TurnDetection | null;
  tools: Tool[];
  tool_choice: string;
  temperature: number;
  max_output_tokens: number | 'inf' | null;
  client_secret: {
    value: string;
    expires_at: number;
  };
}

/** 세션 생성 요청 페이로드 (OpenAI API 전송용) */
export interface OpenAISessionPayload {
  model: string;
  voice: VoiceType;
  instructions: string;
  modalities: Modality[];
  input_audio_format: AudioFormat;
  output_audio_format: AudioFormat;
  turn_detection: TurnDetection;
  input_audio_transcription: InputAudioTranscription;
  temperature?: number;
  max_output_tokens?: number;
  tools?: Tool[];
  tool_choice?: string;
}

/** Realtime 세션 헬스체크 응답 */
export interface RealtimeSessionHealthCheckResponse {
  status: 'ok';
  timestamp: string;
  environment: {
    node_env?: string;
    has_openai_key: boolean;
    has_google_key: boolean;
    has_azure_keys: boolean;
  };
  validation: EnvValidation;
  rate_limits: {
    window_ms: number;
    max_requests: number;
    active_clients: number;
  };
}

/** 클라이언트 응답 */
export interface SessionResponse {
  /** 클라이언트에서 사용할 임시 토큰 */
  client_secret: string;
  /** 토큰 만료 시간 (Unix timestamp) */
  expires_at: number;
  /** 세션 ID */
  session_id: string;
  /** 세션 설정 정보 */
  session_config: {
    voice: VoiceType;
    modalities: Modality[];
    input_audio_format: AudioFormat;
    output_audio_format: AudioFormat;
  };
}

/** API 에러 응답 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

/** 환경변수 검증 결과 */
export interface EnvValidation {
  isValid: boolean;
  missing: string[];
}

/** 속도 제한 정보 */
export interface RateLimit {
  /** 요청 수 제한 */
  requests: {
    limit: number;
    remaining: number;
    reset_seconds: number;
  };
  /** 토큰 수 제한 */
  tokens: {
    limit: number;
    remaining: number;
    reset_seconds: number;
  };
}

/** OpenAI API 에러 */
export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

/** 세션 통계 */
export interface SessionStats {
  /** 생성된 세션 수 */
  sessions_created: number;
  /** 활성 세션 수 */
  active_sessions: number;
  /** 마지막 세션 생성 시간 */
  last_session_created: number;
  /** 평균 세션 지속 시간 (초) */
  avg_session_duration: number;
}

// ============================================================================
// WebRTC 클라이언트 관련 타입
// ============================================================================

/** WebRTC 연결 상태 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

/** 번역 세션 상태 */
export type TranslationState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

/** Realtime 클라이언트 옵션 */
export interface RealtimeClientOptions {
  /** 세션 이벤트 수신 콜백 */
  onMessage?: (event: RealtimeServerEvent) => void;
  /** 오디오 재생 시작 콜백 */
  onAudioStart?: () => void;
  /** 오디오 재생 종료 콜백 */
  onAudioEnd?: () => void;
  /** 연결 상태 변경 콜백 */
  onConnectionStateChange?: (state: ConnectionState) => void;
  /** 번역 상태 변경 콜백 */
  onTranslationStateChange?: (state: TranslationState) => void;
  /** 에러 발생 콜백 */
  onError?: (error: RealtimeError) => void;
  /** 입력 음성 전사 콜백 */
  onInputTranscript?: (transcript: string, isFinal: boolean) => void;
  /** 출력 번역 텍스트 콜백 */
  onOutputTranscript?: (transcript: string, isFinal: boolean) => void;
}

/** Realtime 에러 */
export interface RealtimeError {
  type: 'connection' | 'audio' | 'api' | 'unknown';
  code?: string | undefined;
  message: string;
  recoverable: boolean;
}

/** 마이크 설정 옵션 */
export interface MicrophoneOptions {
  /** 샘플레이트 (기본값: 16000) */
  sampleRate?: number;
  /** 채널 수 (기본값: 1) */
  channelCount?: number;
  /** 에코 캔슬레이션 (기본값: true) */
  echoCancellation?: boolean;
  /** 노이즈 억제 (기본값: true) */
  noiseSuppression?: boolean;
  /** 자동 게인 컨트롤 (기본값: true) */
  autoGainControl?: boolean;
}

// ============================================================================
// Realtime API 서버 이벤트 타입 (서버 → 클라이언트)
// ============================================================================

/** 서버 이벤트 기본 타입 */
export interface RealtimeServerEventBase {
  event_id?: string;
}

/** 세션 생성 이벤트 */
export interface SessionCreatedEvent extends RealtimeServerEventBase {
  type: 'session.created';
  session: {
    id: string;
    model: string;
    expires_at: number;
    modalities: Modality[];
    voice: VoiceType;
    instructions: string;
    input_audio_format: AudioFormat;
    output_audio_format: AudioFormat;
  };
}

/** 세션 업데이트 완료 이벤트 */
export interface SessionUpdatedEvent extends RealtimeServerEventBase {
  type: 'session.updated';
  session: {
    id: string;
    model: string;
    modalities: Modality[];
    voice: VoiceType;
    instructions: string;
  };
}

/** 음성 감지 시작 이벤트 */
export interface SpeechStartedEvent extends RealtimeServerEventBase {
  type: 'input_audio_buffer.speech_started';
  audio_start_ms: number;
  item_id: string;
}

/** 음성 감지 종료 이벤트 */
export interface SpeechStoppedEvent extends RealtimeServerEventBase {
  type: 'input_audio_buffer.speech_stopped';
  audio_end_ms: number;
  item_id: string;
}

/** 입력 오디오 전사 완료 이벤트 */
export interface InputAudioTranscriptionCompletedEvent extends RealtimeServerEventBase {
  type: 'conversation.item.input_audio_transcription.completed';
  item_id: string;
  content_index: number;
  transcript: string;
}

/** 응답 생성 시작 이벤트 */
export interface ResponseCreatedEvent extends RealtimeServerEventBase {
  type: 'response.created';
  response: {
    id: string;
    status: 'in_progress' | 'completed' | 'cancelled' | 'failed';
    output: ResponseOutputItem[];
  };
}

/** 응답 출력 아이템 */
export interface ResponseOutputItem {
  id: string;
  type: 'message' | 'function_call';
  role?: 'assistant';
  content?: ResponseContent[];
}

/** 응답 콘텐츠 */
export interface ResponseContent {
  type: 'text' | 'audio';
  text?: string;
  audio?: string;
  transcript?: string;
}

/** 텍스트 응답 델타 이벤트 */
export interface ResponseTextDeltaEvent extends RealtimeServerEventBase {
  type: 'response.text.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

/** 텍스트 응답 완료 이벤트 */
export interface ResponseTextDoneEvent extends RealtimeServerEventBase {
  type: 'response.text.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
}

/** 오디오 전사 델타 이벤트 */
export interface ResponseAudioTranscriptDeltaEvent extends RealtimeServerEventBase {
  type: 'response.audio_transcript.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

/** 오디오 전사 완료 이벤트 */
export interface ResponseAudioTranscriptDoneEvent extends RealtimeServerEventBase {
  type: 'response.audio_transcript.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

/** 오디오 응답 델타 이벤트 (WebSocket 전용, WebRTC는 트랙으로 수신) */
export interface ResponseAudioDeltaEvent extends RealtimeServerEventBase {
  type: 'response.audio.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

/** 오디오 응답 완료 이벤트 */
export interface ResponseAudioDoneEvent extends RealtimeServerEventBase {
  type: 'response.audio.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

/** 응답 완료 이벤트 */
export interface ResponseDoneEvent extends RealtimeServerEventBase {
  type: 'response.done';
  response: {
    id: string;
    status: 'completed' | 'cancelled' | 'failed';
    status_details?: {
      type: string;
      reason?: string;
    };
    output: ResponseOutputItem[];
    usage?: {
      input_tokens: number;
      output_tokens: number;
      input_token_details?: {
        cached_tokens: number;
        text_tokens: number;
        audio_tokens: number;
      };
      output_token_details?: {
        text_tokens: number;
        audio_tokens: number;
      };
    };
  };
}

/** 에러 이벤트 */
export interface ErrorEvent extends RealtimeServerEventBase {
  type: 'error';
  error: {
    type: string;
    code?: string;
    message: string;
    param?: string;
  };
}

/** 속도 제한 업데이트 이벤트 */
export interface RateLimitsUpdatedEvent extends RealtimeServerEventBase {
  type: 'rate_limits.updated';
  rate_limits: Array<{
    name: string;
    limit: number;
    remaining: number;
    reset_seconds: number;
  }>;
}

/** 모든 서버 이벤트 유니온 타입 */
export type RealtimeServerEvent =
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SpeechStartedEvent
  | SpeechStoppedEvent
  | InputAudioTranscriptionCompletedEvent
  | ResponseCreatedEvent
  | ResponseTextDeltaEvent
  | ResponseTextDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseDoneEvent
  | ErrorEvent
  | RateLimitsUpdatedEvent;

// ============================================================================
// Realtime API 클라이언트 이벤트 타입 (클라이언트 → 서버)
// ============================================================================

/** 세션 업데이트 요청 */
export interface SessionUpdateEvent {
  type: 'session.update';
  session: {
    instructions?: string;
    voice?: VoiceType;
    input_audio_format?: AudioFormat;
    output_audio_format?: AudioFormat;
    input_audio_transcription?: InputAudioTranscription;
    turn_detection?: TurnDetection | null;
    tools?: Tool[];
    tool_choice?: 'auto' | 'none' | 'required';
    temperature?: number;
    max_output_tokens?: number | 'inf';
  };
}

/** 응답 생성 요청 */
export interface ResponseCreateEvent {
  type: 'response.create';
  response?: {
    modalities?: Modality[];
    instructions?: string;
    voice?: VoiceType;
    output_audio_format?: AudioFormat;
    tools?: Tool[];
    tool_choice?: 'auto' | 'none' | 'required';
    temperature?: number;
    max_output_tokens?: number | 'inf';
  };
}

/** 응답 취소 요청 */
export interface ResponseCancelEvent {
  type: 'response.cancel';
}

/** 입력 오디오 버퍼 커밋 */
export interface InputAudioBufferCommitEvent {
  type: 'input_audio_buffer.commit';
}

/** 입력 오디오 버퍼 초기화 */
export interface InputAudioBufferClearEvent {
  type: 'input_audio_buffer.clear';
}

/** 모든 클라이언트 이벤트 유니온 타입 */
export type RealtimeClientEvent =
  | SessionUpdateEvent
  | ResponseCreateEvent
  | ResponseCancelEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent;

// ============================================================================
// 번역 관련 타입
// ============================================================================

/** 지원 언어 */
export type SupportedLanguage = 'ko' | 'pt' | 'en' | 'es' | 'fr' | 'ja' | 'zh';

/** 언어 정보 */
export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

/** 번역 방향 */
export interface TranslationDirection {
  source: SupportedLanguage;
  target: SupportedLanguage;
}

/** 번역 히스토리 항목 */
export interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  direction: TranslationDirection;
  inputText: string;
  outputText: string;
  inputAudioDuration?: number;
  outputAudioDuration?: number;
}

/** 번역 세션 정보 */
export interface TranslationSession {
  sessionId: string;
  clientSecret: string;
  expiresAt: number;
  direction: TranslationDirection;
  voice: VoiceType;
  connectionState: ConnectionState;
  translationState: TranslationState;
  history: TranslationHistoryItem[];
}
