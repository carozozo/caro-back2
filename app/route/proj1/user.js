class BaseCtrl extends ser.Ctrl {
  async getTitleMap (map = {}) {
    return {
      '名稱': 'name',
      '建立時間': 'createdAt',
      ...map,
    }
  }

  async getCsvTitleMap () {
    return this.getTitleMap({})
  }

  async getBasicPipe (pipe = []) {
    const param = this.$getParam()
    const where = await ser1.Where.userWhere(param, param)
    return [
      lib.Query.getMatch(where),
      lib.Query.getAddFields({
        createdAt: {_$toTwTimeStr: true},
      }),
      ...pipe,
    ]
  }

  async getPipe (paginate = true, pipe = []) {
    const pageParam = this.$getPageParam(paginate)
    return lib.Query.getPipeline(await this.getBasicPipe(), pageParam, [
      ...pipe,
    ])
  }

  async getCountPipe () {
    return this.getBasicPipe([lib.Query.getCount()])
  }

  async getCsvPipe () {
    return this.getPipe(false)
  }

  async getOutlinePipe () {
    return this.getBasicPipe([
      lib.Query.getGroup({
        _id: null,
        createdAt: 1,
      }),
    ])
  }
}

class UserCtrl extends BaseCtrl {
  async _getList () {
    const titleMap = await this.getTitleMap()
    const pipe = await this.getPipe()
    const infos = await db1.User.aggregate(pipe).toArray()
    return {titleMap, infos}
  }

  async _getCount () {
    const pipe = await this.getCountPipe()
    return (await db1.User.aggregate(pipe).next() || {count: 0})
  }

  async _downloadCsv () {
    const {encode} = this.$getParam()

    const titleMap = await this.getCsvTitleMap()
    const pipe = await this.getCsvPipe()
    const infos = await db1.User.aggregate(pipe).toArray()

    const data = lib.Csv.coverToCsv({titleMap, list: infos, encode})
    const filename = lib.Csv.generateFilename({name: `${this.$baseUrl}_${encode}`})
    return this.$res.resSendData(data, filename)
  }

  async _getOutline () {
    const pipe = await this.getOutlinePipe()
    const outline = await db1.User.aggregate(pipe).next() || {createdAt: null}
    return {outline}
  }
}

module.exports = UserCtrl
