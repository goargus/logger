import 'package:flutter/material.dart';
import 'errors/error_handler.dart';

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
