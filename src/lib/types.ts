// PureSki 冒險者公會 - 資料類型定義

// 用戶角色
export type UserRole = 'admin' | 'staff';

// 任務難度等級
export type TaskRank = 'S' | 'B' | 'F';

// 任務類型
export type BountyType = 'guild' | 'solo';

// 任務狀態
export type TaskStatus = 'open' | 'accepting' | 'in_progress' | 'pending_verification' | 'completed' | 'cancelled' | 'expired';

// 冒險者等級
export type AdventurerRank = 'bronze' | 'silver' | 'gold';

// 領班等級
export type QuestMasterRank = 'apprentice' | 'senior' | 'legendary';

// 用戶資料
export interface User {
  id: string;
  name: string;
  avatar?: string;
  avatarUri?: string;
  avatarFrame?: string;
  unlockedFrames: string[];
  role: UserRole;
  pureCoins: number;
  adventurerExp: number;
  adventurerRank: AdventurerRank;
  questMasterCompletions: number;
  questMasterRank: QuestMasterRank;
  badges: Badge[];
  reputationScore: number;
  totalRatings: number;
  createdAt: string;
}

// 成就獎章
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

// 任務報名者
export interface TaskApplicant {
  userId: string;
  userName: string;
  userAvatar?: string;
  appliedAt: string;
}

// 任務評價
export interface TaskRating {
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// 任務
export interface Task {
  id: string;
  title: string;
  description: string;
  type: BountyType;
  rank: TaskRank;
  reward: number;
  exp: number;
  status: TaskStatus;
  creatorId: string;
  creatorName: string;
  assigneeId?: string;
  assigneeName?: string;
  applicants: TaskApplicant[];
  proofImageUri?: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  completedAt?: string;
  ratings: TaskRating[];
}

// 商品類別
export type ProductCategory = 'physical' | 'virtual';

// 商品
export interface Product {
  id: string;
  name: string;
  description: string;
  imageUri?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  minRank?: AdventurerRank;
  createdAt: string;
}

// 兌換紀錄
export interface Redemption {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  price: number;
  redeemedAt: string;
}

// 寶物倉庫物品類型
export type TreasureType = 'product' | 'task_proof';

// 寶物使用狀態
export type TreasureUseStatus = 'unused' | 'pending' | 'used';

// 寶物倉庫物品
export interface TreasureItem {
  id: string;
  userId: string;
  type: TreasureType;
  name: string;
  description: string;
  imageUri?: string;
  category?: ProductCategory;
  taskRank?: TaskRank;
  taskExp?: number;
  taskReward?: number;
  acquiredAt: string;
  relatedId: string;
  useStatus: TreasureUseStatus;
  useRequestedAt?: string;
  usedAt?: string;
}

// 寶物審查請求
export interface TreasureReviewRequest {
  id: string;
  treasureId: string;
  treasureName: string;
  userId: string;
  userName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
}

// 積分交易紀錄
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'task_reward' | 'task_publish' | 'redemption' | 'allowance' | 'admin_adjust';
  description: string;
  relatedId?: string;
  createdAt: string;
}

// 津貼發放紀錄
export interface AllowanceRecord {
  id: string;
  month: number;
  year: number;
  amount: number;
  recipientCount: number;
  distributedAt: string;
  distributedBy: string;
}

// 任務難度配置
export const TASK_RANK_CONFIG: Record<TaskRank, { name: string; minReward: number; maxReward: number; exp: number; color: string }> = {
  S: { name: 'Legendary', minReward: 200, maxReward: 999, exp: 150, color: '#FF4757' },
  B: { name: 'Standard', minReward: 51, maxReward: 200, exp: 40, color: '#3742FA' },
  F: { name: 'Easy', minReward: 10, maxReward: 50, exp: 10, color: '#1E90FF' },
};

// 冒險者等級配置
export const ADVENTURER_RANK_CONFIG: Record<AdventurerRank, { name: string; expRequired: number; color: string }> = {
  bronze: { name: '銅牌冒險者', expRequired: 0, color: '#CD7F32' },
  silver: { name: '銀牌冒險者', expRequired: 600, color: '#C0C0C0' },
  gold: { name: '專業冒險者', expRequired: 2000, color: '#FFD700' },
};

// 領班等級配置
export const QUEST_MASTER_RANK_CONFIG: Record<QuestMasterRank, { name: string; completionsRequired: number; color: string }> = {
  apprentice: { name: '見習領班', completionsRequired: 0, color: '#CD7F32' },
  senior: { name: '資深領班', completionsRequired: 20, color: '#C0C0C0' },
  legendary: { name: '傳奇委託人', completionsRequired: 60, color: '#FFD700' },
};

// 雪季月份（可發放津貼）
export const SNOW_SEASON_MONTHS = [12, 1, 2, 3];

// 每月津貼金額
export const MONTHLY_ALLOWANCE = 100;

// 年度結算月份
export const ANNUAL_RESET_MONTH = 6;
export const ANNUAL_RESET_DAY = 30;

// 任務到期天數
export const TASK_EXPIRY_DAYS = 14;

// 計算冒險者等級
export function calculateAdventurerRank(exp: number): AdventurerRank {
  if (exp >= ADVENTURER_RANK_CONFIG.gold.expRequired) return 'gold';
  if (exp >= ADVENTURER_RANK_CONFIG.silver.expRequired) return 'silver';
  return 'bronze';
}

// 計算領班等級
export function calculateQuestMasterRank(completions: number): QuestMasterRank {
  if (completions >= QUEST_MASTER_RANK_CONFIG.legendary.completionsRequired) return 'legendary';
  if (completions >= QUEST_MASTER_RANK_CONFIG.senior.completionsRequired) return 'senior';
  return 'apprentice';
}

// 檢查是否為雪季
export function isSnowSeason(month: number): boolean {
  return SNOW_SEASON_MONTHS.includes(month);
}

// 檢查是否可兌換商品
export function canRedeemProduct(userRank: AdventurerRank, productMinRank?: AdventurerRank): boolean {
  if (!productMinRank) return true;
  const rankOrder: AdventurerRank[] = ['bronze', 'silver', 'gold'];
  return rankOrder.indexOf(userRank) >= rankOrder.indexOf(productMinRank);
}

// 頭像邊框
export interface AvatarFrame {
  id: string;
  name: string;
  borderColor: string;
  borderWidth: number;
  glowColor?: string;
  decoration?: string;
  unlockCondition: string;
  unlockType: 'default' | 'adventurer_rank' | 'quest_master_rank' | 'achievement' | 'special';
  unlockValue?: string;
}

// 頭像邊框配置
export const AVATAR_FRAMES: AvatarFrame[] = [
  { id: 'default', name: '基礎邊框', borderColor: '#FFD700', borderWidth: 3, unlockCondition: '預設解鎖', unlockType: 'default' },
  { id: 'bronze_adventurer', name: '銅牌之證', borderColor: '#CD7F32', borderWidth: 3, decoration: '🥉', unlockCondition: '達到銅牌冒險者', unlockType: 'adventurer_rank', unlockValue: 'bronze' },
  { id: 'silver_adventurer', name: '銀牌之證', borderColor: '#C0C0C0', borderWidth: 4, glowColor: '#C0C0C0', decoration: '🥈', unlockCondition: '達到銀牌冒險者', unlockType: 'adventurer_rank', unlockValue: 'silver' },
  { id: 'gold_adventurer', name: '金牌之證', borderColor: '#FFD700', borderWidth: 4, glowColor: '#FFD700', decoration: '🥇', unlockCondition: '達到專業冒險者', unlockType: 'adventurer_rank', unlockValue: 'gold' },
  { id: 'apprentice_master', name: '見習領班', borderColor: '#8B4513', borderWidth: 3, decoration: '📋', unlockCondition: '成為見習領班', unlockType: 'quest_master_rank', unlockValue: 'apprentice' },
  { id: 'senior_master', name: '資深領班', borderColor: '#4169E1', borderWidth: 4, glowColor: '#4169E1', decoration: '📜', unlockCondition: '成為資深領班', unlockType: 'quest_master_rank', unlockValue: 'senior' },
  { id: 'legendary_master', name: '傳奇委託人', borderColor: '#9400D3', borderWidth: 5, glowColor: '#9400D3', decoration: '👑', unlockCondition: '成為傳奇委託人', unlockType: 'quest_master_rank', unlockValue: 'legendary' },
  { id: 'first_task', name: '初心者', borderColor: '#2ED573', borderWidth: 3, decoration: '🌟', unlockCondition: '完成第一個任務', unlockType: 'achievement', unlockValue: 'first_task' },
  { id: 's_rank_hunter', name: 'S級獵人', borderColor: '#FF4757', borderWidth: 5, glowColor: '#FF4757', decoration: '⚔️', unlockCondition: '完成第一個 S 級任務', unlockType: 'achievement', unlockValue: 's_rank_complete' },
  { id: 'snow_warrior', name: '雪地戰士', borderColor: '#00CED1', borderWidth: 4, glowColor: '#00CED1', decoration: '❄️', unlockCondition: '在雪季完成 10 個任務', unlockType: 'achievement', unlockValue: 'snow_warrior' },
  { id: 'pixel_master', name: '像素大師', borderColor: '#FF69B4', borderWidth: 4, glowColor: '#FF69B4', decoration: '🎮', unlockCondition: '累計獲得 1000 EXP', unlockType: 'achievement', unlockValue: 'exp_1000' },
  { id: 'guild_founder', name: '公會創始者', borderColor: '#FFD700', borderWidth: 5, glowColor: '#FFD700', decoration: '🏰', unlockCondition: '特殊紀念邊框', unlockType: 'special', unlockValue: 'founder' },
];

// 獲取用戶已解鎖的邊框
export function getUnlockedFrames(user: User): string[] {
  const unlocked: string[] = ['default'];
  
  const adventurerRankOrder: AdventurerRank[] = ['bronze', 'silver', 'gold'];
  const userRankIndex = adventurerRankOrder.indexOf(user.adventurerRank);
  AVATAR_FRAMES.filter(f => f.unlockType === 'adventurer_rank').forEach(frame => {
    const frameRankIndex = adventurerRankOrder.indexOf(frame.unlockValue as AdventurerRank);
    if (frameRankIndex <= userRankIndex) unlocked.push(frame.id);
  });
  
  const questMasterRankOrder: QuestMasterRank[] = ['apprentice', 'senior', 'legendary'];
  const userQMRankIndex = questMasterRankOrder.indexOf(user.questMasterRank);
  AVATAR_FRAMES.filter(f => f.unlockType === 'quest_master_rank').forEach(frame => {
    const frameQMRankIndex = questMasterRankOrder.indexOf(frame.unlockValue as QuestMasterRank);
    if (frameQMRankIndex <= userQMRankIndex) unlocked.push(frame.id);
  });
  
  user.badges.forEach(badge => {
    const matchingFrame = AVATAR_FRAMES.find(f => f.unlockType === 'achievement' && f.unlockValue === badge.id);
    if (matchingFrame) unlocked.push(matchingFrame.id);
  });
  
  user.unlockedFrames.forEach(frameId => {
    if (!unlocked.includes(frameId)) unlocked.push(frameId);
  });
  
  return unlocked;
}
