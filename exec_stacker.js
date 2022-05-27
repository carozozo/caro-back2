// 執行 stacker 項目
const booter = require('./booter')
booter.initSystem(async () => {
  const groupName = process.env.GROUP_NAME
  const taskName = process.env.TASK_NAME
  const entryName = process.env.ENTRY_NAME
  await lib.Stacker.execTasks({groupName, taskName, entryName})
  await ser.MainDb.close()
}).catch((e) => {
  console.error(e)
}).finally(() => {
  process.exit()
})
