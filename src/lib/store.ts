// PureSki 冒險者公會 - 資料儲存管理器 (PWA 版本)
import localforage from 'localforage';
import type {
  User,
  Task,
  Product,
  Redemption,
  Transaction,
  AllowanceRecord,
  TreasureItem,
  TreasureType,
  TreasureReviewRequest,
  TaskApplicant,
  TaskRating,
  UserRole,
  TaskRank,
  BountyType,
  ProductCategory,
  AdventurerRank,
} from './types';
import {
  calculateAdventurerRank,
  calculateQuestMasterRank,
  TASK_RANK_CONFIG,
  TASK_EXPIRY_DAYS,
} from './types';

// 初始化 localforage
localforage.config({
  name: 'PureSki冒險者公會',
  storeName: 'guild_data',
});

// Storage Keys
const KEYS = {
  CURRENT_USER: 'puresky_current_user',
  USERS: 'puresky_users',
  TASKS: 'puresky_tasks',
  PRODUCTS: 'puresky_products',
  REDEMPTIONS: 'puresky_redemptions',
  TRANSACTIONS: 'puresky_transactions',
  ALLOWANCE_RECORDS: 'puresky_allowance_records',
  TREASURES: 'puresky_treasures',
  TREASURE_REVIEWS: 'puresky_treasure_reviews',
};

// 生成唯一 ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 計算到期日
function calculateExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + TASK_EXPIRY_DAYS);
  return date.toISOString();
}

// ============ 用戶管理 ============

export async function getCurrentUser(): Promise<User | null> {
  return await localforage.getItem<User>(KEYS.CURRENT_USER);
}

export async function setCurrentUser(user: User | null): Promise<void> {
  if (user) {
    await localforage.setItem(KEYS.CURRENT_USER, user);
  } else {
    await localforage.removeItem(KEYS.CURRENT_USER);
  }
}

export async function getAllUsers(): Promise<User[]> {
  return (await localforage.getItem<User[]>(KEYS.USERS)) || [];
}

export async function saveUsers(users: User[]): Promise<void> {
  await localforage.setItem(KEYS.USERS, users);
}

export async function createUser(name: string, role: UserRole): Promise<User> {
  const users = await getAllUsers();
  const newUser: User = {
    id: generateId(),
    name,
    role,
    pureCoins: 0,
    adventurerExp: 0,
    adventurerRank: 'bronze',
    questMasterCompletions: 0,
    questMasterRank: 'apprentice',
    badges: [],
    unlockedFrames: ['default'],
    reputationScore: 0,
    totalRatings: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const users = await getAllUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...updates };
  users[index].adventurerRank = calculateAdventurerRank(users[index].adventurerExp);
  users[index].questMasterRank = calculateQuestMasterRank(users[index].questMasterCompletions);
  users[index] = checkAndUnlockFrames(users[index]);
  
  await saveUsers(users);
  
  const currentUser = await getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    await setCurrentUser(users[index]);
  }
  
  return users[index];
}

export async function getUserById(userId: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find(u => u.id === userId) || null;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const users = await getAllUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  await saveUsers(filtered);
  return true;
}

export async function updateUserAvatar(userId: string, avatarUri: string): Promise<User | null> {
  return updateUser(userId, { avatarUri });
}

export async function updateUserFrame(userId: string, frameId: string): Promise<User | null> {
  const user = await getUserById(userId);
  if (!user || !user.unlockedFrames.includes(frameId)) return null;
  return updateUser(userId, { avatarFrame: frameId });
}

// 檢查並解鎖邊框
function checkAndUnlockFrames(user: User): User {
  const newFrames = [...user.unlockedFrames];
  
  // 等級邊框
  if (user.adventurerRank === 'bronze' && !newFrames.includes('bronze_adventurer')) {
    newFrames.push('bronze_adventurer');
  }
  if (user.adventurerRank === 'silver' && !newFrames.includes('silver_adventurer')) {
    newFrames.push('silver_adventurer');
  }
  if (user.adventurerRank === 'gold' && !newFrames.includes('gold_adventurer')) {
    newFrames.push('gold_adventurer');
  }
  
  // 領班邊框
  if (user.questMasterRank === 'apprentice' && !newFrames.includes('apprentice_master')) {
    newFrames.push('apprentice_master');
  }
  if (user.questMasterRank === 'senior' && !newFrames.includes('senior_master')) {
    newFrames.push('senior_master');
  }
  if (user.questMasterRank === 'legendary' && !newFrames.includes('legendary_master')) {
    newFrames.push('legendary_master');
  }
  
  // 信譽邊框
  if (user.totalRatings > 0 && user.reputationScore / user.totalRatings >= 4.5 && !newFrames.includes('reputation_star')) {
    newFrames.push('reputation_star');
  }
  
  return { ...user, unlockedFrames: newFrames };
}

export async function unlockFrame(userId: string, frameId: string): Promise<User | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  if (user.unlockedFrames.includes(frameId)) return user;
  
  return updateUser(userId, {
    unlockedFrames: [...user.unlockedFrames, frameId],
  });
}

// ============ 任務管理 ============

export async function getAllTasks(): Promise<Task[]> {
  return (await localforage.getItem<Task[]>(KEYS.TASKS)) || [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await localforage.setItem(KEYS.TASKS, tasks);
}

export async function createTask(
  title: string,
  description: string,
  type: BountyType,
  rank: TaskRank,
  reward: number,
  creatorId: string,
  creatorName: string
): Promise<Task> {
  const tasks = await getAllTasks();
  const newTask: Task = {
    id: generateId(),
    title,
    description,
    type,
    rank,
    reward,
    exp: TASK_RANK_CONFIG[rank].exp,
    status: 'open',
    creatorId,
    creatorName,
    applicants: [],
    ratings: [],
    createdAt: new Date().toISOString(),
    expiresAt: calculateExpiryDate(),
  };
  tasks.push(newTask);
  await saveTasks(tasks);
  return newTask;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
  const tasks = await getAllTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index === -1) return null;
  
  tasks[index] = { ...tasks[index], ...updates };
  await saveTasks(tasks);
  return tasks[index];
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const tasks = await getAllTasks();
  return tasks.find(t => t.id === taskId) || null;
}

export async function applyForTask(taskId: string, userId: string, userName: string, userAvatar?: string): Promise<Task | null> {
  const task = await getTaskById(taskId);
  if (!task || task.status !== 'open') return null;
  
  if (task.applicants.some(a => a.userId === userId)) return task;
  
  const newApplicant: TaskApplicant = {
    userId,
    userName,
    userAvatar,
    appliedAt: new Date().toISOString(),
  };
  
  return updateTask(taskId, {
    applicants: [...task.applicants, newApplicant],
    status: task.applicants.length === 0 ? 'accepting' : task.status,
  });
}

export async function assignTaskToApplicant(taskId: string, assigneeId: string): Promise<Task | null> {
  const task = await getTaskById(taskId);
  if (!task || (task.status !== 'open' && task.status !== 'accepting')) return null;
  
  const applicant = task.applicants.find(a => a.userId === assigneeId);
  if (!applicant) return null;
  
  return updateTask(taskId, {
    status: 'in_progress',
    assigneeId: applicant.userId,
    assigneeName: applicant.userName,
    acceptedAt: new Date().toISOString(),
  });
}

export async function acceptTask(taskId: string, userId: string, userName: string): Promise<Task | null> {
  return updateTask(taskId, {
    status: 'in_progress',
    assigneeId: userId,
    assigneeName: userName,
    acceptedAt: new Date().toISOString(),
  });
}

export async function submitTaskProof(taskId: string, proofImageUri: string): Promise<Task | null> {
  return updateTask(taskId, {
    status: 'pending_verification',
    proofImageUri,
  });
}

export async function completeTask(taskId: string): Promise<{ task: Task; assignee: User } | null> {
  const task = await getTaskById(taskId);
  if (!task || !task.assigneeId) return null;
  
  const updatedTask = await updateTask(taskId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
  
  if (!updatedTask) return null;
  
  const assignee = await getUserById(task.assigneeId);
  if (!assignee) return null;
  
  const updatedAssignee = await updateUser(task.assigneeId, {
    pureCoins: assignee.pureCoins + task.reward,
    adventurerExp: assignee.adventurerExp + task.exp,
  });
  
  if (!updatedAssignee) return null;
  
  if (task.rank === 'S' && !updatedAssignee.unlockedFrames.includes('s_rank_hunter')) {
    await unlockFrame(task.assigneeId, 's_rank_hunter');
  }
  
  const creator = await getUserById(task.creatorId);
  if (creator) {
    await updateUser(task.creatorId, {
      questMasterCompletions: creator.questMasterCompletions + 1,
    });
  }
  
  await createTransaction(task.assigneeId, task.reward, 'task_reward', `完成任務: ${task.title}`, task.id);
  
  await addTreasureItem(
    task.assigneeId,
    'task_proof',
    `任務證明: ${task.title}`,
    `完成 ${task.rank} 級任務，獲得 ${task.reward} PureCoin 與 ${task.exp} EXP`,
    task.id,
    { imageUri: task.proofImageUri, taskRank: task.rank }
  );
  
  return { task: updatedTask, assignee: updatedAssignee };
}

export async function rateTask(taskId: string, fromUserId: string, toUserId: string, rating: number, comment?: string): Promise<Task | null> {
  const task = await getTaskById(taskId);
  if (!task || task.status !== 'completed') return null;
  
  if (task.ratings.some(r => r.fromUserId === fromUserId && r.toUserId === toUserId)) return task;
  
  const newRating: TaskRating = {
    fromUserId,
    toUserId,
    rating: Math.min(5, Math.max(1, rating)),
    comment,
    createdAt: new Date().toISOString(),
  };
  
  const targetUser = await getUserById(toUserId);
  if (targetUser) {
    await updateUser(toUserId, {
      reputationScore: targetUser.reputationScore + rating,
      totalRatings: targetUser.totalRatings + 1,
    });
  }
  
  return updateTask(taskId, {
    ratings: [...task.ratings, newRating],
  });
}

export async function checkExpiredTasks(): Promise<Task[]> {
  const tasks = await getAllTasks();
  const now = new Date();
  const expiredTasks: Task[] = [];
  
  for (const task of tasks) {
    if ((task.status === 'open' || task.status === 'accepting') && new Date(task.expiresAt) < now) {
      await updateTask(task.id, { status: 'expired' });
      
      if (task.type === 'solo') {
        const creator = await getUserById(task.creatorId);
        if (creator) {
          await updateUser(task.creatorId, {
            pureCoins: creator.pureCoins + task.reward,
          });
          await createTransaction(task.creatorId, task.reward, 'admin_adjust', `任務過期退還: ${task.title}`, task.id);
        }
      }
      
      expiredTasks.push(task);
    }
  }
  
  return expiredTasks;
}

// ============ 商品管理 ============

export async function getAllProducts(): Promise<Product[]> {
  return (await localforage.getItem<Product[]>(KEYS.PRODUCTS)) || [];
}

export async function saveProducts(products: Product[]): Promise<void> {
  await localforage.setItem(KEYS.PRODUCTS, products);
}

export async function createProduct(
  name: string,
  description: string,
  category: ProductCategory,
  price: number,
  stock: number,
  minRank?: AdventurerRank,
  imageUri?: string
): Promise<Product> {
  const products = await getAllProducts();
  const newProduct: Product = {
    id: generateId(),
    name,
    description,
    category,
    price,
    stock,
    minRank,
    imageUri,
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  await saveProducts(products);
  return newProduct;
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
  const products = await getAllProducts();
  const index = products.findIndex(p => p.id === productId);
  if (index === -1) return null;
  
  products[index] = { ...products[index], ...updates };
  await saveProducts(products);
  return products[index];
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const products = await getAllProducts();
  const filtered = products.filter(p => p.id !== productId);
  if (filtered.length === products.length) return false;
  await saveProducts(filtered);
  return true;
}

// ============ 兌換管理 ============

export async function getAllRedemptions(): Promise<Redemption[]> {
  return (await localforage.getItem<Redemption[]>(KEYS.REDEMPTIONS)) || [];
}

export async function saveRedemptions(redemptions: Redemption[]): Promise<void> {
  await localforage.setItem(KEYS.REDEMPTIONS, redemptions);
}

export async function redeemProduct(userId: string, userName: string, productId: string): Promise<{ success: boolean; message: string; redemption?: Redemption }> {
  const user = await getUserById(userId);
  if (!user) return { success: false, message: '用戶不存在' };
  
  const products = await getAllProducts();
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) return { success: false, message: '商品不存在' };
  
  const product = products[productIndex];
  
  if (product.stock <= 0) return { success: false, message: '商品已售罄' };
  if (user.pureCoins < product.price) return { success: false, message: '積分不足' };
  
  if (product.minRank) {
    const rankOrder: AdventurerRank[] = ['bronze', 'silver', 'gold'];
    if (rankOrder.indexOf(user.adventurerRank) < rankOrder.indexOf(product.minRank)) {
      return { success: false, message: `需要 ${product.minRank === 'silver' ? '銀牌' : '專業'} 冒險者以上才能兌換` };
    }
  }
  
  await updateUser(userId, { pureCoins: user.pureCoins - product.price });
  
  products[productIndex].stock -= 1;
  await saveProducts(products);
  
  const redemptions = await getAllRedemptions();
  const newRedemption: Redemption = {
    id: generateId(),
    userId,
    userName,
    productId,
    productName: product.name,
    price: product.price,
    redeemedAt: new Date().toISOString(),
  };
  redemptions.push(newRedemption);
  await saveRedemptions(redemptions);
  
  await createTransaction(userId, -product.price, 'redemption', `兌換商品: ${product.name}`, productId);
  
  await addTreasureItem(
    userId,
    'product',
    product.name,
    product.description,
    productId,
    { imageUri: product.imageUri, category: product.category }
  );
  
  return { success: true, message: '兌換成功！商品已存入寶物倉庫', redemption: newRedemption };
}

// ============ 交易紀錄 ============

export async function getAllTransactions(): Promise<Transaction[]> {
  return (await localforage.getItem<Transaction[]>(KEYS.TRANSACTIONS)) || [];
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await localforage.setItem(KEYS.TRANSACTIONS, transactions);
}

export async function createTransaction(
  userId: string,
  amount: number,
  type: Transaction['type'],
  description: string,
  relatedId?: string
): Promise<Transaction> {
  const transactions = await getAllTransactions();
  const newTransaction: Transaction = {
    id: generateId(),
    userId,
    amount,
    type,
    description,
    relatedId,
    createdAt: new Date().toISOString(),
  };
  transactions.push(newTransaction);
  await saveTransactions(transactions);
  return newTransaction;
}

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const transactions = await getAllTransactions();
  return transactions.filter(t => t.userId === userId);
}

// ============ 津貼管理 ============

export async function getAllowanceRecords(): Promise<AllowanceRecord[]> {
  return (await localforage.getItem<AllowanceRecord[]>(KEYS.ALLOWANCE_RECORDS)) || [];
}

export async function saveAllowanceRecords(records: AllowanceRecord[]): Promise<void> {
  await localforage.setItem(KEYS.ALLOWANCE_RECORDS, records);
}

export async function distributeAllowance(adminId: string, amount: number = 100): Promise<{ success: boolean; message: string; record?: AllowanceRecord }> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  const snowSeasonMonths = [12, 1, 2, 3];
  if (!snowSeasonMonths.includes(month)) {
    return { success: false, message: '只有在雪季（12、1、2、3月）才能發放津貼' };
  }
  
  const records = await getAllowanceRecords();
  const alreadyDistributed = records.some(r => r.month === month && r.year === year);
  if (alreadyDistributed) {
    return { success: false, message: '本月津貼已發放' };
  }
  
  const users = await getAllUsers();
  for (const user of users) {
    await updateUser(user.id, { pureCoins: user.pureCoins + amount });
    await createTransaction(user.id, amount, 'allowance', `${month}月冒險津貼`);
  }
  
  const newRecord: AllowanceRecord = {
    id: generateId(),
    month,
    year,
    amount,
    recipientCount: users.length,
    distributedAt: now.toISOString(),
    distributedBy: adminId,
  };
  records.push(newRecord);
  await saveAllowanceRecords(records);
  
  return { success: true, message: `已向 ${users.length} 位成員發放 ${amount} PureCoin`, record: newRecord };
}

// ============ 管理員功能 ============

export async function adjustUserCoins(userId: string, amount: number, reason: string): Promise<User | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  
  const newBalance = Math.max(0, user.pureCoins + amount);
  await updateUser(userId, { pureCoins: newBalance });
  await createTransaction(userId, amount, 'admin_adjust', reason);
  
  return getUserById(userId);
}

export async function changeUserRole(userId: string, newRole: UserRole): Promise<User | null> {
  return updateUser(userId, { role: newRole });
}

// ============ 寶物倉庫管理 ============

export async function getAllTreasures(): Promise<TreasureItem[]> {
  return (await localforage.getItem<TreasureItem[]>(KEYS.TREASURES)) || [];
}

export async function saveTreasures(treasures: TreasureItem[]): Promise<void> {
  await localforage.setItem(KEYS.TREASURES, treasures);
}

export async function getUserTreasures(userId: string): Promise<TreasureItem[]> {
  const treasures = await getAllTreasures();
  return treasures.filter(t => t.id.startsWith(userId));
}

export async function addTreasureItem(
  userId: string,
  type: TreasureType,
  name: string,
  description: string,
  relatedId: string,
  options?: {
    imageUri?: string;
    category?: ProductCategory;
    taskRank?: TaskRank;
  }
): Promise<TreasureItem> {
  const treasures = await getAllTreasures();
  const newTreasure: TreasureItem = {
    id: `${userId}_${generateId()}`,
    type,
    name,
    description,
    imageUri: options?.imageUri,
    category: options?.category,
    taskRank: options?.taskRank,
    userId,
    acquiredAt: new Date().toISOString(),
    relatedId,
    useStatus: 'unused',
  };
  treasures.push(newTreasure);
  await saveTreasures(treasures);
  return newTreasure;
}

export async function requestTreasureUse(treasureId: string, userId: string, userName: string): Promise<TreasureReviewRequest | null> {
  const treasures = await getAllTreasures();
  const index = treasures.findIndex(t => t.id === treasureId);
  if (index === -1) return null;
  
  const treasure = treasures[index];
  if (treasure.category !== 'virtual' || treasure.useStatus !== 'unused') return null;
  
  treasures[index].useStatus = 'pending';
  treasures[index].useRequestedAt = new Date().toISOString();
  await saveTreasures(treasures);
  
  const reviews = await getAllTreasureReviews();
  const newRequest: TreasureReviewRequest = {
    id: generateId(),
    treasureId,
    treasureName: treasure.name,
    userId,
    userName,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };
  reviews.push(newRequest);
  await saveTreasureReviews(reviews);
  
  return newRequest;
}

// ============ 寶物審查管理 ============

export async function getAllTreasureReviews(): Promise<TreasureReviewRequest[]> {
  return (await localforage.getItem<TreasureReviewRequest[]>(KEYS.TREASURE_REVIEWS)) || [];
}

export async function saveTreasureReviews(reviews: TreasureReviewRequest[]): Promise<void> {
  await localforage.setItem(KEYS.TREASURE_REVIEWS, reviews);
}

export async function getPendingTreasureReviews(): Promise<TreasureReviewRequest[]> {
  const reviews = await getAllTreasureReviews();
  return reviews.filter(r => r.status === 'pending');
}

export async function reviewTreasureUse(
  requestId: string,
  approved: boolean,
  reviewerId: string
): Promise<{ success: boolean; message: string }> {
  const reviews = await getAllTreasureReviews();
  const index = reviews.findIndex(r => r.id === requestId);
  if (index === -1) return { success: false, message: '審查請求不存在' };
  
  const request = reviews[index];
  if (request.status !== 'pending') return { success: false, message: '此請求已處理' };
  
  reviews[index].status = approved ? 'approved' : 'rejected';
  reviews[index].reviewedAt = new Date().toISOString();
  reviews[index].reviewedBy = reviewerId;
  await saveTreasureReviews(reviews);
  
  const treasures = await getAllTreasures();
  const treasureIndex = treasures.findIndex(t => t.id === request.treasureId);
  if (treasureIndex !== -1) {
    if (approved) {
      treasures[treasureIndex].useStatus = 'used';
      treasures[treasureIndex].usedAt = new Date().toISOString();
    } else {
      treasures[treasureIndex].useStatus = 'unused';
      treasures[treasureIndex].useRequestedAt = undefined;
    }
    await saveTreasures(treasures);
  }
  
  return {
    success: true,
    message: approved ? '已確認使用，寶物已標記為已使用' : '已拒絕申請，寶物狀態已重置',
  };
}

// ============ 年度結算 ============

export async function performAnnualReset(): Promise<void> {
  const users = await getAllUsers();
  for (const user of users) {
    await updateUser(user.id, { pureCoins: 0 });
    await createTransaction(user.id, -user.pureCoins, 'admin_adjust', '年度結算清空');
  }
}

// ============ 初始化示範資料 ============

export async function initializeDemoData(): Promise<void> {
  const users = await getAllUsers();
  if (users.length > 0) return;
  
  // 創建示範用戶
  const admin = await createUser('校長', 'admin');
  const staff1 = await createUser('教練小明', 'staff');
  const staff2 = await createUser('教練小華', 'staff');
  
  // 給予初始積分
  await updateUser(admin.id, { pureCoins: 500 });
  await updateUser(staff1.id, { pureCoins: 200, adventurerExp: 100 });
  await updateUser(staff2.id, { pureCoins: 150, adventurerExp: 50 });
  
  // 創建示範任務
  await createTask('行銷影片拍攝', '需要拍攝一支 30 秒的滑雪教學宣傳影片', 'guild', 'S', 300, admin.id, admin.name);
  await createTask('倉庫整理', '整理雪具倉庫，分類並清點庫存', 'guild', 'B', 100, admin.id, admin.name);
  await createTask('代買早餐', '幫忙買山下的早餐，順路即可', 'solo', 'F', 20, staff1.id, staff1.name);
  await createTask('打蠟協助', '幫忙給雪板打蠟，約需 30 分鐘', 'solo', 'F', 30, staff2.id, staff2.name);
  
  // 創建示範商品
  await createProduct('PureSki 限定 T-Shirt', '公會限定款 T-Shirt，黑色', 'physical', 200, 10);
  await createProduct('雪板打蠟券', '免費雪板打蠟服務一次', 'virtual', 50, 20);
  await createProduct('優先選班權', '下季優先選擇教學班次', 'virtual', 300, 5, 'silver');
  await createProduct('VIP 休息室使用券', '使用 VIP 休息室一天', 'virtual', 150, 10);
  
  // 設定當前用戶為 admin
  const updatedAdmin = await getUserById(admin.id);
  if (updatedAdmin) {
    await setCurrentUser(updatedAdmin);
  }
}

// ============ 清除所有資料 ============

export async function clearAllData(): Promise<void> {
  await localforage.clear();
}
