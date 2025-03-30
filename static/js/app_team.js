function getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = getBaseUrl();
    return `${protocol}//${host}/ws/chat`;
}

let ws = new WebSocket(getWebSocketUrl());
let isChatActive = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

ws.onmessage = function (event) {
    const message = JSON.parse(event.data);

    if (message.type === 'UserInputRequestedEvent') {
        enableInput();
    }
    else if (message.type === 'error') {
        displayMessage(message.content, 'error');
        enableInput();
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
    enableInput();
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

// Add cancel functionality
function cancelChat() {
    if (ws && isChatActive) {
        ws.close();
        isChatActive = false;
        document.getElementById('cancel-button').style.display = 'none';
        document.getElementById('send-button').disabled = false;
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const button = document.getElementById('send-button');
    const message = input.value;
    if (!message) return;
    document.getElementById('cancel-button').style.display = 'inline-flex';
    document.getElementById('send-button').disabled = true;
    isChatActive = true;
    // Clear input and disable input and send button
    input.value = '';
    disableInput();

    // Send message to WebSocket
    ws.send(JSON.stringify({ content: message, source: 'user' }));
}

function displayMessage(message, source) {
    
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${source}`;

    if (message.isHtml) {
        messageElement.innerHTML = message.content;
    } else {
        messageElement.textContent = message.content;
    }

    const labelElement = document.createElement('span');
    labelElement.className = 'label';
    labelElement.textContent = source;

    messageElement.prepend(labelElement);
    // messageElement.appendChild(contentElement);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollIntoView({ behavior: 'smooth' });
}

function disableInput() {
    const input = document.getElementById('message-input');
    const button = document.getElementById('send-button');
    input.disabled = true;
    button.disabled = true;
}

function enableInput() {
    const input = document.getElementById('message-input');
    const button = document.getElementById('send-button');
    input.disabled = false;
    button.disabled = false;
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