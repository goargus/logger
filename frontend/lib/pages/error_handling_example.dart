import 'package:flutter/material.dart';
import '../core/errors/app_exception.dart';
import '../core/errors/error_handler.dart';
import '../widgets/error_display.dart';
import '../services/activity.dart';

class ErrorHandlingExamplePage extends StatefulWidget {
  const ErrorHandlingExamplePage({super.key});

  @override
  State<ErrorHandlingExamplePage> createState() =>
      _ErrorHandlingExamplePageState();
}

class _ErrorHandlingExamplePageState extends State<ErrorHandlingExamplePage> {
  bool _isLoading = false;
  AppException? _error;
  List<Map<String, dynamic>>? _activities;

  late final ActivityService _activityService;

  @override
  void initState() {
    super.initState();
    _activityService = ActivityService.localhost(() async => 'dummy-token');
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final activities = await _activityService.getRecentActivities();
      setState(() {
        _activities = activities;
        _isLoading = false;
      });
    } catch (e) {
      final exception = ErrorHandler.normalizeError(e);
      setState(() {
        _error = exception;
        _isLoading = false;
      });
    }
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
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }
    if (_error != null) {
      return ErrorCard.fromException(
        _error!,
        onRetry: _loadData,
      );
    }
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
            onRetry: _loadData,
          ),
          const SizedBox(height: 24),
          if (_activities != null) ...[
            const Text(
              'Loaded Activities:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ...(_activities ?? []).map((activity) {
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
