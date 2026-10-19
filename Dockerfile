FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY web ./web
COPY public ./public
COPY scripts/build.mjs ./scripts/build.mjs
COPY scripts/dependency-sources.mjs ./scripts/dependency-sources.mjs
COPY LICENSE THIRD_PARTY_NOTICES.md ./
COPY licenses ./licenses
RUN npm run build

FROM nginx:1.28-alpine
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY deploy /opt/verto
RUN chmod +x /opt/verto/start.sh
USER nginx
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:${PORT}/health || exit 1
ENTRYPOINT ["/opt/verto/start.sh"]
