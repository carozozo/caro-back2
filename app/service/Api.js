// API Server 連線和 Route 基本設定
class Api {
  static #app = null

  static get app () {
    return Api.#app
  }

  static get uploadPath () {
    return `uploads/`
  }

  static async start (port = 8088) {
    return new Promise((res) => {
      const http = require('http')
      const express = require(`express`)
      const ejs = require('ejs')
      const bodyParser = require('body-parser')
      const multer = require('multer')
      const helmet = require('helmet')
      const session = require('express-session')
      const MongoDBStore = require('connect-mongodb-session')(session)

      const app = Api.#app = express()
      const store = new MongoDBStore({
        uri: ser.MainDb.authDbUri,
        databaseName: ser.MainDb.ybtDbName,
        collection: 'Session',
      })

      // set render engine
      app.set('views', `public`)
      app.set('view engine', 'html')
      app.engine('html', ejs.renderFile)

      app.use(bodyParser.json()) // for parsing application/json
      app.use(bodyParser.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded
      app.use(multer({dest: Api.uploadPath}).any()) // for parsing multipart/form-data
      app.use(helmet())
      app.use(helmet.contentSecurityPolicy({
        directives: {
          'default-src': [ // 允許在 html 中存取的 src 路徑
            '\'self\'',
            '\'unsafe-inline\'',
            'data:',
            'https://code.jquery.com',
            'https://cdnjs.cloudflare.com',
            'https://stackpath.bootstrapcdn.com',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://*.cloudfront.net', // for 動態牆文章圖片
          ],
        },
      }))
      // Note. path='/source/' 開頭的 route 定義在 /route/index.js 中, 不需要透過 session
      app.use(/\/((?!source\/).)*/, session({
        secret: 'caro-back2',
        resave: false,
        saveUninitialized: true,
        cookie: {
          maxAge: 60 * 60 * 24 * 1000, // 一天
          secure: false,
        },
        store,
      }))

      http.createServer(app).listen(port, () => {
        log.print(`Router is listening on port ${port}`)
        res(app)
      })
    })
  }
}

module.exports = Api
