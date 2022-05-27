// 啟動 API 服務
module.exports = async () => {
  const port = global.APP_PORT
  await ser.Api.start(port)

  const routePath = 'app/route'
  const notFoundHandlerPath = `${routePath}/notFoundHandler.js`

  // 讀取 API route 設定
  global.readDir(routePath, function (file) {
    if (file === notFoundHandlerPath) return
    // 先算出檔案是在 routePath 目錄下的第幾層
    const fileLayer = _.chain(file).replace(routePath, '').split('/').size().value() - 1
    // 以檔案路徑當作 API 路徑
    const apiPath = global.getFilenameFromPath(file, {folderLayer: fileLayer - 1})
    const router = new ser.Router(ser.Api.app, apiPath)
    router.parseCtrlArr(require(file))
  })

  // 處理不支援的 API route
  const router = new ser.Router(ser.Api.app, '*')
  router.parseCtrlArr(require(notFoundHandlerPath))
}
