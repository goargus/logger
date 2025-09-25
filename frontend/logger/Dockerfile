FROM ubuntu:20.04

# Set timezone to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    wget \
    unzip \
    xz-utils \
    zip \
    libgconf-2-4 \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter
RUN git clone https://github.com/flutter/flutter.git -b stable /flutter
ENV PATH="/flutter/bin:${PATH}"

# Pre-configure Flutter
RUN flutter doctor
RUN flutter config --enable-web

WORKDIR /app

# Copy pubspec files first for better caching
COPY pubspec.* ./
RUN flutter pub get

# Copy source code
COPY . .

EXPOSE 8080

CMD ["sh", "-c", "flutter run -d web-server --web-hostname=0.0.0.0 --web-port=8080 --dart-define=AUTH0_DOMAIN=${AUTH0_DOMAIN} --dart-define=AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID} --dart-define=AUTH0_REDIRECT_URI=${AUTH0_REDIRECT_URI}"]