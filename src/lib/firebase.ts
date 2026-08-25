import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order, ProductType, ProcessProgressMap, User } from '../types';
import {
  INITIAL_ORDERS,
  DEFAULT_PRODUCT_TYPES,
  INITIAL_PROCESS_PROGRESS
} from '../data/defaultData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// 1. Subscribe to Orders in Firestore
export function subscribeOrders(
  onUpdate: (orders: Record<string, Order>) => void,
  onError?: (err: Error) => void
) {
  const ordersRef = collection(db, 'orders');

  return onSnapshot(
    ordersRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial orders if empty
        try {
          const batch = writeBatch(db);
          Object.values(INITIAL_ORDERS).forEach((ord) => {
            batch.set(doc(db, 'orders', ord.id), ord);
          });
          await batch.commit();
        } catch (err) {
          console.error('Failed to seed initial orders to Firestore', err);
        }
        onUpdate(INITIAL_ORDERS);
        return;
      }

      const ordersMap: Record<string, Order> = {};
      snapshot.forEach((docSnap) => {
        ordersMap[docSnap.id] = docSnap.data() as Order;
      });
      onUpdate(ordersMap);
    },
    (err) => {
      console.error('Firestore orders snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

// Helper function to recursively strip undefined properties for Firestore safety
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as unknown as T;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined) as unknown as T;

  const result: Record<string, any> = {};
  for (const key of Object.keys(obj as Record<string, any>)) {
    const val = (obj as Record<string, any>)[key];
    if (val !== undefined) {
      result[key] = cleanUndefined(val);
    }
  }
  return result as T;
}

// Save or Update Order in Firestore
export async function saveOrderToFirestore(order: Order) {
  try {
    await setDoc(doc(db, 'orders', order.id), cleanUndefined(order));
  } catch (err) {
    console.error('Error saving order to Firestore:', err);
  }
}

// Delete Order from Firestore
export async function deleteOrderFromFirestore(orderId: string) {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (err) {
    console.error('Error deleting order from Firestore:', err);
  }
}

// 2. Subscribe to ProductTypes in Firestore
export function subscribeProductTypes(
  onUpdate: (types: Record<string, ProductType>) => void,
  onError?: (err: Error) => void
) {
  const typesRef = collection(db, 'productTypes');

  return onSnapshot(
    typesRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial product types if empty
        try {
          const batch = writeBatch(db);
          Object.values(DEFAULT_PRODUCT_TYPES).forEach((pt) => {
            batch.set(doc(db, 'productTypes', pt.id), pt);
          });
          await batch.commit();
        } catch (err) {
          console.error('Failed to seed product types to Firestore', err);
        }
        onUpdate(DEFAULT_PRODUCT_TYPES);
        return;
      }

      const typesMap: Record<string, ProductType> = {};
      snapshot.forEach((docSnap) => {
        typesMap[docSnap.id] = docSnap.data() as ProductType;
      });
      onUpdate(typesMap);
    },
    (err) => {
      console.error('Firestore productTypes snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

// Save or Update ProductType in Firestore
export async function saveProductTypeToFirestore(productType: ProductType) {
  try {
    await setDoc(doc(db, 'productTypes', productType.id), cleanUndefined(productType));
  } catch (err) {
    console.error('Error saving product type to Firestore:', err);
  }
}

// Delete ProductType from Firestore
export async function deleteProductTypeFromFirestore(typeId: string) {
  try {
    await deleteDoc(doc(db, 'productTypes', typeId));
  } catch (err) {
    console.error('Error deleting product type from Firestore:', err);
  }
}

// 3. Subscribe to ProcessProgress in Firestore
export function subscribeProcessProgress(
  onUpdate: (progressMap: ProcessProgressMap) => void,
  onError?: (err: Error) => void
) {
  const progressRef = collection(db, 'processProgress');

  return onSnapshot(
    progressRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial process progress if empty
        try {
          const batch = writeBatch(db);
          Object.entries(INITIAL_PROCESS_PROGRESS).forEach(([key, value]) => {
            batch.set(doc(db, 'processProgress', key), cleanUndefined({ processKey: key, ...value }));
          });
          await batch.commit();
        } catch (err) {
          console.error('Failed to seed process progress to Firestore', err);
        }
        onUpdate(INITIAL_PROCESS_PROGRESS);
        return;
      }

      const progressMap: ProcessProgressMap = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        progressMap[docSnap.id] = {
          isCompleted: data.isCompleted,
          completedAt: data.completedAt || null,
          worker: data.worker || '',
          machine: data.machine || '',
          status: data.status,
          actualStart: data.actualStart || null,
          actualEnd: data.actualEnd || null,
          actualMinutes: data.actualMinutes,
          pauseHistory: data.pauseHistory || [],
          pauseReason: data.pauseReason,
          delayMinutes: data.delayMinutes,
          delayReason: data.delayReason,
          memo: data.memo,
        };
      });
      onUpdate(progressMap);
    },
    (err) => {
      console.error('Firestore processProgress snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

// Update Single Process Progress in Firestore
export async function saveProcessProgressToFirestore(
  processKey: string,
  progress: import('../types').ProcessProgressItem
) {
  try {
    const payload = cleanUndefined({
      processKey,
      isCompleted: Boolean(progress.isCompleted),
      completedAt: progress.completedAt || null,
      worker: progress.worker || '',
      machine: progress.machine || '',
      status: progress.status,
      actualStart: progress.actualStart || null,
      actualEnd: progress.actualEnd || null,
      actualMinutes: progress.actualMinutes,
      pauseHistory: progress.pauseHistory || [],
      pauseReason: progress.pauseReason,
      delayMinutes: progress.delayMinutes,
      delayReason: progress.delayReason,
      memo: progress.memo,
    });
    await setDoc(doc(db, 'processProgress', processKey), payload, { merge: true });
  } catch (err) {
    console.error('Error saving process progress to Firestore:', err);
  }
}

// Reset All Data in Firestore to Initial Seed
export async function resetFirestoreData() {
  try {
    // Clear & re-seed orders
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const b1 = writeBatch(db);
    ordersSnap.forEach((d) => b1.delete(d.ref));
    Object.values(INITIAL_ORDERS).forEach((ord) => {
      b1.set(doc(db, 'orders', ord.id), ord);
    });
    await b1.commit();

    // Clear & re-seed product types
    const typesSnap = await getDocs(collection(db, 'productTypes'));
    const b2 = writeBatch(db);
    typesSnap.forEach((d) => b2.delete(d.ref));
    Object.values(DEFAULT_PRODUCT_TYPES).forEach((pt) => {
      b2.set(doc(db, 'productTypes', pt.id), pt);
    });
    await b2.commit();

    // Clear & re-seed process progress
    const progressSnap = await getDocs(collection(db, 'processProgress'));
    const b3 = writeBatch(db);
    progressSnap.forEach((d) => b3.delete(d.ref));
    Object.entries(INITIAL_PROCESS_PROGRESS).forEach(([key, value]) => {
      b3.set(doc(db, 'processProgress', key), { processKey: key, ...value });
    });
    await b3.commit();
  } catch (err) {
    console.error('Error resetting Firestore data:', err);
  }
}

// 4. User Auth & Approval Functions
export async function registerUserAccount(
  email: string,
  pass: string,
  name: string,
  requestedRole: 'USER' | 'ADMIN' = 'USER',
  department?: string,
  phoneNumber?: string,
  skillMctLevel: number = 3,
  skillGrinderLevel: number = 3
): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  const usersSnap = await getDocs(collection(db, 'users'));
  const isSuperAdmin = normalizedEmail === 'noworriesmate01@gmail.com';
  const isFirstUser = usersSnap.empty;

  // Respect the requestedRole! Only force ADMIN for superAdmin or if ADMIN was explicitly requested on first user
  const finalRole = isSuperAdmin ? 'ADMIN' : requestedRole;
  const finalApproved = isSuperAdmin ? true : (isFirstUser ? true : false);
  const finalDepartment = isSuperAdmin ? '시스템 관리자' : department;

  let uid: string;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
    uid = userCredential.user.uid;
    await signOut(auth);
  } catch (err: any) {
    console.warn('Firebase auth register fallback to Firestore store:', err?.code || err?.message);
    uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const userDoc: User = {
    uid,
    email: normalizedEmail,
    password: pass,
    name,
    phoneNumber: phoneNumber || '010-0000-0000',
    role: finalRole,
    department: finalDepartment,
    skillMctLevel: skillMctLevel || 3,
    skillGrinderLevel: skillGrinderLevel || 3,
    isApproved: finalApproved,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uid), userDoc);
  return userDoc;
}

export async function setUserOnlineStatus(userIdent: string | null | undefined, isOnline: boolean) {
  if (!userIdent) return;
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let targetDocId: string | null = null;
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data() as User;
      if (
        docSnap.id === userIdent ||
        data.uid === userIdent ||
        (data.email && data.email.toLowerCase() === userIdent.toLowerCase()) ||
        data.name === userIdent
      ) {
        targetDocId = docSnap.id;
      }
    });

    if (targetDocId) {
      await setDoc(
        doc(db, 'users', targetDocId),
        {
          isOnline,
          ...(isOnline ? { loginAt: new Date().toISOString() } : { logoutAt: new Date().toISOString() }),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Failed to update online status:', err);
  }
}

export async function loginUserAccount(email: string, pass: string): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  let matchedUser: User | null = null;

  // Try Firebase Auth first
  try {
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
    const uid = userCredential.user.uid;
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data() as User;
      if (data.uid === uid || (data.email && data.email.toLowerCase() === normalizedEmail)) {
        matchedUser = data;
      }
    });
  } catch (err: any) {
    console.warn('Firebase auth login fallback to Firestore lookup:', err?.code || err?.message);
  }

  // Fallback to Firestore users collection
  if (!matchedUser) {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data() as User;
      if (data.email && data.email.toLowerCase() === normalizedEmail) {
        // If password stored, verify
        if (!data.password || data.password === pass) {
          matchedUser = data;
        }
      }
    });
  }

  // If super admin email or default admin or no user found for first login attempt
  const isSuperAdmin =
    normalizedEmail === 'noworriesmate01@gmail.com' ||
    normalizedEmail === 'admin@jstech.co.kr' ||
    normalizedEmail === 'admin@jun-sung.co.kr';

  if (!matchedUser) {
    if (isSuperAdmin) {
      const uid = `admin_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      matchedUser = {
        uid,
        email: normalizedEmail,
        password: pass,
        name: normalizedEmail.includes('noworries') ? '대표 관리자' : '시스템 관리자',
        role: 'ADMIN',
        isApproved: true,
        createdAt: new Date().toISOString(),
        permissions: {
          canEditOrder: true,
          canExecuteMES: true,
          canManageUsers: true,
          canEditMaster: true,
          canArchive: true,
        },
      };
      await setDoc(doc(db, 'users', uid), matchedUser);
    } else {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        const uid = `user_init_${Date.now()}`;
        matchedUser = {
          uid,
          email: normalizedEmail,
          password: pass,
          name: '시스템 관리자',
          role: 'ADMIN',
          isApproved: true,
          createdAt: new Date().toISOString(),
          permissions: {
            canEditOrder: true,
            canExecuteMES: true,
            canManageUsers: true,
            canEditMaster: true,
            canArchive: true,
          },
        };
        await setDoc(doc(db, 'users', uid), matchedUser);
      } else {
        throw new Error('INVALID_CREDENTIALS');
      }
    }
  }

  if (!matchedUser.isApproved) {
    try { await signOut(auth); } catch {}
    throw new Error('PENDING_APPROVAL');
  }

  // Mark user as online in Firestore
  const ident = matchedUser.uid || matchedUser.email || matchedUser.name;
  await setUserOnlineStatus(ident, true);
  matchedUser.isOnline = true;
  matchedUser.loginAt = new Date().toISOString();

  return matchedUser;
}

export async function logoutUserAccount(currentUser?: User | null) {
  if (currentUser) {
    const ident = currentUser.uid || currentUser.email || currentUser.name;
    await setUserOnlineStatus(ident, false);
  } else if (auth.currentUser) {
    await setUserOnlineStatus(auth.currentUser.uid, false);
  }
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Error signing out:', err);
  }
}

export function subscribeUsersList(
  onUpdate: (users: User[]) => void,
  onError?: (err: Error) => void
) {
  const usersRef = collection(db, 'users');

  return onSnapshot(
    usersRef,
    (snapshot) => {
      const emailMap = new Map<string, { user: User; docId: string }>();
      const extraDocIdsToDelete: string[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as User;
        const docId = docSnap.id;
        const uid = data.uid || docId;
        const userObj: User = { ...data, uid };
        const key = (data.email || data.name || docId).toLowerCase().trim();

        if (emailMap.has(key)) {
          // Duplicate account document found for the same email
          const existing = emailMap.get(key)!;
          if (userObj.role === 'ADMIN' && existing.user.role !== 'ADMIN') {
            extraDocIdsToDelete.push(existing.docId);
            emailMap.set(key, { user: userObj, docId });
          } else {
            extraDocIdsToDelete.push(docId);
          }
        } else {
          emailMap.set(key, { user: userObj, docId });
        }
      });

      // Automatically clean up duplicate user documents from Firestore
      if (extraDocIdsToDelete.length > 0) {
        extraDocIdsToDelete.forEach((id) => {
          deleteDoc(doc(db, 'users', id)).catch(() => {});
        });
      }

      const list = Array.from(emailMap.values()).map((item) => item.user);
      onUpdate(list);
    },
    (err) => {
      console.error('Users snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

export async function updateUserApprovalStatus(
  uid: string,
  isApproved: boolean,
  department?: string,
  permissions?: import('../types').UserPermissions
) {
  try {
    const updateData: any = { isApproved };
    if (department !== undefined) updateData.department = department;
    if (permissions !== undefined) updateData.permissions = permissions;
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
  } catch (err) {
    console.error('Failed to update approval status:', err);
  }
}

export async function updateUserRoleInFirestore(
  uid: string,
  role: 'USER' | 'ADMIN',
  department?: string
) {
  try {
    const updateData: any = { role };
    if (department !== undefined) updateData.department = department;
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
  } catch (err) {
    console.error('Failed to update role:', err);
  }
}

export async function updateUserPermissionsInFirestore(
  uid: string,
  permissions: import('../types').UserPermissions,
  role?: 'USER' | 'ADMIN',
  department?: string,
  isApproved?: boolean
) {
  try {
    const updateData: any = { permissions };
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
  } catch (err) {
    console.error('Failed to update user permissions:', err);
  }
}

export async function deleteUserFromFirestore(uid: string) {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (err) {
    console.error('Failed to delete user:', err);
  }
}

// Reset all orders, product types, and process progress to factory initial defaults
export async function resetDataToDefaultInFirestore() {
  try {
    // 1. Clear LocalStorage
    localStorage.removeItem('mes_orders_v2');
    localStorage.removeItem('mes_product_types_v2');
    localStorage.removeItem('mes_process_progress_v2');

    // 2. Clear & Seed Orders in Firestore
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const orderBatch = writeBatch(db);
    ordersSnap.forEach((dSnap) => orderBatch.delete(dSnap.ref));
    Object.values(INITIAL_ORDERS).forEach((ord) => {
      orderBatch.set(doc(db, 'orders', ord.id), cleanUndefined(ord));
    });
    await orderBatch.commit();

    // 3. Clear & Seed Product Types in Firestore
    const typesSnap = await getDocs(collection(db, 'productTypes'));
    const typeBatch = writeBatch(db);
    typesSnap.forEach((dSnap) => typeBatch.delete(dSnap.ref));
    Object.values(DEFAULT_PRODUCT_TYPES).forEach((t) => {
      typeBatch.set(doc(db, 'productTypes', t.id), cleanUndefined(t));
    });
    await typeBatch.commit();

    // 4. Clear & Seed Process Progress in Firestore
    const progressSnap = await getDocs(collection(db, 'processProgress'));
    const progressBatch = writeBatch(db);
    progressSnap.forEach((dSnap) => progressBatch.delete(dSnap.ref));
    Object.entries(INITIAL_PROCESS_PROGRESS).forEach(([key, val]) => {
      progressBatch.set(doc(db, 'processProgress', key), cleanUndefined(val));
    });
    await progressBatch.commit();

    console.log('Database successfully reset to initial default state.');
  } catch (err) {
    console.error('Failed to reset Firestore data:', err);
    throw err;
  }
}
