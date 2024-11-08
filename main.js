import './src/css/style.css';
import { ChromecastManager } from './src/js/ChromecastManager';
import uiClicks from './src/js/uiclicks';

const chromecast = new ChromecastManager();

// Initialize and get cleanup function
chromecast.initialize();
/*
// Subscribe to state changes
const unsubscribeStatus = chromecast.subscribe('status', (status) => {
  console.log('Status changed:', status);
});

const unsubscribeConnected = chromecast.subscribe('isConnected', (isConnected) => {
  console.log('Connection status:', isConnected);
});*/

uiClicks();
