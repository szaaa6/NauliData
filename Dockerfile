FROM node:20-alpine
WORKDIR /app
COPY app/package*.json ./
RUN npm install --omit=dev
COPY app/ ./
RUN mkdir -p /opt/admin/logs && chown -R node:node /opt/admin
USER node
EXPOSE 3075
CMD ["npm", "start"]
