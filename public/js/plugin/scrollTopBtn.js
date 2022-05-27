// 物件 top 位置被捲動到畫面外時, 產生 scroll top 按鈕
$.fn.scrollTopBtn = function ({$container = $('body')} = {}) {
  const $self = this

  const $showTopBtnOuter = $(`<div/>`).css({
    opacity: 0.8,
    position: 'fixed',
    bottom: 20,
    right: 40,
    display: 'inline-flex',
  }).hide()

  const hideBtnLength = 20
  const hideBtnRadius = hideBtnLength / 2
  const $cross = $('<div>x</div>').css({
    display: 'table-cell',
    'text-align': 'center',
    'vertical-align': 'middle',
    'line-height': 0,
    'padding-bottom': 4,
  })
  const $hideBtn = $(`<div id="hideBtnScrollTopBtn"><div>`).css({
    position: 'relative',
    display: 'table',
    width: hideBtnLength,
    height: hideBtnLength,
    bottom: hideBtnRadius,
    left: -hideBtnRadius,
    cursor: 'pointer',
    'border-radius': hideBtnRadius,
    'background-color': 'red',
  }).append($cross).click(() => {
    $showTopBtnOuter.fadeOut()
  })

  const $showTopBtn = $(`<button class="btn btn-secondary align-middle"><h3>- Scroll Top -</h3></button>`).css({
    position: 'relative',
    'box-shadow': '5px 5px 5px rgba(0, 0, 0, 0.2)',
  }).click(() => {
    const $target = ($self[0] === window) ? $('html, body') : $self
    $target.animate({scrollTop: 0})
  })

  $showTopBtnOuter.append([$showTopBtn, $hideBtn])
  $container.append($showTopBtnOuter)

  $self.scroll(() => {
    const height = $self.height()
    const top = $self.scrollTop()
    if (top > height) return $showTopBtnOuter.fadeIn()
    return $showTopBtnOuter.fadeOut()
  })

  _.assign($self, {
    scrollToTop: () => {
      $showTopBtn.click()
    },
  })

  return $self
}
