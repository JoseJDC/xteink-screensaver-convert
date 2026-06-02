import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const testDir = `C:\\Users\\josed\\Documents\\Xteink X4\\Salvapantallas ANIME SIN NORMALIZAR`;
const tmpDir = `C:\\Users\\josed\\AppData\\Local\\Temp\\opencode`;

test.describe('Crop rectangle persistence', () => {

  test('preserves crop position when navigating between images', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await expect(page.locator('.app')).toBeVisible();

    const allSrc = fs.readdirSync(testDir)
      .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
      .slice(0, 2);
    expect(allSrc.length).toBeGreaterThanOrEqual(2);

    const tmpFiles = allSrc.map((f, i) => {
      const src = path.join(testDir, f);
      const dest = path.join(tmpDir, `test_img_${i}${path.extname(f)}`);
      fs.copyFileSync(src, dest);
      return dest;
    });

    await page.locator('#file-input').setInputFiles(tmpFiles);
    await expect(page.locator('.crop-overlay-container')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.crop-rectangle')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(800);

    // Get the crop rect initial position
    const rect = await page.locator('.crop-rectangle').boundingBox();
    expect(rect).not.toBeNull();
    if (!rect) return;

    // Drag via dispatchEvent to avoid Playwright mouse->pointer event issues
    await page.evaluate(({ x, y, width, height }) => {
      const el = document.querySelector('.crop-rectangle') as HTMLElement;
      if (!el) return;
      const cx = x + width / 2;
      const cy = y + height / 2;
      const fire = (type: string, clientX: number, clientY: number) => {
        el.dispatchEvent(new PointerEvent(type, {
          clientX, clientY, bubbles: true, pointerId: 1, isPrimary: true,
        }));
      };
      fire('pointerdown', cx, cy);
      for (let i = 1; i <= 20; i++) fire('pointermove', cx + i * 6, cy + i * 3);
      fire('pointerup', cx + 120, cy + 60);
    }, rect);

    await page.waitForTimeout(300);

    const movedBox = await page.locator('.crop-rectangle').boundingBox();
    expect(movedBox).not.toBeNull();
    if (!movedBox) return;

    const movedX = Math.abs(movedBox.x - rect.x);
    const movedY = Math.abs(movedBox.y - rect.y);
    expect(movedX + movedY).toBeGreaterThanOrEqual(5);

    // Navigate to next image and back
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(2000);
    await expect(page.locator('.toolbar-counter')).toHaveText(/2 \/ 2/);
    await expect(page.locator('.crop-overlay-container')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(2000);
    await expect(page.locator('.toolbar-counter')).toHaveText(/1 \/ 2/);
    await expect(page.locator('.crop-overlay-container')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);

    // Check restored position matches saved position
    const restoredBox = await page.locator('.crop-rectangle').boundingBox();
    expect(restoredBox).not.toBeNull();
    if (!restoredBox) return;

    const diffX = Math.abs(restoredBox.x - movedBox.x);
    const diffY = Math.abs(restoredBox.y - movedBox.y);
    expect(diffX).toBeLessThanOrEqual(5);
    expect(diffY).toBeLessThanOrEqual(5);

    expect(errors).toEqual([]);
  });
});
