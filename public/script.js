// public/script.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("conversion-form");
  const figmaKeyInput = document.getElementById("figma-key");
  const submitButton = document.getElementById("submit-button");
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const statusMessage = document.getElementById("status-message");
  const previewFrame = document.getElementById("preview-frame");
  const previewContainer = document.getElementById("preview-container");
  const downloadButton = document.getElementById("download-button");

  let jobStatusInterval = null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const figmaKey = figmaKeyInput.value.trim();
    if (!figmaKey) {
      alert("Please enter a Figma file key");
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Processing...";
      progressContainer.style.display = "block";
      previewContainer.style.display = "none";
      downloadButton.style.display = "none";

      // Submit the job
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ figmaKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to start conversion process"
        );
      }

      const { jobId } = await response.json();
      if (!jobId) {
        throw new Error("No job ID returned from server");
      }

      // Start polling for job status
      monitorJobStatus(jobId);
    } catch (error) {
      showError(`Error: ${error.message}`);
      resetForm();
    }
  });

  function monitorJobStatus(jobId) {
    // Clear any existing interval
    if (jobStatusInterval) {
      clearInterval(jobStatusInterval);
    }

    // Start polling for status
    jobStatusInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/status/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to get job status");
        }

        const jobStatus = await response.json();
        updateStatusUI(jobStatus);

        // Stop polling once the job is completed or failed
        if (jobStatus.status === "completed" || jobStatus.status === "failed") {
          clearInterval(jobStatusInterval);

          if (jobStatus.status === "completed") {
            showPreview(jobStatus.previewUrl);
            showDownloadButton(jobId);
          }

          resetForm();
        }
      } catch (error) {
        showError(`Error checking job status: ${error.message}`);
        clearInterval(jobStatusInterval);
        resetForm();
      }
    }, 2000); // Check every 2 seconds
  }

  function updateStatusUI(jobStatus) {
    progressBar.style.width = `${jobStatus.progress}%`;
    statusMessage.textContent = jobStatus.message || "Processing...";

    if (jobStatus.status === "failed") {
      progressBar.classList.add("error");
      statusMessage.classList.add("error");
    } else {
      progressBar.classList.remove("error");
      statusMessage.classList.remove("error");
    }
  }

  function showPreview(previewUrl) {
    previewContainer.style.display = "block";
    previewFrame.src = previewUrl;
  }

  function showDownloadButton(jobId) {
    downloadButton.style.display = "block";
    downloadButton.onclick = () => {
      window.location.href = `/api/download/${jobId}`;
    };
  }

  function showError(message) {
    statusMessage.textContent = message;
    statusMessage.classList.add("error");
    progressBar.classList.add("error");
  }

  function resetForm() {
    submitButton.disabled = false;
    submitButton.textContent = "Convert";
  }
});
