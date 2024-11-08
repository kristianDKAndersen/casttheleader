import UrlSanitizer from './utils/UrlSanitizer.js';

import { ChromecastManager } from './ChromecastManager';

const uiClicks = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const chromecast = new ChromecastManager();
    // Initialize and get cleanup function
    chromecast.initialize();

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

      console.log(urls);
      // Use methods
      try {
        await chromecast.connectToReceiver();
        await chromecast.requestScreenInfo(urls);
      } catch (error) {
        console.error('Error:', error);
      }
    });

    // Initialize and get cleanup function
    const cleanup = chromecast.initialize();
    console.log(cleanup);
    // Subscribe to state changes
    chromecast.subscribe('status', status => {
      if (status === 'Connected to Chromecast') {
        console.log('Status changed:', status);
      }
    });

    chromecast.subscribe('isConnected', isConnected => {
      console.log('Connection status:', isConnected);
    });
  });
};

export default uiClicks;
