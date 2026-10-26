import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CustomerResponse,
  CustomerRequest,
  EmployeeResponse,
  EmployeeRequest,
  SupplierResponse,
  SupplierRequest,
} from '../types/pharmacy';
import {
  Users,
  UserCog,
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Save,
  X,
  CheckCircle2,
  ShieldAlert,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
} from 'lucide-react';

type ActiveTab = 'customers' | 'employees' | 'suppliers';

export function CatalogManagementPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  // Determine active tab from current URL path
  const activeTab: ActiveTab = useMemo(() => {
    if (location.pathname.includes('/employees')) return 'employees';
    if (location.pathname.includes('/suppliers')) return 'suppliers';
    return 'customers';
  }, [location.pathname]);

  const [searchTerm, setSearchTerm] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Forms matching exact Java records
  const [customerForm, setCustomerForm] = useState<CustomerRequest>({
    id: '',
    name: '',
    phone: '',
    address: '',
  });
  const [employeeForm, setEmployeeForm] = useState<EmployeeRequest>({
    id: '',
    name: '',
    phone: '',
    birthDate: null,
    role: 'Dược sĩ',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [createAccountForEmp, setCreateAccountForEmp] = useState<boolean>(true);
  const [empUsername, setEmpUsername] = useState<string>('');
  const [empPassword, setEmpPassword] = useState<string>('123456');
  const [empSystemRole, setEmpSystemRole] = useState<'PHARMACIST' | 'ADMIN'>('PHARMACIST');
  const [supplierForm, setSupplierForm] = useState<SupplierRequest>({
    id: '',
    name: '',
    phone: '',
    address: '',
  });

  // 1. Queries
  const customersQuery = useQuery<CustomerResponse[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const employeesQuery = useQuery<EmployeeResponse[]>({
    queryKey: ['employees'],
    enabled: isAdmin,
    queryFn: async () => {
      const res = await api.get('/employees');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const suppliersQuery = useQuery<SupplierResponse[]>({
    queryKey: ['suppliers'],
    enabled: isAdmin,
    queryFn: async () => {
      const res = await api.get('/suppliers');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // 2. Customer Mutations (/api/customers)
  const saveCustomerMutation = useMutation({
    mutationFn: async (payload: CustomerRequest) => {
      if (modalMode === 'create') {
        const res = await api.post<CustomerResponse>('/customers', payload);
        return res.data;
      } else {
        const res = await api.put<CustomerResponse>(`/customers/${encodeURIComponent(payload.id)}`, payload);
        return res.data;
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      setBanner({
        type: 'success',
        text: `Đã ${modalMode === 'create' ? 'thêm' : 'cập nhật'} khách hàng "${saved.name}" (${saved.id}) trong bảng KhachHang!`,
      });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu thông tin khách hàng.');
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${encodeURIComponent(id)}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteTargetId(null);
      setBanner({ type: 'success', text: `Đã xóa khách hàng mã "${id}" khỏi bảng KhachHang!` });
    },
    onError: (err: any) => {
      setDeleteTargetId(null);
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Không thể xóa khách hàng này.',
      });
    },
  });

  // 3. Employee Mutations (/api/employees + optional /api/v1/auth/register)
  const saveEmployeeMutation = useMutation({
    mutationFn: async (payload: EmployeeRequest) => {
      let saved: EmployeeResponse;
      if (modalMode === 'create') {
        const res = await api.post<EmployeeResponse>('/employees', payload);
        saved = res.data;
      } else {
        const res = await api.put<EmployeeResponse>(`/employees/${encodeURIComponent(payload.id)}`, payload);
        saved = res.data;
      }

      let createdAccountInfo: string | null = null;
      if (createAccountForEmp && empUsername.trim() && empPassword.trim()) {
        await api.post('/v1/auth/register', {
          username: empUsername.trim(),
          password: empPassword,
          fullName: payload.name,
          phone: payload.phone || null,
          email: `${empUsername.trim().toLowerCase()}@nhathuoc.vn`,
          role: empSystemRole,
        });
        createdAccountInfo = `Tài khoản: "${empUsername.trim()}" | Mật khẩu: "${empPassword}" | Quyền: ${empSystemRole}`;
      }

      return { saved, createdAccountInfo };
    },
    onSuccess: ({ saved, createdAccountInfo }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
      setBanner({
        type: 'success',
        text: createdAccountInfo
          ? `Đã lưu nhân viên "${saved.name}" (${saved.id}) vào bảng NhanVien & cấp tài khoản vào bảng users (${createdAccountInfo})!`
          : `Đã ${modalMode === 'create' ? 'thêm' : 'cập nhật'} nhân viên "${saved.name}" (${saved.id}) trong bảng NhanVien!`,
      });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu thông tin nhân viên hoặc tài khoản đăng nhập đã tồn tại.');
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${encodeURIComponent(id)}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteTargetId(null);
      setBanner({ type: 'success', text: `Đã xóa nhân viên mã "${id}" khỏi bảng NhanVien!` });
    },
    onError: (err: any) => {
      setDeleteTargetId(null);
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Không thể xóa nhân viên này.',
      });
    },
  });

  // 4. Supplier Mutations (/api/suppliers)
  const saveSupplierMutation = useMutation({
    mutationFn: async (payload: SupplierRequest) => {
      if (modalMode === 'create') {
        const res = await api.post<SupplierResponse>('/suppliers', payload);
        return res.data;
      } else {
        const res = await api.put<SupplierResponse>(`/suppliers/${encodeURIComponent(payload.id)}`, payload);
        return res.data;
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
      setBanner({
        type: 'success',
        text: `Đã ${modalMode === 'create' ? 'thêm' : 'cập nhật'} nhà cung cấp "${saved.name}" (${saved.id}) trong bảng NhaCungCap!`,
      });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Lỗi khi lưu thông tin nhà cung cấp.');
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${encodeURIComponent(id)}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTargetId(null);
      setBanner({ type: 'success', text: `Đã xóa nhà cung cấp mã "${id}" khỏi bảng NhaCungCap!` });
    },
    onError: (err: any) => {
      setDeleteTargetId(null);
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Không thể xóa nhà cung cấp này.',
      });
    },
  });

  // Filtered Lists (with safe String conversion)
  const filteredCustomers = useMemo(() => {
    const list = customersQuery.data || [];
    const kw = searchTerm.trim().toLowerCase();
    return list.filter(
      (c) =>
        !kw ||
        String(c.id || '').toLowerCase().includes(kw) ||
        String(c.name || '').toLowerCase().includes(kw) ||
        String(c.phone || '').toLowerCase().includes(kw) ||
        String(c.address || '').toLowerCase().includes(kw)
    );
  }, [customersQuery.data, searchTerm]);

  const filteredEmployees = useMemo(() => {
    const list = employeesQuery.data || [];
    const kw = searchTerm.trim().toLowerCase();
    return list.filter(
      (e) =>
        !kw ||
        String(e.id || '').toLowerCase().includes(kw) ||
        String(e.name || '').toLowerCase().includes(kw) ||
        String(e.role || '').toLowerCase().includes(kw) ||
        String(e.phone || '').toLowerCase().includes(kw)
    );
  }, [employeesQuery.data, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    const list = suppliersQuery.data || [];
    const kw = searchTerm.trim().toLowerCase();
    return list.filter(
      (s) =>
        !kw ||
        String(s.id || '').toLowerCase().includes(kw) ||
        String(s.name || '').toLowerCase().includes(kw) ||
        String(s.phone || '').toLowerCase().includes(kw) ||
        String(s.address || '').toLowerCase().includes(kw)
    );
  }, [suppliersQuery.data, searchTerm]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormError(null);
    if (activeTab === 'customers') {
      const next = (customersQuery.data?.length || 0) + 1;
      setCustomerForm({ id: `KH${String(next).padStart(3, '0')}`, name: '', phone: '', address: '' });
    } else if (activeTab === 'employees') {
      const next = (employeesQuery.data?.length || 0) + 2;
      const newId = `NV${String(next).padStart(3, '0')}`;
      setEmployeeForm({
        id: newId,
        name: '',
        phone: '',
        birthDate: '1998-01-01',
        role: 'Dược sĩ',
        startDate: new Date().toISOString().split('T')[0],
      });
      setCreateAccountForEmp(true);
      setEmpUsername(newId.toLowerCase());
      setEmpPassword('123456');
      setEmpSystemRole('PHARMACIST');
    } else {
      const next = (suppliersQuery.data?.length || 0) + 1;
      setSupplierForm({ id: `NCC${String(next).padStart(3, '0')}`, name: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (activeTab === 'customers') {
      const payload: CustomerRequest = {
        id: customerForm.id.trim(),
        name: customerForm.name.trim(),
        phone: (customerForm.phone || '').trim(),
        address: (customerForm.address || '').trim(),
      };
      if (!payload.name || payload.name.length > 50) {
        setFormError('Tên khách hàng không được trống và tối đa 50 ký tự.');
        return;
      }
      saveCustomerMutation.mutate(payload);
    } else if (activeTab === 'employees') {
      const payload: EmployeeRequest = {
        id: employeeForm.id.trim(),
        name: employeeForm.name.trim(),
        phone: (employeeForm.phone || '').trim(),
        birthDate: employeeForm.birthDate || null,
        role: (employeeForm.role || '').trim(),
        startDate: employeeForm.startDate || null,
      };
      if (!payload.name || payload.name.length > 50) {
        setFormError('Họ tên nhân viên không được trống và tối đa 50 ký tự.');
        return;
      }
      saveEmployeeMutation.mutate(payload);
    } else {
      const payload: SupplierRequest = {
        id: supplierForm.id.trim(),
        name: supplierForm.name.trim(),
        phone: (supplierForm.phone || '').trim(),
        address: (supplierForm.address || '').trim(),
      };
      if (!payload.name || payload.name.length > 50) {
        setFormError('Tên nhà cung cấp không được trống và tối đa 50 ký tự.');
        return;
      }
      saveSupplierMutation.mutate(payload);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    if (activeTab === 'customers') {
      deleteCustomerMutation.mutate(deleteTargetId);
    } else if (activeTab === 'employees') {
      deleteEmployeeMutation.mutate(deleteTargetId);
    } else {
      deleteSupplierMutation.mutate(deleteTargetId);
    }
  };

  const refreshActiveTab = () => {
    if (activeTab === 'customers') customersQuery.refetch();
    else if (activeTab === 'employees') employeesQuery.refetch();
    else suppliersQuery.refetch();
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header & Module Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            {activeTab === 'customers' ? (
              <Users className="w-5 h-5" />
            ) : activeTab === 'employees' ? (
              <UserCog className="w-5 h-5" />
            ) : (
              <Building2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'customers' && 'Quản Lý Khách Hàng (Bảng KhachHang)'}
              {activeTab === 'employees' && 'Quản Lý Nhân Viên (Bảng NhanVien)'}
              {activeTab === 'suppliers' && 'Quản Lý Nhà Cung Cấp (Bảng NhaCungCap)'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Đồng bộ trực tiếp với cơ sở dữ liệu <code className="font-mono text-slate-700">QuanLyNhaThuocDB</code> qua REST API
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab Switcher Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setSearchTerm('');
                navigate('/customers');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'customers' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Khách hàng ({customersQuery.data?.length ?? 0})
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    navigate('/employees');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'employees'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  Nhân viên ({employeesQuery.data?.length ?? 0})
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    navigate('/suppliers');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'suppliers'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Nhà cung cấp ({suppliersQuery.data?.length ?? 0})
                </button>
              </>
            )}
          </div>

          <button
            onClick={refreshActiveTab}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'customers' && 'Thêm Khách Hàng'}
            {activeTab === 'employees' && 'Thêm Nhân Viên'}
            {activeTab === 'suppliers' && 'Thêm Nhà Cung Cấp'}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {banner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            )}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'customers'
                ? 'Tìm theo Mã KH (KH001), Họ tên, Số điện thoại, Địa chỉ...'
                : activeTab === 'employees'
                ? 'Tìm theo Mã NV (NV002), Họ tên, Chức vụ, SĐT...'
                : 'Tìm theo Mã NCC (NCC001), Tên nhà cung cấp, SĐT, Địa chỉ...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          API Endpoint:{' '}
          <code className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {activeTab === 'customers'
              ? '/api/customers'
              : activeTab === 'employees'
              ? '/api/employees'
              : '/api/suppliers'}
          </code>
        </span>
      </div>

      {/* ===================================================================== */}
      {/* TABLE 1: KHACHHANG                                                    */}
      {/* ===================================================================== */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Mã KH (MaKhachHang)</th>
                <th className="py-3.5 px-5">Tên Khách Hàng (TenKhachHang)</th>
                <th className="py-3.5 px-5">Số Điện Thoại (SoDienThoai)</th>
                <th className="py-3.5 px-5">Địa Chỉ (DiaChi)</th>
                <th className="py-3.5 px-5">Ngày Tạo</th>
                <th className="py-3.5 px-5 text-right">Thao tác CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {customersQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Đang tải dữ liệu bảng KhachHang...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {cust.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{cust.name}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        {cust.phone || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {cust.address || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-500">
                      {cust.createdAt || '—'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setModalMode('edit');
                            setFormError(null);
                            setCustomerForm({
                              id: cust.id,
                              name: cust.name || '',
                              phone: cust.phone || '',
                              address: cust.address || '',
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Sửa khách hàng"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(cust.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Xóa khách hàng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TABLE 2: NHANVIEN                                                     */}
      {/* ===================================================================== */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Mã NV (MaNhanVien)</th>
                <th className="py-3.5 px-5">Họ và Tên (TenNhanVien)</th>
                <th className="py-3.5 px-5">Số Điện Thoại</th>
                <th className="py-3.5 px-5">Chức Vụ (VaiTro)</th>
                <th className="py-3.5 px-5">Ngày Sinh / Ngày Vào Làm</th>
                <th className="py-3.5 px-5 text-right">Thao tác CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {employeesQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Đang tải dữ liệu bảng NhanVien...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Không tìm thấy nhân viên nào.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                        {emp.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{emp.name}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Phone className="w-3.5 h-3.5 text-indigo-600" />
                        {emp.phone || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Briefcase className="w-3.5 h-3.5" />
                        {emp.role || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        NS: {emp.birthDate || '—'} | VL: {emp.startDate || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setModalMode('edit');
                            setFormError(null);
                            setEmployeeForm({
                              id: emp.id,
                              name: emp.name || '',
                              phone: emp.phone || '',
                              birthDate: emp.birthDate || null,
                              role: emp.role || '',
                              startDate: emp.startDate || null,
                            });
                            setCreateAccountForEmp(false);
                            setEmpUsername(emp.id.toLowerCase());
                            setEmpPassword('123456');
                            setEmpSystemRole('PHARMACIST');
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Sửa nhân viên"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(emp.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Xóa nhân viên"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TABLE 3: NHACUNGCAP                                                   */}
      {/* ===================================================================== */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Mã NCC (MaNhaCungCap)</th>
                <th className="py-3.5 px-5">Tên Nhà Cung Cấp (TenNhaCungCap)</th>
                <th className="py-3.5 px-5">Số Điện Thoại Liên Hệ</th>
                <th className="py-3.5 px-5">Địa Chỉ</th>
                <th className="py-3.5 px-5 text-right">Thao tác CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {suppliersQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    Đang tải dữ liệu bảng NhaCungCap...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    Không tìm thấy nhà cung cấp nào.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        {sup.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{sup.name}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Phone className="w-3.5 h-3.5 text-purple-600" />
                        {sup.phone || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {sup.address || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setModalMode('edit');
                            setFormError(null);
                            setSupplierForm({
                              id: sup.id,
                              name: sup.name || '',
                              phone: sup.phone || '',
                              address: sup.address || '',
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Sửa nhà cung cấp"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(sup.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Xóa nhà cung cấp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL CREATE / EDIT ENTITY                                            */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {modalMode === 'create' ? 'Thêm Mới' : 'Cập Nhật'}{' '}
                {activeTab === 'customers'
                  ? 'Khách Hàng (KhachHang)'
                  : activeTab === 'employees'
                  ? 'Nhân Viên (NhanVien)'
                  : 'Nhà Cung Cấp (NhaCungCap)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {formError}
                </div>
              )}

              {activeTab === 'customers' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã Khách Hàng (<code className="font-mono">MaKhachHang</code>) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      disabled={modalMode === 'edit'}
                      value={customerForm.id}
                      onChange={(e) => setCustomerForm({ ...customerForm, id: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Khách Hàng (<code className="font-mono">TenKhachHang</code> &le; 50 ký tự) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số Điện Thoại (<code className="font-mono">SoDienThoai</code> &le; 20 ký tự)
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      placeholder="VD: 0912345678"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Địa Chỉ (<code className="font-mono">DiaChi</code> &le; 50 ký tự)
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={customerForm.address}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      placeholder="Nhập địa chỉ..."
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </>
              )}

              {activeTab === 'employees' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã Nhân Viên (<code className="font-mono">MaNhanVien</code>) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      disabled={modalMode === 'edit'}
                      value={employeeForm.id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmployeeForm({ ...employeeForm, id: val });
                        if (modalMode === 'create') {
                          setEmpUsername(val.trim().toLowerCase());
                        }
                      }}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và Tên (<code className="font-mono">TenNhanVien</code> &le; 50 ký tự) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={employeeForm.name}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số Điện Thoại
                      </label>
                      <input
                        type="text"
                        maxLength={20}
                        value={employeeForm.phone}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Chức Vụ (<code className="font-mono">VaiTro</code>) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={50}
                        value={employeeForm.role}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                        placeholder="VD: Dược sĩ"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngày Sinh
                      </label>
                      <input
                        type="date"
                        value={employeeForm.birthDate || ''}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, birthDate: e.target.value || null })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngày Vào Làm
                      </label>
                      <input
                        type="date"
                        value={employeeForm.startDate || ''}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, startDate: e.target.value || null })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Cấp tài khoản đăng nhập hệ thống (bảng users) */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAccountForEmp}
                        onChange={(e) => setCreateAccountForEmp(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-xs font-extrabold text-blue-900">
                        🔑 Cấp tài khoản đăng nhập hệ thống (Lưu vào bảng <code className="font-mono">users</code>)
                      </span>
                    </label>

                    {createAccountForEmp && (
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Tài khoản (<code className="font-mono">username</code>) *
                            </label>
                            <input
                              type="text"
                              required={createAccountForEmp}
                              value={empUsername}
                              onChange={(e) => setEmpUsername(e.target.value)}
                              placeholder="VD: nv004"
                              className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Mật khẩu (<code className="font-mono">password</code>) *
                            </label>
                            <input
                              type="text"
                              required={createAccountForEmp}
                              value={empPassword}
                              onChange={(e) => setEmpPassword(e.target.value)}
                              placeholder="VD: 123456"
                              className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Quyền truy cập Web Portal (<code className="font-mono">role</code>)
                          </label>
                          <select
                            value={empSystemRole}
                            onChange={(e) => setEmpSystemRole(e.target.value as 'PHARMACIST' | 'ADMIN')}
                            className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-800"
                          >
                            <option value="PHARMACIST">PHARMACIST — Dược sĩ bán hàng POS, Quản lý Lô & Đơn hàng</option>
                            <option value="ADMIN">ADMIN — Quản trị viên toàn quyền</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'suppliers' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã Nhà Cung Cấp (<code className="font-mono">MaNhaCungCap</code>) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      disabled={modalMode === 'edit'}
                      value={supplierForm.id}
                      onChange={(e) => setSupplierForm({ ...supplierForm, id: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Nhà Cung Cấp (<code className="font-mono">TenNhaCungCap</code> &le; 50 ký tự) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số Điện Thoại (<code className="font-mono">SoDienThoai</code> &le; 20 ký tự)
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      placeholder="VD: 0283812345"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Địa Chỉ (<code className="font-mono">DiaChi</code> &le; 50 ký tự)
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={supplierForm.address}
                      onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                      placeholder="Nhập địa chỉ nhà cung cấp..."
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  Lưu CSDL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL CONFIRM DELETE                                                  */}
      {/* ===================================================================== */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận xóa bản ghi</h3>
                <p className="text-xs text-slate-500">
                  Mã bản ghi: <strong className="font-mono text-slate-800">{deleteTargetId}</strong>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn xóa bản ghi này khỏi cơ sở dữ liệu SQL Server?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogManagementPage;
