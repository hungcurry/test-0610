# 使用 Node.js 的官方長期支援版本作為基礎映像
FROM node:18 as build-stage

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json 以安裝依賴
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製所有檔案到工作目錄
COPY . .

# 設定 環境變數
ENV API_VERSION=api
ENV VITE_API=api
ENV VITE_NAME=prod
ENV VITE_VERSION='0.3.14'
ENV VITE_API_VERSION=/${API_VERSION}
ENV VITE_BASE_URL=/m-cloud
ENV VITE_SERVER_URL=https://evse.msi.com

# 執行 Vue.js 應用程式的建置
RUN npm run build:${VITE_NAME}

# 使用 Node.js 的官方映像作為運行階段基礎映像
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 設定 環境變數
ENV VITE_NAME=stg
ENV PORT=80
ENV PUBLIC_PATH=/m-cloud

# 複製構建好的 Vue.js 應用到 Node.js 鏡像中
COPY --from=build-stage /app/dist/${VITE_NAME} /app${PUBLIC_PATH}

COPY web-server.js ./

RUN npm install express dotenv path

# 啟動 Node.js 伺服器
CMD ["node", "web-server.js"]