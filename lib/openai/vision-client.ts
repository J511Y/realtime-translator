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
 * - GPT-4o를 사용하여 이미지 내 텍스트 추출 및 번역
 */
export class OpenAIVisionClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly model = 'gpt-4o';

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
3. 텍스트의 맥락과 의미를 설명합니다

반드시 다음 JSON 형식으로 응답해주세요:
{
  "detectedLanguage": "감지된 언어 코드 (ko, pt, en, es, fr, ja, zh 중 하나, 없으면 null)",
  "textBlocks": [
    {
      "original": "원본 텍스트",
      "translated": "번역된 텍스트",
      "type": "텍스트 유형 (menu, sign, notice, label, title, body 등)"
    }
  ],
  "summary": "이미지에 대한 전체적인 설명과 번역 요약 (${targetLangName}로)",
  "culturalNote": "문화적 맥락이나 추가 설명이 필요한 경우 (선택사항, ${targetLangName}로)"
}

주의사항:
- 텍스트가 없는 이미지의 경우 textBlocks를 빈 배열로 반환
- 가격, 숫자 등은 그대로 유지
- 브랜드명은 원본 그대로 유지하되 발음/의미 설명 추가
- 메뉴판의 경우 각 메뉴 항목을 개별 블록으로 분리`;
  }

  /**
   * API 응답 파싱
   */
  private parseResponse(content: string): ImageTranslateResult {
    // JSON 블록 추출 (마크다운 코드 블록 처리)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr) as {
        detectedLanguage?: string | null;
        textBlocks?: Array<{
          original?: string;
          translated?: string;
          type?: string;
        }>;
        summary?: string;
        culturalNote?: string;
      };

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
      const detectedLang = parsed.detectedLanguage as SupportedLanguage | null;
      const validDetectedLanguage =
        detectedLang && validLanguages.includes(detectedLang)
          ? detectedLang
          : null;

      // TextBlock 배열 검증 및 변환
      const textBlocks: TextBlock[] = (parsed.textBlocks || []).map(block => ({
        original: block.original || '',
        translated: block.translated || '',
        type: block.type,
      }));

      return {
        detectedLanguage: validDetectedLanguage,
        textBlocks,
        summary: parsed.summary || '이미지 분석 결과를 가져올 수 없습니다.',
        culturalNote: parsed.culturalNote,
      };
    } catch (parseError) {
      console.error('[Vision] JSON 파싱 실패:', parseError, content);

      // 파싱 실패 시 원본 텍스트를 summary로 반환
      return {
        detectedLanguage: null,
        textBlocks: [],
        summary: content,
        culturalNote: undefined,
      };
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
