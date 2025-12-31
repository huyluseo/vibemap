importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAWOlkLsZrexWoOWKGjcTPq9oNgD-z7FpI",
    authDomain: "vibemap-94cb6.firebaseapp.com",
    databaseURL: "https://vibemap-94cb6-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "vibemap-94cb6",
    storageBucket: "vibemap-94cb6.firebasestorage.app",
    messagingSenderId: "804656272344",
    appId: "1:804656272344:web:b8912aa351d8c934be18ad",
    measurementId: "G-8HQ7DCZNYL"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here (optional, Firebase handles default)
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
