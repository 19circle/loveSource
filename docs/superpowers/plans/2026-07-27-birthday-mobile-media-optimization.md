# Birthday Mobile Media Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the birthday bouquet reliable and instant on iOS/Android, play the original birthday song smoothly from Shanghai COS with fallback, and bound mobile animation work.

**Architecture:** Keep the existing static HTML/CSS/JavaScript structure. Add responsive WebP bouquet assets and a decode-gated reveal controller, configure the audio element with a COS primary source and GitHub fallback, and make the existing canvas loop adapt its DPR, frame rate, and particle ceiling to mobile/media/visibility state.

**Tech Stack:** Static HTML5, CSS3, ES5-compatible browser JavaScript, Node.js built-in test runner, Pillow for image conversion, GitHub Pages, Tencent COS.

## Global Constraints

- Preserve all existing birthday text, music, video, date logic, and romantic styling.
- Primary music source must be the COS-hosted original 128 kbps `格格-生日祝福歌.mp3`.
- `media/birthday-song-mobile.mp3` remains the fallback.
- Bouquet must remain hidden before interaction and reveal only after complete image decode.
- Touch targets remain at least 44 x 44 px and status text uses polite live regions.
- Continue respecting `prefers-reduced-motion`.
- Do not add framework or runtime dependencies.

---

### Task 1: Add Regression Test Harness

**Files:**
- Create: `tests/birthday-media.test.js`
- Test: `tests/birthday-media.test.js`

**Interfaces:**
- Consumes: `birthday.html`, `css/birthday.css`, `js/birthday.js` as UTF-8 text.
- Produces: Node test cases that fail until the responsive bouquet, COS audio, and bounded animation behaviors exist.

- [ ] **Step 1: Write failing markup and runtime tests**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("birthday.html", "utf8");
const css = fs.readFileSync("css/birthday.css", "utf8");
const js = fs.readFileSync("js/birthday.js", "utf8");

test("bouquet uses responsive WebP sources without native lazy loading", () => {
  assert.match(html, /birthday-bouquet-480\.webp 480w/);
  assert.match(html, /birthday-bouquet-760\.webp 760w/);
  assert.doesNotMatch(html, /birthday-bouquet\.png[^>]+loading="lazy"/);
});

test("birthday music prefers COS and retains local fallback", () => {
  assert.match(html, /cos\.ap-shanghai\.myqcloud\.com\/birthday-hls\//);
  assert.match(html, /data-audio-fallback="media\/birthday-song-mobile\.mp3"/);
  assert.match(js, /switchToAudioFallback/);
});

test("mobile animation work is bounded", () => {
  assert.match(js, /Math\.min\(window\.devicePixelRatio \|\| 1, isMobileViewport \? 1\.5 : 2\)/);
  assert.match(js, /isMediaActive \? 24 : 36/);
  assert.match(js, /document\.hidden/);
  assert.match(css, /\.bouquet-button\.is-loading/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
node --test tests/birthday-media.test.js
```

Expected: three failing tests because responsive WebP markup, COS audio fallback, bounded animation code, and loading styles do not exist.

- [ ] **Step 3: Commit the failing tests**

```powershell
git add tests/birthday-media.test.js
git commit -m "test: cover birthday mobile media behavior"
```

---

### Task 2: Make Bouquet Loading Responsive And Decode-Gated

**Files:**
- Create: `media/birthday-bouquet-480.webp`
- Create: `media/birthday-bouquet-760.webp`
- Modify: `birthday.html:174-188`
- Modify: `css/birthday.css:844-981`
- Modify: `js/birthday.js:329-375`
- Modify matching local backup files under `loveheart/` without replacing their distinct text content.
- Test: `tests/birthday-media.test.js`

**Interfaces:**
- Consumes: `#birthdayBouquet`, `#bouquetVisual`, `#receiveBouquetButton`, `#bouquetMessage`.
- Produces: `prepareBouquetImage(image): Promise<void>` and a reveal that adds `.is-received` only after image decoding.

- [ ] **Step 1: Generate transparent WebP variants**

Run Pillow against `media/birthday-bouquet.png`, preserving alpha:

```powershell
python -c "from PIL import Image; p=Image.open(r'media/birthday-bouquet.png'); [(lambda im,w: im.save(fr'media/birthday-bouquet-{w}.webp','WEBP',quality=88,method=6))(p.resize((w,round(p.height*w/p.width)),Image.Resampling.LANCZOS),w) for w in (480,760)]"
```

- [ ] **Step 2: Add responsive picture markup**

Replace the bouquet image with:

```html
<picture>
  <source type="image/webp"
    srcset="media/birthday-bouquet-480.webp 480w, media/birthday-bouquet-760.webp 760w"
    sizes="(max-width: 620px) 310px, 380px">
  <img id="bouquetImage" src="media/birthday-bouquet.png" alt="" width="1024" height="1536"
    decoding="async" fetchpriority="low">
</picture>
```

- [ ] **Step 3: Add loading feedback styles**

Add `.bouquet-button.is-loading` with a small CSS-only spinner, stable button dimensions, and disabled cursor treatment. Keep the received state unchanged.

- [ ] **Step 4: Gate reveal on image decode**

Implement `prepareBouquetImage(image)` using `image.complete`, `image.decode()` when available, and `load`/`error` listeners as fallback. On click set `花束准备中...`, wait for the promise, then reveal; on failure restore the button and show `花束暂时没有加载出来，请再试一次。`.

- [ ] **Step 5: Run tests and browser smoke check**

Run:

```powershell
node --test tests/birthday-media.test.js
node --check js/birthday.js
```

Expected: bouquet test passes; remaining tests still fail until Tasks 3 and 4.

- [ ] **Step 6: Commit bouquet changes**

```powershell
git add birthday.html css/birthday.css js/birthday.js media/birthday-bouquet-480.webp media/birthday-bouquet-760.webp tests/birthday-media.test.js
git commit -m "fix: make birthday bouquet reliable on mobile"
```

---

### Task 3: Serve Original Birthday Music From COS With Fallback

**Files:**
- Modify: `birthday.html:13`
- Modify: `js/birthday.js:86-124`
- Modify matching local backup files under `loveheart/`.
- Test: `tests/birthday-media.test.js`

**Interfaces:**
- Consumes: `#birthdayMusic`, `#musicToggle`, `.music-text`, `#memoryVideo`.
- Produces: `switchToAudioFallback(): boolean`; data attributes `audioSource`, `audioFallbackUsed`, and status text for loading/playing/failure.

- [ ] **Step 1: Configure audio sources**

Set COS as `src`, local MP3 as `data-audio-fallback`, use `preload="auto"`, and increment the page cache key.

- [ ] **Step 2: Implement resilient playback states**

Add handlers for `loadstart`, `waiting`, `stalled`, `canplay`, `playing`, `pause`, and `error`. Use one automatic source switch on fatal primary error and keep user-gesture playback semantics intact.

- [ ] **Step 3: Run tests and syntax check**

Run:

```powershell
node --test tests/birthday-media.test.js
node --check js/birthday.js
```

Expected: bouquet and music tests pass; animation test still fails.

- [ ] **Step 4: Commit audio changes**

```powershell
git add birthday.html js/birthday.js tests/birthday-media.test.js
git commit -m "fix: stream birthday music from Shanghai COS"
```

---

### Task 4: Bound Mobile Canvas Work

**Files:**
- Modify: `js/birthday.js:35-42, 469-541, 590-608`
- Modify matching local backup file `loveheart/js/birthday.js`.
- Test: `tests/birthday-media.test.js`

**Interfaces:**
- Consumes: `birthdayAudio`, `memoryVideo`, `document.visibilityState`, `window.innerWidth`, `requestAnimationFrame`.
- Produces: `isMobileViewport`, `isMediaActive`, `lastParticleFrame`, and adaptive `getParticleLimit()` behavior.

- [ ] **Step 1: Cap canvas resolution**

Use DPR `min(devicePixelRatio, 1.5)` at widths up to 620 px and `min(devicePixelRatio, 2)` otherwise.

- [ ] **Step 2: Add adaptive frame and particle limits**

Use 30 FPS on mobile, display refresh rate on desktop, a mobile ceiling of 36 particles, 24 while media plays, and the existing desktop ceiling of 90.

- [ ] **Step 3: Pause hidden-page drawing**

When `document.hidden` is true, skip drawing and particle creation while continuing a lightweight animation-frame schedule that resumes automatically when visible.

- [ ] **Step 4: Run complete automated checks**

Run:

```powershell
node --test tests/birthday-media.test.js
node --check js/birthday.js
git diff --check
```

Expected: all tests pass, syntax exits 0, and diff check reports no errors.

- [ ] **Step 5: Commit animation changes**

```powershell
git add js/birthday.js tests/birthday-media.test.js
git commit -m "perf: reduce birthday animation work on mobile"
```

---

### Task 5: Cross-Device Verification And Deployment

**Files:**
- Verify: `birthday.html`
- Verify: `css/birthday.css`
- Verify: `js/birthday.js`
- Verify: `media/birthday-bouquet-480.webp`
- Verify: `media/birthday-bouquet-760.webp`

**Interfaces:**
- Consumes: completed static site.
- Produces: deployed `gh-pages` page and recorded verification evidence.

- [ ] **Step 1: Verify resource dimensions and response headers**

Confirm WebP dimensions/alpha, COS MP3 status/MIME/range/CORS, and local fallback availability.

- [ ] **Step 2: Run desktop browser interaction check**

Confirm bouquet is hidden initially, loading state appears if needed, complete bouquet reveals, music source is COS, and controls remain functional.

- [ ] **Step 3: Run 375 x 844 mobile browser check**

Confirm no overflow/overlap, correct responsive image selection, complete reveal, touch target size, music states, and reduced canvas dimensions.

- [ ] **Step 4: Review UI/UX checklist**

Read the UI/UX skill pro rules and verify accessibility, touch feedback, image performance, motion reduction, and loading feedback.

- [ ] **Step 5: Push and verify GitHub Pages**

Push `gh-pages`, wait for the new cache key, then verify the public HTML, WebP files, COS MP3, and fallback MP3.

- [ ] **Step 6: Final verification**

Re-run:

```powershell
node --test tests/birthday-media.test.js
node --check js/birthday.js
git diff --check
git status --short
```

Expected: all tests pass, syntax and diff checks exit 0, and only pre-existing unrelated untracked files remain.
