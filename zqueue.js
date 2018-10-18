class ZNode {
  constructor (content) {
    this.content = content
    this.next = null
    this.previous = null
  }
  delete () {
    this.next = null
    this.previous = null
  }
  destroy () {
    if (this.content && this.content.destroy && typeof this.content.destroy === 'function') {
      this.content.destroy()
    }
    this.delete()
  }
}

class ZQueue {
  constructor () {
    this._head = new ZNode(null)
    this._end = this._head
    this.length = 0
  }
  get current () {
    return this._end
  }
  push (node) {
    node.delete() // 保险起见
    this._end.next = node
    node.previous = this._end
    node.next = null
    this._end = node
    this.length += 1
  }
  pop () {
    if (this.length <= 0) {
      return
    }
    const node = this._end
    this._end = node.previous
    node.previous.next = null
    node.previous = null
    this.length -= 1
    node.delete() // 保险起见
    return node
  }
  forEach (callback) {
    if (callback && typeof callback === 'function' && this.length > 0) {
      let node = this._head.next
      let index = 0
      while (node) {
        callback(node, index)
        node = node.next
        index += 1
      }
    }
  }
  clear () {
    while (this.length > 0) {
      this.pop()
    }
  }
  destroy () {
    while (this.length > 0) {
      const node = this.pop()
      node.destroy()
    }
    this._head.destroy()
    this._end.destroy()
    this._head = null
    this._end = null
  }
}

export { ZQueue, ZNode }
