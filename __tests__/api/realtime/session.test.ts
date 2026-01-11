/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/realtime/session/route';
import type {
  CreateSessionRequest,
  SessionResponse,
  ApiErrorResponse,
} from '@/types/realtime';

// OpenAI API 모킹
const mockCreateSession = jest.fn();
jest.mock('@/lib/openai/client', () => ({
  createOpenAIClient: jest.fn(() => ({
    createSession: mockCreateSession,
  })),
}));

// 환경변수 모킹
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    OPENAI_API_KEY: 'sk-test-key-1234567890abcdef1234567890abcdef',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('/api/realtime/session', () => {
  describe('GET 헬스체크', () => {
    it('정상적인 헬스체크 응답을 반환해야 함', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'ok',
        environment: {
          has_openai_key: true,
        },
        validation: {
          isValid: true,
        },
      });
    });

    it('환경변수 누락시 적절한 상태를 반환해야 함', async () => {
      delete process.env.OPENAI_API_KEY;

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.environment.has_openai_key).toBe(false);
      expect(data.validation.isValid).toBe(false);
    });
  });

  describe('POST 세션 생성', () => {
    const mockOpenAIResponse = {
      id: 'sess_test123',
      model: 'gpt-4o-realtime-preview',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      modalities: ['text', 'audio'],
      voice: 'verse',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      client_secret: {
        value: 'ephemeral_test_token_12345',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    beforeEach(() => {
      mockCreateSession.mockResolvedValue(mockOpenAIResponse);
    });

    it('유효한 요청으로 세션을 생성해야 함', async () => {
      const requestBody: CreateSessionRequest = {
        instructions: '한국어-포르투갈어 실시간 번역기입니다.',
        voice: 'verse',
        modalities: ['text', 'audio'],
      };

      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = (await response.json()) as SessionResponse;

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        client_secret: 'ephemeral_test_token_12345',
        session_id: 'sess_test123',
        session_config: {
          voice: 'verse',
          modalities: ['text', 'audio'],
        },
      });
    });

    it('빈 instructions로 400 에러를 반환해야 함', async () => {
      const requestBody = {
        instructions: '',
        voice: 'verse',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(400);
      expect(data.error).toContain('번역 지시사항');
      expect(data.code).toBe('validation_error');
    });

    it('잘못된 voice로 400 에러를 반환해야 함', async () => {
      const requestBody = {
        instructions: '테스트 지시사항',
        voice: 'invalid_voice',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(400);
      expect(data.error).toContain('지원하지 않는 음성');
      expect(data.code).toBe('validation_error');
    });

    it('잘못된 JSON으로 400 에러를 반환해야 함', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: 'invalid json',
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(400);
      expect(data.error).toContain('JSON');
      expect(data.code).toBe('invalid_json');
    });

    it('환경변수 누락시 500 에러를 반환해야 함', async () => {
      delete process.env.OPENAI_API_KEY;

      const requestBody: CreateSessionRequest = {
        instructions: '테스트 지시사항',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(500);
      expect(data.error).toContain('서버 설정 오류');
    });

    it('OpenAI API 에러를 적절히 처리해야 함', async () => {
      mockCreateSession.mockRejectedValue(new Error('OpenAI API 오류 테스트'));

      const requestBody: CreateSessionRequest = {
        instructions: '테스트 지시사항',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(500);
      expect(data.error).toBe('OpenAI API 오류 테스트');
      expect(data.code).toBe('openai_api_error');
    });

    it('긴 instructions를 거부해야 함', async () => {
      const requestBody = {
        instructions: 'a'.repeat(2001), // 2001자
      };

      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(400);
      expect(data.error).toContain('2000자를 초과');
    });

    it('잘못된 modalities 배열을 거부해야 함', async () => {
      const requestBody = {
        instructions: '테스트',
        modalities: ['invalid_modality'],
      };

      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);
      const data = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(400);
      expect(data.error).toContain('지원하지 않는 모달리티');
    });

    it('응답에 적절한 헤더를 포함해야 함', async () => {
      const requestBody: CreateSessionRequest = {
        instructions: '테스트 지시사항',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/realtime/session',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'content-type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.headers.get('X-Processing-Time')).toBeDefined();
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  });
});
