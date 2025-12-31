const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

// 1. Notify on Friend Request
// 1. Notify on Friend Request
exports.onFriendRequest = functions.database
    .ref("/friend_requests/{requestId}")
    .onCreate(async (snapshot, context) => {
        const requestData = snapshot.val();

        if (!requestData || requestData.status !== "pending") return null;

        const recipientId = requestData.to;
        const senderId = requestData.from;

        try {
            // Get Sender Profile
            const senderSnapshot = await admin.database().ref(`users/${senderId}`).once("value");
            const sender = senderSnapshot.val();
            const senderName = sender?.displayName || "Someone";

            // Get Recipient Token
            const recipientSnapshot = await admin.database().ref(`users/${recipientId}/fcmToken`).once("value");
            const fcmToken = recipientSnapshot.val();

            if (!fcmToken) {
                console.log("No FCM token for user:", recipientId);
                return null;
            }

            const message = {
                token: fcmToken,
                notification: {
                    title: "New Friend Request! 👋",
                    body: `${senderName} wants to be friends with you.`,
                },
                data: {
                    type: "friend_request",
                    senderId: senderId,
                    url: "https://vibemap.cloud", // Open app
                },
            };

            await admin.messaging().send(message);
            console.log("Notification sent to:", recipientId);
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    });

// 2. Notify on New Chat Message
exports.onChatMessage = functions.database
    .ref("/chats/{chatId}/messages/{messageId}")
    .onCreate(async (snapshot, context) => {
        const { chatId, messageId } = context.params;
        const messageData = snapshot.val();
        const senderId = messageData.senderId;
        const text = messageData.text;

        console.log(`Processing message for chat: ${chatId}, message: ${messageId}`);

        // Chat ID is usually composed of two UIDs sorted.
        const uids = chatId.split("_");
        if (uids.length !== 2) {
            console.log("Invalid chatId format:", chatId);
            return null;
        }

        const recipientId = uids.find(uid => uid !== senderId);
        if (!recipientId) {
            console.log("Could not determine recipient from chatId:", chatId, "sender:", senderId);
            return null;
        }

        console.log(`Sender: ${senderId}, Recipient: ${recipientId}`);

        try {
            // Get Sender Name
            const senderSnapshot = await admin.database().ref(`users/${senderId}`).once("value");
            const sender = senderSnapshot.val();
            const senderName = sender?.displayName || "Friend";

            // Get Recipient Token
            const recipientSnapshot = await admin.database().ref(`users/${recipientId}/fcmToken`).once("value");
            const fcmToken = recipientSnapshot.val();

            if (!fcmToken) {
                console.log("No FCM token found for user:", recipientId);
                // We might want to handle this case better, effectively it means the user hasn't allowed notifications.
                return null;
            }

            console.log(`Found FCM token for ${recipientId}: ${fcmToken.substring(0, 10)}...`);

            const message = {
                token: fcmToken,
                notification: {
                    title: senderName,
                    body: text.length > 50 ? text.substring(0, 50) + "..." : text,
                },
                data: {
                    type: "chat_message",
                    senderId: senderId,
                    chatId: chatId,
                    url: `https://vibemap.cloud`,
                },
            };

            const response = await admin.messaging().send(message);
            console.log("Successfully sent message:", response);
        } catch (error) {
            console.error("Error sending chat notification:", error);
        }
    });
