const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();
const NAMESPACE = 'urn:x-cast:com.screeninfo.app';

function logEvent(event) {
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';

  const timestamp = document.createElement('span');
  timestamp.className = 'timestamp';
  timestamp.textContent = `${new Date().toLocaleTimeString()  } - `;

  const message = document.createElement('span');
  message.textContent = event;

  logEntry.appendChild(timestamp);
  logEntry.appendChild(message);

  const eventLog = document.getElementById('eventLog');
  eventLog.insertBefore(logEntry, eventLog.firstChild);
}

// Handle custom messages
context.addCustomMessageListener(NAMESPACE, function (event) {
  if (event.data.type === 'LOAD_AUDIO') {
    const audio = document.getElementById('castAudio');
    audio.src = event.data.url;
    audio.play();
    logEvent(`Audio loaded and playing: ${  event.data.url}`);
  }
});

// Log various events
playerManager.addEventListener(cast.framework.events.EventType.MEDIA_STATUS, event => {
  logEvent(`Media status updated: ${  event.mediaStatus.playerState}`);
});

playerManager.addEventListener(cast.framework.events.EventType.LOAD_START, () => {
  logEvent('Starting to load media');
});

playerManager.addEventListener(cast.framework.events.EventType.LOAD_COMPLETE, () => {
  logEvent('Media loaded successfully');
});

playerManager.addEventListener(cast.framework.events.EventType.ERROR, event => {
  logEvent(`Error: ${  event.detailedErrorCode}`);
});

// Customize load handling
playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, request => {
  logEvent(`Loading media: ${  request.media.contentId}`);

  if (request.media.contentType.startsWith('image/')) {
    document.getElementById('castImage').src = request.media.contentId;
    logEvent(`Image displayed: ${  request.media.contentId}`);
    return null; // Don't process image through media player
  }

  return request;
});

// Start the receiver
context.start();
logEvent('Receiver application started');
