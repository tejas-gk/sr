let mediaRecorder;
let recordedChunks = [];
let startTime;
let timerInterval;
let screenStream; // Keep a reference to the screen stream
let pausedTime = 0; // Track total paused time
let pauseStart; // Track the start time of each pause

document.getElementById('startBtn').addEventListener('click', async () => {
    // Request screen capture
    screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            mediaSource: "screen"
        }
    });

    // Request audio capture
    const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true
    });

    // Combine screen and audio streams
    const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ]);

    startRecording(combinedStream);
});

document.getElementById('stopBtn').addEventListener('click', () => {
    stopRecording();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        clearInterval(timerInterval); // Stop the timer
        pauseStart = Date.now(); // Record the time when paused
        document.getElementById('pauseBtn').innerText = 'Resume Recording';
    } else if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        pausedTime += Date.now() - pauseStart; // Add paused duration to total paused time
        updateTimer(); // Initialize timer display
        timerInterval = setInterval(updateTimer, 1000); // Update timer every second
        document.getElementById('pauseBtn').innerText = 'Pause Recording';
    }
});

function startRecording(stream) {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        clearInterval(timerInterval); // Stop the timer
        const blob = new Blob(recordedChunks, {
            type: 'video/webm'
        });
        const url = URL.createObjectURL(blob);
        const videoPreview = document.getElementById('videoPreview');
        videoPreview.src = url;
        videoPreview.controls = true;
        videoPreview.play();

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'recording.webm';
        downloadLink.innerText = 'Download Recording';
        const downloadContainer = document.getElementById('downloadLinkContainer');
        downloadContainer.innerHTML = ''; // Clear any previous link
        downloadContainer.appendChild(downloadLink);

        // Stop all tracks of the screen stream
        screenStream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    startTime = Date.now();
    pausedTime = 0; // Reset paused time
    updateTimer(); // Initialize timer display
    timerInterval = setInterval(updateTimer, 1000); // Update timer every second
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = false;
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').innerText = 'Pause Recording';
}

function updateTimer() {
    const now = Date.now();
    const elapsedTime = now - startTime - pausedTime; // Adjust elapsed time with total paused time
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    document.getElementById('timer').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
