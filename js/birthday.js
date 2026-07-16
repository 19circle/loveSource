(function () {
    var birthdayStart = new Date(2026, 6, 17, 0, 0, 0, 0);
    var birthdayEnd = new Date(2026, 6, 17, 23, 59, 59, 999);
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
        "展信悦。",
        "今天是 2026 年 7 月 17 日，是属于你的日子。",
        "我想把夏天里很柔软的一部分留给你，也把这份认真准备过的心意放在这里。",
        "从长沙相玩初遇，我们在2024年6月11号正式在一起。",
        "这两年多发生了很多事，旅游去了江苏苏州、浙江杭州、河南郑州、开封、江西南昌，",
        "以及最近跑招一起去了武汉、长沙、邵东邵阳、娄底、成都。",
        "我们之间发生的点点滴滴在我脑海中一帧一帧播放，",
        "苏州平江路上难忘的散步、山塘街桥下初牵手的悸动，杭州法喜寺投掷许愿池的99枚硬币，",
        "河南电影小镇我们的cosplay民国风，开封清明上河园人挤人多的无语，南昌开电动开到火车轨上hhh。",
        "武汉和小安一起相聚畅聊的凌晨夜晚，长沙和宝宝室友们一起相聚吃饭聊天，",
        "邵阳招聘会上不小心没头脑的犯错，娄底掉房卡掉进电梯，成都宝宝终于得偿所愿抑制不住的开心。",
        "温暖甜蜜的暖流汇上心头，很暖很暖，很甜很甜。",
        "我们相互之间对对方也更加的了解，从一开始的害羞到如今我们互相坦诚相见，我们的关系也正在一步一步升温。",
        "虽然期间也有很多争吵，但同时争吵也进一步让我们更加了解了彼此，我们未来会一起好好克服困难，勇敢前进。",
        "",
        "小蓝，生日快乐。新的一岁，祝愿宝宝做那个无忧无虑、自洽勇敢快乐的你。"
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
        var hlsFallbackSource = memoryVideo.getAttribute("data-hls-fallback");
        var fatalErrorCount = 0;
        var usingHlsFallback = false;
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

        function loadNativeHls(source, isFallback) {
            memoryVideo.dataset.videoSource = isFallback ? "github-hd" : "cos-hd";
            memoryVideo.addEventListener("error", function () {
                if (!isFallback && hlsFallbackSource) {
                    setVideoState("COS 高清线路波动，正在切换备用高清线路...", false);
                    loadNativeHls(hlsFallbackSource, true);
                    return;
                }

                restoreFallback();
            }, { once: true });
            memoryVideo.src = source;
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
            loadNativeHls(hlsSource, false);
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
                memoryVideo.dataset.videoSource = usingHlsFallback ? "github-hd" : "cos-hd";
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

                if (!usingHlsFallback && hlsFallbackSource) {
                    usingHlsFallback = true;
                    fatalErrorCount = 0;
                    setVideoState("COS 高清线路波动，正在切换备用高清线路...", false);
                    memoryHls.loadSource(hlsFallbackSource);
                    memoryHls.startLoad();
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

    function setupBouquet() {
        var section = document.getElementById("birthdayBouquet");
        var visual = document.getElementById("bouquetVisual");
        var button = document.getElementById("receiveBouquetButton");
        var message = document.getElementById("bouquetMessage");

        if (!section || !visual || !button || !message) {
            return;
        }

        button.addEventListener("click", function () {
            section.classList.add("is-received");
            button.setAttribute("aria-pressed", "true");
            button.disabled = true;
            button.querySelector("span:last-child").textContent = "花已经送到小蓝手里";
            message.textContent = "愿小蓝往后的每一天，都像这束花一样明亮、温柔，也一直被爱包围。";
            createSpark(button);
            burstParticles(22);

            if (!reducedMotion) {
                releaseBouquetPetals(visual);
            }
        });
    }

    function releaseBouquetPetals(container) {
        var colors = ["#f7a9bd", "#f8c3ce", "#fff0f2", "#e98da9"];

        for (var i = 0; i < 15; i += 1) {
            var petal = document.createElement("span");
            petal.className = "falling-petal";
            petal.style.setProperty("--petal-left", (14 + Math.random() * 72) + "%");
            petal.style.setProperty("--petal-size", (9 + Math.random() * 8) + "px");
            petal.style.setProperty("--petal-color", colors[i % colors.length]);
            petal.style.setProperty("--petal-rotate", Math.round(Math.random() * 180) + "deg");
            petal.style.setProperty("--petal-drift", (-55 + Math.random() * 110) + "px");
            petal.style.setProperty("--petal-delay", (Math.random() * 0.75) + "s");
            petal.style.setProperty("--petal-duration", (2.8 + Math.random() * 1.2) + "s");
            container.appendChild(petal);

            petal.addEventListener("animationend", function (event) {
                event.currentTarget.remove();
            }, { once: true });
        }
    }

    function typeLetter() {
        var container = document.getElementById("letterText");
        var paragraphs = letter.split("\n");
        var paragraphIndex = 0;
        var characterIndex = 0;
        var currentParagraph = null;
        var cursor = document.createElement("span");

        cursor.className = "letter-cursor";
        cursor.textContent = "_";
        container.textContent = "";
        container.setAttribute("aria-busy", "true");
        container.setAttribute("aria-live", "off");

        if (reducedMotion) {
            renderLetter(container, paragraphs);
            container.setAttribute("aria-busy", "false");
            container.setAttribute("aria-live", "polite");
            return;
        }

        function prepareParagraph() {
            while (paragraphIndex < paragraphs.length && paragraphs[paragraphIndex] === "") {
                var spacer = document.createElement("p");
                spacer.className = "letter-spacer";
                spacer.setAttribute("aria-hidden", "true");
                container.appendChild(spacer);
                paragraphIndex += 1;
            }

            if (paragraphIndex >= paragraphs.length) {
                return false;
            }

            currentParagraph = document.createElement("p");
            currentParagraph.className = "letter-paragraph";
            currentParagraph.appendChild(cursor);
            container.appendChild(currentParagraph);
            return true;
        }

        prepareParagraph();
        var timer = setInterval(function () {
            var paragraph = paragraphs[paragraphIndex];
            currentParagraph.insertBefore(document.createTextNode(paragraph.charAt(characterIndex)), cursor);
            characterIndex += 1;

            if (characterIndex >= paragraph.length) {
                cursor.remove();
                paragraphIndex += 1;
                characterIndex = 0;

                if (paragraphIndex < paragraphs.length && prepareParagraph()) {
                    return;
                }

                clearInterval(timer);
                container.setAttribute("aria-busy", "false");
                container.setAttribute("aria-live", "polite");
            }
        }, 42);
    }

    function renderLetter(container, paragraphs) {
        var fragment = document.createDocumentFragment();

        paragraphs.forEach(function (paragraph) {
            var node = document.createElement("p");
            node.className = paragraph ? "letter-paragraph" : "letter-spacer";
            if (paragraph) {
                node.textContent = paragraph;
            } else {
                node.setAttribute("aria-hidden", "true");
            }
            fragment.appendChild(node);
        });

        container.textContent = "";
        container.appendChild(fragment);
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
        setupBouquet();
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
