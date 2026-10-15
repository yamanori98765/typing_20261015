import { test, expect } from '@playwright/test';
test('practice, mistake, restart, finish and saved best', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#typing')).toBeDisabled();
  await page.locator('#mode').selectOption('exam');
  await page.locator('#start').click();
  await expect(page.locator('#typing')).toBeFocused();
  const roman = await page.locator('#roman').innerText();
  await page.locator('#typing').pressSequentially('z');
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#accuracy')).toHaveText('0');
  await page.locator('#typing').pressSequentially(roman);
  await expect(page.locator('#score')).toHaveText(String(roman.length * 10 - 5));
  await page.clock.fastForward(60000);
  await expect(page.locator('#result')).toContainText('1 語クリア');
  await expect(page.locator('#typing')).toBeDisabled();
  const best = await page.locator('#best').innerText();
  await page.reload();
  await page.locator('#mode').selectOption('exam');
  await expect(page.locator('#best')).toHaveText(best);
  await page.locator('#start').click();
  await page.locator('#typing').pressSequentially('z');
  await page.locator('#reset').click();
  await expect(page.locator('#time')).toHaveText('60');
  await expect(page.locator('#accuracy')).toHaveText('100');
  await expect(page.locator('#score')).toHaveText('0');
  expect(errors).toEqual([]);
});
test('mobile layout and input', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.locator('#start').click();
  const roman = await page.locator('#roman').innerText();
  await page.locator('#typing').fill(roman);
  await expect(page.locator('#score')).toHaveText(String(roman.length * 10));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('unlimited practice, five exam levels and separate best scores', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.locator('#start').click();
  await page.locator('#typing').fill(await page.locator('#roman').innerText());
  await page.clock.fastForward(120000);
  await expect(page.locator('#typing')).toBeEnabled();
  await expect(page.locator('#time')).toHaveText('∞');
  await expect(page.locator('#mode')).toBeDisabled();
  await page.locator('#stop').click();
  await expect(page.locator('#result')).toContainText('練習');
  const practiceBest = await page.locator('#best').innerText();
  await page.locator('#mode').selectOption('exam');
  await expect(page.locator('#best')).toHaveText('0');
  for (let level = 1; level <= 5; level++) {
    await page.locator('#level').selectOption(String(level));
    await expect(page.locator('#best')).toHaveText('0');
    await page.locator('#start').click();
    await expect(page.locator('#stop')).toBeHidden();
    await page.locator('#typing').fill(await page.locator('#roman').innerText());
    await page.clock.fastForward(60000);
    await expect(page.locator('#result')).toContainText(`本番 レベル${level}`);
    await expect(page.locator('#result')).toContainText('1 語クリア');
    await expect(page.locator('#typing')).toBeDisabled();
    expect(Number(await page.locator('#best').innerText())).toBeGreaterThan(0);
  }
  await page.locator('#mode').selectOption('practice');
  await expect(page.locator('#best')).toHaveText('0');
  await page.locator('#level').selectOption('1');
  await expect(page.locator('#best')).toHaveText(practiceBest);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('#mode').selectOption('exam');
  await page.locator('#level').selectOption('5');
  await page.locator('#start').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('select difficulty before starting in both modes; complete without duplicate questions', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('#level')).toBeVisible();
  for (const mode of ['practice', 'exam']) {
    await page.locator('#mode').selectOption(mode);
    for (let level = 1; level <= 5; level++) {
      await page.locator('#level').selectOption(String(level));
      await expect(page.locator('#mode-description')).toContainText('全8問');
      await page.locator('#start').click();
      const seen = new Set();
      for (let i = 0; i < 8; i++) {
        const roman = await page.locator('#roman').innerText();
        expect(seen.has(roman)).toBe(false);
        seen.add(roman);
        await page.locator('#typing').fill(roman);
      }
      await expect(page.locator('#status')).toContainText('全問クリア');
      await expect(page.locator('#result')).toContainText('8 語クリア');
      await expect(page.locator('#typing')).toBeDisabled();
      await expect(page.locator('#level')).toBeEnabled();
    }
  }
});
