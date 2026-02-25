# Testing Flutter Web Apps with Playwright

## The Problem

Flutter web (v3.29+) renders exclusively via **CanvasKit** or **Skwasm** — both draw to a `<canvas>` element. The HTML renderer was permanently removed. This means:

- No real DOM elements for Playwright to query or click
- `page.getByRole()`, `page.getByText()`, etc. don't work
- Standard `mouse.click()` dispatches DOM mouse events that Flutter ignores

## The Solution: Two Techniques

### 1. Enable Flutter's Semantics Tree

Flutter creates a hidden accessibility layer with real DOM elements (`<flt-semantics>`) when semantics mode is activated. These elements mirror the widget tree and are visible to Playwright.

**How to enable it:**

```javascript
await page.evaluate(() => {
  const placeholder = document.querySelector('flt-semantics-placeholder');
  if (placeholder) {
    placeholder.dispatchEvent(new Event('click', { bubbles: true }));
    placeholder.focus();
    placeholder.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    placeholder.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  }
});
// Wait for semantics tree to build
await page.waitForTimeout(3000);
```

**After enabling**, Playwright's `browser_snapshot` will return the widget tree:

```yaml
- generic:
  - group:
    - generic: Bienvenido, Hno Obrero Campo Copán
    - button "Agregar Actividad"
    - button "Recargar"
    - img "Visitas Misioneras 0"
```

**Limitation**: Only widgets with semantic labels appear. Sidebar navigation items without `Semantics` wrappers won't show up. This is also an accessibility bug worth fixing.

### 2. Dispatch Pointer Events to the Glass Pane

Flutter processes `PointerEvent` (not `MouseEvent`) on its `flt-glass-pane` element. Dispatching pointer events at specific coordinates allows clicking anywhere on the canvas.

**How to click at coordinates:**

```javascript
await page.evaluate(({ x, y }) => {
  const target =
    document.querySelector('flt-glass-pane') ||
    document.querySelector('flutter-view') ||
    document.body;

  const opts = {
    bubbles: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  };

  target.dispatchEvent(new PointerEvent('pointerdown', { ...opts, button: 0, buttons: 1 }));
  target.dispatchEvent(new PointerEvent('pointerup', { ...opts, button: 0, buttons: 0 }));
}, { x, y });
```

**How to scroll within a widget:**

```javascript
await page.evaluate(({ x, y }) => {
  const target =
    document.querySelector('flt-glass-pane') ||
    document.querySelector('flutter-view') ||
    document.body;

  target.dispatchEvent(new WheelEvent('wheel', {
    bubbles: true,
    clientX: x,
    clientY: y,
    deltaY: 100, // positive = scroll down, negative = scroll up
  }));
}, { x, y });
```

**How to determine coordinates**: Take a screenshot first, identify the element's position visually, then use those coordinates.

## Recommended Testing Workflow

```
1. Navigate to the app
2. Wait for Flutter to fully load (~10-15s in debug mode)
3. Enable semantics tree (technique #1)
4. Use Playwright snapshot to read widget labels and structure
5. For elements IN the semantics tree → use Playwright's ref-based clicking
6. For elements NOT in the semantics tree → take screenshot, use pointer events (technique #2)
7. Take screenshots to verify results
```

## Important Notes

### What works

- **Auth0 login page**: Standard HTML — use normal Playwright selectors
- **Semantics-enabled widgets**: Buttons, text, images with labels
- **Coordinate-based clicks**: Any visible element via pointer events
- **Scroll events**: Navigate scrollable areas (e.g., date picker months)
- **Screenshots**: Always work, useful for visual verification

### What doesn't work

- `page.mouse.click(x, y)`: Dispatches mouse events, not pointer events — Flutter ignores these
- `--web-renderer html`: Removed in Flutter 3.29+
- Direct URL hash navigation: Reloads the Flutter app and loses session state
- Sidebar clicks via semantics: Navigation items often lack semantic labels

### Debug mode considerations

- Flutter debug mode (via `flutter run`) compiles ~1175 Dart modules on first load
- First page load can take 15-30 seconds
- Subsequent hot reloads are fast
- The `flutter_bootstrap.js` script appears first, then Flutter elements appear after compilation

### Backend authentication

- Auth0 authentication works across Playwright sessions
- PKCE verifier is stored in session storage — clearing storage forces re-authentication
- Test users must exist in both Auth0 AND the local database for full functionality
- 401 errors on API calls mean the user exists in Auth0 but not in the local DB

## Example: Full Navigation Flow

```javascript
async (page) => {
  // 1. Navigate and wait for Flutter
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  await page.waitForTimeout(15000);

  // 2. (Auth0 login happens here if needed - use standard Playwright)

  // 3. Enable semantics
  await page.evaluate(() => {
    const p = document.querySelector('flt-semantics-placeholder');
    if (p) p.dispatchEvent(new Event('click', { bubbles: true }));
  });
  await page.waitForTimeout(3000);

  // 4. Click sidebar item via pointer events (coordinates from screenshot)
  await page.evaluate(({ x, y }) => {
    const target = document.querySelector('flt-glass-pane') || document.body;
    const opts = { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true };
    target.dispatchEvent(new PointerEvent('pointerdown', { ...opts, button: 0, buttons: 1 }));
    target.dispatchEvent(new PointerEvent('pointerup', { ...opts, button: 0, buttons: 0 }));
  }, { x: 97, y: 373 }); // "Actividades" sidebar position at 1280x800

  await page.waitForTimeout(3000);

  // 5. Verify navigation via screenshot
  await page.screenshot({ path: 'activities-page.png' });
};
```
