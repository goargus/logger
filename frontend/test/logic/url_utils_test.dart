import 'package:flutter_test/flutter_test.dart';
import 'package:logger/utils/url_utils.dart';

void main() {
  group('stripAuthCallbackParams', () {
    test('removes code and state params from callback URL', () {
      final uri =
          Uri.parse('http://localhost:8080/?code=abc123&state=1234567890');
      expect(stripAuthCallbackParams(uri), equals('/'));
    });

    test('preserves other query params', () {
      final uri = Uri.parse(
          'http://localhost:8080/?code=abc&state=xyz&tab=reports&view=monthly');
      expect(stripAuthCallbackParams(uri), equals('/?tab=reports&view=monthly'));
    });

    test('preserves path when auth params are removed', () {
      final uri =
          Uri.parse('http://localhost:8080/dashboard?code=abc&state=xyz');
      expect(stripAuthCallbackParams(uri), equals('/dashboard'));
    });

    test('returns URI unchanged when no auth params present', () {
      final uri =
          Uri.parse('http://localhost:8080/dashboard?tab=reports');
      expect(stripAuthCallbackParams(uri), equals('/dashboard?tab=reports'));
    });

    test('preserves fragment', () {
      final uri =
          Uri.parse('http://localhost:8080/?code=abc&state=xyz#section');
      expect(stripAuthCallbackParams(uri), equals('/#section'));
    });

    test('handles URL with only code (no state)', () {
      final uri = Uri.parse('http://localhost:8080/?code=abc&other=val');
      expect(stripAuthCallbackParams(uri), equals('/?other=val'));
    });

    test('handles URL without explicit path', () {
      final uri = Uri.parse('http://localhost:8080?code=abc&state=xyz');
      // Uri without explicit path has empty path; result is empty string
      // (browser resolves this relative to current origin as root)
      expect(stripAuthCallbackParams(uri), equals(''));
    });
  });
}
