const APP_ID = '64F29018';
const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
let castSession = null;
let castContext = null;

document.addEventListener('DOMContentLoaded', () => {
  const connectButton = document.getElementById('connectButton');
  const castButton = document.getElementById('castButton');
  connectButton.disabled = true;
  castButton.disabled = true;
  // Add button click handlers
  connectButton.addEventListener('click', connectToChromecast);
  castButton.addEventListener('click', castMedia);

  // Cast media to Chromecast
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
        updateStatus(`Error loading media: ${error.message}`);
      });
  }

  // Connect to Chromecast
  function connectToChromecast() {
    updateStatus('Attempting to connect to Chromecast...');
    castContext
      .requestSession()
      .then(() => {
        updateStatus('Connected successfully');
        console.log('Connected successfully');
      })
      .catch(error => {
        let errorMessage = 'Error connecting to Chromecast: ';
        if (error.code === 'cancel') {
          errorMessage += 'Connection cancelled by user';
        } else if (error.code === 'timeout') {
          errorMessage += 'Connection timed out';
        } else if (error.code === 'unavailable') {
          errorMessage += 'No Chromecast devices found';
        } else {
          errorMessage += error.message || error.code || 'Unknown error';
        }
        updateStatus(errorMessage);
        console.error('Chromecast connection error:', error);
      });
  }

  // Update status message
  function updateStatus(message) {
    const status = document.getElementById('status');
    status.textContent = `Status: ${message}`;
  }
  // Handle Cast state changes
  function handleCastStateChange(event) {
    const { castState } = event;

    switch (castState) {
      case cast.framework.CastState.NO_DEVICES_AVAILABLE:
        updateStatus('No Chromecast devices found');
        document.getElementById('castButton').disabled = true;
        break;
      case cast.framework.CastState.NOT_CONNECTED:
        updateStatus('Ready to connect');
        document.getElementById('castButton').disabled = true;
        break;
      case cast.framework.CastState.CONNECTING:
        updateStatus('Connecting...');
        document.getElementById('castButton').disabled = true;
        break;
      case cast.framework.CastState.CONNECTED:
        castSession = castContext.getCurrentSession();
        updateStatus(`Connected to ${castSession.getCastDevice().friendlyName}`);
        document.getElementById('castButton').disabled = false;
        break;
      default:
        updateStatus(`Unknown cast state: ${castState}`);
        document.getElementById('castButton').disabled = true;
    }
  }

  const initializeCastApi = () => {
    const sessionRequest = new chrome.cast.SessionRequest(APP_ID);
    const apiConfig = new chrome.cast.ApiConfig(
      sessionRequest,

      _session => {
        castSession = _session;
      },
      receiverAvailability => {
        console.log('Receiver availability:', receiverAvailability);
        if (receiverAvailability === 'available') {
          console.log('Receiver available');

          const ctx = cast.framework.CastContext.getInstance();

          ctx.setOptions({
            receiverApplicationId: APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
          });

          ctx.addEventListener(
            cast.framework.CastContextEventType.CAST_STATE_CHANGED,
            handleCastStateChange
          );

          castContext = ctx;

          connectButton.disabled = false;
          castButton.disabled = false;
        }
      }
    );

    chrome.cast.initialize(
      apiConfig,
      () => console.log('Cast API initialized'),
      error => console.error('Cast API initialization error:', error)
    );
  };

  window['__onGCastApiAvailable'] = (loaded, errorInfo) => {
    if (loaded) {
      initializeCastApi();
    } else {
      console.error('Cast API load error:', errorInfo);
    }
  };
});

/*
// Update status message
function updateStatus(message) {
  const status = document.getElementById('status');
  status.textContent = `Status: ${message}`;
}

// Initialize when API is available
window['__onGCastApiAvailable'] = (loaded, errorInfo) => {
  if (loaded) {
    initializeCastApi();
  } else {
    console.error('Cast API load error:', errorInfo);
  }
};

// Initialize the Cast API
function initializeCastApi() {
  try {
    const context = cast.framework.CastContext.getInstance();
    context.setOptions({
      receiverApplicationId: APP_ID,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    castContext = context;

    // Add event listeners
    castContext.addEventListener(
      cast.framework.CastContextEventType.CAST_STATE_CHANGED,
      handleCastStateChange
    );

    // Add button click handlers
    document.getElementById('connectButton').addEventListener('click', connectToChromecast);
    document.getElementById('castButton').addEventListener('click', castMedia);

    updateStatus('Cast API initialized successfully');
  } catch (error) {
    updateStatus(`Error initializing Cast API: ${error.message}`);
    console.error('Cast initialization error:', error);
  }
}

// Handle Cast state changes
function handleCastStateChange(event) {
  const { castState } = event;

  switch (castState) {
    case cast.framework.CastState.NO_DEVICES_AVAILABLE:
      updateStatus('No Chromecast devices found');
      document.getElementById('castButton').disabled = true;
      break;
    case cast.framework.CastState.NOT_CONNECTED:
      updateStatus('Ready to connect');
      document.getElementById('castButton').disabled = true;
      break;
    case cast.framework.CastState.CONNECTING:
      updateStatus('Connecting...');
      document.getElementById('castButton').disabled = true;
      break;
    case cast.framework.CastState.CONNECTED:
      castSession = castContext.getCurrentSession();
      updateStatus(`Connected to ${castSession.getCastDevice().friendlyName}`);
      document.getElementById('castButton').disabled = false;
      break;
    default:
      updateStatus(`Unknown cast state: ${castState}`);
      document.getElementById('castButton').disabled = true;
  }
}

// Connect to Chromecast
function connectToChromecast() {
  updateStatus('Attempting to connect to Chromecast...');
  castContext
    .requestSession()
    .then(() => {
      updateStatus('Connected successfully');
      console.log('Connected successfully');
    })
    .catch(error => {
      let errorMessage = 'Error connecting to Chromecast: ';
      if (error.code === 'cancel') {
        errorMessage += 'Connection cancelled by user';
      } else if (error.code === 'timeout') {
        errorMessage += 'Connection timed out';
      } else if (error.code === 'unavailable') {
        errorMessage += 'No Chromecast devices found';
      } else {
        errorMessage += error.message || error.code || 'Unknown error';
      }
      updateStatus(errorMessage);
      console.error('Chromecast connection error:', error);
    });
}

// Cast media to Chromecast
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
      updateStatus(`Error loading media: ${error.message}`);
    });
}
*/
