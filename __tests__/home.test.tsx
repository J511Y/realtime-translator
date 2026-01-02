import { render, screen } from '@testing-library/react';
import Page from '../app/page';

describe('Home Page', () => {
  it('renders the main page correctly', () => {
    render(<Page />);
    // Next.js 15+ 기본 page.tsx에 포함된 텍스트나 역할을 확인합니다.
    // 기본 생성된 page.tsx 내용을 기반으로 테스트를 작성합니다.
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeDefined();
  });
});
