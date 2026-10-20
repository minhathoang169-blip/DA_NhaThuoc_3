import { useEffect, useState } from 'react'
import axios from 'axios'
import CrudModule from './CrudModule.jsx'
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

  const lowStock = medicines.filter((medicine) => medicine.stock < 20)
  const expiringSoon = medicines.filter((medicine) => {
    if (!medicine.nearestExpiry) return false
    const daysLeft = (new Date(medicine.nearestExpiry) - new Date()) / 86400000
    return daysLeft >= 0 && daysLeft <= 90
  })
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
    { key: 'overview', label: 'Tổng quan', index: '01' },
    { key: 'medicines', label: 'Sản phẩm', index: '02' },
    { key: 'batches', label: 'Lô thuốc', index: '03' },
    { key: 'customers', label: 'Khách hàng', index: '04' },
    { key: 'employees', label: 'Nhân viên', index: '05' },
    { key: 'suppliers', label: 'Nhà cung cấp', index: '06' },
  ]

  return (
    <div className="app-shell" id="top">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Dược An, tổng quan">
          <span className="brand-mark">+</span>
          <span>Dược An<small>QUẢN LÝ NHÀ THUỐC</small></span>
        </a>
        <div className="nav-caption">KHÔNG GIAN LÀM VIỆC</div>
        <nav className="main-nav" aria-label="Điều hướng chính">
          {navigation.map(({ key, label, index }) => (
            <button className={`nav-link ${activeView === key ? 'active' : ''}`} key={key} type="button" onClick={() => selectView(key)}>
              <span>{index}</span>{label}
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
          <div className="breadcrumb">NHÀ THUỐC <span>/</span> {navigation.find(({ key }) => key === activeView)?.label.toLocaleUpperCase('vi')}</div>
          <div className="topbar-tools">
            <div className={`connection ${connection}`}>
              <span className="connection-dot" />
              {connection === 'connected' ? 'Đã kết nối dữ liệu' : connection === 'error' ? 'Mất kết nối API' : 'Đang kết nối'}
            </div>
            {auth && <button className="logout-button" type="button" onClick={() => { setAuth(null); setLogin({ username: auth.username, password: '' }); setActiveView('overview') }}>Đăng xuất</button>}
          </div>
        </header>

        {activeView !== 'overview' && auth && <CrudModule moduleKey={activeView} auth={auth} />}

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
              <p className="eyebrow">ĐIỀU HÀNH NHÀ THUỐC</p>
              <h1>Tổng quan kho thuốc</h1>
              <p className="heading-note">Theo dõi lượng hàng, giá trị tồn và các lô cần lưu ý.</p>
            </div>
            <button className="refresh-button" type="button" onClick={() => { setConnection('loading'); loadMedicines() }} disabled={connection === 'loading'}>
              <span aria-hidden="true">↻</span> Làm mới dữ liệu
            </button>
          </div>

          {connection === 'error' && (
            <div className="error-banner" role="alert">
              <strong>Chưa lấy được dữ liệu từ máy chủ.</strong>
              <span>Kiểm tra backend tại cổng 8080 rồi thử làm mới.</span>
            </div>
          )}

          <section className="metrics" aria-label="Chỉ số kho">
            <article className="metric metric-primary">
              <span className="metric-label">MẶT HÀNG</span>
              <strong>{connection === 'loading' ? '—' : medicines.length}</strong>
              <span className="metric-foot">Sản phẩm đang quản lý</span><span className="metric-index">01</span>
            </article>
            <article className="metric">
              <span className="metric-label">TỔNG TỒN KHO</span>
              <strong>{connection === 'loading' ? '—' : medicines.reduce((sum, item) => sum + item.stock, 0).toLocaleString('vi-VN')}</strong>
              <span className="metric-foot">Đơn vị sản phẩm</span><span className="metric-index">02</span>
            </article>
            <article className="metric">
              <span className="metric-label">GIÁ TRỊ TỒN</span>
              <strong className="metric-currency">{connection === 'loading' ? '—' : currency.format(inventoryValue)}</strong>
              <span className="metric-foot">Ước tính theo giá bán</span><span className="metric-index">03</span>
            </article>
            <article className="metric metric-alert">
              <span className="metric-label">CẦN THEO DÕI</span>
              <strong>{connection === 'loading' ? '—' : lowStock.length + expiringSoon.length}</strong>
              <span className="metric-foot">Sắp hết hoặc gần hạn dùng</span><span className="metric-index">04</span>
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
                    const isExpiring = expiryDate && (expiryDate - new Date()) / 86400000 <= 90
                    return (
                      <tr key={medicine.id}>
                        <td><div className="medicine-name"><span className="medicine-symbol">{medicine.name.slice(0, 1)}</span><span><strong>{medicine.name}</strong><small>Mã {medicine.id}</small></span></div></td>
                        <td className="ingredient-cell">{medicine.category || 'Chưa phân loại'}</td>
                        <td className="price-cell">{currency.format(medicine.price)}</td>
                        <td><strong className="stock-number">{medicine.stock.toLocaleString('vi-VN')}</strong><span className="stock-unit"> đv</span></td>
                        <td className={isExpiring ? 'expiry-cell expiring' : 'expiry-cell'}>{expiryDate ? dateFormat.format(expiryDate) : 'Chưa có lô'}</td>
                        <td><span className={`status-pill ${stockState}`}><span />{stockState === 'critical' ? 'Rất thấp' : stockState === 'low' ? 'Sắp hết' : 'Ổn định'}</span></td>
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
          <footer className="page-footer"><span>DƯỢC AN <i>•</i> QUẢN LÝ NHÀ THUỐC</span><span>Hạn dùng tính từ lô gần nhất</span></footer>
        </section>}
      </main>
    </div>
  )
}

export default App
