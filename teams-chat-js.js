// MVC Pattern Implementation for Teams-like Chat Room

// ====== MODEL ======
class ChatModel {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.files = [];
        this.indexes = [];
        this.selectedFiles = [];
        this.selectedIndexes = [];
        this.loadData();
    }

    loadData() {
        // Simulated data loading - in a real app, this would come from an API
        this.conversations = [
            {
                id: 1,
                name: "John Doe",
                avatar: "JD",
                lastMessage: "最近的訊息預覽...",
                lastMessageTime: "12:30",
                isActive: true,
                messages: [
                    {
                        id: 1,
                        sender: "John Doe",
                        avatar: "JD",
                        text: "你好！我們可以討論一下專案進度嗎？",
                        time: "10:30",
                        isSent: false
                    },
                    {
                        id: 2,
                        text: "當然可以，我剛剛完成了一些功能實作",
                        time: "10:32",
                        isSent: true
                    },
                    {
                        id: 3,
                        sender: "John Doe",
                        avatar: "JD",
                        text: "太好了！可以分享一下截圖嗎？",
                        time: "10:33",
                        isSent: false
                    },
                    {
                        id: 4,
                        text: "這是我實作的新功能畫面",
                        time: "10:40",
                        isSent: true,
                        image: "/api/placeholder/500/300"
                    }
                ]
            },
            {
                id: 2,
                name: "Jane Smith",
                avatar: "JS",
                lastMessage: "你好，我們下午有會議嗎？",
                lastMessageTime: "昨天",
                isActive: false,
                messages: []
            },
            {
                id: 3,
                name: "專案小組",
                avatar: "TG",
                lastMessage: "Alice: 我已經更新了文件...",
                lastMessageTime: "3/8",
                isActive: false,
                messages: []
            }
        ];

        this.currentConversation = this.conversations[0];

        this.files = [
            {
                id: 1,
                name: "專案規劃書.docx",
                type: "word",
                size: "3.2 MB",
                date: "昨天",
                selected: false
            },
            {
                id: 2,
                name: "會議記錄.pdf",
                type: "pdf",
                size: "1.5 MB",
                date: "3/7",
                selected: false
            },
            {
                id: 3,
                name: "設計圖.png",
                type: "image",
                size: "4.7 MB",
                date: "3/5",
                selected: false
            }
        ];

        this.indexes = [
            {
                id: 1,
                name: "主要索引",
                selected: true
            },
            {
                id: 2,
                name: "專案資料",
                selected: false
            },
            {
                id: 3,
                name: "參考資料",
                selected: false
            }
        ];
    }

    setCurrentConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            this.conversations.forEach(c => c.isActive = false);
            conversation.isActive = true;
            this.currentConversation = conversation;
            return true;
        }
        return false;
    }

    addMessage(text, image = null) {
        if (!this.currentConversation) return false;
        
        const newMessage = {
            id: Date.now(),
            text: text,
            time: this.formatTime(new Date()),
            isSent: true
        };

        if (image) {
            newMessage.image = image;
        }

        this.currentConversation.messages.push(newMessage);
        this.currentConversation.lastMessage = text;
        this.currentConversation.lastMessageTime = "剛剛";
        
        return newMessage;
    }

    toggleFileSelection(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            file.selected = !file.selected;
            this.selectedFiles = this.files.filter(f => f.selected).map(f => f.id);
            return true;
        }
        return false;
    }

    toggleIndexSelection(indexId) {
        const index = this.indexes.find(i => i.id === indexId);
        if (index) {
            index.selected = !index.selected;
            this.selectedIndexes = this.indexes.filter(i => i.selected).map(i => i.id);
            return true;
        }
        return false;
    }

    uploadFiles(fileList) {
        // In a real app, this would upload to a server
        // Here we just add to our local array
        const newFiles = Array.from(fileList).map((file, index) => {
            const fileType = this.getFileType(file.name);
            return {
                id: this.files.length + index + 1,
                name: file.name,
                type: fileType,
                size: this.formatFileSize(file.size),
                date: "今天",
                selected: false
            };
        });
        
        this.files = [...newFiles, ...this.files];
        return newFiles;
    }

    getFileType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['doc', 'docx'].includes(extension)) return 'word';
        if (['pdf'].includes(extension)) return 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) return 'image';
        if (['xls', 'xlsx'].includes(extension)) return 'excel';
        if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
        if (['zip', 'rar', '7z'].includes(extension)) return 'archive';
        return 'file';
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    formatTime(date) {
        return date.getHours().toString().padStart(2, '0') + ':' + 
               date.getMinutes().toString().padStart(2, '0');
    }
}

// ====== VIEW ======
class ChatView {
    constructor() {
        this.chatList = document.querySelector('.chat-list');
        this.messagesContainer = document.querySelector('.messages-container');
        this.messageInput = document.querySelector('.message-input');
        this.sendButton = document.querySelector('.send-btn');
        this.filesList = document.querySelector('.files-list');
        this.indexList = document.querySelector('.index-list');
        this.file