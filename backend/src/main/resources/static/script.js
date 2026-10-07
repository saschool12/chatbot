/**
 * NovaChat - Modern ChatGPT-Style Frontend for Java Spring Boot Backend
 */

(function () {
  'use strict';

  // --- Configuration & State ---
  const STORAGE_KEY_SESSIONS = 'novachat_sessions_v1';
  const STORAGE_KEY_SETTINGS = 'novachat_settings_v1';

  // Determine default API URL
  const defaultBaseUrl = (window.location.origin && window.location.origin.startsWith('http'))
    ? window.location.origin
    : 'http://localhost:8080';

  const state = {
    currentConversationId: null,
    isGenerating: false,
    persona: 'default',
    settings: {
      soundEnabled: true,
      typewriterEnabled: true,
      geminiApiKey: '',
      apiBaseUrl: defaultBaseUrl
    },
    sessions: []
  };

  // --- DOM Elements ---
  const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    chatHistoryList: document.getElementById('chatHistoryList'),
    clearAllHistoryBtn: document.getElementById('clearAllHistoryBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    backendStatusText: document.getElementById('backendStatusText'),

    personaSelect: document.getElementById('personaSelect'),
    clearChatBtn: document.getElementById('clearChatBtn'),

    messagesContainer: document.getElementById('messagesContainer'),
    welcomeHero: document.getElementById('welcomeHero'),
    chatMessagesStream: document.getElementById('chatMessagesStream'),
    typingIndicator: document.getElementById('typingIndicator'),

    chatForm: document.getElementById('chatForm'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),

    // Settings Modal
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    soundToggle: document.getElementById('soundToggle'),
    typewriterToggle: document.getElementById('typewriterToggle'),
    geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
    apiUrlInput: document.getElementById('apiUrlInput'),
    resetAllDataBtn: document.getElementById('resetAllDataBtn'),

    toast: document.getElementById('toast')
  };

  // --- Audio Synthesis (Web Audio API) ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!state.settings.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'receive') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(message) {
    if (elements.toast) {
      elements.toast.textContent = message;
      elements.toast.classList.remove('hidden');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        elements.toast.classList.add('hidden');
      }, 3000);
    }
  }

  // --- Persistence ---
  function loadPersistedData() {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
      }
      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (savedSessions) {
        state.sessions = JSON.parse(savedSessions);
      }
    } catch (e) {
      console.error('Failed to load storage:', e);
    }
  }

  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(state.sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  // --- Backend Health Check ---
  async function checkBackendHealth() {
    try {
      const targetUrl = `${state.settings.apiBaseUrl}/api/chat/health`;
      const res = await fetch(targetUrl, { method: 'GET', cache: 'no-cache' });
      if (res.ok) {
        if (elements.backendStatusText) elements.backendStatusText.textContent = 'Backend Online';
      } else {
        if (elements.backendStatusText) elements.backendStatusText.textContent = 'Backend Error';
      }
    } catch (e) {
      if (elements.backendStatusText) elements.backendStatusText.textContent = 'Backend Disconnected';
    }
  }

  // --- Session Management ---
  function createNewChat() {
    state.currentConversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    elements.chatMessagesStream.innerHTML = '';
    elements.welcomeHero.classList.remove('hidden');
    elements.messageInput.value = '';
    autoResizeTextarea();
    elements.messageInput.focus();
    updateSendButtonState();
    renderChatHistory();

    // Close sidebar on mobile
    closeMobileSidebar();
  }

  function getCurrentSession() {
    return state.sessions.find(s => s.id === state.currentConversationId);
  }

  function saveCurrentMessage(sender, text, suggestions = []) {
    let session = getCurrentSession();
    if (!session) {
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
      session = {
        id: state.currentConversationId,
        title: title || 'New Conversation',
        createdAt: new Date().toISOString(),
        messages: []
      };
      state.sessions.unshift(session);
    }

    session.messages.push({
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions
    });

    saveSessions();
    renderChatHistory();
  }

  function loadSession(sessionId) {
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) return;

    state.currentConversationId = session.id;
    elements.chatMessagesStream.innerHTML = '';
    elements.welcomeHero.classList.add('hidden');

    session.messages.forEach(msg => {
      appendMessageToUI(msg.sender, msg.text, msg.timestamp, msg.suggestions, false);
    });

    renderChatHistory();
    closeMobileSidebar();
    scrollToBottom();
  }

  function deleteSession(sessionId, e) {
    if (e) e.stopPropagation();
    state.sessions = state.sessions.filter(s => s.id !== sessionId);
    saveSessions();

    if (state.currentConversationId === sessionId) {
      createNewChat();
    } else {
      renderChatHistory();
    }
    showToast('Conversation deleted');
  }

  function clearAllSessions() {
    if (confirm('Are you sure you want to clear all chat history?')) {
      state.sessions = [];
      saveSessions();
      createNewChat();
      showToast('All chat history cleared');
    }
  }

  function renderChatHistory() {
    if (!elements.chatHistoryList) return;
    elements.chatHistoryList.innerHTML = '';

    if (state.sessions.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-history-text';
      emptyDiv.textContent = 'No previous chats yet.';
      elements.chatHistoryList.appendChild(emptyDiv);
      return;
    }

    state.sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = 'history-item' + (session.id === state.currentConversationId ? ' active' : '');
      item.onclick = () => loadSession(session.id);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'history-item-title';
      titleSpan.textContent = session.title;
      titleSpan.title = session.title;

      const delBtn = document.createElement('button');
      delBtn.className = 'history-item-delete';
      delBtn.title = 'Delete chat';
      delBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      delBtn.onclick = (e) => deleteSession(session.id, e);

      item.appendChild(titleSpan);
      item.appendChild(delBtn);
      elements.chatHistoryList.appendChild(item);
    });
  }

  // --- Markdown Formatter & Code Block Builder ---
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatMarkdown(rawText) {
    if (!rawText) return '';

    // Step 1: Protect fenced code blocks
    const codeBlocks = [];
    let processed = rawText.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ lang: lang || 'text', code: code.trim() });
      return id;
    });

    // Step 2: Escape HTML for security
    processed = escapeHtml(processed);

    // Step 3: Headers
    processed = processed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    processed = processed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    processed = processed.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Step 4: Bold & Italic
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Step 5: Inline code
    processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Step 6: Tables
    processed = processed.replace(/((?:\|.+?\|\r?\n)+)/g, (match) => {
      const rows = match.trim().split('\n');
      let tableHtml = '<table>';
      let isHeader = true;

      rows.forEach(row => {
        if (row.includes('---')) {
          isHeader = false;
          return;
        }
        const cols = row.split('|').filter((col, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableHtml += '<tr>';
        cols.forEach(col => {
          const tag = isHeader ? 'th' : 'td';
          tableHtml += `<${tag}>${col.trim()}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      return tableHtml;
    });

    // Step 7: Bullet Lists
    processed = processed.replace(/(?:^|\n)[*-] (.+)/g, '<li>$1</li>');
    processed = processed.replace(/(<li>.+<\/li>)/g, '<ul>$1</ul>');

    // Step 8: Paragraphs & Line Breaks
    processed = processed.replace(/\n\n+/g, '</p><p>');
    processed = '<p>' + processed.replace(/\n/g, '<br>') + '</p>';

    // Cleanup empty paragraphs
    processed = processed.replace(/<p><\/p>/g, '');

    // Step 9: Reinsert code blocks
    codeBlocks.forEach((block, index) => {
      const placeholder = `__CODE_BLOCK_${index}__`;
      const codeHtml = `
        <div class="code-block-container">
          <div class="code-block-header">
            <span class="code-language">${escapeHtml(block.lang)}</span>
            <button class="btn-copy-code" data-code="${encodeURIComponent(block.code)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </button>
          </div>
          <pre><code>${escapeHtml(block.code)}</code></pre>
        </div>
      `;
      processed = processed.replace(placeholder, codeHtml);
    });

    return processed;
  }

  // --- UI Message Rendering ---
  function appendMessageToUI(sender, text, timestamp, suggestions = [], animate = false) {
    elements.welcomeHero.classList.add('hidden');

    const row = document.createElement('div');
    row.className = `message-row ${sender === 'user' ? 'user-row' : 'bot-row'}`;

    const avatar = document.createElement('div');
    avatar.className = `avatar ${sender === 'user' ? 'user-avatar' : 'bot-avatar'}`;
    avatar.innerHTML = sender === 'user'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
           <circle cx="12" cy="7" r="4"></circle>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <rect x="3" y="11" width="18" height="10" rx="2"></rect>
           <circle cx="12" cy="5" r="2"></circle>
           <path d="M12 7v4"></path>
           <line x1="8" y1="16" x2="8" y2="16"></line>
           <line x1="16" y1="16" x2="16" y2="16"></line>
         </svg>`;

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'message-content-wrapper';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (sender === 'user') {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = formatMarkdown(text);
    }

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.innerHTML = `
      <span>${timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <button class="btn-copy-msg" title="Copy message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      </button>
    `;

    meta.querySelector('.btn-copy-msg').onclick = () => {
      navigator.clipboard.writeText(text);
      showToast('Message copied to clipboard');
    };

    contentWrapper.appendChild(bubble);
    contentWrapper.appendChild(meta);

    // Suggestions chips (for bot)
    if (sender === 'bot' && suggestions && suggestions.length > 0) {
      const chipsContainer = document.createElement('div');
      chipsContainer.className = 'suggestions-chips-row';
      suggestions.forEach(sug => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'suggestion-chip';
        chip.textContent = sug;
        chip.onclick = () => {
          elements.messageInput.value = sug;
          sendMessage();
        };
        chipsContainer.appendChild(chip);
      });
      contentWrapper.appendChild(chipsContainer);
    }

    row.appendChild(avatar);
    row.appendChild(contentWrapper);
    elements.chatMessagesStream.appendChild(row);

    // Attach copy listeners to any code blocks
    row.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.onclick = () => {
        const rawCode = decodeURIComponent(btn.getAttribute('data-code'));
        navigator.clipboard.writeText(rawCode);
        const span = btn.querySelector('span');
        const orig = span.textContent;
        span.textContent = 'Copied!';
        setTimeout(() => { span.textContent = orig; }, 2000);
      };
    });

    scrollToBottom();
  }

  function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
  }

  // --- Send Message & API Request ---
  async function sendMessage() {
    const rawText = elements.messageInput.value.trim();
    if (!rawText || state.isGenerating) return;

    if (!state.currentConversationId) {
      state.currentConversationId = 'conv_' + Date.now();
    }

    state.isGenerating = true;
    updateSendButtonState();

    // 1. Append user message
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appendMessageToUI('user', rawText, userTime);
    saveCurrentMessage('user', rawText);
    playSound('send');

    // 2. Clear input
    elements.messageInput.value = '';
    autoResizeTextarea();

    // 3. Show typing indicator
    showTypingIndicator(true);

    try {
      const apiUrl = `${state.settings.apiBaseUrl}/api/chat`;
      const payload = {
        message: rawText,
        conversationId: state.currentConversationId,
        personality: state.persona,
        apiKey: state.settings.geminiApiKey
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      showTypingIndicator(false);

      const botReply = data.reply || 'No response from server.';
      const suggestions = data.suggestions || [];
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      playSound('receive');
      appendMessageToUI('bot', botReply, botTime, suggestions, state.settings.typewriterEnabled);
      saveCurrentMessage('bot', botReply, suggestions);

      if (elements.backendStatusText) {
        elements.backendStatusText.textContent = 'Backend Online';
      }
    } catch (err) {
      console.error('Chat error:', err);
      showTypingIndicator(false);

      const errorMsg = `⚠️ **Connection Error**: Unable to reach backend at \`${state.settings.apiBaseUrl}/api/chat\`.\n\n`
        + `*Details: ${err.message}*\n\n`
        + `**Troubleshooting:**\n`
        + `1. Ensure Spring Boot backend is running: \`./mvnw spring-boot:run\` or \`java -jar target/*.jar\` on port 8080.\n`
        + `2. Verify API Base URL in Settings.`;

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      appendMessageToUI('bot', errorMsg, botTime);
      saveCurrentMessage('bot', errorMsg);

      if (elements.backendStatusText) {
        elements.backendStatusText.textContent = 'Backend Offline';
      }
    } finally {
      state.isGenerating = false;
      updateSendButtonState();
      elements.messageInput.focus();
    }
  }

  function showTypingIndicator(show) {
    if (elements.typingIndicator) {
      if (show) {
        elements.typingIndicator.classList.remove('hidden');
        scrollToBottom();
      } else {
        elements.typingIndicator.classList.add('hidden');
      }
    }
  }

  function updateSendButtonState() {
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.disabled = !hasText || state.isGenerating;
  }

  function autoResizeTextarea() {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 180) + 'px';
  }

  // --- Mobile Drawer Controls ---
  function toggleMobileSidebar() {
    elements.sidebar.classList.toggle('open');
    elements.sidebarBackdrop.classList.toggle('active');
  }

  function closeMobileSidebar() {
    elements.sidebar.classList.remove('open');
    elements.sidebarBackdrop.classList.remove('active');
  }

  // --- Settings Modal Controls ---
  function openSettings() {
    elements.soundToggle.checked = state.settings.soundEnabled;
    elements.typewriterToggle.checked = state.settings.typewriterEnabled;
    if (elements.geminiApiKeyInput) elements.geminiApiKeyInput.value = state.settings.geminiApiKey || '';
    elements.apiUrlInput.value = state.settings.apiBaseUrl;
    elements.settingsModal.classList.remove('hidden');
  }

  function closeSettings() {
    elements.settingsModal.classList.add('hidden');
  }

  function saveSettingsFromModal() {
    state.settings.soundEnabled = elements.soundToggle.checked;
    state.settings.typewriterEnabled = elements.typewriterToggle.checked;
    if (elements.geminiApiKeyInput) state.settings.geminiApiKey = elements.geminiApiKeyInput.value.trim();
    let url = elements.apiUrlInput.value.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    state.settings.apiBaseUrl = url || defaultBaseUrl;

    saveSettings();
    closeSettings();
    showToast('Settings saved successfully');
    checkBackendHealth();
  }

  // --- Clear Current Chat ---
  async function clearCurrentChat() {
    if (confirm('Clear messages in current chat?')) {
      if (state.currentConversationId) {
        try {
          await fetch(`${state.settings.apiBaseUrl}/api/chat/clear?conversationId=${state.currentConversationId}`, {
            method: 'POST'
          });
        } catch (e) {
          // Backend clear optional
        }
        deleteSession(state.currentConversationId);
      }
      createNewChat();
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Input handling
    elements.messageInput.addEventListener('input', () => {
      autoResizeTextarea();
      updateSendButtonState();
    });

    elements.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    elements.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage();
    });

    // Persona selection
    elements.personaSelect.addEventListener('change', (e) => {
      state.persona = e.target.value;
      showToast(`Personality set to: ${e.target.options[e.target.selectedIndex].text}`);
    });

    // Buttons
    elements.newChatBtn.addEventListener('click', createNewChat);
    elements.clearChatBtn.addEventListener('click', clearCurrentChat);
    elements.clearAllHistoryBtn.addEventListener('click', clearAllSessions);

    // Sidebar Mobile Toggle
    elements.toggleSidebarBtn.addEventListener('click', toggleMobileSidebar);
    elements.sidebarBackdrop.addEventListener('click', closeMobileSidebar);

    // Settings
    elements.openSettingsBtn.addEventListener('click', openSettings);
    elements.closeSettingsBtn.addEventListener('click', closeSettings);
    elements.saveSettingsBtn.addEventListener('click', saveSettingsFromModal);
    elements.resetAllDataBtn.addEventListener('click', () => {
      if (confirm('Warning: This will delete all local chat history and reset settings! Continue?')) {
        localStorage.clear();
        state.sessions = [];
        state.settings = {
          soundEnabled: true,
          typewriterEnabled: true,
          geminiApiKey: '',
          apiBaseUrl: defaultBaseUrl
        };
        closeSettings();
        createNewChat();
        showToast('All data reset');
      }
    });

    // Suggestion Cards on Welcome Screen
    document.querySelectorAll('.suggestion-card').forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        if (prompt) {
          elements.messageInput.value = prompt;
          sendMessage();
        }
      });
    });

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        createNewChat();
      }
      if (e.key === 'Escape' && !elements.settingsModal.classList.contains('hidden')) {
        closeSettings();
      }
    });
  }

  // --- App Initialization ---
  function init() {
    loadPersistedData();
    setupEventListeners();

    if (state.sessions.length > 0) {
      loadSession(state.sessions[0].id);
    } else {
      createNewChat();
    }

    renderChatHistory();
    checkBackendHealth();
    setInterval(checkBackendHealth, 30000);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
