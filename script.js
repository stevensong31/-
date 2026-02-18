// Check for correct protocol
if (window.location.protocol === 'file:') {
    alert('错误: 您直接打开了文件。请在浏览器中输入 "http://192.168.2.254:3000" 来使用本应用，否则聊天功能无法工作。');
}

const socket = io({
    reconnectionCodes: [1000, 4004],
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log(`Connected to server! Socket ID: ${socket.id}`);
});

socket.on('connect_error', (err) => {
    console.error(`Connection Error: ${err.message}`);
});

socket.on('disconnect', (reason) => {
    console.log(`Disconnected: ${reason}`);
});


// DOM Elements
const loginView = document.getElementById('login-view');
const chatView = document.getElementById('chat-view');
const nicknameInput = document.getElementById('nickname');
const roomCodeInput = document.getElementById('room-code-input');
const btnCreateRoom = document.getElementById('btn-create-room');
const btnJoinRoom = document.getElementById('btn-join-room');
const btnLeave = document.getElementById('btn-leave');
const displayRoomCode = document.getElementById('display-room-code');
const messagesContainer = document.getElementById('messages-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');
const btnImage = document.getElementById('btn-image');

// Users Modal Elements
const btnUsers = document.getElementById('btn-users');
const usersModal = document.getElementById('users-modal');
const usersList = document.getElementById('users-list');
const btnCloseUsers = document.getElementById('btn-close-users');

// Generic Modal Elements
const genericModal = document.getElementById('generic-modal');
const genericModalTitle = document.getElementById('generic-modal-title');
const genericModalMessage = document.getElementById('generic-modal-message');
const genericModalActions = document.getElementById('generic-modal-actions');

// Helper: Custom Alert
function showCustomAlert(message, callback) {
    genericModalTitle.textContent = 'Alert';
    genericModalTitle.style.color = 'var(--text-main)'; // Reset color
    genericModalMessage.textContent = message;
    genericModalActions.innerHTML = '';

    const btnOk = document.createElement('button');
    btnOk.className = 'btn primary';
    btnOk.textContent = 'OK';
    btnOk.onclick = () => {
        genericModal.classList.add('hidden');
        if (callback) callback();
    };

    genericModalActions.appendChild(btnOk);
    genericModal.classList.remove('hidden');
}

// Helper: Custom Confirm
function showCustomConfirm(message, onConfirm) {
    genericModalTitle.textContent = 'Confirm';
    genericModalTitle.style.color = 'var(--text-main)';
    genericModalMessage.textContent = message;
    genericModalActions.innerHTML = '';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn secondary';
    btnCancel.textContent = 'Cancel';
    btnCancel.onclick = () => {
        genericModal.classList.add('hidden');
    };

    const btnConfirm = document.createElement('button');
    btnConfirm.className = 'btn primary';
    btnConfirm.textContent = 'Confirm';
    btnConfirm.onclick = () => {
        genericModal.classList.add('hidden');
        if (onConfirm) onConfirm();
    };

    genericModalActions.appendChild(btnCancel);
    genericModalActions.appendChild(btnConfirm);
    genericModal.classList.remove('hidden');
}

// Modal Elements
const passwordModal = document.getElementById('password-modal');
const roomPasswordInput = document.getElementById('room-password-input');
const btnCancelPassword = document.getElementById('btn-cancel-password');
const btnConfirmPassword = document.getElementById('btn-confirm-password');

// Theme Elements
const themeBtns = document.querySelectorAll('.theme-btn');

// Themes Config
const themes = {
    purple: {
        primary: '#6366f1',
        hover: '#4f46e5',
        text: '#ffffff',
        bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    yellow: {
        primary: '#facc15',
        hover: '#eab308',
        text: '#000000',
        bgGradient: 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)'
    },
    blue: {
        primary: '#3b82f6',
        hover: '#2563eb',
        text: '#ffffff',
        bgGradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)'
    },
    red: {
        primary: '#ef4444',
        hover: '#dc2626',
        text: '#ffffff',
        bgGradient: 'linear-gradient(135deg, #f87171 0%, #b91c1c 100%)'
    },
    pink: {
        primary: '#f9a8d4',
        hover: '#f472b6',
        text: '#000000',
        bgGradient: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)'
    }
};

// State
let currentNickname = '';
let currentRoomCode = '';
let currentUsers = [];

// Helper: Switch View
function showChatView(roomCode) {
    currentRoomCode = roomCode;
    displayRoomCode.textContent = roomCode;

    // Animate transition
    loginView.classList.add('hidden');
    loginView.classList.remove('active');

    chatView.classList.remove('hidden');
    // small timeout to allow display change before transition
    setTimeout(() => {
        chatView.classList.add('active');
    }, 50);

    // Clear messages (except default welcome if preserved, but we'll clear all for cleanliness)
    messagesContainer.innerHTML = '';
}

function showLoginView() {
    currentRoomCode = '';
    currentNickname = '';

    chatView.classList.add('hidden');
    chatView.classList.remove('active');

    loginView.classList.remove('hidden');
    setTimeout(() => {
        loginView.classList.add('active');
    }, 50);
}

// Helper: Add Message
function addMessage(data) {
    const div = document.createElement('div');

    if (data.type === 'system') {
        div.className = 'message system';
        div.textContent = data.text;
    } else if (data.type === 'user') {
        const isMine = data.userId === socket.id;
        div.className = `message ${isMine ? 'mine' : 'theirs'}`;

        // Add nickname for others
        if (!isMine) {
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = data.nickname;
            div.appendChild(meta);
        }

        const content = document.createElement('div');
        if (data.contentType === 'image') {
            const img = document.createElement('img');
            img.src = data.text;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            content.appendChild(img);
        } else {
            content.textContent = data.text;
        }
        div.appendChild(content);

        // Message Recall Logic
        if (data.messageId) {
            div.dataset.messageId = data.messageId;
            div.id = `msg-${data.messageId}`; // Helper for finding element later

            if (isMine) {
                div.style.cursor = 'pointer';
                div.title = 'Click to recall message';
                div.onclick = () => {
                    showCustomConfirm('Are you sure you want to recall this message?', () => {
                        socket.emit('recall_message', { roomCode: currentRoomCode, messageId: data.messageId });
                    });
                };
            }
        }
    }

    messagesContainer.appendChild(div);

    // Bug Fix: Client-side memory cleanup (keep only last 100 messages in DOM)
    if (messagesContainer.children.length > 100) {
        messagesContainer.removeChild(messagesContainer.firstChild);
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Helper: Render User List
function renderUserList() {
    usersList.innerHTML = '';

    // Find my user object to check if I am admin
    const myUser = currentUsers.find(u => u.id === socket.id);
    const amIAdmin = myUser && myUser.isAdmin;

    currentUsers.forEach(user => {
        const li = document.createElement('li');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'user-info';
        infoDiv.textContent = user.nickname;

        if (user.id === socket.id) {
            const selfSpan = document.createElement('span');
            selfSpan.className = 'user-myself';
            selfSpan.textContent = '(You)';
            infoDiv.appendChild(selfSpan);
        }
        if (user.isAdmin) {
            const adminSpan = document.createElement('span');
            adminSpan.className = 'user-myself';
            adminSpan.style.color = '#ef4444'; // Red for admin label
            adminSpan.textContent = '[Admin]';
            infoDiv.appendChild(adminSpan);
        }

        li.appendChild(infoDiv);

        // Add Kick Button if I am admin and user is NOT me
        if (amIAdmin && user.id !== socket.id) {
            const btnKick = document.createElement('button');
            btnKick.className = 'btn-kick';
            btnKick.textContent = '踢出'; // Kick
            btnKick.onclick = () => {
                showCustomConfirm(`Are you sure you want to kick ${user.nickname}?`, () => {
                    socket.emit('kick_user', { roomCode: currentRoomCode, targetUserId: user.id });
                });
            };
            li.appendChild(btnKick);
        }

        usersList.appendChild(li);
    });
}

// Theme Selection Logic
themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active class
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply theme
        const themeName = btn.dataset.theme;
        const theme = themes[themeName];

        if (theme) {
            document.documentElement.style.setProperty('--primary-color', theme.primary);
            document.documentElement.style.setProperty('--primary-hover', theme.hover);
            document.documentElement.style.setProperty('--btn-text-color', theme.text);
            document.documentElement.style.setProperty('--bg-gradient', theme.bgGradient);
        }
    });
});

// Event Listeners: Login View
btnCreateRoom.addEventListener('click', () => {
    const nick = nicknameInput.value.trim();
    if (!nick) {
        showCustomAlert('Please enter a nickname first.');
        return;
    }

    console.log(`Attempting to create room for: ${nick}...`);
    btnCreateRoom.disabled = true;
    btnCreateRoom.textContent = 'Creating...';
    currentNickname = nick;

    // Emit with timeout check
    let responded = false;
    setTimeout(() => {
        if (!responded) {
            console.warn('TIMEOUT: Server did not respond to create_room request in 5s.');
            btnCreateRoom.disabled = false;
            btnCreateRoom.textContent = 'Create New Room';
        }
    }, 5000);

    socket.emit('create_room', currentNickname, (response) => {
        responded = true;

        if (response.status === 'ok') {
            // Success handled by 'room_created'
        } else {
            console.error(`Server Error: ${response.error}`);
            showCustomAlert(`Error: ${response.error}`);
            btnCreateRoom.disabled = false;
            btnCreateRoom.textContent = 'Create New Room';
        }
    });
});

btnJoinRoom.addEventListener('click', (e) => {
    e.preventDefault();
    const nick = nicknameInput.value.trim();
    const code = roomCodeInput.value.trim();

    if (!nick) {
        showCustomAlert('Please enter a nickname first.');
        return;
    }
    if (code.length !== 7) {
        showCustomAlert('Please enter a valid 7-digit room code.');
        return;
    }

    const protectedRooms = ['1031610', '1031320', '1031414', '5454188', '6666666'];
    if (protectedRooms.includes(code)) {
        // Show Custom Modal
        passwordModal.classList.remove('hidden');
        roomPasswordInput.value = '';
        roomPasswordInput.focus();

        // Temporarily store state for modal to use
        passwordModal.dataset.roomCode = code;
        passwordModal.dataset.nickname = nick;
        return;
    }

    currentNickname = nick;
    socket.emit('join_room', { roomCode: code, nickname: nick });
});

// Modal Event Listeners
btnCancelPassword.addEventListener('click', () => {
    passwordModal.classList.add('hidden');
    roomPasswordInput.value = '';
});

btnConfirmPassword.addEventListener('click', () => {
    const password = roomPasswordInput.value;
    const code = passwordModal.dataset.roomCode;
    const nick = passwordModal.dataset.nickname;

    if (code === '6666666') {
        if (password !== 'mayaissb') {
            showCustomAlert('密码错误，无法进入房间');
            return;
        }
    } else if (password !== '2012103120130610') {
        showCustomAlert('密码错误，无法进入房间');
        return;
    }

    // Success
    passwordModal.classList.add('hidden');
    currentNickname = nick;
    socket.emit('join_room', { roomCode: code, nickname: nick });
});

// Users Modal Event Listeners
if (btnUsers) {
    btnUsers.addEventListener('click', () => {
        renderUserList();
        usersModal.classList.remove('hidden');
    });
}

if (btnCloseUsers) {
    btnCloseUsers.addEventListener('click', () => {
        usersModal.classList.add('hidden');
    });
}

// Event Listeners: Chat View
btnLeave.addEventListener('click', () => {
    // Reload page to reset state/socket cleanly
    window.location.reload();
});

// Helper: Handle message sending
const sendMessage = () => {
    const msg = messageInput.value.trim();
    if (msg && currentRoomCode) {
        const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        // Optimistic UI: Show immediately
        addMessage({
            type: 'user',
            nickname: currentNickname,
            text: msg,
            userId: socket.id, // Matches check in addMessage for 'mine'
            messageId: messageId
        });

        socket.emit('chat_message', {
            roomCode: currentRoomCode,
            message: msg,
            nickname: currentNickname,
            messageId: messageId
        });
        messageInput.value = '';
    }
};

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

// Handle Shift+Enter
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent newline
        sendMessage();
    }
});

// Image Upload Logic
btnImage.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB Limit
            showCustomAlert('不可发送10MB以上的图片');
            imageInput.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const base64Data = event.target.result;

            const messageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

            // Optimistic UI for Image
            addMessage({
                type: 'user',
                nickname: currentNickname,
                text: base64Data,
                contentType: 'image',
                userId: socket.id,
                messageId: messageId
            });

            // Send via Socket
            socket.emit('chat_message', {
                roomCode: currentRoomCode,
                message: base64Data,
                nickname: currentNickname,
                contentType: 'image',
                messageId: messageId
            });
        };
        reader.readAsDataURL(file);
        imageInput.value = ''; // Reset for next selection
    }
});

// Socket Events
socket.on('room_created', (roomCode) => {
    showChatView(roomCode);
});

socket.on('room_joined', (roomCode) => {
    showChatView(roomCode);
});

socket.on('message', (data) => {
    addMessage(data);
});

socket.on('message_recalled', (messageId) => {
    const msgEl = document.getElementById(`msg-${messageId}`);
    if (msgEl) {
        msgEl.remove();

        // Optional: Add a system message equivalent
        const div = document.createElement('div');
        div.className = 'message system';
        div.textContent = 'A message was recalled';
        div.style.fontStyle = 'italic';
        div.style.opacity = '0.7';
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});

socket.on('error_message', (msg) => {
    showCustomAlert(msg);
});

// Admin / User List Events
socket.on('update_user_list', (users) => {
    currentUsers = users;
    // If modal is open, re-render
    if (!usersModal.classList.contains('hidden')) {
        renderUserList();
    }
});

socket.on('kicked', (msg) => {
    showCustomAlert(msg, () => {
        window.location.reload();
    });
});
