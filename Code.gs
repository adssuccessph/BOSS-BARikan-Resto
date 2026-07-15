/**
 * BARikan Event Booking + Admin API v3.2
 * Static frontend (GitHub Pages / direct HTML preview) + Google Sheets backend.
 *
 * Existing Google Sheet:
 * Spreadsheet ID: 1bqQxZBnro4r5fXOPM7ZWZ5WkyHmcdEf-P-zwJNNLtLs
 * Booking sheet GID: 2766172
 */

const APP_CONFIG = Object.freeze({
  SPREADSHEET_ID: '1bqQxZBnro4r5fXOPM7ZWZ5WkyHmcdEf-P-zwJNNLtLs',
  BOOKING_SHEET_GID: 2766172,
  SERVICES_SHEET: 'Services',
  MENU_CATEGORIES_SHEET: 'MenuCategories',
  MENU_ITEMS_SHEET: 'MenuItems',
  GALLERY_SHEET: 'Gallery',
  SETTINGS_SHEET: 'Settings',
  UPLOAD_FOLDER: 'BARikan Website Uploads',
  ADMIN_SESSION_SECONDS: 21600,
  OPERATION_RESULT_SECONDS: 300,
  DEFAULT_ADMIN_PASSWORD: 'BARikan@Admin2026!'
});

const BOOKING_HEADERS = [
  'Booking ID', 'Date Submitted', 'Customer Name', 'Mobile', 'Email',
  'Event Type', 'Event Date', 'Preferred Time', 'Guests', 'Services Needed',
  'Service IDs', 'Catering Menu Selections', 'Catering Menu Item IDs', 'Notes', 'Consent', 'Booking Status', 'Source', 'UTM Source', 'UTM Medium',
  'UTM Campaign', 'UTM Content', 'Page URL', 'Client Submitted At',
  'Admin Notes', 'Last Updated'
];

const SERVICE_HEADERS = [
  'Service ID', 'Business', 'Service Name', 'Price', 'Short Description',
  'Image URL', 'Image File ID', 'Active', 'Sort Order', 'Created At', 'Updated At'
];

const MENU_CATEGORY_HEADERS = [
  'Category ID', 'Category Name', 'Max Selections', 'Active', 'Sort Order', 'Created At', 'Updated At'
];

const MENU_ITEM_HEADERS = [
  'Menu Item ID', 'Category ID', 'Item Name', 'Price / Add-on', 'Description',
  'Image URL', 'Image File ID', 'Active', 'Sort Order', 'Created At', 'Updated At'
];

const GALLERY_HEADERS = [
  'Gallery ID', 'Title', 'Category', 'Image URL', 'Image File ID',
  'Active', 'Sort Order', 'Created At', 'Updated At'
];

const SETTINGS_HEADERS = ['Key', 'Value'];
const BOOKING_STATUSES = ['New Inquiry', 'Contacted', 'Pending', 'Confirmed', 'Cancelled'];

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = clean_(params.callback);
  const action = clean_(params.action) || 'ping';

  try {
    let result;
    switch (action) {
      case 'ping':
        result = {
          ok: true,
          service: 'BARikan Event Booking Admin API v3.2',
          sheetGid: getBookingSheet_().getSheetId(),
          message: 'API is live.'
        };
        break;
      case 'getPublicData':
        result = getPublicData_();
        break;
      case 'loginAdmin':
        result = loginAdmin_(params.passwordHash);
        break;
      case 'getAdminDashboard':
        result = getAdminDashboard_(params.token);
        break;
      case 'getOperationResult':
        result = getOperationResult_(params.operationId);
        break;
      default:
        throw new Error('Unknown GET action: ' + action);
    }
    return apiOutput_(result, callback);
  } catch (error) {
    console.error(error);
    return apiOutput_({ ok: false, error: error.message || String(error) }, callback);
  }
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  const action = clean_(params.action);
  const operationId = clean_(params.operationId) || ('OP-' + Utilities.getUuid());

  try {
    const payload = parseJson_(params.payload, {});
    const fileData = parseJson_(params.fileData, null);
    let result;

    switch (action) {
      case 'submitBooking':
        result = submitBooking_(payload);
        break;
      case 'updateBooking':
        assertAdmin_(params.token);
        result = updateBooking_(payload);
        break;
      case 'upsertService':
        assertAdmin_(params.token);
        result = upsertService_(payload, fileData);
        break;
      case 'deleteService':
        assertAdmin_(params.token);
        result = deleteService_(payload.serviceId);
        break;
      case 'upsertMenuCategory':
        assertAdmin_(params.token);
        result = upsertMenuCategory_(payload);
        break;
      case 'deleteMenuCategory':
        assertAdmin_(params.token);
        result = deleteMenuCategory_(payload.categoryId);
        break;
      case 'upsertMenuItem':
        assertAdmin_(params.token);
        result = upsertMenuItem_(payload, fileData);
        break;
      case 'deleteMenuItem':
        assertAdmin_(params.token);
        result = deleteMenuItem_(payload.menuItemId);
        break;
      case 'upsertGalleryItem':
        assertAdmin_(params.token);
        result = upsertGalleryItem_(payload, fileData);
        break;
      case 'deleteGalleryItem':
        assertAdmin_(params.token);
        result = deleteGalleryItem_(payload.galleryId);
        break;
      case 'saveSettings':
        assertAdmin_(params.token);
        result = saveSettings_(payload);
        break;
      case 'uploadSettingImage':
        assertAdmin_(params.token);
        result = uploadSettingImage_(payload.settingKey, fileData);
        break;
      case 'changeAdminPassword':
        assertAdmin_(params.token);
        result = changeAdminPassword_(payload.currentPassword, payload.newPassword);
        break;
      case 'logoutAdmin':
        result = logoutAdmin_(params.token);
        break;
      default:
        throw new Error('Unknown POST action: ' + action);
    }

    saveOperationResult_(operationId, { ok: true, result: result || { ok: true } });
    return htmlPostOutput_('OK');
  } catch (error) {
    console.error(error);
    saveOperationResult_(operationId, { ok: false, error: error.message || String(error) });
    return htmlPostOutput_('ERROR');
  }
}

/**
 * RUN ONCE after replacing Code.gs.
 * Preserves existing booking rows and only adds missing columns/tabs.
 */
function setupSystem() {
  const bookingSheet = getBookingSheet_();
  const servicesSheet = getOrCreateSheet_(APP_CONFIG.SERVICES_SHEET, SERVICE_HEADERS);
  const menuCategoriesSheet = getOrCreateSheet_(APP_CONFIG.MENU_CATEGORIES_SHEET, MENU_CATEGORY_HEADERS);
  const menuItemsSheet = getOrCreateSheet_(APP_CONFIG.MENU_ITEMS_SHEET, MENU_ITEM_HEADERS);
  const gallerySheet = getOrCreateSheet_(APP_CONFIG.GALLERY_SHEET, GALLERY_HEADERS);
  const settingsSheet = getOrCreateSheet_(APP_CONFIG.SETTINGS_SHEET, SETTINGS_HEADERS);

  seedSettings_(settingsSheet);
  seedServices_(servicesSheet);
  seedMenuCategories_(menuCategoriesSheet);

  const props = PropertiesService.getScriptProperties();
  let passwordCreated = false;
  if (!props.getProperty('ADMIN_PASSWORD_HASH')) {
    props.setProperty('ADMIN_PASSWORD_HASH', hash_(APP_CONFIG.DEFAULT_ADMIN_PASSWORD));
    passwordCreated = true;
  }

  styleHeader_(bookingSheet);
  styleHeader_(servicesSheet);
  styleHeader_(menuCategoriesSheet);
  styleHeader_(menuItemsSheet);
  styleHeader_(gallerySheet);
  styleHeader_(settingsSheet);
  SpreadsheetApp.flush();

  Logger.log('BARikan API setup complete.');
  Logger.log('Booking sheet: ' + bookingSheet.getName() + ' | GID: ' + bookingSheet.getSheetId());
  if (passwordCreated) {
    Logger.log('TEMP ADMIN PASSWORD: ' + APP_CONFIG.DEFAULT_ADMIN_PASSWORD);
    Logger.log('Change it immediately after first login.');
  }

  return {
    ok: true,
    bookingSheet: bookingSheet.getName(),
    bookingSheetGid: bookingSheet.getSheetId(),
    servicesSheet: servicesSheet.getName(),
    menuCategoriesSheet: menuCategoriesSheet.getName(),
    menuItemsSheet: menuItemsSheet.getName(),
    gallerySheet: gallerySheet.getName(),
    settingsSheet: settingsSheet.getName(),
    defaultPasswordCreated: passwordCreated
  };
}

// ============================= PUBLIC DATA =============================

function getPublicData_() {
  const services = readObjects_(getServicesSheet_())
    .filter(function (item) { return isTrue_(item['Active']); })
    .sort(sortByOrder_);
  const menuCategories = readObjects_(getMenuCategoriesSheet_())
    .filter(function (item) { return isTrue_(item['Active']); })
    .sort(sortByOrder_);
  const activeCategoryIds = menuCategories.map(function (item) { return item['Category ID']; });
  const menuItems = readObjects_(getMenuItemsSheet_())
    .filter(function (item) { return isTrue_(item['Active']) && activeCategoryIds.indexOf(item['Category ID']) !== -1; })
    .sort(sortByOrder_);
  const gallery = readObjects_(getGallerySheet_())
    .filter(function (item) { return isTrue_(item['Active']); })
    .sort(sortByOrder_);

  return {
    ok: true,
    settings: getSettingsObject_(),
    services: services,
    menuCategories: menuCategories,
    menuItems: menuItems,
    gallery: gallery
  };
}

function submitBooking_(data) {
  data = data || {};
  const required = ['fullName', 'mobile', 'eventType', 'eventDate', 'guestCount', 'services'];
  const missing = required.filter(function (key) { return !clean_(data[key]); });
  if (missing.length) throw new Error('Please complete the required fields: ' + missing.join(', '));

  const guests = Number(data.guestCount);
  if (!Number.isFinite(guests) || guests < 1) throw new Error('Invalid number of guests.');

  const serviceIds = splitIds_(data.serviceIds);
  const activeServices = readObjects_(getServicesSheet_()).filter(function (item) { return isTrue_(item['Active']); });
  const selectedServices = serviceIds.length
    ? activeServices.filter(function (item) { return serviceIds.indexOf(item['Service ID']) !== -1; })
    : [];
  if (serviceIds.length && selectedServices.length !== serviceIds.length) {
    throw new Error('One selected service is no longer available. Please refresh the website and choose again.');
  }
  const servicesText = selectedServices.length
    ? selectedServices.map(function (item) { return item['Service Name']; }).join(', ')
    : clean_(data.services);
  const cateringSelected = selectedServices.length
    ? selectedServices.some(function (item) {
        return /cater/i.test(clean_(item['Business'])) || /cater/i.test(clean_(item['Service Name']));
      })
    : /cater/i.test(servicesText);

  const menuItemIds = splitIds_(data.menuItemIds);
  let menuSummary = '';
  if (menuItemIds.length) {
    if (!cateringSelected) throw new Error('Catering menu items cannot be selected unless Event Catering is selected.');

    const categories = readObjects_(getMenuCategoriesSheet_()).filter(function (item) { return isTrue_(item['Active']); });
    const categoryById = {};
    categories.forEach(function (item) { categoryById[item['Category ID']] = item; });

    const allItems = readObjects_(getMenuItemsSheet_()).filter(function (item) { return isTrue_(item['Active']); });
    const itemById = {};
    allItems.forEach(function (item) { itemById[item['Menu Item ID']] = item; });

    const selectedItems = menuItemIds.map(function (id) {
      const item = itemById[id];
      if (!item) throw new Error('One selected catering menu item is no longer available. Please refresh the website and choose again.');
      if (!categoryById[item['Category ID']]) throw new Error('One selected menu category is no longer active. Please refresh and choose again.');
      return item;
    });

    const grouped = {};
    selectedItems.forEach(function (item) {
      const categoryId = item['Category ID'];
      if (!grouped[categoryId]) grouped[categoryId] = [];
      grouped[categoryId].push(item);
    });

    const summaryParts = [];
    Object.keys(grouped).forEach(function (categoryId) {
      const category = categoryById[categoryId];
      const max = Math.max(1, numberOrZero_(category['Max Selections']));
      if (grouped[categoryId].length > max) {
        throw new Error(category['Category Name'] + ' allows a maximum of ' + max + ' menu selection' + (max > 1 ? 's' : '') + '.');
      }
      summaryParts.push(category['Category Name'] + ': ' + grouped[categoryId].map(function (item) { return item['Item Name']; }).join(', '));
    });
    menuSummary = summaryParts.join(' | ');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getBookingSheet_();
    const bookingId = createBookingId_();
    const now = new Date();

    appendObjectRow_(sheet, {
      'Booking ID': bookingId,
      'Date Submitted': now,
      'Customer Name': clean_(data.fullName),
      'Mobile': clean_(data.mobile),
      'Email': clean_(data.email),
      'Event Type': clean_(data.eventType),
      'Event Date': clean_(data.eventDate),
      'Preferred Time': clean_(data.eventTime),
      'Guests': guests,
      'Services Needed': servicesText,
      'Service IDs': serviceIds.join(','),
      'Catering Menu Selections': menuSummary,
      'Catering Menu Item IDs': menuItemIds.join(','),
      'Notes': clean_(data.notes),
      'Consent': clean_(data.consent) || 'Yes',
      'Booking Status': 'New Inquiry',
      'Source': clean_(data.source) || 'Website',
      'UTM Source': clean_(data.utmSource),
      'UTM Medium': clean_(data.utmMedium),
      'UTM Campaign': clean_(data.utmCampaign),
      'UTM Content': clean_(data.utmContent),
      'Page URL': clean_(data.pageUrl),
      'Client Submitted At': clean_(data.submittedAtClient),
      'Admin Notes': '',
      'Last Updated': now
    });

    SpreadsheetApp.flush();
    return { ok: true, bookingId: bookingId, cateringMenuSelections: menuSummary };
  } finally {
    lock.releaseLock();
  }
}

// ============================= ADMIN AUTH =============================

function loginAdmin_(passwordHash) {
  const savedHash = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD_HASH');
  if (!savedHash) throw new Error('Admin password is not initialized. Run setupSystem() first.');
  if (!passwordHash || String(passwordHash) !== savedHash) {
    Utilities.sleep(500);
    throw new Error('Incorrect admin password.');
  }

  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('ADMIN_SESSION_' + token, '1', APP_CONFIG.ADMIN_SESSION_SECONDS);
  return { ok: true, token: token, expiresInSeconds: APP_CONFIG.ADMIN_SESSION_SECONDS };
}

function assertAdmin_(token) {
  const valid = token && CacheService.getScriptCache().get('ADMIN_SESSION_' + token);
  if (!valid) throw new Error('Admin session expired. Please log in again.');
}

function logoutAdmin_(token) {
  if (token) CacheService.getScriptCache().remove('ADMIN_SESSION_' + token);
  return { ok: true };
}

function changeAdminPassword_(currentPassword, newPassword) {
  const props = PropertiesService.getScriptProperties();
  const currentHash = props.getProperty('ADMIN_PASSWORD_HASH');
  if (hash_(String(currentPassword || '')) !== currentHash) throw new Error('Current password is incorrect.');
  const next = String(newPassword || '');
  if (next.length < 10) throw new Error('New password must be at least 10 characters.');
  props.setProperty('ADMIN_PASSWORD_HASH', hash_(next));
  return { ok: true };
}

// ============================= ADMIN DASHBOARD =============================

function getAdminDashboard_(token) {
  assertAdmin_(token);
  const bookings = readObjects_(getBookingSheet_()).reverse();
  const services = readObjects_(getServicesSheet_()).sort(sortByOrder_);
  const menuCategories = readObjects_(getMenuCategoriesSheet_()).sort(sortByOrder_);
  const menuItems = readObjects_(getMenuItemsSheet_()).sort(sortByOrder_);
  const gallery = readObjects_(getGallerySheet_()).sort(sortByOrder_);

  return {
    ok: true,
    bookings: bookings,
    services: services,
    menuCategories: menuCategories,
    menuItems: menuItems,
    gallery: gallery,
    settings: getSettingsObject_(),
    stats: {
      total: bookings.length,
      newInquiry: bookings.filter(function (item) { return item['Booking Status'] === 'New Inquiry'; }).length,
      pending: bookings.filter(function (item) { return item['Booking Status'] === 'Pending'; }).length,
      confirmed: bookings.filter(function (item) { return item['Booking Status'] === 'Confirmed'; }).length
    },
    statuses: BOOKING_STATUSES,
    autoRefreshMinutes: 15
  };
}

function updateBooking_(data) {
  const bookingId = clean_(data.bookingId);
  const status = clean_(data.status);
  if (!bookingId) throw new Error('Booking ID is required.');
  if (BOOKING_STATUSES.indexOf(status) === -1) throw new Error('Invalid booking status.');

  updateObjectById_(getBookingSheet_(), 'Booking ID', bookingId, {
    'Booking Status': status,
    'Admin Notes': clean_(data.adminNotes),
    'Last Updated': new Date()
  });
  SpreadsheetApp.flush();
  return { ok: true };
}

// ============================= SERVICES =============================

function upsertService_(data, fileData) {
  data = data || {};
  if (!clean_(data.business)) throw new Error('Business is required.');
  if (!clean_(data.serviceName)) throw new Error('Service name is required.');

  const sheet = getServicesSheet_();
  const now = new Date();
  let id = clean_(data.serviceId);
  const current = id ? findObjectById_(sheet, 'Service ID', id) : null;
  let imageUrl = current ? current['Image URL'] : '';
  let imageFileId = current ? current['Image File ID'] : '';

  if (fileData && fileData.dataUrl) {
    const uploaded = saveUpload_(fileData);
    imageUrl = uploaded.url;
    imageFileId = uploaded.fileId;
  }

  if (!id) {
    id = 'SVC-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    appendObjectRow_(sheet, {
      'Service ID': id,
      'Business': clean_(data.business),
      'Service Name': clean_(data.serviceName),
      'Price': clean_(data.price),
      'Short Description': clean_(data.description),
      'Image URL': imageUrl,
      'Image File ID': imageFileId,
      'Active': data.active === false ? 'FALSE' : 'TRUE',
      'Sort Order': numberOrZero_(data.sortOrder),
      'Created At': now,
      'Updated At': now
    });
  } else {
    if (!current) throw new Error('Service not found: ' + id);
    updateObjectById_(sheet, 'Service ID', id, {
      'Business': clean_(data.business),
      'Service Name': clean_(data.serviceName),
      'Price': clean_(data.price),
      'Short Description': clean_(data.description),
      'Image URL': imageUrl,
      'Image File ID': imageFileId,
      'Active': data.active === false ? 'FALSE' : 'TRUE',
      'Sort Order': numberOrZero_(data.sortOrder),
      'Updated At': now
    });
  }
  SpreadsheetApp.flush();
  return { ok: true, serviceId: id };
}

function deleteService_(serviceId) {
  deleteRowById_(getServicesSheet_(), 'Service ID', clean_(serviceId));
  return { ok: true };
}

// ============================= CATERING MENU =============================

function upsertMenuCategory_(data) {
  data = data || {};
  const categoryName = clean_(data.categoryName);
  const maxSelections = Number(data.maxSelections);
  if (!categoryName) throw new Error('Menu category name is required.');
  if (!Number.isFinite(maxSelections) || maxSelections < 1 || maxSelections > 20) throw new Error('Maximum selections must be between 1 and 20.');

  const sheet = getMenuCategoriesSheet_();
  const now = new Date();
  let id = clean_(data.categoryId);
  const current = id ? findObjectById_(sheet, 'Category ID', id) : null;

  if (!id) {
    id = 'CAT-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    appendObjectRow_(sheet, {
      'Category ID': id,
      'Category Name': categoryName,
      'Max Selections': Math.floor(maxSelections),
      'Active': data.active === false ? 'FALSE' : 'TRUE',
      'Sort Order': numberOrZero_(data.sortOrder),
      'Created At': now,
      'Updated At': now
    });
  } else {
    if (!current) throw new Error('Menu category not found: ' + id);
    updateObjectById_(sheet, 'Category ID', id, {
      'Category Name': categoryName,
      'Max Selections': Math.floor(maxSelections),
      'Active': data.active === false ? 'FALSE' : 'TRUE',
      'Sort Order': numberOrZero_(data.sortOrder),
      'Updated At': now
    });
  }
  SpreadsheetApp.flush();
  return { ok: true, categoryId: id };
}

function deleteMenuCategory_(categoryId) {
  const id = clean_(categoryId);
  if (!id) throw new Error('Menu category ID is required.');
  deleteRowsByField_(getMenuItemsSheet_(), 'Category ID', id);
  deleteRowById_(getMenuCategoriesSheet_(), 'Category ID', id);
  SpreadsheetApp.flush();
  return { ok: true };
}

function upsertMenuItem_(data, fileData) {
  data = data || {};
  const categoryId = clean_(data.categoryId);
  const itemName = clean_(data.itemName);
  if (!categoryId) throw new Error('Menu category is required.');
  if (!itemName) throw new Error('Menu item name is required.');
  if (!findObjectById_(getMenuCategoriesSheet_(), 'Category ID', categoryId)) throw new Error('Selected menu category was not found.');

  const sheet = getMenuItemsSheet_();
  const now = new Date();
  let id = clean_(data.menuItemId);
  const current = id ? findObjectById_(sheet, 'Menu Item ID', id) : null;
  let imageUrl = current ? current['Image URL'] : '';
  let imageFileId = current ? current['Image File ID'] : '';

  if (fileData && fileData.dataUrl) {
    const uploaded = saveUpload_(fileData);
    imageUrl = uploaded.url;
    imageFileId = uploaded.fileId;
  }

  if (!id) {
    id = 'MENU-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    appendObjectRow_(sheet, {
      'Menu Item ID': id,
      'Category ID': categoryId,
      'Item Name': itemName,
      'Price / Add-on': clean_(data.price),
      'Description': clean_(data.description),
      'Image URL': imageUrl,
      'Image File ID': imageFileId,
      'Active': data.active === false ? 'FALSE' : 'TRUE',
      'Sort Order': numberOrZero_(data.sortOrder),
      'Created At': now,
      'Updated At': now
    });
  } else {
    if (!current) throw new Error('Menu item not found: ' + id);
    updateObjectById_(sheet, 'Menu Item ID', id, {
      'Category ID': categoryId,
      'Item Name': itemName,
      'Price / Add-on': clean_(data.price),
      'Description': clean_(data.description),
      'Image URL': imageUrl,
      'Image File ID': imageFileId,
      'Active': data.active === false ? 'FALSE' : 'TRUE',
      'Sort Order': numberOrZero_(data.sortOrder),
      'Updated At': now
    });
  }
  SpreadsheetApp.flush();
  return { ok: true, menuItemId: id };
}

function deleteMenuItem_(menuItemId) {
  deleteRowById_(getMenuItemsSheet_(), 'Menu Item ID', clean_(menuItemId));
  SpreadsheetApp.flush();
  return { ok: true };
}

// ============================= GALLERY =============================

function upsertGalleryItem_(data, fileData) {
  data = data || {};
  const sheet = getGallerySheet_();
  const now = new Date();
  let id = clean_(data.galleryId);
  const current = id ? findObjectById_(sheet, 'Gallery ID', id) : null;
  let imageUrl = current ? current['Image URL'] : '';
  let imageFileId = current ? current['Image File ID'] : '';

  if (fileData && fileData.dataUrl) {
    const uploaded = saveUpload_(fileData);
    imageUrl = uploaded.url;
    imageFileId = uploaded.fileId;
  }
  if (!imageUrl) throw new Error('Please select an image.');

  if (!id) {
    id = 'GAL-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    appendObjectRow_(sheet, {
      'Gallery ID': id,
      'Title': clean_(data.title),
      'Category': clean_(data.category),
      'Image URL': imageUrl,
      'Image File ID': imageFileId,
      'Active': data.active === false ? 'FALSE' : 'TRUE',
      'Sort Order': numberOrZero_(data.sortOrder),
      'Created At': now,
      'Updated At': now
    });
  } else {
    if (!current) throw new Error('Gallery item not found: ' + id);
    updateObjectById_(sheet, 'Gallery ID', id, {
      'Title': clean_(data.title),
      'Category': clean_(data.category),
      'Image URL': imageUrl,
      'Image File ID': imageFileId,
      'Active': data.active === false ? 'FALSE' : 'TRUE',
      'Sort Order': numberOrZero_(data.sortOrder),
      'Updated At': now
    });
  }
  SpreadsheetApp.flush();
  return { ok: true, galleryId: id };
}

function deleteGalleryItem_(galleryId) {
  deleteRowById_(getGallerySheet_(), 'Gallery ID', clean_(galleryId));
  return { ok: true };
}

// ============================= SETTINGS =============================

function saveSettings_(settings) {
  const allowed = [
    'siteName', 'heroBadge', 'heroTitle', 'heroSubtitle', 'venuePackageText',
    'phone', 'email', 'address', 'chatUrl', 'chatLabel', 'facebookUrl',
    'bookingNotice', 'mainLogoUrl', 'venueLogoUrl', 'cateringLogoUrl', 'restoLogoUrl'
  ];
  const cleaned = {};
  allowed.forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(settings || {}, key)) cleaned[key] = clean_(settings[key]);
  });
  setSettings_(cleaned);
  SpreadsheetApp.flush();
  return { ok: true };
}

function uploadSettingImage_(settingKey, fileData) {
  const allowed = ['mainLogoUrl', 'venueLogoUrl', 'cateringLogoUrl', 'restoLogoUrl'];
  if (allowed.indexOf(clean_(settingKey)) === -1) throw new Error('Invalid image setting.');
  const uploaded = saveUpload_(fileData);
  const update = {};
  update[settingKey] = uploaded.url;
  setSettings_(update);
  return { ok: true, url: uploaded.url, fileId: uploaded.fileId };
}

// ============================= OPERATION RESULT =============================

function saveOperationResult_(operationId, data) {
  if (!operationId) return;
  CacheService.getScriptCache().put('BARIKAN_OP_' + operationId, JSON.stringify(data), APP_CONFIG.OPERATION_RESULT_SECONDS);
}

function getOperationResult_(operationId) {
  const id = clean_(operationId);
  if (!id) throw new Error('Operation ID is required.');
  const raw = CacheService.getScriptCache().get('BARIKAN_OP_' + id);
  if (!raw) return { ok: true, pending: true };
  const result = JSON.parse(raw);
  result.pending = false;
  return result;
}

// ============================= SHEET HELPERS =============================

function getSpreadsheet_() {
  return SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
}

function getBookingSheet_() {
  const sheet = getSpreadsheet_().getSheetById(Number(APP_CONFIG.BOOKING_SHEET_GID));
  if (!sheet) throw new Error('Booking sheet GID ' + APP_CONFIG.BOOKING_SHEET_GID + ' was not found.');
  ensureHeaders_(sheet, BOOKING_HEADERS);
  return sheet;
}

function getServicesSheet_() {
  return getOrCreateSheet_(APP_CONFIG.SERVICES_SHEET, SERVICE_HEADERS);
}

function getMenuCategoriesSheet_() {
  return getOrCreateSheet_(APP_CONFIG.MENU_CATEGORIES_SHEET, MENU_CATEGORY_HEADERS);
}

function getMenuItemsSheet_() {
  return getOrCreateSheet_(APP_CONFIG.MENU_ITEMS_SHEET, MENU_ITEM_HEADERS);
}

function getGallerySheet_() {
  return getOrCreateSheet_(APP_CONFIG.GALLERY_SHEET, GALLERY_HEADERS);
}

function getSettingsSheet_() {
  return getOrCreateSheet_(APP_CONFIG.SETTINGS_SHEET, SETTINGS_HEADERS);
}

function getOrCreateSheet_(name, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  ensureHeaders_(sheet, headers);
  return sheet;
}

function ensureHeaders_(sheet, requiredHeaders) {
  const lastColumn = Math.max(1, sheet.getLastColumn());
  let headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(clean_);
  const blank = headers.every(function (value) { return !value; });

  if (blank) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else {
    const missing = requiredHeaders.filter(function (header) { return headers.indexOf(header) === -1; });
    if (missing.length) sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
  styleHeader_(sheet);
}

function styleHeader_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return;
  sheet.getRange(1, 1, 1, lastColumn)
    .setFontWeight('bold')
    .setBackground('#1b0b0b')
    .setFontColor('#ffffff');
}

function readObjects_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values[0].map(clean_);
  return values.slice(1).filter(function (row) {
    return row.some(function (value) { return clean_(value); });
  }).map(function (row) {
    const item = {};
    headers.forEach(function (header, index) {
      if (header) item[header] = row[index] || '';
    });
    return item;
  });
}

function appendObjectRow_(sheet, item) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(clean_);
  sheet.appendRow(headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(item, header) ? item[header] : '';
  }));
}

function findObjectById_(sheet, idHeader, idValue) {
  return readObjects_(sheet).find(function (item) {
    return clean_(item[idHeader]) === clean_(idValue);
  }) || null;
}

function updateObjectById_(sheet, idHeader, idValue, patch) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(function (value) { return clean_(value); });
  const idColumn = headers.indexOf(idHeader);
  if (idColumn === -1) throw new Error('Missing ID column: ' + idHeader);

  let rowNumber = -1;
  for (let row = 1; row < values.length; row++) {
    if (clean_(values[row][idColumn]) === clean_(idValue)) {
      rowNumber = row + 1;
      break;
    }
  }
  if (rowNumber === -1) throw new Error('Record not found: ' + idValue);

  Object.keys(patch).forEach(function (header) {
    const column = headers.indexOf(header);
    if (column !== -1) sheet.getRange(rowNumber, column + 1).setValue(patch[header]);
  });
}

function deleteRowById_(sheet, idHeader, idValue) {
  if (!idValue) throw new Error('Record ID is required.');
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(clean_);
  const idColumn = headers.indexOf(idHeader);
  if (idColumn === -1) throw new Error('Missing ID column: ' + idHeader);

  for (let row = values.length - 1; row >= 1; row--) {
    if (clean_(values[row][idColumn]) === clean_(idValue)) {
      sheet.deleteRow(row + 1);
      return;
    }
  }
  throw new Error('Record not found: ' + idValue);
}

// ============================= SETTINGS HELPERS =============================

function getSettingsObject_() {
  const settings = {};
  readObjects_(getSettingsSheet_()).forEach(function (row) {
    const key = clean_(row['Key']);
    if (key) settings[key] = row['Value'] || '';
  });
  return settings;
}

function setSettings_(settings) {
  const sheet = getSettingsSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(function (value) { return clean_(value); });
  const keyColumn = headers.indexOf('Key');
  const valueColumn = headers.indexOf('Value');
  const rowByKey = {};

  for (let row = 1; row < values.length; row++) rowByKey[clean_(values[row][keyColumn])] = row + 1;

  Object.keys(settings).forEach(function (key) {
    if (rowByKey[key]) {
      sheet.getRange(rowByKey[key], valueColumn + 1).setValue(settings[key]);
    } else {
      sheet.appendRow([key, settings[key]]);
    }
  });
}

function seedSettings_(sheet) {
  if (readObjects_(sheet).length) return;
  const defaults = {
    siteName: 'BARikan Event Booking',
    heroBadge: 'VENUE • CATERING • RESTO',
    heroTitle: 'Plan Your Event in One Place',
    heroSubtitle: 'From celebrations and catering to after-event chill — we have you covered.',
    venuePackageText: 'Featured venue package from ₱7,999 fully consumable',
    phone: '0917 588 2281',
    email: 'bossbarikanresto@gmail.com',
    address: 'PAJ Building, 35 M. Almeda Street, San Roque, Pateros, 1620',
    chatUrl: '',
    chatLabel: 'Chat with us',
    facebookUrl: '',
    bookingNotice: 'Your inquiry is not yet a confirmed booking. Our team will check the date and contact you.',
    mainLogoUrl: '',
    venueLogoUrl: '',
    cateringLogoUrl: '',
    restoLogoUrl: ''
  };
  Object.keys(defaults).forEach(function (key) { sheet.appendRow([key, defaults[key]]); });
}

function seedServices_(sheet) {
  if (readObjects_(sheet).length) return;
  const now = new Date();
  [
    {
      id: 'SVC-VENUE-001',
      business: 'BARikan Events Venue',
      name: 'Venue Package',
      price: '₱7,999',
      description: 'Fully consumable. Good for 4 hours, up to 80 pax, fully air-conditioned, sound system & lights, tables & chairs, unlimited videoke and waiter service.',
      order: 1
    },
    {
      id: 'SVC-CATER-001',
      business: "You're my BOSS Food and Catering Services",
      name: 'Event Catering',
      price: 'Ask for package rate',
      description: 'Food and catering service for birthdays, reunions, company gatherings and private celebrations.',
      order: 2
    },
    {
      id: 'SVC-RESTO-001',
      business: 'BOSS BARikan & Resto',
      name: 'After-Event Chill & Live Band',
      price: '',
      description: 'Eat, drink, relax and jam with live band entertainment after your event.',
      order: 3
    }
  ].forEach(function (item) {
    appendObjectRow_(sheet, {
      'Service ID': item.id,
      'Business': item.business,
      'Service Name': item.name,
      'Price': item.price,
      'Short Description': item.description,
      'Image URL': '',
      'Image File ID': '',
      'Active': 'TRUE',
      'Sort Order': item.order,
      'Created At': now,
      'Updated At': now
    });
  });
}

function seedMenuCategories_(sheet) {
  if (readObjects_(sheet).length) return;
  const now = new Date();
  [
    { id: 'CAT-MAIN', name: 'Main Dish', max: 2, order: 1 },
    { id: 'CAT-NOODLES', name: 'Noodles / Pasta', max: 1, order: 2 },
    { id: 'CAT-DESSERT', name: 'Dessert', max: 1, order: 3 }
  ].forEach(function (item) {
    appendObjectRow_(sheet, {
      'Category ID': item.id,
      'Category Name': item.name,
      'Max Selections': item.max,
      'Active': 'TRUE',
      'Sort Order': item.order,
      'Created At': now,
      'Updated At': now
    });
  });
}

// ============================= UPLOADS / UTILITIES =============================

function saveUpload_(fileData) {
  if (!fileData || !fileData.dataUrl) throw new Error('No image received.');
  const match = String(fileData.dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data.');

  const mimeType = match[1];
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].indexOf(mimeType) === -1) {
    throw new Error('Only JPG, PNG, WEBP or GIF images are allowed.');
  }

  const bytes = Utilities.base64Decode(match[2]);
  if (bytes.length > 8 * 1024 * 1024) throw new Error('Compressed image is too large. Maximum is 8 MB.');

  const name = cleanFilename_(fileData.name || ('upload-' + Date.now() + '.jpg'));
  const file = getUploadFolder_().createFile(Utilities.newBlob(bytes, mimeType, name));
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sharingError) {
    throw new Error('Image was uploaded but could not be made viewable by the website. Check Google Drive sharing restrictions.');
  }

  return {
    fileId: file.getId(),
    url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600'
  };
}

function getUploadFolder_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('UPLOAD_FOLDER_ID');
  if (savedId) {
    try { return DriveApp.getFolderById(savedId); } catch (error) {}
  }
  const folders = DriveApp.getFoldersByName(APP_CONFIG.UPLOAD_FOLDER);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(APP_CONFIG.UPLOAD_FOLDER);
  props.setProperty('UPLOAD_FOLDER_ID', folder.getId());
  return folder;
}

function createBookingId_() {
  const timezone = Session.getScriptTimeZone() || 'Asia/Manila';
  const dateKey = Utilities.formatDate(new Date(), timezone, 'yyyyMMdd');
  const props = PropertiesService.getScriptProperties();
  const propertyKey = 'BOOKING_SEQ_' + dateKey;
  const next = Number(props.getProperty(propertyKey) || 0) + 1;
  props.setProperty(propertyKey, String(next));
  return 'BRK-' + dateKey + '-' + String(next).padStart(3, '0');
}

function apiOutput_(data, callback) {
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(data) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlPostOutput_(message) {
  return HtmlService.createHtmlOutput('<!doctype html><html><body>' + clean_(message) + '</body></html>');
}

function parseJson_(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); }
  catch (error) { throw new Error('Invalid request payload.'); }
}

function hash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''))
    .map(function (byte) {
      const number = byte < 0 ? byte + 256 : byte;
      return ('0' + number.toString(16)).slice(-2);
    })
    .join('');
}

function sortByOrder_(a, b) {
  return numberOrZero_(a['Sort Order']) - numberOrZero_(b['Sort Order']);
}

function isTrue_(value) {
  return ['TRUE', 'YES', '1', 'ACTIVE'].indexOf(String(value || '').trim().toUpperCase()) !== -1;
}

function numberOrZero_(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function splitIds_(value) {
  return clean_(value).split(',').map(function (item) { return clean_(item); }).filter(function (item) { return item; });
}

function deleteRowsByField_(sheet, headerName, expectedValue) {
  const values = sheet.getDataRange().getDisplayValues();
  if (!values.length) return;
  const headers = values[0].map(clean_);
  const column = headers.indexOf(headerName);
  if (column === -1) return;
  for (let row = values.length - 1; row >= 1; row--) {
    if (clean_(values[row][column]) === clean_(expectedValue)) sheet.deleteRow(row + 1);
  }
}

function clean_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, 10000);
}

function cleanFilename_(value) {
  return String(value || 'upload').replace(/[^\w.\-() ]+/g, '_').slice(0, 120);
}
