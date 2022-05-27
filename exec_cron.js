// 執行 cron 項目
const booter = require('./booter')
booter.initSystem(async () => {
  await lib.Cron.execJob({jobName: global.JOB_NAME, specifiedItemName: global.ITEM_NAME})
}).catch((e) => {
  console.error(e)
}).finally(() => {
  process.exit()
})
