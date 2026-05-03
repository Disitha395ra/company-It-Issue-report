/**
 * ======================================================
 * IT Support Portal - Google Apps Script Backend (V3)
 * - Uses Email as user identifier (Google Auth)
 * - Sends email notifications on submission & status change
 * ======================================================
 */

const SHEET_NAME = 'Issues';

// ===== ROUTING =====

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    switch (action) {
      case 'getActiveIssue': result = getActiveIssue(e.parameter.email); break;
      case 'getQueueStatus': result = getQueueStatus(e.parameter.email); break;
      case 'getPendingCount': result = getPendingCount(); break;
      case 'getIssueHistory': result = getIssueHistory(e.parameter.email); break;
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

// ===== SHEET ACCESS =====

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

// ===== IMAGE HANDLING =====

/**
 * Saves base64 images to Google Drive and returns a public URL.
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

// ===== SUBMIT ISSUE =====

function submitIssue(data) {
  const sheet = getSheet();
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(10000);
    
    if (findActiveIssue(sheet, data.email)) {
      return { success: false, message: 'You already have an active issue.' };
    }
    
    const queueNumber = calculateQueueNumber(sheet);
    const timestamp = new Date().toISOString();
    
    let driveUrl = '';
    let imageFormula = '';
    
    if (data.screenshotUrl) {
      driveUrl = saveImageToDrive(data.screenshotUrl, 'screenshot_' + data.email + '_' + Date.now());
      imageFormula = driveUrl.startsWith('http') ? '=IMAGE("' + driveUrl + '")' : 'Image Payload Too Large';
    }
    
    sheet.appendRow([
      timestamp,        // A - Timestamp
      data.email,       // B - Email (identifier)
      data.displayName || data.email.split('@')[0], // C - Display Name
      data.phone,       // D - Phone Number
      data.issueType,   // E - Issue Type
      data.description, // F - Description
      imageFormula,     // G - Screenshot Image (formula)
      'Pending',        // H - Status
      '',               // I - Admin Resolution
      queueNumber,      // J - Queue Number
      '',               // K - Feedback
      driveUrl          // L - Raw URL (hidden)
    ]);
    
    const newRow = sheet.getLastRow();
    if (imageFormula !== '') {
      sheet.setRowHeight(newRow, 120);
      sheet.setColumnWidth(7, 120);
    }
    
    // Send confirmation email to user
    try {
      sendSubmissionConfirmationEmail({
        email: data.email,
        displayName: data.displayName || data.email.split('@')[0],
        issueType: data.issueType,
        description: data.description,
        phone: data.phone,
        queueNumber: queueNumber,
        timestamp: timestamp,
        screenshotUrl: driveUrl
      });
    } catch (emailErr) {
      Logger.log("Email error on submit: " + emailErr.toString());
    }
    
    return { success: true, message: 'Issue submitted!', queueNumber: queueNumber };
  } finally {
    lock.releaseLock();
  }
}

// ===== GET ACTIVE ISSUE =====

function getActiveIssue(email) {
  if (!email) return { success: false, message: 'Email required' };
  const issue = findActiveIssue(getSheet(), email);
  return { success: true, issue: issue };
}

function findActiveIssue(sheet, email) {
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (String(row[1]).trim().toLowerCase() === String(email).trim().toLowerCase()) {
      const originalStatus = String(row[7]).trim();
      const statusLower = originalStatus.toLowerCase();
      const adminRes = String(row[8]).trim();
      const feedback = String(row[10]).trim();
      const rawUrl = String(row[11] || '').trim();
      
      const payload = {
        rowIndex: i + 1,
        timestamp: row[0],
        email: row[1],
        displayName: row[2],
        phone: row[3],
        issueType: row[4],
        description: row[5],
        screenshotUrl: rawUrl,
        status: originalStatus,
        adminResolution: adminRes,
        queueNumber: row[9],
        feedback: ''
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

// ===== QUEUE =====

function calculateQueueNumber(sheet) {
  const data = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][7]).trim().toLowerCase() === 'pending') count++;
  }
  return count + 1;
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

function getQueueStatus(email) {
  const data = getSheet().getDataRange().getValues();
  let totalPending = 0;
  let userQueueNumber = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][7]).trim().toLowerCase() === 'pending') {
      totalPending++;
      if (String(data[i][1]).trim().toLowerCase() === String(email).trim().toLowerCase()) {
        userQueueNumber = data[i][9];
      }
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

// ===== SUBMIT FEEDBACK =====

function submitFeedback(data) {
  const sheet = getSheet();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const rowIndex = parseInt(data.rowIndex);
    if (!rowIndex || rowIndex < 2) return { success: false, message: 'Invalid row reference' };
    
    const rowData = sheet.getRange(rowIndex, 1, 1, 12).getValues()[0];
    if (String(rowData[1]).trim().toLowerCase() !== String(data.email).trim().toLowerCase()) {
      return { success: false, message: 'Unauthorized' };
    }
    
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

// ===== ISSUE HISTORY =====

function getIssueHistory(email) {
  if (!email) return { success: false, message: 'Email required' };
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const issues = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]).trim().toLowerCase() === String(email).trim().toLowerCase()) {
      issues.push({
        rowIndex: i + 1,
        timestamp: row[0],
        email: row[1],
        displayName: row[2],
        phone: row[3],
        issueType: row[4],
        description: row[5],
        status: row[7],
        adminResolution: row[8],
        queueNumber: row[9],
        feedback: row[10],
        screenshotUrl: row[11] || ''
      });
    }
  }
  
  issues.reverse(); // Newest first
  return { success: true, issues: issues };
}

// ===== EDIT TRIGGER =====

function onEditTrigger(e) {
  const sheet = e.source.getSheetByName(SHEET_NAME);
  if (!sheet) return;
  const col = e.range.getColumn();
  const row = e.range.getRow();
  
  if (row > 1 && (col === 8 || col === 9)) {
    if (col === 9) { // Admin Resolution Column changed
      const val = String(sheet.getRange(row, 9).getValue()).trim();
      let newStatus = '';
      
      if (val === 'Complete') {
        newStatus = 'Completed';
        sheet.getRange(row, 8).setValue('Completed');
        sheet.getRange(row, 10).setValue(''); // Clear Queue Number
        sheet.getRange(row, 11).setValue(''); // Clear feedback (trigger new feedback)
      } else if (val === 'Not complete') {
        newStatus = 'Not Completed';
        sheet.getRange(row, 8).setValue('Not Completed');
        sheet.getRange(row, 10).setValue('');
        sheet.getRange(row, 11).setValue('');
      } else if (val === 'Need further investigation') {
        newStatus = 'In Progress';
        sheet.getRange(row, 8).setValue('In Progress');
        sheet.getRange(row, 10).setValue('');
        sheet.getRange(row, 11).setValue('');
      }
      
      // Send status notification email to user
      if (newStatus) {
        try {
          const rowData = sheet.getRange(row, 1, 1, 12).getValues()[0];
          const userEmail = String(rowData[1]).trim();
          const displayName = String(rowData[2]).trim() || userEmail.split('@')[0];
          const issueType = String(rowData[4]).trim();
          const description = String(rowData[5]).trim();
          const adminResolution = val;
          const screenshotUrl = String(rowData[11] || '').trim();
          
          sendStatusUpdateEmail({
            email: userEmail,
            displayName: displayName,
            issueType: issueType,
            description: description,
            status: newStatus,
            adminResolution: adminResolution,
            screenshotUrl: screenshotUrl
          });
        } catch (emailErr) {
          Logger.log("Email error on status change: " + emailErr.toString());
        }
      }
    }
    recalculateQueueNumbers(sheet);
  }
}

// ===== EMAIL NOTIFICATIONS =====

/**
 * Sends a confirmation email to the user when they submit an issue.
 */
function sendSubmissionConfirmationEmail(data) {
  const subject = '✅ IT Support Request Received - ' + data.issueType;
  
  const screenshotSection = data.screenshotUrl
    ? '<p style="margin:8px 0;"><strong>Screenshot:</strong> <a href="' + data.screenshotUrl + '" style="color:#4f46e5;">View Screenshot</a></p>'
    : '';
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">🛠️</div>
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">IT Support Portal</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Issue Submitted Successfully</p>
        </td></tr>
        
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#374151;font-size:16px;margin:0 0 20px;">Hi <strong>${data.displayName}</strong>,</p>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your IT support request has been received and added to the queue. Our team will review it shortly.
          </p>
          
          <!-- Issue Details Box -->
          <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #4f46e5;">
            <h2 style="color:#1f2937;font-size:16px;margin:0 0 16px;font-weight:700;">📋 Issue Details</h2>
            <p style="margin:8px 0;color:#374151;font-size:14px;"><strong>Issue Type:</strong> ${data.issueType}</p>
            <p style="margin:8px 0;color:#374151;font-size:14px;"><strong>Queue Number:</strong> #${data.queueNumber}</p>
            <p style="margin:8px 0;color:#374151;font-size:14px;"><strong>Submitted At:</strong> ${new Date(data.timestamp).toLocaleString('en-US', {dateStyle:'long', timeStyle:'short'})}</p>
            <p style="margin:8px 0;color:#374151;font-size:14px;"><strong>Contact Phone:</strong> ${data.phone || 'Not provided'}</p>
            ${screenshotSection}
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#374151;font-size:14px;"><strong>Description:</strong></p>
              <p style="margin:8px 0 0;color:#6b7280;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.description}</p>
            </div>
          </div>
          
          <!-- Status Badge -->
          <div style="text-align:center;margin-bottom:24px;">
            <span style="display:inline-block;background:#fef3c7;color:#b45309;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;border:1px solid #fde68a;">
              ⏳ Status: Pending
            </span>
          </div>
          
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
            You will receive another email when the status of your issue is updated. If you have any urgent concerns, please contact the IT team directly.
          </p>
        </td></tr>
        
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            This is an automated notification from the IT Support Portal.<br>
            Please do not reply to this email.
          </p>
        </td></tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  MailApp.sendEmail({
    to: data.email,
    cc: 'disitha@scot.lk',
    subject: subject,
    htmlBody: htmlBody,
  });
}

/**
 * Sends a status update email to the user when admin changes their issue status.
 */
function sendStatusUpdateEmail(data) {
  const statusConfig = {
    'Completed': {
      emoji: '✅',
      label: 'Completed',
      color: '#047857',
      bg: '#d1fae5',
      border: '#6ee7b7',
      message: 'Great news! Your IT support issue has been resolved. If you continue to experience problems, feel free to submit a new request.'
    },
    'Not Completed': {
      emoji: '❌',
      label: 'Not Completed',
      color: '#b91c1c',
      bg: '#fee2e2',
      border: '#fca5a5',
      message: 'Our IT team has reviewed your issue. Unfortunately, it could not be completed at this time. You may submit a new request with more details if needed.'
    },
    'In Progress': {
      emoji: '🔍',
      label: 'Under Investigation',
      color: '#1d4ed8',
      bg: '#dbeafe',
      border: '#93c5fd',
      message: 'Your issue requires further investigation. Our IT team is actively working on it and will update you as soon as possible.'
    }
  };
  
  const config = statusConfig[data.status] || {
    emoji: 'ℹ️', label: data.status, color: '#374151', bg: '#f3f4f6', border: '#d1d5db', message: 'Your issue status has been updated.'
  };
  
  const subject = config.emoji + ' IT Support Update: ' + data.issueType + ' → ' + config.label;
  
  const screenshotSection = data.screenshotUrl
    ? '<p style="margin:8px 0;color:#374151;font-size:14px;"><strong>Screenshot:</strong> <a href="' + data.screenshotUrl + '" style="color:#4f46e5;">View Screenshot</a></p>'
    : '';
  
  const resolutionSection = data.adminResolution
    ? `<div style="margin-top:16px;padding:12px 16px;background:#ffffff;border-radius:8px;border:1px solid ${config.border};">
         <p style="margin:0;color:#374151;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Admin Note</p>
         <p style="margin:6px 0 0;color:#6b7280;font-size:14px;">${data.adminResolution}</p>
       </div>`
    : '';
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">🛠️</div>
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.02em;">IT Support Portal</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Issue Status Update</p>
        </td></tr>
        
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="color:#374151;font-size:16px;margin:0 0 20px;">Hi <strong>${data.displayName}</strong>,</p>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
            ${config.message}
          </p>
          
          <!-- Status Badge -->
          <div style="text-align:center;margin-bottom:28px;">
            <span style="display:inline-block;background:${config.bg};color:${config.color};font-size:15px;font-weight:700;padding:10px 24px;border-radius:24px;border:1px solid ${config.border};">
              ${config.emoji} ${config.label}
            </span>
          </div>
          
          <!-- Issue Details Box -->
          <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid ${config.color};">
            <h2 style="color:#1f2937;font-size:16px;margin:0 0 16px;font-weight:700;">📋 Issue Summary</h2>
            <p style="margin:8px 0;color:#374151;font-size:14px;"><strong>Issue Type:</strong> ${data.issueType}</p>
            ${screenshotSection}
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#374151;font-size:14px;"><strong>Description:</strong></p>
              <p style="margin:8px 0 0;color:#6b7280;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.description}</p>
            </div>
            ${resolutionSection}
          </div>
          
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
            Please log in to the IT Support Portal to provide your feedback on this resolution.
          </p>
        </td></tr>
        
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            This is an automated notification from the IT Support Portal.<br>
            Please do not reply to this email.
          </p>
        </td></tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  MailApp.sendEmail({
    to: data.email,
    cc: 'disitha@scot.lk',
    subject: subject,
    htmlBody: htmlBody,
  });
}

// ===== SETUP =====

/**
 * Run this from Apps Script editor to perfectly format your sheet.
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
    'Timestamp', 'Email', 'Display Name', 'Phone Number', 'Issue Type',
    'Description', 'Screenshot Image', 'Status',
    'Admin Resolution', 'Queue Number', 'Feedback', 'Raw URL'
  ]]);
  
  // Header Styling
  sheet.getRange(1, 1, 1, 12)
       .setFontWeight('bold')
       .setBackground('#4f46e5')
       .setFontColor('#ffffff')
       .setVerticalAlignment('middle')
       .setHorizontalAlignment('center');
       
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);
  
  // General column styling
  sheet.getRange(2, 1, sheet.getMaxRows(), 12).setVerticalAlignment('middle');
  sheet.getRange('F2:F').setWrap(true); // Description
  sheet.getRange('I2:I').setWrap(true); // Admin Resolution
  sheet.getRange('K2:K').setWrap(true); // Feedback
  sheet.getRange('H2:H').setHorizontalAlignment('center');
  sheet.getRange('J2:J').setHorizontalAlignment('center');
  
  // Column Widths
  sheet.setColumnWidth(1, 160);  // Timestamp
  sheet.setColumnWidth(2, 200);  // Email
  sheet.setColumnWidth(3, 150);  // Display Name
  sheet.setColumnWidth(4, 120);  // Phone
  sheet.setColumnWidth(5, 150);  // Issue Type
  sheet.setColumnWidth(6, 350);  // Description
  sheet.setColumnWidth(7, 130);  // Screenshot
  sheet.setColumnWidth(8, 110);  // Status
  sheet.setColumnWidth(9, 350);  // Admin Resolution
  sheet.setColumnWidth(10, 110); // Queue Number
  sheet.setColumnWidth(11, 250); // Feedback
  sheet.hideColumns(12);         // Hide Raw URL

  // Data Validation for Admin Resolution (Column I)
  const ruleDropdown = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Complete', 'Not complete', 'Need further investigation'], true)
    .build();
  sheet.getRange('I2:I').setDataValidation(ruleDropdown);
  
  // Conditional Formatting
  sheet.clearConditionalFormatRules();
  const rulePending = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#fef3c7')
    .setFontColor('#b45309')
    .setRanges([sheet.getRange('H2:H')])
    .build();
    
  const ruleCompleted = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Completed')
    .setBackground('#d1fae5')
    .setFontColor('#047857')
    .setRanges([sheet.getRange('H2:H')])
    .build();
    
  const ruleNotCompleted = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Not Completed')
    .setBackground('#fee2e2')
    .setFontColor('#b91c1c')
    .setRanges([sheet.getRange('H2:H')])
    .build();

  const ruleInProgress = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('In Progress')
    .setBackground('#dbeafe')
    .setFontColor('#1d4ed8')
    .setRanges([sheet.getRange('H2:H')])
    .build();
    
  sheet.setConditionalFormatRules([rulePending, ruleCompleted, ruleNotCompleted, ruleInProgress]);
  
  // Protect Status column
  const protection = sheet.getRange('H2:H').protect().setDescription('Auto-managed Status');
  protection.setWarningOnly(true);
  
  Logger.log('Trigger, formatting, and email notifications configured successfully!');
}
