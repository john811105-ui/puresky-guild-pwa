import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import type { TreasureItem } from '../lib/types';

type TabType = 'items' | 'proofs';

export default function TreasurePage() {
  const { currentUser, treasures, requestTreasureUse } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [selectedTreasure, setSelectedTreasure] = useState<TreasureItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!currentUser) return null;

  const userTreasures = treasures.filter(t => t.userId === currentUser.id);
  const filteredTreasures = userTreasures.filter(t => 
    activeTab === 'items' ? t.type === 'product' : t.type === 'task_proof'
  );

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      unused: '未使用',
      pending: '審查中',
      used: '已使用',
    };
    return map[status] || status;
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      unused: 'open',
      pending: 'pending',
      used: 'used',
    };
    return map[status] || '';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleRequestUse = async (treasureId: string) => {
    await requestTreasureUse(treasureId);
    showToast('已提交使用申請，等待管理員審核');
    setSelectedTreasure(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 標題 */}
      <div style={{ padding: '20px', paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
        <h1 className="pixel-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
          📦 寶物倉庫 📦
        </h1>

        {/* Tab 切換 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('items')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'items' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'items' ? 'var(--color-bg-dark)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            🎁 兌換物品
          </button>
          <button
            onClick={() => setActiveTab('proofs')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'proofs' ? 'var(--color-secondary)' : 'var(--color-bg-surface)',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'proofs' ? 'var(--color-bg-dark)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            📜 任務證明
          </button>
        </div>
      </div>

      {/* 寶物列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {filteredTreasures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{activeTab === 'items' ? '🎁' : '📜'}</div>
            <p>
              {activeTab === 'items' 
                ? '還沒有兌換任何物品，去商店看看吧！' 
                : '還沒有完成任何任務，去佈告欄接取任務吧！'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTreasures.map(treasure => (
              <div
                key={treasure.id}
                className="pixel-card"
                onClick={() => setSelectedTreasure(treasure)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* 圖示 */}
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: 'var(--color-bg-surface)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    flexShrink: 0
                  }}>
                    {treasure.imageUri ? (
                      <img src={treasure.imageUri} alt={treasure.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      treasure.type === 'product' ? (treasure.category === 'physical' ? '📦' : '✨') : '📜'
                    )}
                  </div>
                  
                  {/* 資訊 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {treasure.name}
                      </h3>
                      <span className={`status-badge ${getStatusClass(treasure.useStatus)}`} style={{ flexShrink: 0, marginLeft: '8px' }}>
                        {getStatusText(treasure.useStatus)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      獲得時間: {formatDate(treasure.acquiredAt)}
                    </p>
                    {treasure.type === 'task_proof' && (
                      <p style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '4px' }}>
                        ⭐ {treasure.taskExp} EXP | 💰 {treasure.taskReward} PureCoin
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 寶物詳情 Modal */}
      {selectedTreasure && (
        <div className="modal-overlay" onClick={() => setSelectedTreasure(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            {/* 圖示 */}
            <div style={{ 
              width: '100%', 
              height: '120px', 
              background: 'var(--color-bg-surface)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '64px'
            }}>
              {selectedTreasure.imageUri ? (
                <img src={selectedTreasure.imageUri} alt={selectedTreasure.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                selectedTreasure.type === 'product' ? (selectedTreasure.category === 'physical' ? '📦' : '✨') : '📜'
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px' }}>{selectedTreasure.name}</h2>
              <span className={`status-badge ${getStatusClass(selectedTreasure.useStatus)}`}>
                {getStatusText(selectedTreasure.useStatus)}
              </span>
            </div>
            
            {selectedTreasure.description && (
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                {selectedTreasure.description}
              </p>
            )}
            
            <div style={{ background: 'var(--color-bg-surface)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>📅 獲得時間</span>
                <span>{formatDate(selectedTreasure.acquiredAt)}</span>
              </div>
              {selectedTreasure.type === 'task_proof' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>⭐ 獲得經驗</span>
                    <span style={{ color: 'var(--color-secondary)' }}>{selectedTreasure.taskExp} EXP</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>💰 獲得獎勵</span>
                    <span style={{ color: 'var(--color-primary)' }}>{selectedTreasure.taskReward} PureCoin</span>
                  </div>
                </>
              )}
              {selectedTreasure.usedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span>✅ 使用時間</span>
                  <span>{formatDate(selectedTreasure.usedAt)}</span>
                </div>
              )}
            </div>
            
            {/* 使用按鈕（僅虛擬權利且未使用） */}
            {selectedTreasure.type === 'product' && 
             selectedTreasure.category === 'virtual' && 
             selectedTreasure.useStatus === 'unused' && (
              <button 
                className="pixel-btn" 
                onClick={() => handleRequestUse(selectedTreasure.id)}
                style={{ width: '100%', marginBottom: '8px' }}
              >
                📝 申請使用
              </button>
            )}
            
            {selectedTreasure.useStatus === 'pending' && (
              <p style={{ textAlign: 'center', color: 'var(--color-warning)', marginBottom: '8px' }}>
                ⏳ 審查中，請等待管理員確認
              </p>
            )}
            
            <button 
              className="pixel-btn" 
              onClick={() => setSelectedTreasure(null)}
              style={{ width: '100%', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
