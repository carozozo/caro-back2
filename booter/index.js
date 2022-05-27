module.exports = {
  startApi: require('./fns/startApi'),
  initSystem: async (cb) => {
    await require('./fns/defineGlobal')()
    await require('./fns/initFile')()
    await require('./fns/connectDb')()
    await require('./fns/createDbIndex')()
    await require('./fns/regCronJob')()
    await require('./fns/regStackerTask')()
    await cb()
  },
}
