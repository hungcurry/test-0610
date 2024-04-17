FROM nginx

# Config variable =============================
ARG env
ENV VITE_NAME=${env}
ENV DEV_SERVER_URL=https://evse.msi.com
ENV DEV_SERVER_URL_STG=https://dev-evse.msi.com
ENV PROD_SERVER_URL=https://evse.msi.com

ARG BUILD_DEVELOPMENT
ENV VITE_BASE_URL=${BUILD_DEVELOPMENT:+${VITE_NAME}}
ENV VITE_BASE_URL=${VITE_BASE_URL:-}
# =============================================

WORKDIR ./app
COPY /${VITE_NAME} ./${VITE_BASE_URL}/m-cloud

# Add /etc/nginx/nginx.conf file
RUN echo "\n\
user  nginx;\n\
worker_processes  1;\n\
\n\
events {\n\
  worker_connections  1024;\n\
}\n\
\n\
http {\n\
  include       /etc/nginx/mime.types;\n\
  default_type  application/octet-stream;\n\
\n\
  server {\n\
    listen       80;\n\
    server_name  localhost;\n\
\n\
    location / {\n\
      root   /app;\n\
      index  /${VITE_BASE_URL}/m-cloud/index.html;\n\
      try_files \$uri \$uri/ /${VITE_BASE_URL}/m-cloud/index.html;\n\
    }\n\
\n\
    location /api4/ {\n\
        proxy_pass $DEV_SERVER_URL/api4/;\n\
    }\n\
    location /api3/ {\n\
        proxy_pass $DEV_SERVER_URL/api3/;\n\
    }\n\
    location /api2/ {\n\
        proxy_pass $DEV_SERVER_URL/api2/;\n\
    }\n\
    location /api1/ {\n\
        proxy_pass $DEV_SERVER_URL/api1/;\n\
    }\n\
    location /api/ {\n\
        proxy_pass $PROD_SERVER_URL/api/;\n\
    }\n\
  }\n\
}\n\
" > /etc/nginx/nginx.conf

