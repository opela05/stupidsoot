//main.js 
//opening panel must be in synC!

chrome.runtime.onStartup.addListener(() => {
  console.log("service worker started");
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("service worker installed");
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

const playSound = async () => {
  const audioUrl = chrome.runtime.getURL("assets/sounds/alarm.mp3");
  try {
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen.html'),
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play alarm sound',
    });
    chrome.runtime.sendMessage({
      type: 'play-audio',
      audioUrl: audioUrl
    });
  } catch (error) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: (url) => {
            new Audio(url).play().catch(e => console.error(e));
          },
          args: [audioUrl]
        }).catch(e => console.error(e));
      }
    });
  }
};

let alarmCheckInterval = null;

const startAlarmChecker = () => {
  if (alarmCheckInterval) return;
  alarmCheckInterval = setInterval(async () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    const data = await chrome.storage.local.get("clock.alarms");
    let alarms = data["clock.alarms"] || [];

    let updatedAlarms = false;
    alarms.forEach((alarm) => {
      if (alarm.time === currentTime && !alarm.triggered) {
        alarm.triggered = true;
        updatedAlarms = true;
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Stupid Soot Alarm",
          message: `⏰ ${alarm.title} (${alarm.time})`,
          priority: 2
        });
        playSound();
      }
    });

    if (updatedAlarms) {
      chrome.storage.local.set({ "clock.alarms": alarms });
      chrome.runtime.sendMessage({ type: "alarms-updated", alarms: alarms });
    }
  }, 1000);
};

chrome.runtime.onInstalled.addListener(() => {
  startAlarmChecker();
});

chrome.runtime.onStartup.addListener(() => {
  startAlarmChecker();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "show-toast") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Stupid Soot Reminder",
      message: msg.text,
      priority: 2
    });
    sendResponse({ status: "notified" });
  } else if (msg.type === "set-alarm-triggered") {
    chrome.storage.local.get("clock.alarms", (data) => {
      let alarms = data["clock.alarms"] || [];
      const index = alarms.findIndex(a => a.time === msg.time && a.title === msg.title);
      if (index !== -1) {
        alarms[index].triggered = msg.triggered;
        chrome.storage.local.set({ "clock.alarms": alarms }, () => {
          sendResponse({ status: "updated" });
        });
      } else {
        sendResponse({ status: "not found" });
      }
    });
    return true;
  }
});