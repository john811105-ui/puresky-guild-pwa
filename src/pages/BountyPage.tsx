import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import type { Task, TaskRank, BountyType } from '../lib/types';
import { TASK_RANK_CONFIG } from '../lib/types';

type TabType = 'guild' | 'solo';

export default function BountyPage() {
  const { currentUser, tasks, createTask, applyForTask, assignTask, completeTask, rateTask } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('guild');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{ taskId: string; userId: string; userName: string } | null>(null);
  const [rating, setRating] = useState(5);

  // 新任務表單
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    rank: 'F' as TaskRank,
    reward: 20,
  });

  if (!currentUser) return null;

  const filteredTasks = tasks.filter(t => t.type === activeTab);
  const isAdmin = currentUser.role === 'admin';

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      open: '招募中',
      accepting: '報名中',
      in_progress: '進行中',
      pending_verification: '待確認',
      completed: '已完成',
      expired: '已過期',
      cancelled: '已取消',
    };
    return map[status] || status;
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      open: 'open',
      accepting: 'open',
      in_progress: 'in-progress',
      pending_verification: 'pending',
      completed: 'completed',
      expired: 'expired',
    };
    return map[status] || '';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3天內
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    const type: BountyType = isAdmin ? 'guild' : 'solo';
    await createTask(newTask.title, newTask.description, type, newTask.rank, newTask.reward);
    setShowCreateModal(false);
    setNewTask({ title: '', description: '', rank: 'F', reward: 20 });
  };

  const handleApply = async (taskId: string) => {
    await applyForTask(taskId);
    setSelectedTask(null);
  };

  const handleAssign = async (taskId: string, assigneeId: string) => {
    await assignTask(taskId, assigneeId);
    setSelectedTask(null);
  };

  const handleComplete = async (taskId: string) => {
    await completeTask(taskId);
    setSelectedTask(null);
  };

  const handleRate = async () => {
    if (!ratingTarget) return;
    await rateTask(ratingTarget.taskId, ratingTarget.userId, rating);
    setShowRatingModal(false);
    setRatingTarget(null);
    setRating(5);
  };

  const canRate = (task: Task, targetUserId: string) => {
    return task.status === 'completed' && 
           !task.ratings.some(r => r.fromUserId === currentUser.id && r.toUserId === targetUserId);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 標題 */}
      <div style={{ padding: '20px', paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
        <h1 className="pixel-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
          📋 公會佈告欄 📋
        </h1>

        {/* Tab 切換 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('guild')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'guild' ? 'linear-gradient(135deg, #1E3A5F 0%, #0D1117 100%)' : 'var(--color-bg-surface)',
              border: `2px solid ${activeTab === 'guild' ? 'var(--color-guild-primary)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              color: activeTab === 'guild' ? 'var(--color-guild-primary)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            👑 公會懸賞
          </button>
          <button
            onClick={() => setActiveTab('solo')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'solo' ? 'linear-gradient(135deg, #1A4D3E 0%, #0D1117 100%)' : 'var(--color-bg-surface)',
              border: `2px solid ${activeTab === 'solo' ? 'var(--color-solo-primary)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              color: activeTab === 'solo' ? 'var(--color-solo-primary)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            🤝 個人委託
          </button>
        </div>

        {/* 發布按鈕 */}
        {((activeTab === 'guild' && isAdmin) || activeTab === 'solo') && (
          <button 
            className="pixel-btn" 
            onClick={() => setShowCreateModal(true)}
            style={{ width: '100%', marginBottom: '16px' }}
          >
            ➕ 發布{activeTab === 'guild' ? '公會懸賞' : '個人委託'}
          </button>
        )}
      </div>

      {/* 任務列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>目前沒有{activeTab === 'guild' ? '公會懸賞' : '個人委託'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className={`pixel-card ${task.type}`}
                onClick={() => setSelectedTask(task)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`rank-badge rank-${task.rank.toLowerCase()}`}>{task.rank}</span>
                    <span className={`status-badge ${getStatusClass(task.status)}`}>{getStatusText(task.status)}</span>
                  </div>
                  <span style={{ 
                    fontFamily: 'var(--font-pixel)', 
                    fontSize: '12px', 
                    color: 'var(--color-primary)' 
                  }}>
                    💰 {task.reward}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{task.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  {task.description.length > 50 ? task.description.slice(0, 50) + '...' : task.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <span>發布者: {task.creatorName}</span>
                  <span style={{ color: isExpiringSoon(task.expiresAt) ? 'var(--color-warning)' : 'inherit' }}>
                    {isExpiringSoon(task.expiresAt) ? '⚠️ ' : ''}截止: {formatDate(task.expiresAt)}
                  </span>
                </div>
                {task.applicants.length > 0 && task.status === 'accepting' && (
                  <p style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '8px' }}>
                    📝 {task.applicants.length} 人報名
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 任務詳情 Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span className={`rank-badge rank-${selectedTask.rank.toLowerCase()}`}>{selectedTask.rank}</span>
              <span className={`status-badge ${getStatusClass(selectedTask.status)}`}>{getStatusText(selectedTask.status)}</span>
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>{selectedTask.title}</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{selectedTask.description}</p>
            
            <div style={{ background: 'var(--color-bg-surface)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>💰 獎勵</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{selectedTask.reward} PureCoin</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>⭐ 經驗值</span>
                <span style={{ color: 'var(--color-secondary)' }}>{selectedTask.exp} EXP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📅 截止日期</span>
                <span>{formatDate(selectedTask.expiresAt)}</span>
              </div>
            </div>

            {/* 報名者列表（發布者可見） */}
            {selectedTask.creatorId === currentUser.id && selectedTask.applicants.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>📝 報名者 ({selectedTask.applicants.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedTask.applicants.map(applicant => (
                    <div key={applicant.userId} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'var(--color-bg-surface)',
                      padding: '8px 12px',
                      borderRadius: '8px'
                    }}>
                      <span>{applicant.userName}</span>
                      {(selectedTask.status === 'open' || selectedTask.status === 'accepting') && (
                        <button
                          className="pixel-btn"
                          onClick={() => handleAssign(selectedTask.id, applicant.userId)}
                          style={{ padding: '6px 12px', fontSize: '8px' }}
                        >
                          選擇
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按鈕 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 報名按鈕 */}
              {selectedTask.status === 'open' && 
               selectedTask.creatorId !== currentUser.id && 
               !selectedTask.applicants.some(a => a.userId === currentUser.id) && (
                <button className="pixel-btn" onClick={() => handleApply(selectedTask.id)}>
                  📝 報名此任務
                </button>
              )}

              {/* 已報名提示 */}
              {selectedTask.applicants.some(a => a.userId === currentUser.id) && 
               selectedTask.status !== 'in_progress' && (
                <p style={{ textAlign: 'center', color: 'var(--color-secondary)' }}>✓ 已報名，等待發布者選擇</p>
              )}

              {/* 確認完成按鈕（發布者） */}
              {selectedTask.creatorId === currentUser.id && 
               selectedTask.status === 'pending_verification' && (
                <button className="pixel-btn" onClick={() => handleComplete(selectedTask.id)}>
                  ✅ 確認完成
                </button>
              )}

              {/* 評價按鈕 */}
              {selectedTask.status === 'completed' && (
                <>
                  {selectedTask.creatorId === currentUser.id && 
                   selectedTask.assigneeId && 
                   canRate(selectedTask, selectedTask.assigneeId) && (
                    <button 
                      className="pixel-btn secondary"
                      onClick={() => {
                        setRatingTarget({ 
                          taskId: selectedTask.id, 
                          userId: selectedTask.assigneeId!, 
                          userName: selectedTask.assigneeName! 
                        });
                        setShowRatingModal(true);
                      }}
                    >
                      ⭐ 評價執行者
                    </button>
                  )}
                  {selectedTask.assigneeId === currentUser.id && 
                   canRate(selectedTask, selectedTask.creatorId) && (
                    <button 
                      className="pixel-btn secondary"
                      onClick={() => {
                        setRatingTarget({ 
                          taskId: selectedTask.id, 
                          userId: selectedTask.creatorId, 
                          userName: selectedTask.creatorName 
                        });
                        setShowRatingModal(true);
                      }}
                    >
                      ⭐ 評價發布者
                    </button>
                  )}
                </>
              )}

              <button 
                className="pixel-btn" 
                onClick={() => setSelectedTask(null)}
                style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 發布任務 Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            <h2 className="pixel-title" style={{ fontSize: '12px', marginBottom: '20px' }}>
              發布{activeTab === 'guild' ? '公會懸賞' : '個人委託'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>任務標題</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="輸入任務標題"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>任務描述</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="描述任務內容"
                  rows={3}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>難度等級</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['F', 'B', 'S'] as TaskRank[]).map(rank => (
                    <button
                      key={rank}
                      onClick={() => {
                        const config = TASK_RANK_CONFIG[rank];
                        setNewTask({ ...newTask, rank, reward: config.minReward });
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: newTask.rank === rank ? TASK_RANK_CONFIG[rank].color : 'var(--color-bg-surface)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {rank}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  {TASK_RANK_CONFIG[newTask.rank].name} | 建議獎勵: {TASK_RANK_CONFIG[newTask.rank].minReward}-{TASK_RANK_CONFIG[newTask.rank].maxReward}
                </p>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>獎勵 (PureCoin)</label>
                <input
                  type="number"
                  value={newTask.reward}
                  onChange={e => setNewTask({ ...newTask, reward: parseInt(e.target.value) || 0 })}
                  min={TASK_RANK_CONFIG[newTask.rank].minReward}
                  max={TASK_RANK_CONFIG[newTask.rank].maxReward}
                />
              </div>
              
              <button className="pixel-btn" onClick={handleCreateTask}>
                發布任務
              </button>
              <button 
                className="pixel-btn" 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 評價 Modal */}
      {showRatingModal && ratingTarget && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px', textAlign: 'center' }}>
            <h2 className="pixel-title" style={{ fontSize: '12px', marginBottom: '20px' }}>
              評價 {ratingTarget.userName}
            </h2>
            
            <div className="star-rating" style={{ justifyContent: 'center', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={`star ${star <= rating ? 'filled' : 'empty'}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
            
            <p style={{ marginBottom: '20px', color: 'var(--color-text-secondary)' }}>
              {rating} 星評價
            </p>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="pixel-btn" onClick={handleRate} style={{ flex: 1 }}>
                提交評價
              </button>
              <button 
                className="pixel-btn" 
                onClick={() => setShowRatingModal(false)}
                style={{ flex: 1, background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
