const receiver = () => {
  // const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
  const debug = document.getElementById('debug');
  const startTime = Date.now();

  const log = message => {
    const time = ((Date.now() - startTime) / 1000).toFixed(1);
    const logMessage = `[${time}s] ${message}`;

    debug.innerHTML = `${logMessage  }<br>${  debug.innerHTML}`;
  };

  // Initialize when the page loads
  window.addEventListener('load', () => {
    if (cast && cast.framework) {
      // initializeReceiver();
      log('Succes: Cast API is available');
    } else {
      log('ERROR: Cast API not available');
    }
  });
};

export default receiver;

/*
const receiver = () => {
  const NAMESPACE = 'urn:x-cast:com.screeninfo.app';



  const debug = document.getElementById('debug');
  const startTime = Date.now();

  function log(message) {
      const time = ((Date.now() - startTime) / 1000).toFixed(1);
      const logMessage = `[${time}s] ${message}`;
     
      debug.innerHTML = logMessage + '<br>' + debug.innerHTML;
  }




  const update = data => {
    //make url always an array
    if (data.url) {
      data.url = [].concat(data.url);
      //this.setUrls(data.url);
    }
    //this.data = Object.assign(this.data, data);
    //this.reflow();
  };

  const setupCast = () => {
    const context = cast.framework.CastReceiverContext.getInstance();

    context.addCustomMessageListener(NAMESPACE, event => {
      update(event.data);

      // send something back
      context.sendCustomMessage(NAMESPACE, event.senderId, {
        requestId: event.data.requestId,
        data: 'data',
        event,
      });
    });

    const options = new cast.framework.CastReceiverOptions();
    options.disableIdleTimeout = true; //no timeout
    context.start(options);
  };

  setupCast();
};

receiver();
*/
