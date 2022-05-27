// 頁面內容
$.fn.pageContent = function () {
  const $self = this
  const tl = gsap.timeline()
  const error = () => {
    $self.html(`<h1 class="text-center">無法讀取頁面</h1>`)
  }

  $self.html(`<h1 class="text-center">請選擇左邊選單</h1>`)

  $self.showPage = (url, {befLoad, aftLoad} = {}) => {
    befLoad && befLoad()
    $.global.aj({
      url,
      method: 'GET',
      err: error,
      raw: (result) => {
        tl.to($self, 0.2, {
          y: -30, opacity: 0, onComplete: () => {
            $self.html(result)
            aftLoad && aftLoad()
          },
        }).to($self, 0.2, {ease: gsap.parseEase('Back').easeOut.config(3), y: 0, opacity: 1, delay: 0.2})
      },
    })
    return $self
  }

  return $self
}