import 'package:flutter/material.dart';
import 'errors/error_handler.dart';

/// Legacy Snackbars utility - maintained for backwards compatibility
/// 
/// Consider using ErrorHandler instead for new code:
/// - ErrorHandler.showSuccessMessage()
/// - ErrorHandler.showErrorMessage()
/// - ErrorHandler.showInfoMessage()
class Snackbars {
  Snackbars._();

  static void showSuccess(BuildContext context, String message) {
    ErrorHandler.showSuccessMessage(context, message);
  }

  static void showError(BuildContext context, String message) {
    ErrorHandler.showErrorMessage(context, message);
  }

  static void showInfo(BuildContext context, String message) {
    ErrorHandler.showInfoMessage(context, message);
  }
}
