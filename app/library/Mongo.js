// mongo DB 函式庫
const {ObjectID} = require(`mongodb`) // http://mongodb.github.io/node-mongodb-native/

class Mongo {
  static ifObjectId (id) {
    id = _.trim(id)
    return ObjectID.isValid(id)
  }

  static toObjectId (id) {
    id = _.trim(id)
    if (!ObjectID.isValid(id)) throw lib.ResWarning.genMsg(`'id ${id} 格式不正確'`)
    return new ObjectID(id)
  }

  static toObjectIdArr (idArr) {
    if (_.isString(idArr)) idArr = lib.Unit.strToArr(idArr)
    if (!_.isArray(idArr)) idArr = [idArr]
    idArr = _.filter(idArr, (id) => _.trim(id))
    return _.map(idArr, (id) => Mongo.toObjectId(id))
  }

  // 設置關聯的資料
  static async setRelatedData (param) {
    const {
      model, // 要設置的 model
      field, // model 關聯欄位
      where, // model where
      foreignModel, // 要查詢的 model 對象
      foreignField = '_id', // model 對象關聯欄位
      foreignWhere, // model 對象 where
      as = `_${field}`, // 要設置的欄位名稱
      project, // 對象 projection
      defData, // 如果沒有資料時要設置的預設值
      doUnset = true, // 是否清除原本的資料
      batchSize,
    } = param

    let bulk = await Mongo.getBulkOpt(model)
    if (doUnset) await model.updateMany({}, {$unset: {[as]: ''}})

    const hasForeignFieldInProject = _.has(project, foreignField)
    const foreignKeys = _.filter(await model.distinct(field, where), v => v)
    const pipe = [
      lib.Query.getMatch({...foreignWhere, [foreignField]: {$in: foreignKeys}}),
      lib.Query.getProject({...project, [foreignField]: 1}),
    ]
    const cursor = foreignModel.aggregate(pipe)
    await lib.Query.cursorEach(cursor, async (result) => {
      let {[foreignField]: foreignFieldVal} = result

      if (_.isArray(foreignFieldVal)) foreignFieldVal = {$in: foreignFieldVal}

      if (!hasForeignFieldInProject) delete result[foreignField]

      const localWhere = {...where, [field]: foreignFieldVal}
      const update = {$set: {[as]: result}}

      bulk.find(localWhere).update(update)
      bulk = await bulk.autoExecute()
    }, {batchSize})
    await bulk.finalExecute()

    if (_.isUndefined(defData)) return
    const localWhere = {...where, [as]: {$exists: false}}
    const update = {$set: {[as]: defData}}
    await model.updateMany(localWhere, update)
  }

  // 取得 model 批次操作物件
  static async getBulkOpt (model, isOrder = false) {
    const method = !isOrder ? 'initializeUnorderedBulkOp' : 'initializeOrderedBulkOp'
    const bulk = model[method]()
    bulk.autoExecute = async (limit = 5000) => {
      if (bulk.length < limit) return bulk // 操作步驟不足, 不執行
      await bulk.execute()
      return Mongo.getBulkOpt(model, isOrder) // 執行完後回傳一個新的 bulk
    }
    bulk.finalExecute = async () => {
      if (bulk.length <= 0) return bulk
      await bulk.execute()
      return Mongo.getBulkOpt(model, isOrder) // 執行完後回傳一個新的 bulk
    }
    return bulk
  }
}

module.exports = Mongo
