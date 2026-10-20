import { useEffect, useState } from 'react'
import axios from 'axios'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

const modules = {
  medicines: {
    path: '/api/medicines',
    title: 'Sản phẩm',
    singular: 'sản phẩm',
    description: 'Quản lý tên thuốc, loại sản phẩm và giá bán.',
    fields: [
      { key: 'id', label: 'Mã sản phẩm', required: true },
      { key: 'name', label: 'Tên sản phẩm', required: true },
      { key: 'category', label: 'Loại sản phẩm' },
      { key: 'price', label: 'Giá bán', type: 'number', required: true },
    ],
    columns: [
      { key: 'id', label: 'MÃ' },
      { key: 'name', label: 'TÊN SẢN PHẨM' },
      { key: 'category', label: 'PHÂN LOẠI' },
      { key: 'price', label: 'GIÁ BÁN' },
      { key: 'stock', label: 'TỒN KHO' },
    ],
  },
  batches: {
    path: '/api/batches',
    title: 'Lô thuốc',
    singular: 'lô thuốc',
    description: 'Theo dõi lô, hạn dùng, số lượng và giá nhập.',
    fields: [
      { key: 'id', label: 'Mã lô', required: true },
      { key: 'medicineId', label: 'Mã sản phẩm', required: true },
      { key: 'batchNumber', label: 'Số lô', type: 'number', required: true },
      { key: 'expiryDate', label: 'Hạn sử dụng', type: 'date', required: true },
      { key: 'quantity', label: 'Số lượng tồn', type: 'number', required: true },
      { key: 'purchasePrice', label: 'Giá nhập', type: 'number', required: true },
    ],
    columns: [
      { key: 'id', label: 'MÃ LÔ' },
      { key: 'medicineName', label: 'SẢN PHẨM' },
      { key: 'batchNumber', label: 'SỐ LÔ' },
      { key: 'expiryDate', label: 'HẠN DÙNG' },
      { key: 'quantity', label: 'TỒN KHO' },
      { key: 'purchasePrice', label: 'GIÁ NHẬP' },
    ],
  },
  customers: {
    path: '/api/customers',
    title: 'Khách hàng',
    singular: 'khách hàng',
    description: 'Quản lý thông tin và địa chỉ khách hàng.',
    fields: [
      { key: 'id', label: 'Mã khách hàng', required: true },
      { key: 'name', label: 'Họ tên', required: true },
      { key: 'phone', label: 'Số điện thoại' },
      { key: 'address', label: 'Địa chỉ' },
    ],
    columns: [
      { key: 'id', label: 'MÃ' },
      { key: 'name', label: 'HỌ TÊN' },
      { key: 'phone', label: 'ĐIỆN THOẠI' },
      { key: 'address', label: 'ĐỊA CHỈ' },
      { key: 'createdAt', label: 'KHỞI TẠO' },
    ],
  },
  employees: {
    path: '/api/employees',
    title: 'Nhân viên',
    singular: 'nhân viên',
    description: 'Quản lý hồ sơ và chức vụ nhân viên.',
    fields: [
      { key: 'id', label: 'Mã nhân viên', required: true },
      { key: 'name', label: 'Họ tên', required: true },
      { key: 'phone', label: 'Số điện thoại' },
      { key: 'birthDate', label: 'Ngày sinh', type: 'date' },
      { key: 'role', label: 'Chức vụ' },
      { key: 'startDate', label: 'Ngày bắt đầu', type: 'date' },
    ],
    columns: [
      { key: 'id', label: 'MÃ' },
      { key: 'name', label: 'HỌ TÊN' },
      { key: 'phone', label: 'ĐIỆN THOẠI' },
      { key: 'role', label: 'CHỨC VỤ' },
      { key: 'startDate', label: 'NGÀY BẮT ĐẦU' },
    ],
  },
  suppliers: {
    path: '/api/suppliers',
    title: 'Nhà cung cấp',
    singular: 'nhà cung cấp',
    description: 'Quản lý đơn vị cung cấp và thông tin liên hệ.',
    fields: [
      { key: 'id', label: 'Mã nhà cung cấp', required: true },
      { key: 'name', label: 'Tên nhà cung cấp', required: true },
      { key: 'phone', label: 'Số điện thoại' },
      { key: 'address', label: 'Địa chỉ' },
    ],
    columns: [
      { key: 'id', label: 'MÃ' },
      { key: 'name', label: 'TÊN NHÀ CUNG CẤP' },
      { key: 'phone', label: 'ĐIỆN THOẠI' },
      { key: 'address', label: 'ĐỊA CHỈ' },
    ],
  },
}

function displayValue(key, value) {
  if (value == null || value === '') return '—'
  if (['price', 'purchasePrice'].includes(key)) return money.format(value)
  return String(value)
}

export default function CrudModule({ moduleKey, auth }) {
  const config = modules[moduleKey]
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!auth) return undefined
    const controller = new AbortController()
    axios.get(config.path, { auth, signal: controller.signal })
      .then((response) => {
        setRows(response.data)
        setMessage('')
      })
      .catch((error) => {
        if (!axios.isCancel(error)) setMessage(error.response?.data?.detail || 'Không tải được dữ liệu.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false)
      })
    return () => controller.abort()
  }, [auth, config.path])

  const normalizedQuery = query.trim().toLocaleLowerCase('vi')
  const visibleRows = rows.filter((row) => config.columns.some(({ key }) => String(row[key] ?? '').toLocaleLowerCase('vi').includes(normalizedQuery)))

  function openCreate() {
    setMessage('')
    setForm(Object.fromEntries(config.fields.map(({ key }) => [key, ''])))
    setEditor({ mode: 'create', id: null })
  }

  function openEdit(row) {
    setMessage('')
    setForm(Object.fromEntries(config.fields.map(({ key }) => [key, row[key] ?? ''])))
    setEditor({ mode: 'edit', id: row.id })
  }

  async function reload() {
    setBusy(true)
    try {
      const response = await axios.get(config.path, { auth })
      setRows(response.data)
      setMessage('')
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Không tải được dữ liệu.')
    } finally {
      setBusy(false)
    }
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const payload = Object.fromEntries(config.fields.map(({ key, type }) => {
      const raw = form[key]
      return [key, raw === '' ? null : type === 'number' ? Number(raw) : raw]
    }))

    try {
      if (editor.mode === 'create') await axios.post(config.path, payload, { auth })
      else await axios.put(`${config.path}/${encodeURIComponent(editor.id)}`, payload, { auth })
      setEditor(null)
      await reload()
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Không lưu được dữ liệu.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(row) {
    if (!window.confirm(`Xóa ${config.singular} ${row.id}?`)) return
    setBusy(true)
    setMessage('')
    try {
      await axios.delete(`${config.path}/${encodeURIComponent(row.id)}`, { auth })
      await reload()
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Không xóa được dữ liệu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page-content resource-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DANH MỤC QUẢN LÝ</p>
          <h1>{config.title}</h1>
          <p className="heading-note">{config.description}</p>
        </div>
        <button className="refresh-button" type="button" onClick={openCreate}>
          <span aria-hidden="true">+</span> Thêm {config.singular}
        </button>
      </div>

      {message && <div className="error-banner" role="alert">{message}</div>}

      <div className="resource-toolbar">
        <label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Tìm ${config.singular}`} /></label>
        <button className="refresh-button" type="button" onClick={reload} disabled={busy}><span aria-hidden="true">↻</span> Tải lại</button>
      </div>

      <div className="table-wrap resource-table-wrap">
        <table>
          <thead><tr>{config.columns.map(({ key, label }) => <th key={key}>{label}</th>)}<th>THAO TÁC</th></tr></thead>
          <tbody>
            {busy && rows.length === 0 && <tr><td className="table-message" colSpan={config.columns.length + 1}>Đang tải dữ liệu…</td></tr>}
            {!busy && visibleRows.map((row) => (
              <tr key={row.id}>
                {config.columns.map(({ key }) => <td key={key}>{displayValue(key, row[key])}</td>)}
                <td className="row-actions">
                  <button type="button" className="icon-action" title="Cập nhật" aria-label={`Cập nhật ${row.id}`} onClick={() => openEdit(row)}>Sửa</button>
                  <button type="button" className="icon-action danger" title="Xóa" aria-label={`Xóa ${row.id}`} onClick={() => remove(row)}>Xóa</button>
                </td>
              </tr>
            ))}
            {!busy && visibleRows.length === 0 && <tr><td className="table-message" colSpan={config.columns.length + 1}>Không có dữ liệu phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="table-footer"><span>Hiển thị {visibleRows.length} / {rows.length} bản ghi</span><span>Thao tác được lưu trực tiếp qua API</span></footer>

      {editor && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="editor-title">
            <div className="modal-heading">
              <div><p className="eyebrow">{editor.mode === 'create' ? 'TẠO BẢN GHI' : 'CHỈNH SỬA BẢN GHI'}</p><h2 id="editor-title">{editor.mode === 'create' ? `Thêm ${config.singular}` : `Cập nhật ${config.singular}`}</h2></div>
              <button className="modal-close" type="button" onClick={() => setEditor(null)} aria-label="Đóng">×</button>
            </div>
            <form className="record-form" onSubmit={save}>
              {config.fields.map(({ key, label, type = 'text', required }) => (
                <label className="form-field" key={key}>
                  <span>{label}{required && <b> *</b>}</span>
                  <input
                    type={type}
                    required={required}
                    min={type === 'number' ? 0 : undefined}
                    step={type === 'number' ? 'any' : undefined}
                    value={form[key] ?? ''}
                    disabled={key === 'id' && editor.mode === 'edit'}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  />
                </label>
              ))}
              {message && <div className="form-error" role="alert">{message}</div>}
              <div className="form-actions">
                <button className="cancel-button" type="button" onClick={() => setEditor(null)}>Hủy</button>
                <button className="save-button" type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

