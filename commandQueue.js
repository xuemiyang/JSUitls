import { assert } from './utils.js'
import { ZQueue, ZNode } from './zqueue.js'

class Command {
  cancel = function () {}
  restore = function () {}
  clone () {
    const command = new Command()
    command.cancel = this.cancel
    command.restore = this.restore
    return command
  }
  destroy () {
    this.cancel = null
    this.restore = null
  }
}

class CommandQueue {
  _cancelQueue = new ZQueue()
  _restoreQueue = new ZQueue()
  get canCancel () {
    return this._cancelQueue.length > 0
  }
  get canRestore () {
    return this._restoreQueue.length > 0
  }
  push (command) {
    assert(command && command instanceof Command, 'command必须是Command')
    this._cancelQueue.push(new ZNode(command))
  }
  cancel () {
    if (this._cancelQueue.length <= 0) {
      return
    }
    const node = this._cancelQueue.pop()
    this._restoreQueue.push(node)
    node.content.cancel()
  }
  restore () {
    if (this._restoreQueue.length <= 0) {
      return
    }
    const node = this._restoreQueue.pop()
    this._cancelQueue.push(node)
    node.content.restore()
  }
  destroy () {
    this._cancelQueue.destroy()
    this._restoreQueue.destroy()
    this._cancelQueue = null
    this._restoreQueue = null
  }
}

export { Command, CommandQueue }
