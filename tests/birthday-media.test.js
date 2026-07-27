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
