(function () {
    var birthdayStart = new Date(2026, 6, 11, 0, 0, 0, 0);
    var birthdayEnd = new Date(2026, 6, 11, 23, 59, 59, 999);
    var countdownNodes = {
        grid: document.getElementById("countdownGrid"),
        title: document.getElementById("countdownTitle"),
        days: document.getElementById("days"),
        hours: document.getElementById("hours"),
        minutes: document.getElementById("minutes"),
        seconds: document.getElementById("seconds"),
        status: document.getElementById("countdownStatus")
    };
    var letter = [
        "亲爱的小蓝：",
        "",
        "今天是 2026 年 7 月 17 日，是属于你的日子。",
        "我想把夏天里很柔软的一部分留给你，也把这份认真准备过的心意放在这里。",
        "愿你每天都能开心快乐，见到想见的人，吃到想吃的美食，读到想看的小说，听到想听的歌曲。",
        "愿你与大自然不亦乐乎，精神世界自由翱翔；愿生活中的小美好，一直陪在你身边。",
        "",
        "小蓝，生日快乐。新的一岁，也请继续做那个真诚、勇敢、善良、自由的你。"
    ].join("\n");
    var birthdayAudio = document.getElementById("birthdayMusic");
    var memoryVideo = document.getElementById("memoryVideo");
    var memoryHls = null;
    var particles = [];
    var canvas = document.getElementById("birthdayCanvas");
    var ctx = canvas.getContext("2d");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var letterStarted = false;

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function updateCountdown() {
        var now = new Date();

        if (now.getTime() < birthdayStart.getTime()) {
            renderDuration(birthdayStart.getTime() - now.getTime());
            countdownNodes.grid.classList.remove("is-hidden");
            countdownNodes.title.textContent = "距离 2026 年 7 月 17 日";
            countdownNodes.status.textContent = "距离小蓝的生日还有这些时间，等那一天正式点亮祝福。";
            document.body.classList.remove("is-birthday");
            return;
        }

        countdownNodes.grid.classList.add("is-hidden");

        if (now.getTime() <= birthdayEnd.getTime()) {
            countdownNodes.title.textContent = "今天是小蓝的生日";
            countdownNodes.status.textContent = "小蓝，生日快乐！今天一整天都是生日当天，不需要倒计时，只需要认真庆祝。";
            document.body.classList.add("is-birthday");
            return;
        }

        countdownNodes.title.textContent = "2026 年生日庆祝完毕";
        countdownNodes.status.textContent = "2026年生日庆祝完毕，平安喜乐。愿这份祝福继续留在这里，陪小蓝走向新的一岁。";
        document.body.classList.remove("is-birthday");
    }

    function renderDuration(distance) {
        var seconds = Math.max(0, Math.floor(distance / 1000));
        var days = Math.floor(seconds / 86400);
        seconds %= 86400;
        var hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        var minutes = Math.floor(seconds / 60);
        seconds %= 60;

        countdownNodes.days.textContent = pad(days);
        countdownNodes.hours.textContent = pad(hours);
        countdownNodes.minutes.textContent = pad(minutes);
        countdownNodes.seconds.textContent = pad(seconds);
    }

    function setupMusic() {
        var button = document.getElementById("musicToggle");
        var text = button.querySelector(".music-text");

        function setState(isPlaying) {
            button.classList.toggle("is-playing", isPlaying);
            text.textContent = isPlaying ? "生日歌播放中" : "开启音乐";
            button.setAttribute("aria-pressed", isPlaying ? "true" : "false");
        }

        button.addEventListener("click", function () {
            if (birthdayAudio.paused) {
                if (memoryVideo && !memoryVideo.paused) {
                    memoryVideo.pause();
                }

                birthdayAudio.play().catch(function () {
                    setState(false);
                    text.textContent = "点击重试音乐";
                });
            } else {
                birthdayAudio.pause();
            }

            createSpark(button);
            burstParticles(20);
        });

        birthdayAudio.addEventListener("play", function () {
            setState(true);
        });
        birthdayAudio.addEventListener("pause", function () {
            setState(false);
        });
        birthdayAudio.addEventListener("error", function () {
            setState(false);
            text.textContent = "音乐加载失败";
        });
    }

    function setupVideo() {
        if (!memoryVideo) {
            return;
        }

        var loading = document.getElementById("videoLoading");
        var playButton = document.getElementById("videoPlayButton");
        var fallbackSource = memoryVideo.getAttribute("data-mobile-src");
        var hlsSource = memoryVideo.getAttribute("data-hls-src");
        var fatalErrorCount = 0;
        var prefersNativeHls = memoryVideo.canPlayType("application/vnd.apple.mpegurl")
            && /AppleWebKit/.test(navigator.userAgent)
            && !/(Chrome|Chromium|Edg)/.test(navigator.userAgent);

        function setVideoState(message, isHidden) {
            loading.textContent = message;
            loading.classList.toggle("is-hidden", isHidden);
            memoryVideo.dataset.videoState = isHidden ? "ready" : "loading";
        }

        function restoreFallback() {
            if (memoryHls) {
                memoryHls.destroy();
                memoryHls = null;
            }

            setVideoState("网络较慢，正在切换兼容视频...", false);
            memoryVideo.src = fallbackSource;
            memoryVideo.load();
        }

        playButton.addEventListener("click", function () {
            setVideoState("高清纪念片正在缓冲，请稍候...", false);
            memoryVideo.play().catch(function (error) {
                memoryVideo.dataset.playError = error.name || "PlayError";
                setVideoState("播放未能开始，请再点一次播放按钮", false);
                playButton.classList.remove("is-hidden");
            });
        });

        memoryVideo.addEventListener("play", function () {
            if (!birthdayAudio.paused) {
                birthdayAudio.pause();
            }

            if (memoryVideo.readyState < 3) {
                setVideoState("高清纪念片正在缓冲，请稍候...", false);
            }
        });
        memoryVideo.addEventListener("playing", function () {
            setVideoState("", true);
            playButton.classList.add("is-hidden");
        });
        memoryVideo.addEventListener("canplay", function () {
            setVideoState("", true);
        });
        memoryVideo.addEventListener("waiting", function () {
            if (!memoryVideo.paused && !memoryVideo.ended) {
                setVideoState("网络波动，高清纪念片正在继续缓冲...", false);
            }
        });
        memoryVideo.addEventListener("stalled", function () {
            if (!memoryVideo.paused && !memoryVideo.ended) {
                setVideoState("网络较慢，高清纪念片正在继续缓冲...", false);
            }
        });
        memoryVideo.addEventListener("ended", function () {
            playButton.classList.remove("is-hidden");
            playButton.setAttribute("aria-label", "重新播放纪念片");
            playButton.setAttribute("title", "重新播放纪念片");
        });

        if (prefersNativeHls) {
            memoryVideo.addEventListener("error", restoreFallback, { once: true });
            memoryVideo.src = hlsSource;
            memoryVideo.load();
        } else if (window.Hls && window.Hls.isSupported()) {
            memoryHls = new window.Hls({
                enableWorker: true,
                maxBufferLength: 20,
                maxMaxBufferLength: 30,
                backBufferLength: 10
            });
            memoryHls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
                memoryHls.loadSource(hlsSource);
            });
            memoryHls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                memoryVideo.dataset.streamReady = "true";
            });
            memoryHls.on(window.Hls.Events.LEVEL_SWITCHED, function (event, data) {
                var level = memoryHls.levels[data.level];
                if (level && level.height) {
                    memoryVideo.dataset.quality = level.height + "p";
                }
            });
            memoryHls.on(window.Hls.Events.ERROR, function (event, data) {
                if (!data.fatal) {
                    return;
                }

                fatalErrorCount += 1;
                if (fatalErrorCount === 1 && data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                    setVideoState("高清线路连接波动，正在重试...", false);
                    memoryHls.startLoad();
                    return;
                }
                if (fatalErrorCount === 1 && data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                    setVideoState("高清纪念片正在恢复播放...", false);
                    memoryHls.recoverMediaError();
                    return;
                }

                restoreFallback();
            });
            memoryHls.attachMedia(memoryVideo);
        } else {
            restoreFallback();
        }

        window.addEventListener("beforeunload", function () {
            if (memoryHls) {
                memoryHls.destroy();
            }
        }, { once: true });
    }

    function setupCake() {
        var candles = document.querySelector(".candles");
        var button = document.getElementById("wishButton");
        var message = document.getElementById("wishMessage");
        var isLit = false;

        button.addEventListener("click", function () {
            isLit = !isLit;
            candles.classList.toggle("is-lit", isLit);
            button.textContent = isLit ? "吹灭蜡烛" : "再次点亮愿望";
            message.textContent = isLit
                ? "愿望已经被点亮：愿小蓝新的一岁开心、自由、明亮。"
                : "愿望藏进星光里了，愿它悄悄实现。";
            createSpark(button);
            burstParticles(isLit ? 40 : 24);
        });
    }

    function setupLetterButton() {
        var button = document.getElementById("readLetterButton");
        var section = document.getElementById("birthdayLetter");

        button.addEventListener("click", function () {
            section.hidden = false;
            button.setAttribute("aria-expanded", "true");
            button.textContent = letterStarted ? "继续读生日信" : "生日信已展开";

            if (!letterStarted) {
                typeLetter();
                letterStarted = true;
            }

            setTimeout(function () {
                section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
            }, 80);
        });
    }

    function setupWishCards() {
        var cards = document.querySelectorAll(".wish-card");
        cards.forEach(function (card) {
            card.addEventListener("click", function () {
                var isOpen = card.classList.toggle("is-open");
                card.setAttribute("aria-expanded", isOpen ? "true" : "false");
                var hint = card.querySelector("em");
                hint.textContent = isOpen ? "已打开" : "再看一次";
                createSpark(card);
                burstParticles(isOpen ? 18 : 10);
            });
        });
    }

    function typeLetter() {
        var container = document.getElementById("letterText");
        var index = 0;
        var cursor = '<span class="letter-cursor">_</span>';

        if (reducedMotion) {
            container.textContent = letter;
            return;
        }

        var timer = setInterval(function () {
            index += 1;
            container.innerHTML = escapeHtml(letter.slice(0, index)) + cursor;
            if (index >= letter.length) {
                clearInterval(timer);
                container.textContent = letter;
            }
        }, 46);
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function createSpark(target) {
        var rect = target.getBoundingClientRect();
        var spark = document.createElement("span");
        spark.className = "spark";
        spark.textContent = "♥";
        spark.style.left = rect.left + rect.width / 2 + "px";
        spark.style.top = rect.top + "px";
        document.body.appendChild(spark);
        spark.addEventListener("animationend", function () {
            spark.remove();
        });
    }

    function resizeCanvas() {
        var ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(window.innerWidth * ratio);
        canvas.height = Math.round(window.innerHeight * ratio);
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function addParticle() {
        var types = ["confetti", "balloon", "cake"];
        var type = types[Math.floor(Math.random() * types.length)];
        var palette = ["#d94578", "#f0b94d", "#62bfa8", "#8a5fbf", "#ffffff"];
        particles.push({
            type: type,
            x: Math.random() * window.innerWidth,
            y: type === "balloon" ? window.innerHeight + 40 : -24,
            size: type === "balloon" ? 16 + Math.random() * 12 : 5 + Math.random() * 8,
            speed: type === "balloon" ? -(0.45 + Math.random() * 0.8) : 0.6 + Math.random() * 1.8,
            drift: -0.7 + Math.random() * 1.4,
            rotation: Math.random() * Math.PI,
            spin: -0.04 + Math.random() * 0.08,
            color: palette[Math.floor(Math.random() * palette.length)]
        });
    }

    function burstParticles(amount) {
        if (reducedMotion) {
            return;
        }

        for (var i = 0; i < amount; i++) {
            particles.push({
                type: i % 9 === 0 ? "cake" : i % 4 === 0 ? "balloon" : "confetti",
                x: window.innerWidth / 2 + (-90 + Math.random() * 180),
                y: window.innerHeight * 0.28 + (-20 + Math.random() * 40),
                size: 6 + Math.random() * 14,
                speed: -1.8 + Math.random() * 3,
                drift: -2.4 + Math.random() * 4.8,
                rotation: Math.random() * Math.PI,
                spin: -0.09 + Math.random() * 0.18,
                color: ["#d94578", "#f0b94d", "#62bfa8", "#8a5fbf"][Math.floor(Math.random() * 4)]
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.y += p.speed;
            p.x += p.drift;
            p.rotation += p.spin;

            if (p.type === "balloon") {
                drawBalloonParticle(p);
            } else if (p.type === "cake") {
                drawCakeParticle(p);
            } else {
                drawConfettiParticle(p);
            }

            if (p.y > window.innerHeight + 60 || p.y < -90 || p.x < -70 || p.x > window.innerWidth + 70) {
                particles.splice(i, 1);
            }
        }

        if (particles.length < 90 && Math.random() < 0.22) {
            addParticle();
        }

        requestAnimationFrame(drawParticles);
    }

    function drawConfettiParticle(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
        ctx.restore();
    }

    function drawBalloonParticle(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.rotation) * 0.14);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.72, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.42)";
        ctx.beginPath();
        ctx.ellipse(-p.size * 0.22, -p.size * 0.24, p.size * 0.16, p.size * 0.26, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(116,86,98,0.38)";
        ctx.beginPath();
        ctx.moveTo(0, p.size);
        ctx.quadraticCurveTo(7, p.size + 18, -2, p.size + 36);
        ctx.stroke();
        ctx.restore();
    }

    function drawCakeParticle(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * 0.25);
        ctx.fillStyle = "#fff7fb";
        ctx.fillRect(-p.size * 0.42, -p.size * 0.58, p.size * 0.84, p.size * 0.22);
        ctx.fillStyle = "#ef7f9b";
        ctx.fillRect(-p.size * 0.5, -p.size * 0.36, p.size, p.size * 0.34);
        ctx.fillStyle = "#70c7b0";
        ctx.fillRect(-p.size * 0.58, -p.size * 0.03, p.size * 1.16, p.size * 0.36);
        ctx.fillStyle = "#ffc857";
        ctx.fillRect(-1, -p.size * 0.92, 2, p.size * 0.28);
        ctx.beginPath();
        ctx.arc(0, -p.size, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function init() {
        updateCountdown();
        setInterval(updateCountdown, 1000);
        setupMusic();
        setupVideo();
        setupCake();
        setupLetterButton();
        setupWishCards();
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        if (!reducedMotion) {
            burstParticles(34);
            drawParticles();
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
