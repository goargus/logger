import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/errors/app_exception.dart';
import '../core/errors/error_handler.dart';
import '../widgets/error_display.dart';
import '../services/activity.dart';
import '../config/api_config.dart';
import '../core/api_client.dart';

/// Example provider demonstrating AsyncValue pattern
final exampleActivitiesProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ApiClient(
    baseUrl: ApiConfig.baseUrl,
    getAccessToken: () async => 'dummy-token',
  );
  final service = ActivityService(apiClient: apiClient);
  return service.getRecentActivities();
});

class ErrorHandlingExamplePage extends ConsumerStatefulWidget {
  const ErrorHandlingExamplePage({super.key});

  @override
  ConsumerState<ErrorHandlingExamplePage> createState() =>
      _ErrorHandlingExamplePageState();
}

class _ErrorHandlingExamplePageState
    extends ConsumerState<ErrorHandlingExamplePage> {
  late final ActivityService _activityService;

  @override
  void initState() {
    super.initState();
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: () async => 'dummy-token',
    );
    _activityService = ActivityService(apiClient: apiClient);
  }

  void _handleTransientError() async {
    try {
      await _activityService.getRecentActivities();

      if (mounted) {
        ErrorHandler.showSuccessMessage(context, 'Operation successful!');
      }
    } catch (e) {
      if (mounted) {
        ErrorHandler.handleError(
          context,
          e,
          onRetry: _handleTransientError,
        );
      }
    }
  }

  void _handleCriticalError() async {
    try {
      await _activityService.getRecentActivities();

      if (mounted) {
        ErrorHandler.showSuccessMessage(context, 'Operation successful!');
      }
    } catch (e) {
      if (mounted) {
        ErrorHandler.handleError(
          context,
          e,
          showDialog: true,
          onRetry: _handleCriticalError,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Error Handling Examples'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    final activitiesAsync = ref.watch(exampleActivitiesProvider);

    return activitiesAsync.when(
      data: (activities) => _buildContent(activities, null),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorCard.fromException(
        ErrorHandler.normalizeError(error),
        onRetry: () => ref.invalidate(exampleActivitiesProvider),
      ),
    );
  }

  Widget _buildContent(
      List<Map<String, dynamic>> activities, AppException? error) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Error Handling Patterns',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Card(
            child: ListTile(
              title: const Text('Transient Error (Snackbar)'),
              subtitle: const Text(
                'Shows error in snackbar with retry option',
              ),
              trailing: const Icon(Icons.arrow_forward),
              onTap: _handleTransientError,
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              title: const Text('Critical Error (Dialog)'),
              subtitle: const Text(
                'Shows error in dialog with retry option',
              ),
              trailing: const Icon(Icons.arrow_forward),
              onTap: _handleCriticalError,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Inline Error Example:',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          InlineError.fromException(
            const NetworkException(),
            onRetry: () => ref.invalidate(exampleActivitiesProvider),
          ),
          const SizedBox(height: 24),
          if (activities.isNotEmpty) ...[
            const Text(
              'Loaded Activities (using AsyncValue):',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ...activities.map((activity) {
              return Card(
                child: ListTile(
                  title: Text(activity['activityTypeId'] ?? 'Unknown'),
                  subtitle: Text(activity['activityDate'] ?? 'No date'),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}

class FullScreenErrorExample extends StatelessWidget {
  const FullScreenErrorExample({super.key});

  @override
  Widget build(BuildContext context) {
    return FullScreenError.fromException(
      const NetworkException(),
      onRetry: () {
        Navigator.of(context).pop();
      },
      onGoHome: () {
        Navigator.of(context).popUntil((route) => route.isFirst);
      },
    );
  }
}
