import UrlSanitizer from './utils/UrlSanitizer.js';

const sender = () => {
  const APP_ID = '64F29018';
  const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
  let castSession = null;

  const state = {
    url: [''],
  };

  // UI Elements
  const addInput = document.querySelector('.addInput');
  const theInputcontainer = document.querySelector('.theInputcontainer');
  const castButton = document.getElementById('castButton');
  const stopcastButton = document.getElementById('stopcastButton');

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

        castSession.addMessageListener(NAMESPACE, (namespace, data) => {
          console.log('Received message:', data);
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
      castSession.stop();
    }
  };

  const sendMessage = obj => new Promise((resolve, reject) => {
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
