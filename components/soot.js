console.log("soot check.");

(() => {
    if (document.getElementById("soot-sprite")) {
        return;
    }

    const soot = document.createElement("div");
    soot.id = "soot-sprite";
    
    soot.style.position = "fixed";
    soot.style.zIndex = "999999";
    soot.style.width = "50px";
    soot.style.height = "50px";
    soot.style.backgroundRepeat = "no-repeat";
    soot.style.pointerEvents = "auto";

    const initialX = Math.random() * (window.innerWidth - 60);
    const initialY = Math.random() * (window.innerHeight - 60);

    soot.style.left = `${initialX}px`;
    soot.style.top = `${initialY}px`;

    document.body.appendChild(soot);

    let currentFrame = 0;
    let frameCount = 6;
    let animationInterval = null;
    let isAngry = false;

    const preloadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
            img.onerror = reject;
        });
    };

    const preloadSprites = async () => {
        try {
            await preloadImage(chrome.runtime.getURL("assets/soot/sootwalk.png"));
            await preloadImage(chrome.runtime.getURL("assets/soot/sootangry.png"));
            startAnimation("sootwalk", 6);
        } catch (error) {
            startAnimation("sootwalk", 6);
        }
    };

    function startAnimation(spriteName, frames) {
        if (animationInterval) {
            clearInterval(animationInterval);
        }

        currentFrame = 0;
        frameCount = frames;
        
        const imageUrl = chrome.runtime.getURL(`assets/soot/${spriteName}.png`);

        soot.style.backgroundImage = `url(${imageUrl})`;

        const displayFrameSize = 50;
        const sheetHeightInDisplayUnits = frameCount * displayFrameSize;

        soot.style.backgroundSize = `${displayFrameSize}px ${sheetHeightInDisplayUnits}px`;

        animationInterval = setInterval(() => {
            const backgroundPositionY = -currentFrame * displayFrameSize;
            soot.style.backgroundPosition = `0px ${backgroundPositionY}px`;
            currentFrame = (currentFrame + 1) % frameCount;
        }, 100);
    }

    preloadSprites(); 

    function triggerSootInteraction() {
        if (isAngry) {
            return;
        }

        isAngry = true;
        startAnimation("sootangry", 4);

        setTimeout(() => {
            startAnimation("sootwalk", 6);
            isAngry = false;
        }, 1000);
    }

    setInterval(triggerSootInteraction, 10000);

    soot.addEventListener("click", () => {
        if (isAngry) {
            return;
        }
        isAngry = true;

        startAnimation("sootangry", 4);

        setTimeout(() => {
            startAnimation("sootwalk", 6);
            isAngry = false;
        }, 1000);
    });

    let sootPos = { x: initialX, y: initialY };
    let targetPos = { x: initialX, y: initialY };

    document.addEventListener("mousemove", (e) => {
        targetPos = { x: e.clientX - 25, y: e.clientY - 25 };
    });

    function followMouse() {
        const dx = targetPos.x - sootPos.x;
        const dy = targetPos.y - sootPos.y;
        const dist = Math.hypot(dx, dy);

        const speed = 3;
        const snapThreshold = 2;

        if (dist > snapThreshold) {
            sootPos.x += (dx / dist) * speed;
            sootPos.y += (dy / dist) * speed;
            
            sootPos.x = Math.max(0, Math.min(sootPos.x, window.innerWidth - soot.offsetWidth));
            sootPos.y = Math.max(0, Math.min(sootPos.y, window.innerHeight - soot.offsetHeight));

            soot.style.left = `${sootPos.x}px`;
            soot.style.top = `${sootPos.y}px`;

            if (dx > 0) {
                soot.style.transform = `scaleX(1)`;
            } else if (dx < 0) {
                soot.style.transform = `scaleX(-1)`;
            }
        } else if (dist > 0) {
            sootPos.x = targetPos.x;
            sootPos.y = targetPos.y;
            soot.style.left = `${sootPos.x}px`;
            soot.style.top = `${sootPos.y}px`;
        }

        requestAnimationFrame(followMouse);
    }

    followMouse();

})();