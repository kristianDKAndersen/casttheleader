import UrlSanitizer from './utils/UrlSanitizer.js';

const sender = () => {
  const APP_ID = '64F29018';
  const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
  let castSession = null;
  let pingPong = null;

  const state = {
    url: [''],
  };

  // UI Elements
  const addInput = document.querySelector('.addInput');
  const theInputcontainer = document.querySelector('.theInputcontainer');
  const castButton = document.getElementById('castButton');
  const stopcastButton = document.getElementById('stopcastButton');

  const dus = document.getElementById('dus');

  // UI Setup
  const inputField = `
    <div class="addremovewrap" style="width:100%;">
      <input type="text" class="input" placeholder="Enter URL" />
      <div role="button" class="addremove removeInput"> - </div>
    </div>
  `;

  // UI Event Listeners
  addInput.addEventListener('click', () => {
    theInputcontainer.insertAdjacentHTML('afterbegin', inputField);
  });

  theInputcontainer.addEventListener('click', e => {
    if (e.target.classList.contains('removeInput')) {
      e.target.closest('.addremovewrap').remove();
    }
    if (e.target.classList.contains('input')) {
      e.target.addEventListener('blur', e => {
        UrlSanitizer(e.target.value);
      });
    }
  });

  const getUrls = () => {
    const inputUrls = document.querySelectorAll('input[type=text]');
    return Array.from(inputUrls).map(input => input.value);
  };

  castButton.addEventListener('click', async () => {
    try {
      await cast(getUrls());
    } catch (error) {
      console.error('Cast error:', error);
    }
  });

  stopcastButton.addEventListener('click', () => {
    try {
      stop();
    } catch (error) {
      console.error('Stop error:', error);
    }
  });

  // Core Cast functionality - matching first script's approach
  const checkApi = () => {
    if (!(chrome && chrome.cast)) {
      console.error(
        'Google Cast API not found, please include www.gstatic.com/cv/js/sender/v1/cast_sender.js'
      );
    }
  };

  const cast = url => {
    checkApi();
    return new Promise((resolve, reject) => {
      chrome.cast.requestSession(_session => {
        castSession = _session;

        // Initialize ping/pong when session starts
        pingPong = new CastPingPong(castSession);
        pingPong.startPinging();

        castSession.addMessageListener(NAMESPACE, (namespace, data) => {
          // Parse data if it's a string
          const message = typeof data === 'string' ? JSON.parse(data) : data;
          console.log('Received message:', message);

          // Handle pong responses
          if (message.type === 'pong') {
            console.log(castSession);
            pingPong.handlePong(message);
          }
        });

        if (url && url[0]) {
          resolve(updateUrl(url));
        } else {
          sendMessage({}).then(resolve);
        }
      }, reject);
    });
  };

  const stop = () => {
    if (castSession) {
      if (pingPong) {
        pingPong.stopPinging();
        pingPong = null;
      }
      castSession.stop();
    }
  };

  class CastPingPong {
    constructor(castSession) {
      this.castSession = castSession;
      this.NAMESPACE = 'urn:x-cast:com.screeninfo.app'; // Same namespace as receiver
      this.pingInterval = 1 * 60 * 1000; // Ping every 1 minutes
      this.pingTimeout = null;
      this.lastPongTime = Date.now();
    }

    startPinging() {
      console.log('Starting ping/pong');
      // Clear any existing interval
      if (this.pingTimeout) {
        clearInterval(this.pingTimeout);
      }

      // Start sending pings
      this.pingTimeout = setInterval(() => {
        this.sendPing();
      }, this.pingInterval);

      // Send initial ping
      this.sendPing();
    }

    stopPinging() {
      console.log('Stopping ping/pong');
      if (this.pingTimeout) {
        clearInterval(this.pingTimeout);
        this.pingTimeout = null;
      }
    }

    sendPing() {
      if (!this.castSession) {
        console.warn('No cast session available');
        return;
      }

      try {
        console.log('Sending ping to receiver');
        this.castSession.sendMessage(this.NAMESPACE, {
          type: 'ping',
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Error sending ping:', error);
      }
    }

    // Method to handle pong responses
    handlePong(message) {
      if (message.type === 'pong') {
        console.log('Received pong from receiver');
        this.lastPongTime = Date.now();

        if (dus.style.display === 'none') {
          dus.style.display = 'block';
        } else {
          dus.style.display = 'none';
        }
      }
    }
  }

  const sendMessage = obj =>
    new Promise((resolve, reject) => {
      if (!castSession) {
        return reject(new Error('No active cast session'));
      }

      castSession.sendMessage(NAMESPACE, JSON.stringify(obj), () => resolve(obj), reject);
    });

  const update = fn => value => {
    fn(value);
    return sendMessage(state);
  };

  const updateUrl = update(value => {
    state.url = Array.isArray(value) ? value : [value];
  });

  // Initialize Cast API - matching first script's approach

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
        }
      }
    );

    chrome.cast.initialize(
      apiConfig,
      () => console.log('Cast API initialized'),
      error => console.error('Cast API initialization error:', error)
    );
  };

  // Initialize when API is available
  window['__onGCastApiAvailable'] = (loaded, errorInfo) => {
    if (loaded) {
      initializeCastApi();
    } else {
      console.error('Cast API load error:', errorInfo);
    }
  };
};

export default sender;
