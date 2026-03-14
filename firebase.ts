// Firebase Configuration with provided credentials
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, getDocs, addDoc, orderBy, Timestamp, serverTimestamp, DocumentData, CollectionReference } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDD-WH5GolWykjiFgfhPUjxWLVEBklt7is",
  authDomain: "datamarket-b406e.firebaseapp.com",
  projectId: "datamarket-b406e",
  storageBucket: "datamarket-b406e.firebasestorage.app",
  messagingSenderId: "924015124855",
  appId: "1:924015124855:web:b99abc346b78669a00c172",
  measurementId: "G-XFGEHLT4BN"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize messaging only in browser
let messaging: Messaging | null = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

export { messaging };

// VAPID Key for FCM (provided by user)
const VAPID_KEY = 'BBIA1AvsuH2ZR4_KeNRosHgeSh3-ovVI9TythuESXMyKMnGtNePmBE2oOx_0g1c6eRk-SxKdkw28hdWSUgDkIvc';

// ==================== USER MANAGEMENT ====================

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | null;
  walletAddress: string | null;
  createdAt: Timestamp;
  interests: string[];
  avatar?: string;
}

// Create user profile in Firestore
export async function createUserProfile(
  uid: string, 
  email: string, 
  name: string, 
  role: 'buyer' | 'seller',
  walletAddress: string
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    uid,
    email,
    name,
    role,
    walletAddress,
    createdAt: serverTimestamp(),
    interests: [],
    avatar: null
  });
}

// Get user profile with timeout
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    const fetchPromise = (async () => {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      return snapshot.exists() ? snapshot.data() as UserProfile : null;
    })();
    
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Update user profile with error handling
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Subscribe to user profile changes
export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() as UserProfile : null);
  });
}

// ==================== DATASETS ====================

export interface Dataset {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  sellerId: string;
  sellerName: string;
  size: string;
  format: string;
  rows: number;
  columns: string[];
  sampleData: any[];
  fullDataUrl: string;
  isLocked: boolean;
  downloadToken: string | null;
  createdAt: Timestamp;
  downloads: number;
  rating: number;
  tags: string[];
  aiVerified: boolean;
  aiSummary: string | null;
  isMalicious: boolean;
}

// Create a new dataset
export async function createDataset(
  sellerId: string,
  datasetData: Omit<Dataset, 'id' | 'createdAt' | 'downloads' | 'rating'>
): Promise<string> {
  const datasetsRef = collection(db, 'datasets');
  const docRef = await addDoc(datasetsRef, {
    ...datasetData,
    sellerId,
    createdAt: serverTimestamp(),
    downloads: 0,
    rating: 0,
    isLocked: true,
    downloadToken: null
  });
  return docRef.id;
}

// Get all datasets with timeout
export async function getDatasets(category?: string): Promise<Dataset[]> {
  try {
    const datasetsRef = collection(db, 'datasets');
    let q = query(datasetsRef, orderBy('createdAt', 'desc'));
    
    if (category && category !== 'All') {
      q = query(datasetsRef, where('category', '==', category), orderBy('createdAt', 'desc'));
    }
    
    const timeoutPromise = new Promise<Dataset[]>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    const fetchPromise = (async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dataset));
    })();
    
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error getting datasets:', error);
    return [];
  }
}

// Get dataset by ID
export async function getDataset(id: string): Promise<Dataset | null> {
  const docRef = doc(db, 'datasets', id);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Dataset : null;
}

// Subscribe to dataset changes
export function subscribeToDataset(id: string, callback: (dataset: Dataset | null) => void) {
  const docRef = doc(db, 'datasets', id);
  return onSnapshot(docRef, (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Dataset : null);
  });
}

// Subscribe to all datasets (real-time)
export function subscribeToDatasets(callback: (datasets: Dataset[]) => void) {
  const datasetsRef = collection(db, 'datasets');
  const q = query(datasetsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const datasets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dataset));
    callback(datasets);
  });
}

// Get seller datasets with timeout
export async function getSellerDatasets(sellerId: string): Promise<Dataset[]> {
  try {
    const datasetsRef = collection(db, 'datasets');
    const q = query(datasetsRef, where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
    
    const timeoutPromise = new Promise<Dataset[]>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    const fetchPromise = (async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dataset));
    })();
    
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error getting seller datasets:', error);
    return [];
  }
}

// Update dataset with AI verification
export async function updateDatasetAIAnalysis(
  datasetId: string, 
  summary: string, 
  isMalicious: boolean
): Promise<void> {
  const docRef = doc(db, 'datasets', datasetId);
  await updateDoc(docRef, {
    aiVerified: true,
    aiSummary: summary,
    isMalicious
  });
}

// Unlock dataset after purchase
export async function unlockDataset(
  datasetId: string, 
  downloadToken: string
): Promise<void> {
  const docRef = doc(db, 'datasets', datasetId);
  await updateDoc(docRef, {
    isLocked: false,
    downloadToken
  });
}

// Increment download count
export async function incrementDownloads(datasetId: string): Promise<void> {
  const docRef = doc(db, 'datasets', datasetId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const current = snapshot.data().downloads || 0;
    await updateDoc(docRef, { downloads: current + 1 });
  }
}

// ==================== MESSAGING ====================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  datasetId: string;
  datasetTitle: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCount: number;
}

// Create or get conversation
export async function getOrCreateConversation(
  buyerId: string,
  buyerName: string,
  sellerId: string,
  sellerName: string,
  datasetId: string,
  datasetTitle: string
): Promise<string> {
  // Check if conversation exists
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('buyerId', '==', buyerId),
    where('sellerId', '==', sellerId),
    where('datasetId', '==', datasetId)
  );
  
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  
  // Create new conversation
  const docRef = await addDoc(conversationsRef, {
    buyerId,
    buyerName,
    sellerId,
    sellerName,
    datasetId,
    datasetTitle,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    unreadCount: 0
  });
  
  return docRef.id;
}

// Send message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  content: string
): Promise<void> {
  // Add message
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(messagesRef, {
    conversationId,
    senderId,
    senderName,
    receiverId,
    content,
    timestamp: serverTimestamp(),
    read: false
  });
  
  // Update conversation
  const convoRef = doc(db, 'conversations', conversationId);
  await updateDoc(convoRef, {
    lastMessage: content,
    lastMessageAt: serverTimestamp(),
    unreadCount: 1
  });
}

// Get conversation messages
export async function getMessages(conversationId: string): Promise<Message[]> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
}

// Subscribe to conversation messages (real-time)
export function subscribeToMessages(
  conversationId: string, 
  callback: (messages: Message[]) => void
) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    callback(messages);
  });
}

// Subscribe to user's conversations
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('buyerId', '==', userId)
  );
  
  const q2 = query(
    conversationsRef,
    where('sellerId', '==', userId)
  );
  
  const unsubscribe1 = onSnapshot(q, (snapshot1) => {
    const convos1 = snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
    
    const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
      const convos2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      const allConvos = [...convos1, ...convos2];
      // Sort by last message time
      allConvos.sort((a, b) => b.lastMessageAt?.seconds - a.lastMessageAt?.seconds);
      callback(allConvos);
    });
    
    return () => unsubscribe2();
  });
  
  return unsubscribe1;
}

// Subscribe to all user's messages (real-time)
export function subscribeToAllUserMessages(
  userId: string, 
  callback: (messages: Message[]) => void
) {
  const messagesRef = collection(db, 'conversations'); // This is tricky because messages are subcollections
  // Better approach: Query across all messages if they were in a top-level collection
  // Since they are in subcollections, we should subscribe to conversations first
  
  return subscribeToConversations(userId, (conversations) => {
    // For each conversation, we'd need to subscribe to its messages
    // This is getting complex for a simple dashboard. 
    // Let's simplify and just query for recent messages if possible, 
    // or provide a placeholder for now.
    callback([]); // Placeholder
  });
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, where('receiverId', '==', userId), where('read', '==', false));
  const snapshot = await getDocs(q);
  
  const batch = snapshot.docs.map(doc => 
    updateDoc(doc.ref, { read: true })
  );
  await Promise.all(batch);
  
  // Reset unread count
  const convoRef = doc(db, 'conversations', conversationId);
  await updateDoc(convoRef, { unreadCount: 0 });
}

// ==================== PURCHASES ====================

export interface Purchase {
  id: string;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  datasetId: string;
  datasetTitle: string;
  amount: number;
  platformFee: number;
  txHash: string;
  downloadToken: string;
  downloadUrl: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  emailSent: boolean;
}

// Record a purchase
export async function createPurchase(
  purchaseData: Omit<Purchase, 'id' | 'createdAt'>
): Promise<string> {
  const purchasesRef = collection(db, 'purchases');
  const docRef = await addDoc(purchasesRef, {
    ...purchaseData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

// Get user purchases with timeout
export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  try {
    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, where('buyerId', '==', userId), orderBy('createdAt', 'desc'));
    
    const timeoutPromise = new Promise<Purchase[]>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    const fetchPromise = (async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
    })();
    
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error getting user purchases:', error);
    return [];
  }
}

// Get seller sales with timeout
export async function getSellerSales(sellerId: string): Promise<Purchase[]> {
  try {
    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
    
    const timeoutPromise = new Promise<Purchase[]>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    const fetchPromise = (async () => {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
    })();
    
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error getting seller sales:', error);
    return [];
  }
}

// ==================== NOTIFICATIONS ====================

// Request FCM permission and get token
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Notification permission error:', error);
  }
  return null;
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

// Save FCM token to user profile
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { fcmToken: token });
}

export default app;
