(function () {
    var birthdayStart = new Date(2026, 6, 17, 0, 0, 0);
    var birthdayEnd = new Date(2026, 6, 18, 0, 0, 0);
    var countdownNodes = {
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
    var particles = [];
    var canvas = document.getElementById("birthdayCanvas");
    var ctx = canvas.getContext("2d");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function updateCountdown() {
        var now = new Date();
        var distance = birthdayStart.getTime() - now.getTime();

        if (distance > 0) {
            renderDuration(distance);
            countdownNodes.status.textContent = "这份生日祝福正在倒计时，等 2026 年 7 月 17 日正式点亮。";
            document.body.classList.remove("is-birthday");
            return;
        }

        document.body.classList.add("is-birthday");

        if (now.getTime() < birthdayEnd.getTime()) {
            renderDuration(birthdayEnd.getTime() - now.getTime());
            countdownNodes.status.textContent = "今天就是小蓝的生日，生日快乐！愿这一整天都被温柔照顾。";
            return;
        }

        countdownNodes.days.textContent = "00";
        countdownNodes.hours.textContent = "00";
        countdownNodes.minutes.textContent = "00";
        countdownNodes.seconds.textContent = "00";
        countdownNodes.status.textContent = "小蓝的 2026 生日祝福已经送达，这一天被认真收藏起来了。";
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
        var audio = document.getElementById("birthdayMusic");
        var button = document.getElementById("musicToggle");
        var text = button.querySelector(".music-text");

        function setState(isPlaying) {
            button.classList.toggle("is-playing", isPlaying);
            text.textContent = isPlaying ? "音乐播放中" : "开启音乐";
        }

        button.addEventListener("click", function () {
            if (audio.paused) {
                var result = audio.play();
                if (result && typeof result.then === "function") {
                    result.then(function () {
                        setState(true);
                    }).catch(function () {
                        setState(false);
                    });
                } else {
                    setState(true);
                }
            } else {
                audio.pause();
                setState(false);
            }

            createSpark(button);
            burstParticles(18);
        });

        audio.addEventListener("pause", function () {
            setState(false);
        });
        audio.addEventListener("play", function () {
            setState(true);
        });
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
            burstParticles(isLit ? 34 : 22);
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
        var palette = ["#d94578", "#f0b94d", "#62bfa8", "#8a5fbf", "#ffffff"];
        particles.push({
            x: Math.random() * window.innerWidth,
            y: -20,
            size: 5 + Math.random() * 7,
            speed: 0.6 + Math.random() * 1.8,
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
                x: window.innerWidth / 2 + (-90 + Math.random() * 180),
                y: window.innerHeight * 0.28 + (-20 + Math.random() * 40),
                size: 5 + Math.random() * 9,
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

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
            ctx.restore();

            if (p.y > window.innerHeight + 30 || p.x < -40 || p.x > window.innerWidth + 40) {
                particles.splice(i, 1);
            }
        }

        if (particles.length < 80 && Math.random() < 0.28) {
            addParticle();
        }

        requestAnimationFrame(drawParticles);
    }

    function init() {
        updateCountdown();
        setInterval(updateCountdown, 1000);
        setupMusic();
        setupCake();
        typeLetter();
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        if (!reducedMotion) {
            burstParticles(28);
            drawParticles();
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
