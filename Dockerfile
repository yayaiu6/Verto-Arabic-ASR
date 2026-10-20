FROM nginx:1.28-alpine
COPY --chown=nginx:nginx index.html LICENSE /usr/share/nginx/html/
COPY --chown=nginx:nginx assets /usr/share/nginx/html/assets
COPY assets/server/start.sh assets/server/nginx.conf.template /opt/verto/
RUN chmod +x /opt/verto/start.sh && test ! -e /usr/bin/node && test ! -e /usr/bin/npm
USER nginx
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:${PORT}/health || exit 1
ENTRYPOINT ["/opt/verto/start.sh"]
