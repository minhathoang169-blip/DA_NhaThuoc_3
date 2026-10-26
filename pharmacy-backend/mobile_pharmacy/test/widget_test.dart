import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_pharmacy/main.dart';

void main() {
  testWidgets('PharmacyMobileApp renders navigation and branding smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const PharmacyMobileApp());

    // Verify app brand and 4 bottom navigation tabs are rendered
    expect(find.text('DƯỢC AN'), findsOneWidget);
    expect(find.text('NHÀ THUỐC GPP'), findsOneWidget);
    expect(find.text('Mua thuốc'), findsOneWidget);
    expect(find.text('Tra cứu đơn'), findsOneWidget);
    expect(find.text('Giỏ hàng'), findsOneWidget);
    expect(find.text('Tài khoản'), findsOneWidget);
  });
}
