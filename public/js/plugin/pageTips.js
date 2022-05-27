// 客製化 plugin.popWindow, 用在頁面的說明
$.fn.pageTips = function (param) {
  const $self = this
  const {title = 'Tips', modalSubId = '', btnType = 'warning', tipArr = []} = param
  let rowNum = 0

  if (_.isEmpty(tipArr)) return $self.hide()

  const $targetBody = $(`<div class="tipsContent">`)
  const recursiveSetItems = (content, shiftCount = -1) => {
    if (_.isArray(content)) {
      shiftCount += 1
      for (const sub of content) {
        recursiveSetItems(sub, shiftCount)
      }
      return
    }

    for (let category of ['primary', 'secondary', 'success', 'danger', 'warning', 'info']) {
      content = content.replace(new RegExp(`<\/${category}>`, 'g'), '</span>')
      content = content.replace(new RegExp(`<${category}>`, 'g'), `<span class="text-${category}">`)
    }

    content = _.trim(content)
    if (shiftCount === 0 && content) rowNum++ // 在第0層, 且有內容時才累計行號

    const prefix = shiftCount === 0 ? `${rowNum}.` : '-'

    $targetBody.append($(`<div>${prefix} ${content || '&nbsp;'}</div>`).css({
      'margin-left': `${shiftCount}em`,
    }))
  }

  // 設置一般項目
  recursiveSetItems(tipArr)

  $self.html(title).addClass(`btn btn-sm btn-${btnType}`).css({
    'margin-left': 3, 'margin-right': 3, 'margin-bottom': 3,
  })

  $self.popWindow({
    modalId: `pageTipsModal-${modalSubId}`,
    $targetBody,
  })

  return $self
}
