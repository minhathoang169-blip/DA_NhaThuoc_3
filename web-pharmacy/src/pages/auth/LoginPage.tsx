import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(location.search);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(username.trim(), password);
      const redirectPath = params.get('redirect');

      if (redirectPath && redirectPath !== '/' && redirectPath !== '/login') {
        navigate(redirectPath);
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        // Dược sĩ quầy / Pharmacist
        navigate('/pos');
      }
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      const serverMsg = err.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #042f2e 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#ffffff', borderRadius: 24, boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)', border: '1px solid #14b8a6', overflow: 'hidden' }}>
        
        {/* Header Panel */}
        <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)', padding: '36px 30px', color: '#fff', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.15)', fontSize: 32, marginBottom: 14, boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }}>
            🏥
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>HỆ THỐNG QUẢN LÝ NHÀ THUỐC</h1>
          <div style={{ display: 'inline-block', marginTop: 8, background: '#14b8a6', color: '#042f2e', fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Internal Management Portal
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#99f6e4' }}>Dành riêng cho Ban Quản trị & Dược sĩ quầy GPP</p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '30px 32px 36px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Tài khoản đăng nhập
              </label>
              <input
                type="text"
                name="username"
                data-testid="login-username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập nội bộ"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border 0.2s',
                  background: '#f8fafc'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                data-testid="login-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border 0.2s',
                  background: '#f8fafc'
                }}
              />
            </div>

            <button
              type="submit"
              data-testid="login-submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 16px -2px rgba(15, 118, 110, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Đang xác thực hệ thống...' : 'Đăng Nhập Vào Portal'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
