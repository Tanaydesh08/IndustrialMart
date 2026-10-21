
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Fix executable permissions for Vite and other local binaries
RUN chmod -R +x node_modules/.bin

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV BACKEND_URL=http://localhost:8080

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
