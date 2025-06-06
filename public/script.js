const API_BASE = "http://localhost:3000";
let mediaRecorder;
let audioChunks = [];
let jobId = null;
let pollInterval = null;

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((content) => (content.style.display = "none"));

    tab.classList.add("active");
    const tabId = tab.dataset.tab;
    document.getElementById(`${tabId}-input`).style.display = "block";
  });
});

async function convertFromFigma() {
  const figmaKey = document.getElementById("figma-key").value.trim();

  if (!figmaKey) {
    showStatus("Please enter a Figma file key", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ figmaKey }),
    });

    const data = await response.json();

    if (response.ok) {
      jobId = data.jobId;
      showStatus("Conversion started...", "processing");
      startPolling();
    } else {
      showStatus(data.error || "Failed to start conversion", "error");
    }
  } catch (error) {
    showStatus("Error: Unable to connect to server", "error");
  }
}

// Text conversion
async function convertFromText() {
  const description = document
    .getElementById("design-description")
    .value.trim();

  if (!description) {
    showStatus("Please enter a design description", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/text-to-angular`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });

    const data = await response.json();

    if (response.ok) {
      jobId = data.jobId;
      showStatus("Design generation started...", "processing");
      startPolling();
    } else {
      showStatus(data.error || "Failed to start conversion", "error");
    }
  } catch (error) {
    showStatus("Error: Unable to connect to server", "error");
  }
}

// Voice recording and conversion
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      await processVoiceRecording(audioBlob);
    };

    mediaRecorder.start();

    document.querySelector(".voice-button.record").style.display = "none";
    document.querySelector(".voice-button.stop").style.display = "inline-flex";
    document.querySelector(".voice-status").textContent = "Recording...";
  } catch (error) {
    showStatus("Error: Unable to access microphone", "error");
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());

    document.querySelector(".voice-button.record").style.display =
      "inline-flex";
    document.querySelector(".voice-button.stop").style.display = "none";
    document.querySelector(".voice-status").textContent = "Processing...";
  }
}

// async function processVoiceRecording(audioBlob) {
//   const formData = new FormData();
//   formData.append("audio", audioBlob, "recording.wav");

//   try {
//     const response = await fetch(`${API_BASE}/api/voice-to-angular`, {
//       method: "POST",
//       body: formData,
//     });

//     const data = await response.json();

//     if (response.ok) {
//       const transcription = data.transcription; // Get transcription
//       document.querySelector("#voice-transcript").value = transcription; // Display transcription
//       showStatus("Voice processing completed!", "success");
//       document.querySelector("#voice-convert-button").disabled = false;
//     } else {
//       showStatus(data.error || "Failed to process voice command", "error");
//     }
//   } catch (error) {
//     showStatus("Error: Unable to connect to server", "error");
//   }

//   document.querySelector(".voice-status").textContent = "Ready to record";
// }

async function processVoiceRecording(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");

  try {
    const response = await fetch(`${API_BASE}/api/voice-to-angular`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      const transcription = data.transcription;
      document.querySelector("#voice-transcript").value = transcription;

      // This is the key - set the jobId from the response
      jobId = data.jobId;

      showStatus("Voice processed! Click Convert to continue.", "success");
      document.querySelector("#voice-convert-button").disabled = false;
    } else {
      showStatus(data.error || "Failed to process voice command", "error");
    }
  } catch (error) {
    showStatus("Error: Unable to connect to server", "error");
  }

  document.querySelector(".voice-status").textContent = "Ready to record";
}

async function convertFromVoice() {
  if (!jobId) {
    showStatus("Please record a voice command first", "error");
    return;
  }

  showStatus("Converting voice design to Angular...", "processing");
  startPolling(); // Use the common polling mechanism

  // Hide the separate voice feedback since we're using the common one
  document.getElementById("voice-feedback").style.display = "none";
}

// async function convertFromVoice() {
//   if (!jobId) {
//     showStatus("Please record a voice command first", "error");
//     return;
//   }

//   // Show feedback section
//   const feedbackSection = document.getElementById("voice-feedback");
//   const statusMessage = document.getElementById("voice-status-message");
//   const progressBar = document.getElementById("voice-progress");
//   const progressBarFill = progressBar.querySelector(".progress-bar-fill");
//   const resultSection = document.getElementById("voice-result");
//   const previewLink = document.getElementById("voice-preview-link");
//   const downloadLink = document.getElementById("voice-download-link");

//   feedbackSection.style.display = "block";
//   statusMessage.textContent = "Processing your voice command...";
//   progressBar.style.display = "block";
//   progressBarFill.style.width = "0%";
//   resultSection.style.display = "none";

//   // Poll the backend for job status
//   const interval = setInterval(async () => {
//     try {
//       const response = await fetch(`${API_BASE}/api/status/${jobId}`);
//       const data = await response.json();

//       if (data.status === "processing") {
//         progressBarFill.style.width = `${data.progress}%`;
//         statusMessage.textContent = data.message;
//       } else if (data.status === "completed") {
//         clearInterval(interval);
//         progressBarFill.style.width = "100%";
//         statusMessage.textContent = "Conversion completed successfully!";
//         resultSection.style.display = "block";
//         previewLink.href = data.previewUrl;
//         downloadLink.href = data.downloadUrl;
//       } else if (data.status === "failed") {
//         clearInterval(interval);
//         statusMessage.textContent = `Conversion failed: ${data.message}`;
//         progressBar.style.display = "none";
//       }
//     } catch (error) {
//       clearInterval(interval);
//       statusMessage.textContent = "Error: Unable to fetch job status.";
//       progressBar.style.display = "none";
//     }
//   }, 2000);
//   //startPolling();
// }

// Status polling
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);

  document.getElementById("progress").style.display = "block";

  pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/status/${jobId}`);
      const data = await response.json();

      if (response.ok) {
        updateStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    } catch (error) {
      console.error("Error polling status:", error);
    }
  }, 2000);
}

function updateStatus(jobData) {
  showStatus(
    jobData.message,
    jobData.status === "completed"
      ? "success"
      : jobData.status === "failed"
      ? "error"
      : "processing"
  );

  const progressBar = document.querySelector(".progress-bar-fill");
  progressBar.style.width = `${jobData.progress}%`;

  if (jobData.status === "completed") {
    document.getElementById("result").classList.add("visible");
    document.getElementById("preview-link").href = jobData.previewUrl;
    document.getElementById("download-link").href = jobData.downloadUrl;
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById("status-message");
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.style.display = "block";

  if (type === "error") {
    alert(message); // Show a popup when input provided by user is not relevant to the project domain for ex: sports, wars, political information etc.
  }
}
