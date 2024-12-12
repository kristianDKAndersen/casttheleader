// chromecast.js

const APP_ID = '64F29018';
const NAMESPACE = 'urn:x-cast:com.screeninfo.app';

let castSession = null;
let status = 'Initializing...';
let screenInfo = null;
let isConnected = false;
let isAvailable = false;
let pollInterval;
//let heartbeatInterval = null;

// Initialize Cast API when it becomes available
const initializeCastApi = () => {
  const castContext = cast.framework.CastContext.getInstance();

  castContext.setOptions({
    receiverApplicationId: APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });

  // Add session listener
  castContext.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, event => {
    if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
      castSession = castContext.getCurrentSession();
      status = 'Connected to Chromecast';
      isConnected = true;
    } else if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
      isConnected = false;
      castSession = null;
      screenInfo = null;
    }
  });
};

// Connect to receiver
export const connectToReceiver = async () => {
  try {
    status = 'Connecting to Chromecast...';
    await cast.framework.CastContext.getInstance().requestSession();
  } catch (error) {
    status = `Connection failed: ${error.message}`;
    throw error;
  }
};

// Request screen information
export const requestScreenInfo = async data => {
  if (!castSession) {
    status = 'Not connected to Chromecast';
    return;
  }

  try {
    await castSession.sendMessage(NAMESPACE, { command: 'getScreenInfo', data });
    status = 'Screen info requested';

    // Add listener for response if not already added
    castSession.addMessageListener(NAMESPACE, (namespace, message) => {
      console.log('Message received from receiver:', message);
      const data = JSON.parse(message);
      console.log('Data received from receiver:', data);
      screenInfo = data.data;
      //startHeartbeat();
    });
  } catch (error) {
    status = `Error requesting screen info: ${error.message}`;
    throw error;
  }
};

export const sendHeartbeat = async data => {
  if (!castSession) {
    status = 'Not connected to Chromecast';
    return;
  }

  try {
    const session = cast.framework.CastContext.getInstance().getCurrentSession();
    if (!session) {
      status = 'No active session';
      return;
    }

    await session.sendMessage(NAMESPACE, {
      command: 'heartbeat',
      data,
      timestamp: Date.now(), // Add timestamp for tracking
    });

    console.log('Heartbeat sent at:', new Date().toISOString());
    status = 'sending heartbeat';
  } catch (error) {
    status = `Error sending heartbeat: ${error.message}`;
    console.error('Heartbeat error:', error);
  }
};

// Stop casting
export const stopCasting = async () => {
  if (castSession) {
    try {
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

// Setup cast API when it becomes available
const checkCastApi = () => {
  if (window.__onGCastApiAvailable) {
    clearInterval(pollInterval);
    isAvailable = true;
    status = 'Cast API available';
    initializeCastApi();
  } else {
    console.log('Cast API not available');
  }
};

// Start polling for the Cast API
export const initializeChromecast = () => {
  // Poll every 500ms until Cast API is available
  pollInterval = setInterval(checkCastApi, 500);
};

// Cleanup function
export const cleanupChromecast = () => {
  if (pollInterval) clearInterval(pollInterval);
};

// Getter functions to access state
export const getStatus = () => status;
export const getScreenInfo = () => screenInfo;
export const getIsConnected = () => isConnected;
export const getIsAvailable = () => isAvailable;
