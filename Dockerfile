FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /app
COPY --from=builder /app/build /usr/share/nginx/html
RUN echo 'server { listen 3000; root /usr/share/nginx/html; try_files $uri $uri/ /index.html; }' > /etc/nginx/conf.d/default.conf && sed -i 's/listen 80/listen 3000/' /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
