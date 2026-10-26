import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/order_tracking_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/account_screen.dart';
import 'services/cart_manager.dart';
import 'services/pharmacy_api_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PharmacyMobileApp());
}

class PharmacyMobileApp extends StatelessWidget {
  const PharmacyMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nhà Thuốc Dược An - GPP',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    HomeScreen(),
    OrderTrackingScreen(),
    CartScreen(),
    AccountScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: AnimatedBuilder(
        animation: Listenable.merge([CartManager(), PharmacyApiService()]),
        builder: (context, _) {
          final cartCount = CartManager().totalItemCount;
          final isLoggedIn = PharmacyApiService().isLoggedIn;

          return NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
            backgroundColor: Colors.white,
            elevation: 8,
            indicatorColor: AppTheme.primary.withOpacity(0.12),
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.medication_outlined),
                selectedIcon: Icon(Icons.medication, color: AppTheme.primary),
                label: 'Mua thuốc',
              ),
              const NavigationDestination(
                icon: Icon(Icons.receipt_long_outlined),
                selectedIcon: Icon(Icons.receipt_long, color: AppTheme.primary),
                label: 'Tra cứu đơn',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: cartCount > 0,
                  label: Text('$cartCount'),
                  child: const Icon(Icons.shopping_bag_outlined),
                ),
                selectedIcon: Badge(
                  isLabelVisible: cartCount > 0,
                  label: Text('$cartCount'),
                  child: const Icon(Icons.shopping_bag, color: AppTheme.primary),
                ),
                label: 'Giỏ hàng',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: isLoggedIn,
                  backgroundColor: AppTheme.success,
                  child: const Icon(Icons.person_outline),
                ),
                selectedIcon: const Icon(Icons.person, color: AppTheme.primary),
                label: 'Tài khoản',
              ),
            ],
          );
        },
      ),
    );
  }
}
