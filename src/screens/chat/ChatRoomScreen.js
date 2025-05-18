import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
} from "react-native";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../backend/firebase";
import { format } from "date-fns";
import Ionicons from "react-native-vector-icons/Ionicons";

const MessageItem = React.memo(({ item, currentUserId }) => {
  const isMe = item.senderId === currentUserId;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.otherMessage,
        { opacity: fadeAnim },
      ]}
    >
      {!isMe && (
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.senderName?.charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
      )}
      <View style={isMe ? styles.myMessageContent : styles.otherMessageContent}>
        {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text style={[styles.messageText, { color: isMe ? "#fff" : "#333" }]}>
            {item.text}
          </Text>
        </View>
        {item.timestamp?.toDate && (
          <Text
            style={[
              styles.timestamp,
              isMe ? styles.myTimestamp : styles.otherTimestamp,
            ]}
          >
            {format(item.timestamp.toDate(), "h:mm a")}
          </Text>
        )}
      </View>
    </Animated.View>
  );
});

const ChatRoomScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userDocRef = doc(db, "user", currentUser.uid);

  useEffect(() => {
    const q = query(
      collection(db, "global_chat_messages"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .reverse();
      setMessages(fetched);
      setLoading(false);
      setTimeout(() => {
        if (fetched.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !currentUser?.uid || sending) return;

    const trimmedInput = input.trim();
    setInput("");
    setSending(true);

    try {
      const userDoc = await getDoc(userDocRef);
      const data = userDoc.data();

      await addDoc(collection(db, "global_chat_messages"), {
        text: trimmedInput,
        senderId: currentUser.uid,
        senderName: data.first_name + " " + data.last_name || "Anonymous",
        timestamp: serverTimestamp(),
      });
      setSending(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      setSending(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const renderItem = useCallback(
    ({ item }) => <MessageItem item={item} currentUserId={currentUser?.uid} />,
    [currentUser?.uid]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF8008" />
      ) : (
        <>
          <View style={styles.emptyLogo}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={60}
              color="#ccc"
            />
          </View>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Be the first to start the conversation!
          </Text>
        </>
      )}
    </View>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* {renderHeader()} */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={renderEmptyComponent}
        ItemSeparatorComponent={renderSeparator}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
        style={styles.keyboardAvoid}
      >
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            placeholder="Type a message"
            value={input}
            onChangeText={setInput}
            style={styles.input}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={500}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !input.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  headerButton: {
    padding: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 10,
    maxWidth: "100%",
  },
  myMessage: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  avatarContainer: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  myMessageContent: {
    maxWidth: "80%",
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  otherMessageContent: {
    maxWidth: "80%",
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#666",
    marginLeft: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: "#FF8008",
    borderTopRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#e0e0e0",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    color: "#888",
  },
  myTimestamp: {
    alignSelf: "flex-end",
    marginRight: 12,
  },
  otherTimestamp: {
    alignSelf: "flex-start",
    marginLeft: 12,
  },
  keyboardAvoid: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: "#eaeaea",
    backgroundColor: "#fff",
  },
  attachButton: {
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f1f1f1",
    fontSize: 16,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: "#FF8008",
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#FFB27C",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyLogo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  separator: {
    height: 12,
  },
});
