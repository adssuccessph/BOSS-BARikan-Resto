window.BARIKAN_CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbw4_c3tu5QRjcYO98iRltyMPteT1hX7PNbEjNw7dui_2Oka4-ZoF6FCP847KbsSZbyB-Q/exec',
  ADMIN_AUTO_REFRESH_MINUTES: 15,
  LOCAL_PREVIEW_MODE: window.location.protocol === 'file:' || new URLSearchParams(window.location.search).get('preview') === '1'
});
