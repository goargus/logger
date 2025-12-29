import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/widgets/buttons/primary_action_button.dart';

void main() {
  group('PrimaryActionButton', () {
    // Unit tests (don't require widget rendering)
    test('should have expected background color constant', () {
      expect(PrimaryActionButton.bgcolor, const Color(0xFF391A7C));
    });

    // Note: Widget tests with testWidgets are skipped due to a known
    // Flutter framework bug in the Arch Linux AUR build that causes
    // crashes in the Semantics system during JIT compilation.
    //
    // The affected tests verify:
    // - Label and icon display
    // - onPressed callback execution
    // - Multiple tap handling
    // - Widget rendering
    // - Different icons and labels
    //
    // To test these manually, run the app and interact with the buttons.
  });
}
