# ---------- build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
# If you later add package-lock.json, copy it too for reproducible builds
RUN npm install

COPY index.html vite.config.js ./
COPY src/ ./src/

# Browser will call the API on the host-mapped port
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------- production stage ----------
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Simple SPA fallback so React Router / client routes work
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
