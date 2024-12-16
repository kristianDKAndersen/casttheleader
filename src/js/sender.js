import UrlSanitizer from './utils/UrlSanitizer.js';
const sender = () => {
  const APP_ID = '64F29018';
  const NAMESPACE = 'urn:x-cast:com.screeninfo.app';

  let castSession = null;

  let pollInterval;

  const state = {
    url: [''],
  };

  const addInput = document.querySelector('.addInput');
  const theInputcontainer = document.querySelector('.theInputcontainer');

  const castButton = document.getElementById('castButton');
  const stopcastButton = document.getElementById('stopcastButton');

  const inputField = `
            <div class="addremovewrap" style="width:100%;">
                <input type="text" class="input" placeholder="Enter URL" />
                <div role="button" class="addremove removeInput"> - </div>
            </div>
        `;

  // Add new input field
  addInput.addEventListener('click', () => {
    theInputcontainer.insertAdjacentHTML('afterbegin', inputField);
  });

  theInputcontainer.addEventListener('click', e => {
    if (e.target.classList.contains('removeInput')) {
      e.target.closest('.addremovewrap').remove();
    }

    if (e.target.classList.contains('input')) {
      e.target.addEventListener('focus', () => {});

      e.target.addEventListener('blur', e => {
        //const url =
        UrlSanitizer(e.target.value);
        // console.log(url);
      });
      e.target.addEventListener('input', e => {
        // const url =
        UrlSanitizer(e.target.value);
        //console.log(url);
      });
    }
  });

  castButton.addEventListener('click', async () => {
    console.log('castButton clicked');

    try {
      await cast(getUrls());
    } catch (error) {
      console.error('Error connecting:', error);
    }
  });

  stopcastButton.addEventListener('click', async () => {
    try {
      await stop();
      console.log('stopcastButton clicked');
    } catch (error) {
      console.error('Error stopping cast:', error);
    }
  });

  const getUrls = () => {
    const inputUrls = document.querySelectorAll('input[type=text]');
    const urls = Array.from(inputUrls).map(input => input.value);
    log(urls);
    return urls;
  };

  const log = function () {
    console.log(...arguments);
  };

  const initializeCastApi = () => {
    const sessionRequest = new chrome.cast.SessionRequest(APP_ID);

    const apiConfig = new chrome.cast.ApiConfig(
      sessionRequest,
      _session => {
        castSession = _session;

        log('has config', castSession);
      },
      receiver => log('has receiver', receiver)
    );
    chrome.cast.initialize(
      apiConfig,
      () => log('cast init success'),
      err => log('cast init error', err)
    );
  };

  const checkApi = function () {
    if (!(chrome && chrome.cast)) {
      console.error(
        'google cast api not found, please include www.gstatic.com/cv/js/sender/v1/cast_sender.js'
      );
    }
  };

  const cast = function (url, cb) {
    checkApi();
    log('cast');
    return new Promise((resolve, reject) => {
      chrome.cast.requestSession(_session => {
        log('has session', _session);

        castSession = _session;

        castSession.addMessageListener(NAMESPACE, function (namespace, data) {
          log('received message', data);
          cb && cb.apply(cb, arguments);
        });
        if (url && url[0]) {
          console.log('sending url', url);
          resolve(updateUrl(url));
        } else {
          //sending empty message
          console.log('sending empty message');
          sendMessage({}).then(() => {
            resolve();
          });
        }
      }, reject);
    });
  };

  const stop = function () {
    log('stop');
    castSession.stop();
  };

  const sendMessage = function (obj) {
    console.log('sending', obj);

    return new Promise((resolve, reject) => {
      log('sending', obj);
      castSession.sendMessage(NAMESPACE, JSON.stringify(obj), () => resolve(obj), reject);
    });
  };

  const update = fn => value => {
    fn(value);
    return sendMessage(state);
  };

  const updateUrl = update(value => {
    state.url = Array.isArray(value) ? value : [value]; // Ensure it's always an array
  });

  const checkCastApi = () => {
    if (window.__onGCastApiAvailable) {
      clearInterval(pollInterval);

      initializeCastApi();
    } else {
      console.log('Cast API not available');
    }
  };

  // Start polling for the Cast API
  const initializeChromecast = () => {
    // Poll every 500ms until Cast API is available
    pollInterval = setInterval(checkCastApi, 500);
  };
  /*    
      // Cleanup function
     const cleanupChromecast = () => {
        if (pollInterval) clearInterval(pollInterval);
      };
*/

  initializeChromecast();
};
export default sender;
