import { expect, test } from 'vitest';

test('단계 1: 순수 로직 테스트 환경에 DOM이 주입되지 않는다', () => {
  expect(typeof document).toBe('undefined');
  expect(typeof window).toBe('undefined');
});
