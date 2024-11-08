// chromecast.js

export function Chromecast() {
  const APP_ID = '64F29018';
  const NAMESPACE = 'urn:x-cast:com.custom.message';

  // State variables
  let castSession = null;
  let status = 'Initializing...';
  let screenInfo = null;
  let isConnected = false;
  let isAvailable = false;
  let pollInterval = null;
  let messageListenerAdded = false;

  // Initialize Cast API when it becomes available
  const initializeCastApi = () => {
    console.log('Initializing Cast API');
    const castContext = cast.framework.CastContext.getInstance();

    castContext.setOptions({
      receiverApplicationId: APP_ID,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    // Add session listener
    castContext.addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      event => {
        if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
          castSession = castContext.getCurrentSession();
          status = 'Connected to Chromecast';
          isConnected = true;
        } else if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
          isConnected = false;
          castSession = null;
          screenInfo = null;
        }
      }
    );
  };

  // Connect to receiver
  const connectToReceiver = async () => {
    try {
      status = 'Connecting to Chromecast...';
      await cast.framework.CastContext.getInstance().requestSession();
    } catch (error) {
      status = `Connection failed: ${error.message}`;
      throw error;
    }
  };

  // Request screen information
  const requestScreenInfo = async data => {
    if (!castSession) {
      status = 'Not connected to Chromecast';
      return;
    }

    try {
      await castSession.sendMessage(NAMESPACE, { command: 'getScreenInfo', data });
      status = 'Screen info requested';

      // Add listener for response if not already added
      if (!messageListenerAdded) {
        castSession.addMessageListener(NAMESPACE, (namespace, message) => {
          console.log('Message received from receiver:', message);
          const parsedData = JSON.parse(message);
          console.log('Data received from receiver:', parsedData);
          screenInfo = parsedData.data;
        });
        messageListenerAdded = true;
      }
    } catch (error) {
      status = `Error requesting screen info: ${error.message}`;
      throw error;
    }
  };

  // Stop casting
  const stopCasting = async () => {
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

  // Check if the Cast API is available
  const checkCastApi = () => {
    if (window.__onGCastApiAvailable) {
      clearInterval(pollInterval);
      isAvailable = true;
      status = 'Cast API available';
      initializeCastApi();
    }
  };

  // Poll every 500ms until Cast API is available
  pollInterval = setInterval(checkCastApi, 500);

  // Clear the interval when the module is no longer needed
  const cleanup = () => {
    if (pollInterval) clearInterval(pollInterval);
  };

  // Return the public interface
  return {
    // State
    getStatus: () => status,
    getScreenInfo: () => screenInfo,
    isConnected: () => isConnected,
    isAvailable: () => isAvailable,

    // Methods
    connectToReceiver,
    requestScreenInfo,
    stopCasting,
    cleanup,
  };
}
