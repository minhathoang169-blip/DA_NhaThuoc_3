import 'package:flutter/material.dart';
import '../models/medicine.dart';
import '../services/pharmacy_api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/medicine_card.dart';
import '../widgets/cart_badge.dart';
import '../config/api_config.dart';
import 'order_tracking_screen.dart';
import 'medicine_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Medicine> _allMedicines = [];
  List<Medicine> _filteredMedicines = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _selectedCategory = 'ALL';

  final List<Map<String, String>> _categories = [
    {'id': 'ALL', 'label': 'Tất cả thuốc', 'icon': '💊'},
    {'id': 'ANTIBIOTIC', 'label': 'Kháng sinh', 'icon': '🦠'},
    {'id': 'PAIN', 'label': 'Giảm đau - Hạ sốt', 'icon': '🌡️'},
    {'id': 'DIGESTIVE', 'label': 'Tiêu hóa - Dạ dày', 'icon': '🩺'},
    {'id': 'CARDIO', 'label': 'Tim mạch - Huyết áp', 'icon': '❤️'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchMedicines();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchMedicines({String query = ''}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await PharmacyApiService().getMedicines(query: query);
      if (mounted) {
        setState(() {
          _allMedicines = list;
          _applyFilters();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _applyFilters() {
    final query = _searchController.text.toLowerCase().trim();
    _filteredMedicines = _allMedicines.filter((m) {
      final matchesQuery = query.isEmpty ||
          m.name.toLowerCase().contains(query) ||
          (m.activeIngredientName?.toLowerCase().contains(query) ?? false) ||
          m.barcode.contains(query);

      if (!matchesQuery) return false;

      if (_selectedCategory == 'ALL') return true;
      if (_selectedCategory == 'ANTIBIOTIC') {
        return m.category.toLowerCase().contains('kháng sinh');
      }
      if (_selectedCategory == 'PAIN') {
        return m.category.toLowerCase().contains('giảm đau') ||
            m.category.toLowerCase().contains('hạ sốt') ||
            m.category.toLowerCase().contains('kháng viêm');
      }
      if (_selectedCategory == 'DIGESTIVE') {
        return m.category.toLowerCase().contains('tiêu hóa') ||
            m.category.toLowerCase().contains('dạ dày');
      }
      if (_selectedCategory == 'CARDIO') {
        return m.category.toLowerCase().contains('tim mạch') ||
            m.category.toLowerCase().contains('huyết áp');
      }
      return true;
    }).toList();
  }

  void _showServerSettingsModal() {
    final controller = TextEditingController(text: ApiConfig.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.dns_outlined, color: AppTheme.primary),
            SizedBox(width: 8),
            Text('Cấu Hình Máy Chủ API', style: TextStyle(fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Chọn hoặc nhập URL Backend Spring Boot:',
              style: TextStyle(fontSize: 12.5, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Base API URL',
                hintText: 'http://10.0.2.2:8080/api',
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('Android (10.0.2.2)'),
                  onPressed: () => controller.text = 'http://10.0.2.2:8080/api',
                ),
                ActionChip(
                  label: const Text('Localhost (8080)'),
                  onPressed: () => controller.text = 'http://localhost:8080/api',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              ApiConfig.setBaseUrl(controller.text);
              Navigator.of(ctx).pop();
              _fetchMedicines();
            },
            child: const Text('Lưu & Kết Nối Lại'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Text('+', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
              ),
            ),
            const SizedBox(width: 8),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('DƯỢC AN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primary)),
                Text('NHÀ THUỐC GPP', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppTheme.textMuted),
            tooltip: 'Cài đặt kết nối máy chủ',
            onPressed: _showServerSettingsModal,
          ),
          IconButton(
            icon: const Icon(Icons.receipt_long_outlined, color: AppTheme.primary),
            tooltip: 'Tra cứu đơn thuốc',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const OrderTrackingScreen()),
              );
            },
          ),
          const CartBadgeButton(),
          const SizedBox(width: 6),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchMedicines(query: _searchController.text),
        color: AppTheme.primary,
        child: CustomScrollView(
          slivers: [
            // Top GPP Banner
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F766E), Color(0xFF042F2E)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryDark.withOpacity(0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF14B8A6),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'GIAO THUỐC NHANH 2H',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF042F2E),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Đặt Thuốc Online Chuẩn GPP',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Trừ kho tự động theo hạn dùng FEFO • Dược sĩ tư vấn 24/7',
                            style: TextStyle(color: Color(0xFFCCFBF1), fontSize: 11.5),
                          ),
                        ],
                      ),
                    ),
                    const Text('🏥', style: TextStyle(fontSize: 42)),
                  ],
                ),
              ),
            ),

            // Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm thuốc theo tên, hoạt chất, mã vạch...',
                    prefixIcon: const Icon(Icons.search, color: AppTheme.primary),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _applyFilters();
                              setState(() {});
                            },
                          )
                        : null,
                  ),
                  onChanged: (val) {
                    _applyFilters();
                    setState(() {});
                  },
                ),
              ),
            ),

            // Category Chips List
            SliverToBoxAdapter(
              child: SizedBox(
                height: 48,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final cat = _categories[index];
                    final isSelected = _selectedCategory == cat['id'];
                    return FilterChip(
                      selected: isSelected,
                      showCheckmark: false,
                      avatar: Text(cat['icon']!),
                      label: Text(
                        cat['label']!,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? Colors.white : AppTheme.textMain,
                        ),
                      ),
                      backgroundColor: Colors.white,
                      selectedColor: AppTheme.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(
                          color: isSelected ? AppTheme.primary : AppTheme.border,
                        ),
                      ),
                      onSelected: (_) {
                        setState(() {
                          _selectedCategory = cat['id']!;
                          _applyFilters();
                        });
                      },
                    );
                  },
                ),
              ),
            ),

            // Product Counter & Section Title
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Danh Mục Thuốc (${_filteredMedicines.length})',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppTheme.textMain),
                    ),
                    if (_allMedicines.isNotEmpty)
                      const Text(
                        'Dữ liệu CSDL thật',
                        style: TextStyle(fontSize: 11, color: AppTheme.success, fontWeight: FontWeight.bold),
                      ),
                  ],
                ),
              ),
            ),

            // Content: Loading / Error / Empty / Grid
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(color: AppTheme.primary),
                      SizedBox(height: 12),
                      Text('Đang nạp danh mục thuốc từ máy chủ...', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                    ],
                  ),
                ),
              )
            else if (_errorMessage != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.wifi_off_outlined, color: AppTheme.error, size: 54),
                        const SizedBox(height: 14),
                        const Text(
                          'Không thể kết nối máy chủ Backend',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 12.5),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            OutlinedButton.icon(
                              icon: const Icon(Icons.settings),
                              label: const Text('Đổi IP Máy Chủ'),
                              onPressed: _showServerSettingsModal,
                            ),
                            const SizedBox(width: 10),
                            ElevatedButton.icon(
                              icon: const Icon(Icons.refresh),
                              label: const Text('Thử Lại'),
                              onPressed: () => _fetchMedicines(),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_filteredMedicines.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Text(
                    'Không tìm thấy thuốc phù hợp với từ khóa.',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.68,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final med = _filteredMedicines[index];
                      return MedicineCard(
                        medicine: med,
                        onSubstituteTap: () {
                          // Xem chi tiết & gợi ý thuốc cùng hoạt chất
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => MedicineDetailScreen(medicine: med),
                            ),
                          );
                        },
                      );
                    },
                    childCount: _filteredMedicines.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

extension _ListFilter<T> on List<T> {
  List<T> filter(bool Function(T) test) {
    final result = <T>[];
    for (var element in this) {
      if (test(element)) result.add(element);
    }
    return result;
  }
}
