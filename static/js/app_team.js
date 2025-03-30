function getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/chat`;
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

// UI Element References
const UI = {
    messageInput: () => document.getElementById('message-input'),
    sendButton: () => document.getElementById('send-button'),
    cancelButton: () => document.getElementById('cancel-button'),
    messagesContainer: () => document.getElementById('messages'),
    spinner: () => document.getElementById('spinner')
};

// State Management
let isRequestActive = false;
let isChatActive = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

let ws = new WebSocket(getWebSocketUrl());

ws.onmessage = function (event) {
    const message = JSON.parse(event.data);

    if (message.type === 'UserInputRequestedEvent') {
        toggleUIControls(false);
    }
    else if (message.type === 'error') {
        displayMessage(message.content, 'error');
        toggleUIControls(false);
    }
    else {
        displayMessage(message, message.source);
    }
};

ws.onerror = function (error) {
    console.error('WebSocket error:', error);
    const error_message = {
        content: "Connection error. Attempting to reconnect...",
        source: 'error'
    };
    displayMessage(error_message, 'error');
    toggleUIControls(false);
};

ws.onclose = function() {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(() => {
            console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
            const newWs = new WebSocket(getWebSocketUrl());
            Object.assign(newWs, ws);
            ws = newWs;
        }, 1000 * reconnectAttempts);
    } else {
        const error_message = {
            content: "Connection lost. Please refresh the page.",
            source: 'error'
        };
        displayMessage(error_message, 'error');
    }
};

document.getElementById('message-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.target.disabled) {
        sendMessage();
    }
});

// UI Controls
function toggleUIControls(disabled) {
    UI.messageInput().disabled = disabled;
    UI.sendButton().disabled = disabled;
    UI.cancelButton().style.display = disabled ? 'inline-flex' : 'none';
}

function showSpinner() {
    UI.spinner().style.display = 'block';
}

function hideSpinner() {
    UI.spinner().style.display = 'none';
}

// Message Handling
async function sendMessage() {
    const message = UI.messageInput().value.trim();
    
    if (!message) return;
    
    try {
        isRequestActive = true;
        isChatActive = true;
        
        showSpinner();
        toggleUIControls(true);
        
        UI.messageInput().value = '';
        
        await ws.send(JSON.stringify({ 
            content: message, 
            source: 'user' 
        }));
    } catch (error) {
        console.error('Failed to send message:', error);
        toggleUIControls(false);
    }
}

function displayMessage(message, source) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${source} new-message`;
    
    if (message.isHtml) {
        messageElement.innerHTML = message.content;
    } else {
        messageElement.textContent = message.content;
    }
    
    const labelElement = document.createElement('span');
    labelElement.className = 'label';
    labelElement.textContent = source;
    
    messageElement.prepend(labelElement);
    UI.messagesContainer().appendChild(messageElement);
    
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    
    setTimeout(() => {
        messageElement.classList.remove('new-message');
    }, 1000);
    
    if (source !== 'user' && source !== 'user_proxy') {
        isRequestActive = false;
        hideSpinner();
        toggleUIControls(false);
    }
}

function cancelChat() {
    isRequestActive = false;
    isChatActive = false;
    hideSpinner();
    toggleUIControls(false);
}

function getBaseUrl() {
    return window.location.origin;
}

async function loadHistory() {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/history`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const history = await response.json();
        history.forEach(message => {
            displayMessage(message, message.source);
        });
    } catch (error) {
        console.error('Error loading history:', error);
        const errorMessage = {
            content: "Failed to load chat history. Please refresh the page.",
            source: 'error'
        };
        displayMessage(errorMessage, 'error');
    }
}

// Load chat history when the page loads
window.onload = loadHistory;