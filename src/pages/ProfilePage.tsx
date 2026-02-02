import { useState, useRef } from 'react';
import { useApp } from '../lib/AppContext';
import { ADVENTURER_RANK_CONFIG, QUEST_MASTER_RANK_CONFIG, AVATAR_FRAMES } from '../lib/types';

export default function ProfilePage() {
  const { currentUser, users, switchUser, updateUserAvatar, updateUserFrame } = useApp();
  // const [showUserSwitch, setShowUserSwitch] = useState(false);
  const [showFrameSelect, setShowFrameSelect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const adventurerConfig = ADVENTURER_RANK_CONFIG[currentUser.adventurerRank];
  const questMasterConfig = QUEST_MASTER_RANK_CONFIG[currentUser.questMasterRank];
  const currentFrame = AVATAR_FRAMES.find(f => f.id === currentUser.avatarFrame) || AVATAR_FRAMES[0];
  const unlockedFrames = AVATAR_FRAMES.filter(f => currentUser.unlockedFrames.includes(f.id));

  // 計算下一等級進度
  const getNextRankProgress = () => {
    const ranks = Object.entries(ADVENTURER_RANK_CONFIG);
    const currentIndex = ranks.findIndex(([key]) => key === currentUser.adventurerRank);
    if (currentIndex >= ranks.length - 1) return { progress: 100, nextExp: 0, label: '已達最高等級' };
    
    const currentExp = ranks[currentIndex][1].expRequired;
    const nextExp = ranks[currentIndex + 1][1].expRequired;
    const progress = ((currentUser.adventurerExp - currentExp) / (nextExp - currentExp)) * 100;
    return { progress: Math.min(100, Math.max(0, progress)), nextExp, label: `距離下一級還需 ${nextExp - currentUser.adventurerExp} EXP` };
  };

  const expProgress = getNextRankProgress();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateUserAvatar(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFrameSelect = (frameId: string) => {
    updateUserFrame(frameId);
    setShowFrameSelect(false);
  };

  const avgRating = currentUser.totalRatings > 0 
    ? (currentUser.reputationScore / currentUser.totalRatings).toFixed(1) 
    : '尚無評價';

  return (
    <div style={{ padding: '20px', paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
      {/* 標題 */}
      <h1 className="pixel-title" style={{ textAlign: 'center', marginBottom: '24px' }}>
        ⚔️ 冒險者公會 ⚔️
      </h1>

      {/* 個人資料卡 */}
      <div className="pixel-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          {/* 頭像 */}
          <div style={{ position: 'relative' }}>
            <div 
              className="avatar"
              onClick={handleAvatarClick}
              style={{ 
                cursor: 'pointer',
                border: `${currentFrame.borderWidth}px solid ${currentFrame.borderColor}`,
                boxShadow: currentFrame.glowColor ? `0 0 10px ${currentFrame.glowColor}` : 'none'
              }}
            >
              {currentUser.avatarUri ? (
                <img src={currentUser.avatarUri} alt={currentUser.name} />
              ) : (
                <span>{currentUser.avatar || '🧑‍🎿'}</span>
              )}
            </div>
            {currentFrame.decoration && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '20px' }}>
                {currentFrame.decoration}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* 基本資訊 */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>{currentUser.name}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {currentUser.role === 'admin' ? '👑 管理員' : '⚔️ 冒險者'}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '4px' }}>
              信譽評分: ⭐ {avgRating}
            </p>
          </div>
        </div>

        {/* 邊框選擇按鈕 */}
        <button 
          className="pixel-btn secondary"
          onClick={() => setShowFrameSelect(true)}
          style={{ width: '100%', marginBottom: '16px', fontSize: '9px' }}
        >
          🖼️ 更換邊框 ({unlockedFrames.length}/{AVATAR_FRAMES.length})
        </button>

        {/* 積分顯示 */}
        <div style={{ 
          background: 'var(--color-bg-surface)', 
          borderRadius: '8px', 
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '8px' }}>
            💰 PureCoin 餘額
          </p>
          <p style={{ 
            fontFamily: 'var(--font-pixel)', 
            fontSize: '24px', 
            color: 'var(--color-primary)',
            textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
          }}>
            {currentUser.pureCoins}
          </p>
        </div>
      </div>

      {/* 雙軌榮譽系統 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {/* 冒險者等級 */}
        <div className="pixel-card">
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>冒險者等級</p>
          <p style={{ 
            fontFamily: 'var(--font-pixel)', 
            fontSize: '10px', 
            color: adventurerConfig.color,
            marginBottom: '8px'
          }}>
            {adventurerConfig.name}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            EXP: {currentUser.adventurerExp}
          </p>
          <div className="progress-bar" style={{ marginTop: '8px' }}>
            <div className="progress-fill" style={{ width: `${expProgress.progress}%` }} />
          </div>
          <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {expProgress.label}
          </p>
        </div>

        {/* 領班等級 */}
        <div className="pixel-card">
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>領班等級</p>
          <p style={{ 
            fontFamily: 'var(--font-pixel)', 
            fontSize: '10px', 
            color: questMasterConfig.color,
            marginBottom: '8px'
          }}>
            {questMasterConfig.name}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            結案: {currentUser.questMasterCompletions} 次
          </p>
        </div>
      </div>

      {/* 成就獎章 */}
      <div className="pixel-card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>🏅 成就獎章</h3>
        {currentUser.badges.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {currentUser.badges.map(badge => (
              <div 
                key={badge.id}
                style={{ 
                  background: 'var(--color-bg-surface)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                title={badge.description}
              >
                {badge.icon} {badge.name}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            尚未獲得任何獎章，完成任務來解鎖吧！
          </p>
        )}
      </div>

      {/* 切換身份（測試用） */}
      <div className="pixel-card">
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>🔄 切換身份</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => switchUser(user.id)}
              style={{
                padding: '8px 16px',
                background: user.id === currentUser.id ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                color: user.id === currentUser.id ? 'var(--color-bg-dark)' : 'var(--color-text-primary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {user.role === 'admin' ? '👑' : '⚔️'} {user.name}
            </button>
          ))}
        </div>
      </div>

      {/* 邊框選擇 Modal */}
      {showFrameSelect && (
        <div className="modal-overlay" onClick={() => setShowFrameSelect(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            <h2 className="pixel-title" style={{ fontSize: '12px', marginBottom: '20px' }}>
              選擇頭像邊框
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {AVATAR_FRAMES.map(frame => {
                const isUnlocked = currentUser.unlockedFrames.includes(frame.id);
                const isSelected = currentUser.avatarFrame === frame.id;
                return (
                  <div
                    key={frame.id}
                    onClick={() => isUnlocked && handleFrameSelect(frame.id)}
                    style={{
                      padding: '12px',
                      background: isSelected ? 'var(--color-bg-surface)' : 'var(--color-bg-dark)',
                      border: `2px solid ${isUnlocked ? frame.borderColor : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                      opacity: isUnlocked ? 1 : 0.5,
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      margin: '0 auto 8px',
                      borderRadius: '50%',
                      border: `${frame.borderWidth}px solid ${frame.borderColor}`,
                      boxShadow: frame.glowColor ? `0 0 8px ${frame.glowColor}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--color-bg-surface)'
                    }}>
                      {frame.decoration || '👤'}
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{frame.name}</p>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {isUnlocked ? (isSelected ? '✓ 使用中' : '點擊選擇') : `🔒 ${frame.unlockCondition}`}
                    </p>
                  </div>
                );
              })}
            </div>
            <button 
              className="pixel-btn" 
              onClick={() => setShowFrameSelect(false)}
              style={{ width: '100%', marginTop: '20px' }}
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
