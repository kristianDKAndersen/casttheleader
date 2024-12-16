const receiver = () => {
  const NAMESPACE = 'urn:x-cast:com.screeninfo.app';

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
