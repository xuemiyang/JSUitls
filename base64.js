class Base64 {
  static _keyStr =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  static encode (u8) {
    if (u8 instanceof Uint8Array) {
      let encodeStr = ''
      for (let i = 0; i < u8.length; i += 3) {
        const num1 = u8[i] >> 2
        const num2 = ((u8[i] & 3) << 4) | (u8[i + 1] >> 4)
        let num3 = ((u8[i + 1] & 15) << 2) | (u8[i + 2] >> 6)
        let num4 = u8[i + 2] & 63
        if (!Number.isInteger(u8[i + 1])) {
          num3 = 64
          num4 = 64
        } else if (!Number.isInteger(u8[i + 2])) {
          num4 = 64
        }
        encodeStr +=
          this._keyStr.charAt(num1) +
          this._keyStr.charAt(num2) +
          this._keyStr.charAt(num3) +
          this._keyStr.charAt(num4)
      }
      return encodeStr
    } else {
      throw new Error('u8必须是Uint8Array')
    }
  }
  static decode (encodeStr) {
    if (typeof encodeStr === 'string') {
      let u8 = new Uint8Array(Number.parseInt(encodeStr.length / 4) * 3)
      let j = 0
      for (let i = 0; i < encodeStr.length; i += 4) {
        const num1 = this._keyStr.indexOf(encodeStr[i])
        const num2 = this._keyStr.indexOf(encodeStr[i + 1])
        const num3 = this._keyStr.indexOf(encodeStr[i + 2])
        const num4 = this._keyStr.indexOf(encodeStr[i + 3])
        u8[j] = (num1 << 2) | (num2 >> 4)
        j++
        if (num3 !== 64) {
          u8[j] = ((num2 & 15) << 4) | (num3 >> 2)
          j++
        }
        if (num4 !== 64) {
          u8[j] = ((num3 & 3) << 6) | num4
          j++
        }
      }
      u8 = new Uint8Array(u8.buffer.slice(0, j))
      return u8
    } else {
      throw new Error('encodeStr必须是String')
    }
  }
}

export default Base64
