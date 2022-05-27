# Caro-Back2

## 專案模組

#### 基本環境

- node.js 14.16.0
- 安裝 PM2 `npm i pm2 -g` 負責監控後端部署
- 安裝 gulp-cli `npm i gulp-cli -g` 負責前端監控
- 安裝 docker 處理 prod 佈署

#### 主要 node module

- [MongoDb](http://mongodb.github.io/node-mongodb-native/3.1/api/index.html)
- [Express](https://expressjs.com/en/4x/api.html)
- [Gulp](https://gulpjs.com/docs/en/api/concepts)

#### 主要 client module

- [jQuery](https://api.jquery.com/)
- [jQuery-UI](https://api.jqueryui.com/)
- [Bootstrap](https://getbootstrap.com/docs/4.1/getting-started/introduction/)
- [GSAP](https://greensock.com/docs/)

---

## 資料夾/檔案說明

#### /app 放置後端功能

- /app/library 通用函式庫, 每個函式庫不該有相依性(要可以獨立運作 or 只使用第三方外掛)
- /app/route 後端 API 設定和執行內容
- /app/route/main Main API 設定和執行內容
- /app/route/proj1 專案1 API 設定和執行內容
- /app/route/index.js 主頁面讀取 route 設定, 例如讀取頁面, js/css 檔
- /app/service 通用服務函式庫
- /app/service/main 主服務函式庫
- /app/service/proj1 專案1專用服務函式庫

#### /booter 放置後端服務啟用項目

- /booter/fns 放置各種獨立的啟用項目函式
- /booter/index.js 匯出啟用項目函式

#### /cron 放置後端排程功能

- /cron/proj1 專案1專用排程內容
- /cron/index.js 匯出排程設定

#### /docker 放置 docker 建置佈署項目

- /docker/_var.sh 執行 shell 時用到的變數
- /docker/build.sh 建置 docker image
- /docker/deploy.sh 佈署 docker 到 AWS
- /docker/Dockerfile docker container 設定
- /docker/push.sh 將 docker image push 到 AWS ECR
- /docker/up.sh 連線至 BI-server 並啟動 container

#### /public 放置前端功能

- /public/css 放置前端 css
- /public/css/index.css 首頁 css
- /public/html 頁面內容
- /public/images 放置公開圖片
- /public/js 放置前端 js
- /public/js/gear 服務函式庫, 相當於後端的 service
- /public/js/plugin 專案專屬的通用前端外掛
- /public/js/index.js 首頁 js
- /public/output/all(.min).css 由 gulp 產出的壓縮版 css
- /public/output/all(.min).js 由 gulp 產出的壓縮版 js
- /public/index.html 首頁版型, <body> 底下的區塊由外到內分為 container -> pageHeader, pageMenu, pageContent

#### /sample 放置開發新功能時的一些基本版型

- /sample/app 後端版型
- /sample/public 前端版型

#### /stacker 放置堆疊任務

- /stacker/main 主程式專用堆疊任務實作
- /stacker/proj1 專案1專用堆疊任務實作
- /stacker/index.js 匯出堆疊任務設定

#### /temp 暫存資料夾

---

## npm scripts

#### 說明

- `npm run start` 啟動開發環境 server
- `npm run start:prod` 啟動正式環境 server; 由 up.sh 觸發
- `npm run deply:prod` 佈署正式環境
- `J=xxx I=xxx npm run cron.exec` 立刻執行指定的 cron job; I 可以無值
- `G=xxx T=xxx E=xxx npm run stacker.exec` 立刻依序執行 stacker task; T, E 可以無值
- `npm run log` 觀看本機 pm2 server log
- `npm run log:prod` 遠端連線到 prod server 觀看 pm2 server log
- `T=xxx npm run sample:xxx` 詳細說明請看 sample.js 檔案裡面的註解
- `npm run build` 建立 docker image for prod
- `npm run push` push docker image 到 AWS
- `npm run up` 啟動 docker container; 由 deploy.sh 觸發

---

## Prod 環境說明

#### 要點

- 佈署前請確認已安裝 AWS CLI 並設定 IAM 憑證; 並且可 ssh 到 server

#### 佈署流程

- `npm run build`
- `npm run push`
- `npm run deploy:prod`

#### deploy:prod 前需要的 SSH 設置

- 在 ~/.ssh/config 裡面新增設定

```
Host caro-back2
Hostname 123.123.123.123
User ubuntu
Port 22
Identityfile ~/.ssh/xxx_rsa
```

---

## 專案開發說明

#### Route 重要函式庫說明

- ser.Api 負責啟動 API server 和 middleware 設定
- ser.Router 負責 API route 設定, 以及處理 request log 和 response 的格式
- ser.Ctrl 提供後端接到 request 之後的基本屬性和函式 ; 由 /app/route/ 底下的檔案中的 Ctrl 繼承

#### 新增網頁

- 執行 `T=xxx npm run sample:xxx` 新增需要的檔案
- 請先在 app/service/PageSubject.js 加上對應的選單內容
- 撰寫程式碼開發程式, 依需求自行新增函式庫, 外掛...等
- test and deploy

#### 關於 API 後端實作

- 本專案已將路由註冊(router)和API實作(controller)合併
- 除了直接讀取頁面的 route/index.js 之外，一律使用 POST 方式呼叫 route
- API 實作請參考 app/routes/ 底下的檔案

```
// example. 一般 controller 宣告

class Ctrl extends ser.Ctrl {  ...
  ...

  // 註冊 [POST] '/getList' 和 '/getCount'
  async post_getList () { ... }

  async post_getCount () { ... }
}

module.exports = Ctrl
```

---

## DB 基本說明

#### database 內容說明

- main-DB: 專案專用的 DB
- proj1-DB: 專案1 DB

#### Collection 建立

- 建立方式: 在 service 底下建立新的 .js 檔案, 並在裡面加上如下屬性
- 在 ser.DbIndex 中適當設置 index 增加 query 效率
- 
```
class Xxx {
  // 宣告此物件讓 ser.MainDb.autoInitCollections 讀取設定並進行初始化
  static $initCollectionInfo = {
    globalSet: 'db0', // 指定要設置在 global.db0 底下
    name: 'Account', // 非必要, 無設置時其 name = class 宣告的名稱 (Xxx)
    cb: async () => { // 非必要, 在 collection 初始化之後要執行的動作
      .....
    },
  }
}
```

---

## 關於 Cron 排程

#### 基本說明

- 新增的檔案以 .cr.js 做結尾; (cr = cron)

#### 主要目的

- 依特別需求做相對應的處理

#### 實作方式

- 在 cron/ 中新增對應的 .cr.js 檔
- 在 cron/index.js 中設定對應的檔名及要執行的時間

---

## 關於 Stacker 任務

#### 基本說明

- 新增的檔案以 .st.js 做結尾 (st = stacker)

#### 目的

- 依特別需求做相對應的處理

#### 實作方式

- 在 stacker/ 中新增對應的 .st.js 檔
- 在 stacker/index.js 中設定對應的檔名
