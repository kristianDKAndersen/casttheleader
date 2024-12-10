// useChromeCast.js
const APP_ID = '64F29018';
const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
const HEARTBEAT_INTERVAL = 20000; // 20 seconds
const VOLUME_INTERVAL = 45000; // 45 seconds as backup

let castSession = null;
let status = 'Initializing...';
let screenInfo = null;
let isConnected = false;
let isAvailable = false;
let pollInterval;
let heartbeatInterval;
let volumeInterval;
let connectionTimeout;

const sendHeartbeat = async () => {
  if (!isConnected || !castSession) {
    console.log('Cannot send heartbeat - no active session');
    return;
  }

  try {
    console.log('Sending heartbeat...');
    await castSession.sendMessage(NAMESPACE, {
      command: 'heartbeat',
      data: null,
    });

    // Reset the previous timeout if it exists
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    // Set new timeout for volume keepalive fallback
    connectionTimeout = setTimeout(() => {
      console.log('No response received, attempting volume keepalive...');
      performVolumeKeepalive();
    }, HEARTBEAT_INTERVAL);
  } catch (error) {
    console.error('Error sending heartbeat:', error);
    performVolumeKeepalive();
  }
};

const performVolumeKeepalive = async () => {
  if (!isConnected || !castSession) return;

  try {
    console.log('Performing volume keepalive...');
    const currentVolume = castSession.getVolume();
    await castSession.setVolume(currentVolume - 0.01);
    await new Promise(resolve => setTimeout(resolve, 500));
    await castSession.setVolume(currentVolume);
  } catch (error) {
    console.error('Volume keepalive failed:', error);
    if (isConnected) {
      status = 'Connection lost';
      isConnected = false;
      stopHeartbeat();
    }
  }
};

const startHeartbeat = () => {
  stopHeartbeat(); // Clear any existing intervals

  console.log('Starting heartbeat system...');
  heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  volumeInterval = setInterval(performVolumeKeepalive, VOLUME_INTERVAL);

  // Send initial heartbeat
  sendHeartbeat();
};

const stopHeartbeat = () => {
  console.log('Stopping heartbeat system...');
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (volumeInterval) {
    clearInterval(volumeInterval);
    volumeInterval = null;
  }
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
};

const initializeCastApi = () => {
  const castContext = cast.framework.CastContext.getInstance();

  castContext.setOptions({
    receiverApplicationId: APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });

  castContext.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, event => {
    if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
      castSession = castContext.getCurrentSession();
      status = 'Connected to Chromecast';
      isConnected = true;

      // Add message listener
      castSession.addMessageListener(NAMESPACE, (namespace, message) => {
        console.log('Message received from receiver:', message);
        try {
          const data = typeof message === 'string' ? JSON.parse(message) : message;

          if (data.type === 'screenInfo') {
            console.log('Screen info received:', data);
            screenInfo = data.data;
          }

          // Reset heartbeat timeout on any message received
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

      startHeartbeat();
    } else if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
      stopHeartbeat();
      isConnected = false;
      castSession = null;
      screenInfo = null;
      status = 'Disconnected';
    }
  });
};

export const connectToReceiver = async () => {
  try {
    status = 'Connecting to Chromecast...';
    await cast.framework.CastContext.getInstance().requestSession();
  } catch (error) {
    status = `Connection failed: ${error.message}`;
    throw error;
  }
};

export const requestScreenInfo = async data => {
  if (!castSession) {
    status = 'Not connected to Chromecast';
    return;
  }

  try {
    await castSession.sendMessage(NAMESPACE, {
      command: 'getScreenInfo',
      data,
    });
    status = 'Screen info requested';
  } catch (error) {
    status = `Error requesting screen info: ${error.message}`;
    throw error;
  }
};

export const stopCasting = async () => {
  if (castSession) {
    try {
      stopHeartbeat();
      await castSession.endSession(true);
      status = 'Casting stopped';
      castSession = null;
      screenInfo = null;
      isConnected = false;
    } catch (error) {
      status = `Error stopping cast: ${error.message}`;
      throw error;
    }
  }
};

const checkCastApi = () => {
  if (window.__onGCastApiAvailable) {
    clearInterval(pollInterval);
    isAvailable = true;
    status = 'Cast API available';
    initializeCastApi();
  }
};

export const initializeChromecast = () => {
  pollInterval = setInterval(checkCastApi, 500);
};

export const cleanupChromecast = () => {
  stopHeartbeat();
  if (pollInterval) clearInterval(pollInterval);
};

// Getter functions
export const getStatus = () => status;
export const getScreenInfo = () => screenInfo;
export const getIsConnected = () => isConnected;
export const getIsAvailable = () => isAvailable;
/*
// useChromeCast.js
const APP_ID = '64F29018';
const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
//const HEARTBEAT_NAMESPACE = 'urn:x-cast:com.custom.message';

let castSession = null;
let status = 'Initializing...';
let screenInfo = null;
let isConnected = false;
let isAvailable = false;
let pollInterval;
let heartbeatInterval;

const initializeCastApi = () => {
  const castContext = cast.framework.CastContext.getInstance();

  castContext.setOptions({
    receiverApplicationId: APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });

  castContext.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, event => {
    if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
      castSession = castContext.getCurrentSession();
      status = 'Connected to Chromecast';
      isConnected = true;
      startHeartbeat(); // Start heartbeat when connected
    } else if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
      isConnected = false;
      castSession = null;
      screenInfo = null;
      stopHeartbeat(); // Stop heartbeat when disconnected
    }
  });
};

// Heartbeat functionality
const sendHeartbeat = () => {
  if (isConnected && castSession) {
    try {
      // Cast framework expects the message to be a string
    //  castSession.sendMessage(HEARTBEAT_NAMESPACE, JSON.stringify({ type: 'heartbeat' }));
      castSession.sendMessage(NAMESPACE, { command: 'heartbeat' });
      console.log('Heartbeat sent');
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }
};

const startHeartbeat = () => {
  stopHeartbeat(); // Clear any existing interval
  heartbeatInterval = setInterval(sendHeartbeat, 30000); // Send heartbeat every 30 seconds
  console.log('Heartbeat started');
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('Heartbeat stopped');
  }
};

export const connectToReceiver = async () => {
  try {
    status = 'Connecting to Chromecast...';
    await cast.framework.CastContext.getInstance().requestSession();
  } catch (error) {
    status = `Connection failed: ${error.message}`;
    throw error;
  }
};

export const requestScreenInfo = async data => {
  if (!castSession) {
    status = 'Not connected to Chromecast';
    return;
  }

  try {
    await castSession.sendMessage(NAMESPACE, { command: 'getScreenInfo', data });
    status = 'Screen info requested';

    castSession.addMessageListener(NAMESPACE, (namespace, message) => {
      console.log('Message received from receiver:', message);
      const data = JSON.parse(message);
      console.log('Data received from receiver:', data);
      screenInfo = data.data;
    });
  } catch (error) {
    status = `Error requesting screen info: ${error.message}`;
    throw error;
  }
};

export const stopCasting = async () => {
  if (castSession) {
    try {
      stopHeartbeat(); // Stop heartbeat before ending session
      await castSession.endSession(true);
      status = 'Casting stopped';
      castSession = null;
      screenInfo = null;
      isConnected = false;
    } catch (error) {
      status = `Error stopping cast: ${error.message}`;
      throw error;
    }
  }
};

const checkCastApi = () => {
  if (window.__onGCastApiAvailable) {
    clearInterval(pollInterval);
    isAvailable = true;
    status = 'Cast API available';
    initializeCastApi();
  }
};

export const initializeChromecast = () => {
  pollInterval = setInterval(checkCastApi, 500);
};

export const cleanupChromecast = () => {
  stopHeartbeat(); // Ensure heartbeat is stopped
  if (pollInterval) clearInterval(pollInterval);
};

export const getStatus = () => status;
export const getScreenInfo = () => screenInfo;
export const getIsConnected = () => isConnected;
export const getIsAvailable = () => isAvailable;
*/
