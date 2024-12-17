const NAMESPACE = 'urn:x-cast:com.screeninfo.app';
const debug = document.getElementById('debug');
const startTime = Date.now();

const fi = document.getElementById('fi');

const log = message => {
  const time = ((Date.now() - startTime) / 1000).toFixed(1);
  const logMessage = `[${time}s] ${message}`;

  debug.innerHTML = `${logMessage}<br>${debug.innerHTML}`;
};

log('receiver init');

class IframeScaler {
  constructor(config = {}) {
    this.config = {
      targetWidth: config.targetWidth || 2394, // Target content width
      targetHeight: config.targetHeight || 1241, // Target content height
      overscan: config.overscan || [0, 0, 0, 0], // [top, right, bottom, left]
      rotation: config.rotation || 0,
    };

    this.initialize();
  }

  initialize() {
    // Add required styles
    const style = document.createElement('style');
    style.textContent = `
            .scaled-frame-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform-origin: center center;
            }
            .scaled-frame {
                border: none;
                transform-origin: 0 0;
                position: absolute;
                top: 0;
                left: 0;
            }
        `;
    document.head.appendChild(style);

    // Create container and iframe
    this.container = document.createElement('div');
    this.container.className = 'scaled-frame-container';

    this.iframe = document.createElement('iframe');
    this.iframe.className = 'scaled-frame';

    this.container.appendChild(this.iframe);
    document.body.appendChild(this.container);

    // Handle window resize
    window.addEventListener('resize', () => this.updateScaling());

    // Initial scaling
    this.updateScaling();
  }

  getViewportDimensions() {
    const { overscan } = this.config;
    return {
      width: document.body.clientWidth - overscan[1] - overscan[3],
      height: document.body.clientHeight - overscan[0] - overscan[2],
    };
  }

  updateScaling() {
    const viewport = this.getViewportDimensions();
    const target = {
      width: this.config.targetWidth,
      height: this.config.targetHeight,
    };

    // Set iframe to target size
    this.iframe.style.width = `${target.width}px`;
    this.iframe.style.height = `${target.height}px`;

    // Calculate scale to fit viewport while maintaining aspect ratio
    const scaleX = viewport.width / target.width;
    const scaleY = viewport.height / target.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate scaled dimensions
    const scaledWidth = target.width * scale;
    const scaledHeight = target.height * scale;

    // Center the container
    this.container.style.width = `${scaledWidth}px`;
    this.container.style.height = `${scaledHeight}px`;
    this.container.style.marginLeft = `${-scaledWidth / 2}px`;
    this.container.style.marginTop = `${-scaledHeight / 2}px`;

    // Apply scale transform to iframe
    const isRotated = this.config.rotation % 180 === 90;
    if (isRotated) {
      // Adjust for rotation
      const rotatedScale = Math.min(viewport.height / target.width, viewport.width / target.height);
      this.iframe.style.transform = `
                rotate(${this.config.rotation}deg) 
                scale(${rotatedScale})
            `;
    } else {
      this.iframe.style.transform = `scale(${scale})`;
    }

    // Apply overscan compensation
    const [top, right, bottom, left] = this.config.overscan;
    document.body.style.margin = `${top}px ${right}px ${bottom}px ${left}px`;
  }

  setUrl(url) {
    // Verify and clean the URL
    try {
      // Create URL object to validate and normalize the URL
      const urlObj = new URL(url);

      // Ensure we preserve the hash part of the URL
      const finalUrl = urlObj.origin + urlObj.pathname + urlObj.search + urlObj.hash;

      log('Original URL:', url);
      log('Processed URL:', finalUrl);

      // Set sandbox attribute to allow necessary features
      this.iframe.setAttribute(
        'sandbox',
        'allow-same-origin allow-scripts allow-popups allow-forms'
      );

      // Add other necessary attributes
      this.iframe.setAttribute('allow', 'fullscreen');

      // Set the source
      this.iframe.src = finalUrl;

      // Add load event listener to debug loading issues
      this.iframe.onload = () => {
        log('iframe loaded successfully');
        // document.getElementById('debug').style.display = 'none';
      };

      this.iframe.onerror = error => {
        error('iframe loading error:', error);
      };
    } catch (error) {
      error('URL parsing error:', error);
      // Fallback to direct assignment if URL parsing fails
      this.iframe.src = url;
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.updateScaling();
  }
}

class IframeSlideshow {
  constructor(urls, config = {}) {
    this.urls = urls;
    this.currentIndex = 0;
    this.scalers = [];
    this.transitionTime = config.transitionTime || 10000;

    this.scalerConfig = {
      targetWidth: config.targetWidth || 2394,
      targetHeight: config.targetHeight || 1241,
      overscan: config.overscan || [0, 0, 0, 0],
      rotation: config.rotation || 0,
    };

    this.initialize();
  }

  initialize() {
    // Add required styles for slideshow
    const style = document.createElement('style');
    style.textContent = `
            .slideshow-wrapper {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            .slide-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                pointer-events: none;
                transition: opacity 1s ease-in-out;
                z-index: 1;
            }
            .slide-container.active {
                opacity: 1;
                pointer-events: auto;
                z-index: 2;
            }
            .scaled-frame-container {
                z-index: inherit;
            }
        `;
    document.head.appendChild(style);

    // Create main wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'slideshow-wrapper';
    document.body.appendChild(this.wrapper);

    // Initialize a scaler for each URL
    this.urls.forEach((url, index) => {
      // Create slide container
      const slideContainer = document.createElement('div');
      slideContainer.className = 'slide-container';
      if (index === 0) slideContainer.classList.add('active');
      this.wrapper.appendChild(slideContainer);

      // Create new scaler instance
      const scaler = new IframeScaler({
        ...this.scalerConfig,
      });

      // Move scaler's container into our slide container
      slideContainer.appendChild(scaler.container);

      // Set the URL
      scaler.setUrl(url);

      // Store the references
      this.scalers.push({
        scaler,
        container: slideContainer,
      });
    });

    // Start the slideshow
    this.startSlideshow();

    // Handle window resize for all scalers
    window.addEventListener('resize', () => {
      this.scalers.forEach(({ scaler }) => scaler.updateScaling());
    });
  }

  showSlide(index) {
    // Remove active class from all slides
    this.scalers.forEach(({ container }) => {
      container.classList.remove('active');
    });

    // Add active class to current slide
    this.scalers[index].container.classList.add('active');

    // Update scaling for current slide
    this.scalers[index].scaler.updateScaling();
  }

  nextSlide() {
    log('Next slide');
    this.currentIndex = (this.currentIndex + 1) % this.urls.length;
    this.showSlide(this.currentIndex);
  }

  startSlideshow() {
    log('Starting slideshow');
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => this.nextSlide(), this.transitionTime);
  }

  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  resume() {
    if (!this.interval) {
      this.startSlideshow();
    }
  }

  updateConfig(newConfig) {
    this.scalerConfig = { ...this.scalerConfig, ...newConfig };
    this.scalers.forEach(({ scaler }) => {
      scaler.updateConfig(this.scalerConfig);
    });
  }
}

const addiframes = urls => {
  console.log(`${urls}from sender`);

  //const iframewrapper = document.getElementById('iframewrapper');

  // urls.forEach((urlItem, index) => {
  log(urls);
  // Set the URL of your content
  //scaler.setUrl(urlItem);

  const slideshow = new IframeSlideshow(urls, {
    targetWidth: 2500,
    targetHeight: 1400,
    transitionTime: 30000, // 10 seconds
    overscan: [0, 0, 0, 0],
    rotation: 0,
  });

  log('Slideshow created', slideshow);

  // });
};

const update = data => {
  log('receiver', data);
  //make url always an array
  if (data.url) {
    data.url = [].concat(data.url);
    addiframes(data.url);
  }
};

const getShit = () => ({
  s: 'fart',
  h: 'crap',
  i: 'poop',
  t: 'shit',
});

class DummyMediaManager {
  constructor() {
    this.playerManager = null;
    this.heartbeatInterval = null;
    this.isActive = false;
  }

  initialize(playerManager) {
    this.playerManager = playerManager;
    // Listen for session state changes
    this.playerManager.addEventListener(cast.framework.events.EventType.PLAYER_LOAD_COMPLETE, () =>
      this.onMediaLoaded()
    );
    this.playerManager.addEventListener(cast.framework.events.EventType.ERROR, event =>
      this.onError(event)
    );
  }

  startDummySession() {
    if (this.isActive) {
      console.log('Dummy session already active');
      return;
    }

    const dummyMedia = {
      // Using a 1-second silent MP3 file
      contentId:
        'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMz//MUZAYAAAGkAAAAAAAAA0gAAAAAOTk5//MUZAkAAAGkAAAAAAAAA0gAAAAALi4u//MUZAwAAAGkAAAAAAAAA0gAAAAAERER//MUZAAAAAGkAAAAAAAAA0gAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAAAAA',
      contentType: 'audio/mp3',
      streamType: cast.framework.messages.StreamType.BUFFERED,
      metadata: {
        type: cast.framework.messages.MetadataType.GENERIC,
        title: 'Keep Alive Session',
      },
      duration: 1, // 1 second duration
    };

    const request = new cast.framework.messages.LoadRequestData();
    request.media = dummyMedia;
    request.autoplay = true;

    console.log('Starting dummy media session');
    this.playerManager
      .load(request)
      .then(() => {
        console.log('Dummy media session started successfully');
        this.isActive = true;
        this.startHeartbeat();
      })
      .catch(error => {
        console.error('Failed to start dummy media session:', error);
        this.isActive = false;
      });
  }

  onMediaLoaded() {
    console.log('Media loaded successfully');
    // Ensure autoplay works
    this.playerManager.play();
  }

  onError(event) {
    console.error('Media error:', event);
    this.isActive = false;
    // Try to restart the session after a brief delay
    setTimeout(() => this.startDummySession(), 5000);
  }

  startHeartbeat() {
    // Clear any existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Restart the dummy session every 50 seconds to prevent timeout
    this.heartbeatInterval = setInterval(() => {
      if (this.isActive) {
        this.startDummySession();
      }
    }, 50000);
  }

  stop() {
    this.isActive = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.playerManager) {
      this.playerManager.stop();
    }
  }
}

const setupCast = () => {
  log('setupCast');
  const context = cast.framework.CastReceiverContext.getInstance();

  const playerManager = context.getPlayerManager();

  const dummyManager = new DummyMediaManager();
  dummyManager.initialize(playerManager);
  // Start the dummy session when needed
  dummyManager.startDummySession();

  context.setApplicationState('Starting...');
  log('setApplicationState');
  const options = new cast.framework.CastReceiverOptions();
  options.disableIdleTimeout = true; // Prevent idle timeout
  options.maxInactivity = 28800;
  log('disableIdleTimeout');

  context.addCustomMessageListener(NAMESPACE, event => {
    update(event.data);

    // Check if it's a ping message
    if (event.data.type === 'ping') {
      log('Received ping, sending pong');
      context.sendCustomMessage(NAMESPACE, event.senderId, {
        type: 'pong',
        timestamp: Date.now(),
      });

      if (fi.style.display === 'none') {
        fi.style.display = 'block';
      } else {
        fi.style.display = 'none';
      }

      return; // Exit early for ping messages
    }
    if (event.data.type === 'heartbeat') {
      console.log('Heartbeat message received:', event.data.message);

      // Respond to the heartbeat to acknowledge
      context.sendCustomMessage(NAMESPACE, event.senderId, { type: 'heartbeat', message: 'pong' });
    }

    // send something back
    context.sendCustomMessage(NAMESPACE, event.senderId, {
      requestId: event.data.requestId,
      data: 'somedata',
      event,
      vp: getShit(),
    });
  });

  context.start(options);
};

setupCast();
