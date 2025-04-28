document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    
    // عناصر DOM
    const joinContainer = document.getElementById('join-container');
    const chatContainer = document.getElementById('chat-container');
    const joinForm = document.getElementById('join-btn');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('msg');
    const messagesContainer = document.getElementById('messages');
    const usernameInput = document.getElementById('username');
    const usersList = document.getElementById('users');
    
    // تعقب حالة المستخدم (إذا كان منضماً للمحادثة أم لا)
    let userJoined = false;
    
    // إظهار واجهة الدردشة وإخفاء نموذج الانضمام
    function showChatInterface() {
        joinContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
        userJoined = true; // تعيين حالة المستخدم كمنضم
    }
    
    // إضافة رسالة إلى واجهة الدردشة
    function appendMessage(message) {
        const messageElement = document.createElement('div');
        const username = document.createElement('div');
        const text = document.createElement('div');
        const timestamp = document.createElement('div');
        
        if (message.user === 'النظام') {
            messageElement.classList.add('message', 'system');
        } else if (message.user === socket.username) {
            messageElement.classList.add('message', 'self');
        } else {
            messageElement.classList.add('message');
        }
        
        username.classList.add('message-username');
        text.classList.add('message-text');
        timestamp.classList.add('message-timestamp');
        
        username.textContent = message.user;
        text.textContent = message.text;
        
        const now = new Date();
        timestamp.textContent = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        messageElement.appendChild(username);
        messageElement.appendChild(text);
        messageElement.appendChild(timestamp);
        
        messagesContainer.appendChild(messageElement);
        
        // تمرير الشاشة لأسفل
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // تحديث قائمة المستخدمين
    function updateUserList(users) {
        usersList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            usersList.appendChild(li);
        });
    }
    
    // معالجة الانضمام
    joinForm.addEventListener('click', (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        if (!username) {
            return;
        }
        
        // حفظ اسم المستخدم وتحويل للواجهة الرئيسية
        socket.username = username;
        socket.emit('join', username);
        showChatInterface();
    });
    
    // معالجة إرسال الرسائل
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // منع إرسال رسائل إذا لم يكن المستخدم منضماً للمحادثة
        if (!userJoined) {
            alert('يجب عليك الانضمام للمحادثة أولاً!');
            return;
        }
        
        const message = messageInput.value.trim();
        if (!message) {
            return;
        }
        
        // إرسال الرسالة وتفريغ حقل الإدخال
        socket.emit('sendMessage', message);
        messageInput.value = '';
        messageInput.focus();
    });
    
    // استماع للأحداث من الخادم
    socket.on('message', (message) => {
        appendMessage(message);
    });
    
    socket.on('updateUserList', (users) => {
        updateUserList(users);
    });
    
    // إضافة مستمع لإعادة تحميل الصفحة
    window.addEventListener('beforeunload', () => {
        userJoined = false; // إعادة تعيين حالة المستخدم عند مغادرة الصفحة
    });
});