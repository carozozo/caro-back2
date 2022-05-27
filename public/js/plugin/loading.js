// Loading 畫面
$.fn.loading = function () {
  const $self = this
  const $loadingMsg = $(`<div><h1 class="loadingMsg">資料處理中...</h1></div>`).css({
    position: `absolute`,
    top: `50%`,
    left: `50%`,
    transform: `translate(-50%, -50%)`,
  })
  const $loading = $(`<div>`).css({
    width: `100%`,
    height: `100%`,
    opacity: `0.5`,
    position: `absolute`,
    'background-color': `black`,
    'text-align': `center`,
  }).hide().append($loadingMsg)

  $self.prepend($loading)

  _.assign($self, {
    // 顯示 loading 狀態
    showLoading: () => {
      const zIndexList = _.map($self.find(`*`), (e) => {
        if ($(e).css(`position`) === `absolute`) {
          return parseInt($(e).css(`z-index`)) || 1
        }
        return 0
      })
      const maxIndexZ = _.max(zIndexList)
      $loading.css({
        'z-index': maxIndexZ + 1,
      })

      $loading.show()
    },
    // 結束 loading 狀態
    hideLoading: () => {
      setTimeout(() => {
        $loading.fadeOut()
      }, 200)
    },
  })

  return $self
}