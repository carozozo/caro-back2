// 啟動 API 服務及排程
const booter = require('booter')
booter.initSystem(async () => {
  log.print(`Going to start server`, {NODE_ENV, ROUTE_ROOT, USE_APP_SCHEDULER, IS_LOGIN_MODE})
  await booter.startApi()
  if (global.USE_APP_SCHEDULER === true) await lib.Cron.schedule()
}).catch((e) => {
  console.error(e)
})