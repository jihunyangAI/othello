import { expect, test } from '@playwright/test';

const cell = (page, coordinate) =>
  page.getByRole('button', { name: new RegExp(`^${coordinate}\\b`) });
const blackScore = (page) => page.getByLabel('흑 돌 개수');
const whiteScore = (page) => page.getByLabel('백 돌 개수');

test('AC-01~04: 초기 배치, 합법수, 착수와 무효 입력', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('오델로');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.locator('button[data-value]')).toHaveCount(64);
  await expect(page.locator('[data-legal="true"]')).toHaveCount(4);
  await expect(blackScore(page)).toHaveText('2');
  await expect(whiteScore(page)).toHaveText('2');
  for (const coordinate of ['C4', 'D3', 'E6', 'F5']) {
    await expect(cell(page, coordinate)).toHaveAttribute('data-legal', 'true');
  }
  await cell(page, 'A1').click();
  await expect(blackScore(page)).toHaveText('2');
  await cell(page, 'D3').click();
  await expect(blackScore(page)).toHaveText('4');
  await expect(whiteScore(page)).toHaveText('1');
  await expect(cell(page, 'D4')).toHaveAttribute('data-value', 'black');
  await page.screenshot({
    path: testInfo.outputPath('game.png'),
    fullPage: true,
  });
  await page.reload();
  await expect(blackScore(page)).toHaveText('2');
  expect(errors).toEqual([]);
});

test('AC-11: 새 게임 취소, Escape, 확인과 초점 복원', async ({ page }) => {
  await page.goto('/');
  await cell(page, 'D3').click();
  const restart = page.getByRole('button', { name: '새 게임', exact: true });
  await restart.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '계속하기' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(restart).toBeFocused();
  await expect(blackScore(page)).toHaveText('4');
  await restart.click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(restart).toBeFocused();
  await restart.click();
  await dialog.getByRole('button', { name: '새 게임 시작' }).click();
  await expect(blackScore(page)).toHaveText('2');
  await expect(whiteScore(page)).toHaveText('2');
  await expect(page.locator('[data-legal="true"]')).toHaveCount(4);
  await cell(page, 'D3').focus();
  await page.keyboard.press('Enter');
  await expect(blackScore(page)).toHaveText('4');
  await expect(cell(page, 'D3')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(cell(page, 'C3')).toBeFocused();
});

test('AC-12~13: 키보드 이동, 경계와 단일 활성화', async ({ page }) => {
  await page.goto('/');
  await cell(page, 'A1').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(cell(page, 'A1')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 'B1')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(cell(page, 'B2')).toBeFocused();
  await cell(page, 'D3').focus();
  await page.keyboard.press('Enter');
  await expect(blackScore(page)).toHaveText('4');
  await expect(whiteScore(page)).toHaveText('1');
  await expect(page.locator('button[data-value][tabindex="0"]')).toHaveCount(1);
});

test('AC-13: 터치와 작은 화면, 가로 넘침 없음', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await cell(page, 'D3').tap();
  else await cell(page, 'D3').click();
  await expect(blackScore(page)).toHaveText('4');
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(cell(page, 'H8')).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        globalThis.document.documentElement.scrollWidth <=
        globalThis.innerWidth,
    ),
  ).toBe(true);
});

test('AC-07~10: 실제 게임을 끝까지 진행하고 종료 후 입력 유지', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('/');
  for (let move = 0; move < 60; move += 1) {
    const legal = page.locator('[data-legal="true"]');
    if ((await legal.count()) === 0) break;
    await legal.first().click();
  }
  await expect(page.locator('[data-legal="true"]')).toHaveCount(0);
  await expect(page.getByText(/^(흑 승리|백 승리|무승부)$/)).toBeVisible();
  const before = [
    await blackScore(page).textContent(),
    await whiteScore(page).textContent(),
  ];
  await cell(page, 'A1').click();
  expect([
    await blackScore(page).textContent(),
    await whiteScore(page).textContent(),
  ]).toEqual(before);
  await page.getByRole('button', { name: '새 게임', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(blackScore(page)).toHaveText('2');
});
