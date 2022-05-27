// 分頁功能
$.fn.pagination = function ({total = 0, limit = 50, currentPage = 1, cb}) {
  const $self = this

  $self.html(``)

  const toInt = (num, def = 0) => {
    num = parseInt(num, 10)
    if (_.isNaN(num) || num < 1) num = def
    return num
  }
  const init = () => {
    $total.html(total)

    currentPage = $currentPage.val() || currentPage
    limit = $limit.html() || limit

    total = toInt(total)
    limit = toInt(limit, 50)
    currentPage = toInt(currentPage, 1)

    if (originLimit !== limit) {
      originLimit = limit
      currentPage = 1 // 有改過 limit, 強制改為第一頁
    }

    const totalPage = Math.ceil(total / limit)
    $totalPage.html(totalPage)

    if (currentPage > totalPage) currentPage = totalPage
    if (currentPage < 1) currentPage = 1

    $limit.html(limit)

    const currentPageSize = _.size(String(currentPage)) + 1
    $currentPage.prop(`size`, currentPageSize).val(currentPage)

    if (totalPage > 0 && currentPage > 1) {
      $prePage.addClass(`text-primary`).css({cursor: `pointer`}).off(`click`).click(() => {
        $prePage.__clickFn()
        init()
        emitCb()
      })
    } else {
      $prePage.removeClass(`text-primary`).css({cursor: `auto`}).off(`click`)
    }

    if (totalPage > 0 && currentPage !== totalPage) {
      $nextPage.addClass(`text-primary`).css({cursor: `pointer`}).off(`click`).click(() => {
        $nextPage.__clickFn()
        init()
        emitCb()
      })
    } else {
      $nextPage.removeClass(`text-primary`).css({cursor: `auto`}).off(`click`)
    }
  }
  const getPreAndSuf = ({pre, suf}) => {
    const $pre = $(`<span>`).html(pre).css({
      'padding-left': 10,
      'padding-right': 5,
    })
    const $suf = $(`<span>`).html(suf).css({
      'padding-left': 5,
      'padding-right': 10,
    }).addClass(`border-right border-info`)
    return {$pre, $suf}
  }
  const createText = ({pre, suf}) => {
    const {$pre, $suf} = getPreAndSuf({pre, suf})
    const $obj = $(`<span>`)

    $self.append([$pre, $obj, $suf])
    return $obj
  }
  const createInput = ({pre, suf}) => {
    const {$pre, $suf} = getPreAndSuf({pre, suf})
    const $obj = $(`<input type="text">`).focus(function () {
      $(this).select()
    }).keyup(function (e) {
      if (e.keyCode !== 13) return
      init()
      emitCb()
    })

    $self.append([$pre, $obj, $suf])
    return $obj
  }
  const createLink = (txt, clickFn) => {
    const $obj = $(`<a>`).html(txt).css({
      'padding-left': 10,
      'padding-right': 10,
    }).addClass(`border-right border-info`)
    $obj.__clickFn = clickFn
    $self.append($obj)
    return $obj
  }
  const emitCb = () => {
    const skip = (currentPage - 1) * limit
    cb({total, limit, currentPage, skip})
  }

  const $total = createText({pre: `總共`, suf: `筆`})
  const $totalPage = createText({pre: `共`, suf: `頁`})
  const $limit = createText({pre: `每頁`, suf: `筆`})
  const $currentPage = createInput({pre: `目前在第`, suf: `頁`})
  const $prePage = createLink(`上一頁`, () => {
    $currentPage.val(toInt($currentPage.val()) - 1)
  })
  const $nextPage = createLink(`下一頁`, () => {
    $currentPage.val(toInt($currentPage.val()) + 1)
  })

  $self.append($nextPage).css({'margin-bottom': 5})

  let originLimit = toInt(limit) // 用來比對 limit 是否有被更新

  _.assign($self, {
    // 取得目前頁數
    setCurrentPage: (num = 1) => {
      $currentPage.val(toInt(num))
    },
  })

  init()
  return $self
}