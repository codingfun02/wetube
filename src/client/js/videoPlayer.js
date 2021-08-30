const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
const muteBtnIcon = muteBtn.querySelector("i");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime"); 
const volumeRange = document.getElementById("volume");
const timeline = document.getElementById("timeline");
const fullScreenBtn = document.getElementById("fullScreenBtn");
const fullScreenBtnIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

const LOCALSTORAGE_VOLUME_DATA_KEY = "volumeData";

let controlsTimeout = null;
let controlsMovementTimeout = null;
let volumeValue = 5;
video.volume = volumeValue / 10;

const handlePlayClick = () => {
  if(video.paused) {
    video.play();
    playBtnIcon.classList = "fas fa-pause";
  } else {
    video.pause();
    playBtnIcon.classList = "fas fa-play";
  }
};

const handleMuteClick = () => {
  if(video.muted) {
    video.muted = false;
  } else {
    video.muted = true;
  }
  muteBtnIcon.classList = video.muted ? "fas fa-volume-mute" : "fas fa-volume-up";
  volumeRange.value = video.muted ? 0 : volumeValue;
  console.log(volumeValue, video.muted);
  saveVolumeData();
};

const handleVolumeChange = (event) => {
  const {target: {value}} = event;
  if(video.muted) {
    video.muted = false;
  }
  muteBtnIcon.classList = video.muted ? "fas fa-volume-mute" : "fas fa-volume-up";
  volumeValue = Number(value);
  video.volume = volumeValue / 10;
  saveVolumeData();
};

const formatTime = (seconds) => new Date(seconds * 1000).toISOString().substr(14, 5);

const handleLoadMetadata = () => {
  const videoDuration = Math.floor(video.duration);
  totalTime.innerText = formatTime(video.duration);
  timeline.max = videoDuration;
};

const handleTimeUpdate = () => {
  currentTime.innerText = formatTime(Math.floor(video.currentTime));
  timeline.value = Math.floor(video.currentTime);
};

const handleTimelineChange = (event) => {
  const {target: {value}} = event;
  video.currentTime = value;
};

const handleFullScreen = () => {
  const fullscreen = document.fullscreenElement;
  if (fullscreen) {
    document.exitFullscreen();
    fullScreenBtnIcon.classList = "fas fa-expand";
  } else {
    videoContainer.requestFullscreen();
    fullScreenBtnIcon.classList = "fas fa-compress";
  }
};

const hideControls = () => videoControls.classList.remove("showing");

const handleMouseMove = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
    controlsTimeout = null;
  }
  if(controlsMovementTimeout) {
    clearTimeout(controlsMovementTimeout);
    controlsMovementTimeout = null;
  }
  videoControls.classList.add("showing");
  controlsMovementTimeout = setTimeout(hideControls, 3000);
};

const handleMouseLeave = () => {
  controlsTimeout = setTimeout(hideControls, 3000);
};

const handleKeyDown = (event) => {
  const {keyCode} = event;
  switch (keyCode) {
    case 32: // space
      handlePlayClick();
      break;
    case 37: // left arrow
      video.currentTime -= 5;
      break;
    case 39: // right arrow
      video.currentTime += 5;
      break;
    case 38: // up arrow
      if (volumeValue < 10) {
        if (video.muted) {
          video.muted = false;
          muteBtnIcon.classList = "fas fa-volume-up";
        }
        volumeValue += 1;
        volumeRange.value = volumeValue;
        video.volume = volumeValue / 10;
        saveVolumeData();
      }
      break;
    case 40: // down arrow
      if (volumeValue > 0) {
        if (volumeValue === 1) {
          video.muted = true;
          muteBtnIcon.classList = "fas fa-volume-mute";
        }
        volumeValue -= 1;
        volumeRange.value = volumeValue;
        video.volume = volumeValue / 10;
        saveVolumeData();
      }
      break;
  }
};

const handleEnded = () => {
  playBtnIcon.classList = "fas fa-undo";
  const {id} = videoContainer.dataset;
  fetch(`/api/videos/${id}/view`, {method: "POST"});
}

// save volume data

const saveVolumeData = () => {
  const volumeData = {
    volumeValue,
    muted: video.muted
  };
  localStorage.setItem(LOCALSTORAGE_VOLUME_DATA_KEY, JSON.stringify(volumeData));
};

const loadVolumeData = (loadedVolumeData) => {
  const parsedVolumeData = JSON.parse(loadedVolumeData);
  volumeValue = parsedVolumeData.volumeValue;
  video.volume = volumeValue / 10;
  video.muted = parsedVolumeData.muted;
  muteBtnIcon.classList = video.muted ? "fas fa-volume-mute" : "fas fa-volume-up";
  volumeRange.value = video.muted ? 0 : volumeValue;
}

const init = () => {
  playBtn.addEventListener("click", handlePlayClick);
  muteBtn.addEventListener("click", handleMuteClick);
  volumeRange.addEventListener("input", handleVolumeChange);
  video.addEventListener("loadeddata", handleLoadMetadata);
  video.addEventListener("timeupdate", handleTimeUpdate);
  video.addEventListener("click", handlePlayClick);
  video.addEventListener("ended", handleEnded);
  videoContainer.addEventListener("mousemove", handleMouseMove);
  videoContainer.addEventListener("mouseleave", handleMouseLeave);
  timeline.addEventListener("input", handleTimelineChange);
  fullScreenBtn.addEventListener("click", handleFullScreen);
  window.addEventListener("keydown", handleKeyDown);

  const loadedVolumeData = localStorage.getItem(LOCALSTORAGE_VOLUME_DATA_KEY);
  if (loadedVolumeData !== null) {
    loadVolumeData(loadedVolumeData);
  }
}

init();

if(video.readyState === 4) {
  handleLoadMetadata();
}