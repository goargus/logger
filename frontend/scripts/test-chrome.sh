#!/usr/bin/env bash
# Run Flutter tests with Chrome platform using the official Flutter SDK.
#
# The AUR Flutter package has a broken web SDK (missing Tristate/CheckedState types)
# that prevents --platform chrome from working. This script uses the official
# Flutter SDK installed at ~/development/flutter.
#
# Prerequisites:
#   git clone https://github.com/flutter/flutter.git -b stable ~/development/flutter
#   ~/development/flutter/bin/flutter precache --web
#
# Usage:
#   ./scripts/test-chrome.sh                    # Run all tests on Chrome
#   ./scripts/test-chrome.sh test/widgets/      # Run widget tests only (Chrome-required)
#   ./scripts/test-chrome.sh test/widgets/sidebar_nav_test.dart  # Single file

set -euo pipefail

FLUTTER_SDK="${FLUTTER_SDK:-$HOME/development/flutter}"
CHROME_BIN="${CHROME_EXECUTABLE:-$HOME/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome}"

if [ ! -f "$FLUTTER_SDK/bin/flutter" ]; then
  echo "ERROR: Official Flutter SDK not found at $FLUTTER_SDK"
  echo "Install: git clone https://github.com/flutter/flutter.git -b stable $FLUTTER_SDK"
  exit 1
fi

if [ ! -f "$CHROME_BIN" ]; then
  echo "ERROR: Chrome binary not found at $CHROME_BIN"
  echo "Set CHROME_EXECUTABLE env var to your Chrome/Chromium binary path."
  exit 1
fi

CHROME_EXECUTABLE="$CHROME_BIN" "$FLUTTER_SDK/bin/flutter" test --platform chrome "$@"
