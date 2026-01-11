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
export type AudioFormat = 'pcm16' | 'opus' | 'mp3' | 'wav';

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
  temperature: number;
  max_output_tokens: number;
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
