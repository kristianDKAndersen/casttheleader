const APP_ID = '64F29018';
const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
let castSession = null;
let castContext = null;

window.onload = function () {
  initializeCastApi();
};

function initializeCastApi() {
  cast.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });

  castContext = cast.framework.CastContext.getInstance();
  castContext.addEventListener(
    cast.framework.CastContextEventType.CAST_STATE_CHANGED,
    handleCastStateChange
  );

  document.getElementById('connectButton').addEventListener('click', connectToChromecast);
  document.getElementById('castButton').addEventListener('click', castMedia);
}

function handleCastStateChange(event) {
  const status = document.getElementById('status');
  switch (event.castState) {
    case cast.framework.CastState.NO_DEVICES_AVAILABLE:
      status.textContent = 'Status: No devices available';
      break;
    case cast.framework.CastState.NOT_CONNECTED:
      status.textContent = 'Status: Not connected';
      document.getElementById('castButton').disabled = true;
      break;
    case cast.framework.CastState.CONNECTED:
      status.textContent = 'Status: Connected';
      document.getElementById('castButton').disabled = false;
      castSession = castContext.getCurrentSession();
      break;
  }
}

function connectToChromecast() {
  castContext
    .requestSession()
    .then(() => {
      console.log('Connected successfully');
    })
    .catch(error => {
      console.error('Error connecting to Chromecast:', error);
    });
}

function castMedia() {
  if (!castSession) {
    console.error('No cast session available');
    return;
  }

  const mediaInfo = {
    contentId: document.getElementById('previewImage').src,
    contentType: 'image/jpeg',
    streamType: chrome.cast.media.StreamType.NONE,
  };

  const request = new chrome.cast.media.LoadRequest(mediaInfo);
  castSession
    .loadMedia(request)
    .then(() => {
      console.log('Image loaded successfully');
      // Now send the audio URL through custom message
      const audioUrl = document.getElementById('previewAudio').querySelector('source').src;
      castSession.sendMessage(NAMESPACE, {
        type: 'LOAD_AUDIO',
        url: audioUrl,
      });
    })
    .catch(error => {
      console.error('Error loading media:', error);
    });
}
