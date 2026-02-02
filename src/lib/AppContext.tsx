// PureSki 冒險者公會 - 全域狀態管理
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type {
  User,
  Task,
  Product,
  TreasureItem,
  TreasureReviewRequest,
  Transaction,
  BountyType,
  TaskRank,
  ProductCategory,
  AdventurerRank,
} from './types';
import * as store from './store';

interface AppState {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  products: Product[];
  treasures: TreasureItem[];
  treasureReviews: TreasureReviewRequest[];
  transactions: Transaction[];
  isLoading: boolean;
}

interface AppContextType extends AppState {
  // 用戶操作
  switchUser: (userId: string) => Promise<void>;
  updateCurrentUser: (updates: Partial<User>) => Promise<void>;
  updateUserAvatar: (avatarUri: string) => Promise<void>;
  updateUserFrame: (frameId: string) => Promise<void>;
  createUser: (name: string, role: 'admin' | 'staff') => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  changeUserRole: (userId: string, role: 'admin' | 'staff') => Promise<void>;
  adjustUserCoins: (userId: string, amount: number, reason: string) => Promise<void>;
  
  // 任務操作
  createTask: (title: string, description: string, type: BountyType, rank: TaskRank, reward: number) => Promise<Task>;
  applyForTask: (taskId: string) => Promise<void>;
  assignTask: (taskId: string, assigneeId: string) => Promise<void>;
  acceptTask: (taskId: string) => Promise<void>;
  submitProof: (taskId: string, proofUri: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  rateTask: (taskId: string, toUserId: string, rating: number, comment?: string) => Promise<void>;
  
  // 商品操作
  createProduct: (name: string, description: string, category: ProductCategory, price: number, stock: number, minRank?: AdventurerRank, imageUri?: string) => Promise<Product>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  redeemProduct: (productId: string) => Promise<{ success: boolean; message: string }>;
  
  // 寶物操作
  requestTreasureUse: (treasureId: string) => Promise<void>;
  reviewTreasureUse: (requestId: string, approved: boolean) => Promise<{ success: boolean; message: string }>;
  
  // 津貼操作
  distributeAllowance: (amount?: number) => Promise<{ success: boolean; message: string }>;
  
  // 資料刷新
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    tasks: [],
    products: [],
    treasures: [],
    treasureReviews: [],
    transactions: [],
    isLoading: true,
  });

  const refreshData = useCallback(async () => {
    const [currentUser, users, , products, treasures, treasureReviews, transactions] = await Promise.all([
      store.getCurrentUser(),
      store.getAllUsers(),
      store.getAllTasks(),
      store.getAllProducts(),
      store.getAllTreasures(),
      store.getAllTreasureReviews(),
      store.getAllTransactions(),
    ]);
    
    // 檢查過期任務
    await store.checkExpiredTasks();
    const updatedTasks = await store.getAllTasks();
    
    setState({
      currentUser,
      users,
      tasks: updatedTasks,
      products,
      treasures,
      treasureReviews,
      transactions,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      await store.initializeDemoData();
      await refreshData();
    };
    init();
  }, [refreshData]);

  // 用戶操作
  const switchUser = async (userId: string) => {
    const user = await store.getUserById(userId);
    if (user) {
      await store.setCurrentUser(user);
      await refreshData();
    }
  };

  const updateCurrentUser = async (updates: Partial<User>) => {
    if (!state.currentUser) return;
    await store.updateUser(state.currentUser.id, updates);
    await refreshData();
  };

  const updateUserAvatar = async (avatarUri: string) => {
    if (!state.currentUser) return;
    await store.updateUserAvatar(state.currentUser.id, avatarUri);
    await refreshData();
  };

  const updateUserFrame = async (frameId: string) => {
    if (!state.currentUser) return;
    await store.updateUserFrame(state.currentUser.id, frameId);
    await refreshData();
  };

  const createUser = async (name: string, role: 'admin' | 'staff') => {
    const user = await store.createUser(name, role);
    await refreshData();
    return user;
  };

  const deleteUser = async (userId: string) => {
    await store.deleteUser(userId);
    await refreshData();
  };

  const changeUserRole = async (userId: string, role: 'admin' | 'staff') => {
    await store.changeUserRole(userId, role);
    await refreshData();
  };

  const adjustUserCoins = async (userId: string, amount: number, reason: string) => {
    await store.adjustUserCoins(userId, amount, reason);
    await refreshData();
  };

  // 任務操作
  const createTask = async (title: string, description: string, type: BountyType, rank: TaskRank, reward: number) => {
    if (!state.currentUser) throw new Error('未登入');
    const task = await store.createTask(title, description, type, rank, reward, state.currentUser.id, state.currentUser.name);
    await refreshData();
    return task;
  };

  const applyForTask = async (taskId: string) => {
    if (!state.currentUser) return;
    await store.applyForTask(taskId, state.currentUser.id, state.currentUser.name, state.currentUser.avatarUri);
    await refreshData();
  };

  const assignTask = async (taskId: string, assigneeId: string) => {
    await store.assignTaskToApplicant(taskId, assigneeId);
    await refreshData();
  };

  const acceptTask = async (taskId: string) => {
    if (!state.currentUser) return;
    await store.acceptTask(taskId, state.currentUser.id, state.currentUser.name);
    await refreshData();
  };

  const submitProof = async (taskId: string, proofUri: string) => {
    await store.submitTaskProof(taskId, proofUri);
    await refreshData();
  };

  const completeTask = async (taskId: string) => {
    await store.completeTask(taskId);
    await refreshData();
  };

  const rateTask = async (taskId: string, toUserId: string, rating: number, comment?: string) => {
    if (!state.currentUser) return;
    await store.rateTask(taskId, state.currentUser.id, toUserId, rating, comment);
    await refreshData();
  };

  // 商品操作
  const createProduct = async (name: string, description: string, category: ProductCategory, price: number, stock: number, minRank?: AdventurerRank, imageUri?: string) => {
    const product = await store.createProduct(name, description, category, price, stock, minRank, imageUri);
    await refreshData();
    return product;
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    await store.updateProduct(productId, updates);
    await refreshData();
  };

  const deleteProduct = async (productId: string) => {
    await store.deleteProduct(productId);
    await refreshData();
  };

  const redeemProduct = async (productId: string) => {
    if (!state.currentUser) return { success: false, message: '未登入' };
    const result = await store.redeemProduct(state.currentUser.id, state.currentUser.name, productId);
    await refreshData();
    return result;
  };

  // 寶物操作
  const requestTreasureUse = async (treasureId: string) => {
    if (!state.currentUser) return;
    await store.requestTreasureUse(treasureId, state.currentUser.id, state.currentUser.name);
    await refreshData();
  };

  const reviewTreasureUse = async (requestId: string, approved: boolean) => {
    if (!state.currentUser) return { success: false, message: '未登入' };
    const result = await store.reviewTreasureUse(requestId, approved, state.currentUser.id);
    await refreshData();
    return result;
  };

  // 津貼操作
  const distributeAllowance = async (amount?: number) => {
    if (!state.currentUser) return { success: false, message: '未登入' };
    const result = await store.distributeAllowance(state.currentUser.id, amount);
    await refreshData();
    return result;
  };

  const value: AppContextType = {
    ...state,
    switchUser,
    updateCurrentUser,
    updateUserAvatar,
    updateUserFrame,
    createUser,
    deleteUser,
    changeUserRole,
    adjustUserCoins,
    createTask,
    applyForTask,
    assignTask,
    acceptTask,
    submitProof,
    completeTask,
    rateTask,
    createProduct,
    updateProduct,
    deleteProduct,
    redeemProduct,
    requestTreasureUse,
    reviewTreasureUse,
    distributeAllowance,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
