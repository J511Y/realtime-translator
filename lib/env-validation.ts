import type { EnvValidation } from '@/types/realtime';

/**
 * 필수 환경변수 목록
 */
const REQUIRED_ENV_VARS = {
  OPENAI_API_KEY: '실시간 번역을 위한 OpenAI API 키',
} as const;

/**
 * 선택적 환경변수 목록
 */
// const OPTIONAL_ENV_VARS = {
//   GOOGLE_API_KEY: 'Google Vision OCR 기능을 위한 API 키',
//   AZURE_API_KEY: 'Azure Document Intelligence 기능을 위한 API 키',
//   AZURE_ENDPOINT: 'Azure Document Intelligence 엔드포인트',
// } as const;

/**
 * 환경변수 유효성 검사
 * @returns 검증 결과 및 누락된 변수 목록
 */
export function validateEnvironment(): EnvValidation {
  const missing: string[] = [];

  // 필수 환경변수 검사
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      missing.push(`${key}: ${description}`);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * OpenAI API 키 유효성 검사
 * @param apiKey API 키
 * @returns 유효한 키인지 여부
 */
export function validateOpenAIApiKey(apiKey: string): boolean {
  // OpenAI API 키 형식: sk-...으로 시작하고 최소 20자 이상
  return apiKey.startsWith('sk-') && apiKey.length >= 20;
}

/**
 * 환경별 설정 가져오기
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';

  return {
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isTest: env === 'test',
    // 개발 환경에서는 더 관대한 에러 메시지 제공
    showDetailedErrors: env === 'development',
    // 프로덕션에서는 보안을 위해 에러 상세 정보 숨김
    hideApiKeyErrors: env === 'production',
  };
}

/**
 * 환경변수 설정 가이드 메시지 생성
 * @param missing 누락된 환경변수 목록
 * @returns 설정 가이드 메시지
 */
export function createEnvSetupGuide(missing: string[]): string {
  const config = getEnvironmentConfig();

  if (!config.showDetailedErrors) {
    return '서버 설정에 문제가 있습니다. 관리자에게 문의하세요.';
  }

  const guide = [
    '🔧 환경변수 설정이 필요합니다:',
    '',
    '누락된 변수:',
    ...missing.map(item => `  • ${item}`),
    '',
    '설정 방법:',
    '1. 프로젝트 루트에 .env.local 파일 생성',
    '2. 다음 형식으로 환경변수 추가:',
    '',
    'OPENAI_API_KEY=sk-your-openai-api-key-here',
    '',
    '3. 서버 재시작',
    '',
    '💡 API 키 발급 방법:',
    '• OpenAI: https://platform.openai.com/api-keys',
    '• Google Vision: https://console.cloud.google.com/',
    '• Azure: https://portal.azure.com/',
  ];

  return guide.join('\n');
}
