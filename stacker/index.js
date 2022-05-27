module.exports = {
  // 單項執行 e.g. G=main T=_temp E= npm run stacker.exec
  main: {
    _temp: [],
  },
  // 全部執行 e.g. G=proj1 T= E= npm run stacker.exec
  // 單項執行 e.g. G=proj1 T=stacker1 E= npm run stacker.exec
  proj1: {
    stacker1: ['stacker2'], // 全部執行時 stacker1 前會先執行 stacker2
    stacker2: [],
  },
};
