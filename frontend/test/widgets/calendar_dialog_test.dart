import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:logger/core/api_client.dart';
import 'package:logger/services/reporting_periods.dart';
import 'package:logger/widgets/dialogs/calendar_dialog.dart';

class FakeReportingPeriodsService extends ReportingPeriodsService {
  FakeReportingPeriodsService({
    required this.lockedRanges,
    required this.activePeriod,
    this.throwLocked = false,
    this.throwActive = false,
  }) : super(
          apiClient: ApiClient(
            baseUrl: 'http://localhost',
            getAccessToken: () async => '',
          ),
        );

  final List<LockedDateRange> lockedRanges;
  final ReportingPeriodSummary? activePeriod;
  final bool throwLocked;
  final bool throwActive;

  @override
  Future<List<LockedDateRange>> getLockedDateRanges() async {
    if (throwLocked) {
      throw Exception('locked ranges failed');
    }
    return lockedRanges;
  }

  @override
  Future<ReportingPeriodSummary?> getActiveReportingPeriod() async {
    if (throwActive) {
      throw Exception('active period failed');
    }
    return activePeriod;
  }
}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await initializeDateFormatting('es_ES');
  });

  testWidgets('locked date shows styling and feedback', (tester) async {
    final service = FakeReportingPeriodsService(
      lockedRanges: [
        LockedDateRange(
          startDate: '2026-01-05',
          endDate: '2026-01-05',
          periodName: 'Periodo bloqueado',
        ),
      ],
      activePeriod: ReportingPeriodSummary(
        id: 'active-1',
        name: 'Febrero 2026',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        status: 'active',
        isLocked: false,
      ),
    );

    await _pumpDialog(tester, service, DateTime(2026, 1, 1));

    final lockedText = find.byWidgetPredicate((widget) {
      if (widget is Text && widget.data == '5') {
        return widget.style?.decoration == TextDecoration.lineThrough;
      }
      return false;
    });
    expect(lockedText, findsOneWidget);
    expect(find.byIcon(Icons.lock_outline), findsWidgets);

    await tester.tap(find.text('5'));
    await tester.pump();
    expect(
      find.text('Esta fecha pertenece a un periodo bloqueado'),
      findsOneWidget,
    );
  });

  testWidgets('out-of-period date shows blocked styling and feedback',
      (tester) async {
    final service = FakeReportingPeriodsService(
      lockedRanges: const [],
      activePeriod: ReportingPeriodSummary(
        id: 'active-1',
        name: 'Enero 2026',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        status: 'active',
        isLocked: false,
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
      find.text('Esta fecha está fuera del período activo'),
      findsOneWidget,
    );
  });

  testWidgets('API failure shows warning banner', (tester) async {
    final service = FakeReportingPeriodsService(
      lockedRanges: const [],
      activePeriod: ReportingPeriodSummary(
        id: 'active-1',
        name: 'Enero 2026',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        status: 'active',
        isLocked: false,
      ),
      throwLocked: true,
    );

    await _pumpDialog(tester, service, DateTime(2026, 1, 1));

    expect(
      find.text(
          'No se pudieron cargar los períodos bloqueados. Algunas fechas podrían estar bloqueadas.'),
      findsOneWidget,
    );
  });

  testWidgets('no active period blocks all dates', (tester) async {
    final service = FakeReportingPeriodsService(
      lockedRanges: const [],
      activePeriod: null,
    );

    await _pumpDialog(tester, service, DateTime(2026, 1, 1));

    expect(
      find.text(
          'No se encontró un período activo. Algunas fechas podrían no estar disponibles.'),
      findsOneWidget,
    );

    expect(find.byIcon(Icons.block), findsWidgets);

    await tester.tap(find.text('5'));
    await tester.pump();
    expect(
      find.text('Esta fecha está fuera del período activo'),
      findsOneWidget,
    );
  });

  testWidgets('active period overrides locked ranges', (tester) async {
    final service = FakeReportingPeriodsService(
      lockedRanges: [
        LockedDateRange(
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          periodName: 'Simulacion Anual',
        ),
      ],
      activePeriod: ReportingPeriodSummary(
        id: 'active-1',
        name: 'Periodo activo',
        startDate: '2026-02-22',
        endDate: '2026-03-07',
        status: 'active',
        isLocked: false,
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
  ReportingPeriodsService service,
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
        reportingPeriodsService: service,
      ),
    ),
  );
}

Future<void> _pumpDialog(
  WidgetTester tester,
  ReportingPeriodsService service,
  DateTime initialDate,
) async {
  await tester.binding.setSurfaceSize(const Size(600, 900));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(_wrapDialog(service, initialDate));
  await tester.pumpAndSettle();
}
