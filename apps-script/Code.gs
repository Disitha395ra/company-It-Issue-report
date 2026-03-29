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
      case 'getIssueHistory': result = getIssueHistory(e.parameter.empNo); break;
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
      data.phone, // D
      data.issueType, // E
      data.description, // F
      imageFormula, // G (Visual Appears Here)
      'Pending', // H (Status)
      '', // I (Admin Resolution)
      queueNumber, // J (Queue No)
      '', // K (Feedback)
      driveUrl // L (Raw URL hidden for Frontend text pull)
    ]);
    
    const newRow = sheet.getLastRow();
    if (imageFormula !== '') {
      sheet.setRowHeight(newRow, 120);
      sheet.setColumnWidth(7, 120);
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
      const originalStatus = String(row[7]).trim();
      const statusLower = originalStatus.toLowerCase();
      const adminRes = String(row[8]).trim();
      const feedback = String(row[10]).trim();
      const rawUrl = String(row[11] || '').trim();
      
      const payload = {
        rowIndex: i + 1, timestamp: row[0], empNo: row[1], email: row[2], phone: row[3],
        issueType: row[4], description: row[5], screenshotUrl: rawUrl,
        status: originalStatus, adminResolution: adminRes, queueNumber: row[9], feedback: ''
      };
      
      if (statusLower === 'pending' || statusLower === 'in progress') {
         payload.status = originalStatus;
         return payload;
      }
      if ((statusLower === 'completed' || statusLower === 'complete' || statusLower === 'not completed') && !feedback) {
         payload.status = originalStatus === 'Not Completed' ? 'Not Completed' : 'Completed';
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
    if (String(data[i][7]).trim().toLowerCase() === 'pending') count++;
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
    
    const rowData = sheet.getRange(rowIndex, 1, 1, 12).getValues()[0];
    if (String(rowData[1]).trim() !== String(data.empNo).trim()) return { success: false, message: 'Unauthorized' };
    
    const rowStatus = String(rowData[7]).trim().toLowerCase();
    if (rowStatus !== 'completed' && rowStatus !== 'complete' && rowStatus !== 'not completed' && rowStatus !== 'in progress') {
      return { success: false, message: 'Issue is not ready for feedback' };
    }
    
    sheet.getRange(rowIndex, 11).setValue(data.feedback);
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
    if (String(data[i][7]).trim().toLowerCase() === 'pending') {
      totalPending++;
      if (String(data[i][1]).trim() === String(empNo).trim()) userQueueNumber = data[i][9];
    }
  }
  return { success: true, totalPending: totalPending, userQueueNumber: userQueueNumber };
}

function getPendingCount() {
  const data = getSheet().getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][7]).trim().toLowerCase() === 'pending') count++;
  }
  return { success: true, count: count };
}

function getIssueHistory(empNo) {
  if (!empNo) return { success: false, message: 'Employee number required' };
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const issues = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]).trim() === String(empNo).trim()) {
      issues.push({
        rowIndex: i + 1,
        timestamp: row[0],
        empNo: row[1],
        email: row[2],
        phone: row[3],
        issueType: row[4],
        description: row[5],
        status: row[7],
        adminResolution: row[8],
        queueNumber: row[9],
        feedback: row[10],
        screenshotUrl: row[11] || '' // raw URL
      });
    }
  }
  
  // Return newest first
  issues.reverse();
  
  return { success: true, issues: issues };
}

function recalculateQueueNumbers(sheet) {
  const data = sheet.getDataRange().getValues();
  let queueNum = 1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][7]).trim().toLowerCase() === 'pending') {
      sheet.getRange(i + 1, 10).setValue(queueNum);
      queueNum++;
    }
  }
}

function onEditTrigger(e) {
  const sheet = e.source.getSheetByName(SHEET_NAME);
  if (!sheet) return;
  const col = e.range.getColumn();
  const row = e.range.getRow();
  
  if (row > 1 && (col === 8 || col === 9)) {
     if (col === 9) { // Admin Resolution Column
       const val = String(sheet.getRange(row, 9).getValue()).trim();
       if (val === 'Complete') {
          sheet.getRange(row, 8).setValue('Completed'); // Set Status
          sheet.getRange(row, 10).setValue(''); // Clear Queue Number
          sheet.getRange(row, 11).setValue(''); // Clear feedback
       } else if (val === 'Not complete') {
          sheet.getRange(row, 8).setValue('Not Completed');
          sheet.getRange(row, 10).setValue('');
          sheet.getRange(row, 11).setValue(''); // Clear feedback
       } else if (val === 'Need further investigation') {
          sheet.getRange(row, 8).setValue('In Progress');
          sheet.getRange(row, 10).setValue('');
          sheet.getRange(row, 11).setValue(''); // Clear feedback
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
  
  sheet.getRange(1, 1, 1, 12).setValues([[
    'Timestamp', 'EmpNo', 'Email', 'Phone Number', 'Issue Type', 
    'Description', 'Screenshot Image', 'Status', 
    'Admin Resolution', 'Queue Number', 'Feedback', 'Raw URL'
  ]]);
  
  // Header Styling
  sheet.getRange(1, 1, 1, 12)
       .setFontWeight('bold')
       .setBackground('#4f46e5') // Modern Indigo
       .setFontColor('#ffffff')
       .setVerticalAlignment('middle')
       .setHorizontalAlignment('center');
       
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);
  
  // General column styling (Wrap text & vertical align middle)
  sheet.getRange(2, 1, sheet.getMaxRows(), 12).setVerticalAlignment('middle');
  sheet.getRange('F2:F').setWrap(true); // Description
  sheet.getRange('I2:I').setWrap(true); // Admin Resolution
  sheet.getRange('K2:K').setWrap(true); // Feedback
  sheet.getRange('H2:H').setHorizontalAlignment('center'); // Status
  sheet.getRange('J2:J').setHorizontalAlignment('center'); // Queue Number
  
  // Set Column Widths for readability
  sheet.setColumnWidth(1, 160); // Timestamp
  sheet.setColumnWidth(2, 90);  // EmpNo
  sheet.setColumnWidth(3, 180); // Email
  sheet.setColumnWidth(4, 120); // Phone
  sheet.setColumnWidth(5, 150); // Issue Type
  sheet.setColumnWidth(6, 350); // Description
  sheet.setColumnWidth(7, 130); // Screenshot
  sheet.setColumnWidth(8, 110); // Status
  sheet.setColumnWidth(9, 350); // Admin Resolution
  sheet.setColumnWidth(10, 110); // Queue Number
  sheet.setColumnWidth(11, 250); // Feedback
  sheet.hideColumns(12); // Hide Raw URL payload column

  // Data Validation for Admin Resolution (Column I)
  const ruleDropdown = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Complete', 'Not complete', 'Need further investigation'], true)
    .build();
  sheet.getRange('I2:I').setDataValidation(ruleDropdown);
  
  // Apply Conditional Formatting for Status
  sheet.clearConditionalFormatRules();
  const rulePending = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#fef3c7') // Amber 50
    .setFontColor('#b45309')  // Amber 700
    .setRanges([sheet.getRange('H2:H')])
    .build();
    
  const ruleCompleted = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Completed')
    .setBackground('#d1fae5') // Emerald 100
    .setFontColor('#047857')  // Emerald 700
    .setRanges([sheet.getRange('H2:H')])
    .build();
    
  const ruleNotCompleted = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Not Completed')
    .setBackground('#fee2e2') // Red 100
    .setFontColor('#b91c1c')  // Red 700
    .setRanges([sheet.getRange('H2:H')])
    .build();

  const ruleInProgress = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('In Progress')
    .setBackground('#dbeafe') // Blue 100
    .setFontColor('#1d4ed8')  // Blue 700
    .setRanges([sheet.getRange('H2:H')])
    .build();
    
  sheet.setConditionalFormatRules([rulePending, ruleCompleted, ruleNotCompleted, ruleInProgress]);
  
  // Protect Status column so humans don't break logic
  const protection = sheet.getRange('H2:H').protect().setDescription('Auto-managed Status');
  protection.setWarningOnly(true);
  
  Logger.log('Trigger and advanced attractive formatting applied successfully!');
}
