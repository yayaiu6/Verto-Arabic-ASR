#!/bin/sh
set -eu
PORT=${PORT:-8080}
MODEL_REPO=${MODEL_REPO:-yayaiu6/Verto-Arabic-ASR}
MODEL_REVISION=${MODEL_REVISION:-}
case "$PORT" in ''|*[!0-9]*) echo 'Invalid PORT' >&2; exit 1;; esac
[ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || exit 1
echo "$MODEL_REPO" | grep -Eq '^[A-Za-z0-9_-]+/[A-Za-z0-9_.-]+$' || exit 1
if [ -n "$MODEL_REVISION" ]; then
 echo "$MODEL_REVISION" | grep -Eq '^[a-f0-9]{40}$' || exit 1
 printf '{"repo":"%s","revision":"%s","manifest":"manifest.json"}\n' "$MODEL_REPO" "$MODEL_REVISION" > /usr/share/nginx/html/config.json
elif [ "$MODEL_REPO" != 'yayaiu6/Verto-Arabic-ASR' ]; then
 echo 'Custom MODEL_REPO requires MODEL_REVISION' >&2; exit 1
fi
export PORT
envsubst '${PORT}' < /opt/verto/nginx.conf.template > /tmp/verto-nginx.conf
exec nginx -c /tmp/verto-nginx.conf -g 'daemon off;'
