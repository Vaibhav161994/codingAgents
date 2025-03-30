const ws = new WebSocket('ws://localhost:8002/ws/chat');
let isChatActive = false;

ws.onmessage = function (event) {
    const message = JSON.parse(event.data);

    if (message.type === 'UserInputRequestedEvent') {
        // Re-enable input and send button if UserInputRequestedEvent is received
        enableInput();
    }
    else if (message.type === 'error') {
        // Display error message
        displayMessage(message.content, 'error');
        enableInput();
    }
    else {
        // Display regular message
        displayMessage(message, message.source);
    }
};

ws.onerror = function (error) {
    error_message = {};
    error_message.content = "WebSocket error occurred. Please refresh the page.";
    error_message.source = 'error';
    displayMessage(error_message, 'error');
    enableInput();
};

ws.onclose = function () {
    error_message = {};
    error_message.content = "Connection closed. Please refresh the page."
    error_message.source = 'system';
    displayMessage(error_message, 'system');
    disableInput();
    isChatActive = false;
    document.getElementById('cancel-button').style.display = 'none';
    document.getElementById('send-button').disabled = false;
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

async function loadHistory() {
    try {
        const response = await fetch('http://localhost:8002/history');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const history = await response.json();
        history.forEach(message => {
            displayMessage(message, message.source);
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Load chat history when the page loads
window.onload = loadHistory;