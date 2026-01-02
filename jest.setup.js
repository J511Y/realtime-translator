// Jest 테스트 환경 설정을 위해 @testing-library/jest-dom을 임포트합니다.
// 이를 통해 toBeInTheDocument()와 같은 커스텀 매처를 사용할 수 있습니다.
import '@testing-library/jest-dom';

// canvas API를 사용하는 컴포넌트(예: 이미지 처리) 테스트를 위한 모킹
import 'jest-canvas-mock';
