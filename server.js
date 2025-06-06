const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// تقديم الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// مصفوفة لتخزين المستخدمين المتصلين
const connectedUsers = [];

// معالجة اتصالات Socket.IO
io.on('connection', (socket) => {
  console.log('مستخدم جديد متصل');
  
  // إضافة علامة للإشارة إلى حالة انضمام المستخدم
  socket.hasJoined = false;

  // عند إرسال اسم المستخدم
  socket.on('join', (username) => {
    socket.username = username;
    socket.hasJoined = true; // تعيين المستخدم كمنضم للمحادثة
    connectedUsers.push(username);
    
    // إعلام جميع المستخدمين بالمستخدم الجديد
    io.emit('userJoined', username);
    io.emit('updateUserList', connectedUsers);
    
    // إرسال رسالة ترحيب للمستخدم الجديد
    socket.emit('message', {
      user: 'النظام',
      text: `مرحباً ${username}! تم الانضمام للدردشة.`
    });
    
    // إعلام المستخدمين الآخرين
    socket.broadcast.emit('message', {
      user: 'النظام',
      text: `${username} انضم للدردشة.`
    });
  });

  // عند استلام رسالة
  socket.on('sendMessage', (message) => {
    // التحقق من أن المستخدم قد انضم للمحادثة قبل السماح له بإرسال الرسائل
    if (!socket.hasJoined || !socket.username) {
      // إرسال رسالة خطأ إلى المستخدم
      socket.emit('message', {
        user: 'النظام',
        text: `لا يمكنك إرسال رسائل قبل الانضمام للدردشة.`
      });
      return;
    }
    
    // إرسال الرسالة لجميع المستخدمين
    io.emit('message', {
      user: socket.username,
      text: message
    });
  });

  // عند قطع الاتصال
  socket.on('disconnect', () => {
    if (socket.username && socket.hasJoined) {
      const index = connectedUsers.indexOf(socket.username);
      if (index !== -1) {
        connectedUsers.splice(index, 1);
      }
      
      console.log(`${socket.username} غادر الدردشة`);
      
      // إبلاغ المستخدمين الآخرين
      io.emit('message', {
        user: 'النظام',
        text: `${socket.username} غادر الدردشة.`
      });
      
      io.emit('updateUserList', connectedUsers);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});