import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  query,
  where,
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
    (snapshot) => {
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

// Delete Order from Firestore permanently
export async function deleteOrderFromFirestore(orderId: string) {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
    // Also delete any matching process progress docs
    const progressSnap = await getDocs(collection(db, 'processProgress'));
    const b = writeBatch(db);
    let count = 0;
    progressSnap.forEach((d) => {
      const id = d.id;
      if (id.startsWith(`${orderId}-`) || id.startsWith(`${orderId}_`) || id.includes(`-${orderId}-`)) {
        b.delete(d.ref);
        count++;
      }
    });
    if (count > 0) {
      await b.commit();
    }
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
          defectQty: data.defectQty,
          andonStatus: data.andonStatus || 'NORMAL',
          andonIssueType: data.andonIssueType || '',
          andonIssueNote: data.andonIssueNote || '',
          andonReportedAt: data.andonReportedAt || null,
          andonReportedBy: data.andonReportedBy || '',
          andonHistory: data.andonHistory || [],
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
      defectQty: progress.defectQty,
      andonStatus: progress.andonStatus || 'NORMAL',
      andonIssueType: progress.andonIssueType || null,
      andonIssueNote: progress.andonIssueNote || null,
      andonReportedAt: progress.andonReportedAt || null,
      andonReportedBy: progress.andonReportedBy || null,
      andonHistory: progress.andonHistory || [],
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

// Canonical standard departments for company members
export const KNOWN_MEMBER_DEPARTMENTS: Record<string, string> = {
  '김현아': '가공팀',
  '제갈문정': '가공팀',
  '전광식': '가공팀',
  '박준영': '연마팀',
  '김수현': '연마팀',
  '박종도': '품질팀',
  '주장태': '생산 관리',
  '박세령': '생산 관리',
};

// 4. User Auth & Approval Functions
export async function registerUserAccount(
  email: string,
  pass: string,
  name: string,
  requestedRole: 'USER' | 'ADMIN' = 'USER',
  department?: string | null,
  phoneNumber?: string,
  skillMctLevel: number = 3,
  skillGrinderLevel: number = 3
): Promise<User> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanPhone = (phoneNumber || '').trim();
  const cleanName = (name || '').trim();
  const usersSnap = await getDocs(collection(db, 'users'));
  const isSuperAdmin = normalizedEmail === 'noworriesmate01@gmail.com';
  const isFirstUser = usersSnap.empty;

  // Derive canonical department if not explicitly given or set to '미지정'
  let finalDepartment = isSuperAdmin ? '시스템 관리자' : (department && department.trim() && department !== '미지정' ? department.trim() : '');
  if (!finalDepartment) {
    const base = cleanName.replace(/\s*\([^)]*\)/g, '').trim();
    if (KNOWN_MEMBER_DEPARTMENTS[base]) {
      finalDepartment = KNOWN_MEMBER_DEPARTMENTS[base];
    } else if (skillGrinderLevel && skillMctLevel && skillGrinderLevel > skillMctLevel) {
      finalDepartment = '연마팀';
    } else {
      finalDepartment = '가공팀';
    }
  }

  // Respect the requestedRole! Only force ADMIN for superAdmin or if ADMIN was explicitly requested on first user
  const finalRole = isSuperAdmin ? 'ADMIN' : requestedRole;
  const finalApproved = isSuperAdmin ? true : (isFirstUser ? true : false);
  const finalStatus: 'approved' | 'pending' = finalApproved ? 'approved' : 'pending';

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
    name: cleanName === '대표 관리자' || cleanName.includes('대표') ? '시스템 관리자' : cleanName,
    phoneNumber: cleanPhone,
    phone_number: cleanPhone, // snake_case 및 DB 호환 필드
    role: finalRole,
    department: finalDepartment,
    skillMctLevel: skillMctLevel || 3,
    skillGrinderLevel: skillGrinderLevel || 3,
    isApproved: finalApproved,
    status: finalStatus,
    createdAt: new Date().toISOString(),
  };

  // Safe Firestore write ensuring no undefined properties
  await setDoc(doc(db, 'users', uid), cleanUndefined(userDoc));
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
      const data = docSnap.data() as any;
      if (data.uid === uid || (data.email && data.email.toLowerCase() === normalizedEmail)) {
        const phone = (data.phoneNumber || data.phone_number || data.phone || '').trim();
        matchedUser = {
          ...data,
          uid: data.uid || docSnap.id,
          phoneNumber: phone,
          phone_number: phone,
          department: data.department || '미지정',
        };
      }
    });
  } catch (err: any) {
    console.warn('Firebase auth login fallback to Firestore lookup:', err?.code || err?.message);
  }

  // Fallback to Firestore users collection
  if (!matchedUser) {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (data.email && data.email.toLowerCase() === normalizedEmail) {
        // If password stored, verify
        if (!data.password || data.password === pass) {
          const phone = (data.phoneNumber || data.phone_number || data.phone || '').trim();
          const rawName = (data.name || '').trim();
          const baseName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
          const cleanName = rawName === '대표 관리자' || rawName.includes('대표') ? '시스템 관리자' : rawName;
          let dept = data.department;
          if (!dept || dept === '미지정') {
            dept = KNOWN_MEMBER_DEPARTMENTS[baseName] || (data.role === 'ADMIN' ? '시스템 관리자' : '가공팀');
          }
          matchedUser = {
            ...data,
            name: cleanName,
            uid: data.uid || docSnap.id,
            phoneNumber: phone,
            phone_number: phone,
            department: dept,
          };
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
        name: '시스템 관리자',
        phoneNumber: '010-1234-5678',
        phone_number: '010-1234-5678',
        role: 'ADMIN',
        department: '시스템 관리자',
        isApproved: true,
        status: 'approved',
        createdAt: new Date().toISOString(),
        permissions: {
          canEditOrder: true,
          canExecuteMES: true,
          canManageUsers: true,
          canEditMaster: true,
          canArchive: true,
          canQualityInspection: true,
          canShipmentControl: true,
        },
      };
      await setDoc(doc(db, 'users', uid), cleanUndefined(matchedUser));
    } else {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        const uid = `user_init_${Date.now()}`;
        matchedUser = {
          uid,
          email: normalizedEmail,
          password: pass,
          name: '시스템 관리자',
          phoneNumber: '010-1234-5678',
          phone_number: '010-1234-5678',
          role: 'ADMIN',
          department: '시스템 관리자',
          isApproved: true,
          status: 'approved',
          createdAt: new Date().toISOString(),
          permissions: {
            canEditOrder: true,
            canExecuteMES: true,
            canManageUsers: true,
            canEditMaster: true,
            canArchive: true,
            canQualityInspection: true,
            canShipmentControl: true,
          },
        };
        await setDoc(doc(db, 'users', uid), cleanUndefined(matchedUser));
      } else {
        throw new Error('INVALID_CREDENTIALS');
      }
    }
  }

  // Ensure superAdmin has full admin role, system admin department and approved status
  if (isSuperAdmin || matchedUser.email === 'noworriesmate01@gmail.com') {
    matchedUser.role = 'ADMIN';
    matchedUser.department = '시스템 관리자';
    matchedUser.name = '시스템 관리자';
    matchedUser.isApproved = true;
    matchedUser.status = 'approved';
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
      const usersMap = new Map<string, User>();

      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as any;
        const docId = docSnap.id;
        const uid = raw.uid || docId;
        const rawName = (raw.name || '').trim();
        const email = (raw.email || '').toLowerCase().trim();
        const phone = (raw.phoneNumber || raw.phone_number || raw.phone || '').trim();

        // Skip completely empty/ghost documents
        if (!rawName && !email) {
          return;
        }

        const isSuperAdmin =
          email === 'noworriesmate01@gmail.com' ||
          email === 'admin@jstech.co.kr' ||
          email === 'admin@jun-sung.co.kr' ||
          rawName === '대표 관리자' ||
          rawName.includes('대표') ||
          rawName === '시스템 관리자' ||
          rawName === '시스템관리자';

        let name = rawName;
        let dept = (raw.department || '').trim();
        let role = raw.role || 'USER';
        let isApproved =
          raw.isApproved === true ||
          raw.isApproved === 'true' ||
          raw.status === 'approved' ||
          (raw.status !== 'pending' && raw.status !== 'rejected' && raw.isApproved !== false);

        if (isSuperAdmin) {
          name = '시스템 관리자';
          dept = '시스템 관리자';
          role = 'ADMIN';
          isApproved = true;

          // Auto-repair Firestore document if it had legacy "대표 관리자"
          if (rawName === '대표 관리자' || raw.name !== '시스템 관리자' || raw.department !== '시스템 관리자') {
            setDoc(
              doc(db, 'users', docId),
              {
                name: '시스템 관리자',
                department: '시스템 관리자',
                role: 'ADMIN',
                isApproved: true,
                status: 'approved',
              },
              { merge: true }
            ).catch(() => {});
          }
        } else {
          // If department is missing or explicitly '미지정', provide an intelligent initial fallback without overriding user-set values
          if (!dept || dept === '미지정') {
            const baseName = name.replace(/\s*\([^)]*\)/g, '').trim();
            if (KNOWN_MEMBER_DEPARTMENTS[baseName]) {
              dept = KNOWN_MEMBER_DEPARTMENTS[baseName];
            } else if (raw.skillGrinderLevel && raw.skillMctLevel && raw.skillGrinderLevel > raw.skillMctLevel) {
              dept = '연마팀';
            } else {
              dept = '가공팀';
            }
            isApproved = true;
            setDoc(
              doc(db, 'users', docId),
              { department: dept, isApproved: true, status: 'approved' },
              { merge: true }
            ).catch(() => {});
          }
        }

        const userObj: User = {
          ...raw,
          uid,
          name,
          email,
          phoneNumber: phone,
          phone_number: phone,
          role,
          department: dept,
          isApproved: isApproved,
          status: isApproved ? 'approved' : (raw.status || 'pending'),
        };

        // Deduplicate: Ensure only 1 entry for super admin
        const primaryKey = isSuperAdmin ? 'admin_primary_single' : (email || uid || docId);
        if (!usersMap.has(primaryKey)) {
          usersMap.set(primaryKey, userObj);
        } else {
          // If the existing entry doesn't have a phone number, use the one with a phone number
          const existing = usersMap.get(primaryKey)!;
          if ((!existing.phoneNumber || existing.phoneNumber === '010-0000-0000') && (phone && phone !== '010-0000-0000')) {
            usersMap.set(primaryKey, {
              ...existing,
              phoneNumber: phone,
              phone_number: phone,
            });
          }
        }
      });

      const list = Array.from(usersMap.values());
      onUpdate(list);
    },
    (err) => {
      console.error('Users snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

async function resolveUserDocRef(uidOrEmail: string) {
  if (!uidOrEmail) return null;
  // 1. Try direct doc ID
  const directRef = doc(db, 'users', uidOrEmail);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) {
    return directRef;
  }
  // 2. Query by uid field
  const qUid = query(collection(db, 'users'), where('uid', '==', uidOrEmail));
  const snapUid = await getDocs(qUid);
  if (!snapUid.empty) {
    return snapUid.docs[0].ref;
  }
  // 3. Query by email field
  const qEmail = query(collection(db, 'users'), where('email', '==', uidOrEmail.toLowerCase().trim()));
  const snapEmail = await getDocs(qEmail);
  if (!snapEmail.empty) {
    return snapEmail.docs[0].ref;
  }
  return directRef;
}

export async function updateUserPhoneNumber(uid: string, phoneNumber: string) {
  try {
    const cleanPhone = (phoneNumber || '').trim();
    const userRef = await resolveUserDocRef(uid);
    if (!userRef) return;
    await setDoc(
      userRef,
      cleanUndefined({
        phoneNumber: cleanPhone,
        phone_number: cleanPhone,
      }),
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to update phone number in Firestore:', err);
  }
}

export async function updateUserApprovalStatus(
  uid: string,
  isApproved: boolean,
  department?: string | null,
  permissions?: import('../types').UserPermissions
) {
  try {
    const updateData: any = {
      isApproved,
      status: isApproved ? 'approved' : 'pending'
    };
    if (department !== undefined) updateData.department = department || '미지정';
    if (permissions !== undefined) updateData.permissions = permissions;
    const userRef = await resolveUserDocRef(uid);
    if (!userRef) return;
    await setDoc(userRef, cleanUndefined(updateData), { merge: true });
  } catch (err) {
    console.error('Failed to update approval status:', err);
  }
}

export async function updateUserRoleInFirestore(
  uid: string,
  role: 'USER' | 'ADMIN',
  department?: string | null
) {
  try {
    const updateData: any = { role };
    if (department !== undefined) updateData.department = department || '미지정';
    const userRef = await resolveUserDocRef(uid);
    if (!userRef) return;
    await setDoc(userRef, cleanUndefined(updateData), { merge: true });
  } catch (err) {
    console.error('Failed to update role:', err);
  }
}

export async function updateUserPermissionsInFirestore(
  uid: string,
  permissions: import('../types').UserPermissions,
  role?: 'USER' | 'ADMIN',
  department?: string | null,
  isApproved?: boolean
) {
  try {
    const updateData: any = { permissions };
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department || '미지정';
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved;
      updateData.status = isApproved ? 'approved' : 'pending';
    }
    const userRef = await resolveUserDocRef(uid);
    if (!userRef) return;
    await setDoc(userRef, cleanUndefined(updateData), { merge: true });
  } catch (err) {
    console.error('Failed to update user permissions:', err);
  }
}

export async function deleteUserFromFirestore(uid: string) {
  try {
    const userRef = await resolveUserDocRef(uid);
    if (!userRef) return;
    await deleteDoc(userRef);
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
