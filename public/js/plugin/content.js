// 客製化 content 頁面
$.fn.content = function (param = {}) {
  const $self = this
  const {allAjaxSuc} = param

  const $searchMain = $self.find(`#searchMain`)
  const $resultMain = $self.find(`#resultMain`)
  const $outlineBlock = $self.find(`#outlineBlock`)
  const ajaxQueue = [] // 計數 callAjax 執行數量
  let contentParam = {} // 存放 content 自用變數

  // ajax 呼叫時的頁面操作, 例如產生讀取效果, 自動 disable from 物件等等
  const initAjaxOperator = ($targets) => {
    if (!_.isArray($targets)) $targets = [$targets]

    const oriDisabledAttr = 'original-disabled'
    const $disableTargets = _.map([...$self.find(`input`), ...$self.find(`button`)], (dom) => $(dom))
    const info = {isSettled: false, isSuccessful: false}
    const $loadings = []

    for (const $target of $targets) {
      const $loading = $(`<h3>讀取中</h3>`).css({
        opacity: 0.5, position: 'absolute',
        transform: 'translate(-50%, 0)',
        left: '50%',
      })
      $loadings.push($loading)
      $target.before($loading)
      $target.css({opacity: 0.3})
    }

    if (ajaxQueue.length === 0) {
      $resultMain.show()
      _.forEach($disableTargets, ($disableTarget) => { // 記錄原本的 disabled 值
        if (!$disableTarget.attr(oriDisabledAttr)) $disableTarget.attr(oriDisabledAttr, $disableTarget.disabled())
        $disableTarget.disabled(true)
      })
    }

    ajaxQueue.push(info)

    return {
      settle: (isSuccessful = true) => {
        info.isSettled = true

        if (isSuccessful) info.isSuccessful = true
        else $resultMain.hide()

        for (const $target of $targets) {
          $target.animate({opacity: 1}, 400)
        }
        for (const $loading of $loadings) {
          $loading.remove()
        }

        const isAllSettled = _.every(ajaxQueue, (info) => info.isSettled)
        const isAllSuccessful = _.every(ajaxQueue, (info) => info.isSuccessful)
        if (isAllSettled) {
          _.forEach($disableTargets, ($disableTarget) => { // 回復原本的 disabled 值
            $disableTarget.disabled($disableTarget.attr(oriDisabledAttr) === 'true')
          })
          ajaxQueue.splice(0, ajaxQueue.length) // 清空 queue
        }
        if (isAllSuccessful) allAjaxSuc && allAjaxSuc()
      },
    }
  }

  // 一些初始化
  $searchMain.css({marginBottom: 30})
  $resultMain.css({marginBottom: 30, position: 'relative'}).hide()
  $outlineBlock.addClass(`text-center block1`)

  // 設置一個置頂區塊
  const $topDiv = $(`<div class="block1 topDiv"/>`)
  $self.prepend($topDiv)
  $self.$topDiv = $topDiv

  _.assign($self, {
    // 設置或取得 contentParam
    contentParam: (arg, isReplace = false) => {
      if (arg === true) return contentParam = {} // 清空
      if (_.isUndefined(arg)) return _.omitBy(contentParam, _.isUndefined) // 取得所有數值
      if (_.isString(arg)) return contentParam[arg] // 取得指定數值
      if (!_.isPlainObject(arg)) throw Error('請傳入物件')
      if (isReplace) return contentParam = arg // 覆蓋數值
      return _.assign(contentParam, arg) // 設置數值
    },
    // 配裝其他 plugins
    fitOut: (param) => {
      const {pageTipOpt, noticeAreaOpt, fnTextOpt} = param

      if (!_.isEmpty(pageTipOpt)) {
        const $tipsBtn = $(`<button id="tipsBtn"/>`)
        $topDiv.append($tipsBtn)
        $tipsBtn.pageTips(pageTipOpt)
      }

      if (!_.isEmpty(noticeAreaOpt)) {
        const $noticeArea = $(`<span id="noticeArea"/>`)
        $topDiv.append($noticeArea)
        $noticeArea.noticeArea(noticeAreaOpt)
      }

      if (!_.isEmpty(fnTextOpt)) {
        $self.find('input').functionText(fnTextOpt)
      }
    },
    // 包裝呼叫 ajax
    callAjax: (param, $targets = []) => {
      const {url, method, beforeSend, suc, err, complete, getQuery} = param
      const operator = initAjaxOperator($targets)

      const newBeforeSend = () => {
        beforeSend && beforeSend()
      }
      const newComplete = () => {
        complete && complete()
      }
      const newErr = () => {
        operator.settle(false)
        err && err()
      }
      const newSuc = (res) => {
        operator.settle()
        suc(res)
      }

      const data = (() => {
        if (!getQuery) return {}
        if (_.isFunction(getQuery)) return getQuery()
        return getQuery
      })()

      $.global.aj({
        url,
        method,
        data,
        beforeSend: newBeforeSend,
        suc: newSuc,
        err: newErr,
        complete: newComplete,
      })
    },
  })

  return $self
}
