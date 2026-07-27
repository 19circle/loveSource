# Birthday Mobile Media Optimization Design

## Goal

Improve the existing birthday page without changing its romantic visual direction:

- Make the bouquet load reliably in iOS Safari and iOS WKWebView.
- Prevent progressive, partially decoded bouquet reveals on other phones.
- Play the original 128 kbps birthday song smoothly from Shanghai COS.
- Preserve the current GitHub-hosted audio as an automatic fallback.
- Reduce mobile rendering load while retaining the cake, balloons, confetti, and interactions.

## Root Causes

1. The bouquet is a 1024 x 1536 RGBA PNG (1,544,948 bytes) inside a `display: none` container and uses `loading="lazy"`. WebKit may not request an unseen lazy image before the container becomes visible.
2. Other mobile browsers begin downloading and decoding the large PNG only after the reveal, so the image appears progressively.
3. The music uses `preload="metadata"` and starts from GitHub Pages only after the user taps the button. Mainland mobile network variation can exhaust the initial audio buffer.
4. The page continuously redraws a full-viewport canvas at the device's uncapped DPR, up to 90 particles at display refresh rate. High-DPR phones do substantially more work than desktop browsers.

## Bouquet Design

### Assets

- Keep `media/birthday-bouquet.png` as the universal fallback.
- Add transparent WebP variants at 480 px and 760 px wide.
- Use `<picture>` with `srcset` and `sizes` so phones decode the smaller asset and desktop browsers receive the larger asset.
- Preserve explicit width and height metadata to avoid layout shift.

### Loading And Reveal

- Do not use native lazy loading on the hidden bouquet.
- Load the responsive image at low priority before interaction.
- Track `load`/`error` and use `HTMLImageElement.decode()` when available.
- When the user taps the bouquet button:
  - If decoded, reveal immediately.
  - If still loading, disable the button temporarily and show `花束准备中...`.
  - Reveal only after decoding, so the bouquet appears as one complete image.
  - If WebP fails, allow the PNG fallback to load through `<picture>`.
  - On final failure, restore the button and show a concise retry message.

## Music Design

### Sources

Primary:

`https://loveheart-video-1312440069.cos.ap-shanghai.myqcloud.com/birthday-hls/%E6%A0%BC%E6%A0%BC-%E7%94%9F%E6%97%A5%E7%A5%9D%E7%A6%8F%E6%AD%8C.mp3`

Fallback:

`media/birthday-song-mobile.mp3`

### Playback State

- Set the primary COS source on the `<audio>` element and keep the local source in a fallback data attribute.
- Use `preload="auto"` as a browser hint; playback still starts only after a user gesture.
- Preserve the existing mutual exclusion between music and memorial video.
- Display explicit button states for loading, playing, paused, stalled, and failed.
- On a primary source error, switch once to the local fallback and retry only in response to the user's interaction.
- Do not use Web Audio or audio HLS; a single 3.62 MB MP3 with byte-range support does not justify that complexity.

## Mobile Rendering Budget

- Cap canvas DPR at 1.5 on mobile and 2 on larger screens.
- Reduce the mobile particle ceiling from 90 to 36.
- Limit mobile canvas updates to approximately 30 FPS.
- While audio or video is actively playing, reduce the mobile particle ceiling further to 24.
- Stop scheduling visible animation work while the document is hidden.
- Continue respecting `prefers-reduced-motion`.

## Accessibility And UX

- Keep all touch targets at least 44 x 44 px.
- Preserve `aria-pressed` on music and bouquet controls.
- Use `aria-live="polite"` for loading and failure messages.
- Disable the bouquet button only during the short decode wait and after successful receipt.
- Do not reveal an incomplete image or leave a frozen button without feedback.

## Testing

### Automated Regression Checks

- Verify the bouquet markup has responsive WebP sources and no `loading="lazy"`.
- Verify COS audio is primary and GitHub audio is configured as fallback.
- Verify the canvas DPR and mobile particle limits are capped.
- Verify music buffering and fallback state handlers exist.

### Browser Checks

- Desktop: bouquet remains hidden before interaction and appears fully after interaction.
- 375 x 844 mobile viewport: no horizontal overflow or layout overlap.
- iOS-compatible path: image request begins before the hidden section is revealed; PNG fallback remains valid.
- Music: button reports buffering/playing accurately and video playback pauses music.
- Confirm page, image, WebP variants, COS MP3, and local fallback return successful responses.

## Success Criteria

- The bouquet loads on iOS Safari/WKWebView and never remains blank after a successful request.
- The bouquet reveals only after a complete decode, without progressive partial rendering.
- COS 128 kbps audio is the normal playback source; GitHub audio remains functional if COS fails.
- Mobile canvas work is bounded and pauses when the page is hidden.
- Existing text, video, music assets, birthday logic, and romantic styling remain intact.
