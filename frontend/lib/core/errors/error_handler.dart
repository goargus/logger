import 'package:flutter/material.dart';
import 'app_exception.dart';

class ErrorHandler {
  ErrorHandler._();

  static void showErrorSnackbar(
    BuildContext context,
    AppException exception, {
    VoidCallback? onRetry,
  }) {
    final theme = Theme.of(context);
    final shouldShowRetry = exception.shouldRetry && onRetry != null;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(exception.userMessage),
        backgroundColor: theme.colorScheme.error,
        behavior: SnackBarBehavior.floating,
        action: shouldShowRetry
            ? SnackBarAction(
                label: 'Retry',
                textColor: theme.colorScheme.onError,
                onPressed: onRetry,
              )
            : null,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  static void showErrorMessage(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
        behavior: SnackBarBehavior.floating,
        duration: duration,
      ),
    );
  }

  static void showSuccessMessage(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        duration: duration,
      ),
    );
  }

  static void showInfoMessage(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        duration: duration,
      ),
    );
  }

  static void showWarningMessage(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.orange,
        behavior: SnackBarBehavior.floating,
        duration: duration,
      ),
    );
  }

  static Future<void> showErrorDialog(
    BuildContext context,
    AppException exception, {
    VoidCallback? onRetry,
  }) async {
    return showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red),
            SizedBox(width: 8),
            Text('Error'),
          ],
        ),
        content: Text(exception.userMessage),
        actions: [
          if (exception.shouldRetry && onRetry != null)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                onRetry();
              },
              child: const Text('Retry'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  static AppException normalizeError(dynamic error) {
    if (error is AppException) {
      return error;
    }

    if (error is TypeError || error is NoSuchMethodError) {
      return UnknownException(
        userMessage: 'An unexpected error occurred.',
        technicalMessage: error.toString(),
      );
    }

    if (error is Exception) {
      final errorString = error.toString();

      if (errorString.contains('SocketException') ||
          errorString.contains('Failed host lookup')) {
        return NetworkException.noConnection();
      }

      if (errorString.contains('TimeoutException') ||
          errorString.contains('timed out')) {
        return NetworkException.timeout();
      }

      if (errorString.contains('Unauthorized') || errorString.contains('401')) {
        return AuthException.unauthorized();
      }

      if (errorString.contains('Forbidden') || errorString.contains('403')) {
        return AuthException.forbidden();
      }

      if (errorString.contains('Not Found') || errorString.contains('404')) {
        return const NotFoundException();
      }

      if (errorString.contains('500') ||
          errorString.contains('Internal Server Error')) {
        return ServerException.internalError();
      }

      if (errorString.contains('503') ||
          errorString.contains('Service Unavailable')) {
        return ServerException.serviceUnavailable();
      }
    }

    return UnknownException.fromError(error);
  }

  static void handleError(
    BuildContext context,
    dynamic error, {
    VoidCallback? onRetry,
    bool showDialog = false,
  }) {
    final exception = normalizeError(error);

    if (showDialog) {
      showErrorDialog(context, exception, onRetry: onRetry);
    } else {
      showErrorSnackbar(context, exception, onRetry: onRetry);
    }
  }
}
