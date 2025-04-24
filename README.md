Angular Project Generator
This application allows users to generate Angular projects using three different input methods: Figma file, text description, and voice command.

Features
Figma to Angular: Generate an Angular project directly from your Figma design.
Text to Angular: Describe your desired design in text, and the application will generate the Angular code.
Voice to Angular: Use your voice to describe the design, and the application will convert it into an Angular project.
Real-time Feedback: Track the progress of your project generation with a dynamic progress bar and status updates.
Preview: Preview the generated Angular project directly in your browser.
Download: Download the generated Angular project as a ZIP file.
Getting Started
Before you begin, ensure you have the following installed:

Python and pip: You'll need Python 3 and its package installer, pip, installed on your system.
Node.js and npm: Node.js and npm (Node Package Manager) are required for running the Angular development server and managing frontend dependencies.
Once you have these prerequisites, follow these steps to get the application running:

Install Backend Dependencies: Open your terminal or command prompt and run the following command to install the Whisper library:

pip3 install whisper
You will also need the AWS SDK for Python (boto3) if your backend interacts with AWS services:

pip3 install aws-sdk
Install Frontend Dependencies: Navigate to the frontend part of your project directory in the terminal and run the following command to install the Angular project dependencies:

npm install
Start the Application: After installing the dependencies, start the frontend development server by running:

npm start
This command will typically build your Angular application and serve it on a local development server (usually http://localhost:4200).

Open the Application: Open your web browser and navigate to the address where the Angular application is being served (e.g., http://localhost:4200). You will see three tabs: "Figma File", "Text Description", and "Voice Command".

Select Input Method: Choose your preferred input method by clicking on the corresponding tab.

Figma File
Enter Figma File Key: In the "Figma File" tab, enter the key of your Figma file.
Convert to Angular: Click the "Convert Figma to Angular" button.
Text Description
Enter Description: In the "Text Description" tab, type a description of the design you want to generate (e.g., "Create a login page with email and password fields").
Generate Angular Code: Click the "Generate Angular Code" button.
Voice Command
Record Voice Command: In the "Voice Command" tab, record your voice describing the design. The Whisper model will transcribe your speech into text.
View Transcription: The transcribed text will be displayed in the #voice-transcript textarea.
Convert to Angular: Click the "Convert to Angular" button.
Backend Processing
Once you submit your input, the backend will process your request through the following steps:

Job Initialization: A unique jobId is generated, and the job is added to the PROCESSING_QUEUE with a status of queued. You will receive this jobId in the response.

Agentic Workflow: A series of specialized agents work on your request:

Agent 1: Fetches data from Figma (if a Figma file is provided) or generates a design structure based on the text or voice input.
Agent 2: Converts the design structure into Angular code using the Gemini API.
Agent 3: Verifies and fixes any issues in the generated Angular code.
Agent 4: Creates the necessary Angular project structure and writes the generated code files.
Agent 5: Builds the Angular project and prepares it for preview and download.
Preview and Download Preparation:

The built Angular project files are copied to the previews directory.
A ZIP file of the entire project is created in the downloads directory.
The job status is updated to completed, and the previewUrl and downloadUrl are added to the job status.
Real-Time Feedback
The frontend provides real-time feedback on the project generation process:

Status Polling: The application periodically (every 2 seconds) sends requests to the /api/status/:jobId endpoint to check the current status of your job.

Dynamic Updates: Based on the job status received from the backend, the progress bar and status message are updated dynamically in your browser.

Completion: Once the job is complete (completed status), you will see two buttons:

Preview: Clicking this button will open the generated Angular project in a new browser tab, allowing you to see the result.
Download: Clicking this button will download the ZIP file of your generated Angular project to your local machine.
Cleanup
To manage storage and resources, the backend periodically cleans up old jobs (both completed and failed) by removing their associated files from the workspaces, previews, and downloads directories.

Run using docker
docker-compose up --build
