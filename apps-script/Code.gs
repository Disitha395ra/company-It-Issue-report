/**
 * ======================================================
 * IT Support Portal - Google Apps Script Backend (V2)
 * ======================================================
 */

const SHEET_NAME = 'Issues';



function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    switch (action) {
      case 'getActiveIssue': result = getActiveIssue(e.parameter.empNo); break;
      case 'getQueueStatus': result = getQueueStatus(e.parameter.empNo); break;
      case 'getPendingCount': result = getPendingCount(); break;
      default: result = { success: false, message: 'Unknown action: ' + action };
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;
    switch (data.action) {
      case 'submitIssue': result = submitIssue(data); break;
      case 'submitFeedback': result = submitFeedback(data); break;
      default: result = { success: false, message: 'Unknown action: ' + data.action };
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

/**
 * Saves base64 images to Google Drive, avoiding maximum cell character limits,
 * and returns a public URL that Google Sheets IMAGE() function can visually render.
 */
function saveImageToDrive(dataUrl, filename) {
  try {
    const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!match) return dataUrl;
    
    const mimeType = match[1];
    const base64Data = match[2];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    
    const folderName = "IT Support Screenshots";
    let folders = DriveApp.getFoldersByName(folderName);
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return "https://drive.google.com/uc?id=" + file.getId();
  } catch (e) {
    Logger.log("Error saving image: " + e.toString());
    return dataUrl;
  }
}

function submitIssue(data) {
  const sheet = getSheet();
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(10000);
    
    if (findActiveIssue(sheet, data.empNo)) {
      return { success: false, message: 'You already have an active issue.' };
    }
    
    const queueNumber = calculateQueueNumber(sheet);
    const timestamp = new Date().toISOString();
    
    let driveUrl = '';
    let imageFormula = '';
    
    if (data.screenshotUrl) {
      driveUrl = saveImageToDrive(data.screenshotUrl, 'screenshot_' + data.empNo + '_' + Date.now());
      imageFormula = driveUrl.startsWith('http') ? '=IMAGE("' + driveUrl + '")' : 'Image Payload Too Large';
    }
    
    sheet.appendRow([
      timestamp, // A
      data.empNo, // B
      data.email, // C
      data.issueType, // D
      data.description, // E
      imageFormula, // F (Visual Appears Here)
      'Pending', // G (Status)
      '', // H (Admin Resolution)
      queueNumber, // I (Queue No)
      '', // J (Feedback)
      driveUrl // K (Raw URL hidden for Frontend text pull)
    ]);
    
    const newRow = sheet.getLastRow();
    if (imageFormula !== '') {
      sheet.setRowHeight(newRow, 120);
      sheet.setColumnWidth(6, 120);
    }
    
    return { success: true, message: 'Issue submitted!', queueNumber: queueNumber };
  } finally {
    lock.releaseLock();
  }
}

function getActiveIssue(empNo) {
  if (!empNo) return { success: false, message: 'Employee number required' };
  const issue = findActiveIssue(getSheet(), empNo);
  return { success: true, issue: issue };
}

function findActiveIssue(sheet, empNo) {
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (String(row[1]).trim() === String(empNo).trim()) {
      const originalStatus = String(row[6]).trim();
      const statusLower = originalStatus.toLowerCase();
      const adminRes = String(row[7]).trim();
      const feedback = String(row[9]).trim();
      const rawUrl = String(row[10] || '').trim();
      
      const payload = {
        rowIndex: i + 1, timestamp: row[0], empNo: row[1], email: row[2],
        issueType: row[3], description: row[4], screenshotUrl: rawUrl,
        status: originalStatus, adminResolution: adminRes, queueNumber: row[8], feedback: ''
      };
      
      if (statusLower === 'pending') {
         payload.status = 'Pending';
         return payload;
      }
      if (statusLower === 'completed' && !feedback) {
         payload.status = 'Completed';
         return payload;
      }
    }
  }
  return null;
}

function calculateQueueNumber(sheet) {
  const data = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][6]).trim().toLowerCase() === 'pending') count++;
  }
  return count + 1;
}

function submitFeedback(data) {
  const sheet = getSheet();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const rowIndex = parseInt(data.rowIndex);
    if (!rowIndex || rowIndex < 2) return { success: false, message: 'Invalid row reference' };
    
    const rowData = sheet.getRange(rowIndex, 1, 1, 10).getValues()[0];
    if (String(rowData[1]).trim() !== String(data.empNo).trim()) return { success: false, message: 'Unauthorized' };
    if (String(rowData[6]).trim().toLowerCase() !== 'completed') return { success: false, message: 'Issue not completed' };
    
    sheet.getRange(rowIndex, 10).setValue(data.feedback);
    recalculateQueueNumbers(sheet);
    return { success: true, message: 'Feedback submitted!' };
  } finally {
    lock.releaseLock();
  }
}

function getQueueStatus(empNo) {
  const data = getSheet().getDataRange().getValues();
  let totalPending = 0;
  let userQueueNumber = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][6]).trim().toLowerCase() === 'pending') {
      totalPending++;
      if (String(data[i][1]).trim() === String(empNo).trim()) userQueueNumber = data[i][8];
    }
  }
  return { success: true, totalPending: totalPending, userQueueNumber: userQueueNumber };
}

function getPendingCount() {
  const data = getSheet().getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][6]).trim().toLowerCase() === 'pending') count++;
  }
  return { success: true, count: count };
}

function recalculateQueueNumbers(sheet) {
  const data = sheet.getDataRange().getValues();
  let queueNum = 1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][6]).trim().toLowerCase() === 'pending') {
      sheet.getRange(i + 1, 9).setValue(queueNum);
      queueNum++;
    }
  }
}

function onEditTrigger(e) {
  const sheet = e.source.getSheetByName(SHEET_NAME);
  if (!sheet) return;
  const col = e.range.getColumn();
  const row = e.range.getRow();
  
  if (row > 1 && (col === 7 || col === 8)) {
     if (col === 8) { // Admin Resolution Column
       const val = String(sheet.getRange(row, 8).getValue()).trim().toLowerCase();
       if (val === 'yes' || val === 'no' || val === 'need further investigation') {
          sheet.getRange(row, 7).setValue('Completed'); // Set Status
          sheet.getRange(row, 9).setValue(''); // Clear Queue Number
       }
     }
     recalculateQueueNumbers(sheet);
  }
}

/**
 * Run this from Apps Script editor to perfectly format your sheet natively!
 */
function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditTrigger') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('onEditTrigger').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit().create();
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  
  sheet.getRange(1, 1, 1, 11).setValues([[
    'Timestamp', 'EmpNo', 'Email', 'Issue Type', 
    'Description', 'Screenshot Image', 'Status', 
    'Admin Resolution', 'Queue Number', 'Feedback', 'Raw URL'
  ]]);
  sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#4338ca').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  
  // Create Dropdown for Admin Resolution
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No', 'Need further investigation'], true)
    .build();
  sheet.getRange('H2:H').setDataValidation(rule);
  
  // Protect Status column so humans don't break logic
  const protection = sheet.getRange('G2:G').protect().setDescription('Auto-managed Status');
  protection.setWarningOnly(true);
  
  sheet.hideColumns(11); // Hide Raw URL payload column
  
  Logger.log('Trigger and Sheet auto-format applied successfully!');
}
