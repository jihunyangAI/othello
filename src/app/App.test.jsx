import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';
describe('App', () => {
  it('AC-01 StrictMode에서도 초기 상태를 표시한다', () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    expect(screen.getByRole('heading', { name: /오델로/ })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '흑 차례' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('흑 돌 개수')).toHaveTextContent('2');
    expect(
      screen.getByRole('button', { name: 'D4, 백돌' }),
    ).toBeInTheDocument();
  });
});
