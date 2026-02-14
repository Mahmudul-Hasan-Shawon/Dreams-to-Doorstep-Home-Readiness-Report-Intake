/** CONFIG: change to match your sheet */
const CONFIG = {
  SHEET_NAME: 'Form Responses 1', // your responses sheet name
  PORTAL_URL_COLUMN_HEADER: 'Portal URL', // exact header text
  ID_COLUMN_HEADER: 'Buyer Name', // or whatever uniquely identifies the client (can be non-unique; token fixes that)
  TIMEZONE: 'America/Chicago',
  SETTINGS_SHEET_NAME: 'Settings', // Settings sheet name for password storage
  DEFAULT_FORM_PASSWORD: 'Coach2024!' // Default password for form access
};

/** Util: get sheet and header map */
function getSheetAndHeaderMap_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) throw new Error(`Sheet not found: ${CONFIG.SHEET_NAME}`);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    map[h] = i; // header -> zero-based col index
  });
  return { sh, headers, map };
}

/** Settings management functions */


/**
 * Get setting value from Settings sheet
 * @param {string} settingName - The name of the setting to retrieve
 * @return {string|null} The setting value or null if not found
 */
function getSetting(settingName) {
  try {
    const ss = SpreadsheetApp.getActive();
    const settingsSheet = ss.getSheetByName(CONFIG.SETTINGS_SHEET_NAME);

    if (!settingsSheet) {
      console.log('Settings sheet not found, using default values');
      return settingName === 'FORM_PASSWORD' ? CONFIG.DEFAULT_FORM_PASSWORD :
        settingName === 'PASSWORD_ENABLED' ? 'TRUE' : null;
    }

    const data = settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 2).getValues();

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === settingName) {
        return data[i][1] ? data[i][1].toString() : null;
      }
    }

    // Return default values for known settings
    if (settingName === 'FORM_PASSWORD') return CONFIG.DEFAULT_FORM_PASSWORD;
    if (settingName === 'PASSWORD_ENABLED') return 'TRUE';

    return null;
  } catch (err) {
    console.error('Error getting setting ' + settingName + ':', err);
    return null;
  }
}

/**
 * Update setting value in Settings sheet
 * @param {string} settingName - The name of the setting to update
 * @param {string} settingValue - The new value for the setting
 * @return {boolean} Success status
 */
function updateSetting(settingName, settingValue) {
  try {
    const ss = SpreadsheetApp.getActive();
    const settingsSheet = ss.getSheetByName(CONFIG.SETTINGS_SHEET_NAME);

    if (!settingsSheet) {
      console.log('Settings sheet not found, initializing it first');
      initializeSettingsSheet();
      return updateSetting(settingName, settingValue); // Retry after initialization
    }

    const data = settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 4).getValues();

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === settingName) {
        // Update existing setting
        settingsSheet.getRange(i + 2, 2).setValue(settingValue);
        settingsSheet.getRange(i + 2, 4).setValue(new Date());
        return true;
      }
    }

    // Add new setting if not found
    const description = settingName === 'FORM_PASSWORD' ? 'Password for accessing Intake and Update forms' :
      settingName === 'PASSWORD_ENABLED' ? 'Enable or disable password protection for forms' :
        'Custom setting';
    settingsSheet.getRange(settingsSheet.getLastRow() + 1, 1, 1, 4).setValues([
      [settingName, settingValue, description, new Date()]
    ]);

    return true;
  } catch (err) {
    console.error('Error updating setting ' + settingName + ':', err);
    return false;
  }
}

/**
 * Check if password protection is enabled
 * @return {boolean} True if password protection is enabled
 */
function isPasswordProtectionEnabled() {
  const enabled = getSetting('PASSWORD_ENABLED');
  return enabled === 'TRUE' || enabled === 'true' || enabled === 'True';
}

/**
 * Validate form password
 * @param {string} password - The password to validate
 * @return {boolean} True if password is correct
 */
function validateFormPassword(password) {
  if (!isPasswordProtectionEnabled()) {
    return true; // Allow access if protection is disabled
  }

  const storedPassword = getSetting('FORM_PASSWORD');
  return password === storedPassword;
}

/**
 * Serve password prompt page
 * @param {string} formType - The type of form being accessed ('intake' or 'update')
 * @return {HtmlOutput} The password prompt HTML
 */
function servePasswordPrompt(formType) {
  let formName, formDescription;
  switch (formType) {
    case 'intake':
      formName = 'Intake Form';
      formDescription = 'New Buyer Application';
      break;
    case 'update':
      formName = 'Update Form';
      formDescription = 'Update Existing Buyer Information';
      break;
    default:
      formName = 'Form';
      formDescription = 'Form Access';
  }

  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Authentication Required - ${formName}</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-image: radial-gradient(rgb(11, 124, 142) 11.6%, transparent 11.6%);
            background-position: 4px 4px;
            background-size: 8px 8px;
            background-color: rgb(165 184 196);
          }
          .container {
            background: white;
            padding: 40px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 450px;
            width: 90%;
            text-align: center;
          }
          .lock-icon {
            font-size: 48px;
            color: #008c9a;
            margin-bottom: 20px;
          }
          h1 {
            color: #008c9a;
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: 700;
          }
          .form-description {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
            background: #f8f9fa;
            padding: 15px;
                        border-left: 4px solid #008c9a;
          }
          .form-group {
            margin-bottom: 20px;
            text-align: left;
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
          }
          input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
                        font-size: 16px;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }
          input[type="password"]:focus {
            outline: none;
            border-color: #008c9a;
            box-shadow: 0 0 0 3px rgba(0,140,154,0.1);
          }
          .btn {
            background: linear-gradient(135deg, #008c9a 0%, #006b74 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
                        font-weight: 600;
            display: inline-block;
            transition: transform 0.2s;
            border: none;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
          }
          .btn:hover {
            transform: translateY(-2px);
          }
          .btn-secondary {
            background: #6b7280;
            margin-top: 5px;
          }
          .btn-secondary:hover {
            transform: translateY(-2px);
          }
          .error-message {
            color: #dc2626;
            font-size: 14px;
            margin-top: 10px;
            padding: 10px;
            background: #fef2f2;
                        border: 1px solid #fecaca;
            display: none;
          }
          .back-link {
            color: #008c9a;
            text-decoration: none;
            font-size: 14px;
            display: inline-block;
            margin-top: 20px;
          }
          .back-link:hover {
            text-decoration: underline;
          }
          .password-toggle {
            display: flex;
            align-items: center;
            margin-top: 10px;
            font-size: 14px;
          }
          .password-toggle input {
            margin-right: 8px;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <div class="lock-icon">🔒</div>
          <h1>Authentication Required</h1>

          <div class="form-description">
            <strong>${formDescription}</strong><br>
            This form is restricted to authorized financial coaches only.
          </div>

          <form id="passwordForm">
            <div class="form-group">
              <label for="password">Enter Coach Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="Enter your password..."
              >
              <div class="password-toggle">
                <input type="checkbox" id="showPassword">
                <label for="showPassword">Show password</label>
              </div>
            </div>

            <button type="submit" class="btn">
              🔓 Access ${formName}
            </button>

            <div id="errorMessage" class="error-message">
              Invalid password. Please check your credentials and try again.
            </div>
          </form>

          <a href="?" class="back-link">← Back to Home</a>
        </div>

        <script>
          // Show/hide password functionality
          document.getElementById('showPassword').addEventListener('change', function() {
            const passwordField = document.getElementById('password');
            passwordField.type = this.checked ? 'text' : 'password';
          });

          // Form submission
          document.getElementById('passwordForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');

            // Check URL parameter for error
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('error') === 'true') {
              errorMessage.style.display = 'block';
            }

            // Redirect with password
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('password', password);
            currentUrl.searchParams.delete('error');
            window.location.href = currentUrl.toString();
          });
        </script>
      </body>
    </html>
  `).setTitle(`Authentication Required - ${formName}`).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Public endpoint: serves different content based on parameters */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


function doGet(e) {
  const token = (e.parameter && e.parameter.t) ? String(e.parameter.t) : '';

  // If token is provided, show client portal
  if (token) {
    const { sh, headers, map } = getSheetAndHeaderMap_();
    const data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();

    // Find the row by checking each row's timestamp against the provided token
    const timestampCol = map['Timestamp'];
    const portalCol = map[CONFIG.PORTAL_URL_COLUMN_HEADER];
    if (timestampCol == null) return HtmlService.createHtmlOutput('Timestamp column not found.');

    let rowObj = null;
    let foundToken = null;

    // First, try to find by matching tokens generated from timestamps
    for (let i = 0; i < data.length; i++) {
      const timestamp = data[i][timestampCol];
      if (timestamp) {
        const generatedToken = generateTokenFromTimestamp_(timestamp);
        if (generatedToken === token) {
          // Found matching row
          rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = data[i][idx];
          });

          // Generate/update portal URL if it doesn't exist
          const existingPortalUrl = data[i][portalCol];
          if (!existingPortalUrl) {
            const deploymentUrl = getDeploymentBaseUrl_();
            foundToken = `${deploymentUrl}?t=${encodeURIComponent(token)}`;
            // Update the sheet with the portal URL
            sh.getRange(i + 2, portalCol + 1).setValue(foundToken);
          }
          break;
        }
      }
    }

    // If not found by timestamp, try legacy method (check existing portal URLs)
    if (!rowObj && portalCol != null) {
      for (let i = 0; i < data.length; i++) {
        const urlCell = data[i][portalCol];
        if (urlCell && typeof urlCell === 'string' && urlCell.indexOf(token) !== -1) {
          // Build an object: header -> value
          rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = data[i][idx];
          });
          break;
        }
      }
    }

    if (!rowObj) return HtmlService.createHtmlOutput('<div style="text-align:center; padding:50px; font-family:Arial,sans-serif;"><h2>Portal Not Found</h2><p>The portal token you entered is invalid or expired.</p></div>');

    // Render the Page.html directly with client data
    const tpl = HtmlService.createTemplateFromFile('Page');
    tpl.client = rowObj;
    tpl.headers = headers;
    tpl.getWebAppUrl = getDeploymentBaseUrl_;
    const html = tpl.evaluate()
      .setTitle(`${rowObj[CONFIG.ID_COLUMN_HEADER] || 'Client'} Portal`)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return html;
  }

  // Default: show main dashboard with all forms
  try {
    const tpl = HtmlService.createTemplateFromFile('Dashboard');
    tpl.client = null;
    tpl.headers = [];
    tpl.isClientPortal = false;
    const html = tpl.evaluate()
      .setTitle('Homeownership Portal')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return html;
  } catch (err) {
    return HtmlService.createHtmlOutput('Error loading portal: ' + err.message);
  }
}

/** Installable trigger: run on form submit */
function onFormSubmit(e) {
  try {
    // e.range is the row that was appended
    const row = e.range.getRow();
    const { sh, headers, map } = getSheetAndHeaderMap_();

    // Get the timestamp from the new row and generate token
    const timestamp = sh.getRange(row, map['Timestamp'] + 1).getValue();
    const token = generateTokenFromTimestamp_(timestamp);
    const deploymentUrl = getDeploymentBaseUrl_(); // the web app base
    const portalUrl = `${deploymentUrl}?t=${encodeURIComponent(token)}`;

    // Write URL to the Portal URL column (create if missing)
    let portalColIndex = map[CONFIG.PORTAL_URL_COLUMN_HEADER];
    if (portalColIndex == null) {
      // add new column at the end if header missing
      sh.getRange(1, headers.length + 1).setValue(CONFIG.PORTAL_URL_COLUMN_HEADER);
      portalColIndex = headers.length; // zero-based
    }
    // Write the URL into the submitted row
    sh.getRange(row, portalColIndex + 1).setValue(portalUrl);

  } catch (err) {
    console.error(err);
  }
}

/** First-time helper: write URLs for existing rows (optional utility you can run manually) */
function backfillPortalUrlsForExistingRows() {
  const ui = SpreadsheetApp.getUi();

  // Get current Web App URL
  const currentUrl = getWebAppUrl();

  // Prompt for Web App URL
  const response = ui.prompt(
    'Backfill Portal URLs',
    `Current Web App URL: ${currentUrl || 'Not set'}\n\n` +
    'Enter Web App URL (ends with /exec):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    ui.alert('Operation cancelled');
    return;
  }

  const deploymentUrl = response.getResponseText().trim();

  // Validate the URL
  if (!deploymentUrl) {
    ui.alert('Please enter a valid Web App URL');
    return;
  }

  if (!deploymentUrl.endsWith('/exec')) {
    ui.alert('Web App URL must end with /exec');
    return;
  }

  // Save the URL to properties
  PropertiesService.getScriptProperties().setProperty('WEB_APP_URL', deploymentUrl);
  ui.alert('Web App URL saved! Now generating portal URLs...');

  const { sh, headers, map } = getSheetAndHeaderMap_();
  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    ui.alert('No data to update');
    return;
  }

  let portalColIndex = map[CONFIG.PORTAL_URL_COLUMN_HEADER];
  if (portalColIndex == null) {
    sh.getRange(1, headers.length + 1).setValue(CONFIG.PORTAL_URL_COLUMN_HEADER);
    portalColIndex = headers.length; // zero-based
  }

  const range = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn());
  const values = range.getValues();
  let updatedCount = 0;

  for (let i = 0; i < values.length; i++) {
    const timestamp = values[i][map['Timestamp']];
    if (timestamp) {
      const token = generateTokenFromTimestamp_(timestamp);
      const portalUrl = `${deploymentUrl}?t=${encodeURIComponent(token)}`;
      sh.getRange(i + 2, portalColIndex + 1).setValue(portalUrl);
      updatedCount++;
    }
  }

  ui.alert(`Successfully generated portal URLs for ${updatedCount} clients!`);
}

/** Helper function to generate token from timestamp */
function generateTokenFromTimestamp_(timestamp) {
  // Convert timestamp to milliseconds since epoch
  const ms = timestamp.getTime();
  // Convert to base36 and add row number for uniqueness
  const base36 = ms.toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base36}${randomSuffix}`;
}

/** Gets the base URL of the deployed Web App (latest deployment) */
function getDeploymentBaseUrl_() {
  // When you deploy the web app, copy the "Web app URL" and paste it here once.
  // Example:
  // return 'https://script.google.com/macros/s/AKfycbx...../exec';

  // To keep it simple and reliable, store it in a Script Property so you don't hardcode it.
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('WEB_APP_URL');
  if (!url) throw new Error('Set WEB_APP_URL in Script Properties to your deployed Web App URL.');
  return url;
}

/** Gets all buyers data for the datatable */
function getAllBuyersData() {
  try {
    const { sh, headers, map } = getSheetAndHeaderMap_();
    const data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();

    // Helper function to find column index (case-insensitive, trimmed)
    const findCol = function(columnName) {
      for (let i = 0; i < headers.length; i++) {
        if (headers[i] && headers[i].trim() === columnName.trim()) {
          return i;
        }
      }
      return -1;
    };

    // Helper to get value safely
    const getVal = function(row, columnName, defaultValue) {
      const idx = findCol(columnName);
      if (idx === -1) return defaultValue;
      const val = row[idx];
      return (val !== undefined && val !== '') ? val : defaultValue;
    };

    const buyers = [];

    data.forEach((row, index) => {
      const buyerName = getVal(row, 'Buyer Name', '');
      if (buyerName && buyerName.trim() !== '') {
        const timestamp = getVal(row, 'Timestamp', '');
        const portalUrl = getVal(row, CONFIG.PORTAL_URL_COLUMN_HEADER, '');

        // Extract token from existing portal URL
        let token = '';
        if (portalUrl && typeof portalUrl === 'string') {
          const urlMatch = portalUrl.match(/[?&]t=([^&]+)/);
          if (urlMatch && urlMatch[1]) {
            token = decodeURIComponent(urlMatch[1]);
          }
        }

        // If no portal URL, generate token from timestamp
        if (!token && timestamp) {
          token = generateTokenFromTimestamp_(timestamp);
        }

        console.log('Buyer:', buyerName, '- monthlyIncome:', getVal(row, 'Monthly Income (before taxes)', ''));

        buyers.push({
          rowIndex: index + 2,
          name: buyerName,
          buyerName: buyerName,
          email: getVal(row, 'Email Address', ''),
          phone: getVal(row, 'Phone Number', ''),
          creditScore: getVal(row, 'Credit Score', ''),
          monthlyIncome: getVal(row, 'Monthly Income (before taxes)', ''),
          currentDebt: getVal(row, 'Current Monthly Debt', ''),
          targetHomePrice: getVal(row, 'Target Home Price', ''),
          estimatedMortgage: getVal(row, 'Estimated Monthly Payment (PITI)', ''),
          coachNotes: getVal(row, 'Notes or Coaching Comments', ''),
          startDate: getVal(row, 'Start Date', '') ? formatDateForDisplay_(getVal(row, 'Start Date', '')) : '',
          timestamp: timestamp ? formatDateForDisplay_(timestamp) : '',
          readinessScore: getVal(row, 'Readiness Score', 0),
          summary: getVal(row, 'Summary / Recommendations', ''),
          progressBar: getVal(row, 'Progress Bar', ''),
          token: token,
          portalUrl: portalUrl || ''
        });
      }
    });

    console.log('getAllBuyersData returning', buyers.length, 'buyers');
    console.log('First buyer:', buyers.length > 0 ? JSON.stringify(buyers[0]) : 'No buyers');

    return {
      success: true,
      buyers: buyers,
      headers: ['Buyer Name', 'Email Address', 'Phone Number', 'Credit Score', 'Start Date', 'Timestamp', 'Token', 'Actions']
    };
  } catch (err) {
    console.error('Error getting buyers data:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/** Format date for display */
function formatDateForDisplay_(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

/** Test function to verify google.script.run works */
function testFunction() {
  return { success: true, message: 'Test function works!' };
}

/** Check if token exists in Portal URLs - ultra simple version */
function checkPortalUrlsSimple(token) {
  console.log('checkPortalUrlsSimple - token:', token);

  try {
    const sheetData = getSheetAndHeaderMap_();
    const data = sheetData.sh.getRange(2, 1, sheetData.sh.getLastRow() - 1, sheetData.sh.getLastColumn()).getValues();
    const portalCol = sheetData.map[CONFIG.PORTAL_URL_COLUMN_HEADER];

    let found = false;
    for (let i = 0; i < data.length; i++) {
      const url = data[i][portalCol];
      if (url && url.indexOf && url.indexOf(token) > -1) {
        found = true;
        break;
      }
    }

    return {
      success: true,
      found: found,
      token: token,
      totalRows: data.length
    };
  } catch (e) {
    return {
      success: false,
      error: e.toString(),
      token: token
    };
  }
}

/** WORKING WRAPPER - Gets full client data for a found token */
function getClientDataForTokenWrapper(token) {
  console.log('=== getClientDataForTokenWrapper (WORKING) ===');
  console.log('Token:', token);

  try {
    // This is essentially the same as the working getClientDataForToken function
    // but kept separate for clarity

    // Validate token
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    // Get sheet data
    const { sh, headers, map } = getSheetAndHeaderMap_();
    const data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    const portalCol = map[CONFIG.PORTAL_URL_COLUMN_HEADER];

    // Search through existing portal URLs ONLY (this works!)
    for (let i = 0; i < data.length; i++) {
      const urlCell = data[i][portalCol];
      const buyerName = data[i][map['Buyer Name']];

      if (urlCell && typeof urlCell === 'string' && urlCell.indexOf(token) !== -1) {
        console.log('Found token for buyer:', buyerName, 'at row', i);

        // Build client data object with safe serialization
        const clientData = {};
        headers.forEach((h, idx) => {
          const value = data[i][idx];
          // Convert values to safe types for google.script.run
          if (value === null || value === undefined) {
            clientData[h] = '';
          } else if (value instanceof Date) {
            // Convert dates to ISO string
            clientData[h] = value.toISOString();
          } else if (typeof value === 'object') {
            // Convert objects to JSON string
            try {
              clientData[h] = JSON.stringify(value);
            } catch (e) {
              clientData[h] = String(value);
            }
          } else {
            clientData[h] = String(value);
          }
        });

        console.log('=== getClientDataForTokenWrapper SUCCESS ===');
        console.log('Client data keys:', Object.keys(clientData));
        console.log('Number of headers:', headers.length);

        // Clean headers array to ensure all are strings
        const cleanHeaders = headers.map(h => String(h || ''));

        // Try returning a simpler response first to test
        const result = {
          success: true,
          clientData: clientData,
          headers: cleanHeaders
        };

        // Stringify and parse to test serialization
        try {
          const testString = JSON.stringify(result);
          console.log('Result serialization test - length:', testString.length);
          if (testString.length > 900000) {
            console.warn('Response may be too large for google.script.run (approaching 1MB limit)');
          }
        } catch (e) {
          console.error('Result serialization failed:', e);
        }

        return result;
      }
    }

    console.log('Token not found in any portal URL');
    return {
      success: false,
      error: 'Token not found. Use Portal Admin > Regenerate All Portal URLs.',
      debug: { tokenSearched: token }
    };

  } catch (err) {
    console.error('Error in getClientDataForTokenWrapper:', err);
    return { success: false, error: 'Error: ' + err.message };
  }
}

/** Get client data for a specific token - SIMPLIFIED WORKING VERSION */
function getClientDataForToken(token) {
  console.log('=== getClientDataForToken (WORKING) START ===');
  console.log('Token:', token);

  try {
    // Validate token
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    // Get sheet data
    const { sh, headers, map } = getSheetAndHeaderMap_();
    const data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    const portalCol = map[CONFIG.PORTAL_URL_COLUMN_HEADER];

    console.log('Searching', data.length, 'rows for token...');

    // Search through existing portal URLs ONLY (this works!)
    for (let i = 0; i < data.length; i++) {
      const urlCell = data[i][portalCol];
      const buyerName = data[i][map['Buyer Name']];

      if (urlCell && typeof urlCell === 'string' && urlCell.indexOf(token) !== -1) {
        console.log('Found token for buyer:', buyerName, 'at row', i);

        // Build client data object with safe serialization
        const clientData = {};
        headers.forEach((h, idx) => {
          const value = data[i][idx];
          // Convert values to safe types for google.script.run
          if (value === null || value === undefined) {
            clientData[h] = '';
          } else if (value instanceof Date) {
            // Convert dates to ISO string
            clientData[h] = value.toISOString();
          } else if (typeof value === 'object') {
            // Convert objects to JSON string
            try {
              clientData[h] = JSON.stringify(value);
            } catch (e) {
              clientData[h] = String(value);
            }
          } else {
            clientData[h] = String(value);
          }
        });

        console.log('=== getClientDataForToken SUCCESS ===');
        return {
          success: true,
          clientData: clientData,
          headers: headers
        };
      }
    }

    console.log('Token not found in any portal URL');
    return {
      success: false,
      error: 'Token not found. Use Portal Admin > Regenerate All Portal URLs.',
      debug: { tokenSearched: token }
    };

  } catch (err) {
    console.error('Error in getClientDataForToken:', err);
    return { success: false, error: 'Error: ' + err.message };
  }
}

/** Old Get client data for a specific token (DEPRECATED - DUPLICATE REMOVED) */

/** Server-side function to handle intake form submission */
function handleIntake(formData) {
  try {
    const { sh, headers, map } = getSheetAndHeaderMap_();

    // Create new row with all form data to match existing sheet structure
    const newRow = new Array(headers.length).fill('');

    // Map form data to existing column structure (A:V)
    newRow[map['Timestamp']] = new Date(); // Column A
    newRow[map['Buyer Name']] = formData.buyerName; // Column B
    newRow[map['Start Date']] = new Date(); // Column C
    newRow[map['Credit Score']] = formData.creditScore; // Column H
    newRow[map['Monthly Income (before taxes)']] = formData.monthlyIncome; // Column I
    newRow[map['Current Monthly Debt']] = formData.currentDebt; // Column K
    newRow[map['Target Home Price']] = formData.targetHomePrice; // Column L
    newRow[map['Estimated Monthly Payment (PITI)']] = formData.estimatedMortgage; // Column M
    newRow[map['Notes or Coaching Comments']] = formData.coachNotes; // Column O

    // Add the row to the sheet - formulas in columns N, Q, R, S, T, U will automatically calculate
    const row = sh.getLastRow() + 1;
    sh.getRange(row, 1, 1, headers.length).setValues([newRow]);

    // Copy down formulas for the new row (to maintain existing calculations)
    copyFormulasToNewRow_(sh, row);

    // Generate portal URL using the timestamp from the new row
    const timestamp = newRow[map['Timestamp']];
    const token = generateTokenFromTimestamp_(timestamp);
    const deploymentUrl = getDeploymentBaseUrl_();
    const portalUrl = `${deploymentUrl}?t=${encodeURIComponent(token)}`;

    // Write portal URL to column V
    if (map[CONFIG.PORTAL_URL_COLUMN_HEADER] !== undefined) {
      sh.getRange(row, map[CONFIG.PORTAL_URL_COLUMN_HEADER] + 1).setValue(portalUrl);
    }

    return {
      success: true,
      portalUrl: portalUrl,
      buyerName: formData.buyerName,
      rowIndex: row
    };

  } catch (err) {
    console.error('Error in handleIntake:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/** Helper function to copy formulas to new row */
function copyFormulasToNewRow_(sh, newRow) {
  try {
    // Define which columns have formulas that need to be copied
    const formulaColumns = {
      'Total Back End': 'N', // Column N formula: =K+M
      'Total Monthly Debt': 'P', // Column P (currently empty, but might have formulas)
      'Readiness Score': 'S', // Column S has complex formula
      'Summary / Recommendations': 'T', // Column T has formula
      'Progress Bar': 'U', // Column U has formula with emojis
      'Portal URL': 'V' // Column V will be set by our code
    };

    // Get formulas from a row above (row 2 if available, otherwise skip formula copying)
    const sourceRow = sh.getLastRow() > 1 ? 2 : null;

    if (sourceRow) {
      const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

      Object.entries(formulaColumns).forEach(([headerName, colLetter]) => {
        const colIndex = headers.indexOf(headerName);
        if (colIndex !== -1) {
          try {
            const sourceCell = sh.getRange(sourceRow, colIndex + 1);
            const formula = sourceCell.getFormula();
            if (formula && formula.startsWith('=')) {
              sh.getRange(newRow, colIndex + 1).setFormula(formula);
            }
          } catch (e) {
            // Skip if formula copying fails for this cell
            console.log(`Could not copy formula for ${headerName}: ${e.message}`);
          }
        }
      });
    }
  } catch (err) {
    console.log('Warning: Could not copy formulas to new row: ' + err.message);
  }
}

/** Server-side function to handle update form submission */
function handleUpdate(formData) {
  try {
    const { sh, headers, map } = getSheetAndHeaderMap_();

    const rowIndex = formData.rowIndex;

    // Update the existing row with matching column structure
    const updates = [
      ['Credit Score', formData.creditScore],
      ['Monthly Income (before taxes)', formData.monthlyIncome],
      ['Current Monthly Debt', formData.currentDebt],
      ['Target Home Price', formData.targetHomePrice],
      ['Estimated Monthly Payment (PITI)', formData.estimatedMortgage],
      ['Notes or Coaching Comments', formData.coachNotes]
    ];

    updates.forEach(([header, value]) => {
      const colIndex = map[header];
      if (colIndex !== undefined) {
        sh.getRange(rowIndex, colIndex + 1).setValue(value);
      }
    });

    // Recalculate formulas by forcing recalculation
    // Clear and re-set the formula cells to trigger recalculation
    const formulaCells = ['Total Back End', 'Readiness Score', 'Summary / Recommendations', 'Progress Bar'];
    formulaCells.forEach(headerName => {
      const colIndex = map[headerName];
      if (colIndex !== undefined) {
        const cell = sh.getRange(rowIndex, colIndex + 1);
        const formula = cell.getFormula();
        if (formula && formula.startsWith('=')) {
          // Clear and re-set the formula to force recalculation
          cell.setValue('');
          cell.setFormula(formula);
        }
      }
    });

    // Get portal URL
    const portalUrl = sh.getRange(rowIndex, map[CONFIG.PORTAL_URL_COLUMN_HEADER] + 1).getValue();

    return {
      success: true,
      portalUrl: portalUrl
    };

  } catch (err) {
    console.error('Error in handleUpdate:', err);
    return {
      success: false,
      error: err.message
    };
  }
}



/** Verify Admin PIN for authentication */
function verifyAdminPin(pin) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');

    if (!settingsSheet) {
      return { success: false, error: 'Settings sheet not found' };
    }

    const storedPin = settingsSheet.getRange('B1').getValue();

    if (!storedPin || storedPin.toString().trim() === '') {
      return { success: false, error: 'Admin PIN not configured in Settings sheet' };
    }

    const isValid = pin.toString().trim() === storedPin.toString().trim();

    return {
      success: isValid,
      error: isValid ? null : 'Invalid PIN'
    };

  } catch (err) {
    console.error('Error verifying Admin PIN:', err);
    return {
      success: false,
      error: 'System error verifying PIN'
    };
  }
}

/** Check if password protection is enabled */
function isPasswordProtectionEnabled() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');

    if (!settingsSheet) {
      return true; // Default to enabled if settings sheet doesn't exist
    }

    const enabled = settingsSheet.getRange('B2').getValue();
    return enabled !== 'FALSE'; // Default to enabled if not explicitly set to FALSE

  } catch (err) {
    console.error('Error checking password protection:', err);
    return true; // Default to enabled on error
  }
}

function getBuyers() {
  try {
    console.log('getBuyers() function called');
    const { sh, headers, map } = getSheetAndHeaderMap_();
    const lastRow = sh.getLastRow();

    console.log('Sheet name:', CONFIG.SHEET_NAME);
    console.log('Headers found:', headers);
    console.log('Last row:', lastRow);
    console.log('Map object:', map);

    if (lastRow < 2) {
      return { success: true, buyers: [] };
    }

    const data = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
    const buyers = [];

    // Helper function to find column index (case-insensitive, trimmed)
    const findColumnIndex = function(columnName) {
      for (let i = 0; i < headers.length; i++) {
        if (headers[i] && headers[i].trim() === columnName.trim()) {
          return i;
        }
      }
      return -1; // Not found
    };

    // Helper function to safely get row data by column name
    const getRowValue = function(row, columnName, defaultValue) {
      const colIndex = findColumnIndex(columnName);
      if (colIndex === -1) {
        console.log('Column "' + columnName + '" not found in headers');
        return defaultValue;
      }
      const value = row[colIndex];
      console.log('Column "' + columnName + '" (index ' + colIndex + '): ' + JSON.stringify(value));
      return value !== undefined ? value : defaultValue;
    };

    data.forEach((row, index) => {
      const buyerName = getRowValue(row, 'Buyer Name', '');
      console.log('Processing row ' + (index + 2) + ': ' + buyerName);

      if (buyerName && buyerName.trim() !== '') {
        const buyer = {
          rowIndex: index + 2,
          name: buyerName,
          buyerName: buyerName,
          creditScore: getRowValue(row, 'Credit Score', ''),
          monthlyIncome: getRowValue(row, 'Monthly Income (before taxes)', ''),
          currentDebt: getRowValue(row, 'Current Monthly Debt', ''),
          targetHomePrice: getRowValue(row, 'Target Home Price', ''),
          estimatedMortgage: getRowValue(row, 'Estimated Monthly Payment (PITI)', ''),
          coachNotes: getRowValue(row, 'Notes or Coaching Comments', ''),
          readinessScore: getRowValue(row, 'Readiness Score', 0),
          summary: getRowValue(row, 'Summary / Recommendations', ''),
          progressBar: getRowValue(row, 'Progress Bar', ''),
          startDate: getRowValue(row, 'Start Date', ''),
          portalUrl: getRowValue(row, 'Portal URL', '')
        };
        console.log('Final buyer object:', JSON.stringify(buyer));
        buyers.push(buyer);
      }
    });

    console.log('Found buyers:', buyers.length);
    return { success: true, buyers: buyers };

  } catch (err) {
    console.error('Error in getBuyers:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/** Get loan program requirements from Loan Planner sheet */
function getLoanProgramsFromPlanner_() {
  try {
    const ss = SpreadsheetApp.getActive();
    const loanPlannerSheet = ss.getSheetByName('Loan Planner');

    if (!loanPlannerSheet) {
      console.log('Loan Planner sheet not found');
      return [];
    }

    // Get data from Loan Planner sheet (skip header row)
    const lastRow = loanPlannerSheet.getLastRow();
    if (lastRow < 2) {
      console.log('Loan Planner sheet is empty');
      return [];
    }

    // Read data from columns A, B, C
    const dataRange = loanPlannerSheet.getRange(2, 1, lastRow - 1, 3);
    const data = dataRange.getValues();

    // Transform data into loan program objects
    const loanPrograms = data.map((row, index) => {
      const name = row[0] ? row[0].toString().trim() : '';
      const maxDTI = row[1] ? parseFloat(row[1]) : 0;
      const minCreditScore = row[2] ? parseInt(row[2]) : 0;

      // Skip empty rows
      if (!name || !maxDTI || !minCreditScore) {
        return null;
      }

      return {
        name: name,
        maxDTI: maxDTI,
        minCreditScore: minCreditScore
      };
    }).filter(program => program !== null); // Remove null entries

    return loanPrograms;

  } catch (err) {
    console.error('Error reading Loan Planner sheet:', err);
    return [];
  }
}

/** Get appropriate icon for loan program */
function getLoanIcon_(loanName) {
  const name = loanName.toLowerCase();
  if (name.includes('solution')) return '⭐';
  if (name.includes('naf') || name.includes('pathway')) return '🛤️';
  if (name.includes('hope')) return '🤝';
  if (name.includes('fha')) return '🏛️';
  if (name.includes('va')) return '🎖️';
  if (name.includes('usda')) return '🌾';
  if (name.includes('conventional')) return '🏠';
  return '🏠';
}


/** Generate loan program readiness scores for client portal */
function generateLoanScores(client) {
  try {
    // Extract client data
    const creditScore = parseInt(client['Credit Score']) || 0;
    const monthlyIncome = parseFloat(client['Monthly Income (before taxes)']) || 0;
    const currentDebt = parseFloat(client['Current Monthly Debt']) || 0;
    const estimatedMortgage = parseFloat(client['Estimated Monthly Payment (PITI)']) || 0;
    const targetHomePrice = parseFloat(client['Target Home Price']) || 0;

    // Calculate DTI ratio
    const totalMonthlyDebt = currentDebt + estimatedMortgage;
    const dtiRatio = monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) : 1.0;

    // Get loan programs from Loan Planner sheet
    const loanPrograms = getLoanProgramsFromPlanner_();

    // Calculate scores for all programs
    const loanScores = loanPrograms.map(program => {
      const scoreData = calculateReadinessScore(creditScore, dtiRatio, targetHomePrice, program);
      const scoreClass = scoreData.total >= 80 ? 'excellent' : scoreData.total >= 60 ? 'good' : 'challenging';
      const label = scoreData.total >= 80 ? 'Excellent Match' : scoreData.total >= 60 ? 'Good Candidate' : 'Needs Improvement';

      return {
        ...program,
        ...scoreData,
        scoreClass,
        label,
        description: `DTI limit: ${Math.round(program.maxDTI * 100)}%, Min Credit: ${program.minCreditScore}`,
        requirements: {
          credit: program.minCreditScore,
          dti: Math.round(program.maxDTI * 100)
        }
      };
    });

    // Generate HTML for tabular view
    let html = `
      <div class="loan-scores-table-container">
        <div class="table-wrapper">
          <table class="loan-scores-table">
            <thead>
              <tr>
                <th>Loan Program</th>
                <th>Total Score</th>
                <th>Credit Score</th>
                <th>DTI</th>
                <th>Status</th>
                <th>Requirements</th>
              </tr>
            </thead>
            <tbody>
    `;

    loanScores.forEach(loan => {
      html += `
        <tr class="loan-score-row">
          <td class="loan-name-cell">
            <div class="loan-details">
              <div class="loan-title">${loan.name}</div>
              <div class="loan-description">${loan.description}</div>
            </div>
          </td>
          <td class="total-score-cell">
            <div class="score-circle ${loan.scoreClass}">
              <span class="score-number">${loan.total}</span>
              <span class="score-max">/100</span>
            </div>
          </td>
          <td class="score-breakdown-cell">
            <div class="breakdown-item">
              <span class="breakdown-value">${loan.credit}</span>
              <span class="breakdown-max">/50</span>
            </div>
            <div class="breakdown-label">Credit</div>
          </td>
          <td class="score-breakdown-cell">
            <div class="breakdown-item">
              <span class="breakdown-value">${loan.dti}</span>
              <span class="breakdown-max">/50</span>
            </div>
            <div class="breakdown-label">DTI</div>
          </td>
          <td class="status-cell">
            <div class="status-badge ${loan.scoreClass}">${loan.label}</div>
          </td>
          <td class="requirements-cell">
            <div class="requirement-item">
              <i class="fas fa-credit-card"></i>
              <span>${loan.requirements.credit}+ credit</span>
            </div>
            <div class="requirement-item">
              <i class="fas fa-percentage"></i>
              <span>&lt;${loan.requirements.dti}% DTI</span>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>

        <div class="scores-summary">
          <div class="summary-item">
            <div class="summary-label">Your Credit Score</div>
            <div class="summary-value credit-value">${creditScore}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Your DTI Ratio</div>
            <div class="summary-value dti-value">${Math.round(dtiRatio * 100)}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Monthly Income</div>
            <div class="summary-value income-value">$${Math.round(monthlyIncome).toLocaleString()}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Monthly Debt</div>
            <div class="summary-value debt-value">$${Math.round(totalMonthlyDebt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    `;

    return html;

  } catch (err) {
    console.error('Error generating loan scores:', err);
    return '<div class="loan-scores-table-container"><p style="text-align: center; color: var(--text-secondary);">Loan readiness scores temporarily unavailable.</p></div>';
  }
}

/** Calculate readiness score for a specific loan program using weighted scoring */
function calculateReadinessScore(creditScore, dtiRatio, targetHomePrice, program) {
  // Credit Score Component (0-50 points)
  // If credit score is below program minimum, ZERO points (failing).
  // Otherwise, scale linearly from minimum (50 pts) to excellent (50 pts).
  let creditPoints = 0;

  if (creditScore < program.minCreditScore) {
    // Credit score below minimum - FAILING, zero points
    creditPoints = 0;
  } else {
    // Credit score meets minimum - award 50 points (they qualify)
    // Bonus for having excellent credit well above the minimum
    const creditBuffer = creditScore - program.minCreditScore; // How far above minimum
    const maxBuffer = 850 - program.minCreditScore; // Maximum possible buffer (at 850)
    if (maxBuffer > 0) {
      // Give up to 10 bonus points for having excellent credit
      const bonusPoints = (creditBuffer / maxBuffer) * 10;
      creditPoints = 50 + bonusPoints;
    } else {
      creditPoints = 50;
    }
  }
  creditPoints = Math.max(0, Math.min(50, creditPoints));

  // DTI Component (0-50 points)
  // If DTI exceeds program max, ZERO points (failing).
  // Otherwise, scale linearly: maxDTI = 50 points (passing), 0% DTI = 50 points (excellent)
  let dtiPoints = 0;

  if (dtiRatio > program.maxDTI) {
    // DTI exceeds maximum - FAILING, zero points
    dtiPoints = 0;
  } else {
    // DTI is within acceptable range - award 50 points (they qualify)
    // Bonus for having DTI well below the limit
    const dtiBuffer = program.maxDTI - dtiRatio; // How far under the limit
    const maxBuffer = program.maxDTI; // Maximum possible buffer (at 0% DTI)
    if (maxBuffer > 0) {
      // Give up to 10 bonus points for having low DTI
      const bonusPoints = (dtiBuffer / maxBuffer) * 10;
      dtiPoints = 50 + bonusPoints;
    } else {
      dtiPoints = 50;
    }
  }
  dtiPoints = Math.max(0, Math.min(50, dtiPoints));

  // Total Score (0-100 points)
  const totalScore = creditPoints + dtiPoints;

  return {
    total: Math.round(totalScore),
    credit: Math.round(creditPoints),
    dti: Math.round(dtiPoints),
    breakdown: {
      credit: Math.round(creditPoints) + '/50 pts',
      dti: Math.round(dtiPoints) + '/50 pts',
      details: `Credit: ${creditScore} (Req: ${program.minCreditScore}+), DTI: ${Math.round(dtiRatio * 100)}% (Max: ${Math.round(program.maxDTI * 100)}%)`
    }
  };
}

/** Get the current deployed web app URL for client-side use */
function getWebAppUrl() {
  try {
    return getDeploymentBaseUrl_();
  } catch (err) {
    console.error('Error getting web app URL:', err);
    return '';
  }
}



/** Menu to help set Script Property once */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Portal Admin')
    .addItem('Backfill Portal URLs', 'backfillPortalUrlsForExistingRows')
    .addToUi();
}


/**
 * Public function to get loan programs from the Loan Planner sheet
 * @return {Array<Array>} Array of loan programs with their details
 */
function getLoanProgramsFromPlanner() {
  return getLoanProgramsFromPlanner_();
}
