import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, Technician, ZoneConfig, UserProfile } from '../types';

// 1. Initialize Firebase App and Firestore with explicitly declared database ID
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// 3. Mandatory Firestore Error Handler conforming to skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. In-memory token storage (for Gmail scope)
let cachedAccessToken: string | null = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');

// 5. Auth Observers & Token helpers
// 5. Active User State & Listeners
let activeCustomUser: any = null;
const authListeners: Array<(user: any, token: string | null) => void> = [];
const authFailureListeners: Array<() => void> = [];

// Try restoring existing custom session on boot
try {
  const saved = localStorage.getItem('angoserv_session');
  if (saved) {
    activeCustomUser = JSON.parse(saved);
  }
} catch (e) {
  // ignore
}

export const initAuth = (
  onAuthSuccess?: (user: any, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthSuccess) authListeners.push(onAuthSuccess);
  if (onAuthFailure) authFailureListeners.push(onAuthFailure);

  // If custom user already restored, immediately notify
  if (activeCustomUser && onAuthSuccess) {
    onAuthSuccess(activeCustomUser, cachedAccessToken);
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      activeCustomUser = null;
      localStorage.removeItem('angoserv_session');
      authListeners.forEach((fn) => fn(user, cachedAccessToken));
    } else if (!activeCustomUser) {
      cachedAccessToken = null;
      authFailureListeners.forEach((fn) => fn());
    }
  });
};

const notifyCustomLogin = (customUser: any) => {
  activeCustomUser = customUser;
  try {
    localStorage.setItem('angoserv_session', JSON.stringify(customUser));
  } catch (e) {}
  authListeners.forEach((fn) => fn(customUser, null));
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// 6. Google Sign-In
export const googleSignIn = async (): Promise<{ user: any; accessToken: string | null } | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

    if (result.user) {
      activeCustomUser = null;
      localStorage.removeItem('angoserv_session');
      await saveUserProfile(result.user.uid, {
        uid: result.user.uid,
        name: result.user.displayName || 'Cliente AngoServ',
        email: result.user.email || undefined,
        role: result.user.email === 'angoserv05@gmail.com' ? 'admin' : 'cliente',
        createdAt: new Date().toISOString(),
      }).catch((e) => console.warn('Could not auto-save user profile:', e));
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  }
};

// 7. Email & Password Authentication (Sign In & Sign Up) with auto-fallback
export const loginWithEmailPassword = async (email: string, password: string): Promise<any> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    activeCustomUser = null;
    localStorage.removeItem('angoserv_session');
    return userCredential.user;
  } catch (error: any) {
    // If provider is not enabled in Firebase Console (auth/operation-not-allowed), fallback gracefully
    if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
      console.warn('Firebase Auth email provider disabled in console, using account store fallback...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Email ou palavra-passe incorretos.');
      }
      const customUser = {
        uid: data.user.uid,
        displayName: data.user.name,
        email: data.user.email,
        phoneNumber: data.user.phone,
        role: data.user.role,
        isFallbackSession: true,
      };
      notifyCustomLogin(customUser);
      return customUser;
    }
    console.error('Email login error:', error);
    throw error;
  }
};

export const registerWithEmailPassword = async (
  name: string,
  email: string,
  password: string,
  phone?: string,
  province?: string
): Promise<any> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: name.trim() });

    // Store profile in Firestore
    await saveUserProfile(user.uid, {
      uid: user.uid,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      province: province?.trim(),
      role: email.trim() === 'angoserv05@gmail.com' ? 'admin' : 'cliente',
      createdAt: new Date().toISOString(),
    }).catch(() => {});

    activeCustomUser = null;
    localStorage.removeItem('angoserv_session');
    return user;
  } catch (error: any) {
    // If provider is not enabled in Firebase Console (auth/operation-not-allowed), fallback gracefully
    if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
      console.warn('Firebase Auth email provider disabled in console, using account store fallback...');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, province }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao criar utilizador.');
      }
      const customUser = {
        uid: data.user.uid,
        displayName: data.user.name,
        email: data.user.email,
        phoneNumber: data.user.phone,
        role: data.user.role,
        isFallbackSession: true,
      };
      notifyCustomLogin(customUser);
      return customUser;
    }
    console.error('Email registration error:', error);
    throw error;
  }
};

// 8. Phone Number Authentication (SMS verification) with robust reCAPTCHA reset & fallback
let appRecaptchaVerifier: RecaptchaVerifier | null = null;

export const resetRecaptchaVerifier = (containerId: string = 'recaptcha-container') => {
  if (appRecaptchaVerifier) {
    try {
      appRecaptchaVerifier.clear();
    } catch (e) {}
    appRecaptchaVerifier = null;
  }
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
};

export const setupRecaptchaVerifier = (containerId: string): RecaptchaVerifier => {
  resetRecaptchaVerifier(containerId);

  appRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      resetRecaptchaVerifier(containerId);
    },
  });
  return appRecaptchaVerifier;
};

export interface PhoneAuthSession {
  verificationId: string;
  demoCode?: string;
  isFallback?: boolean;
  confirm: (code: string) => Promise<{ user: any }>;
}

export const sendPhoneVerificationCode = async (
  rawPhoneNumber: string,
  containerId: string = 'recaptcha-container'
): Promise<ConfirmationResult | PhoneAuthSession> => {
  // Format Angolan phone number to E.164 (+244...)
  let formatted = rawPhoneNumber.replace(/\s+/g, '').replace(/-/g, '');
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('244')) {
      formatted = '+' + formatted;
    } else {
      formatted = '+244' + formatted;
    }
  }

  try {
    const verifier = setupRecaptchaVerifier(containerId);
    const confirmationResult = await signInWithPhoneNumber(auth, formatted, verifier);
    return confirmationResult;
  } catch (error: any) {
    console.warn('Firebase SMS provider error:', error?.message);
    resetRecaptchaVerifier(containerId);

    // If phone provider is not enabled in Firebase Console (auth/operation-not-allowed)
    // or if reCAPTCHA is blocked, activate resilient fallback OTP generator!
    const response = await fetch('/api/auth/phone-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formatted }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao gerar código de confirmação.');
    }

    const fallbackSession: PhoneAuthSession = {
      verificationId: `fallback-${Date.now()}`,
      demoCode: data.code,
      isFallback: true,
      confirm: async (verificationCode: string) => {
        const verifyRes = await fetch('/api/auth/verify-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formatted, code: verificationCode }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'Código de verificação incorreto.');
        }
        const customUser = {
          uid: verifyData.user.uid,
          displayName: verifyData.user.name,
          phoneNumber: verifyData.user.phone,
          role: verifyData.user.role,
          isFallbackSession: true,
        };
        notifyCustomLogin(customUser);
        return { user: customUser };
      },
    };

    return fallbackSession;
  }
};

export const confirmPhoneVerificationCode = async (
  confirmation: ConfirmationResult | PhoneAuthSession,
  code: string,
  name?: string
): Promise<any> => {
  try {
    const result = await confirmation.confirm(code.trim());
    if (result.user && name) {
      if ((result.user as any).isFallbackSession) {
        // already saved
      } else {
        await updateProfile(result.user as User, { displayName: name.trim() }).catch(() => {});
        await saveUserProfile(result.user.uid, {
          uid: result.user.uid,
          name: name.trim(),
          phone: result.user.phoneNumber || undefined,
          role: 'cliente',
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      }
    }
    return result.user;
  } catch (error: any) {
    console.error('Phone verification confirm error:', error);
    throw error;
  }
};

// 9. Sign Out
export const logoutUser = async (): Promise<void> => {
  activeCustomUser = null;
  try {
    localStorage.removeItem('angoserv_session');
  } catch (e) {}
  if (auth.currentUser) {
    await signOut(auth).catch(() => {});
  }
  cachedAccessToken = null;
  authFailureListeners.forEach((fn) => fn());
};

// 10. User Profiles in Firestore
export const saveUserProfile = async (uid: string, profile: Partial<UserProfile>): Promise<void> => {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

// 11. Firestore Real-time Orders Subscriptions & Mutations
export const subscribeToOrders = (
  callback: (orders: Order[]) => void,
  userUid?: string
): Unsubscribe => {
  const path = 'orders';
  try {
    const ordersCol = collection(db, path);
    // If not admin and userUid provided, could filter, but let's query all or filter in callback
    const q = userUid
      ? query(ordersCol, where('customerId', '==', userUid))
      : ordersCol;

    return onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((docSnap) => {
          orders.push({ ...(docSnap.data() as Order), id: docSnap.id });
        });
        // Sort newest first
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(orders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const createOrderInFirestore = async (order: Order): Promise<void> => {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateOrderInFirestore = async (
  orderId: string,
  updates: Partial<Order>
): Promise<void> => {
  const path = `orders/${orderId}`;
  try {
    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'orders', orderId), cleanUpdates as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getOrderFromFirestore = async (orderIdOrCode: string): Promise<Order | null> => {
  const path = `orders`;
  try {
    // First try direct doc get
    const snap = await getDoc(doc(db, 'orders', orderIdOrCode));
    if (snap.exists()) {
      return { ...(snap.data() as Order), id: snap.id };
    }

    // Try query by code
    const q = query(collection(db, 'orders'), where('code', '==', orderIdOrCode.toUpperCase()));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      const first = qSnap.docs[0];
      return { ...(first.data() as Order), id: first.id };
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

// 12. Technicians in Firestore
export const subscribeToTechnicians = (callback: (techs: Technician[]) => void): Unsubscribe => {
  const path = 'technicians';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const techs: Technician[] = [];
        snapshot.forEach((d) => techs.push({ ...(d.data() as Technician), id: d.id }));
        callback(techs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const updateTechnicianInFirestore = async (
  techId: string,
  updates: Partial<Technician>
): Promise<void> => {
  const path = `technicians/${techId}`;
  try {
    await updateDoc(doc(db, 'technicians', techId), updates as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// 13. Zones in Firestore
export const subscribeToZones = (callback: (zones: ZoneConfig[]) => void): Unsubscribe => {
  const path = 'zones';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const zones: ZoneConfig[] = [];
        snapshot.forEach((d) => zones.push(d.data() as ZoneConfig));
        callback(zones);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const updateZoneInFirestore = async (
  province: string,
  updates: Partial<ZoneConfig>
): Promise<void> => {
  const path = `zones/${province}`;
  try {
    await setDoc(doc(db, 'zones', province), updates as any, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// 14. Seeding helper to populate initial demo data if collections are empty
export const seedFirestoreIfEmpty = async (
  initialOrders: Order[],
  initialTechs: Technician[],
  initialZones: ZoneConfig[]
): Promise<void> => {
  try {
    // Check if orders collection has documents
    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty && initialOrders.length > 0) {
      console.log('Seeding initial orders into Firestore...');
      for (const order of initialOrders) {
        await setDoc(doc(db, 'orders', order.id), order);
      }
    }

    // Check technicians
    const techsSnap = await getDocs(collection(db, 'technicians'));
    if (techsSnap.empty && initialTechs.length > 0) {
      console.log('Seeding initial technicians into Firestore...');
      for (const tech of initialTechs) {
        await setDoc(doc(db, 'technicians', tech.id), tech);
      }
    }

    // Check zones
    const zonesSnap = await getDocs(collection(db, 'zones'));
    if (zonesSnap.empty && initialZones.length > 0) {
      console.log('Seeding initial zones into Firestore...');
      for (const zone of initialZones) {
        await setDoc(doc(db, 'zones', zone.province), zone);
      }
    }
  } catch (err) {
    console.warn('Seeding check/notice:', err);
  }
};
