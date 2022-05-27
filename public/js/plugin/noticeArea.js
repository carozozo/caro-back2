// 提醒區塊
$.fn.noticeArea = function (param) {
  const $self = this
  const {noticeArr = [], type = 'warning'} = param
  const pointerMsg1 = '&nbsp;&nbsp;←點擊展開'
  const pointerMsg2 = '&nbsp;←&nbsp;點擊展開'
  const msgSize = _.size(noticeArr)
  let toggle = false
  let pointerToggle = false

  if (_.isEmpty(noticeArr)) return $self

  const firstMsg = noticeArr.shift()

  const $title = $('<div/>').addClass(`bg-${type}`).css({padding: 3})
  const $sign = $('<span>△</span>')
  const $pointer = $('<span/>').html(pointerMsg1)
  const $firstMsg = $('<div/>').html(firstMsg).css({padding: 3, paddingBottom: 0})
  const $content = $('<div/>').css({display: 'none', padding: 3, paddingTop: 0})
  const setMsg = (msg, paddingTimes = 0) => {
    if (_.isArray(msg)) {
      paddingTimes += 2
      _.forEach(msg, (m) => {
        setMsg(m, paddingTimes)
      })
      return
    }

    const $msg = $('<div/>')
    if (!msg) $msg.css({height: 6})

    for (let i = 0; i < paddingTimes; i++) {
      msg = `&nbsp;${msg}`
    }
    $msg.html(msg)
    $content.append($msg)
  }

  const $frame = $('<div/>').css({
    border: '2px solid',
    marginBottom: 24,
  })
  $title.append([$sign, ' 貼心體醒'])
  $frame.append([$title, $firstMsg, $content])

  _.forEach(noticeArr, (m) => {
    setMsg(m)
  })

  $self.append($frame)

  if (msgSize > 1) {
    $title.append($pointer).css({cursor: 'pointer'}).click(() => {
      if (!toggle) $sign.html('▽')
      else $sign.html('△')
      $pointer.hide()
      toggle = !toggle
      $content.slideToggle(200)
    })
    setInterval(() => {
      $pointer.html(pointerToggle ? pointerMsg1 : pointerMsg2)
      pointerToggle = !pointerToggle
    }, 900)
  }

  return $self
}
