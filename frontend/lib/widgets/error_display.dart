import 'package:flutter/material.dart';
import '../core/errors/app_exception.dart';

/// A card widget that displays an error message with optional retry button
class ErrorCard extends StatelessWidget {
  const ErrorCard({
    super.key,
    required this.message,
    this.onRetry,
    this.icon,
    this.backgroundColor,
  });

  /// Error message to display
  final String message;

  /// Callback when retry button is pressed
  final VoidCallback? onRetry;

  /// Optional icon to display (defaults to error icon)
  final IconData? icon;

  /// Optional background color (defaults to error color)
  final Color? backgroundColor;

  /// Factory constructor for displaying an AppException
  factory ErrorCard.fromException(
    AppException exception, {
    VoidCallback? onRetry,
    Key? key,
  }) {
    return ErrorCard(
      key: key,
      message: exception.userMessage,
      onRetry: exception.shouldRetry ? onRetry : null,
      icon: _getIconForException(exception),
    );
  }

  static IconData _getIconForException(AppException exception) {
    if (exception is NetworkException) {
      return Icons.wifi_off;
    } else if (exception is AuthException) {
      return Icons.lock_outline;
    } else if (exception is ValidationException) {
      return Icons.error_outline;
    } else if (exception is ServerException) {
      return Icons.cloud_off;
    } else if (exception is NotFoundException) {
      return Icons.search_off;
    }
    return Icons.error_outline;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectiveBackgroundColor =
        backgroundColor ?? theme.colorScheme.errorContainer.withValues(alpha: 0.1);

    return Card(
      color: effectiveBackgroundColor,
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon ?? Icons.error_outline,
              size: 48,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onErrorContainer,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// A compact inline error widget for displaying errors in lists or forms
class InlineError extends StatelessWidget {
  const InlineError({
    super.key,
    required this.message,
    this.onRetry,
  });

  final String message;
  final VoidCallback? onRetry;

  factory InlineError.fromException(
    AppException exception, {
    VoidCallback? onRetry,
    Key? key,
  }) {
    return InlineError(
      key: key,
      message: exception.userMessage,
      onRetry: exception.shouldRetry ? onRetry : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: theme.colorScheme.error.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.error_outline,
            size: 20,
            color: theme.colorScheme.error,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onErrorContainer,
              ),
            ),
          ),
          if (onRetry != null) ...[
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.refresh),
              iconSize: 20,
              color: theme.colorScheme.primary,
              onPressed: onRetry,
              tooltip: 'Retry',
            ),
          ],
        ],
      ),
    );
  }
}

/// A full-screen error widget for critical errors
class FullScreenError extends StatelessWidget {
  const FullScreenError({
    super.key,
    required this.message,
    this.onRetry,
    this.onGoHome,
  });

  final String message;
  final VoidCallback? onRetry;
  final VoidCallback? onGoHome;

  factory FullScreenError.fromException(
    AppException exception, {
    VoidCallback? onRetry,
    VoidCallback? onGoHome,
    Key? key,
  }) {
    return FullScreenError(
      key: key,
      message: exception.userMessage,
      onRetry: exception.shouldRetry ? onRetry : null,
      onGoHome: onGoHome,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 80,
                color: theme.colorScheme.error,
              ),
              const SizedBox(height: 24),
              Text(
                'Oops!',
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                message,
                style: theme.textTheme.bodyLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              if (onRetry != null)
                ElevatedButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try Again'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 16,
                    ),
                  ),
                ),
              if (onGoHome != null) ...[
                const SizedBox(height: 16),
                TextButton(
                  onPressed: onGoHome,
                  child: const Text('Go to Home'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
