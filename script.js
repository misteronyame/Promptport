let prompts = [];

// Analytics and feedback system
function trackEvent(eventName, data = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    event: eventName,
    url: window.location.href,
    userAgent: navigator.userAgent,
    promptCount: prompts.length,
    ...data
  };
  
  const events = JSON.parse(localStorage.getItem('analytics') || '[]');
  events.push(event);
  localStorage.setItem('analytics', JSON.stringify(events.slice(-100)));
}

// Feedback collection
function showFeedbackModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: flex; align-items: center;
    justify-content: center; z-index: 1000;
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%;">
      <h3 style="margin-top: 0;">📝 Quick Feedback</h3>
      <textarea id="feedbackText" placeholder="How's your PromptPort experience? Any suggestions?" 
                rows="4" style="width: 100%; margin: 10px 0; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;"></textarea>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 6px; cursor: pointer;">Skip</button>
        <button onclick="submitFeedback()" 
                style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">Send</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function submitFeedback() {
  const feedback = document.getElementById('feedbackText').value;
  if (feedback.trim()) {
    trackEvent('feedback_submitted', { feedback: feedback.trim() });
    alert('Thank you for your feedback!');
  }
  document.querySelector('[style*="position: fixed"]').remove();
}

// Show feedback modal after user saves 5 prompts
function checkForFeedbackPrompt() {
  const feedbackShown = localStorage.getItem('feedbackShown');
  if (!feedbackShown && prompts.length === 5) {
    setTimeout(showFeedbackModal, 2000);
    localStorage.setItem('feedbackShown', 'true');
  }
}

const promptInput = document.getElementById("promptInput");
const tagInput = document.getElementById("tagInput");
const saveBtn = document.getElementById("saveBtn");
const promptList = document.getElementById("promptList");
const exportTxtBtn = document.getElementById("exportTxtBtn");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchBtn = document.getElementById("searchBtn");

let currentSearchTerm = "";

function loadPrompts() {
  const stored = localStorage.getItem("prompts");
  prompts = stored ? JSON.parse(stored) : [];

  // Ensure all prompts have proper tags array
  prompts = prompts.map(prompt => ({
    ...prompt,
    tags: Array.isArray(prompt.tags) ? prompt.tags : []
  }));

  renderPrompts();
  updateSummary();
}

function savePrompts() {
  localStorage.setItem("prompts", JSON.stringify(prompts));
  renderPrompts();
  updateSummary();
}

function renderPrompts() {
  promptList.innerHTML = "";

  const filteredPrompts = currentSearchTerm
    ? prompts.filter(prompt => matchesSearch(prompt, currentSearchTerm))
    : prompts;

  [...filteredPrompts].reverse().forEach((prompt, index) => {
    const actualIndex = prompts.indexOf(prompt);
    const div = document.createElement("div");
    div.className = "prompt-item";

    // Safely handle prompt properties
    const safePrompt = prompt || {};
    const tags = Array.isArray(safePrompt.tags) ? prompt.tags : [];
    const tagsDisplay = tags.length > 0 ? tags.join(", ") : "No tags";
    const promptText = safePrompt.text || '';
    const timestamp = safePrompt.timestamp ? new Date(safePrompt.timestamp).toLocaleString() : 'Unknown date';

    div.innerHTML = `
      <strong>${timestamp}</strong><br/>
      <div id="prompt-text-${actualIndex}">${promptText}</div>
      <div id="prompt-tags-${actualIndex}"><em>Tags: ${tagsDisplay}</em></div>
      <div class="button-container">
        <button onclick="editPrompt(${actualIndex})">✏️ Edit</button>
        <button onclick="deletePrompt(${actualIndex})">🗑️ Delete</button>
      </div>
    `;
    promptList.appendChild(div);
  });

  if (currentSearchTerm && filteredPrompts.length === 0) {
    promptList.innerHTML = '<div class="prompt-item"><em>No prompts found matching your search.</em></div>';
  }
}

function updateSummary() {
  const count = prompts.length;
  const tagSet = new Set();
  let lastSaved = "N/A";

  if (count > 0) {
    prompts.forEach(p => {
      const safePrompt = p || {};
      const tags = Array.isArray(safePrompt.tags) ? safePrompt.tags : [];
      if (tags && Array.isArray(tags)) {
        tags.forEach(t => {
          if (t && typeof t === 'string' && t.trim()) {
            tagSet.add(t.trim());
          }
        });
      }
    });

    const lastPrompt = prompts[prompts.length - 1];
    const safeLastPrompt = lastPrompt || {};
    if (safeLastPrompt.timestamp) {
      lastSaved = new Date(safeLastPrompt.timestamp).toLocaleString();
    }
  }

  document.getElementById("summary-count").textContent = count;
  document.getElementById("summary-tags").textContent = tagSet.size;
  document.getElementById("summary-last").textContent = lastSaved;
}

function matchesSearch(prompt, searchTerm) {
  if (!prompt || !searchTerm) return false;

  const safePrompt = prompt || {};
  const lowerSearchTerm = searchTerm.toLowerCase();
  const text = safePrompt.text ? safePrompt.text.toLowerCase() : '';
  const tags = Array.isArray(safePrompt.tags) ? safePrompt.tags : [];
  const tagString = tags.length > 0 ? tags.join(' ').toLowerCase() : '';

  return text.includes(lowerSearchTerm) || tagString.includes(lowerSearchTerm);
}

function deletePrompt(index) {
  prompts.splice(index, 1);
  savePrompts();
}

function editPrompt(index) {
  const prompt = prompts[index] || {};
  const tags = Array.isArray(prompt.tags) ? prompt.tags : [];

  const textDiv = document.getElementById(`prompt-text-${index}`);
  const tagsDiv = document.getElementById(`prompt-tags-${index}`);

  textDiv.innerHTML = `<textarea id="edit-text-${index}" rows="3" style="width: 100%; margin-bottom: 5px;">${prompt.text || ''}</textarea>`;
  tagsDiv.innerHTML = `<input id="edit-tags-${index}" placeholder="Tags (comma-separated)" style="width: 100%; margin-bottom: 5px;" value="${tags.join(', ')}">`;

  const promptItem = textDiv.parentElement;
  const buttons = promptItem.querySelectorAll('button');
  buttons.forEach(btn => btn.remove());

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  buttonContainer.innerHTML = `
    <button onclick="saveEdit(${index})">💾 Save</button>
    <button onclick="cancelEdit(${index})">❌ Cancel</button>
  `;
  promptItem.appendChild(buttonContainer);
}

function saveEdit(index) {
  const newText = document.getElementById(`edit-text-${index}`).value.trim();
  const newTagsInput = document.getElementById(`edit-tags-${index}`).value;
  const newTags = newTagsInput.split(",").map(t => t.trim()).filter(t => t !== "");

  if (!newText) return;

  prompts[index].text = newText;
  prompts[index].tags = newTags;
  prompts[index].timestamp = new Date().toISOString();

  savePrompts();
}

function cancelEdit(index) {
  renderPrompts();
}

saveBtn.onclick = () => {
  const text = promptInput.value.trim();
  const tags = tagInput.value.split(",").map(t => t.trim()).filter(t => t !== "");

  if (!text) return;

  prompts.push({
    id: Date.now().toString(),
    text,
    tags,
    timestamp: new Date().toISOString()
  });

  // Track usage
  trackEvent('prompt_saved', { 
    textLength: text.length, 
    tagCount: tags.length,
    totalPrompts: prompts.length 
  });

  savePrompts();
  promptInput.value = "";
  tagInput.value = "";
  
  checkForFeedbackPrompt();
};

exportTxtBtn.onclick = () => {
  trackEvent('export_txt', { promptCount: prompts.length });
  
  const lines = prompts.map(p => {
    const safePrompt = p || {};
    const tags = Array.isArray(safePrompt.tags) ? safePrompt.tags : [];
    const text = safePrompt.text || '';
    const timestamp = safePrompt.timestamp ? new Date(safePrompt.timestamp).toLocaleString() : 'Unknown date';
    const tagsDisplay = tags.length > 0 ? tags.join(", ") : "No tags";
    return `[${timestamp}] ${text} (Tags: ${tagsDisplay})`;
  });
  const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `prompts_${new Date().toISOString().slice(0, 19)}.txt`;
  a.click();

  URL.revokeObjectURL(url);
};

// Live search
searchInput.addEventListener('input', (e) => {
  currentSearchTerm = e.target.value.trim();
  renderPrompts();
});

// Search button now active
searchBtn.onclick = () => {
  currentSearchTerm = searchInput.value.trim();
  trackEvent('search_performed', { searchTerm: currentSearchTerm });
  renderPrompts();
};

clearSearchBtn.onclick = () => {
  currentSearchTerm = "";
  searchInput.value = "";
  renderPrompts();
};

// Import functionality
importBtn.onclick = () => {
  fileInput.click();
};

fileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  if (file.name.endsWith('.txt')) {
    reader.onload = (event) => {
      const content = event.target.result;
      parseAndImportContent(content, 'txt');
    };
    reader.readAsText(file);
  } else if (file.name.endsWith('.docx')) {
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      parseDocxFile(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }

  // Reset file input
  e.target.value = '';
};

function parseAndImportContent(content, fileType) {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  let imported = 0;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      // Try to parse structured format first [timestamp] text (Tags: tag1, tag2)
      const structuredMatch = trimmedLine.match(/^\[(.*?)\]\s*(.*?)\s*\(Tags:\s*(.*?)\)$/);

      if (structuredMatch) {
        const [, timestamp, text, tagsStr] = structuredMatch;
        const tags = tagsStr === 'No tags' ? [] : tagsStr.split(',').map(t => t.trim()).filter(t => t);

        prompts.push({
          id: Date.now().toString() + Math.random(),
          text: text.trim(),
          tags: tags,
          timestamp: new Date().toISOString()
        });
        imported++;
      } else {
        // Simple text import
        prompts.push({
          id: Date.now().toString() + Math.random(),
          text: trimmedLine,
          tags: [],
          timestamp: new Date().toISOString()
        });
        imported++;
      }
    }
  });

  if (imported > 0) {
    savePrompts();
    alert(`Successfully imported ${imported} prompts from ${fileType.toUpperCase()} file!`);
  } else {
    alert('No valid content found to import.');
  }
}

function parseDocxFile(arrayBuffer) {
  // Simple DOCX parsing - extract text content
  const uint8Array = new Uint8Array(arrayBuffer);
  const text = String.fromCharCode.apply(null, uint8Array);

  // Extract readable text (this is a basic approach)
  const xmlMatch = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (xmlMatch) {
    const extractedText = xmlMatch.map(match => {
      const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
      return textMatch ? textMatch[1] : '';
    }).join(' ').trim();

    if (extractedText) {
      parseAndImportContent(extractedText, 'docx');
    } else {
      alert('Could not extract text from DOCX file.');
    }
  } else {
    alert('Could not parse DOCX file. Please try converting to TXT format.');
  }
}

// Google Drive API configuration
const GOOGLE_DRIVE_CONFIG = {
  clientId: '665095256592-cd6g9ite18q7kkap2qaaf03i2t20bk1t.apps.googleusercontent.com',
  apiKey: 'YOUR_GOOGLE_API_KEY', // Set this in Replit Secrets
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  scopes: 'https://www.googleapis.com/auth/drive.file'
};

let gapi, gisInited = false, gapiInited = false;

// Load Google APIs
function initializeGoogleAPIs() {
  const script1 = document.createElement('script');
  script1.src = 'https://apis.google.com/js/api.js';
  script1.onload = gapiLoaded;
  document.head.appendChild(script1);
  
  const script2 = document.createElement('script');
  script2.src = 'https://accounts.google.com/gsi/client';
  script2.onload = gisLoaded;
  document.head.appendChild(script2);
}

function gapiLoaded() {
  window.gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  // Get API key from environment (this won't work in static hosting, you'll need to hardcode it)
  const apiKey = GOOGLE_DRIVE_CONFIG.apiKey === 'YOUR_GOOGLE_API_KEY' ? 
    'YOUR_ACTUAL_GOOGLE_API_KEY_HERE' : GOOGLE_DRIVE_CONFIG.apiKey;
  
  await window.gapi.client.init({
    apiKey: apiKey,
    discoveryDocs: [GOOGLE_DRIVE_CONFIG.discoveryDoc],
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  window.tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_DRIVE_CONFIG.clientId,
    scope: GOOGLE_DRIVE_CONFIG.scopes,
    callback: '', // defined later
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('backupToGoogleDriveBtn').disabled = false;
    document.getElementById('restoreFromGoogleDriveBtn').disabled = false;
  }
}

// Google Drive backup functions
async function backupToGoogleDrive() {
  window.tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    await uploadToGoogleDrive();
  };

  if (window.gapi.client.getToken() === null) {
    window.tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    window.tokenClient.requestAccessToken({prompt: ''});
  }
}

async function uploadToGoogleDrive() {
  try {
    const backupData = {
      prompts: prompts,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const fileMetadata = {
      name: `promptport_backup_${new Date().toISOString().slice(0, 10)}.json`
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
    form.append('file', new Blob([JSON.stringify(backupData, null, 2)], {type: 'application/json'}));
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Bearer ${window.gapi.client.getToken().access_token}`
      }),
      body: form
    });
    
    if (response.ok) {
      trackEvent('backup_success', { promptCount: prompts.length, service: 'google_drive' });
      alert('✅ Backup successful! Your prompts have been saved to Google Drive.');
    } else {
      throw new Error('Backup failed');
    }
  } catch (error) {
    console.error('Backup error:', error);
    alert('❌ Backup failed. Please try again.');
  }
}

async function restoreFromGoogleDrive() {
  window.tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    await downloadFromGoogleDrive();
  };

  if (window.gapi.client.getToken() === null) {
    window.tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    window.tokenClient.requestAccessToken({prompt: ''});
  }
}

async function downloadFromGoogleDrive() {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: "name contains 'promptport_backup' and mimeType='application/json'",
      orderBy: 'createdTime desc',
      pageSize: 10
    });
    
    const files = response.result.files;
    if (files.length === 0) {
      alert('No PromptPort backups found in your Google Drive.');
      return;
    }
    
    // Show file selection modal
    showFileSelectionModal(files);
    
  } catch (error) {
    console.error('Restore error:', error);
    alert('❌ Failed to access Google Drive. Please try again.');
  }
}

function showFileSelectionModal(files) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: flex; align-items: center;
    justify-content: center; z-index: 1000;
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <h3 style="margin-top: 0;">☁️ Select Backup to Restore</h3>
      <div id="fileList" style="margin: 15px 0;">
        ${files.map((file, index) => `
          <div style="padding: 10px; border: 1px solid #eee; margin: 5px 0; border-radius: 5px; cursor: pointer;" 
               onclick="restoreFromFile('${file.id}', '${file.name}')">
            <strong>${file.name}</strong><br>
            <small>Created: ${new Date(file.createdTime).toLocaleString()}</small>
          </div>
        `).join('')}
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function restoreFromFile(fileId, fileName) {
  try {
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    
    const backupData = JSON.parse(response.body);
    
    if (backupData.prompts && Array.isArray(backupData.prompts)) {
      const confirmRestore = confirm(`This will replace your current ${prompts.length} prompts with ${backupData.prompts.length} prompts from the backup. Continue?`);
      
      if (confirmRestore) {
        prompts = backupData.prompts;
        savePrompts();
        trackEvent('restore_success', { promptCount: prompts.length, service: 'google_drive' });
        alert(`✅ Successfully restored ${prompts.length} prompts from ${fileName}`);
        document.querySelector('[style*="position: fixed"]').remove();
      }
    } else {
      alert('❌ Invalid backup file format.');
    }
  } catch (error) {
    console.error('Restore error:', error);
    alert('❌ Failed to restore backup. Please try again.');
  }
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Create install button if it doesn't exist
  if (!document.getElementById('install-btn')) {
    const installBtn = document.createElement('button');
    installBtn.id = 'install-btn';
    installBtn.className = 'btn btn-secondary';
    installBtn.innerHTML = '📱 Install App';
    installBtn.style.display = 'block';

    installBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          }
          deferredPrompt = null;
          installBtn.style.display = 'none';
        });
      }
    });

    document.querySelector('.button-group').appendChild(installBtn);
  }
});

// Analytics dashboard
document.getElementById('analyticsBtn').onclick = () => {
  const events = JSON.parse(localStorage.getItem('analytics') || '[]');
  const feedback = events.filter(e => e.event === 'feedback_submitted');
  
  const stats = {
    totalEvents: events.length,
    promptsSaved: events.filter(e => e.event === 'prompt_saved').length,
    searches: events.filter(e => e.event === 'search_performed').length,
    exports: events.filter(e => e.event === 'export_txt').length,
    feedback: feedback.length
  };
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: flex; align-items: center;
    justify-content: center; z-index: 1000;
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <h3 style="margin-top: 0;">📊 Usage Statistics</h3>
      <div style="margin: 15px 0;">
        <strong>Total Events:</strong> ${stats.totalEvents}<br>
        <strong>Prompts Saved:</strong> ${stats.promptsSaved}<br>
        <strong>Searches Performed:</strong> ${stats.searches}<br>
        <strong>Exports:</strong> ${stats.exports}<br>
        <strong>Feedback Submitted:</strong> ${stats.feedback}
      </div>
      ${feedback.length > 0 ? `
        <h4>Recent Feedback:</h4>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin: 10px 0;">
          ${feedback.slice(-5).map(f => `<p style="margin: 5px 0; padding: 5px; background: #f9f9f9; border-radius: 4px;"><small>${new Date(f.timestamp).toLocaleString()}</small><br>${f.feedback}</p>`).join('')}
        </div>
      ` : ''}
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <button onclick="exportAnalytics()" style="padding: 8px 16px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer;">Export Data</button>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
};

function exportAnalytics() {
  const events = JSON.parse(localStorage.getItem('analytics') || '[]');
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `promptport_analytics_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Initialize Google APIs on page load
initializeGoogleAPIs();

// Add event listeners for Google Drive buttons
document.getElementById('backupToGoogleDriveBtn').onclick = backupToGoogleDrive;
document.getElementById('restoreFromGoogleDriveBtn').onclick = restoreFromGoogleDrive;

loadPrompts();