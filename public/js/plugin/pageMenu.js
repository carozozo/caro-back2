// 頁面左邊選單
$.fn.pageMenu = function (_pageSubject, menuGroups) {
  const $self = this
  const allMenuTitles = []
  const allMenuCategories = []
  const allMenuItems = []

  $self.hide().html('')

  // 建立 header 裡面的按鈕
  const createHeaderBtn = (html, type = 'primary') => {
    return $(`<div class="btn-outline-${type}">`).css({
      display: 'inline-block',
      width: '50%',
      padding: 5,
      textAlign: 'center',
      cursor: 'pointer',
      filter: 'drop-shadow(5px 5px 2px rgba(0, 0, 0, 0.2))',
    }).html(html)
  }
  // 建立選單的 header
  const createMenuHeader = () => {
    const $menuHeader = $('<div class="menu-header"></div>').css({padding: 0})
    const $extendBtn = createHeaderBtn('展開').click(() => {
      $self.extendCategory()
    })
    const $collapseBtn = createHeaderBtn('縮合', 'secondary').click(() => {
      $self.collapseCategory()
    })
    $menuHeader.append([$extendBtn, $collapseBtn])
    return $menuHeader
  }
  // 建立選單容器
  const createMenuReceptacle = () => {
    return $('<div class="menu-receptacle"/>').css({
      height: '100%',
      overflow: 'scroll',
      'flex-grow': 1,
    })
  }
  // 建立選單群組的標題按鈕
  const createMenuCategoryTitle = (category) => {
    const $menuCategoryTitle = $(`<a class="list-group-item list-group-item-dark">${category} -</a>`).css({
      'font-weight': 'bolder',
      padding: '0.3rem 1.25rem',
      cursor: 'context-menu',
      'border-top-width': 2,
      'border-top-color': '#adb5bd',
    }).click(() => {
      $menuCategoryTitle.$_$menuCategory.toggleCategory()
    })

    _.assign($menuCategoryTitle, {
      // 高亮群組標題
      highlight: () => {
        _.forEach(allMenuTitles, ($title) => {
          const isSameTitle = $title === $menuCategoryTitle
          if (isSameTitle) {
            $title.removeClass('list-group-item-dark')
            $title.addClass('list-group-item-secondary')
          } else {
            $title.removeClass('list-group-item-secondary')
            $title.addClass('list-group-item-dark')
          }
        })
      },
      // 顯示標題為 +
      showPlus: () => {
        $menuCategoryTitle.html(`${category} +`)
      },
      // 顯示標題為 -
      showMinus: () => {
        $menuCategoryTitle.html(`${category} -`)
      },
    })

    allMenuTitles.push($menuCategoryTitle)
    return $menuCategoryTitle
  }
  // 建立選單分類群組
  const createMenuCategory = (category) => {
    const $menuCategory = $('<div class="list-group"/>').css({
      overflow: 'hidden',
    })
    const tl = gsap.timeline({paused: true})

    tl.to($menuCategory, 0.2, {height: 0})

    _.assign($menuCategory, {
      // 展開群組
      extendCategory: () => {
        if ($menuCategory.$_isOpen) return
        tl.reverse()
        $menuCategory.$_isOpen = true
        $menuCategory.$_$menuCategoryTitle.showMinus()
      },
      // 縮合群組
      collapseCategory: () => {
        if (!$menuCategory.$_isOpen) return
        tl.play()
        $menuCategory.$_isOpen = false
        $menuCategory.$_$menuCategoryTitle.showPlus()
      },
      // 切換群組展開狀態
      toggleCategory: () => {
        if ($menuCategory.$_isOpen) return $menuCategory.collapseCategory()
        $menuCategory.extendCategory()
      },
      $_isOpen: true,
    })

    allMenuCategories.push($menuCategory)
    return $menuCategory
  }
  // 建立選單按鈕
  const createMenuItem = (title, _pageName, opt = {}) => {
    const {abandon} = opt
    const $menuItem = $(`<div class="list-group-item">${title}</div>`).click(() => {
      $self.setActiveItem(_pageSubject, _pageName)
      $.global.simpleLoadPage(_pageSubject, _pageName)
    }).mouseover(() => {
      tl.play()
    }).mouseleave(() => {
      tl.reverse()
    }).css({
      cursor: 'pointer',
    })

    if (abandon) {
      $menuItem.css({'text-decoration': 'line-through'})
    }

    const tl = gsap.timeline({paused: true})

    tl.to($menuItem, 0.2, {
      boxShadow: `0px 5px 2px 1px rgba(0, 0, 0, 0.3) inset`,
      transformPerspective: 500,
      transformOrigin: 'left',
      rotationY: 6,
    })

    _.assign($menuItem, {
      // 設置為選取狀態
      setActive: () => {
        $menuItem.addClass('active')
        $menuItem.$_$menuCategoryTitle.highlight()
      },
      // 設置為未選取狀態
      unsetActive: () => {
        $menuItem.removeClass('active')
      },
    })

    allMenuItems.push($menuItem)
    return $menuItem
  }

  const $menuHeader = createMenuHeader()
  const $menuReceptacle = createMenuReceptacle()

  $self.append([$menuHeader, $menuReceptacle])

  _.forEach(menuGroups, (menuGroup) => {
    const {category, menus} = menuGroup
    const $menuCategory = createMenuCategory(category)
    const $menuCategoryTitle = createMenuCategoryTitle(category)

    _.assign($menuCategory, {
      $_category: category,
      $_$menuCategoryTitle: $menuCategoryTitle,
    })
    _.assign($menuCategoryTitle, {
      $_category: category,
      $_$menuCategory: $menuCategory,
    })

    $menuReceptacle.append([$menuCategoryTitle, $menuCategory])

    _.forEach(menus, (titleOption, _pageName) => {
      // Note. titleOption 可能為字串或 {title: 'xxx', abandon: true} 或 {title: 'xxx', abandon: '訊息 for 廢棄說明'}
      let title = titleOption
      let abandon = false
      if (_.isPlainObject(titleOption)) {
        title = titleOption.title
        abandon = titleOption.abandon
      }
      if (abandon) title = `${title}(${_.isString(abandon) ? abandon : '待移除'})`
      const $menuItem = createMenuItem(title, _pageName, {abandon})
      _.assign($menuItem, {
        $_category: category,
        $_title: title,
        $_pageSubject: _pageSubject,
        $_pageName: _pageName,
        $_$menuCategoryTitle: $menuCategoryTitle,
        $_$menuCategory: $menuCategory,
      })
      $menuCategory.append($menuItem)
    })
  })

  const width = 180
  const left = -10

  $self.css({
    width,
    display: 'flex',
    position: 'fixed',
    overflow: 'hidden',
    height: '85%',
    filter: 'drop-shadow(5px 5px 2px rgba(0, 0, 0, 0.2))',
    'z-index': 100,
    'flex-flow': 'column',
    left,
  }).mouseenter(() => {
    gsap.to($self, 0.3, {x: -left})
  }).mouseleave(() => {
    gsap.to($self, 0.1, {x: 0})
  }).fadeIn()

  _.assign($self, {
    // 設置已選取選單
    setActiveItem: (_pageSubject, _pageName) => {
      $self.collapseCategory() // 先縮合所有群組

      _.forEach(allMenuItems, ($item) => {
        $item.unsetActive()
        if ($item.$_pageSubject !== _pageSubject || $item.$_pageName !== _pageName) return
        $item.setActive()
        $item.$_$menuCategory.extendCategory()
      })
    },
    // 展開選單群組, 無指定時為全部
    extendCategory: (category) => {
      _.forEach(allMenuCategories, ($category) => {
        if (category && $category.$_category !== category) return
        $category.extendCategory()
      })
    },
    // 縮合指定選單群組, 無指定時為全部
    collapseCategory: (category) => {
      _.forEach(allMenuCategories, ($category) => {
        if (category && $category.$_category !== category) return
        $category.collapseCategory()
      })
    },
  })

  return $self
}