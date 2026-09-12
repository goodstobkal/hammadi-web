# Build the static site, then serve it from nginx. Two stages so the image
# that ships is just HTML/CSS/JS plus nginx - no node, no node_modules.
FROM node:24-alpine AS build
WORKDIR /app

# Dependencies first: this layer is cached until package*.json changes.
COPY package*.json ./
RUN npm ci

COPY . .
# The tool catalog is fetched from the API at build time when reachable, and
# falls back to the committed src/catalog.json when it isn't.
ARG CATALOG_API=https://api.akamisushiwok.com
ARG VITE_SITE_URL=https://hammadi.dev
# Reddit conversion pixel. Empty by default, and when it is empty Vite can
# prove the loader unreachable and strips it, so a build with no campaign
# ships no ad code and shows no cookie banner at all.
ARG VITE_REDDIT_PIXEL_ID=
# VITE_API_BASE stays empty: in production Caddy serves /public/v1 on the same
# domain as the site, so the browser calls it same-origin.
ENV CATALOG_API=$CATALOG_API VITE_SITE_URL=$VITE_SITE_URL VITE_API_BASE= \
    VITE_REDDIT_PIXEL_ID=$VITE_REDDIT_PIXEL_ID
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
