import UrlSanitizer from './utils/UrlSanitizer.js';
const uiClicks = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const addInput = document.querySelector('.addInput');
    const theInputcontainer = document.querySelector('.theInputcontainer');

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
  });
};

export default uiClicks;
