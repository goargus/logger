FROM debian:bookworm-slim AS build

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates git unzip xz-utils zip \
    && rm -rf /var/lib/apt/lists/*

# Download Flutter SDK tarball instead of git clone (much faster, ~600 MB vs ~1.5 GB)
ARG FLUTTER_VERSION=3.41.4
RUN curl -fsSL "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz" \
    | tar xJ -C /opt
ENV PATH="/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin:${PATH}"

RUN git config --global --add safe.directory /opt/flutter \
    && flutter precache --web --no-android --no-ios --no-linux --no-macos --no-windows --no-fuchsia

WORKDIR /app
COPY pubspec.* ./
RUN flutter pub get
COPY . .

ARG AUTH0_DOMAIN
ARG AUTH0_CLIENT_ID
ARG AUTH0_AUDIENCE
ARG ENTRA_TENANT_ID
ARG ENTRA_CLIENT_ID
ARG REDIRECT_URI
ARG API_BASE_URL

RUN flutter build web --release \
  --dart-define=AUTH0_DOMAIN="${AUTH0_DOMAIN}" \
  --dart-define=AUTH0_CLIENT_ID="${AUTH0_CLIENT_ID}" \
  --dart-define=AUTH0_AUDIENCE="${AUTH0_AUDIENCE}" \
  --dart-define=ENTRA_TENANT_ID="${ENTRA_TENANT_ID}" \
  --dart-define=ENTRA_CLIENT_ID="${ENTRA_CLIENT_ID}" \
  --dart-define=REDIRECT_URI="${REDIRECT_URI}" \
  --dart-define=API_BASE_URL="${API_BASE_URL}"

############################
FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
EXPOSE 8080
RUN sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
