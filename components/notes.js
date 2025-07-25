(() => {
  const notesTab = document.getElementById("notes");
  if (!notesTab) {
    console.error("[notes.js] no #notes tab found in dom.");
    return;
  }

  const container = document.createElement("div");
  container.className = "notes-pane";

  const cdContainer = document.createElement("div");
  cdContainer.className = "cd-container";

  const cdImage = document.createElement("img");
  cdImage.src = "assets/notes/cd.png";
  cdImage.className = "cd";
  cdImage.id = "cd";

  const startButton = document.createElement("button");
  startButton.textContent = "new rec";
  startButton.className = "rec-button";
  startButton.id = "startRecBtn";

  const stopButton = document.createElement("button");
  stopButton.textContent = "stop rec";
  stopButton.className = "rec-button";
  stopButton.id = "stopRecBtn";
  stopButton.disabled = true;

  cdContainer.appendChild(cdImage);
  cdContainer.appendChild(startButton);
  cdContainer.appendChild(stopButton);
  container.appendChild(cdContainer);

  const transcriptContainer = document.createElement("div");
  transcriptContainer.className = "transcript-container";
  container.appendChild(transcriptContainer);

  notesTab.appendChild(container);

  let recorder = null;
  let stream = null;
  let chunks = [];
  let transcripts = []; // Array to store all transcript objects
  let transcriptCounter = 0; // Counter for transcript titles

  // Function to save transcripts to storage
  const saveTranscripts = async () => {
    try {
      await chrome.storage.local.set({ transcripts: transcripts });
      console.log("[notes.js] transcripts saved to storage.");
    } catch (error) {
      console.error("[notes.js] error saving transcripts:", error);
    }
  };

  // Function to load transcripts from storage
  const loadTranscripts = async () => {
    try {
      const result = await chrome.storage.local.get("transcripts");
      if (result.transcripts) {
        transcripts = result.transcripts;
        console.log("[notes.js] transcripts loaded from storage:", transcripts.length);
        // Find the highest transcript number to continue the counter
        transcriptCounter = transcripts.reduce((max, t) => {
          const match = t.title.match(/TRANSCRIPT (\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        // Render loaded transcripts
        transcripts.forEach(t => renderTranscriptCard(t.title, t.text, t.notes));
      } else {
        console.log("[notes.js] no transcripts found in storage.");
      }
    } catch (error) {
      console.error("[notes.js] error loading transcripts:", error);
    }
  };

  // Function to render a transcript card (used for both new and loaded transcripts)
  const renderTranscriptCard = (titleText, text, notes) => {
    const card = document.createElement("div");
    card.className = "transcript-card";

    const title = document.createElement("div");
    title.className = "transcript-header";
    title.contentEditable = true;
    title.spellcheck = false;
    title.textContent = titleText; // Use provided title

    // Add event listener to save title changes
    title.addEventListener('blur', () => {
      // Find the corresponding transcript in the array and update its title
      const originalTitle = card.dataset.originalTitle; // Use a data attribute to store original title for lookup
      const transcriptIndex = transcripts.findIndex(t => t.title === originalTitle);
      if (transcriptIndex !== -1) {
        transcripts[transcriptIndex].title = title.textContent;
        card.dataset.originalTitle = title.textContent; // Update original title for future edits
        saveTranscripts();
      }
    });

    const body = document.createElement("div");
    body.className = "transcript-body";
    body.innerHTML = `
      <div class="summary-text"><strong>📝</strong> ${text}</div>
      <div class="summary-notes"><strong>🧾</strong> ${notes}</div>
    `;

    card.appendChild(title);
    card.appendChild(body);

    card.classList.add("collapsed");

    card.addEventListener("click", () => {
      card.classList.toggle("collapsed");
      card.classList.toggle("open");
    });

    transcriptContainer.prepend(card);
    card.dataset.originalTitle = titleText; // Store original title for update on blur
  };

  const createAndStoreTranscriptCard = (text, notes) => {
    transcriptCounter++;
    const now = new Date();
    const date = now.toLocaleDateString("en-GB").split("/").join("/");
    const titleText = `transcript ${transcriptCounter} | ${date}`;

    const newTranscript = {
      title: titleText,
      date: date,
      text: text,
      notes: notes
    };

    transcripts.unshift(newTranscript); // Add to the beginning of the array
    saveTranscripts();
    renderTranscriptCard(titleText, text, notes); // Render the new card
  };

  // Load transcripts when the script runs
  loadTranscripts();

  startButton.onclick = async () => {
    if (stream) {
      alert("a recording is already active or not released yet.");
      return;
    }

    try {
      await fetch("http://localhost:5001/start");
      console.log("[notes.js] launcher started flask server.");
    } catch (err) {
      console.error("[notes.js] failed to start server:", err);
      alert("could not start backend server. make sure it's running.");
      return;
    }

    try {
      stream = await new Promise((resolve, reject) => {
        chrome.tabCapture.capture({ audio: true, video: false }, (s) => {
          if (chrome.runtime.lastError || !s) {
            reject(chrome.runtime.lastError || new Error("stream is null"));
          } else {
            resolve(s);
          }
        });
      });

      document.getElementById("cd").classList.add("spin");

      recorder = new MediaRecorder(stream);
      chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        chunks = [];
        recorder = null;

        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          stream = null;
        }

        document.getElementById("cd").classList.remove("spin");

        const formData = new FormData();
        formData.append("audio", blob, "audio.webm");

        try {
          const res = await fetch("http://localhost:5000/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          createAndStoreTranscriptCard(data.text, data.notes); // Use the new function
        } catch (err) {
          console.error("[notes.js] transcription failed:", err);
          alert("failed to send audio to backend for transcription.");
        }
      };

      recorder.start();
      startButton.disabled = true;
      stopButton.disabled = false;
    } catch (err) {
      console.error("[notes.js] tab capture failed:", err);
      alert("could not capture tab audio. ensure you have permissions.");
      stream = null;
    }
  };

  stopButton.onclick = () => {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  };
})();