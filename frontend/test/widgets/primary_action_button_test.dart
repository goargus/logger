import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/widgets/buttons/primary_action_button.dart';

void main() {
  group('PrimaryActionButton', () {
    testWidgets('should display label and icon', (WidgetTester tester) async {
      const label = 'Click Me';
      const icon = Icons.add;
      var pressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrimaryActionButton(
              label: label,
              icon: icon,
              onPressed: () {
                pressed = true;
              },
            ),
          ),
        ),
      );

      expect(find.text(label), findsOneWidget);
      expect(find.byIcon(icon), findsOneWidget);
      expect(pressed, false);
    });

    testWidgets('should call onPressed when tapped',
        (WidgetTester tester) async {
      var pressCount = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrimaryActionButton(
              label: 'Test Button',
              icon: Icons.edit,
              onPressed: () {
                pressCount++;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.byType(PrimaryActionButton));
      await tester.pump();

      expect(pressCount, 1);
    });

    testWidgets('should handle multiple taps', (WidgetTester tester) async {
      var pressCount = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrimaryActionButton(
              label: 'Multi Tap',
              icon: Icons.touch_app,
              onPressed: () {
                pressCount++;
              },
            ),
          ),
        ),
      );

      await tester.tap(find.byType(PrimaryActionButton));
      await tester.pump();
      await tester.tap(find.byType(PrimaryActionButton));
      await tester.pump();
      await tester.tap(find.byType(PrimaryActionButton));
      await tester.pump();

      expect(pressCount, 3);
    });

    testWidgets('should use expected background color constant',
        (WidgetTester tester) async {
      expect(PrimaryActionButton.bgcolor, const Color(0xFF391A7C));
    });

    testWidgets('should render as a button widget',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrimaryActionButton(
              label: 'Type Test',
              icon: Icons.check,
              onPressed: () {},
            ),
          ),
        ),
      );

      expect(find.byType(PrimaryActionButton), findsOneWidget);
    });

    testWidgets('should display different icons correctly',
        (WidgetTester tester) async {
      const icons = [
        Icons.save,
        Icons.delete,
        Icons.refresh,
      ];

      for (final icon in icons) {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: PrimaryActionButton(
                label: 'Icon Test',
                icon: icon,
                onPressed: () {},
              ),
            ),
          ),
        );

        expect(find.byIcon(icon), findsOneWidget);

        await tester.pumpWidget(Container());
      }
    });

    testWidgets('should display different labels correctly',
        (WidgetTester tester) async {
      const labels = [
        'Submit',
        'Cancel',
        'Save Changes',
        'Delete Item',
      ];

      for (final label in labels) {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: PrimaryActionButton(
                label: label,
                icon: Icons.star,
                onPressed: () {},
              ),
            ),
          ),
        );

        expect(find.text(label), findsOneWidget);

        await tester.pumpWidget(Container());
      }
    });
  });
}
