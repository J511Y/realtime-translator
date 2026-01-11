import type { ImageTranslateResult, TextBlock } from '@/types/image';
import type { SupportedLanguage } from '@/types/realtime';

/** Vision API 요청 메시지 */
interface VisionMessage {
  role: 'user' | 'assistant' | 'system';
  content: VisionContent[];
}

/** Vision 콘텐츠 (텍스트 또는 이미지) */
type VisionContent =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: { url: string; detail?: 'low' | 'high' | 'auto' };
    };

/** Vision API 응답 */
interface VisionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Structured Output을 위한 JSON Schema 정의 */
const IMAGE_TRANSLATION_SCHEMA = {
  name: 'image_translation_result',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      detectedLanguage: {
        type: ['string', 'null'],
        enum: ['ko', 'pt', 'en', 'es', 'fr', 'ja', 'zh', null],
        description: '감지된 원본 언어 코드',
      },
      textBlocks: {
        type: 'array',
        description: '이미지에서 추출된 텍스트 블록 목록',
        items: {
          type: 'object',
          properties: {
            original: {
              type: 'string',
              description: '원본 텍스트',
            },
            translated: {
              type: 'string',
              description: '번역된 텍스트',
            },
            type: {
              type: 'string',
              description:
                '텍스트 유형 (menu, sign, notice, label, title, body 등)',
            },
            position: {
              type: 'object',
              description: '이미지 내 텍스트 위치 (퍼센트 좌표)',
              properties: {
                x: { type: 'number', description: '좌측 상단 X 좌표 (0-100%)' },
                y: { type: 'number', description: '좌측 상단 Y 좌표 (0-100%)' },
                width: { type: 'number', description: '너비 (0-100%)' },
                height: { type: 'number', description: '높이 (0-100%)' },
              },
              required: ['x', 'y', 'width', 'height'],
              additionalProperties: false,
            },
          },
          required: ['original', 'translated', 'type', 'position'],
          additionalProperties: false,
        },
      },
      summary: {
        type: 'string',
        description: '이미지에 대한 전체적인 설명과 번역 요약',
      },
      culturalNote: {
        type: ['string', 'null'],
        description: '문화적 맥락이나 추가 설명 (없으면 null)',
      },
    },
    required: ['detectedLanguage', 'textBlocks', 'summary', 'culturalNote'],
    additionalProperties: false,
  },
} as const;

/** 언어 코드 → 언어명 매핑 */
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ko: '한국어',
  pt: '포르투갈어',
  en: '영어',
  es: '스페인어',
  fr: '프랑스어',
  ja: '일본어',
  zh: '중국어',
};

/**
 * OpenAI Vision API 클라이언트
 * - GPT-4.1을 사용하여 이미지 내 텍스트 추출 및 번역
 * - Structured Output으로 안정적인 JSON 응답 보장
 */
export class OpenAIVisionClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';
  /** GPT-4.1: GPT-4o 대비 개선된 비전 성능 및 structured output 지원 */
  private readonly model = 'gpt-4.1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 이미지 내 텍스트를 추출하고 번역
   * @param imageBase64 Base64 인코딩된 이미지
   * @param targetLanguage 번역 대상 언어
   * @param sourceLanguage 원본 언어 (선택, 자동 감지)
   * @returns 번역 결과
   */
  async translateImage(
    imageBase64: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<ImageTranslateResult> {
    const targetLangName = LANGUAGE_NAMES[targetLanguage];
    const sourceLangName = sourceLanguage
      ? LANGUAGE_NAMES[sourceLanguage]
      : null;

    // 이미지 URL 형식 확인 및 변환
    const imageUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // 프롬프트 구성
    const systemPrompt = this.buildSystemPrompt(targetLangName, sourceLangName);

    const messages: VisionMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high',
            },
          },
        ],
      },
    ];

    console.log('[Vision] 이미지 번역 요청:', {
      targetLanguage,
      sourceLanguage,
      imageSize: imageBase64.length,
    });

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: 4096,
          temperature: 0.3,
          // Structured Output: 스키마에 맞는 정확한 JSON 응답 보장
          response_format: {
            type: 'json_schema',
            json_schema: IMAGE_TRANSLATION_SCHEMA,
          },
        }),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = (await response.json()) as VisionResponse;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Vision API에서 응답을 받지 못했습니다.');
      }

      console.log('[Vision] 응답 수신:', {
        tokens: data.usage,
        contentLength: content.length,
      });

      // JSON 응답 파싱
      return this.parseResponse(content);
    } catch (error) {
      console.error('[Vision] 이미지 번역 실패:', error);
      throw error;
    }
  }

  /**
   * 시스템 프롬프트 생성
   * - Structured Output 사용으로 JSON 형식 설명 간소화
   */
  private buildSystemPrompt(
    targetLangName: string,
    sourceLangName: string | null
  ): string {
    const sourceHint = sourceLangName
      ? `원본 언어는 ${sourceLangName}입니다.`
      : '원본 언어를 자동으로 감지해주세요.';

    return `당신은 이미지 내 텍스트를 추출하고 번역하는 전문 번역가입니다.
${sourceHint}

다음 작업을 수행해주세요:
1. 이미지에서 모든 텍스트를 찾아 추출합니다 (간판, 메뉴, 안내문, 라벨 등)
2. 각 텍스트를 ${targetLangName}로 번역합니다
3. 각 텍스트의 이미지 내 위치를 퍼센트 좌표(0-100)로 추정합니다
4. 전체 이미지에 대한 요약을 ${targetLangName}로 작성합니다

주의사항:
- 텍스트가 없는 이미지의 경우 textBlocks를 빈 배열로 반환
- 가격, 숫자 등은 그대로 유지
- 브랜드명은 원본 그대로 유지하되 번역 시 발음/의미 설명 추가
- 메뉴판의 경우 각 메뉴 항목을 개별 블록으로 분리
- position의 x, y, width, height는 모두 0-100 범위의 퍼센트 값
- type은 menu, sign, notice, label, title, body 등으로 분류
- culturalNote는 문화적 맥락 설명이 필요할 때만 제공, 불필요시 null`;
  }

  /** Structured Output 응답 타입 */
  private readonly ParsedResponse = {} as {
    detectedLanguage: SupportedLanguage | null;
    textBlocks: Array<{
      original: string;
      translated: string;
      type: string;
      position: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    summary: string;
    culturalNote: string | null;
  };

  /**
   * API 응답 파싱
   * - Structured Output 사용으로 JSON 형식이 보장됨
   */
  private parseResponse(content: string): ImageTranslateResult {
    try {
      // Structured Output은 순수 JSON을 반환하지만, 안전을 위해 코드 블록 처리
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr) as typeof this.ParsedResponse;

      // 언어 코드 검증
      const validLanguages: SupportedLanguage[] = [
        'ko',
        'pt',
        'en',
        'es',
        'fr',
        'ja',
        'zh',
      ];
      const validDetectedLanguage =
        parsed.detectedLanguage &&
        validLanguages.includes(parsed.detectedLanguage)
          ? parsed.detectedLanguage
          : null;

      // TextBlock 배열 변환 (position 좌표 범위 보정)
      const textBlocks: TextBlock[] = parsed.textBlocks.map(block => ({
        original: block.original,
        translated: block.translated,
        type: block.type,
        position: {
          x: Math.max(0, Math.min(100, block.position.x)),
          y: Math.max(0, Math.min(100, block.position.y)),
          width: Math.max(0, Math.min(100, block.position.width)),
          height: Math.max(0, Math.min(100, block.position.height)),
        },
      }));

      return {
        detectedLanguage: validDetectedLanguage,
        textBlocks,
        summary: parsed.summary,
        culturalNote: parsed.culturalNote ?? undefined,
      };
    } catch (parseError) {
      // Structured Output 사용 시 파싱 실패는 거의 발생하지 않음
      console.error('[Vision] JSON 파싱 실패 (예상치 못한 오류):', parseError);
      console.error('[Vision] 원본 응답:', content);

      throw new Error(
        '이미지 분석 결과를 처리할 수 없습니다. 다시 시도해주세요.'
      );
    }
  }

  /**
   * API 에러 처리
   */
  private async handleApiError(response: Response): Promise<never> {
    let errorMessage: string;

    try {
      const errorData = (await response.json()) as {
        error?: { message?: string };
      };
      errorMessage = errorData.error?.message || '알 수 없는 오류';
    } catch {
      errorMessage = `HTTP ${response.status}`;
    }

    switch (response.status) {
      case 400:
        throw new Error(`잘못된 요청: ${errorMessage}`);
      case 401:
        throw new Error('OpenAI API 키가 유효하지 않습니다.');
      case 403:
        throw new Error('Vision API 접근 권한이 없습니다.');
      case 413:
        throw new Error('이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.');
      case 429:
        throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      case 500:
      case 502:
      case 503:
        throw new Error(
          'OpenAI 서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
        );
      default:
        throw new Error(`Vision API 오류: ${errorMessage}`);
    }
  }
}

/**
 * Vision 클라이언트 생성
 */
export function createVisionClient(apiKey: string): OpenAIVisionClient {
  return new OpenAIVisionClient(apiKey);
}
