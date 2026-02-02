import { useState } from 'react';
import { useApp } from '../lib/AppContext';
import type { Product } from '../lib/types';
import { ADVENTURER_RANK_CONFIG } from '../lib/types';

type TabType = 'physical' | 'virtual';

export default function ShopPage() {
  const { currentUser, products, redeemProduct } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('physical');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!currentUser) return null;

  const filteredProducts = products.filter(p => p.category === activeTab && p.stock > 0);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRedeem = async (productId: string) => {
    const result = await redeemProduct(productId);
    showToast(result.message);
    setSelectedProduct(null);
  };

  const canRedeem = (product: Product) => {
    if (currentUser.pureCoins < product.price) return false;
    if (product.minRank) {
      const ranks = Object.keys(ADVENTURER_RANK_CONFIG);
      const userRankIndex = ranks.indexOf(currentUser.adventurerRank);
      const requiredRankIndex = ranks.indexOf(product.minRank);
      if (userRankIndex < requiredRankIndex) return false;
    }
    return true;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 標題 */}
      <div style={{ padding: '20px', paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
        <h1 className="pixel-title" style={{ textAlign: 'center', marginBottom: '8px' }}>
          🏪 兌換商店 🏪
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          💰 餘額: <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{currentUser.pureCoins}</span> PureCoin
        </p>

        {/* Tab 切換 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('physical')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'physical' ? 'var(--color-primary)' : 'var(--color-bg-surface)',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'physical' ? 'var(--color-bg-dark)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            📦 實體商品
          </button>
          <button
            onClick={() => setActiveTab('virtual')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'virtual' ? 'var(--color-secondary)' : 'var(--color-bg-surface)',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'virtual' ? 'var(--color-bg-dark)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-pixel)',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✨ 虛擬權利
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p>目前沒有{activeTab === 'physical' ? '實體商品' : '虛擬權利'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="pixel-card"
                onClick={() => setSelectedProduct(product)}
                style={{ cursor: 'pointer', opacity: canRedeem(product) ? 1 : 0.6 }}
              >
                {/* 商品圖片 */}
                <div style={{ 
                  width: '100%', 
                  height: '80px', 
                  background: 'var(--color-bg-surface)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                  fontSize: '32px'
                }}>
                  {product.imageUri ? (
                    <img src={product.imageUri} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    activeTab === 'physical' ? '📦' : '✨'
                  )}
                </div>
                
                <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>{product.name}</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-pixel)', 
                    fontSize: '10px', 
                    color: 'var(--color-primary)' 
                  }}>
                    💰 {product.price}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    剩餘 {product.stock}
                  </span>
                </div>
                
                {product.minRank && (
                  <p style={{ 
                    fontSize: '10px', 
                    color: ADVENTURER_RANK_CONFIG[product.minRank].color,
                    marginTop: '4px'
                  }}>
                    🔒 {ADVENTURER_RANK_CONFIG[product.minRank].name}以上
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 商品詳情 Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px' }}>
            {/* 商品圖片 */}
            <div style={{ 
              width: '100%', 
              height: '150px', 
              background: 'var(--color-bg-surface)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '64px'
            }}>
              {selectedProduct.imageUri ? (
                <img src={selectedProduct.imageUri} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                selectedProduct.category === 'physical' ? '📦' : '✨'
              )}
            </div>
            
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>{selectedProduct.name}</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{selectedProduct.description}</p>
            
            <div style={{ background: 'var(--color-bg-surface)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>💰 價格</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{selectedProduct.price} PureCoin</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>📦 剩餘數量</span>
                <span>{selectedProduct.stock}</span>
              </div>
              {selectedProduct.minRank && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🔒 最低等級</span>
                  <span style={{ color: ADVENTURER_RANK_CONFIG[selectedProduct.minRank].color }}>
                    {ADVENTURER_RANK_CONFIG[selectedProduct.minRank].name}
                  </span>
                </div>
              )}
            </div>
            
            {/* 兌換按鈕 */}
            {canRedeem(selectedProduct) ? (
              <button className="pixel-btn" onClick={() => handleRedeem(selectedProduct.id)} style={{ width: '100%' }}>
                🛒 兌換商品
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
                {currentUser.pureCoins < selectedProduct.price ? '❌ 積分不足' : '❌ 等級不足'}
              </div>
            )}
            
            <button 
              className="pixel-btn" 
              onClick={() => setSelectedProduct(null)}
              style={{ width: '100%', marginTop: '8px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
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
