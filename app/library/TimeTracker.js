// debug 用, 用來 trace 執行時間
class TimeTracker {
  static #startTime = null

  static startUp () {
    TimeTracker.#startTime = moment()
    log.print('TimeTracker startUp')
  }

  static timeDiff () {
    const endTime = moment()
    const seconds = endTime.diff(TimeTracker.#startTime) / 1000
    log.print('TimeTracker timeDiff', {seconds})
  }
}

module.exports = TimeTracker