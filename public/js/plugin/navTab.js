// Tab 顯示功能
$.fn.navTab = function (itemSettings = []) {
  const $self = this

  const $nav = $(`<ul class="nav nav-tabs">`)
  const targets = []
  const tabLinks = []

  for (const itemSetting of itemSettings) {
    const title = !_.isEmpty(itemSetting.title) ? itemSetting.title : `-`
    const isDef = itemSetting.isDef
    const onClick = itemSetting.onClick
    let $target = itemSetting.$target

    if (_.isString($target)) $target = $($target)
    if (!$target) throw new Error(`請設定 $target`)
    if ($target.length === 0) throw new Error(`找不到 $target`)

    targets.push($target)

    const $tabLink = $(`<a class="nav-link" style="cursor: pointer;">${title}</a>`)
    tabLinks.push($tabLink)

    const $tab = $(`<li class="nav-item"></li>`).click(() => {
      _.forEach(tabLinks, ($link) => {
        $link.removeClass(`active`).addClass(`text-primary`)
      })
      $tabLink.removeClass(`text-primary`).addClass(`active`)

      _.forEach(targets, ($t) => {
        $t.hide()
      })
      $target.fadeIn()
      onClick && onClick()
    })

    $nav.append($tab)
    $tab.append($tabLink)

    if (isDef) {
      $tabLink.addClass(`active`)
    } else {
      $tabLink.addClass(`text-primary`)
      $target.hide()
    }
  }

  $self.append($nav)

  return $self
}