// uiClicks.js
import UrlSanitizer from './utils/UrlSanitizer.js';
import {
  initializeChromecast,
  cleanupChromecast,
  connectToReceiver,
  requestScreenInfo,
  stopCasting,
  getStatus,
} from './useChromeCast.js';

const uiClicks = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const statusTxt = document.querySelector('.statusTxt');

    initializeChromecast();
    statusTxt.innerHTML = getStatus();

    window.addEventListener('beforeunload', () => {
      cleanupChromecast();
    });

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
        e.target.addEventListener('input', e => {
          UrlSanitizer(e.target.value);
        });
      }
    });

    castButton.addEventListener('click', async () => {
      console.log('castButton clicked');
      const inputUrls = document.querySelectorAll('input[type=text]');
      const urls = Array.from(inputUrls).map(input => input.value);
      try {
        await connectToReceiver();
        statusTxt.innerHTML = getStatus();

        if (getStatus() === 'Connected to Chromecast') {
          requestScreenInfo(urls);
        }
      } catch (error) {
        console.error('Error connecting:', error);
      }
    });

    stopcastButton.addEventListener('click', async () => {
      console.log('stopcastButton clicked');
      try {
        await stopCasting();
        statusTxt.innerHTML = getStatus();
      } catch (error) {
        console.error('Error stopping cast:', error);
      }
    });
  });
};

export default uiClicks;
/*
import UrlSanitizer from './utils/UrlSanitizer.js';

import {
  initializeChromecast,
  cleanupChromecast,
  connectToReceiver,
  requestScreenInfo,
  stopCasting,
  getStatus,
  getIsConnected
  
} from './useChromeCast.js';

const uiClicks = () => {
  document.addEventListener('DOMContentLoaded', () => {
   
    let heartbeatInterval;

    const statusTxt = document.querySelector('.statusTxt');

    initializeChromecast();

    statusTxt.innerHTML = getStatus();

    window.addEventListener('beforeunload', () => {
      cleanupChromecast();
    });

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

    // Use event delegation for remove buttons
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

    const sendHeartbeat = () => {
      if (getIsConnected()) {
        const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
        if (castSession) {
          castSession.sendMessage('urn:x-cast:com.custom.message', { type: 'heartbeat' });
          
        }
      }

      
    };

    // Send a heartbeat every 30 seconds
   

    window.addEventListener('beforeunload', () => {
      cleanupChromecast();
      clearInterval(heartbeatInterval);
    });
    
    castButton.addEventListener('click', async () => {
      console.log('castButton clicked');
      const inputUrls = document.querySelectorAll('input[type=text]');
      const urls = Array.from(inputUrls).map(input => input.value);
      try {
        await connectToReceiver();
        statusTxt.innerHTML = getStatus();

        if (getStatus() === 'Connected to Chromecast') {
          requestScreenInfo(urls);
          heartbeatInterval = setInterval(sendHeartbeat, 30000);
        }
      } catch (error) {
        console.error('Error connecting:', error);
      }
    });

    stopcastButton.addEventListener('click', async () => {
      console.log('stopcastButton clicked');
      try {
        await stopCasting();
        statusTxt.innerHTML = getStatus();
      } catch (error) {
        console.error('Error stopping cast:', error);
      }
    });
  });
};

export default uiClicks;
*/
