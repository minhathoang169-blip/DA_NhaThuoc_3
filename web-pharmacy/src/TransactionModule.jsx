import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function TransactionModule({ kind, auth }) {
  const isSale = kind === 'sales'
  const path = isSale ? '/api/sales' : '/api/imports'
  const title = isSale ? 'Bán hàng' : 'Nhập hàng'
  const [rows, setRows] = useState([])
  const [batches, setBatches] = useState([])
  const [people, setPeople] = useState([])
  const [partners, setPartners] = useState([])
  const [form, setForm] = useState({ id: '', partnerId: '', employeeId: '', transactionDate: today(), lines: [{ batchId: '', quantity: 1, unitPrice: 0 }] })
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [batchSearch, setBatchSearch] = useState('')

  const reload = useCallback(async (signal) => {
    const [transactions, batchList] = await Promise.all([
      axios.get(path, { auth, signal }),
      axios.get('/api/batches', { auth, signal }),
    ])
    setRows(transactions.data)
    setBatches(batchList.data)
  }, [auth, path])

  useEffect(() => {
    const controller = new AbortController()
    const partnerPath = isSale ? '/api/customers' : '/api/suppliers'
    Promise.all([
      axios.get(path, { auth, signal: controller.signal }),
      axios.get('/api/batches', { auth, signal: controller.signal }),
      axios.get('/api/employees', { auth, signal: controller.signal }),
      axios.get(partnerPath, { auth, signal: controller.signal }),
    ]).then(([transactionResponse, batchResponse, employeeResponse, partnerResponse]) => {
      setRows(transactionResponse.data)
      setBatches(batchResponse.data)
      setPeople(employeeResponse.data)
      setPartners(partnerResponse.data)
      setMessage('')
    }).catch((error) => {
      if (!axios.isCancel(error)) setMessage(error.response?.data?.detail || 'Không tải được dữ liệu giao dịch.')
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [auth, path, isSale])

  const selectableBatches = useMemo(() => batches.filter((batch) => {
    const notExpired = batch.expiryDate >= today()
    return notExpired && (!isSale || batch.quantity > 0)
  }), [batches, isSale])
  const filteredBatches = useMemo(() => {
    const query = batchSearch.trim().toLocaleLowerCase('vi')
    return selectableBatches.filter((batch) => `${batch.medicineName} ${batch.id}`.toLocaleLowerCase('vi').includes(query))
  }, [batchSearch, selectableBatches])
  const totalAmount = form.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0)

  function addLine() {
    setForm((current) => ({ ...current, lines: [...current.lines, { batchId: '', quantity: 1, unitPrice: 0 }] }))
  }

  function removeLine(index) {
    setForm((current) => ({ ...current, lines: current.lines.filter((_, lineIndex) => lineIndex !== index) }))
  }

  function updateLine(index, field, value) {
    setForm((current) => ({ ...current, lines: current.lines.map((line, lineIndex) => {
      if (lineIndex !== index) return line
      const updated = { ...line, [field]: value }
      if (field === 'batchId') {
        const batch = batches.find((item) => item.id === value)
        if (batch) updated.unitPrice = isSale
          ? Number(batch.salePrice ?? 0)
          : Number(batch.purchasePrice ?? 0)
      }
      return updated
    }) }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    const payload = {
      id: form.id.trim(),
      employeeId: form.employeeId,
      transactionDate: form.transactionDate,
      lines: form.lines.map((line) => ({ batchId: line.batchId, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })),
      ...(isSale ? { customerId: form.partnerId || null } : { supplierId: form.partnerId }),
    }
    try {
      await axios.post(path, payload, { auth })
      setForm({ id: '', partnerId: '', employeeId: '', transactionDate: today(), lines: [{ batchId: '', quantity: 1, unitPrice: 0 }] })
      await reload()
      window.dispatchEvent(new Event('pharmacy-data-changed'))
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Không lưu được giao dịch.')
    } finally { setSaving(false) }
  }

  return (
    <section className="page-content resource-page">
      <div className="page-heading"><div><p className="eyebrow">VẬN HÀNH KHO</p><h1>{title}</h1><p className="heading-note">{isSale ? 'Ghi nhận bán hàng theo từng lô và tự động trừ tồn kho.' : 'Ghi nhận hàng nhập từ nhà cung cấp và tự động cộng tồn kho.'}</p></div></div>
      {message && <div className="error-banner" role="alert">{message}</div>}
      <form className="transaction-form" onSubmit={submit}>
        {isSale && <div className="pos-mobile-tools">
          <label className="pos-search"><span aria-hidden="true">⌕</span><input value={batchSearch} onChange={(event) => setBatchSearch(event.target.value)} placeholder="Tìm thuốc hoặc mã lô" aria-label="Tìm thuốc hoặc mã lô" /></label>
          <span>{selectableBatches.length} lô còn hàng</span>
        </div>}
        <div className="transaction-fields">
          <label className="form-field"><span>Mã {isSale ? 'đơn bán' : 'phiếu nhập'} *</span><input required maxLength="50" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} /></label>
          <label className="form-field"><span>{isSale ? 'Khách hàng' : 'Nhà cung cấp'}{!isSale && ' *'}</span><select required={!isSale} value={form.partnerId} onChange={(event) => setForm({ ...form, partnerId: event.target.value })}><option value="">{isSale ? 'Khách lẻ' : 'Chọn nhà cung cấp'}</option>{partners.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select></label>
          <label className="form-field"><span>Nhân viên *</span><select required value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}><option value="">Chọn nhân viên</option>{people.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select></label>
          <label className="form-field"><span>Ngày giao dịch *</span><input type="date" required value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} /></label>
        </div>
        <div className="transaction-lines-heading"><div><p className="eyebrow">{isSale ? 'GIỎ HÀNG' : 'CHI TIẾT PHIẾU'}</p><h2>Chi tiết hàng hóa</h2></div><button className="icon-action" type="button" onClick={addLine}>+ Thêm dòng</button></div>
        <div className="transaction-lines">
          {form.lines.map((line, index) => <div className="transaction-line" key={index}>
            <label className="form-field"><span>{isSale ? `Sản phẩm ${String(index + 1).padStart(2, '0')} · Lô thuốc *` : 'Lô thuốc *'}</span><select required value={line.batchId} onChange={(event) => updateLine(index, 'batchId', event.target.value)}><option value="">Chọn lô thuốc</option>{filteredBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.medicineName} · {batch.id} · còn {batch.quantity}</option>)}</select></label>
            <label className="form-field"><span>Số lượng *</span><input type="number" min="1" step="1" required value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} /></label>
            <label className="form-field"><span>Đơn giá (₫) *</span><input type="number" min="0" step="1" required value={line.unitPrice} onChange={(event) => updateLine(index, 'unitPrice', event.target.value)} /></label>
            <span className="pos-line-total">Thành tiền <strong>{money.format(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</strong></span>
            {form.lines.length > 1 && <button className="icon-action danger remove-line" type="button" aria-label="Xóa dòng hàng" onClick={() => removeLine(index)}>Xóa dòng</button>}
          </div>)}
        </div>
        <div className="transaction-form-footer transaction-desktop-footer"><span>Tổng dự kiến <strong>{money.format(totalAmount)}</strong></span><button className="save-button" type="submit" disabled={saving || selectableBatches.length === 0}>{saving ? 'Đang lưu…' : `Ghi nhận ${isSale ? 'bán hàng' : 'nhập hàng'}`}</button></div>
        {isSale && <div className="transaction-mobile-footer"><div><span>Tổng thanh toán</span><strong>{money.format(totalAmount)}</strong></div><button className="save-button" type="submit" disabled={saving || selectableBatches.length === 0}>{saving ? 'Đang lưu…' : 'Hoàn tất bán hàng'}</button></div>}
      </form>
      <div className="section-heading"><div><p className="eyebrow">LỊCH SỬ</p><h2>{isSale ? 'Đơn bán gần đây' : 'Phiếu nhập gần đây'}</h2></div><span className="updated-at">{rows.length} giao dịch</span></div>
      {isSale && <div className="pos-mobile-history">{busy ? <div className="pos-empty">Đang tải giao dịch…</div> : rows.length === 0 ? <div className="pos-empty">Chưa có đơn bán nào.</div> : rows.map((row) => <article className="pos-history-card" key={row.id}>
        <button type="button" className="pos-history-summary" aria-expanded={expandedId === row.id} onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}>
          <span className="pos-order-mark">{row.lines.length}</span><span className="pos-history-main"><strong>{row.id}</strong><small>{row.partnerName} · {row.transactionDate}</small></span><span className="pos-history-amount">{money.format(row.totalAmount)}</span>
        </button>
        {expandedId === row.id && <div className="pos-history-details">{row.lines.map((line) => <div key={line.batchId}><span>{line.medicineName} · lô {line.batchId}</span><span>{line.quantity} × {money.format(line.unitPrice)}</span><strong>{money.format(line.total)}</strong></div>)}<small>Nhân viên: {row.employeeName}</small></div>}
      </article>)}</div>}
      <div className={`table-wrap resource-table-wrap ${isSale ? 'sales-history-table' : ''}`}><table><thead><tr><th>MÃ</th><th>{isSale ? 'KHÁCH HÀNG' : 'NHÀ CUNG CẤP'}</th><th>NHÂN VIÊN</th><th>NGÀY</th><th>SỐ DÒNG</th><th>TỔNG TIỀN</th></tr></thead><tbody>
        {busy && <tr><td className="table-message" colSpan="6">Đang tải giao dịch…</td></tr>}
        {!busy && rows.map((row) => <Fragment key={row.id}>
          <tr>
            <td><button className="transaction-id" type="button" aria-expanded={expandedId === row.id} onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}>{row.id}</button></td>
            <td>{row.partnerName}</td><td>{row.employeeName}</td><td>{row.transactionDate}</td><td>{row.lines.length}</td><td>{money.format(row.totalAmount)}</td>
          </tr>
          {expandedId === row.id && <tr key={`${row.id}-detail`}><td colSpan="6" className="transaction-detail-cell"><div className="transaction-detail-list">{row.lines.map((line) => <div key={line.batchId}><span>{line.medicineName} · lô {line.batchId}</span><span>{line.quantity} × {money.format(line.unitPrice)}</span><strong>{money.format(line.total)}</strong></div>)}</div></td></tr>}
        </Fragment>)}
        {!busy && rows.length === 0 && <tr><td className="table-message" colSpan="6">Chưa có giao dịch nào.</td></tr>}
      </tbody></table></div>
      <footer className="table-footer"><span>Giao dịch đã lưu là lịch sử kho, không thể sửa/xóa.</span><span>Số tồn được cập nhật cùng giao dịch.</span></footer>
    </section>
  )
}
