(() => {
  'use strict';

  const CONFIG = window.BARIKAN_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

  const FALLBACK = {
    settings: {
      siteName: 'BARikan Event Booking',
      heroBadge: 'VENUE • CATERING • RESTO',
      heroTitle: 'Plan Your Event in One Place',
      heroSubtitle: 'From celebrations and catering to after-event chill — we have you covered.',
      venuePackageText: 'Featured venue package from ₱7,999 fully consumable',
      phone: '0917 588 2281',
      email: 'bossbarikanresto@gmail.com',
      address: 'PAJ Building, 35 M. Almeda Street, San Roque, Pateros, 1620',
      bookingNotice: 'Your inquiry is not yet a confirmed booking. Our team will check the date and contact you.',
      chatUrl: '',
      chatLabel: 'Chat with us',
      mainLogoUrl: '', venueLogoUrl: '', cateringLogoUrl: '', restoLogoUrl: ''
    },
    services: [
      {'Service ID':'SVC-VENUE-001','Business':'BARikan Events Venue','Service Name':'Venue Package','Price':'₱7,999','Short Description':'Fully consumable. Good for 4 hours, up to 80 pax, fully air-conditioned, sound system & lights, tables & chairs, unlimited videoke and waiter service.','Image URL':'assets/venue-red-event.jpg','Active':'TRUE','Sort Order':'1'},
      {'Service ID':'SVC-CATER-001','Business':"You're my BOSS Food and Catering Services",'Service Name':'Event Catering','Price':'Ask for package rate','Short Description':'Food and catering service for birthdays, reunions, company gatherings and private celebrations.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'2'},
      {'Service ID':'SVC-RESTO-001','Business':'BOSS BARikan & Resto','Service Name':'After-Event Chill & Live Band','Price':'','Short Description':'Eat, drink, relax and jam with live band entertainment after your event.','Image URL':'assets/boss-barikan-resto-logo.png','Active':'TRUE','Sort Order':'3'}
    ],
    gallery: [
      {'Gallery ID':'LOCAL-1','Title':'Birthday Event Setup','Category':'Venue','Image URL':'assets/venue-red-event.jpg','Active':'TRUE','Sort Order':'1'},
      {'Gallery ID':'LOCAL-2','Title':'Catering Buffet Setup','Category':'Catering','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'2'},
      {'Gallery ID':'LOCAL-3','Title':'18th Birthday Stage','Category':'Birthday','Image URL':'assets/event-stage.jpg','Active':'TRUE','Sort Order':'3'},
      {'Gallery ID':'LOCAL-4','Title':'Green Event Setup','Category':'Event','Image URL':'assets/green-event-setup.jpg','Active':'TRUE','Sort Order':'4'}
    ],
    menuCategories: [
      {'Category ID':'CAT-MAIN','Category Name':'Main Dish','Max Selections':'2','Active':'TRUE','Sort Order':'1'},
      {'Category ID':'CAT-NOODLES','Category Name':'Noodles / Pasta','Max Selections':'1','Active':'TRUE','Sort Order':'2'},
      {'Category ID':'CAT-DESSERT','Category Name':'Dessert','Max Selections':'1','Active':'TRUE','Sort Order':'3'}
    ],
    menuItems: [
      {'Menu Item ID':'MENU-DEMO-1','Category ID':'CAT-MAIN','Item Name':'Sample Chicken Dish','Price / Add-on':'','Description':'Preview item — replace this from Admin.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'1'},
      {'Menu Item ID':'MENU-DEMO-2','Category ID':'CAT-MAIN','Item Name':'Sample Beef Dish','Price / Add-on':'','Description':'Preview item — replace this from Admin.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'2'},
      {'Menu Item ID':'MENU-DEMO-3','Category ID':'CAT-MAIN','Item Name':'Sample Pork Dish','Price / Add-on':'','Description':'Preview item — replace this from Admin.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'3'},
      {'Menu Item ID':'MENU-DEMO-4','Category ID':'CAT-NOODLES','Item Name':'Sample Noodles Option','Price / Add-on':'','Description':'Preview item — replace this from Admin.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'1'},
      {'Menu Item ID':'MENU-DEMO-5','Category ID':'CAT-NOODLES','Item Name':'Sample Pasta Option','Price / Add-on':'','Description':'Preview item — replace this from Admin.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'2'},
      {'Menu Item ID':'MENU-DEMO-6','Category ID':'CAT-DESSERT','Item Name':'Sample Dessert A','Price / Add-on':'','Description':'Preview item — replace this from Admin.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'1'},
      {'Menu Item ID':'MENU-DEMO-7','Category ID':'CAT-DESSERT','Item Name':'Sample Dessert B','Price / Add-on':'','Description':'Preview item — replace this from Admin.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'2'}
    ]
  };

  const state = {
    settings: {...FALLBACK.settings},
    services: [...FALLBACK.services],
    gallery: [...FALLBACK.gallery],
    menuCategories: [...FALLBACK.menuCategories],
    menuItems: [...FALLBACK.menuItems],
    liveApi: false,
    selectedServiceIds: new Set(),
    selectedMenuItemIds: new Set(),
    menuWarning: ''
  };

  function jsonp(action, params = {}, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (!CONFIG.API_URL) return reject(new Error('API URL is missing in config.js.'));
      const callbackName = `barikanJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => cleanup(new Error('API request timed out.')), timeoutMs);
      const cleanup = error => {
        clearTimeout(timer);
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        script.remove();
        if (error) reject(error);
      };
      window[callbackName] = data => { cleanup(); resolve(data); };
      script.onerror = () => cleanup(new Error('Unable to connect to the Google Apps Script API.'));
      const query = new URLSearchParams({ action, callback: callbackName, ...params });
      script.src = `${CONFIG.API_URL}?${query.toString()}`;
      document.head.appendChild(script);
    });
  }

  async function pollOperation(operationId, timeoutMs = 20000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const result = await jsonp('getOperationResult', { operationId }, 8000);
      if (result && !result.pending) {
        if (result.ok) return result.result || { ok: true };
        throw new Error(result.error || 'The request failed.');
      }
      await new Promise(resolve => setTimeout(resolve, 700));
    }
    throw new Error('The request was sent but confirmation took too long. Refresh and check the booking sheet.');
  }

  function postAction(action, payload) {
    if (CONFIG.LOCAL_PREVIEW_MODE) {
      return Promise.resolve({ ok: true, bookingId: `BRK-PREVIEW-${String(Date.now()).slice(-6)}`, preview: true });
    }
    const operationId = `OP-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = CONFIG.API_URL;
    form.target = 'barikanPostFrame';
    form.style.display = 'none';
    const fields = { action, operationId, payload: JSON.stringify(payload || {}) };
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = name; input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 1500);
    return pollOperation(operationId);
  }

  function getSetting(key, fallback = '') { return state.settings[key] || fallback; }

  function renderLogo(element, url, fallbackUrl, alt) {
    const src = url || fallbackUrl;
    element.innerHTML = src ? `<img src="${esc(src)}" alt="${esc(alt)}">` : `<strong>${esc(alt)}</strong>`;
  }

  function applySettings() {
    const siteName = getSetting('siteName', FALLBACK.settings.siteName);
    $('#siteName').textContent = siteName;
    $('#footerName').textContent = siteName;
    $('#heroBadge').textContent = getSetting('heroBadge', FALLBACK.settings.heroBadge);
    const heroTitle = getSetting('heroTitle', FALLBACK.settings.heroTitle);
    $('#heroTitle').textContent = heroTitle;
    const phrase = 'in One Place';
    const titleText = $('#heroTitle').textContent;
    if (titleText.toLowerCase().includes(phrase.toLowerCase())) {
      const index = titleText.toLowerCase().indexOf(phrase.toLowerCase());
      $('#heroTitle').innerHTML = `${esc(titleText.slice(0,index))}<span class="hero-title-accent">${esc(titleText.slice(index))}</span>`;
    }
    $('#heroSubtitle').textContent = getSetting('heroSubtitle', FALLBACK.settings.heroSubtitle);
    $('#venuePackageText').textContent = getSetting('venuePackageText', FALLBACK.settings.venuePackageText);
    $('#phoneText').textContent = getSetting('phone', FALLBACK.settings.phone);
    $('#emailText').textContent = getSetting('email', FALLBACK.settings.email);
    $('#addressText').textContent = getSetting('address', FALLBACK.settings.address);
    $('#bookingNotice').textContent = getSetting('bookingNotice', FALLBACK.settings.bookingNotice);

    renderLogo($('#mainLogo'), getSetting('mainLogoUrl'), 'assets/barikan-events-venue-logo.jpg', 'BARikan');
    renderLogo($('#venueLogo'), getSetting('venueLogoUrl'), 'assets/barikan-events-venue-logo.jpg', 'BARikan Events Venue');
    renderLogo($('#cateringLogo'), getSetting('cateringLogoUrl'), 'assets/youre-my-boss-logo.png', "You're my BOSS Food and Catering Services");
    renderLogo($('#restoLogo'), getSetting('restoLogoUrl'), 'assets/boss-barikan-resto-logo.png', 'BOSS BARikan & Resto');

    const heroImage = state.gallery[0]?.['Image URL'] || state.services.find(item => item['Image URL'])?.['Image URL'] || 'assets/venue-red-event.jpg';
    $('#hero').style.setProperty('--hero-image', `url("${String(heroImage).replace(/"/g, '')}")`);

    const chatUrl = getSetting('chatUrl') || getSetting('facebookUrl');
    if (chatUrl) {
      $('#chatFab').classList.remove('hidden');
      $('#chatLink').href = chatUrl;
      $('#chatTitle').textContent = getSetting('chatLabel', 'Chat with us');
    } else {
      $('#chatFab').classList.add('hidden');
      $('#chatPanel').classList.remove('open');
    }
  }

  function getServiceImage(service) {
    if (service['Image URL']) return service['Image URL'];
    const id = String(service['Service ID'] || '');
    const business = String(service['Business'] || '');
    if (/CATER/i.test(id) || /cater/i.test(business)) return 'assets/catering-buffet.jpg';
    if (/RESTO/i.test(id) || /resto/i.test(business)) return 'assets/boss-barikan-resto-logo.png';
    return 'assets/venue-red-event.jpg';
  }

  function serviceIcon(business) {
    if (/cater/i.test(business)) return '🍽️';
    if (/resto/i.test(business)) return '🎤';
    return '🎉';
  }

  function isCateringService(service) {
    return /cater/i.test(String(service?.['Business'] || '')) || /cater/i.test(String(service?.['Service Name'] || ''));
  }

  function isCateringSelected() {
    return state.services.some(service => state.selectedServiceIds.has(service['Service ID']) && isCateringService(service));
  }

  function activeMenuCategories() {
    return state.menuCategories
      .filter(item => String(item['Active'] || 'TRUE').toUpperCase() !== 'FALSE')
      .sort((a, b) => Number(a['Sort Order'] || 0) - Number(b['Sort Order'] || 0));
  }

  function activeMenuItems() {
    return state.menuItems
      .filter(item => String(item['Active'] || 'TRUE').toUpperCase() !== 'FALSE')
      .sort((a, b) => Number(a['Sort Order'] || 0) - Number(b['Sort Order'] || 0));
  }

  function renderCateringMenu() {
    const section = $('#cateringMenuSection');
    const list = $('#menuCategoryList');
    const summary = $('#menuSelectionSummary');
    if (!section || !list || !summary) return;

    if (!isCateringSelected()) {
      state.selectedMenuItemIds.clear();
      state.menuWarning = '';
      section.classList.add('hidden');
      list.innerHTML = '';
      summary.className = 'selection-summary menu-selection-summary';
      summary.innerHTML = '<span class="selection-dot"></span><span>No catering menu selected yet</span>';
      return;
    }

    section.classList.remove('hidden');
    const categories = activeMenuCategories();
    const items = activeMenuItems();

    if (!categories.length) {
      list.innerHTML = '<div class="menu-empty">Catering is selected. Menu categories will appear here after the admin adds them.</div>';
      summary.className = 'selection-summary menu-selection-summary';
      summary.innerHTML = '<span class="selection-dot"></span><span>Menu selection is not available yet. You may still send your inquiry.</span>';
      return;
    }

    list.innerHTML = categories.map(category => {
      const categoryId = category['Category ID'];
      const max = Math.max(1, Number(category['Max Selections'] || 1));
      const categoryItems = items.filter(item => item['Category ID'] === categoryId);
      const selectedCount = categoryItems.filter(item => state.selectedMenuItemIds.has(item['Menu Item ID'])).length;
      const itemHtml = categoryItems.length ? categoryItems.map(item => {
        const selected = state.selectedMenuItemIds.has(item['Menu Item ID']);
        const image = item['Image URL'] || 'assets/catering-buffet.jpg';
        return `
          <button class="menu-choice${selected ? ' selected' : ''}" type="button"
            data-menu-item-id="${esc(item['Menu Item ID'])}" data-category-id="${esc(categoryId)}"
            aria-pressed="${selected ? 'true' : 'false'}">
            <span class="menu-choice-image"><img src="${esc(image)}" alt="${esc(item['Item Name'])}"></span>
            <span class="menu-choice-copy">
              <strong>${esc(item['Item Name'])}</strong>
              ${item['Description'] ? `<small>${esc(item['Description'])}</small>` : ''}
              ${item['Price / Add-on'] ? `<em>${esc(item['Price / Add-on'])}</em>` : ''}
            </span>
            <span class="menu-choice-state">${selected ? '✓' : '+'}</span>
          </button>`;
      }).join('') : '<div class="menu-empty compact">No menu items in this category yet.</div>';

      return `
        <section class="menu-category" data-category-id="${esc(categoryId)}">
          <div class="menu-category-head">
            <div><strong>${esc(category['Category Name'])}</strong><small>Choose up to ${max}</small></div>
            <span class="menu-count${selectedCount >= max ? ' full' : ''}">${selectedCount} / ${max} selected</span>
          </div>
          <div class="menu-choice-grid">${itemHtml}</div>
        </section>`;
    }).join('');

    $$('.menu-choice', list).forEach(button => button.addEventListener('click', () => {
      const itemId = button.dataset.menuItemId;
      const categoryId = button.dataset.categoryId;
      const category = categories.find(row => row['Category ID'] === categoryId);
      const max = Math.max(1, Number(category?.['Max Selections'] || 1));
      const categoryItemIds = items.filter(item => item['Category ID'] === categoryId).map(item => item['Menu Item ID']);
      const selectedInCategory = categoryItemIds.filter(id => state.selectedMenuItemIds.has(id));

      if (state.selectedMenuItemIds.has(itemId)) {
        state.selectedMenuItemIds.delete(itemId);
        state.menuWarning = '';
      } else if (selectedInCategory.length >= max) {
        state.menuWarning = `${category?.['Category Name'] || 'This category'} allows a maximum of ${max} selection${max > 1 ? 's' : ''}. Remove one choice before adding another.`;
      } else {
        state.selectedMenuItemIds.add(itemId);
        state.menuWarning = '';
      }
      renderCateringMenu();
    }));

    const selectedItems = items.filter(item => state.selectedMenuItemIds.has(item['Menu Item ID']));
    if (state.menuWarning) {
      summary.className = 'selection-summary menu-selection-summary menu-warning';
      summary.innerHTML = `<span class="selection-dot"></span><span>${esc(state.menuWarning)}</span>`;
    } else if (selectedItems.length) {
      summary.className = 'selection-summary menu-selection-summary has-selection';
      summary.innerHTML = `<span class="selection-dot"></span><span><strong>${selectedItems.length} menu item${selectedItems.length > 1 ? 's' : ''} selected:</strong> ${selectedItems.map(item => esc(item['Item Name'])).join(' • ')}</span>`;
    } else {
      summary.className = 'selection-summary menu-selection-summary';
      summary.innerHTML = '<span class="selection-dot"></span><span>You may choose menu items now or send the inquiry and finalize the menu with the team later.</span>';
    }
  }

  function renderServices() {
    const active = state.services.filter(item => String(item['Active'] || 'TRUE').toUpperCase() !== 'FALSE');
    $('#servicesGrid').innerHTML = active.map(service => `
      <article class="service-card">
        <div class="service-image">${getServiceImage(service) ? `<img src="${esc(getServiceImage(service))}" alt="${esc(service['Service Name'])}">` : `<div class="placeholder">${serviceIcon(service['Business'])}</div>`}</div>
        <div class="service-body">
          <div class="service-business">${esc(service['Business'])}</div>
          <h3>${esc(service['Service Name'])}</h3>
          ${service['Price'] ? `<div class="service-price">${esc(service['Price'])}</div>` : ''}
          <p>${esc(service['Short Description'])}</p>
          <button class="btn btn-ghost add-service" type="button" data-service-id="${esc(service['Service ID'])}">Add to inquiry</button>
        </div>
      </article>`).join('');

    const choices = $('#serviceChoices');
    choices.innerHTML = active.map(service => {
      const id = service['Service ID'];
      const selected = state.selectedServiceIds.has(id);
      return `
        <button class="service-choice${selected ? ' selected' : ''}" type="button" data-service-id="${esc(id)}" aria-pressed="${selected ? 'true' : 'false'}">
          <span class="choice-icon">${serviceIcon(service['Business'])}</span>
          <span class="choice-copy">
            <small>${esc(service['Business'])}</small>
            <strong>${esc(service['Service Name'])}</strong>
            ${service['Price'] ? `<em>${esc(service['Price'])}</em>` : ''}
          </span>
          <span class="choice-state" aria-hidden="true">${selected ? '✓' : '+'}</span>
        </button>`;
    }).join('');

    const updateSelectionSummary = serviceList => {
      const selected = serviceList.filter(service => state.selectedServiceIds.has(service['Service ID']));
      const summary = $('#selectionSummary');
      summary.classList.toggle('has-selection', selected.length > 0);
      summary.innerHTML = selected.length
        ? `<span class="selection-dot"></span><span><strong>${selected.length} service${selected.length > 1 ? 's' : ''} selected:</strong> ${selected.map(service => esc(service['Service Name'])).join(' • ')}</span>`
        : '<span class="selection-dot"></span><span>Select at least one service</span>';
    };

    const refreshChoiceStates = () => {
      active.forEach(service => {
        const button = $(`.service-choice[data-service-id="${CSS.escape(service['Service ID'])}"]`);
        if (!button) return;
        const selected = state.selectedServiceIds.has(service['Service ID']);
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        const stateIcon = $('.choice-state', button);
        if (stateIcon) stateIcon.textContent = selected ? '✓' : '+';
      });
      updateSelectionSummary(active);
      renderCateringMenu();
    };

    $$('.service-choice').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.serviceId;
      if (state.selectedServiceIds.has(id)) state.selectedServiceIds.delete(id);
      else state.selectedServiceIds.add(id);
      refreshChoiceStates();
    }));

    $$('.add-service').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.serviceId;
      state.selectedServiceIds.add(id);
      refreshChoiceStates();
      $('#book').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        const choice = $(`.service-choice[data-service-id="${CSS.escape(id)}"]`);
        if (choice) choice.focus({ preventScroll: true });
      }, 450);
    }));

    refreshChoiceStates();
  }

  function renderGallery() {
    const active = state.gallery.filter(item => String(item['Active'] || 'TRUE').toUpperCase() !== 'FALSE');
    $('#galleryGrid').innerHTML = active.map(item => `
      <figure class="gallery-item">
        <img loading="lazy" src="${esc(item['Image URL'])}" alt="${esc(item['Title'] || 'BARikan event photo')}">
        ${(item['Title'] || item['Category']) ? `<figcaption class="gallery-caption">${esc(item['Title'] || item['Category'])}</figcaption>` : ''}
      </figure>`).join('');
  }

  function setFormStatus(message, type = 'success') {
    const box = $('#formStatus');
    box.textContent = message;
    box.className = `status-box show ${type}`;
  }

  async function loadPublicData() {
    if (CONFIG.LOCAL_PREVIEW_MODE) {
      $('#previewBanner').classList.add('show');
      applySettings(); renderServices(); renderGallery(); renderCateringMenu();
      return;
    }
    try {
      const response = await jsonp('getPublicData');
      if (!response || !response.ok) throw new Error(response?.error || 'Invalid API response.');
      state.liveApi = true;
      state.settings = { ...FALLBACK.settings, ...(response.settings || {}) };
      state.services = response.services?.length ? response.services : FALLBACK.services;
      state.gallery = response.gallery?.length ? response.gallery : FALLBACK.gallery;
      state.menuCategories = Array.isArray(response.menuCategories) ? response.menuCategories : [];
      state.menuItems = Array.isArray(response.menuItems) ? response.menuItems : [];
    } catch (error) {
      console.warn('Using local fallback content:', error);
      state.liveApi = false;
    }
    applySettings(); renderServices(); renderGallery(); renderCateringMenu();
  }

  $('#bookingForm').addEventListener('submit', async event => {
    event.preventDefault();
    const selectedServices = state.services.filter(item => state.selectedServiceIds.has(item['Service ID']));
    const selected = selectedServices.map(item => item['Service Name']);
    if (!selected.length) {
      setFormStatus('Please choose at least one service card before sending your inquiry.', 'error');
      $('#serviceChoices').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const selectedMenuItems = activeMenuItems().filter(item => state.selectedMenuItemIds.has(item['Menu Item ID']));
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(location.search);
    const payload = {
      fullName: form.get('fullName'), mobile: form.get('mobile'), email: form.get('email'),
      eventType: form.get('eventType'), eventDate: form.get('eventDate'), eventTime: form.get('eventTime'),
      guestCount: form.get('guestCount'),
      services: selected.join(', '),
      serviceIds: selectedServices.map(item => item['Service ID']).join(','),
      menuItemIds: selectedMenuItems.map(item => item['Menu Item ID']).join(','),
      notes: form.get('notes'), consent: 'Yes',
      source: 'Website', utmSource: params.get('utm_source') || '', utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '', utmContent: params.get('utm_content') || '',
      pageUrl: location.href, submittedAtClient: new Date().toISOString()
    };

    const button = $('#submitBtn');
    button.disabled = true; button.innerHTML = '<span>Sending inquiry...</span><b>…</b>';
    setFormStatus(CONFIG.LOCAL_PREVIEW_MODE ? 'Previewing the success flow...' : 'Submitting your event inquiry...', 'success');
    try {
      const result = await postAction('submitBooking', payload);
      event.currentTarget.reset();
      state.selectedServiceIds.clear();
      state.selectedMenuItemIds.clear();
      state.menuWarning = '';
      renderServices();
      renderCateringMenu();
      $('#bookingIdText').textContent = result.bookingId || 'Inquiry Sent';
      $('#successMessage').textContent = result.preview ? 'Local preview only. Deploy the updated Code.gs for live Google Sheet submissions.' : 'Thank you. Our team will check your preferred date and contact you.';
      $('#successModal').classList.add('open');
      setFormStatus(result.preview ? 'Preview complete. No Google Sheet row was created.' : 'Inquiry submitted successfully.', 'success');
    } catch (error) {
      setFormStatus(error.message || 'Unable to submit. Please try again.', 'error');
    } finally {
      button.disabled = false; button.innerHTML = '<span>Send Event Inquiry</span><b>→</b>';
    }
  });

  $('#chatFab').addEventListener('click', () => $('#chatPanel').classList.toggle('open'));
  $('#closeModal').addEventListener('click', () => $('#successModal').classList.remove('open'));
  $('#successModal').addEventListener('click', event => { if (event.target.id === 'successModal') event.currentTarget.classList.remove('open'); });

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $('#eventDate').min = today.toISOString().slice(0, 10);
  loadPublicData();
})();
