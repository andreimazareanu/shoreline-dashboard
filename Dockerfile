FROM node:13.8.0  
COPY . .
  
RUN npm install
CMD node ./src/server/index.js 
