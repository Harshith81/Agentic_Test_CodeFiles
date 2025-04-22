// public/script.js
// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.getElementById("conversion-form");
//   const figmaKeyInput = document.getElementById("figma-key");
//   const submitButton = document.getElementById("submit-button");
//   const progressContainer = document.getElementById("progress-container");
//   const progressBar = document.getElementById("progress-bar");
//   const statusMessage = document.getElementById("status-message");
//   const previewFrame = document.getElementById("preview-frame");
//   const previewContainer = document.getElementById("preview-container");
//   const downloadButton = document.getElementById("download-button");

//   let jobStatusInterval = null;

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const figmaKey = figmaKeyInput.value.trim();
//     if (!figmaKey) {
//       alert("Please enter a Figma file key");
//       return;
//     }

//     try {
//       submitButton.disabled = true;
//       submitButton.textContent = "Processing...";
//       progressContainer.style.display = "block";
//       previewContainer.style.display = "none";
//       downloadButton.style.display = "none";

//       // Submit the job
//       const response = await fetch("/api/convert", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ figmaKey }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.error || "Failed to start conversion process"
//         );
//       }

//       const { jobId } = await response.json();
//       if (!jobId) {
//         throw new Error("No job ID returned from server");
//       }

//       // Start polling for job status
//       monitorJobStatus(jobId);
//     } catch (error) {
//       showError(`Error: ${error.message}`);
//       resetForm();
//     }
//   });

//   function monitorJobStatus(jobId) {
//     // Clear any existing interval
//     if (jobStatusInterval) {
//       clearInterval(jobStatusInterval);
//     }

//     // Start polling for status
//     jobStatusInterval = setInterval(async () => {
//       try {
//         const response = await fetch(`/api/status/${jobId}`);
//         if (!response.ok) {
//           throw new Error("Failed to get job status");
//         }

//         const jobStatus = await response.json();
//         updateStatusUI(jobStatus);

//         // Stop polling once the job is completed or failed
//         if (jobStatus.status === "completed" || jobStatus.status === "failed") {
//           clearInterval(jobStatusInterval);

//           if (jobStatus.status === "completed") {
//             showPreview(jobStatus.previewUrl);
//             showDownloadButton(jobId);
//           }

//           resetForm();
//         }
//       } catch (error) {
//         showError(`Error checking job status: ${error.message}`);
//         clearInterval(jobStatusInterval);
//         resetForm();
//       }
//     }, 2000); // Check every 2 seconds
//   }

//   function updateStatusUI(jobStatus) {
//     progressBar.style.width = `${jobStatus.progress}%`;
//     statusMessage.textContent = jobStatus.message || "Processing...";

//     if (jobStatus.status === "failed") {
//       progressBar.classList.add("error");
//       statusMessage.classList.add("error");
//     } else {
//       progressBar.classList.remove("error");
//       statusMessage.classList.remove("error");
//     }
//   }

//   function showPreview(previewUrl) {
//     previewContainer.style.display = "block";
//     previewFrame.src = previewUrl;
//   }

//   function showDownloadButton(jobId) {
//     downloadButton.style.display = "block";
//     downloadButton.onclick = () => {
//       window.location.href = `/api/download/${jobId}`;
//     };
//   }

//   function showError(message) {
//     statusMessage.textContent = message;
//     statusMessage.classList.add("error");
//     progressBar.classList.add("error");
//   }

//   function resetForm() {
//     submitButton.disabled = false;
//     submitButton.textContent = "Convert";
//   }
// });

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

// Figma conversion
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
      const transcription = data.transcription; // Get transcription
      document.querySelector("#voice-transcript").value = transcription; // Display transcription
      showStatus("Voice processing completed!", "success");
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

  startPolling();
}

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
}

