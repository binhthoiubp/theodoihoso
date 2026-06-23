import React, { useState, useEffect, useMemo } from 'react';
import { IncomingDocument } from './types';
import DocumentTable from './components/DocumentTable';
import DocumentFormModal from './components/DocumentFormModal';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import { Search, Plus, Building2, Users, LayoutDashboard, LogOut, Loader2, Shield } from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy, where, limit, getDocs } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [documents, setDocuments] = useState<IncomingDocument[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'van_phong' | 'don_vi' | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'van_phong' | 'don_vi'>('van_phong');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<IncomingDocument | undefined>(undefined);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role as 'admin' | 'van_phong' | 'don_vi');
          } else {
            setUserRole(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserRole(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser || !userRole) {
      setDocuments([]);
      return;
    }

    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const docsData: IncomingDocument[] = [];
      snapshot.forEach((docSnap) => {
        docsData.push({ id: docSnap.id, ...docSnap.data() } as IncomingDocument);
      });
      setDocuments(docsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });

    return () => unsubscribeDocs();
  }, [currentUser, userRole]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const configDoc = await getDoc(doc(db, 'system', 'config'));
        if (configDoc.exists() && configDoc.data().adminInitialized) {
          setAdminExists(true);
        } else {
          setAdminExists(false);
        }
      } catch (error) {
        console.error("Could not check admin status:", error);
        setAdminExists(true);
      }
    };
    checkAdmin();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) {
         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
         // If a user signs up via this hidden backdoor form, make them an admin automatically.
         await setDoc(doc(db, 'users', userCredential.user.uid), {
           email: userCredential.user.email,
           role: 'admin',
           name: 'System Admin'
         });
         await setDoc(doc(db, 'system', 'config'), {
           adminInitialized: true
         }, { merge: true });
         setUserRole('admin');
         setAdminExists(true);
         setIsSignUp(false);
      } else {
         await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setAuthError(error.message || "Authentication failed");
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("SignOut error:", error);
    }
  };

  const selectRole = async (role: 'van_phong' | 'don_vi') => {
    if (!currentUser) return;
    try {
      const path = `users/${currentUser.uid}`;
      await setDoc(doc(db, 'users', currentUser.uid), {
        role,
        email: currentUser.email,
        name: currentUser.displayName || 'Unknown'
      }).catch(err => { handleFirestoreError(err, OperationType.WRITE, path); });
      setUserRole(role);
    } catch (error) {
      // Error handled by catch above mostly
      console.error("Error setting role:", error);
    }
  };

  const handleSave = async (data: IncomingDocument) => {
    if (!currentUser) return;
    
    try {
      const path = `documents/${data.id}`;
      const docRef = doc(db, 'documents', data.id);
      
      const payload: any = { ...data };
      delete payload.id;
      
      if (!data.createdAt) {
         payload.createdAt = Date.now();
         payload.createdBy = currentUser.uid;
      }
      payload.updatedAt = Date.now();

      await setDoc(docRef, payload, { merge: true }).catch(err => { handleFirestoreError(err, OperationType.WRITE, path); });
      
      setIsModalOpen(false);
      setEditingDoc(undefined);
    } catch (error) {
      console.error("Save denied:", error);
      throw error;
    }
  };

  const handleEdit = (docData: IncomingDocument) => {
    setEditingDoc(docData);
    setIsModalOpen(true);
  };

  const uniqueUnits = useMemo(() => {
    const units = documents.map(d => d.executingUnit).filter(Boolean);
    return Array.from(new Set(units));
  }, [documents]);

  const uniqueAssignees = useMemo(() => {
    const assignees = documents.map(d => d.assignee).filter(Boolean);
    return Array.from(new Set(assignees));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(docItem => {
      const matchSearch = docItem.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          docItem.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;

      if (userRole === 'van_phong') {
        if (filterUnit !== 'ALL' && docItem.executingUnit !== filterUnit) return false;
      } else {
        if (filterAssignee !== 'ALL' && docItem.assignee !== filterAssignee) return false;
      }

      return true;
    }); // No need to sort here as firestore query has orderBy desc
  }, [documents, searchTerm, userRole, filterUnit, filterAssignee]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
           <div 
             className={`mx-auto rounded-xl p-3 w-16 h-16 flex items-center justify-center shadow-lg transition-colors ${adminExists === false ? 'bg-blue-600 cursor-pointer hover:bg-blue-700' : 'bg-blue-600'}`}
             onClick={() => {
               if (adminExists === false) {
                 setIsSignUp(!isSignUp);
                 setAuthError('');
               }
             }}
             title={adminExists === false ? "Nhấn để khởi tạo Admin" : undefined}
           >
             <LayoutDashboard className="h-8 w-8 text-white" />
           </div>
           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
             {isSignUp ? "Khởi tạo Admin (Ẩn)" : "Đăng nhập Hệ thống"}
           </h2>
           <p className="mt-2 text-center text-sm text-gray-600">
             Quản lý Phân công & Tiến độ Văn bản đến
           </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleEmailAuth}>
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md">
                   {authError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isSignUp ? "Khởi tạo Administrator" : "Đăng nhập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto bg-yellow-500 rounded-xl p-3 w-16 h-16 flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Tài khoản chưa có quyền truy cập
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Xin chào {currentUser.email}! Tài khoản của bạn cần được cấp quyền bởi Hệ thống Admin để có thể sử dụng ứng dụng.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      {/* App Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl md:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`rounded-md p-2 ${userRole === 'admin' ? 'bg-purple-600' : 'bg-blue-600'}`}>
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">Hệ thống Quản lý Phân công & Tiến độ</h1>
              <p className="text-sm text-gray-500 font-medium">
                Vai trò: {userRole === 'admin' ? 'Quản trị viên' : userRole === 'van_phong' ? 'Chuyên viên Văn phòng' : 'Chuyên viên Đơn vị'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {userRole === 'van_phong' && (
              <button 
                onClick={() => {
                  setEditingDoc(undefined);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 -ml-1 h-5 w-5" />
                Thêm Văn bản
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <LogOut className="mr-2 -ml-1 h-4 w-4" />
              Thoát
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl md:max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {userRole === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            {/* Dashboard solely for van_phong */}
            {userRole === 'van_phong' && (
              <Dashboard documents={documents} />
            )}

            {/* Toolbar */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {userRole === 'van_phong' ? 'Danh sách Văn bản đến' : 'Văn bản được giao'}
              </h2>

              <div className="flex items-center space-x-4">
                {/* Dynamic Filter based on Role */}
                {userRole === 'van_phong' ? (
                  <select 
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value)}
                    className="block w-48 pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm border bg-white"
                  >
                    <option value="ALL">Tất cả Đơn vị...</option>
                    {uniqueUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                ) : (
                  <select 
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="block w-48 pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm border bg-white"
                  >
                    <option value="ALL">Tất cả Chuyên viên...</option>
                    {uniqueAssignees.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}

                {/* Search */}
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2.5 sm:text-sm border-gray-300 border bg-white rounded-md"
                    placeholder="Tìm số hiệu, trích yếu..."
                  />
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mb-4 text-sm text-gray-500 flex items-center">
              <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs font-medium mr-2">
                Đang hiển thị {filteredDocuments.length} văn bản
              </span>
              {userRole === 'van_phong' 
                ? `Chuyên viên Văn phòng theo dõi văn bản đến theo Đơn vị thực hiện.` 
                : `Chuyên viên đơn vị theo dõi lĩnh vực được phân công thụ lý.`}
            </div>

            {/* Data Table */}
            <DocumentTable 
              documents={filteredDocuments} 
              onEdit={handleEdit} 
              viewMode={userRole} 
            />
          </>
        )}
        
      </main>

      {isModalOpen && userRole !== 'admin' && (
        <DocumentFormModal
          isOpen={isModalOpen}
          initialData={editingDoc}
          viewMode={userRole}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDoc(undefined);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}


