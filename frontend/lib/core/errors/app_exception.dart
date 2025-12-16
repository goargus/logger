abstract class AppException implements Exception {
  const AppException({
    required this.userMessage,
    this.technicalMessage,
    this.shouldRetry = false,
  });

  final String userMessage;
  final String? technicalMessage;
  final bool shouldRetry;

  @override
  String toString() {
    return technicalMessage ?? userMessage;
  }
}

class NetworkException extends AppException {
  const NetworkException({
    super.userMessage =
        'Unable to connect to the server. Please check your internet connection.',
    super.technicalMessage,
    super.shouldRetry = true,
  });

  factory NetworkException.timeout() {
    return const NetworkException(
      userMessage: 'The request timed out. Please try again.',
      technicalMessage: 'Request timeout',
    );
  }

  factory NetworkException.noConnection() {
    return const NetworkException(
      userMessage:
          'No internet connection. Please check your network settings.',
      technicalMessage: 'No network connectivity',
    );
  }
}

class AuthException extends AppException {
  const AuthException({
    super.userMessage = 'Authentication failed. Please log in again.',
    super.technicalMessage,
    super.shouldRetry = false,
  });

  factory AuthException.unauthorized() {
    return const AuthException(
      userMessage: 'Your session has expired. Please log in again.',
      technicalMessage: 'Unauthorized (401)',
    );
  }

  factory AuthException.forbidden() {
    return const AuthException(
      userMessage: 'You do not have permission to perform this action.',
      technicalMessage: 'Forbidden (403)',
    );
  }

  factory AuthException.invalidCredentials() {
    return const AuthException(
      userMessage: 'Invalid email or password. Please try again.',
      technicalMessage: 'Invalid credentials',
    );
  }

  factory AuthException.tokenExpired() {
    return const AuthException(
      userMessage: 'Your session has expired. Please log in again.',
      technicalMessage: 'Token expired',
    );
  }
}

class ValidationException extends AppException {
  const ValidationException({
    required super.userMessage,
    super.technicalMessage,
    super.shouldRetry = false,
    this.fieldErrors,
  });
  final Map<String, String>? fieldErrors;

  factory ValidationException.fromFields(Map<String, String> errors) {
    return ValidationException(
      userMessage: 'Please correct the errors in the form.',
      fieldErrors: errors,
    );
  }

  factory ValidationException.required(String fieldName) {
    return ValidationException(
      userMessage: '$fieldName is required.',
      fieldErrors: {fieldName: 'This field is required'},
    );
  }
}

class ServerException extends AppException {
  const ServerException({
    super.userMessage =
        'Something went wrong on our end. Please try again later.',
    super.technicalMessage,
    super.shouldRetry = true,
  });

  factory ServerException.internalError() {
    return const ServerException(
      userMessage: 'Internal server error. Please try again later.',
      technicalMessage: 'Internal Server Error (500)',
    );
  }

  factory ServerException.serviceUnavailable() {
    return const ServerException(
      userMessage:
          'Service is temporarily unavailable. Please try again later.',
      technicalMessage: 'Service Unavailable (503)',
    );
  }
}

class NotFoundException extends AppException {
  const NotFoundException({
    super.userMessage = 'The requested resource was not found.',
    super.technicalMessage,
    super.shouldRetry = false,
  });

  factory NotFoundException.resource(String resourceName) {
    return NotFoundException(
      userMessage: '$resourceName not found.',
      technicalMessage: 'Resource not found (404): $resourceName',
    );
  }
}

class BusinessException extends AppException {
  const BusinessException({
    required super.userMessage,
    super.technicalMessage,
    super.shouldRetry = false,
  });
}

class UnknownException extends AppException {
  const UnknownException({
    super.userMessage = 'An unexpected error occurred. Please try again.',
    super.technicalMessage,
    super.shouldRetry = true,
  });

  factory UnknownException.fromError(dynamic error) {
    return UnknownException(
      technicalMessage: error.toString(),
    );
  }
}
