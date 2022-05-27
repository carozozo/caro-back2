// 建立 DB 索引
module.exports = async () => {
  log.print(`Creating DB index`)

  await ser.DbIndex.createIndexes()

  log.print(`DB index created`)
}
