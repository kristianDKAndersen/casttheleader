// ChromecastManager.js

export class ChromecastManager {
  constructor() {
    this.APP_ID = '64F29018';
    this.NAMESPACE = 'urn:x-cast:com.screeninfo.app';

    this.statusText = document.getElementById('status');
    // State
    this.castSession = null;
    this.status = 'Initializing...';
    this.statusText.innerHTML = 'Initializing...';
    this.screenInfo = null;
    this.isConnected = false;
    this.isAvailable = false;
    this.pollInterval = null;

    // Bind methods to maintain this context
    this.initializeCastApi = this.initializeCastApi.bind(this);
    this.connectToReceiver = this.connectToReceiver.bind(this);
    this.requestScreenInfo = this.requestScreenInfo.bind(this);
    this.stopCasting = this.stopCasting.bind(this);
    this.checkCastApi = this.checkCastApi.bind(this);

    // State change callbacks
    this.onStateChange = {
      status: new Set(),
      screenInfo: new Set(),
      isConnected: new Set(),
      isAvailable: new Set(),
    };
  }

  // Subscribe to state changes
  subscribe(stateKey, callback) {
    if (this.onStateChange[stateKey]) {
      this.onStateChange[stateKey].add(callback);
      // Immediately call with current value
      callback(this[stateKey]);
      return () => this.onStateChange[stateKey].delete(callback);
    }
    return () => {};
  }

  // Update state and notify subscribers
  setState(key, value) {
    this[key] = value;
    if (this.onStateChange[key]) {
      this.onStateChange[key].forEach(callback => callback(value));
    }
  }

  initializeCastApi() {
    cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId: this.APP_ID,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    cast.framework.CastContext.getInstance().addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      event => {
        if (event.sessionState === cast.framework.SessionState.SESSION_STARTED) {
          this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();

          this.statusText.innerHTML = 'Connected to Chromecast';

          this.setState('status', 'Connected to Chromecast');
          this.setState('isConnected', true);
        } else if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
          this.setState('isConnected', false);
          this.castSession = null;
          this.setState('screenInfo', null);
        }
      }
    );
  }

  async connectToReceiver() {
    try {
      this.setState('status', 'Connecting to Chromecast...');
      this.statusText.innerHTML = 'Connecting to Chromecast...';
      await cast.framework.CastContext.getInstance().requestSession();
    } catch (error) {
      this.setState('status', `Connection failed: ${error.message}`);
      this.statusText.innerHTML = `Connection failed: ${error.message}`;
      throw error;
    }
  }

  async requestScreenInfo(data) {
    if (!this.castSession) {
      this.setState('status', 'Not connected to Chromecast');
      return;
    }

    try {
      await this.castSession.sendMessage(this.NAMESPACE, { command: 'getScreenInfo', data });
      this.setState('status', 'Screen info requested');

      // Add listener for response if not already added
      this.castSession.addMessageListener(this.NAMESPACE, (namespace, message) => {
        //console.log("Message received from receiver:", message);
        const data = JSON.parse(message);
        //console.log("Data received from receiver:", data);
        this.setState('screenInfo', data.data);
      });
    } catch (error) {
      this.setState('status', `Error requesting screen info: ${error.message}`);
      throw error;
    }
  }

  async stopCasting() {
    if (this.castSession) {
      try {
        await this.castSession.endSession(true);
        this.setState('status', 'Casting stopped');
        this.castSession = null;
        this.setState('screenInfo', null);
        this.setState('isConnected', false);
      } catch (error) {
        this.setState('status', `Error stopping cast: ${error.message}`);
        throw error;
      }
    }
  }

  checkCastApi() {
    if (window.__onGCastApiAvailable) {
      clearInterval(this.pollInterval);
      this.setState('isAvailable', true);
      this.setState('status', 'Cast API available');
      this.initializeCastApi();
    }
  }

  // Initialize the manager
  initialize() {
    // Start polling for Cast API
    this.pollInterval = setInterval(this.checkCastApi, 500);

    return () => {
      // Cleanup function
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
    };
  }
}

// Usage example:
/*
import { ChromecastManager } from './ChromecastManager';

// Create instance
const chromecast = new ChromecastManager();

// Initialize and get cleanup function
const cleanup = chromecast.initialize();

// Subscribe to state changes
const unsubscribeStatus = chromecast.subscribe('status', (status) => {
  console.log('Status changed:', status);
});

const unsubscribeConnected = chromecast.subscribe('isConnected', (isConnected) => {
  console.log('Connection status:', isConnected);
});

// Use methods
try {
  await chromecast.connectToReceiver();
  await chromecast.requestScreenInfo({ some: 'data' });
} catch (error) {
  console.error('Error:', error);
}

// Cleanup when done
cleanup();
unsubscribeStatus();
unsubscribeConnected();
*/
