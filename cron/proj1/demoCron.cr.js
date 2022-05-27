const runTasks = async () => {
  await lib.Stacker.execTasks({groupName: 'proj1'})
}

module.exports = {
  runTasks,
}
