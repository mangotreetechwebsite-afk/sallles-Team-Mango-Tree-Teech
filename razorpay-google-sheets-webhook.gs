/**
 * ====================================================================
 * NEW VASTUWHEELS - RAZORPAY WEBHOOK + WATI AUTOMATION (Code.gs)
 * ====================================================================
 * 
 * INSTRUCTIONS FOR YOUR NEW GOOGLE SHEET:
 * 1. Open your NEW Google Sheet -> Extensions -> Apps Script.
 * 2. Delete all code inside `Code.gs` and paste THIS EXACT CODE.
 * 3. Click Save (Ctrl + S).
 * 4. Select `setupSheetHeaders` from top toolbar and click 'Run' ONCE to create Tab headers.
 * 5. Click 'Deploy' -> 'New deployment' -> Select type 'Web app':
 *    - Execute as: 'Me'
 *    - Who has access: 'Anyone'
 *    - Click 'Deploy' and copy the Web App URL into Razorpay Webhook Dashboard!
 * 6. FOR AUTOMATIC WHATSAPP MESSAGES:
 *    - Click Clock icon ⏰ (Triggers) on left sidebar -> 'Add Trigger'.
 *    - Choose function: `sendPendingWatiMessages`
 *    - Select event source: 'Time-driven' -> 'Minutes timer' -> 'Every 1 minute'.
 *    - Click 'Save'!
 */

// WATI CREDENTIALS
var WATI_ENDPOINT = "https://live-mt-server.wati.io/10159161";
var ACCESS_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImVjb212YXN0dXNoaWtoYXJAZ21haWwuY29tIiwibmFtZWlkIjoiZWNvbXZhc3R1c2hpa2hhckBnbWFpbC5jb20iLCJlbWFpbCI6ImVjb212YXN0dXNoaWtoYXJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDcvMjkvMjAyNiAwOToyNzoyNyIsInRlbmFudF9pZCI6IjEwMTU5MTYxIiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.f33jZejei1JQ1rOi5LYcP26uxpu5YSmej5mztZqLN_w";
var TEMPLATE_NAME = "vastu_wheels_report";

// 1. ONE-CLICK AUTOMATIC HEADERS SETUP FOR 2 TABS
function setupSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // TAB 1: 996 Payments (7 Clean Columns)
  var sheet996 = ss.getSheetByName("996 Payments");
  if (!sheet996) {
    sheet996 = ss.insertSheet("996 Payments");
  }
  
  var headers996 = [
    "Date & Time",            // Col 1 (A)
    "Unique Customer ID",     // Col 2 (B)
    "Payment ID",             // Col 3 (C)
    "Amount (INR)",           // Col 4 (D)
    "Full Name",              // Col 5 (E)
    "WhatsApp Phone Number",  // Col 6 (F)
    "Wati Status"             // Col 7 (G)
  ];
  
  sheet996.getRange(1, 1, 1, headers996.length).setValues([headers996]);
  var headerRange996 = sheet996.getRange(1, 1, 1, headers996.length);
  headerRange996.setFontWeight("bold");
  headerRange996.setBackground("#ea580c");
  headerRange996.setFontColor("#ffffff");
  headerRange996.setHorizontalAlignment("center");
  sheet996.setFrozenRows(1);

  // TAB 2: Popup Sheet (8 Clean Columns for Upgrade Payments)
  var sheetPopup = ss.getSheetByName("Popup Sheet");
  if (!sheetPopup) {
    sheetPopup = ss.insertSheet("Popup Sheet");
  }

  var headersPopup = [
    "Date & Time",            // Col 1 (A)
    "Unique Customer ID",     // Col 2 (B)
    "Payment ID",             // Col 3 (C)
    "Amount (INR)",           // Col 4 (D)
    "Full Name",              // Col 5 (E)
    "WhatsApp Phone Number",  // Col 6 (F)
    "Original Payment ID",    // Col 7 (G)
    "Wati Status"             // Col 8 (H)
  ];

  sheetPopup.getRange(1, 1, 1, headersPopup.length).setValues([headersPopup]);
  var headerRangePopup = sheetPopup.getRange(1, 1, 1, headersPopup.length);
  headerRangePopup.setFontWeight("bold");
  headerRangePopup.setBackground("#25d366");
  headerRangePopup.setFontColor("#ffffff");
  headerRangePopup.setHorizontalAlignment("center");
  sheetPopup.setFrozenRows(1);
}

// 2. RAZORPAY WEBHOOK RECEIVER FUNCTION
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = JSON.parse(e.postData.contents);
    
    var payment = postData.payload && postData.payload.payment ? postData.payload.payment.entity : {};
    var notes = payment.notes || {};

    var rawAmount = payment.amount ? payment.amount / 100 : 996;
    var formattedDate = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy HH:mm:ss");
    var paymentId = payment.id || "N/A";
    var uniqueCustomerId = notes.unique_customer_id || "VW-" + Math.floor(10000000 + Math.random() * 90000000);

    var fullName = notes.full_name || notes.customer_name || "Valued Customer";
    if (fullName === payment.contact || /^\+?\d{10,12}$/.test(fullName.trim())) {
      fullName = "Valued Customer";
    }

    var phone = notes.phone_number || payment.contact || "N/A";

    var isPopupUpgrade = (
      (notes.payment_type && notes.payment_type.indexOf("upgrade") !== -1) ||
      notes.upgrade_type === "VIP 1-on-1 Consultation" ||
      notes.upgrade_type === "1-on-1 Consultation" ||
      (notes.original_payment_id && notes.original_payment_id !== "N/A") ||
      rawAmount >= 1500
    );

    if (isPopupUpgrade) {
      // TAB 2: Popup Sheet (Col 8 H = Wati Status)
      var sheetPopup = ss.getSheetByName("Popup Sheet");
      if (!sheetPopup) {
        setupSheetHeaders();
        sheetPopup = ss.getSheetByName("Popup Sheet");
      }

      var originalPaymentId = notes.original_payment_id || "N/A";

      sheetPopup.appendRow([
        formattedDate,
        uniqueCustomerId,
        paymentId,
        rawAmount.toFixed(2),
        fullName,
        phone,
        originalPaymentId,
        "PENDING"
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", tab: "Popup Sheet", unique_customer_id: uniqueCustomerId }))
        .setMimeType(ContentService.MimeType.JSON);

    } else {
      // TAB 1: 996 Payments (Col 7 G = Wati Status)
      var sheet996 = ss.getSheetByName("996 Payments");
      if (!sheet996) {
        setupSheetHeaders();
        sheet996 = ss.getSheetByName("996 Payments");
      }

      sheet996.appendRow([
        formattedDate,
        uniqueCustomerId,
        paymentId,
        rawAmount.toFixed(2),
        fullName,
        phone,
        "PENDING"
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", tab: "996 Payments", unique_customer_id: uniqueCustomerId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. STANDALONE WATI WHATSAPP SENDER FUNCTION (RUN VIA TIMER TRIGGER)
function sendPendingWatiMessages() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Tab 1: 996 Payments -> Col D=Amount(4), Col E=Name(5), Col F=Phone(6), Col G=Wati Status(7)
  var sheet996 = ss.getSheetByName("996 Payments");
  if (sheet996) {
    processSheetWati(sheet996, 5, 4, 6, 7);
  }

  // Tab 2: Popup Sheet -> Col D=Amount(4), Col E=Name(5), Col F=Phone(6), Col H=Wati Status(8)
  var sheetPopup = ss.getSheetByName("Popup Sheet");
  if (sheetPopup) {
    processSheetWati(sheetPopup, 5, 4, 6, 8);
  }
}

// Helper Function: Process Sheet Rows for WATI WhatsApp Message
function processSheetWati(sheet, nameColIndex, amountColIndex, phoneColIndex, statusColIndex) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  var values = dataRange.getValues();

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var currentStatus = String(row[statusColIndex - 1]).trim();

    // Process rows marked PENDING, FAILED, or empty
    if (currentStatus === "PENDING" || currentStatus.indexOf("FAILED") === 0 || currentStatus === "") {
      var fullName = String(row[nameColIndex - 1]).trim() || "Valued Customer";
      var amount = String(row[amountColIndex - 1]).trim() || "996";
      var rawPhone = String(row[phoneColIndex - 1]).trim();

      // Clean phone number format (e.g., 917217697887)
      var cleanPhone = rawPhone.replace(/[^0-9]/g, "");
      if (cleanPhone.length === 10) {
        cleanPhone = "91" + cleanPhone;
      }

      if (!cleanPhone || cleanPhone.length < 10) {
        sheet.getRange(i + 2, statusColIndex).setValue("FAILED: Invalid Phone");
        continue;
      }

      var result = callWatiApiExact(cleanPhone, fullName, amount);

      if (result.success) {
        sheet.getRange(i + 2, statusColIndex).setValue("SENT");
      } else {
        sheet.getRange(i + 2, statusColIndex).setValue("FAILED: " + result.error);
      }
    }
  }
}

// Helper Function: Exact WATI API Request matching {{full_name}} and {{amount_inr}}
function callWatiApiExact(whatsappNumber, fullName, amount) {
  try {
    var url = WATI_ENDPOINT + "/api/v1/sendTemplateMessage?whatsappNumber=" + whatsappNumber;

    // EXACT variable parameters from your WATI Dashboard Template: {{full_name}} and {{amount_inr}}
    var payload = {
      template_name: TEMPLATE_NAME,
      broadcast_name: "vastu_wheels_report",
      parameters: [
        { name: "full_name", value: String(fullName) },
        { name: "amount_inr", value: String(amount) }
      ]
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": ACCESS_TOKEN
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var resCode = response.getResponseCode();
    var resText = response.getContentText();

    Logger.log("WATI Response [" + resCode + "]: " + resText);

    if (resCode === 200 || resCode === 201) {
      var resJson = JSON.parse(resText);
      if (resJson.result === true || resJson.status === "SUCCESS" || resJson.validWhatsAppNumber === true || resJson.isSuccessful === true) {
        return { success: true };
      } else {
        return { success: false, error: resJson.info || resJson.message || resText };
      }
    } else {
      return { success: false, error: "HTTP " + resCode + ": " + resText };
    }

  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
