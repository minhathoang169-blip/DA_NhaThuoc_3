import { useEffect, useState } from 'react'
import axios from 'axios'
import CrudModule from './CrudModule.jsx'
import TransactionModule from './TransactionModule.jsx'
import { verifyCredentials } from './apiAuth.js'
import './App.css'
import './dashboard.css'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const iconPaths = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  medicines: <><path d="m8 4 12 12a4.2 4.2 0 0 1-6 6L2 10a4.2 4.2 0 0 1 6-6Z" /><path d="m7 13 6-6" /><path d="m5 8 3-3" /></>,
  batches: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /></>,
  customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  employees: <><rect x="3" y="4" width="18" height="17" rx="2" /><circle cx="9" cy="10" r="2.5" /><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 9h3M15 13h3M15 17h3" /></>,
  suppliers: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></>,
  imports: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></>,
  sales: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /><path d="M9 13h6" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.6-2L20 12M4 12l2.9 5a7 7 0 0 0 11.6-2" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  alert: <><path d="m10.3 3.9-8 13.8A2 2 0 0 0 4 20.7h16a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  inventory: <><path d="M4 7h16l-1 14H5L4 7Z" /><path d="M8 7V5a4 4 0 0 1 8 0v2M9 12h6" /></>,
  currency: <><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" /></>,
}

function Icon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>
}

function App() {
  const [medicines, setMedicines] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [connection, setConnection] = useState('loading')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeView, setActiveView] = useState('overview')
  const [auth, setAuth] = useState(null)
  const [login, setLogin] = useState({ username: 'user', password: '' })
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  async function loadMedicines(signal) {
    try {
      const response = await axios.get('/api/medicines', { signal })
      setMedicines(response.data)
      setConnection('connected')
      setLastUpdated(new Date())
    } catch (error) {
      if (!axios.isCancel(error)) setConnection('error')
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    axios.get('/api/medicines', { signal: controller.signal })
      .then((response) => {
        setMedicines(response.data)
        setConnection('connected')
        setLastUpdated(new Date())
      })
      .catch((error) => {
        if (!axios.isCancel(error)) setConnection('error')
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const refresh = () => loadMedicines()
    window.addEventListener('pharmacy-data-changed', refresh)
    return () => window.removeEventListener('pharmacy-data-changed', refresh)
  }, [])

  const lowStock = medicines.filter((medicine) => medicine.stock < 20)
  const todayKey = lastUpdated ? localDateKey(lastUpdated) : null
  const expiringSoon = medicines.filter((medicine) => medicine.nearestExpiry && todayKey
    && (Date.parse(`${medicine.nearestExpiry}T00:00:00`) - Date.parse(`${todayKey}T00:00:00`)) / 86400000 <= 90)
  const attentionCount = new Set([...lowStock, ...expiringSoon].map((medicine) => medicine.id)).size
  const inventoryValue = medicines.reduce((total, medicine) => total + medicine.price * medicine.stock, 0)
  const normalizedSearch = search.trim().toLocaleLowerCase('vi')
  const visibleMedicines = medicines.filter((medicine) => {
    const matchesSearch = `${medicine.name} ${medicine.category || ''}`.toLocaleLowerCase('vi').includes(normalizedSearch)
    const matchesFilter = filter === 'all'
      || (filter === 'low' && medicine.stock < 20)
      || (filter === 'expiring' && expiringSoon.some((item) => item.id === medicine.id))
    return matchesSearch && matchesFilter
  })

  async function handleLogin(event) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError('')
    try {
      setAuth(await verifyCredentials(login.username, login.password))
    } catch {
      setAuthError('Thông tin đăng nhập không đúng hoặc backend chưa sẵn sàng.')
    } finally {
      setAuthBusy(false)
    }
  }

  function selectView(view) {
    setActiveView(view)
    setAuthError('')
  }

  const navigation = [
    { key: 'overview', label: 'Tổng quan', icon: 'overview' },
    { key: 'medicines', label: 'Sản phẩm', icon: 'medicines' },
    { key: 'batches', label: 'Lô thuốc', icon: 'batches' },
    { key: 'customers', label: 'Khách hàng', icon: 'customers' },
    { key: 'employees', label: 'Nhân viên', icon: 'employees' },
    { key: 'suppliers', label: 'Nhà cung cấp', icon: 'suppliers' },
    { key: 'imports', label: 'Nhập hàng', icon: 'imports' },
    { key: 'sales', label: 'Bán hàng', icon: 'sales' },
  ]

  return (
    <div className="app-shell" id="top">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Nhà thuốc An Tâm, tổng quan">
          <span className="brand-mark"><Icon name="medicines" size={22} /></span>
          <span>An Tâm<small>CHĂM SÓC SỨC KHỎE</small></span>
        </a>
        <div className="nav-caption">KHÔNG GIAN LÀM VIỆC</div>
        <nav className="main-nav" aria-label="Điều hướng chính">
          {navigation.map(({ key, label, icon }) => (
            <button className={`nav-link ${activeView === key ? 'active' : ''}`} key={key} type="button" onClick={() => selectView(key)}>
              <span className="nav-icon"><Icon name={icon} size={17} /></span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className={`sidebar-dot ${auth ? 'online' : ''}`} />
          <div><strong>{auth ? auth.username : 'Hệ thống kho'}</strong><small>{auth ? 'Đã xác thực API' : 'Dữ liệu được đồng bộ qua API'}</small></div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span className="breadcrumb-brand">AN TÂM</span><span className="breadcrumb-divider">/</span> {navigation.find(({ key }) => key === activeView)?.label}</div>
          <div className="topbar-tools">
            <div className={`connection ${connection}`}>
              <span className="connection-dot" />
              {connection === 'connected' ? 'Đã kết nối dữ liệu' : connection === 'error' ? 'Mất kết nối API' : 'Đang kết nối'}
            </div>
            {auth && <button className="logout-button" type="button" onClick={() => { setAuth(null); setLogin({ username: auth.username, password: '' }); setActiveView('overview') }}>Đăng xuất</button>}
          </div>
        </header>

        {activeView !== 'overview' && auth && ['imports', 'sales'].includes(activeView) && <TransactionModule key={activeView} kind={activeView} auth={auth} />}
        {activeView !== 'overview' && auth && !['imports', 'sales'].includes(activeView) && <CrudModule moduleKey={activeView} auth={auth} />}

        {activeView !== 'overview' && !auth && (
          <section className="page-content auth-page">
            <div className="auth-panel">
              <p className="eyebrow">XÁC THỰC QUẢN TRỊ</p>
              <h1>Đăng nhập để quản lý</h1>
              <p className="heading-note">Dùng tài khoản Basic Auth của backend. Thông tin chỉ được giữ trong bộ nhớ trang hiện tại.</p>
              <form className="record-form auth-form" onSubmit={handleLogin}>
                <label className="form-field"><span>Tài khoản</span><input autoComplete="username" required value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} /></label>
                <label className="form-field"><span>Mật khẩu</span><input type="password" autoComplete="current-password" required value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label>
                {authError && <div className="form-error" role="alert">{authError}</div>}
                <button className="save-button" type="submit" disabled={authBusy}>{authBusy ? 'Đang xác thực…' : 'Đăng nhập'}</button>
              </form>
            </div>
          </section>
        )}

        {activeView === 'overview' && <section className="page-content" id="overview">
          <div className="page-heading">
            <div>
              <p className="eyebrow">THỨC HAI · NHÀ THUỐC AN TÂM</p>
              <h1>Chào buổi sáng 👋</h1>
              <p className="heading-note">Đây là tình hình kho và hoạt động của nhà thuốc hôm nay.</p>
            </div>
            <div className="heading-actions">
              <button className="refresh-button" type="button" onClick={() => { setConnection('loading'); loadMedicines() }} disabled={connection === 'loading'}>
                <Icon name="refresh" size={16} /> Làm mới
              </button>
              <button className="primary-action" type="button" onClick={() => selectView('imports')}><Icon name="imports" size={16} /> Lập phiếu nhập</button>
              <button className="secondary-action" type="button" onClick={() => selectView('sales')}><Icon name="sales" size={16} /> Bán hàng</button>
            </div>
          </div>

          {connection === 'error' && (
            <div className="error-banner" role="alert">
              <strong>Chưa lấy được dữ liệu từ máy chủ.</strong>
              <span>Kiểm tra kết nối máy chủ rồi thử làm mới.</span>
            </div>
          )}

          <section className="metrics" aria-label="Chỉ số kho">
            <article className="metric metric-primary">
              <div className="metric-topline"><span className="metric-label">MẶT HÀNG</span><span className="metric-icon"><Icon name="medicines" /></span></div>
              <strong>{connection === 'loading' ? '—' : medicines.length}</strong>
              <span className="metric-foot">Sản phẩm đang quản lý</span>
            </article>
            <article className="metric">
              <div className="metric-topline"><span className="metric-label">TỔNG TỒN KHO</span><span className="metric-icon"><Icon name="inventory" /></span></div>
              <strong>{connection === 'loading' ? '—' : medicines.reduce((sum, item) => sum + item.stock, 0).toLocaleString('vi-VN')}</strong>
              <span className="metric-foot">Đơn vị sản phẩm</span>
            </article>
            <article className="metric">
              <div className="metric-topline"><span className="metric-label">GIÁ TRỊ TỒN</span><span className="metric-icon"><Icon name="currency" /></span></div>
              <strong className="metric-currency">{connection === 'loading' ? '—' : currency.format(inventoryValue)}</strong>
              <span className="metric-foot">Ước tính theo giá bán</span>
            </article>
            <article className="metric metric-alert">
              <div className="metric-topline"><span className="metric-label">CẦN THEO DÕI</span><span className="metric-icon"><Icon name="alert" /></span></div>
              <strong>{connection === 'loading' ? '—' : attentionCount}</strong>
              <span className="metric-foot">Tồn thấp, sắp hết hoặc đã hết hạn</span>
            </article>
          </section>

          <section className="inventory-section" id="inventory">
            <div className="section-heading">
              <div><p className="eyebrow">DANH MỤC SẢN PHẨM</p><h2>Tình trạng thuốc</h2></div>
              <span className="updated-at">{lastUpdated ? `Cập nhật ${lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chưa đồng bộ'}</span>
            </div>
            <div className="table-toolbar">
              <div className="filter-tabs" role="group" aria-label="Lọc thuốc">
                <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')} type="button">Tất cả <span>{medicines.length}</span></button>
                <button className={filter === 'low' ? 'selected' : ''} onClick={() => setFilter('low')} type="button">Tồn thấp <span>{lowStock.length}</span></button>
                <button className={filter === 'expiring' ? 'selected' : ''} onClick={() => setFilter('expiring')} type="button">Gần hết hạn <span>{expiringSoon.length}</span></button>
              </div>
              <label className="search-box"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên thuốc, mã, loại" /></label>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>TÊN THUỐC</th><th>LOẠI SẢN PHẨM</th><th>ĐƠN GIÁ</th><th>TỒN KHO</th><th>HẠN DÙNG GẦN NHẤT</th><th>TRẠNG THÁI</th></tr></thead>
                <tbody>
                  {connection === 'loading' && <tr><td className="table-message" colSpan="6">Đang tải danh sách thuốc…</td></tr>}
                  {connection !== 'loading' && visibleMedicines.map((medicine) => {
                    const stockState = medicine.stock < 10 ? 'critical' : medicine.stock < 20 ? 'low' : 'available'
                    const expiryDate = medicine.nearestExpiry ? new Date(medicine.nearestExpiry) : null
                    const daysToExpiry = expiryDate && todayKey
                      ? (Date.parse(`${medicine.nearestExpiry}T00:00:00`) - Date.parse(`${todayKey}T00:00:00`)) / 86400000
                      : Infinity
                    const isExpiring = daysToExpiry <= 90
                    const isExpired = Boolean(medicine.nearestExpiry && todayKey && medicine.nearestExpiry < todayKey)
                    return (
                      <tr key={medicine.id}>
                        <td><div className="medicine-name"><span className="medicine-symbol">{medicine.name.slice(0, 1)}</span><span><strong>{medicine.name}</strong><small>Mã {medicine.id}</small></span></div></td>
                        <td className="ingredient-cell">{medicine.category || 'Chưa phân loại'}</td>
                        <td className="price-cell">{currency.format(medicine.price)}</td>
                        <td><strong className="stock-number">{medicine.stock.toLocaleString('vi-VN')}</strong><span className="stock-unit"> đv</span></td>
                        <td className={isExpiring ? 'expiry-cell expiring' : 'expiry-cell'}>{expiryDate ? dateFormat.format(expiryDate) : 'Chưa có lô'}</td>
                        <td><span className={`status-pill ${isExpired ? 'critical' : stockState}`}><span />{isExpired ? 'Có lô hết hạn' : stockState === 'critical' ? 'Rất thấp' : stockState === 'low' ? 'Sắp hết' : 'Ổn định'}</span></td>
                      </tr>
                    )
                  })}
                  {connection === 'connected' && visibleMedicines.length === 0 && <tr><td className="table-message" colSpan="6">Không tìm thấy mặt hàng phù hợp.</td></tr>}
                  {connection === 'error' && <tr><td className="table-message" colSpan="6">Danh sách sẽ xuất hiện khi API kết nối trở lại.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>Hiển thị {visibleMedicines.length} / {medicines.length} mặt hàng</span><span>Dữ liệu tồn kho từ các lô thuốc</span></footer>
          </section>
          <footer className="page-footer"><span>AN TÂM <i>•</i> QUẢN LÝ NHÀ THUỐC</span><span>Hạn dùng tính từ lô gần nhất</span></footer>
        </section>}
      </main>
    </div>
  )
}

export default App
