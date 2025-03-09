// WebSocket Manager for Issue Agent Chat
class WebSocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.messageQueue = [];
        this.callbacks = {
            onMessage: null,
            onConnect: null,
            onDisconnect: null,
            onFileReceived: null,
            onTraceUpdate: null
        };
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = 3000; // ms
    }

    // Initialize WebSocket connection
    connect(url = 'ws://localhost:8787') {
        try {
            console.log(`Connecting to WebSocket at ${url}...`);
            this.socket = new WebSocket(url);
            
            this.socket.onopen = () => {
                console.log('WebSocket connection established');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Send any queued messages
                while (this.messageQueue.length > 0) {
                    const queuedMessage = this.messageQueue.shift();
                    this.sendMessage(queuedMessage.type, queuedMessage.data);
                }
                
                if (this.callbacks.onConnect) {
                    this.callbacks.onConnect();
                }
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('Received message:', message);
                    
                    switch (message.type) {
                        case 'chat_message':
                            if (this.callbacks.onMessage) {
                                this.callbacks.onMessage(message.data);
                            }
                            break;
                        case 'file_update':
                            if (this.callbacks.onFileReceived) {
                                this.callbacks.onFileReceived(message.data);
                            }
                            break;
                        case 'trace_update':
                            if (this.callbacks.onTraceUpdate) {
                                this.callbacks.onTraceUpdate(message.data);
                            }
                            break;
                        default:
                            console.log('Unhandled message type:', message.type);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.socket.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                this.isConnected = false;
                
                if (this.callbacks.onDisconnect) {
                    this.callbacks.onDisconnect(event);
                }
                
                // Attempt to reconnect if not closed intentionally
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                    setTimeout(() => this.connect(url), this.reconnectTimeout);
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to establish WebSocket connection:', error);
        }
    }
    
    // Send a message to the server
    sendMessage(type, data) {
        const message = JSON.stringify({
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.log('Connection not ready, queueing message');
            this.messageQueue.push({ type, data });
        }
    }
    
    // Send a chat message
    sendChatMessage(message) {
        this.sendMessage('chat_message', message);
    }
    
    // Upload file metadata
    uploadFile(fileData) {
        this.sendMessage('file_upload', fileData);
    }
    
    // Update trace selection
    updateTraceSelection(traceData) {
        this.sendMessage('trace_selection', traceData);
    }
    
    // Register event callbacks
    onMessage(callback) {
        this.callbacks.onMessage = callback;
    }
    
    onConnect(callback) {
        this.callbacks.onConnect = callback;
    }
    
    onDisconnect(callback) {
        this.callbacks.onDisconnect = callback;
    }
    
    onFileReceived(callback) {
        this.callbacks.onFileReceived = callback;
    }
    
    onTraceUpdate(callback) {
        this.callbacks.onTraceUpdate = callback;
    }
    
    // Close the connection
    disconnect() {
        if (this.socket) {
            this.socket.close(1000, "Intentional disconnect");
        }
    }
}

// Export for use in other scripts
window.WebSocketManager = WebSocketManager;
