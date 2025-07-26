// components/soot.js - FINAL DEBUG VERSION (No DOMContentLoaded)

console.log("Soot script: Script started (outside DOMContentLoaded).");

if (document.getElementById("soot-sprite")) {
    console.log("Soot script: Soot sprite already exists. Exiting to prevent duplicates.");
    return;
}

console.log("Soot script: Creating new soot sprite.");
const soot = document.createElement("div");
soot.id = "soot-sprite";

const sootWalkImageUrl = chrome.runtime.getURL("assets/soot/sootwalk.png");
console.log("Soot script: Soot walk image URL:", sootWalkImageUrl);

soot.style.setProperty(
    "background-image",
    `url(${sootWalkImageUrl})`
);

const initialX = Math.random() * (window.innerWidth - 60);
const initialY = Math.random() * (window.innerHeight - 60);

soot.style.left = `${initialX}px`;
soot.style.top = `${initialY}px`;

document.body.appendChild(soot);
console.log("Soot script: Soot sprite appended to body.", soot);

let currentFrame = 0;
let frameCount = 6;
let frameHeight = 32; // Confirmed 32px height for each frame
let animationInterval = null;
let isAngry = false;

function startAnimation(spriteName, frames) {
    console.log(`Soot script: Starting animation: ${spriteName} with ${frames} frames.`);
    if (animationInterval) {
        clearInterval(animationInterval);
        console.log("Soot script: Cleared previous animation interval.");
    }

    currentFrame = 0;
    frameCount = frames;

    const imageUrl = chrome.runtime.getURL(`assets/soot/${spriteName}.png`);
    console.log(`Soot script: Animation image URL for ${spriteName}: ${imageUrl}`);

    soot.style.backgroundImage = `url(${imageUrl})`;
    soot.style.backgroundSize = `50px ${frames * frameHeight}px`;
    console.log(`Soot script: Background size set to: 50px ${frames * frameHeight}px`);

    animationInterval = setInterval(() => {
        soot.style.backgroundPosition = `0px -${currentFrame * frameHeight}px`;
        currentFrame = (currentFrame + 1) % frameCount;
    }, 100);
}

startAnimation("sootwalk", 6); // Initial animation call

soot.addEventListener("click", () => {
    console.log("Soot script: Soot sprite clicked.");
    if (isAngry) {
        console.log("Soot script: Soot is already angry, ignoring click.");
        return;
    }
    isAngry = true;
    console.log("Soot script: Soot is now angry.");

    startAnimation("sootangry", 4);

    setTimeout(() => {
        console.log("Soot script: Soot reverting to walk animation.");
        startAnimation("sootwalk", 6);
        isAngry = false;
        console.log("Soot script: Soot no longer angry.");
    }, 1000);
});

let sootPos = { x: initialX, y: initialY };
let targetPos = { ...sootPos };
console.log(`Soot script: Initial sootPos: x=${sootPos.x}, y=${sootPos.y}`);
console.log(`Soot script: Initial targetPos: x=${targetPos.x}, y=${targetPos.y}`);


document.addEventListener("mousemove", (e) => {
    targetPos = { x: e.clientX, y: e.clientY };
});

function followMouse() {
    const dx = targetPos.x - sootPos.x;
    const dy = targetPos.y - sootPos.y;
    const dist = Math.hypot(dx, dy);

    const speed = 5;
    const snapThreshold = 5;

    if (dist > snapThreshold) {
        sootPos.x += (dx / dist) * speed;
        sootPos.y += (dy / dist) * speed;

        soot.style.left = `${sootPos.x}px`;
        soot.style.top = `${sootPos.y}px`;

        soot.style.transform = `scaleX(${dx > 0 ? 1 : -1})`;
    } else if (dist > 0) {
        sootPos.x = targetPos.x;
        sootPos.y = targetPos.y;
        soot.style.left = `${sootPos.x}px`;
        soot.style.top = `${sootPos.y}px`;
    }

    requestAnimationFrame(followMouse);
}

console.log("Soot script: Starting mouse follow animation loop.");
followMouse();