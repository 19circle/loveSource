var $window = $(window);
var gardenCtx;
var gardenCanvas;
var $garden;
var garden;
var offsetX = 0;
var offsetY = 0;
var resizeTimer;

$(function () {
    var $loveHeart = $("#loveHeart");
    $garden = $("#garden");
    gardenCanvas = $garden[0];
    gardenCtx = gardenCanvas.getContext("2d");
    garden = new Garden(gardenCtx, gardenCanvas);

    resizeGarden();
    setInterval(function () {
        garden.render();
    }, Garden.options.growSpeed);

    $window.bind("resize orientationchange", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeGarden();
            if ($("#messages").is(":visible")) {
                adjustWordsPosition();
            }
        }, 160);
    });
});

function resizeGarden() {
    if (!gardenCanvas || !gardenCtx) {
        return;
    }

    var $loveHeart = $("#loveHeart");
    var width = Math.max(280, Math.round($loveHeart.innerWidth()));
    var height = Math.max(250, Math.round($loveHeart.innerHeight()));
    var ratio = window.devicePixelRatio || 1;

    gardenCanvas.width = Math.round(width * ratio);
    gardenCanvas.height = Math.round(height * ratio);
    gardenCanvas.style.width = width + "px";
    gardenCanvas.style.height = height + "px";
    gardenCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    gardenCtx.globalCompositeOperation = "lighter";

    offsetX = width / 2;
    offsetY = height / 2 - Math.min(55, height * 0.1);

    if (garden) {
        garden.clear();
    }
}

function getHeartScale() {
    var width = $("#loveHeart").innerWidth() || 670;
    var height = $("#loveHeart").innerHeight() || 625;
    return Math.min(width / 670, height / 625, 1);
}

function getHeartPoint(c) {
    var b = c / Math.PI;
    var scale = getHeartScale();
    var a = 19.5 * scale * (16 * Math.pow(Math.sin(b), 3));
    var d = -20 * scale * (13 * Math.cos(b) - 5 * Math.cos(2 * b) - 2 * Math.cos(3 * b) - Math.cos(4 * b));
    return [offsetX + a, offsetY + d];
}

function startHeartAnimation() {
    if (!garden) {
        return;
    }

    var interval = 50;
    var angle = 10;
    var heartPoints = [];
    var timer = setInterval(function () {
        var point = getHeartPoint(angle);
        var canBloom = true;

        for (var i = 0; i < heartPoints.length; i++) {
            var oldPoint = heartPoints[i];
            var distance = Math.sqrt(Math.pow(oldPoint[0] - point[0], 2) + Math.pow(oldPoint[1] - point[1], 2));
            if (distance < Garden.options.bloomRadius.max * 1.3) {
                canBloom = false;
                break;
            }
        }

        if (canBloom) {
            heartPoints.push(point);
            garden.createRandomBloom(point[0], point[1]);
        }

        if (angle >= 30) {
            clearInterval(timer);
            showMessages();
        } else {
            angle += 0.2;
        }
    }, interval);
}

(function ($) {
    $.fn.typewriter = function () {
        this.each(function () {
            var $element = $(this);
            var html = $element.html();
            var index = 0;
            $element.html("");

            var timer = setInterval(function () {
                var current = html.substr(index, 1);
                if (current === "<") {
                    index = html.indexOf(">", index) + 1;
                } else {
                    index++;
                }

                $element.html(html.substring(0, index) + (index & 1 ? "_" : ""));
                if (index >= html.length) {
                    clearInterval(timer);
                    $element.html(html);
                }
            }, 65);
        });
        return this;
    };
})(jQuery);

function timeElapse(date) {
    var seconds = Math.max(0, Math.floor((new Date().getTime() - date.getTime()) / 1000));
    var days = Math.floor(seconds / (3600 * 24));
    seconds = seconds % (3600 * 24);
    var hours = Math.floor(seconds / 3600);
    seconds = seconds % 3600;
    var minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    $("#elapseClock").html(
        '<span class="digit">' + days + '</span> 天 ' +
        '<span class="digit">' + hours + '</span> 时 ' +
        '<span class="digit">' + minutes + '</span> 分 ' +
        '<span class="digit">' + seconds + '</span> 秒'
    );
}

function showMessages() {
    adjustWordsPosition();
    $("#messages").fadeIn(2200, function () {
        showLoveU();
    });
}

function adjustWordsPosition() {
    $("#words").css({
        position: "absolute",
        top: $window.width() <= 520 ? "50%" : "48%",
        left: "50%",
        transform: "translate(-50%, -50%)"
    });
}

function adjustCodePosition() {
    $("#code").css("margin-top", 0);
}

function showLoveU() {
    $("#loveu").fadeIn(1800);
}

function setupLoveMusic() {
    var audio = document.getElementById("loveMusic");
    var button = document.getElementById("musicToggle");

    if (!audio || !button) {
        return;
    }

    var buttonText = button.querySelector(".button-text");

    function setMusicState(isPlaying) {
        button.classList.toggle("is-playing", isPlaying);
        button.setAttribute("aria-label", isPlaying ? "暂停音乐" : "播放音乐");
        button.setAttribute("title", isPlaying ? "暂停音乐" : "播放音乐");
        if (buttonText) {
            buttonText.textContent = isPlaying ? "音乐播放中" : "开启音乐";
        }
    }

    function playMusic() {
        var result = audio.play();
        if (result && typeof result.then === "function") {
            result.then(function () {
                setMusicState(true);
            }).catch(function () {
                setMusicState(false);
            });
        } else {
            setMusicState(!audio.paused);
        }
    }

    button.addEventListener("click", function () {
        if (audio.paused) {
            playMusic();
        } else {
            audio.pause();
            setMusicState(false);
        }
        createCelebrationBloom();
        createFloatingHeart(button);
    });

    document.addEventListener("pointerdown", function (event) {
        if (event.target.closest("#musicToggle")) {
            return;
        }
        if (audio.paused) {
            playMusic();
        }
    }, { once: true });

    audio.addEventListener("play", function () {
        setMusicState(true);
    });
    audio.addEventListener("pause", function () {
        setMusicState(false);
    });

    setMusicState(false);
}

function createCelebrationBloom() {
    if (!garden) {
        return;
    }

    for (var i = 0; i < 12; i++) {
        var point = getHeartPoint(10 + Math.random() * 20);
        garden.createRandomBloom(
            point[0] + Garden.random(-18, 18),
            point[1] + Garden.random(-18, 18)
        );
    }
}

function createFloatingHeart(button) {
    var rect = button.getBoundingClientRect();
    var heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = "♥";
    heart.style.left = rect.left + rect.width / 2 + "px";
    heart.style.top = rect.top + "px";
    document.body.appendChild(heart);

    heart.addEventListener("animationend", function () {
        heart.remove();
    });
}
