// MVC Pattern Implementation for Issue Agent Chat Room
// ====== MODEL ======
class ChatModel {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.files = [];
        this.traces = [];
        this.selectedFiles = [];
        this.selectedTraces = [];
        this.displayMode = 'summary'; // 'summary' or 'tags'
        this.currentFileSource = 'all'; // 'all', 'elg', 'csv', 'remote'
        this.currentTraceType = 'all'; // 'all', 'group', 'custom', 'customGroup'
        this.socketManager = new WebSocketManager();
        this.loadData();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Set up WebSocket listeners
        this.socketManager.onMessage((message) => {
            if (this.currentConversation) {
                this.currentConversation.messages.push(message);
                this.notifyObservers('messageReceived', message);
            }
        });

        this.socketManager.onFileReceived((fileData) => {
            this.files.push(fileData);
            this.notifyObservers('filesUpdated', this.files);
        });

        this.socketManager.onTraceUpdate((traceData) => {
            this.traces.push(traceData);
            this.notifyObservers('tracesUpdated', this.traces);
        });

        this.socketManager.onConnect(() => {
            this.notifyObservers('connectionEstablished');
        });

        this.socketManager.onDisconnect(() => {
            this.notifyObservers('connectionLost');
        });

        // Connect to WebSocket server
        this.socketManager.connect();
    }

    loadData() {
        // Simulated data loading - in a real app, this would come from an API
        this.conversations = [
            {
                id: 1,
                issueCode: 'IS-1234',
                name: '記憶體洩漏問題',
                summary: '應用程式在長時間運行後出現記憶體洩漏問題...',
                tags: ['記憶體', '性能', '緊急'],
                lastMessageTime: '12:30',
                isActive: true,
                messages: [
                    {
                        id: 1,
                        sender: '系統',
                        avatar: 'IS',
                        text: '已建立新的問題報告：記憶體洩漏問題 (IS-1234)',
                        time: '10:30',
                        isSent: false
                    },
                    {
                        id: 2,
                        sender: 'John Doe',
                        avatar: 'JD',
                        text: '我們發現在長時間運行後，後端服務記憶體使用率持續增加，沒有恢復跡象。特別是處理大量資料的模組。',
                        time: '10:32',
                        isSent: false
                    },
                    {
                        id: 3,
                        text: '我會檢查一下記憶體分析報告，請提供最近的伺服器日誌。',
                        time: '10:33',
                        isSent: true
                    },
                    {
                        id: 4,
                        sender: 'John Doe',
                        avatar: 'JD',
                        text: '這是最近的記憶體分析圖表',
                        time: '10:40',
                        isSent: false,
                        image: '/api/placeholder/500/300'
                    }
                ]
            },
            {
                id: 2,
                issueCode: 'IS-1235',
                name: 'API 回應緩慢',
                summary: '用戶報告API在高流量時回應時間超過預期...',
                tags: ['API', '效能', '重要'],
                lastMessageTime: '昨天',
                isActive: false,
                messages: []
            },
            {
                id: 3,
                issueCode: '2025-03-08',
                name: '每日系統檢查',
                summary: '例行系統檢查，發現網絡延遲異常...',
                tags: ['監控', '網絡', '例行'],
                lastMessageTime: '3/8',
                isActive: false,
                messages: []
            }
        ];

        this.files = [
            {
                id: 1,
                name: 'system_log.elg',
                size: '3.2 MB',
                date: '昨天',
                source: 'elg',
                isSelected: false
            },
            {
                id: 2,
                name: 'memory_stats.csv',
                size: '1.5 MB',
                date: '3/7',
                source: 'csv',
                isSelected: false
            },
            {
                id: 3,
                name: 'server_profile.bin',
                size: '4.7 MB',
                date: '3/5',
                source: 'remote',
                isSelected: false
            }
        ];

        this.traces = [
            {
                id: 1,
                name: 'Memory Allocation',
                type: 'group',
                isSelected: true
            },
            {
                id: 2,
                name: 'Network Calls',
                type: 'custom',
                isSelected: false
            },
            {
                id: 3,
                name: 'Error Handling',
                type: 'customGroup',
                isSelected: false
            }
        ];

        // Set current conversation to the active one
        this.currentConversation = this.conversations.find(conv => conv.isActive) || this.conversations[0];
    }

    // Observer pattern implementation
    observers = [];

    addObserver(observer) {
        this.observers.push(observer);
    }

    notifyObservers(event, data) {
        this.observers.forEach(observer => {
            if (observer.update) {
                observer.update(event, data);
            }
        });
    }

    // Conversation methods
    setCurrentConversation(conversationId) {
        const conversation = this.conversations.find(conv => conv.id === conversationId);
        if (conversation) {
            this.conversations.forEach(conv => conv.isActive = false);
            conversation.isActive = true;
            this.currentConversation = conversation;
            this.notifyObservers('conversationChanged', conversation);
        }
    }

    sendMessage(text) {
        if (!this.currentConversation) return;
        
        const message = {
            id: this.currentConversation.messages.length + 1,
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSent: true
        };
        
        this.currentConversation.messages.push(message);
        this.socketManager.sendChatMessage(message);
        this.notifyObservers('messageSent', message);
        return message;
    }

    sendImageMessage(imageUrl) {
        if (!this.currentConversation) return;
        
        const message = {
            id: this.currentConversation.messages.length + 1,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSent: true,
            image: imageUrl
        };
        
        this.currentConversation.messages.push(message);
        this.socketManager.sendChatMessage(message);
        this.notifyObservers('messageSent', message);
        return message;
    }

    // Display mode methods
    setDisplayMode(mode) {
        if (mode === 'summary' || mode === 'tags') {
            this.displayMode = mode;
            this.notifyObservers('displayModeChanged', mode);
        }
    }

    // File methods
    setFileSource(source) {
        this.currentFileSource = source;
        this.notifyObservers('fileSourceChanged', source);
    }

    toggleFileSelection(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            file.isSelected = !file.isSelected;
            this.notifyObservers('fileSelectionChanged', this.files);
        }
    }

    uploadFile(fileData) {
        // In a real app, this would handle the file upload via WebSocket
        const newFile = {
            id: this.files.length + 1,
            name: fileData.name,
            size: fileData.size,
            date: new Date().toLocaleDateString(),
            source: fileData.type.includes('csv') ? 'csv' : 
                    fileData.type.includes('log') || fileData.name.endsWith('.elg') ? 'elg' : 'remote',
            isSelected: false
        };
        
        this.files.push(newFile);
        this.socketManager.uploadFile(newFile);
        this.notifyObservers('fileUploaded', newFile);
    }

    // Trace methods
    setTraceType(type) {
        this.currentTraceType = type;
        this.notifyObservers('traceTypeChanged', type);
    }

    toggleTraceSelection(traceId) {
        const trace = this.traces.find(t => t.id === traceId);
        if (trace) {
            trace.isSelected = !trace.isSelected;
            this.socketManager.updateTraceSelection(trace);
            this.notifyObservers('traceSelectionChanged', this.traces);
        }
    }
}

// ====== CONTROLLER ======
class ChatController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        
        // Add controller as observer to model
        this.model.addObserver(this);
        
        // Initialize with current data
        this.initializeView();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    initializeView() {
        // Initialize the view with model data
        this.view.renderConversationList(this.model.conversations, this.model.displayMode);
        this.view.renderCurrentConversation(this.model.currentConversation);
        this.view.renderFilesList(this.model.files, this.model.currentFileSource);
        this.view.renderTraceList(this.model.traces, this.model.currentTraceType);
        
        // Set initial display mode
        this.view.setDisplayMode(this.model.displayMode);
    }
    
    setupEventListeners() {
        // Chat history events
        this.view.onConversationSelect((conversationId) => {
            this.model.setCurrentConversation(conversationId);
        });
        
        this.view.onDisplayModeChange((mode) => {
            this.model.setDisplayMode(mode);
        });
        
        // Message events
        this.view.onMessageSend((text) => {
            if (text.trim()) {
                this.model.sendMessage(text);
            }
        });
        
        this.view.onImageUpload((imageUrl) => {
            this.model.sendImageMessage(imageUrl);
        });
        
        // File events
        this.view.onFileSourceChange((source) => {
            this.model.setFileSource(source);
        });
        
        this.view.onFileSelect((fileId) => {
            this.model.toggleFileSelection(fileId);
            this.view.adjustSidebarSections('files');
        });
        
        this.view.onFileUpload((fileData) => {
            this.model.uploadFile(fileData);
        });
        
        // Trace events
        this.view.onTraceTypeChange((type) => {
            this.model.setTraceType(type);
        });
        
        this.view.onTraceSelect((traceId) => {
            this.model.toggleTraceSelection(traceId);
            this.view.adjustSidebarSections('trace');
        });
    }
    
    // Observer update method
    update(event, data) {
        switch (event) {
            case 'conversationChanged':
                this.view.renderCurrentConversation(data);
                this.view.updateConversationList(this.model.conversations, this.model.displayMode);
                break;
                
            case 'messageReceived':
            case 'messageSent':
                this.view.renderMessage(data);
                this.view.scrollToBottom();
                break;
                
            case 'displayModeChanged':
                this.view.setDisplayMode(data);
                this.view.updateConversationList(this.model.conversations, data);
                break;
                
            case 'fileSourceChanged':
                this.view.renderFilesList(this.model.files, data);
                break;
                
            case 'fileSelectionChanged':
            case 'fileUploaded':
                this.view.renderFilesList(this.model.files, this.model.currentFileSource);
                break;
                
            case 'traceTypeChanged':
                this.view.renderTraceList(this.model.traces, data);
                break;
                
            case 'traceSelectionChanged':
                this.view.renderTraceList(this.model.traces, this.model.currentTraceType);
                break;
                
            case 'connectionEstablished':
                this.view.showConnectionStatus(true);
                break;
                
            case 'connectionLost':
                this.view.showConnectionStatus(false);
                break;
        }
    }
}

// ====== VIEW ======
class ChatView {
    constructor() {
        // Cache DOM elements
        this.chatList = document.querySelector('.chat-list');
        this.messagesContainer = document.querySelector('.messages-container');
        this.chatHeader = document.querySelector('.chat-header');
        this.messageInput = document.querySelector('.message-input');
        this.sendButton = document.querySelector('.send-btn');
        
        // Mode toggle buttons
        this.summaryModeBtn = document.querySelector('[data-mode="summary"]');
        this.tagsModeBtn = document.querySelector('[data-mode="tags"]');
        
        // File source buttons
        this.allFilesBtn = document.querySelector('[data-source="all"]');
        this.elgFilesBtn = document.querySelector('[data-source="elg"]');
        this.csvFilesBtn = document.querySelector('[data-source="csv"]');
        this.remoteFilesBtn = document.querySelector('[data-source="remote"]');
        this.filesList = document.querySelector('.files-list');
        this.uploadFileBtn = document.getElementById('fileUploadBtn');
        this.fileUploadInput = document.getElementById('fileUploadInput');
        
        // Trace type buttons
        this.allTracesBtn = document.querySelector('[data-type="all"]');
        this.groupTracesBtn = document.querySelector('[data-type="group"]');
        this.customTracesBtn = document.querySelector('[data-type="custom"]');
        this.customGroupTracesBtn = document.querySelector('[data-type="customGroup"]');
        this.traceList = document.querySelector('.trace-list');
        
        // File and Trace sections
        this.filesSection = document.getElementById('filesSection');
        this.traceSection = document.getElementById('traceSection');
        
        // Image upload button
        this.imageUploadBtn = document.getElementById('imageUploadBtn');
    }
    
    // Render methods
    renderConversationList(conversations, mode) {
        this.chatList.innerHTML = '';
        conversations.forEach(conv => {
            const isActive = conv.isActive ? 'active' : '';
            const summaryDisplay = mode === 'summary' ? 'block' : 'none';
            const tagsDisplay = mode === 'tags' ? 'block' : 'none';
            
            let tagsHtml = '';
            conv.tags.forEach(tag => {
                tagsHtml += `<span class="tag">${tag}</span>`;
            });
            
            const html = `
                <div class="chat-item ${isActive}" data-id="${conv.id}">
                    <div class="avatar issue-avatar">${conv.issueCode}</div>
                    <div class="chat-info">
                        <div class="chat-name">${conv.name}</div>
                        <div class="chat-preview summary-mode" style="display: ${summaryDisplay}">${conv.summary}</div>
                        <div class="chat-preview tags-mode" style="display: ${tagsDisplay}">
                            ${tagsHtml}
                        </div>
                    </div>
                    <div class="chat-time">${conv.lastMessageTime}</div>
                </div>
            `;
            
            this.chatList.innerHTML += html;
        });
        
        // Add event listeners to new conversation items
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                this._conversationSelectCallback(id);
            });
        });
    }
    
    updateConversationList(conversations, mode) {
        // Update active state without re-rendering everything
        document.querySelectorAll('.chat-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            const isActive = conversations.find(conv => conv.id === id)?.isActive;
            
            if (isActive) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    renderCurrentConversation(conversation) {
        if (!conversation) return;
        
        // Update header
        let tagsHtml = '';
        conversation.tags.forEach(tag => {
            tagsHtml += `<span class="tag">${tag}</span>`;
        });
        
        this.chatHeader.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="avatar issue-avatar">${conversation.issueCode}</div>
                <div class="chat-title">
                    <h5>${conversation.name}</h5>
                    <div class="issue-tags">
                        ${tagsHtml}
                    </div>
                </div>
            </div>
            <div class="chat-actions">
                <button class="action-btn" title="上傳檔案"><i class="bi bi-upload"></i></button>
                <button class="action-btn" title="贊同"><i class="bi bi-hand-thumbs-up"></i></button>
                <button class="action-btn" title="不贊同"><i class="bi bi-hand-thumbs-down"></i></button>
                <button class="action-btn" title="更多選項"><i class="bi bi-three-dots"></i></button>
            </div>
        `;
        
        // Clear messages container and add date divider
        this.messagesContainer.innerHTML = `
            <div class="date-divider">
                <span>今天</span>
            </div>
        `;
        
        // Render all messages
        conversation.messages.forEach(message => {
            this.renderMessage(message);
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        const messageClass = message.isSent ? 'sent' : 'received';
        let messageHtml = '';
        
        if (message.isSent) {
            messageHtml = `
                <div class="message ${messageClass}">
                    <div class="message-content">
                        ${message.text ? `<div class="message-text">${message.text}</div>` : ''}
                        ${message.image ? `<div class="message-image"><img src="${message.image}" alt="Uploaded image"></div>` : ''}
                        <div class="message-time">${message.time}</div>
                    </div>
                </div>
            `;
        } else {
            messageHtml = `
                <div class="message ${messageClass}">
                    <div class="message-avatar">${message.avatar}</div>
                    <div class="message-content">
                        <div class="message-sender">${message.sender}</div>
                        ${message.text ? `<div class="message-text">${message.text}</div>` : ''}
                        ${message.image ? `<div class="message-image"><img src="${message.image}" alt="Uploaded image"></div>` : ''}
                        <div class="message-time">${message.time}</div>
                    </div>
                </div>
            `;
        }
        
        // Add the new message to the container
        this.messagesContainer.innerHTML += messageHtml;
    }
    
    renderFilesList(files, source) {
        this.filesList.innerHTML = '';
        
        const filteredFiles = source === 'all' 
            ? files 
            : files.filter(file => file.source === source);
        
        filteredFiles.forEach(file => {
            const checked = file.isSelected ? 'checked' : '';
            let fileIcon = '';
            
            switch (file.source) {
                case 'elg':
                    fileIcon = 'bi-file-earmark-text';
                    break;
                case 'csv':
                    fileIcon = 'bi-file-earmark-spreadsheet';
                    break;
                case 'remote':
                    fileIcon = 'bi-cloud';
                    break;
                default:
                    fileIcon = 'bi-file-earmark';
            }
            
            const html = `
                <div class="file-item" data-source="${file.source}">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="file${file.id}" ${checked}>
                        <label class="form-check-label" for="file${file.id}">
                            <i class="bi ${fileIcon}"></i>
                            <span class="file-name">${file.name}</span>
                        </label>
                    </div>
                    <div class="file-info">${file.size} · ${file.date}</div>
                </div>
            `;
            
            this.filesList.innerHTML += html;
        });
        
        // Add event listeners to file checkboxes
        document.querySelectorAll('.file-item .form-check-input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const fileId = parseInt(checkbox.id.replace('file', ''));
                this._fileSelectCallback(fileId);
            });
        });
    }
    
    renderTraceList(traces, type) {
        this.traceList.innerHTML = '';
        
        const filteredTraces = type === 'all' 
            ? traces 
            : traces.filter(trace => trace.type === type);
        
        filteredTraces.forEach(trace => {
            const checked = trace.isSelected ? 'checked' : '';
            
            const html = `
                <div class="trace-item" data-type="${trace.type}">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="trace${trace.id}" ${checked}>
                        <label class="form-check-label" for="trace${trace.id}">
                            <span class="trace-name">${trace.name}</span>
                        </label>
                    </div>
                </div>
            `;
            
            this.traceList.innerHTML += html;
        });
        
        // Add event listeners to trace checkboxes
        document.querySelectorAll('.trace-item .form-check-input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const traceId = parseInt(checkbox.id.replace('trace', ''));
                this._traceSelectCallback(traceId);
            });
        });
    }
    
    setDisplayMode(mode) {
        if (mode === 'summary') {
            this.summaryModeBtn.classList.add('active');
            this.tagsModeBtn.classList.remove('active');
            document.querySelectorAll('.summary-mode').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.tags-mode').forEach(el => el.style.display = 'none');
        } else {
            this.summaryModeBtn.classList.remove('active');
            this.tagsModeBtn.classList.add('active');
            document.querySelectorAll('.summary-mode').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.tags-mode').forEach(el => el.style.display = 'block');
        }
    }
    
    adjustSidebarSections(activeSection) {
        if (activeSection === 'files') {
            this.filesSection.classList.remove('minimized');
            this.traceSection.classList.add('minimized');
        } else if (activeSection === 'trace') {
            this.filesSection.classList.add('minimized');
            this.traceSection.classList.remove('minimized');
        }
    }
    
    showConnectionStatus(connected) {
        // Visual indication of WebSocket connection status
        if (connected) {
            console.log('Connected to server');
            // You could add a small connection status indicator to the UI
        } else {
            console.log('Disconnected from server');
            // You could show a reconnection message or indicator
        }
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    // Event registration methods
    onConversationSelect(callback) {
        this._conversationSelectCallback = callback;
    }
    
    onDisplayModeChange(callback) {
        this.summaryModeBtn.addEventListener('click', () => callback('summary'));
        this.tagsModeBtn.addEventListener('click', () => callback('tags'));
    }
    
// Complete the ChatView class
onMessageSend(callback) {
    const sendMessage = () => {
        const text = this.messageInput.value.trim();
        if (text) {
            callback(text);
            this.messageInput.value = '';
        }
    };
    
    this.sendButton.addEventListener('click', sendMessage);
    this.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

onImageUpload(callback) {
    this.imageUploadBtn.addEventListener('click', () => {
        // In a real app, this would open a file dialog
        // For this example, we'll use a placeholder image
        const placeholderImageUrl = '/api/placeholder/400/300';
        callback(placeholderImageUrl);
    });
}

onFileSourceChange(callback) {
    this.allFilesBtn.addEventListener('click', () => callback('all'));
    this.elgFilesBtn.addEventListener('click', () => callback('elg'));
    this.csvFilesBtn.addEventListener('click', () => callback('csv'));
    this.remoteFilesBtn.addEventListener('click', () => callback('remote'));
    
    // Add active class to source buttons
    [this.allFilesBtn, this.elgFilesBtn, this.csvFilesBtn, this.remoteFilesBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            [this.allFilesBtn, this.elgFilesBtn, this.csvFilesBtn, this.remoteFilesBtn].forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

onFileSelect(callback) {
    this._fileSelectCallback = callback;
}

onFileUpload(callback) {
    this.uploadFileBtn.addEventListener('click', () => {
        this.fileUploadInput.click();
    });
    
    this.fileUploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            callback(e.target.files[0]);
            // Reset the input to allow uploading the same file again
            e.target.value = '';
        }
    });
}

onTraceTypeChange(callback) {
    this.allTracesBtn.addEventListener('click', () => callback('all'));
    this.groupTracesBtn.addEventListener('click', () => callback('group'));
    this.customTracesBtn.addEventListener('click', () => callback('custom'));
    this.customGroupTracesBtn.addEventListener('click', () => callback('customGroup'));
    
    // Add active class to trace type buttons
    [this.allTracesBtn, this.groupTracesBtn, this.customTracesBtn, this.customGroupTracesBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            [this.allTracesBtn, this.groupTracesBtn, this.customTracesBtn, this.customGroupTracesBtn].forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

onTraceSelect(callback) {
    this._traceSelectCallback = callback;
}
}

// ====== WebSocketManager ======
class WebSocketManager {
constructor() {
    this.socket = null;
    this.messageCallbacks = [];
    this.fileCallbacks = [];
    this.traceCallbacks = [];
    this.connectCallbacks = [];
    this.disconnectCallbacks = [];
}

connect() {
    try {
        this.socket = new WebSocket('ws://localhost:8787');
        
        this.socket.onopen = () => {
            console.log('WebSocket connection established');
            this.connectCallbacks.forEach(callback => callback());
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'chat_message':
                        this.messageCallbacks.forEach(callback => callback(data.message));
                        break;
                        
                    case 'file_update':
                        this.fileCallbacks.forEach(callback => callback(data.file));
                        break;
                        
                    case 'trace_update':
                        this.traceCallbacks.forEach(callback => callback(data.trace));
                        break;
                        
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
            this.disconnectCallbacks.forEach(callback => callback());
            
            // Try to reconnect after a delay
            setTimeout(() => this.connect(), 5000);
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
    }
}

sendChatMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
            type: 'chat_message',
            message: message
        }));
    } else {
        console.warn('WebSocket not connected. Message not sent.');
    }
}

uploadFile(file) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
            type: 'file_upload',
            file: file
        }));
    } else {
        console.warn('WebSocket not connected. File not uploaded.');
    }
}

updateTraceSelection(trace) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
            type: 'trace_selection',
            trace: trace
        }));
    } else {
        console.warn('WebSocket not connected. Trace selection not updated.');
    }
}

onMessage(callback) {
    this.messageCallbacks.push(callback);
}

onFileReceived(callback) {
    this.fileCallbacks.push(callback);
}

onTraceUpdate(callback) {
    this.traceCallbacks.push(callback);
}

onConnect(callback) {
    this.connectCallbacks.push(callback);
}

onDisconnect(callback) {
    this.disconnectCallbacks.push(callback);
}
}

