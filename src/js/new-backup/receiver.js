const receiver = () => {
  const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
  const debug = document.getElementById('debug');
  const startTime = Date.now();

  const log = message => {
    const time = ((Date.now() - startTime) / 1000).toFixed(1);
    const logMessage = `[${time}s] ${message}`;

    debug.innerHTML = `${logMessage}<br>${debug.innerHTML}`;
  };
  log('receiver init');
  // Initialize when the page loads
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
    log('setupCast');
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
