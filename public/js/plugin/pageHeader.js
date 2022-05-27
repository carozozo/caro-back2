// 頁面標頭
$.fn.pageHeader = function () {
  const $self = this

  $self.html('').css({
    position: 'relative',
  }).addClass('bg-primary')

  const indexZ = 1

  const $headerRightFrame = (() => {
    const $rightFrame = $('<span>').css({
      'z-index': indexZ + 1,
      position: 'absolute',
      top: 25,
      right: 10,
    })
    const $accountOperator = $('<span>') // 放置帳號資訊及操作
    const $bootstrapTheme = $('<span>').bootstrapTheme() // theme 下拉選單
    $rightFrame.append([$accountOperator, $bootstrapTheme])
    $rightFrame.$accountOperator = $accountOperator
    return $rightFrame
  })()
  $self.append($headerRightFrame)

  _.assign($self, {
    // 設置頁面標題
    setTitle: (title) => {
      const tl = gsap.timeline({repeat: -1})
      const $titles = _.map(title.split(''), (t) => $(`<div>${t}</div>`).css({
        display: 'inline-block',
      }))

      const $h1 = $(`<h1 class="text-white" id="h1"></h1>`).css({
        'z-index': indexZ,
        'margin': 'auto',
        'text-align': 'center',
      }).append($titles)

      $self.find('#h1').remove()
      $self.append($h1)

      const duration = 0.5
      const stagger = duration * 0.5
      tl.from($titles, {
        duration, ease: gsap.parseEase('Back').easeOut.config(1), opacity: 0, scale: 2, x: 300,
      }).to($titles, {duration, opacity: 0, x: -300, delay: 6, stagger})
    },
    // 設置帳號控制項
    setAccountOperator: ($$accountUser, pageSubject) => {
      $headerRightFrame.$accountOperator.accountOperator($$accountUser, pageSubject)
    },
  })

  return $self
}
