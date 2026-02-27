import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:logger/core/api_client.dart';
import 'package:logger/models/availability.dart';
import 'package:logger/services/periods_service.dart';
import 'package:logger/widgets/dialogs/calendar_dialog.dart';

// CI (GitHub Actions) uses the official Flutter SDK where framework and engine
// versions match. Local Arch Linux AUR packages have a version mismatch
// (framework 3.38.x vs engine 3.32.x) causing a Dart VM SIGABRT during
// semantics processing of the CalendarDialog widget tree.
// These tests run in CI; skip locally to avoid the crash.
// To force-run locally: CI=true flutter test test/widgets/calendar_dialog_test.dart
final _skipLocally = !Platform.environment.containsKey('CI');

class FakePeriodsService extends PeriodsService {
  FakePeriodsService({
    required this.availability,
    this.throwOnLoad = false,
  }) : super(
          apiClient: ApiClient(
            baseUrl: 'http://localhost',
            getAccessToken: () async => '',
          ),
        );

  final AvailabilityResponse availability;
  final bool throwOnLoad;

  @override
  Future<AvailabilityResponse> getAvailability(String month) async {
    if (throwOnLoad) {
      throw Exception('availability failed');
    }
    return availability;
  }
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await initializeDateFormatting('es_ES');
  });

  testWidgets('unavailable date shows styling and feedback',
      skip: _skipLocally, (tester) async {
    // Jan 5 is NOT in available dates, so it should be unavailable
    final service = FakePeriodsService(
      availability: AvailabilityResponse(
        currentPeriod: DateRange(
          startDate: '2026-02-01',
          endDate: '2026-02-28',
        ),
        availableDates: [
          DateRange(
            startDate: '2026-01-01',
            endDate: '2026-01-04',
          ),
          DateRange(
            startDate: '2026-01-06',
            endDate: '2026-01-31',
          ),
        ],
      ),
    );

    await _pumpDialog(tester, service, DateTime(2026, 1, 1));

    final unavailableText = find.byWidgetPredicate((widget) {
      if (widget is Text && widget.data == '5') {
        return widget.style?.decoration == TextDecoration.lineThrough;
      }
      return false;
    });
    expect(unavailableText, findsOneWidget);
    expect(find.byIcon(Icons.block), findsWidgets);

    await tester.tap(find.text('5'));
    await tester.pump();
    expect(
      find.text('Esta fecha no está disponible para registro'),
      findsOneWidget,
    );
  });

  testWidgets('unavailable date in month with no available dates',
      skip: _skipLocally, (tester) async {
    // December 2025 has no available dates
    final service = FakePeriodsService(
      availability: AvailabilityResponse(
        currentPeriod: DateRange(
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        ),
        availableDates: const [],
      ),
    );

    await _pumpDialog(tester, service, DateTime(2025, 12, 1));

    final blockedText = find.byWidgetPredicate((widget) {
      if (widget is Text && widget.data == '15') {
        return widget.style?.decoration == TextDecoration.lineThrough;
      }
      return false;
    });
    expect(blockedText, findsOneWidget);
    expect(find.byIcon(Icons.block), findsWidgets);

    await tester.tap(find.text('15'));
    await tester.pump();
    expect(
      find.text('Esta fecha no está disponible para registro'),
      findsOneWidget,
    );
  });

  testWidgets('API failure shows warning banner', skip: _skipLocally,
      (tester) async {
    final service = FakePeriodsService(
      availability: AvailabilityResponse(
        currentPeriod: null,
        availableDates: const [],
      ),
      throwOnLoad: true,
    );

    await _pumpDialog(tester, service, DateTime(2026, 1, 1));

    expect(
      find.text(
          'No se pudo cargar la disponibilidad. Algunas fechas podrían no estar disponibles.'),
      findsOneWidget,
    );
  });

  testWidgets('no available dates blocks all dates', skip: _skipLocally,
      (tester) async {
    final service = FakePeriodsService(
      availability: AvailabilityResponse(
        currentPeriod: null,
        availableDates: const [],
      ),
    );

    await _pumpDialog(tester, service, DateTime(2026, 1, 1));

    expect(find.byIcon(Icons.block), findsWidgets);

    await tester.tap(find.text('5'));
    await tester.pump();
    expect(
      find.text('Esta fecha no está disponible para registro'),
      findsOneWidget,
    );
  });

  testWidgets('available dates are selectable', skip: _skipLocally,
      (tester) async {
    final service = FakePeriodsService(
      availability: AvailabilityResponse(
        currentPeriod: DateRange(
          startDate: '2026-02-22',
          endDate: '2026-03-07',
        ),
        availableDates: [
          DateRange(
            startDate: '2026-02-22',
            endDate: '2026-02-28',
          ),
        ],
      ),
    );

    await _pumpDialog(tester, service, DateTime(2026, 2, 22));

    final activeText = find.byWidgetPredicate((widget) {
      if (widget is Text && widget.data == '22') {
        return widget.style?.decoration == null;
      }
      return false;
    });
    expect(activeText, findsOneWidget);
  });
}

Widget _wrapDialog(
  PeriodsService service,
  DateTime initialDate,
) {
  return MaterialApp(
    locale: const Locale('es', 'ES'),
    localizationsDelegates: const [
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    supportedLocales: const [
      Locale('es', 'ES'),
      Locale('en', 'US'),
    ],
    home: Scaffold(
      body: CalendarDialog(
        initialDate: initialDate,
        firstDate: DateTime(2000),
        lastDate: DateTime(2100),
        periodsService: service,
      ),
    ),
  );
}

Future<void> _pumpDialog(
  WidgetTester tester,
  PeriodsService service,
  DateTime initialDate,
) async {
  await tester.binding.setSurfaceSize(const Size(600, 900));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(_wrapDialog(service, initialDate));
  await tester.pumpAndSettle();
}
