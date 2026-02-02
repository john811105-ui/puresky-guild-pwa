import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import type { Product, ProductCategory, AdventurerRank } from '../lib/types';
import { ADVENTURER_RANK_CONFIG } from '../lib/types';

type TabType = 'users' | 'shop' | 'treasure' | 'allowance';

export default function AdminPage() {
  const { 
    currentUser, users, products, treasureReviews,
    createUser, deleteUser, changeUserRole, adjustUserCoins,
    createProduct, updateProduct, deleteProduct,
    reviewTreasureUse, distributeAllowance
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [toast, setToast] = useState<string | null>(null);
  
  // 用戶管理
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');
  
  // 積分調整
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  
  // 商品管理
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'physical' as ProductCategory,
    price: 100,
    stock: 10,
    minRank: undefined as AdventurerRank | undefined,
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div style={{ padding: '20px', paddingTop: 'calc(20px + env(safe-area-inset-top))', textAlign: 'center' }}>
        <h1 className="pixel-title">🔒 無權限</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>此頁面僅限管理員存取</p>
      </div>
    );
  }

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    await createUser(newUserName, newUserRole);
    showToast('用戶新增成功');
    setShowAddUser(false);
    setNewUserName('');
    setNewUserRole('staff');
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      showToast('無法刪除自己');
      return;
    }
    await deleteUser(userId);
    showToast('用戶已刪除');
  };

  const handleChangeRole = async (userId: string, role: 'admin' | 'staff') => {
    await changeUserRole(userId, role);
    showToast('權限已更新');
  };

  const handleAdjustCoins = async () => {
    if (!adjustUserId || adjustAmount === 0) return;
    await adjustUserCoins(adjustUserId, adjustAmount, adjustReason || '管理員調整');
    showToast(`積分${adjustAmount > 0 ? '增加' : '扣除'}成功`);
    setAdjustUserId(null);
    setAdjustAmount(0);
    setAdjustReason('');
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return;
    await createProduct(
      newProduct.name,
      newProduct.description,
      newProduct.category,
      newProduct.price,
      newProduct.stock,
      newProduct.minRank
    );
    showToast('商品新增成功');
    setShowAddProduct(false);
    setNewProduct({ name: '', description: '', category: 'physical', price: 100, stock: 10, minRank: undefined });
  };

  const handleUpdateProduct = async () => {
    if (!editProduct) return;
    await updateProduct(editProduct.id, editProduct);
    showToast('商品更新成功');
    setEditProduct(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId);
    showToast('商品已刪除');
  };

  const handleReviewTreasure = async (requestId: string, approved: boolean) => {
    const result = await reviewTreasureUse(requestId, approved);
    showToast(result.message);
  };

  const handleDistributeAllowance = async () => {
    const result = await distributeAllowance();
    showToast(result.message);
  };

  const pendingReviews = treasureReviews.filter(r => r.status === 'pending');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 標題 */}
      <div style={{ padding: '20px', paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
        <h1 className="pixel-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
          ⚙️ 管理後台 ⚙️
        </h1>

        {/* Tab 切換 */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { key: 'users', label: '👥 用戶', badge: 0 },
            { key: 'shop', label: '🏪 商店', badge: 0 },
            { key: 'treasure', label: '📦 審查', badge: pendingReviews.length },
            { key: 'allowance', label: '💰 津貼', badge: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              style={{
                flex: 1,
                minWidth: '70px',
                padding: '10px 8px',
                background: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                border: 'none',
                borderRadius: '8px',
                color: activeTab === tab.key ? 'var(--color-bg-dark)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-retro)',
                fontSize: '14px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--color-error)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 內容區 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {/* 用戶管理 */}
        {activeTab === 'users' && (
          <div>
            <button className="pixel-btn" onClick={() => setShowAddUser(true)} style={{ width: '100%', marginBottom: '16px' }}>
              ➕ 新增用戶
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {users.map(user => (
                <div key={user.id} className="pixel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{user.name}</span>
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '12px', 
                        color: user.role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-muted)' 
                      }}>
                        {user.role === 'admin' ? '👑 管理員' : '⚔️ 員工'}
                      </span>
                    </div>
                    <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-pixel)', fontSize: '12px' }}>
                      💰 {user.pureCoins}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setAdjustUserId(user.id)}
                      style={{ padding: '6px 12px', background: 'var(--color-bg-surface)', border: 'none', borderRadius: '4px', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      💰 調整積分
                    </button>
                    <button
                      onClick={() => handleChangeRole(user.id, user.role === 'admin' ? 'staff' : 'admin')}
                      style={{ padding: '6px 12px', background: 'var(--color-bg-surface)', border: 'none', borderRadius: '4px', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      🔄 切換權限
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        style={{ padding: '6px 12px', background: 'var(--color-error)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️ 刪除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 商店管理 */}
        {activeTab === 'shop' && (
          <div>
            <button className="pixel-btn" onClick={() => setShowAddProduct(true)} style={{ width: '100%', marginBottom: '16px' }}>
              ➕ 新增商品
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {products.map(product => (
                <div key={product.id} className="pixel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{product.name}</span>
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '12px', 
                        color: product.category === 'physical' ? 'var(--color-primary)' : 'var(--color-secondary)' 
                      }}>
                        {product.category === 'physical' ? '📦 實體' : '✨ 虛擬'}
                      </span>
                    </div>
                    <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-pixel)', fontSize: '12px' }}>
                      💰 {product.price}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    剩餘: {product.stock} | {product.minRank ? `🔒 ${ADVENTURER_RANK_CONFIG[product.minRank].name}以上` : '無等級限制'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setEditProduct(product)}
                      style={{ padding: '6px 12px', background: 'var(--color-bg-surface)', border: 'none', borderRadius: '4px', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✏️ 編輯
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{ padding: '6px 12px', background: 'var(--color-error)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                    >
                      🗑️ 刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 寶物審查 */}
        {activeTab === 'treasure' && (
          <div>
            {pendingReviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <p>目前沒有待審查的使用申請</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingReviews.map(review => (
                  <div key={review.id} className="pixel-card">
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>申請人</p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{review.userName}</p>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>申請使用</p>
                      <p style={{ fontSize: '16px' }}>{review.treasureName}</p>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>申請時間</p>
                      <p style={{ fontSize: '14px' }}>{new Date(review.requestedAt).toLocaleString()}</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="pixel-btn"
                        onClick={() => handleReviewTreasure(review.id, true)}
                        style={{ flex: 1 }}
                      >
                        ✅ 確認使用
                      </button>
                      <button
                        className="pixel-btn danger"
                        onClick={() => handleReviewTreasure(review.id, false)}
                        style={{ flex: 1 }}
                      >
                        ❌ 拒絕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 津貼發放 */}
        {activeTab === 'allowance' && (
          <div>
            <div className="pixel-card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>💰 冒險津貼</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                每月發放 100 PureCoin 給所有員工。
                <br />
                發放期間：12月、1月、2月、3月（雪季）
              </p>
              <button className="pixel-btn" onClick={handleDistributeAllowance} style={{ width: '100%' }}>
                🎁 發放本月津貼
              </button>
            </div>
            
            <div className="pixel-card">
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>📊 系統資訊</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>總用戶數</span>
                  <span>{users.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>管理員數</span>
                  <span>{users.filter(u => u.role === 'admin').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>商品數量</span>
                  <span>{products.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>待審查數</span>
                  <span style={{ color: pendingReviews.length > 0 ? 'var(--color-warning)' : 'inherit' }}>
                    {pendingReviews.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增用戶 Modal */}
      {showAddUser && (
        <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            <h2 className="pixel-title" style={{ fontSize: '12px', marginBottom: '20px' }}>新增用戶</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>用戶名稱</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="輸入名稱"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>權限</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setNewUserRole('staff')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: newUserRole === 'staff' ? 'var(--color-secondary)' : 'var(--color-bg-surface)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ⚔️ 員工
                  </button>
                  <button
                    onClick={() => setNewUserRole('admin')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: newUserRole === 'admin' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                      border: 'none',
                      borderRadius: '8px',
                      color: newUserRole === 'admin' ? 'var(--color-bg-dark)' : 'white',
                      cursor: 'pointer'
                    }}
                  >
                    👑 管理員
                  </button>
                </div>
              </div>
              <button className="pixel-btn" onClick={handleAddUser}>新增</button>
              <button className="pixel-btn" onClick={() => setShowAddUser(false)} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 調整積分 Modal */}
      {adjustUserId && (
        <div className="modal-overlay" onClick={() => setAdjustUserId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            <h2 className="pixel-title" style={{ fontSize: '12px', marginBottom: '20px' }}>調整積分</h2>
            <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
              用戶: {users.find(u => u.id === adjustUserId)?.name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>調整金額（正數增加，負數扣除）</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>原因</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="輸入調整原因"
                />
              </div>
              <button className="pixel-btn" onClick={handleAdjustCoins}>確認調整</button>
              <button className="pixel-btn" onClick={() => setAdjustUserId(null)} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 新增/編輯商品 Modal */}
      {(showAddProduct || editProduct) && (
        <div className="modal-overlay" onClick={() => { setShowAddProduct(false); setEditProduct(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            <h2 className="pixel-title" style={{ fontSize: '12px', marginBottom: '20px' }}>
              {editProduct ? '編輯商品' : '新增商品'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>商品名稱</label>
                <input
                  type="text"
                  value={editProduct ? editProduct.name : newProduct.name}
                  onChange={e => editProduct 
                    ? setEditProduct({ ...editProduct, name: e.target.value })
                    : setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="輸入名稱"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>描述</label>
                <textarea
                  value={editProduct ? editProduct.description : newProduct.description}
                  onChange={e => editProduct 
                    ? setEditProduct({ ...editProduct, description: e.target.value })
                    : setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  placeholder="輸入描述"
                  rows={2}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>類型</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['physical', 'virtual'] as ProductCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => editProduct 
                        ? setEditProduct({ ...editProduct, category: cat })
                        : setNewProduct({ ...newProduct, category: cat })
                      }
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: (editProduct ? editProduct.category : newProduct.category) === cat 
                          ? (cat === 'physical' ? 'var(--color-primary)' : 'var(--color-secondary)')
                          : 'var(--color-bg-surface)',
                        border: 'none',
                        borderRadius: '8px',
                        color: (editProduct ? editProduct.category : newProduct.category) === cat && cat === 'physical'
                          ? 'var(--color-bg-dark)' : 'white',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {cat === 'physical' ? '📦 實體' : '✨ 虛擬'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>價格</label>
                  <input
                    type="number"
                    value={editProduct ? editProduct.price : newProduct.price}
                    onChange={e => editProduct 
                      ? setEditProduct({ ...editProduct, price: parseInt(e.target.value) || 0 })
                      : setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>庫存</label>
                  <input
                    type="number"
                    value={editProduct ? editProduct.stock : newProduct.stock}
                    onChange={e => editProduct 
                      ? setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })
                      : setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <button className="pixel-btn" onClick={editProduct ? handleUpdateProduct : handleAddProduct}>
                {editProduct ? '更新' : '新增'}
              </button>
              <button className="pixel-btn" onClick={() => { setShowAddProduct(false); setEditProduct(null); }} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
