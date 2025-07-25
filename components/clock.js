const clockTab = document.getElementById("clock");
let currentPushed = null;


if (clockTab) {
  const bgBase = chrome.runtime.getURL("assets/clock/");
  const buttons = {
    alarm: "alarm.png",
    stopwatch: "stopwatch.png",
    timer: "timer.png"
  };

  const container = document.createElement("div");
  container.className = "clock-buttons";

  const pane = document.createElement("div");
  pane.className = "clock-pane";

  for (const [key, imgpath] of Object.entries(buttons)) {
    const btn = document.createElement("button");
    btn.className = "clock-btn";
    btn.title = key;
    btn.id = key;

    const btnimg = document.createElement("img");
    btnimg.src = `${bgBase}${imgpath}`;
    btnimg.alt = key;

    btn.appendChild(btnimg);
    container.appendChild(btn);

    btn.addEventListener("click", () => {
      pushUp(key, btn);
    });
  }

  clockTab.appendChild(container);
  clockTab.appendChild(pane);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "alarms-updated") {
      if (currentPushed === "alarm" && typeof renderAlarmsFromBackground === 'function') {
        renderAlarmsFromBackground(msg.alarms);
      }
    }
  });

  const sootCloseButton = document.getElementById("soot-close");
  if (sootCloseButton) {
    sootCloseButton.addEventListener("click", () => {
      const buttons = document.querySelectorAll(".clock-btn");
      buttons.forEach((btn) => {
        btn.classList.remove("push-up", "dimmed", "fixed-transition");
        btn.style.position = '';
        btn.style.top = '';
        btn.style.left = '';
        btn.style.width = '';
        btn.style.height = '';
        btn.style.transform = '';
        btn.style.zIndex = '';
      });
      if (pane) pane.innerHTML = "";
      currentPushed = null;

      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
      }
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    });
  }
}

function pushUp(key, clickedBtn) {
  const buttons = document.querySelectorAll(".clock-btn");
  const pane = document.querySelector(".clock-pane");

  if (currentPushed === key) {
    buttons.forEach((btn) => {
      btn.classList.remove("push-up", "dimmed", "fixed-transition");
      btn.style.position = '';
      btn.style.top = '';
      btn.style.left = '';
      btn.style.width = '';
      btn.style.height = '';
      btn.style.transform = '';
      btn.style.zIndex = '';
    });
    if (pane) pane.innerHTML = "";
    currentPushed = null;

    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      stopwatchInterval = null;
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    return false;
  }

  if (pane) pane.innerHTML = "";

  const targetTop = 90;
  const targetLeft = 50;

  buttons.forEach((btn) => {
    const rect = btn.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    btn.style.position = "fixed";
    btn.style.top = `${rect.top + scrollTop}px`;
    btn.style.left = `${rect.left}px`;
    btn.style.width = `${btn.offsetWidth}px`;
    btn.style.height = `${btn.offsetHeight}px`;
    btn.style.transition = "top 0.5s ease, left 0.5s ease";

    void btn.offsetWidth;

    if (btn === clickedBtn) {
      btn.classList.add("push-up");
      btn.style.top = `${targetTop}px`;
      btn.style.left = `${targetLeft}px`;
      btn.style.transform = "scale(1.1)";
      btn.style.zIndex = "1000";
    } else {
      btn.classList.add("dimmed");
    }
  });

  currentPushed = key;
  if (key === 'alarm') alarmFunc();
  else if (key === "stopwatch") stopwatchFunc();
  else if (key === "timer") timerFunc();
  return true;
}


function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    milliseconds: String(ms % 1000).padStart(3, '0').slice(0, 2)
  };
}

let stopwatchInterval = null;
let stopwatchStartTime = 0;
let stopwatchElapsedTime = 0;
let updateStopwatchDisplay;

function stopwatchFunc() {
  const pane = document.querySelector(".clock-pane");
  if (!pane) return;

  const stopwatchPane = document.createElement("div");
  stopwatchPane.className = "stopwatch-pane";

  const timeDisplay = document.createElement("div");
  timeDisplay.className = "stopwatch-display";

  const hours = document.createElement("span");
  const mins = document.createElement("span");
  const secs = document.createElement("span");
  const msecs = document.createElement("span");

  hours.textContent = "00";
  mins.textContent = "00";
  secs.textContent = "00";
  msecs.textContent = "00";
  msecs.style.fontSize = "30px";
  msecs.style.color = "white";
  msecs.style.alignItems = "right";


  timeDisplay.appendChild(hours);
  timeDisplay.appendChild(document.createTextNode(":"));
  timeDisplay.appendChild(mins);
  timeDisplay.appendChild(document.createTextNode(":"));
  timeDisplay.appendChild(secs);
  timeDisplay.appendChild(msecs);

  const controls = document.createElement("div");
  controls.className = "stopwatch-controls";

  const startBtn = document.createElement("button");
  const stopBtn = document.createElement("button");
  const resetBtn = document.createElement("button");

  startBtn.innerHTML = `<i class="bi bi-play-fill"></i>`;
  stopBtn.innerHTML = `<i class="bi bi-pause-circle"></i>`;
  resetBtn.innerHTML = `<i class="bi bi-arrow-clockwise"></i>`;

  startBtn.className = "stopwatch-btn btn";
  stopBtn.className = "stopwatch-btn btn";
  resetBtn.className = "stopwatch-btn btn";

  controls.appendChild(startBtn);
  controls.appendChild(stopBtn);
  controls.appendChild(resetBtn);

  stopwatchPane.appendChild(timeDisplay);
  stopwatchPane.appendChild(controls);
  pane.appendChild(stopwatchPane);

  updateStopwatchDisplay = (elapsedMs) => {
    const { hours: h, minutes: m, seconds: s, milliseconds: ms } = formatTime(elapsedMs);
    hours.textContent = h;
    mins.textContent = m;
    secs.textContent = s;
    msecs.textContent = ms;
  };

  const startStopwatch = () => {
    if (stopwatchInterval) return;
    stopwatchStartTime = Date.now() - stopwatchElapsedTime;
    stopwatchInterval = setInterval(() => {
      stopwatchElapsedTime = Date.now() - stopwatchStartTime;
      updateStopwatchDisplay(stopwatchElapsedTime);
    }, 100); 
  };

  const stopStopwatch = () => {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  };

  const resetStopwatch = () => {
    stopStopwatch();
    stopwatchElapsedTime = 0;
    stopwatchStartTime = 0;
    updateStopwatchDisplay(0);
  };

  startBtn.addEventListener("click", startStopwatch);
  stopBtn.addEventListener("click", stopStopwatch);
  resetBtn.addEventListener("click", resetStopwatch);

  updateStopwatchDisplay(stopwatchElapsedTime);
}


function saveAlarmsToStorage(alarms) {
  chrome.storage.local.set({ "clock.alarms": alarms });
}

function loadAlarmsFromStorage(callback) {
  chrome.storage.local.get("clock.alarms", (data) => {
    callback(data["clock.alarms"] || []);
  });
}

let renderAlarmsFromBackground;

function alarmFunc() {
  const pane = document.querySelector(".clock-pane");
  pane.innerHTML = "";

  const alarmPane = document.createElement("div");
  alarmPane.className = "alarm-pane d-flex flex-column gap-3 p-3";
  pane.appendChild(alarmPane);

  const form = document.createElement("form");
  form.className = "alarm-form d-flex flex-column gap-2";

  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.required = true;
  timeInput.className = "form-control";

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.placeholder = "Event title";
  titleInput.required = true;
  titleInput.className = "form-control";

  const addButton = document.createElement("button");
  addButton.type = "submit";
  addButton.className = "btn btn-secondary active";
  addButton.textContent = "Add Alarm";
  addButton.style.backgroundColor = 'rgb(104,118,88)';

  form.appendChild(timeInput);
  form.appendChild(titleInput);
  form.appendChild(addButton);
  alarmPane.appendChild(form);

  const listGroup = document.createElement("div");
  listGroup.className = "list-group list-group-flush";
  listGroup.style.overflowY = "auto";
  listGroup.style.maxHeight = "300px";
  alarmPane.appendChild(listGroup);

  let alarms = [];

  function showToast(message) {
    chrome.runtime.sendMessage(
      { type: "show-toast", text: message },
      (res) => console.log("[✅] Toast sent:", res)
    );
  }

  renderAlarmsFromBackground = (loadedAlarms) => {
    alarms = loadedAlarms;
    listGroup.innerHTML = "";
    alarms.forEach(({ time, title, triggered }, index) => {
      const item = document.createElement("div");
      item.className = "list-group-item d-flex justify-content-between align-items-start flex-column";

      const header = document.createElement("div");
      header.className = "w-100 d-flex justify-content-between align-items-center";

      const clickableTime = document.createElement("div");
      clickableTime.textContent = time;
      clickableTime.style.cursor = "pointer";
      clickableTime.className = "fw-semibold";
      if (triggered) {
        clickableTime.classList.add("triggered-alarm");
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-sm";
      deleteBtn.innerHTML = '<i class="bi bi-trash2-fill"></i>';
      deleteBtn.addEventListener("click", () => {
        const confirmDelete = confirm(`Delete alarm "${title}" at ${time}?`);
        if (confirmDelete) {
          alarms.splice(index, 1);
          saveAlarmsToStorage(alarms);
          renderAlarmsFromBackground(alarms);
          showToast("Alarm deleted");
        }
      });

      header.appendChild(clickableTime);
      header.appendChild(deleteBtn);

      const collapseBody = document.createElement("div");
      collapseBody.className = "text-muted small mt-1";
      collapseBody.textContent = title;
      collapseBody.style.display = "none";

      clickableTime.addEventListener("click", () => {
        collapseBody.style.display = collapseBody.style.display === "none" ? "block" : "none";
      });

      item.appendChild(header);
      item.appendChild(collapseBody);
      listGroup.appendChild(item);
    });
  };

  loadAlarmsFromStorage((loadedAlarms) => {
    renderAlarmsFromBackground(loadedAlarms);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const time = timeInput.value;
    const title = titleInput.value;

    if (!time || !title) return;

    alarms.push({ time, title, triggered: false });
    saveAlarmsToStorage(alarms);
    renderAlarmsFromBackground(alarms);
    showToast(`Alarm added for ${time}`);

    timeInput.value = "";
    titleInput.value = "";
  });
}

let timerInterval = null;
let timerEndTime = 0;
let timerDuration = 0;
let updateTimerDisplay;

function timerFunc() {
  const pane = document.querySelector(".clock-pane");
  if (!pane) return;

  const timerPane = document.createElement("div");
  timerPane.className = "timer-pane";

  timerPane.innerHTML = `
    <div class="timer-top-info">
      <span class="timer-initial-duration">0 min</span>
      <div class="timer-icons">
        <i class="bi bi-arrows-fullscreen"></i>
        <i class="bi bi-arrow-counterclockwise"></i>
      </div>
    </div>
    <div class="timer-display-container">
      <div class="timer-circle">
        <div class="timer-progress"></div>
        <div class="timer-inner-circle">
          <div class="timer-countdown">00:00:00</div>
          <div class="timer-end-time"></div>
        </div>
      </div>
    </div>
    <div class="timer-input-controls">
      <input type="number" id="timerMinutes" placeholder="MM" min="0" max="599" value="0">
      <span>:</span>
      <input type="number" id="timerSeconds" placeholder="SS" min="0" max="59" value="0">
      <button class="timer-set-btn btn"><i class="bi bi-play-fill"></i></button>
    </div>
    <div class="timer-controls">
      <button class="timer-pause-resume-btn btn"><i class="bi bi-pause-fill"></i></button>
      <button class="timer-reset-btn btn"><i class="bi bi-arrow-clockwise"></i></button>
    </div>
  `;
  pane.appendChild(timerPane);

  const timerInitialDuration = timerPane.querySelector(".timer-initial-duration");
  const timerCountdown = timerPane.querySelector(".timer-countdown");
  const timerEndTimeDisplay = timerPane.querySelector(".timer-end-time");
  const timerProgress = timerPane.querySelector(".timer-progress");
  const timerMinutesInput = timerPane.querySelector("#timerMinutes");
  const timerSecondsInput = timerPane.querySelector("#timerSeconds");
  const timerSetBtn = timerPane.querySelector(".timer-set-btn");
  const timerPauseResumeBtn = timerPane.querySelector(".timer-pause-resume-btn");
  const timerResetBtn = timerPane.querySelector(".timer-reset-btn");

  let isTimerRunning = false;

  updateTimerDisplay = (remainingMs, initialDurMs) => {
    const { hours: h, minutes: m, seconds: s } = formatTime(remainingMs);
    timerCountdown.textContent = `${h}:${m}:${s}`;

    timerDuration = initialDurMs; 

    if (initialDurMs > 0) {
      const percentage = (initialDurMs - remainingMs) / initialDurMs * 100;
      timerProgress.style.background = `conic-gradient(
        #a78bfa ${percentage}%,
        transparent ${percentage}%
      )`;

      timerInitialDuration.textContent = `${Math.ceil(initialDurMs / 60000)} min`;

      if (isTimerRunning && remainingMs > 0) {
          const endTime = new Date(Date.now() + remainingMs);
          timerEndTimeDisplay.textContent = `${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
          timerEndTimeDisplay.textContent = '';
      }
    } else {
      timerProgress.style.background = `transparent`;
      timerInitialDuration.textContent = '0 min';
      timerEndTimeDisplay.textContent = '';
    }

    if (remainingMs <= 0) {
        timerCountdown.textContent = '00:00:00';
        timerProgress.style.background = `transparent`;
        timerInitialDuration.textContent = '0 min';
        timerEndTimeDisplay.textContent = '';
        isTimerRunning = false;
        timerPauseResumeBtn.innerHTML = `<i class="bi bi-play-fill"></i>`;
    }
  };

  const startTimer = (durationMs) => {
    if (timerInterval) clearInterval(timerInterval);
    timerEndTime = Date.now() + durationMs;
    timerDuration = durationMs; 

    timerInterval = setInterval(() => {
      const remaining = timerEndTime - Date.now();
      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        updateTimerDisplay(0, timerDuration); 
        chrome.runtime.sendMessage({
          type: "show-toast",
          text: "Timer finished!"
        });
      } else {
        updateTimerDisplay(remaining, timerDuration);
      }
    }, 1000);
    isTimerRunning = true;
    updateTimerDisplay(durationMs, timerDuration);
  };

  const pauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerDuration = timerEndTime - Date.now(); 
      isTimerRunning = false;
      updateTimerDisplay(timerDuration, timerDuration); 
    }
  };

  const resumeTimer = () => {
    if (!timerInterval && timerDuration > 0) {
      startTimer(timerDuration);
    }
  };

  const resetTimer = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerEndTime = 0;
    timerDuration = 0;
    isTimerRunning = false;
    updateTimerDisplay(0, 0);
  };


  timerSetBtn.addEventListener("click", () => {
    let minutes = parseInt(timerMinutesInput.value) || 0;
    let seconds = parseInt(timerSecondsInput.value) || 0;
    const totalDurationMs = (minutes * 60 + seconds) * 1000;
    if (totalDurationMs > 0) {
      startTimer(totalDurationMs);
      timerPauseResumeBtn.innerHTML = `<i class="bi bi-pause-fill"></i>`;
    }
  });

  timerPauseResumeBtn.addEventListener("click", () => {
    if (isTimerRunning) {
      pauseTimer();
      timerPauseResumeBtn.innerHTML = `<i class="bi bi-play-fill"></i>`;
    } else {
      resumeTimer();
      timerPauseResumeBtn.innerHTML = `<i class="bi bi-pause-fill"></i>`;
    }
  });

  timerResetBtn.addEventListener("click", () => {
    resetTimer();
    timerPauseResumeBtn.innerHTML = `<i class="bi bi-play-fill"></i>`;
  });

  updateTimerDisplay(0, 0); 
}