#!/usr/bin/env bash
# Build debug APK after `npx cap sync android`. Requires JDK 17+ (21 recommended).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/android"

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" ]] && [[ -x "${JAVA_HOME}/bin/java" ]]; then
    echo "$JAVA_HOME"
    return 0
  fi
  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    local jh
    jh=$(/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home -v 17 2>/dev/null || true)
    if [[ -n "$jh" ]] && [[ -x "$jh/bin/java" ]]; then
      echo "$jh"
      return 0
    fi
  fi
  # Homebrew + same paths as player_pradise (Intel Mac: /usr/local/opt/openjdk@21)
  for candidate in \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "/Applications/Android Studio.app/Contents/jre/Contents/Home" \
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" \
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" \
    "/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" \
    "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" \
    "/usr/local/opt/openjdk@21" \
    "/usr/local/opt/openjdk@17"; do
    if [[ -x "$candidate/bin/java" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

if ! JAVA_HOME="$(resolve_java_home)"; then
  echo "ERROR: No JDK found. Install one of:"
  echo "  brew install openjdk@21"
  echo "Then add to ~/.zshrc (Apple Silicon):"
  echo "  export PATH=\"/opt/homebrew/opt/openjdk@21/bin:\$PATH\""
  echo "Or set JAVA_HOME to the jdk Contents/Home folder."
  exit 1
fi

export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"

echo "Using JAVA_HOME=$JAVA_HOME"
java -version

./gradlew assembleDebug

cd "$ROOT"
mkdir -p public/download
cp android/app/build/outputs/apk/debug/app-debug.apk public/download/zorra-royals.apk
echo "APK -> public/download/zorra-royals.apk"
