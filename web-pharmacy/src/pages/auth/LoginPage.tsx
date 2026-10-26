import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const initialMode = params.get('mode') === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryMode = new URLSearchParams(location.search).get('mode');
    if (queryMode === 'register') {
      setMode('register');
    } else if (queryMode === 'login') {
      setMode('login');
    }
  }, [location.search]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const loggedUser = await login(username.trim(), password);
      const redirectPath = params.get('redirect');

      if (loggedUser.role === 'CUSTOMER') {
        navigate('/store');
      } else if (redirectPath && redirectPath !== '/' && redirectPath !== '/login') {
        navigate(redirectPath);
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/v1/auth/register', {
        username: regUsername.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        phone: regPhone.trim() || null,
        email: regEmail.trim() || null,
        role: 'CUSTOMER',
      });

      // Tự động đăng nhập ngay sau khi đăng ký thành công
      await login(regUsername.trim(), regPassword);
      navigate('/store');
    } catch (err: any) {
      console.error('Lỗi đăng ký:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Không thể đăng ký tài khoản (Tên đăng nhập hoặc Email có thể đã tồn tại).';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #042f2e 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#ffffff', borderRadius: 24, boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)', border: '1px solid #14b8a6', overflow: 'hidden' }}>
        
        {/* Header Panel */}
        <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)', padding: '32px 30px 26px', color: '#fff', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.15)', fontSize: 30, marginBottom: 12, boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }}>
            🏥
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>HỆ THỐNG NHÀ THUỐC DƯỢC AN</h1>
          <div style={{ display: 'inline-block', marginTop: 8, background: '#14b8a6', color: '#042f2e', fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            GPP Pharmacy Portal & Storefront
          </div>

          {/* Mode Switch Tabs: Đăng Nhập / Đăng Ký Khách Hàng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'rgba(0,0,0,0.22)', padding: 5, borderRadius: 12, marginTop: 18 }}>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? '#0f766e' : '#ccfbf1',
                transition: 'all 0.15s',
              }}
            >
              🔑 Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                background: mode === 'register' ? '#ffffff' : 'transparent',
                color: mode === 'register' ? '#0f766e' : '#ccfbf1',
                transition: 'all 0.15s',
              }}
            >
              ✨ Đăng Ký Khách Hàng
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '26px 32px 32px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
              ✅ {successMsg}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  placeholder="VD: admin, pharmacist, customer hoặc tài khoản bạn vừa tạo"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
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
                }}
              >
                {loading ? 'Đang xác thực hệ thống...' : 'Đăng Nhập Hệ Thống'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 4 }}>
                Khách hàng chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#0f766e', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Đăng ký ngay tại đây
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Họ và tên khách hàng *
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Tên đăng nhập (`username`) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="VD: khachhang01"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Email (Tùy chọn)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="VD: khachhang@gmail.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Mật khẩu tự đặt *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Nhập lại mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6,
                  padding: '13px',
                  borderRadius: 12,
                  border: 'none',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 16px -2px rgba(15, 118, 110, 0.4)',
                }}
              >
                {loading ? 'Đang tạo tài khoản...' : '✨ Đăng Ký & Vào Mua Thuốc Ngay'}
              </button>
            </form>
          )}

          {/* Direct Storefront Link for Guest Customers */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Link
              to="/store"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: '#0f766e',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                background: '#f0fdfa',
                padding: '10px 18px',
                borderRadius: 12,
                border: '1px solid #99f6e4',
              }}
            >
              🛍️ Mua Thuốc Nhanh Không Cần Tài Khoản (Khách Vãng Lai)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
