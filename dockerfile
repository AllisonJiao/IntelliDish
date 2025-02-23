ARG PORT

FROM node:20.6-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE $PORT

# CMD ["npm", "start"]
# Copy the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Use the entrypoint script to start the app
ENTRYPOINT ["/app/entrypoint.sh"]
