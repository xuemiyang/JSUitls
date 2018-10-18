class NotificationCenter {
  static _notis = new Map()
  static registListener (notiName, callback) {
    if (callback && typeof callback === 'function') {
      if (this._notis.has(notiName)) {
        const listeners = this._notis.get(notiName)
        if (!listeners.has(callback)) {
          listeners.add(callback)
        }
      } else {
        const listeners = new Set()
        listeners.add(callback)
        this._notis.set(notiName, listeners)
      }
    }
  }
  static unregisterListener (notiName, callback) {
    if (this._notis.has(notiName)) {
      if (callback && typeof callback === 'function') {
        const listeners = this._notis.get(notiName)
        if (listeners.has(callback)) {
          listeners.delete(callback)
        }
      } else {
        this._notis.delete(notiName)
      }
    }
  }
  static sendNotification (notiName, info) {
    if (this._notis.has(notiName)) {
      const listeners = this._notis.get(notiName)
      for (const listener of listeners) {
        try {
          listener({notiName: notiName, info: info})
        } catch (error) {
          this.unregisterListener(notiName, listener)
        }
      }
    }
  }
  static destroy () {
    for (const listeners of this._notis.values()) {
      listeners.clear()
    }
    this._notis.clear()
  }
}

export default NotificationCenter
