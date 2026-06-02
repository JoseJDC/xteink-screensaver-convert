# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crop-persistence.spec.ts >> Crop rectangle persistence >> preserves crop position when navigating between images
- Location: e2e\crop-persistence.spec.ts:10:3

# Error details

```
Error: ENOENT: no such file or directory, scandir 'C:\Users\josed\Documents\Xteink X4\Salvapantallas ANIME SIN NORMALIZAR'
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "Hide sidebar" [ref=e6] [cursor=pointer]:
        - img [ref=e7]
      - generic [ref=e8]:
        - heading "Image Transformer" [level=1] [ref=e9]
        - paragraph [ref=e10]: Convert images to BMP for Xteink e-readers
    - button "Switch to light theme" [ref=e12] [cursor=pointer]:
      - img [ref=e13]
  - main [ref=e19]:
    - complementary [ref=e20]:
      - generic [ref=e22]:
        - generic [ref=e23]: "Images:"
        - generic "Select images (JPG/PNG/WebP/BMP/GIF)" [ref=e24]:
          - button "Images:" [ref=e25]
          - button "Choose files" [ref=e26] [cursor=pointer]:
            - img [ref=e27]
            - text: Choose files
    - generic [ref=e31]:
      - img [ref=e33]
      - heading "No images loaded" [level=2] [ref=e39]
      - paragraph [ref=e40]: Drop images here or choose files in the sidebar
      - paragraph [ref=e41]: Crop images manually and convert to 24-bit BMP format for Xteink e-readers
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import path from 'path';
  3  | import fs from 'fs';
  4  | 
  5  | const testDir = `C:\\Users\\josed\\Documents\\Xteink X4\\Salvapantallas ANIME SIN NORMALIZAR`;
  6  | const tmpDir = `C:\\Users\\josed\\AppData\\Local\\Temp\\opencode`;
  7  | 
  8  | test.describe('Crop rectangle persistence', () => {
  9  | 
  10 |   test('preserves crop position when navigating between images', async ({ page }) => {
  11 |     const errors: string[] = [];
  12 |     page.on('pageerror', (err) => errors.push(err.message));
  13 | 
  14 |     await page.goto('/');
  15 |     await expect(page.locator('.app')).toBeVisible();
  16 | 
> 17 |     const allSrc = fs.readdirSync(testDir)
     |                       ^ Error: ENOENT: no such file or directory, scandir 'C:\Users\josed\Documents\Xteink X4\Salvapantallas ANIME SIN NORMALIZAR'
  18 |       .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
  19 |       .slice(0, 2);
  20 |     expect(allSrc.length).toBeGreaterThanOrEqual(2);
  21 | 
  22 |     const tmpFiles = allSrc.map((f, i) => {
  23 |       const src = path.join(testDir, f);
  24 |       const dest = path.join(tmpDir, `test_img_${i}${path.extname(f)}`);
  25 |       fs.copyFileSync(src, dest);
  26 |       return dest;
  27 |     });
  28 | 
  29 |     await page.locator('#file-input').setInputFiles(tmpFiles);
  30 |     await expect(page.locator('.crop-overlay-container')).toBeVisible({ timeout: 15000 });
  31 |     await expect(page.locator('.crop-rectangle')).toBeVisible({ timeout: 5000 });
  32 |     await page.waitForTimeout(800);
  33 | 
  34 |     // Get the crop rect initial position
  35 |     const rect = await page.locator('.crop-rectangle').boundingBox();
  36 |     expect(rect).not.toBeNull();
  37 |     if (!rect) return;
  38 | 
  39 |     // Drag via dispatchEvent to avoid Playwright mouse->pointer event issues
  40 |     await page.evaluate(({ x, y, width, height }) => {
  41 |       const el = document.querySelector('.crop-rectangle') as HTMLElement;
  42 |       if (!el) return;
  43 |       const cx = x + width / 2;
  44 |       const cy = y + height / 2;
  45 |       const fire = (type: string, clientX: number, clientY: number) => {
  46 |         el.dispatchEvent(new PointerEvent(type, {
  47 |           clientX, clientY, bubbles: true, pointerId: 1, isPrimary: true,
  48 |         }));
  49 |       };
  50 |       fire('pointerdown', cx, cy);
  51 |       for (let i = 1; i <= 20; i++) fire('pointermove', cx + i * 6, cy + i * 3);
  52 |       fire('pointerup', cx + 120, cy + 60);
  53 |     }, rect);
  54 | 
  55 |     await page.waitForTimeout(300);
  56 | 
  57 |     const movedBox = await page.locator('.crop-rectangle').boundingBox();
  58 |     expect(movedBox).not.toBeNull();
  59 |     if (!movedBox) return;
  60 | 
  61 |     const movedX = Math.abs(movedBox.x - rect.x);
  62 |     const movedY = Math.abs(movedBox.y - rect.y);
  63 |     expect(movedX + movedY).toBeGreaterThanOrEqual(5);
  64 | 
  65 |     // Navigate to next image and back
  66 |     await page.keyboard.press('ArrowRight');
  67 |     await page.waitForTimeout(2000);
  68 |     await expect(page.locator('.toolbar-counter')).toHaveText(/2 \/ 2/);
  69 |     await expect(page.locator('.crop-overlay-container')).toBeVisible({ timeout: 10000 });
  70 |     await page.waitForTimeout(300);
  71 | 
  72 |     await page.keyboard.press('ArrowLeft');
  73 |     await page.waitForTimeout(2000);
  74 |     await expect(page.locator('.toolbar-counter')).toHaveText(/1 \/ 2/);
  75 |     await expect(page.locator('.crop-overlay-container')).toBeVisible({ timeout: 10000 });
  76 |     await page.waitForTimeout(300);
  77 | 
  78 |     // Check restored position matches saved position
  79 |     const restoredBox = await page.locator('.crop-rectangle').boundingBox();
  80 |     expect(restoredBox).not.toBeNull();
  81 |     if (!restoredBox) return;
  82 | 
  83 |     const diffX = Math.abs(restoredBox.x - movedBox.x);
  84 |     const diffY = Math.abs(restoredBox.y - movedBox.y);
  85 |     expect(diffX).toBeLessThanOrEqual(5);
  86 |     expect(diffY).toBeLessThanOrEqual(5);
  87 | 
  88 |     expect(errors).toEqual([]);
  89 |   });
  90 | });
  91 | 
```