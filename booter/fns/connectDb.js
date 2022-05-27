// DB 連線
module.exports = async () => {
  // 連線 main-DB
  await ser.MainDb.connect()
  // 載入額外的 collections
  await ser.MainDb.autoInitCollections()

  process.on('SIGINT', () => {
    global.disconnectDb()
  })
  process.on('SIGTERM', () => {
    global.disconnectDb()
  })
}
