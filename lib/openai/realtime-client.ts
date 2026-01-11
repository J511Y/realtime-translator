/**
 * OpenAI Realtime API WebRTC 클라이언트
 *
 * 브라우저에서 WebRTC를 통해 OpenAI Realtime API와 통신하는 클라이언트입니다.
 * - RTCPeerConnection을 통한 오디오 스트리밍
 * - DataChannel을 통한 이벤트 송수신
 * - 자동 재연결 및 에러 복구
 */

import type {
  ConnectionState,
  TranslationState,
  RealtimeClientOptions,
  RealtimeError,
  MicrophoneOptions,
  RealtimeServerEvent,
  RealtimeClientEvent,
  SessionUpdateEvent,
  VoiceType,
  SupportedLanguage,
} from '@/types/realtime';

/** 기본 마이크 설정 */
const DEFAULT_MICROPHONE_OPTIONS: Required<MicrophoneOptions> = {
  sampleRate: 24000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/** 재연결 설정 */
const RECONNECT_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/** OpenAI Realtime API 엔드포인트 */
const OPENAI_REALTIME_BASE_URL = 'https://api.openai.com/v1/realtime';

/**
 * OpenAI Realtime WebRTC 클라이언트
 */
export class RealtimeWebRTCClient {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;

  private connectionState: ConnectionState = 'disconnected';
  private translationState: TranslationState = 'idle';

  private reconnectAttempts = 0;
  private clientSecret: string | null = null;

  private outputTranscript = '';

  constructor(private readonly options: RealtimeClientOptions = {}) {}

  /**
   * 현재 연결 상태 반환
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 현재 번역 상태 반환
   */
  getTranslationState(): TranslationState {
    return this.translationState;
  }

  /**
   * 연결 상태 업데이트 및 콜백 호출
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.options.onConnectionStateChange?.(state);
    }
  }

  /**
   * 번역 상태 업데이트 및 콜백 호출
   */
  private setTranslationState(state: TranslationState): void {
    if (this.translationState !== state) {
      this.translationState = state;
      this.options.onTranslationStateChange?.(state);
    }
  }

  /**
   * 에러 핸들링 및 콜백 호출
   */
  private handleError(error: RealtimeError): void {
    console.error('[RealtimeClient] 에러 발생:', error);
    this.options.onError?.(error);

    if (!error.recoverable) {
      this.setTranslationState('error');
    }
  }

  /**
   * RTCPeerConnection 초기화
   */
  private setupPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // ICE 연결 상태 모니터링
    this.peerConnection.addEventListener(
      'iceconnectionstatechange',
      this.handleIceConnectionStateChange.bind(this)
    );

    // 연결 상태 모니터링
    this.peerConnection.addEventListener(
      'connectionstatechange',
      this.handleConnectionStateChange.bind(this)
    );

    // 원격 오디오 트랙 수신 처리
    this.peerConnection.addEventListener('track', this.handleTrack.bind(this));

    // 데이터 채널 설정 (이벤트 통신용)
    this.dataChannel = this.peerConnection.createDataChannel('oai-events', {
      ordered: true,
    });

    this.dataChannel.addEventListener('open', () => {
      console.log('[RealtimeClient] DataChannel 연결됨');
    });

    this.dataChannel.addEventListener('close', () => {
      console.log('[RealtimeClient] DataChannel 연결 해제됨');
    });

    this.dataChannel.addEventListener('message', event => {
      this.handleDataChannelMessage(event);
    });

    this.dataChannel.addEventListener('error', event => {
      console.error('[RealtimeClient] DataChannel 에러:', event);
      this.handleError({
        type: 'connection',
        message: 'DataChannel 에러가 발생했습니다.',
        recoverable: true,
      });
    });
  }

  /**
   * ICE 연결 상태 변경 핸들러
   */
  private handleIceConnectionStateChange(): void {
    const state = this.peerConnection?.iceConnectionState;
    console.log('[RealtimeClient] ICE 연결 상태:', state);

    switch (state) {
      case 'checking':
        this.setConnectionState('connecting');
        break;
      case 'connected':
      case 'completed':
        this.setConnectionState('connected');
        this.reconnectAttempts = 0;
        break;
      case 'disconnected':
        this.handleDisconnection();
        break;
      case 'failed':
        this.handleConnectionFailure();
        break;
      case 'closed':
        this.setConnectionState('disconnected');
        break;
    }
  }

  /**
   * PeerConnection 연결 상태 변경 핸들러
   */
  private handleConnectionStateChange(): void {
    const state = this.peerConnection?.connectionState;
    console.log('[RealtimeClient] PeerConnection 상태:', state);

    if (state === 'failed') {
      this.handleConnectionFailure();
    }
  }

  /**
   * 연결 해제 처리 (재연결 시도)
   */
  private handleDisconnection(): void {
    if (this.reconnectAttempts < RECONNECT_CONFIG.maxAttempts) {
      this.setConnectionState('reconnecting');
      this.attemptReconnect();
    } else {
      this.handleConnectionFailure();
    }
  }

  /**
   * 연결 실패 처리
   */
  private handleConnectionFailure(): void {
    this.setConnectionState('failed');
    this.setTranslationState('error');
    this.handleError({
      type: 'connection',
      message: '연결에 실패했습니다. 네트워크 상태를 확인해주세요.',
      recoverable: false,
    });
  }

  /**
   * 재연결 시도
   */
  private async attemptReconnect(): Promise<void> {
    if (!this.clientSecret) {
      console.error('[RealtimeClient] 재연결 실패: clientSecret 없음');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      RECONNECT_CONFIG.baseDelayMs * Math.pow(2, this.reconnectAttempts - 1),
      RECONNECT_CONFIG.maxDelayMs
    );

    console.log(
      `[RealtimeClient] ${delay}ms 후 재연결 시도 (${this.reconnectAttempts}/${RECONNECT_CONFIG.maxAttempts})`
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.connect(this.clientSecret);
    } catch (error) {
      console.error('[RealtimeClient] 재연결 실패:', error);
      if (this.reconnectAttempts < RECONNECT_CONFIG.maxAttempts) {
        this.attemptReconnect();
      } else {
        this.handleConnectionFailure();
      }
    }
  }

  /**
   * 원격 오디오 트랙 수신 핸들러
   */
  private handleTrack(event: RTCTrackEvent): void {
    console.log('[RealtimeClient] 오디오 트랙 수신:', event.track.kind);

    if (event.track.kind === 'audio') {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.autoplay = true;
      }

      this.audioElement.srcObject = event.streams[0];
      this.options.onAudioStart?.();

      // 오디오 재생 종료 감지
      event.track.addEventListener('ended', () => {
        console.log('[RealtimeClient] 오디오 트랙 종료');
        this.options.onAudioEnd?.();
      });

      event.track.addEventListener('mute', () => {
        console.log('[RealtimeClient] 오디오 트랙 음소거');
      });

      event.track.addEventListener('unmute', () => {
        console.log('[RealtimeClient] 오디오 트랙 음소거 해제');
      });
    }
  }

  /**
   * DataChannel 메시지 핸들러
   */
  private handleDataChannelMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as RealtimeServerEvent;
      this.processServerEvent(data);
    } catch (error) {
      console.error('[RealtimeClient] 이벤트 파싱 오류:', error);
    }
  }

  /**
   * 서버 이벤트 처리
   */
  private processServerEvent(event: RealtimeServerEvent): void {
    console.log('[RealtimeClient] 서버 이벤트:', event.type);

    // 모든 이벤트를 옵션 콜백으로 전달
    this.options.onMessage?.(event);

    switch (event.type) {
      case 'session.created':
        console.log('[RealtimeClient] 세션 생성됨:', event.session.id);
        break;

      case 'session.updated':
        console.log('[RealtimeClient] 세션 업데이트됨');
        break;

      case 'input_audio_buffer.speech_started':
        this.setTranslationState('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        this.setTranslationState('processing');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.options.onInputTranscript?.(event.transcript, true);
        break;

      case 'response.created':
        this.outputTranscript = '';
        break;

      case 'response.audio_transcript.delta':
        this.outputTranscript += event.delta;
        this.options.onOutputTranscript?.(this.outputTranscript, false);
        this.setTranslationState('speaking');
        break;

      case 'response.audio_transcript.done':
        this.options.onOutputTranscript?.(event.transcript, true);
        break;

      case 'response.done':
        this.setTranslationState('idle');
        break;

      case 'error':
        this.handleError({
          type: 'api',
          code: event.error.code,
          message: event.error.message,
          recoverable: event.error.type !== 'authentication_error',
        });
        break;

      case 'rate_limits.updated':
        console.log('[RealtimeClient] 속도 제한 업데이트:', event.rate_limits);
        break;
    }
  }

  /**
   * 마이크 권한 요청 및 스트림 획득
   */
  private async getMicrophoneStream(
    options: MicrophoneOptions = {}
  ): Promise<MediaStream> {
    const config = { ...DEFAULT_MICROPHONE_OPTIONS, ...options };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: config.sampleRate,
          channelCount: config.channelCount,
          echoCancellation: config.echoCancellation,
          noiseSuppression: config.noiseSuppression,
          autoGainControl: config.autoGainControl,
        },
      });

      console.log('[RealtimeClient] 마이크 스트림 획득 완료');
      return stream;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '마이크 접근에 실패했습니다.';

      throw {
        type: 'audio',
        message,
        recoverable: false,
      } as RealtimeError;
    }
  }

  /**
   * OpenAI Realtime API에 연결
   * @param clientSecret 서버에서 발급받은 Ephemeral Token
   * @param micOptions 마이크 설정 옵션
   */
  async connect(
    clientSecret: string,
    micOptions?: MicrophoneOptions
  ): Promise<void> {
    if (this.connectionState === 'connected') {
      console.warn('[RealtimeClient] 이미 연결되어 있습니다.');
      return;
    }

    this.clientSecret = clientSecret;
    this.setConnectionState('connecting');

    try {
      // 1. RTCPeerConnection 초기화
      this.setupPeerConnection();

      // 2. 마이크 스트림 획득 및 트랙 추가
      this.mediaStream = await this.getMicrophoneStream(micOptions);
      this.mediaStream.getAudioTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.mediaStream!);
      });

      // 3. SDP Offer 생성
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // 4. OpenAI에 Offer 전송하여 Answer 받기
      if (!offer.sdp) {
        throw new Error('SDP Offer 생성에 실패했습니다.');
      }

      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const response = await fetch(
        `${OPENAI_REALTIME_BASE_URL}?model=${model}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
            Authorization: `Bearer ${clientSecret}`,
          },
          body: offer.sdp,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WebRTC 연결 실패 (${response.status}): ${errorText}`);
      }

      // 5. Answer SDP 설정
      const answerSdp = await response.text();
      await this.peerConnection!.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      console.log('[RealtimeClient] WebRTC 연결 설정 완료');
    } catch (error) {
      this.setConnectionState('failed');

      if ((error as RealtimeError).type) {
        this.handleError(error as RealtimeError);
        throw error;
      }

      const realtimeError: RealtimeError = {
        type: 'connection',
        message:
          error instanceof Error
            ? error.message
            : '연결 중 오류가 발생했습니다.',
        recoverable: false,
      };

      this.handleError(realtimeError);
      throw realtimeError;
    }
  }

  /**
   * DataChannel을 통해 이벤트 전송
   */
  sendEvent(event: RealtimeClientEvent): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[RealtimeClient] DataChannel이 열려있지 않습니다.');
      return;
    }

    try {
      this.dataChannel.send(JSON.stringify(event));
      console.log('[RealtimeClient] 이벤트 전송:', event.type);
    } catch (error) {
      console.error('[RealtimeClient] 이벤트 전송 실패:', error);
    }
  }

  /**
   * 번역 세션 시작 (세션 설정 업데이트)
   * @param sourceLanguage 소스 언어
   * @param targetLanguage 타겟 언어
   * @param voice 음성 종류
   */
  startTranslation(
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    voice: VoiceType = 'verse'
  ): void {
    const languageNames: Record<SupportedLanguage, string> = {
      ko: '한국어',
      pt: '포르투갈어',
      en: '영어',
      es: '스페인어',
      fr: '프랑스어',
      ja: '일본어',
      zh: '중국어',
    };

    const sourceName = languageNames[sourceLanguage];
    const targetName = languageNames[targetLanguage];

    const instructions = `당신은 ${sourceName}에서 ${targetName}로의 전문 실시간 번역기입니다.

규칙:
1. 사용자의 ${sourceName} 발화를 듣고 자연스러운 ${targetName}로 즉시 번역하세요.
2. 번역할 때 원문의 감정, 톤, 뉘앙스를 최대한 보존하세요.
3. 번역 결과만 응답하고, 추가 설명이나 코멘트는 하지 마세요.
4. 여행 관련 대화(식당, 교통, 관광지 등)에 특히 정확하게 번역하세요.
5. 숫자, 가격, 시간 등은 대상 언어의 관습에 맞게 변환하세요.`;

    const sessionUpdate: SessionUpdateEvent = {
      type: 'session.update',
      session: {
        instructions,
        voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        temperature: 0.7,
        max_output_tokens: 4096,
      },
    };

    this.sendEvent(sessionUpdate);
    this.setTranslationState('idle');

    console.log(
      `[RealtimeClient] 번역 세션 시작: ${sourceName} → ${targetName}`
    );
  }

  /**
   * 마이크 음소거/해제
   */
  setMicrophoneMuted(muted: boolean): void {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      console.log(`[RealtimeClient] 마이크 ${muted ? '음소거' : '해제'}`);
    }
  }

  /**
   * 마이크 음소거 상태 확인
   */
  isMicrophoneMuted(): boolean {
    if (this.mediaStream) {
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      return audioTrack ? !audioTrack.enabled : true;
    }
    return true;
  }

  /**
   * 스피커 음소거/해제
   */
  setSpeakerMuted(muted: boolean): void {
    if (this.audioElement) {
      this.audioElement.muted = muted;
      console.log(`[RealtimeClient] 스피커 ${muted ? '음소거' : '해제'}`);
    }
  }

  /**
   * 스피커 음소거 상태 확인
   */
  isSpeakerMuted(): boolean {
    return this.audioElement?.muted ?? true;
  }

  /**
   * 스피커 볼륨 설정 (0.0 ~ 1.0)
   */
  setSpeakerVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 현재 응답 취소
   */
  cancelResponse(): void {
    this.sendEvent({ type: 'response.cancel' });
  }

  /**
   * 입력 오디오 버퍼 초기화
   */
  clearInputBuffer(): void {
    this.sendEvent({ type: 'input_audio_buffer.clear' });
  }

  /**
   * 연결 해제 및 리소스 정리
   */
  disconnect(): void {
    console.log('[RealtimeClient] 연결 해제 중...');

    // 미디어 스트림 정리
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      this.mediaStream = null;
    }

    // 오디오 엘리먼트 정리
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    // DataChannel 정리
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // PeerConnection 정리
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 상태 초기화
    this.clientSecret = null;
    this.reconnectAttempts = 0;
    this.outputTranscript = '';

    this.setConnectionState('disconnected');
    this.setTranslationState('idle');

    this.options.onAudioEnd?.();

    console.log('[RealtimeClient] 연결 해제 완료');
  }
}

/**
 * RealtimeWebRTCClient 인스턴스 생성 헬퍼 함수
 */
export function createRealtimeClient(
  options?: RealtimeClientOptions
): RealtimeWebRTCClient {
  return new RealtimeWebRTCClient(options);
}
