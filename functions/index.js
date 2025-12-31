const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

// 1. Notify on Friend Request
exports.onFriendRequest = functions.database
    .ref("/friend_requests/{recipientId}/{senderId}")
    .onCreate(async (snapshot, context) => {
        const { recipientId, senderId } = context.params;
        const requestData = snapshot.val();

        if (requestData.status !== "pending") return null;

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
    .ref("/chats/{chatId}/{messageId}")
    .onCreate(async (snapshot, context) => {
        const { chatId } = context.params;
        const messageData = snapshot.val();
        const senderId = messageData.senderId;
        const text = messageData.text;

        // Chat ID is usually composed of two UIDs sorted, or we need to look up participants.
        // Assuming simple 1-on-1 chat where we need to find the "other" person.
        // A better approach for this app structure: 
        // Usually chatId = sort(uid1, uid2). So we can deduce the other person.

        // However, to be robust, let's assume we derive the recipient from the chatId if possible
        // OR we simply look at the message structure if it contains recipientId (it usually doesn't).

        // Let's parse the chatId to find the OTHER uid.
        const uids = chatId.split("_");
        if (uids.length !== 2) return null; // Not a standard 1-v-1 chat format we used?

        // Actually, in our Frontend implementation:
        // const chatId = [user.uid, friend.uid].sort().join("_");

        const recipientId = uids.find(uid => uid !== senderId);
        if (!recipientId) return null;

        try {
            // Get Sender Name
            const senderSnapshot = await admin.database().ref(`users/${senderId}`).once("value");
            const sender = senderSnapshot.val();
            const senderName = sender?.displayName || "Friend";

            // Get Recipient Token
            const recipientSnapshot = await admin.database().ref(`users/${recipientId}/fcmToken`).once("value");
            const fcmToken = recipientSnapshot.val();

            if (!fcmToken) {
                // console.log("No FCM token for user:", recipientId);
                return null;
            }

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

            await admin.messaging().send(message);
        } catch (error) {
            console.error("Error sending chat notification:", error);
        }
    });
