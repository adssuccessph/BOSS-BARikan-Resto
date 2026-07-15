(() => {
  'use strict';

  const CONFIG = window.BARIKAN_CONFIG || {};
  const PREVIEW = Boolean(CONFIG.LOCAL_PREVIEW_MODE);
  const AUTO_REFRESH_MS = Math.max(1, Number(CONFIG.ADMIN_AUTO_REFRESH_MINUTES || 15)) * 60 * 1000;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

  const DEMO_DATA = {
    ok: true,
    stats: { total: 4, newInquiry: 2, pending: 1, confirmed: 1 },
    statuses: ['New Inquiry','Contacted','Pending','Confirmed','Cancelled'],
    bookings: [
      {'Booking ID':'BRK-20260714-004','Date Submitted':'2026-07-14 8:52 PM','Customer Name':'Maria Santos','Mobile':'0917 123 4567','Email':'maria@example.com','Event Type':'Birthday','Event Date':'2026-08-18','Preferred Time':'18:00','Guests':'60','Services Needed':'Venue Package, Event Catering','Catering Menu Selections':'Main Dish: Sample Chicken Dish, Sample Beef Dish | Dessert: Sample Dessert A','Notes':'18th birthday celebration','UTM Content':'creative_3','Source':'Website','Booking Status':'New Inquiry','Admin Notes':''},
      {'Booking ID':'BRK-20260714-003','Date Submitted':'2026-07-14 7:34 PM','Customer Name':'John Reyes','Mobile':'0918 555 2288','Email':'john@example.com','Event Type':'Company Event','Event Date':'2026-08-29','Preferred Time':'17:30','Guests':'75','Services Needed':'Venue Package, Event Catering, After-Event Chill & Live Band','Catering Menu Selections':'Main Dish: Sample Pork Dish | Noodles / Pasta: Sample Noodles Option','Notes':'Company gathering','UTM Content':'creative_1','Source':'Website','Booking Status':'New Inquiry','Admin Notes':'Call tomorrow morning'},
      {'Booking ID':'BRK-20260713-002','Date Submitted':'2026-07-13 5:10 PM','Customer Name':'Anne Cruz','Mobile':'0998 321 5566','Email':'','Event Type':'Reunion','Event Date':'2026-09-05','Preferred Time':'18:00','Guests':'45','Services Needed':'Venue Package','Catering Menu Selections':'','Notes':'Family reunion','UTM Content':'creative_2','Source':'Website','Booking Status':'Pending','Admin Notes':'Waiting for final pax'},
      {'Booking ID':'BRK-20260712-001','Date Submitted':'2026-07-12 2:15 PM','Customer Name':'Carlo Mendoza','Mobile':'0916 222 7700','Email':'carlo@example.com','Event Type':'Birthday','Event Date':'2026-07-30','Preferred Time':'19:00','Guests':'50','Services Needed':'Venue Package, Event Catering','Catering Menu Selections':'Dessert: Sample Dessert B','Notes':'Birthday dinner','UTM Content':'creative_3','Source':'Website','Booking Status':'Confirmed','Admin Notes':'Deposit confirmed'}
    ],
    services: [
      {'Service ID':'SVC-VENUE-001','Business':'BARikan Events Venue','Service Name':'Venue Package','Price':'₱7,999','Short Description':'Fully consumable. Good for 4 hours, up to 80 pax, fully air-conditioned, sound system & lights, tables & chairs, unlimited videoke and waiter service.','Image URL':'assets/venue-red-event.jpg','Active':'TRUE','Sort Order':'1'},
      {'Service ID':'SVC-CATER-001','Business':"You're my BOSS Food and Catering Services",'Service Name':'Event Catering','Price':'Ask for package rate','Short Description':'Food and catering service for birthdays, reunions, company gatherings and private celebrations.','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'2'},
      {'Service ID':'SVC-RESTO-001','Business':'BOSS BARikan & Resto','Service Name':'After-Event Chill & Live Band','Price':'','Short Description':'Eat, drink, relax and jam with live band entertainment after your event.','Image URL':'assets/boss-barikan-resto-logo.png','Active':'TRUE','Sort Order':'3'}
    ],
    gallery: [
      {'Gallery ID':'GAL-DEMO-1','Title':'Birthday Event Setup','Category':'Venue','Image URL':'assets/venue-red-event.jpg','Active':'TRUE','Sort Order':'1'},
      {'Gallery ID':'GAL-DEMO-2','Title':'Catering Buffet Setup','Category':'Catering','Image URL':'assets/catering-buffet.jpg','Active':'TRUE','Sort Order':'2'},
      {'Gallery ID':'GAL-DEMO-3','Title':'18th Birthday Stage','Category':'Birthday','Image URL':'assets/event-stage.jpg','Active':'TRUE','Sort Order':'3'},
      {'Gallery ID':'GAL-DEMO-4','Title':'Green Event Setup','Category':'Event','Image URL':'assets/green-event-setup.jpg','Active':'TRUE','Sort Order':'4'}
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
    ],
    settings: {
      siteName:'BARikan Event Booking', heroBadge:'VENUE • CATERING • RESTO', heroTitle:'Plan Your Event in One Place',
      heroSubtitle:'From celebrations and catering to after-event chill — we have you covered.', venuePackageText:'Featured venue package from ₱7,999 fully consumable',
      phone:'0917 588 2281', email:'bossbarikanresto@gmail.com', address:'PAJ Building, 35 M. Almeda Street, San Roque, Pateros, 1620',
      chatUrl:'', chatLabel:'Chat with us', facebookUrl:'', bookingNotice:'Your inquiry is not yet a confirmed booking. Our team will check the date and contact you.',
      mainLogoUrl:'assets/barikan-events-venue-logo.jpg', venueLogoUrl:'assets/barikan-events-venue-logo.jpg', cateringLogoUrl:'assets/youre-my-boss-logo.png', restoLogoUrl:'assets/boss-barikan-resto-logo.png'
    }
  };

  const state = {
    token: PREVIEW ? 'LOCAL_PREVIEW' : (sessionStorage.getItem('barikanAdminToken') || ''),
    data: null,
    nextRefreshAt: 0,
    refreshTimer: null,
    countdownTimer: null
  };


  async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value || ''));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function jsonp(action, params = {}, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      if (!CONFIG.API_URL) return reject(new Error('API URL is missing in config.js.'));
      const callbackName = `barikanAdminJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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

  async function pollOperation(operationId, timeoutMs = 30000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const result = await jsonp('getOperationResult', { operationId, token: state.token }, 9000);
      if (result && !result.pending) {
        if (result.ok) return result.result || { ok: true };
        throw new Error(result.error || 'The admin action failed.');
      }
      await new Promise(resolve => setTimeout(resolve, 700));
    }
    throw new Error('The action was sent but confirmation took too long. Click Refresh Now to check the latest data.');
  }

  function postAction(action, payload = {}, fileData = null) {
    if (PREVIEW) return Promise.resolve({ ok: true, preview: true });
    const operationId = `OP-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = CONFIG.API_URL;
    form.target = 'barikanAdminPostFrame';
    form.style.display = 'none';
    const fields = {
      action, operationId, token: state.token,
      payload: JSON.stringify(payload || {}),
      fileData: fileData ? JSON.stringify(fileData) : ''
    };
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = name; input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 1800);
    return pollOperation(operationId);
  }

  function toast(message, error = false) {
    const element = $('#toast');
    element.textContent = message;
    element.className = `toast show${error ? ' error' : ''}`;
    clearTimeout(element._timer);
    element._timer = setTimeout(() => element.className = 'toast', 3500);
  }

  function loginStatus(message, type = 'error') {
    const element = $('#loginStatus');
    element.textContent = message;
    element.className = `status-box show ${type}`;
  }

  function setLoading(show, text = 'Processing...') {
    $('#loadingText').textContent = text;
    $('#loadingOverlay').classList.toggle('show', show);
  }

  function setApiStatus(online, label) {
    $('#apiDot').classList.toggle('online', online);
    $('#apiDot').classList.toggle('offline', !online);
    $('#apiStatus').textContent = label;
  }

  function handleError(error) {
    const message = error?.message || String(error);
    if (/session expired|invalid admin session/i.test(message)) {
      state.token = '';
      sessionStorage.removeItem('barikanAdminToken');
      $('#adminShell').classList.add('hidden');
      $('#loginScreen').classList.remove('hidden');
      loginStatus('Session expired. Please log in again.', 'error');
    } else {
      toast(message, true);
    }
  }

  function showAdmin() {
    $('#loginScreen').classList.add('hidden');
    $('#adminShell').classList.remove('hidden');
  }

  async function compressImage(file) {
    if (!file) return null;
    if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
    if (file.size > 12 * 1024 * 1024) throw new Error('Image is too large. Maximum original file size is 12 MB.');

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read the image.'));
      reader.readAsDataURL(file);
    });

    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to open the image.'));
      img.src = dataUrl;
    });

    const maxWidth = 1600;
    const scale = Math.min(1, maxWidth / image.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const output = canvas.toDataURL('image/jpeg', 0.82);
    return { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', dataUrl: output };
  }

  async function refreshData(showToast = false) {
    try {
      if (PREVIEW) {
        state.data = typeof structuredClone === 'function' ? structuredClone(DEMO_DATA) : JSON.parse(JSON.stringify(DEMO_DATA));
        showAdmin();
        $('#previewBanner').classList.add('show');
        $('#adminPreviewNote').classList.add('show');
        setApiStatus(false, 'Local preview');
      } else {
        const response = await jsonp('getAdminDashboard', { token: state.token });
        if (!response || !response.ok) throw new Error(response?.error || 'Unable to load admin data.');
        state.data = response;
        showAdmin();
        setApiStatus(true, 'Google Sheet live');
      }
      renderAll();
      scheduleRefresh();
      if (showToast) toast(PREVIEW ? 'Preview data refreshed.' : 'Admin data refreshed.');
    } catch (error) {
      setApiStatus(false, 'API unavailable');
      handleError(error);
    }
  }

  function scheduleRefresh() {
    clearTimeout(state.refreshTimer);
    clearInterval(state.countdownTimer);
    state.nextRefreshAt = Date.now() + AUTO_REFRESH_MS;
    state.refreshTimer = setTimeout(() => refreshData(false), AUTO_REFRESH_MS);
    updateCountdown();
    state.countdownTimer = setInterval(updateCountdown, 1000);
  }

  function updateCountdown() {
    const remaining = Math.max(0, state.nextRefreshAt - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    $('#refreshCountdown').textContent = `${minutes}:${seconds}`;
  }

  function renderAll() {
    const data = state.data;
    $('#statTotal').textContent = data.stats.total;
    $('#statNew').textContent = data.stats.newInquiry;
    $('#statPending').textContent = data.stats.pending;
    $('#statConfirmed').textContent = data.stats.confirmed;
    renderBookings(); renderServices(); renderMenu(); renderGallery(); renderSettings();
  }

  function renderBookings() {
    const query = ($('#bookingSearch').value || '').toLowerCase().trim();
    const rows = (state.data.bookings || []).filter(booking => !query || [
      booking['Booking ID'], booking['Customer Name'], booking['Mobile'], booking['Email'], booking['Event Type']
    ].join(' ').toLowerCase().includes(query));

    $('#bookingRows').innerHTML = rows.length ? rows.map(booking => `
      <tr data-booking-id="${esc(booking['Booking ID'])}">
        <td><strong>${esc(booking['Booking ID'])}</strong><br><small>${esc(booking['Date Submitted'])}</small></td>
        <td><strong>${esc(booking['Customer Name'])}</strong><br>${esc(booking['Mobile'])}<br><small>${esc(booking['Email'])}</small></td>
        <td><strong>${esc(booking['Event Type'])}</strong><br>${esc(booking['Event Date'])} ${esc(booking['Preferred Time'])}<br><small>${esc(booking['Guests'])} guests</small></td>
        <td>${esc(booking['Services Needed'])}${booking['Catering Menu Selections'] ? `<br><small class="menu-item-admin-meta">🍽️ ${esc(booking['Catering Menu Selections'])}</small>` : ''}<br><small>${esc(booking['Notes'])}</small></td>
        <td>${esc(booking['UTM Content'] || booking['Source'] || 'Website')}</td>
        <td><select class="small-select booking-status">${state.data.statuses.map(status => `<option ${status === booking['Booking Status'] ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select></td>
        <td><textarea class="small-textarea booking-notes">${esc(booking['Admin Notes'] || '')}</textarea></td>
        <td><button class="btn btn-primary btn-sm save-booking" type="button">Save</button></td>
      </tr>`).join('') : '<tr><td colspan="8">No matching booking inquiries.</td></tr>';

    $$('.save-booking').forEach(button => button.addEventListener('click', async () => {
      const row = button.closest('tr');
      if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to save booking changes.', true);
      button.disabled = true;
      try {
        await postAction('updateBooking', {
          bookingId: row.dataset.bookingId,
          status: $('.booking-status', row).value,
          adminNotes: $('.booking-notes', row).value
        });
        toast('Booking updated.');
        await refreshData(false);
      } catch (error) { handleError(error); }
      finally { button.disabled = false; }
    }));
  }

  function renderServices() {
    $('#serviceList').innerHTML = (state.data.services || []).length ? state.data.services.map(service => `
      <article class="admin-item">
        ${service['Image URL'] ? `<img src="${esc(service['Image URL'])}" alt="">` : '<div style="width:90px;height:76px;border-radius:10px;background:#2b1717;display:grid;place-items:center;font-size:30px">🎉</div>'}
        <div><h3>${esc(service['Service Name'])}</h3><p>${esc(service['Business'])}<br><strong style="color:var(--gold2)">${esc(service['Price'] || 'No price text')}</strong> • ${String(service['Active']).toUpperCase() === 'TRUE' ? 'Active' : 'Hidden'}</p></div>
        <div class="item-actions"><button class="btn btn-ghost btn-sm edit-service" type="button" data-id="${esc(service['Service ID'])}">Edit</button><button class="btn btn-danger btn-sm delete-service" type="button" data-id="${esc(service['Service ID'])}">Delete</button></div>
      </article>`).join('') : '<div class="notice">No services yet.</div>';

    $$('.edit-service').forEach(button => button.addEventListener('click', () => startServiceEdit(button.dataset.id)));
    $$('.delete-service').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Delete this service?')) return;
      if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to delete services.', true);
      try { setLoading(true, 'Deleting service...'); await postAction('deleteService', { serviceId: button.dataset.id }); toast('Service deleted.'); await refreshData(false); }
      catch (error) { handleError(error); }
      finally { setLoading(false); }
    }));
  }

  function resetServiceForm() {
    $('#serviceForm').reset(); $('#serviceId').value = ''; $('#serviceActive').checked = true; $('#serviceSort').value = '1';
    $('#serviceFormTitle').textContent = 'Add Service'; $('#cancelServiceEdit').classList.add('hidden');
  }

  function startServiceEdit(id) {
    const service = state.data.services.find(item => item['Service ID'] === id);
    if (!service) return;
    $('#serviceId').value = service['Service ID']; $('#serviceBusiness').value = service['Business']; $('#serviceName').value = service['Service Name'];
    $('#servicePrice').value = service['Price']; $('#serviceDescription').value = service['Short Description']; $('#serviceSort').value = service['Sort Order'] || 0;
    $('#serviceActive').checked = String(service['Active']).toUpperCase() === 'TRUE'; $('#serviceFormTitle').textContent = 'Edit Service'; $('#cancelServiceEdit').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderMenu() {
    const categories = state.data.menuCategories || [];
    const items = state.data.menuItems || [];

    $('#menuCategoryListAdmin').innerHTML = categories.length ? categories.map(category => {
      const count = items.filter(item => item['Category ID'] === category['Category ID']).length;
      return `
        <article class="menu-category-admin">
          <div><h3>${esc(category['Category Name'])}</h3><p>Maximum ${esc(category['Max Selections'])} choice${Number(category['Max Selections']) === 1 ? '' : 's'} • ${count} menu item${count === 1 ? '' : 's'} • ${String(category['Active']).toUpperCase() === 'TRUE' ? 'Active' : 'Hidden'}</p></div>
          <div class="item-actions"><button class="btn btn-ghost btn-sm edit-menu-category" type="button" data-id="${esc(category['Category ID'])}">Edit</button><button class="btn btn-danger btn-sm delete-menu-category" type="button" data-id="${esc(category['Category ID'])}">Delete</button></div>
        </article>`;
    }).join('') : '<div class="notice">No menu categories yet. Add Main Dish, Dessert or any category you need.</div>';

    const categoryOptions = categories.map(category => `<option value="${esc(category['Category ID'])}">${esc(category['Category Name'])}</option>`).join('');
    const currentCategory = $('#menuItemCategory').value;
    $('#menuItemCategory').innerHTML = categoryOptions || '<option value="">Add a category first</option>';
    if (categories.some(category => category['Category ID'] === currentCategory)) $('#menuItemCategory').value = currentCategory;

    $('#menuItemListAdmin').innerHTML = items.length ? items.map(item => {
      const category = categories.find(row => row['Category ID'] === item['Category ID']);
      return `
        <article class="admin-item">
          ${item['Image URL'] ? `<img src="${esc(item['Image URL'])}" alt="">` : '<div style="width:90px;height:76px;border-radius:10px;background:#2b1717;display:grid;place-items:center;font-size:30px">🍽️</div>'}
          <div><h3>${esc(item['Item Name'])}</h3><p>${esc(category?.['Category Name'] || 'Unknown Category')}<br>${item['Price / Add-on'] ? `<strong style="color:var(--gold2)">${esc(item['Price / Add-on'])}</strong> • ` : ''}${String(item['Active']).toUpperCase() === 'TRUE' ? 'Active' : 'Hidden'}</p></div>
          <div class="item-actions"><button class="btn btn-ghost btn-sm edit-menu-item" type="button" data-id="${esc(item['Menu Item ID'])}">Edit</button><button class="btn btn-danger btn-sm delete-menu-item" type="button" data-id="${esc(item['Menu Item ID'])}">Delete</button></div>
        </article>`;
    }).join('') : '<div class="notice">No menu items yet. Add menu items after creating a category.</div>';

    $$('.edit-menu-category').forEach(button => button.addEventListener('click', () => startMenuCategoryEdit(button.dataset.id)));
    $$('.delete-menu-category').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Delete this category and all menu items inside it?')) return;
      if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to delete menu categories.', true);
      try { setLoading(true, 'Deleting menu category...'); await postAction('deleteMenuCategory', { categoryId: button.dataset.id }); toast('Menu category deleted.'); await refreshData(false); }
      catch (error) { handleError(error); }
      finally { setLoading(false); }
    }));
    $$('.edit-menu-item').forEach(button => button.addEventListener('click', () => startMenuItemEdit(button.dataset.id)));
    $$('.delete-menu-item').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Delete this menu item?')) return;
      if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to delete menu items.', true);
      try { setLoading(true, 'Deleting menu item...'); await postAction('deleteMenuItem', { menuItemId: button.dataset.id }); toast('Menu item deleted.'); await refreshData(false); }
      catch (error) { handleError(error); }
      finally { setLoading(false); }
    }));
  }

  function resetMenuCategoryForm() {
    $('#menuCategoryForm').reset(); $('#menuCategoryId').value = ''; $('#menuCategoryActive').checked = true; $('#menuCategoryMax').value = '2'; $('#menuCategorySort').value = '1';
    $('#menuCategoryFormTitle').textContent = 'Add Menu Category'; $('#cancelMenuCategoryEdit').classList.add('hidden');
  }

  function startMenuCategoryEdit(id) {
    const category = (state.data.menuCategories || []).find(item => item['Category ID'] === id);
    if (!category) return;
    $('#menuCategoryId').value = category['Category ID']; $('#menuCategoryName').value = category['Category Name']; $('#menuCategoryMax').value = category['Max Selections'] || 1; $('#menuCategorySort').value = category['Sort Order'] || 0;
    $('#menuCategoryActive').checked = String(category['Active']).toUpperCase() === 'TRUE'; $('#menuCategoryFormTitle').textContent = 'Edit Menu Category'; $('#cancelMenuCategoryEdit').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetMenuItemForm() {
    $('#menuItemForm').reset(); $('#menuItemId').value = ''; $('#menuItemActive').checked = true; $('#menuItemSort').value = '1';
    $('#menuItemFormTitle').textContent = 'Add Menu Item'; $('#cancelMenuItemEdit').classList.add('hidden');
    renderMenu();
  }

  function startMenuItemEdit(id) {
    const item = (state.data.menuItems || []).find(row => row['Menu Item ID'] === id);
    if (!item) return;
    $('#menuItemId').value = item['Menu Item ID']; $('#menuItemCategory').value = item['Category ID']; $('#menuItemName').value = item['Item Name']; $('#menuItemPrice').value = item['Price / Add-on']; $('#menuItemDescription').value = item['Description']; $('#menuItemSort').value = item['Sort Order'] || 0;
    $('#menuItemActive').checked = String(item['Active']).toUpperCase() === 'TRUE'; $('#menuItemFormTitle').textContent = 'Edit Menu Item'; $('#cancelMenuItemEdit').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderGallery() {
    $('#galleryList').innerHTML = (state.data.gallery || []).length ? state.data.gallery.map(item => `
      <article class="admin-item">
        <img src="${esc(item['Image URL'])}" alt="">
        <div><h3>${esc(item['Title'] || 'Untitled Photo')}</h3><p>${esc(item['Category'] || 'No category')} • ${String(item['Active']).toUpperCase() === 'TRUE' ? 'Active' : 'Hidden'}</p></div>
        <div class="item-actions"><button class="btn btn-ghost btn-sm edit-gallery" type="button" data-id="${esc(item['Gallery ID'])}">Edit</button><button class="btn btn-danger btn-sm delete-gallery" type="button" data-id="${esc(item['Gallery ID'])}">Delete</button></div>
      </article>`).join('') : '<div class="notice">No gallery photos yet.</div>';

    $$('.edit-gallery').forEach(button => button.addEventListener('click', () => startGalleryEdit(button.dataset.id)));
    $$('.delete-gallery').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Delete this gallery item?')) return;
      if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to delete gallery photos.', true);
      try { setLoading(true, 'Deleting gallery photo...'); await postAction('deleteGalleryItem', { galleryId: button.dataset.id }); toast('Gallery item deleted.'); await refreshData(false); }
      catch (error) { handleError(error); }
      finally { setLoading(false); }
    }));
  }

  function resetGalleryForm() {
    $('#galleryForm').reset(); $('#galleryId').value = ''; $('#galleryActive').checked = true; $('#gallerySort').value = '1';
    $('#galleryFormTitle').textContent = 'Add Gallery Photo'; $('#cancelGalleryEdit').classList.add('hidden');
  }

  function startGalleryEdit(id) {
    const item = state.data.gallery.find(row => row['Gallery ID'] === id);
    if (!item) return;
    $('#galleryId').value = item['Gallery ID']; $('#galleryTitle').value = item['Title']; $('#galleryCategory').value = item['Category']; $('#gallerySort').value = item['Sort Order'] || 0;
    $('#galleryActive').checked = String(item['Active']).toUpperCase() === 'TRUE'; $('#galleryFormTitle').textContent = 'Edit Gallery Photo'; $('#cancelGalleryEdit').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderSettings() {
    const settings = state.data.settings || {};
    $$('[data-setting]').forEach(input => input.value = settings[input.dataset.setting] || '');
    const logos = [
      ['mainLogoUrl','Main Website Logo','assets/barikan-events-venue-logo.jpg'],
      ['venueLogoUrl','BARikan Events Venue Logo','assets/barikan-events-venue-logo.jpg'],
      ['cateringLogoUrl',"You're my BOSS Logo",'assets/youre-my-boss-logo.png'],
      ['restoLogoUrl','BOSS BARikan & Resto Logo','assets/boss-barikan-resto-logo.png']
    ];
    $('#logoUploadGrid').innerHTML = logos.map(([key, label, fallback]) => `
      <div class="logo-upload">
        <strong>${esc(label)}</strong>
        <img src="${esc(settings[key] || fallback)}" alt="${esc(label)}">
        <input type="file" accept="image/*" data-logo-file="${esc(key)}">
        <button class="btn btn-ghost btn-sm upload-logo" type="button" data-key="${esc(key)}" style="margin-top:8px">Upload Logo</button>
      </div>`).join('');

    $$('.upload-logo').forEach(button => button.addEventListener('click', async () => {
      const input = $$('[data-logo-file]').find(item => item.dataset.logoFile === button.dataset.key);
      if (!input?.files?.[0]) return toast('Select a logo image first.', true);
      if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to upload logos.', true);
      try {
        setLoading(true, 'Uploading logo...');
        const fileData = await compressImage(input.files[0]);
        await postAction('uploadSettingImage', { settingKey: button.dataset.key }, fileData);
        toast('Logo uploaded.'); await refreshData(false);
      } catch (error) { handleError(error); }
      finally { setLoading(false); }
    }));
  }

  function switchTab(tab) {
    $$('.side-btn[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
    $$('.admin-section').forEach(section => section.classList.toggle('active', section.id === `tab-${tab}`));
    $('#adminPageTitle').textContent = ({bookings:'Bookings',services:'Services & Prices',menu:'Catering Menu',gallery:'Gallery',settings:'Settings'})[tab] || tab;
    window.scrollTo({ top: 0 });
  }

  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('#loginBtn'); button.disabled = true; button.textContent = 'Logging in...';
    try {
      const passwordHash = await sha256($('#loginPassword').value);
      const response = await jsonp('loginAdmin', { passwordHash });
      if (!response || !response.ok) throw new Error(response?.error || 'Login failed.');
      state.token = response.token;
      sessionStorage.setItem('barikanAdminToken', state.token);
      $('#loginPassword').value = '';
      await refreshData(false);
    } catch (error) { loginStatus(error.message || 'Login failed.', 'error'); }
    finally { button.disabled = false; button.textContent = 'Log In'; }
  });

  $$('.side-btn[data-tab]').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
  $('#manualRefreshBtn').addEventListener('click', () => refreshData(true));
  $('#bookingSearch').addEventListener('input', renderBookings);
  $('#cancelServiceEdit').addEventListener('click', resetServiceForm);
  $('#cancelMenuCategoryEdit').addEventListener('click', resetMenuCategoryForm);
  $('#cancelMenuItemEdit').addEventListener('click', resetMenuItemForm);
  $('#cancelGalleryEdit').addEventListener('click', resetGalleryForm);

  $('#serviceForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to save services.', true);
    const button = $('#saveServiceBtn'); button.disabled = true;
    try {
      setLoading(true, 'Saving service...');
      const fileData = await compressImage($('#serviceImage').files[0]);
      await postAction('upsertService', {
        serviceId: $('#serviceId').value, business: $('#serviceBusiness').value, serviceName: $('#serviceName').value,
        price: $('#servicePrice').value, description: $('#serviceDescription').value, sortOrder: $('#serviceSort').value,
        active: $('#serviceActive').checked
      }, fileData);
      toast('Service saved.'); resetServiceForm(); await refreshData(false);
    } catch (error) { handleError(error); }
    finally { setLoading(false); button.disabled = false; }
  });

  $('#menuCategoryForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to save menu categories.', true);
    const button = $('#saveMenuCategoryBtn'); button.disabled = true;
    try {
      setLoading(true, 'Saving menu category...');
      await postAction('upsertMenuCategory', {
        categoryId: $('#menuCategoryId').value, categoryName: $('#menuCategoryName').value,
        maxSelections: $('#menuCategoryMax').value, sortOrder: $('#menuCategorySort').value,
        active: $('#menuCategoryActive').checked
      });
      toast('Menu category saved.'); resetMenuCategoryForm(); await refreshData(false);
    } catch (error) { handleError(error); }
    finally { setLoading(false); button.disabled = false; }
  });

  $('#menuItemForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!(state.data.menuCategories || []).length) return toast('Add a menu category first.', true);
    if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to save menu items.', true);
    const button = $('#saveMenuItemBtn'); button.disabled = true;
    try {
      setLoading(true, 'Saving menu item...');
      const fileData = await compressImage($('#menuItemImage').files[0]);
      await postAction('upsertMenuItem', {
        menuItemId: $('#menuItemId').value, categoryId: $('#menuItemCategory').value,
        itemName: $('#menuItemName').value, price: $('#menuItemPrice').value,
        description: $('#menuItemDescription').value, sortOrder: $('#menuItemSort').value,
        active: $('#menuItemActive').checked
      }, fileData);
      toast('Menu item saved.'); resetMenuItemForm(); await refreshData(false);
    } catch (error) { handleError(error); }
    finally { setLoading(false); button.disabled = false; }
  });

  $('#galleryForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to save gallery photos.', true);
    const button = $('#saveGalleryBtn'); button.disabled = true;
    try {
      setLoading(true, 'Saving gallery photo...');
      const fileData = await compressImage($('#galleryImage').files[0]);
      await postAction('upsertGalleryItem', {
        galleryId: $('#galleryId').value, title: $('#galleryTitle').value, category: $('#galleryCategory').value,
        sortOrder: $('#gallerySort').value, active: $('#galleryActive').checked
      }, fileData);
      toast('Gallery photo saved.'); resetGalleryForm(); await refreshData(false);
    } catch (error) { handleError(error); }
    finally { setLoading(false); button.disabled = false; }
  });

  $('#settingsForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (PREVIEW) return toast('Preview mode only. Deploy Code.gs to save website settings.', true);
    const settings = {};
    $$('[data-setting]').forEach(input => settings[input.dataset.setting] = input.value);
    try { setLoading(true, 'Saving website settings...'); await postAction('saveSettings', settings); toast('Website settings saved.'); await refreshData(false); }
    catch (error) { handleError(error); }
    finally { setLoading(false); }
  });

  $('#passwordForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (PREVIEW) return toast('Preview mode only. Password changes require the live backend.', true);
    try {
      setLoading(true, 'Changing admin password...');
      await postAction('changeAdminPassword', { currentPassword: $('#currentPassword').value, newPassword: $('#newPassword').value });
      event.currentTarget.reset(); toast('Admin password changed.');
    } catch (error) { handleError(error); }
    finally { setLoading(false); }
  });

  $('#logoutBtn').addEventListener('click', async () => {
    if (!PREVIEW && state.token) {
      try { await postAction('logoutAdmin', {}); } catch (_) {}
    }
    state.token = ''; sessionStorage.removeItem('barikanAdminToken'); location.reload();
  });

  if (PREVIEW) {
    $('#previewBanner').classList.add('show');
    refreshData(false);
  } else if (state.token) {
    refreshData(false);
  }
})();
