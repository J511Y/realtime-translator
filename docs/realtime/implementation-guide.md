# OpenAI Realtime API 구현 가이드 2025 (Next.js)

## 1. 프로젝트 구조 및 아키텍처

### 레이어드 아키텍처 적용

```
app/api/realtime/        # API 라우트 (Ephemeral Token 발급)
lib/openai/              # OpenAI SDK 클라이언트
services/translation/    # 번역 비즈니스 로직
components/realtime/     # Realtime UI 컴포넌트
types/realtime.ts        # Realtime API 타입 정의
```

## 2. 서버 측 구현 (Ephemeral Token 발급)

### API 라우트: `app/api/realtime/session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      instructions,
      voice = 'verse',
      modalities = ['text', 'audio'],
    } = await request.json();

    const response = await fetch(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'realtime=v1',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview',
          voice,
          instructions,
          modalities,
          // 번역 최적화 설정
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          input_audio_format: 'pcm16',
          output_audio_format: 'opus',
          input_audio_transcription: {
            model: 'whisper-1',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const session = await response.json();

    return NextResponse.json({
      client_secret: session.client_secret,
      expires_at: session.expires_at,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Realtime 세션 생성 실패:', error);
    return NextResponse.json(
      { error: '세션 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

## 3. 클라이언트 측 구현 (WebRTC)

### Realtime 클라이언트: `lib/openai/realtime-client.ts`

```typescript
export class OpenAIRealtimeClient {
  private peerConnection: RTCPeerConnection;
  private dataChannel: RTCDataChannel;
  private audioElement: HTMLAudioElement;
  private mediaStream: MediaStream | null = null;

  constructor(
    private options: {
      onMessage?: (event: any) => void;
      onAudioStart?: () => void;
      onAudioEnd?: () => void;
      onError?: (error: Error) => void;
    }
  ) {
    this.setupPeerConnection();
    this.setupAudio();
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // 데이터 채널 설정 (이벤트 통신용)
    this.dataChannel = this.peerConnection.createDataChannel('oai-events', {
      ordered: true,
    });

    this.dataChannel.addEventListener('message', event => {
      try {
        const data = JSON.parse(event.data);
        this.options.onMessage?.(data);
      } catch (error) {
        console.error('이벤트 파싱 오류:', error);
      }
    });

    // 오디오 트랙 수신 처리
    this.peerConnection.addEventListener('track', event => {
      this.audioElement.srcObject = event.streams[0];
      this.options.onAudioStart?.();
    });
  }

  async connect(clientSecret: string): Promise<void> {
    // 마이크 접근
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // 오디오 트랙 추가
    this.mediaStream.getAudioTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.mediaStream!);
    });

    // SDP Offer 생성
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // OpenAI에 Offer 전송하여 Answer 받기
    const response = await fetch(
      `https://api.openai.com/v1/realtime/sessions/${clientSecret}/rtc`,
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
      throw new Error(`WebRTC 연결 실패: ${response.status}`);
    }

    const answerSdp = await response.text();
    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp,
    });
  }

  // 이벤트 전송 (번역 요청 등)
  sendEvent(event: any) {
    if (this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event));
    }
  }

  // 번역 세션 시작
  startTranslation(sourceLanguage: string, targetLanguage: string) {
    this.sendEvent({
      type: 'session.update',
      session: {
        instructions: `당신은 ${sourceLanguage}에서 ${targetLanguage}로의 실시간 번역기입니다. 사용자의 발화를 자연스럽고 정확하게 번역하여 음성으로 응답하세요. 번역할 때 원문의 감정과 톤을 보존해주세요.`,
        voice: 'verse',
        input_audio_format: 'pcm16',
        output_audio_format: 'opus',
        turn_detection: {
          type: 'server_vad',
        },
      },
    });
  }

  disconnect() {
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.options.onAudioEnd?.();
  }
}
```

## 4. React 컴포넌트 통합

### `components/realtime/TranslationInterface.tsx`

```typescript
'use client'

import { useState, useEffect, useRef } from 'react';
import { OpenAIRealtimeClient } from '@/lib/openai/realtime-client';

export function TranslationInterface() {
  const [isConnected, setIsConnected] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const clientRef = useRef<OpenAIRealtimeClient | null>(null);

  const handleConnect = async () => {
    try {
      // 서버에서 Ephemeral Token 발급
      const response = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: '포르투갈어-한국어 실시간 번역기입니다.',
          modalities: ['text', 'audio']
        })
      });

      const { client_secret } = await response.json();

      // Realtime 클라이언트 초기화
      clientRef.current = new OpenAIRealtimeClient({
        onMessage: (event) => {
          if (event.type === 'response.audio_transcript.delta') {
            setTranscript(prev => prev + event.delta);
          }
        },
        onAudioStart: () => setIsTranslating(true),
        onAudioEnd: () => setIsTranslating(false),
        onError: (error) => console.error('Realtime 오류:', error)
      });

      await clientRef.current.connect(client_secret);
      clientRef.current.startTranslation('포르투갈어', '한국어');

      setIsConnected(true);
    } catch (error) {
      console.error('연결 실패:', error);
    }
  };

  const handleDisconnect = () => {
    clientRef.current?.disconnect();
    setIsConnected(false);
    setTranscript('');
  };

  return (
    <div className="translation-interface">
      <div className="controls">
        {!isConnected ? (
          <button onClick={handleConnect} className="btn-primary">
            번역 시작
          </button>
        ) : (
          <button onClick={handleDisconnect} className="btn-secondary">
            번역 중지
          </button>
        )}
      </div>

      {isConnected && (
        <div className="translation-display">
          <div className={`status ${isTranslating ? 'active' : 'idle'}`}>
            {isTranslating ? '번역 중...' : '음성을 기다리는 중...'}
          </div>
          <div className="transcript">
            {transcript || '번역된 텍스트가 여기에 표시됩니다.'}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 5. 최적화 및 에러 처리

### 성능 최적화

- **청크 크기**: 15-50KB Base64 청크로 제한
- **버퍼링**: 오디오 큐 모니터링으로 지연 최소화
- **재연결**: 지수 백오프 알고리즘 적용
- **VAD**: 서버 측 음성 감지로 턴 관리 자동화

### 에러 처리

```typescript
export const handleRealtimeError = (error: any) => {
  const errorMap = {
    401: '인증 실패: API 키 또는 토큰을 확인하세요.',
    409: '세션 충돌: 다른 요청이 진행 중입니다.',
    413: '오디오 데이터가 너무 큽니다.',
    429: '요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.',
    500: '서버 오류가 발생했습니다.',
  };

  return errorMap[error.status] || '알 수 없는 오류가 발생했습니다.';
};
```
