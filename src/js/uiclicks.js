import UrlSanitizer from './utils/UrlSanitizer.js';

import { Chromecast } from './chromecast.js';

const uiClicks = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const chromecast = Chromecast();
    // Check if Chromecast is available

    if (chromecast.isAvailable()) {
      console.log(chromecast.getStatus());

      // Connect to receiver
      document.getElementById('connect-btn').addEventListener('click', async () => {
        try {
          await chromecast.connectToReceiver();
          console.log('Connected:', chromecast.isConnected());
        } catch (error) {
          console.error('Connection error:', error);
        }
      });
      /*
      // Request screen info
      document.getElementById('request-info-btn').addEventListener('click', async () => {
        await chromecast.requestScreenInfo({ customData: 'Hello Receiver' });
        console.log('Screen Info:', chromecast.getScreenInfo());
      });

      // Stop casting
      document.getElementById('stop-btn').addEventListener('click', async () => {
        await chromecast.stopCasting();
        console.log('Casting stopped');
      });*/
    }

    // Clean up when the page is unloaded
    window.addEventListener('beforeunload', () => {
      chromecast.cleanup();
    });

    const addInput = document.querySelector('.addInput');
    const theInputcontainer = document.querySelector('.theInputcontainer');

    const castButton = document.getElementById('castButton');

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

    castButton.addEventListener('click', async () => {
      const inputUrls = document.querySelectorAll('input[type=text]');
      const urls = Array.from(inputUrls).map(input => input.value);
      await chromecast.requestScreenInfo(urls);
    });
  });
};

export default uiClicks;
