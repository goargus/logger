#!/bin/bash

flutter run -d web-server \
  --web-hostname=0.0.0.0 \
  --web-port=8080 \
  --dart-define=AUTH0_DOMAIN="${AUTH0_DOMAIN}" \
  --dart-define=AUTH0_CLIENT_ID="${AUTH0_CLIENT_ID}" \
  --dart-define=AUTH0_REDIRECT_URI="${AUTH0_REDIRECT_URI}" \
  --dart-define=AUTH0_AUDIENCE="${AUTH0_AUDIENCE}" \
  --dart-define=API_BASE_URL="${API_BASE_URL}"