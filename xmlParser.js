class XMLAttribute {
  name = ''
  value = ''
}

class XMLNode {
  name = ''
  attrs = [] // XMLAttribute
  flag = 0 // 1 开始节点, 2 结束节点，3 声明，4 自结束节点
  children = []
  value = ''
}

function readAttrName (str, index) {
  let startIndex = -1
  let endIndex = -1
  for (let i = index; i < str.length; i++) {
    const ch = str.charAt(i)
    if (ch !== ' ' && startIndex === -1) {
      startIndex = i
    } else if (ch === '=' && endIndex === -1) {
      endIndex = i
      break
    }
  }
  let name = ''
  if (startIndex >= 0 && endIndex > startIndex) {
    name = str.slice(startIndex, endIndex)
  }
  return {value: name === '' ? null : name, index: endIndex + 1}
}

function readAttrValue (str, index) {
  let startIndex = -1
  let endIndex = -1
  for (let i = index; i < str.length; i++) {
    const ch = str.charAt(i)
    if (ch === '"') {
      if (startIndex === -1) {
        startIndex = i + 1
      } else if (endIndex === -1) {
        endIndex = i
        break
      }
    }
  }
  let value = ''
  if (startIndex >= 0 && endIndex > startIndex) {
    value = str.slice(startIndex, endIndex)
  }
  return {value: value === '' ? null : value, index: endIndex + 1}
}

function readAttributes (str, index) {
  let ch = ''
  const attrs = []
  while (index < str.length) {
    ch = str.charAt(index)
    if (ch === ' ' || ch === '/' || ch === '?') {
      index = index + 1
      continue
    } else if (ch === '>') {
      break
    }
    let result = readAttrName(str, index)
    if (result.value === null) {
      return {value: null, index: index}
    }
    const name = result.value
    index = result.index
    result = readAttrValue(str, index)
    if (result.value === null) {
      return {value: null, index: index}
    }
    const attr = new XMLAttribute()
    attr.name = name
    attr.value = result.value
    index = result.index
    attrs.push(attr)
  }
  return {value: attrs, index: index}
}

function readNode (str, index) {
  let startIndex = -1
  let endIndex = -1
  let flag = 0
  let hasAttr = true
  for (let i = index; i < str.length; i++) {
    const ch = str.charAt(i)
    if (ch === '<') {
      if (i + 1 === str.length) {
        break
      }
      const nextCh = str.charAt(i + 1)
      if (startIndex === -1) {
        if (nextCh === '/') {
          startIndex = i + 2
          flag = 2
        } else if (nextCh === '?') {
          startIndex = i + 2
          flag = 3
        } else if (nextCh !== ' ') {
          startIndex = i + 1
          flag = 1
        }
      }
    } else if (ch === ' ' || ch === '>') {
      if (startIndex !== -1) {
        endIndex = i
        if (ch === '>') {
          hasAttr = false
        }
        break
      }
    }
  }
  let name = ''
  if (startIndex >= 0 && endIndex > startIndex) {
    name = str.slice(startIndex, endIndex)
  }
  if (name === '') {
    return {value: null, index: index}
  }
  const node = new XMLNode()
  node.name = name
  node.flag = flag
  if (hasAttr) {
    const result = readAttributes(str, endIndex + 1)
    if (result.value === null) {
      return {value: null, index: result.index}
    }
    node.attrs = result.value
    endIndex = result.index
  }
  const endCh = str.charAt(endIndex - 1)
  if (node.flag === 1 && endCh === '/') { // result.index = '>'
    node.flag = 4
  }
  return {value: node, index: endIndex + 1}
}

function parseNode (str, index) {
  let result = readNode(str, index)
  const start = result.value
  const startIndex = result.index
  if (start && (start.flag === 1 || start.flag === 4)) {
    if (start.flag === 1) {
      let valueIndex = startIndex
      while (valueIndex + 1 < str.length) { // 获取节点值
        const ch1 = str.charAt(valueIndex)
        const ch2 = str.charAt(valueIndex + 1)
        if (ch1 === '<' && ch2 !== '') {
          start.value = str.slice(startIndex, valueIndex).trim()
          break
        }
        valueIndex += 1
      }
      result = parseNode(str, valueIndex) // 解析子节点
      while (result.value && result.value.name !== start.name) {
        start.children.push(result.value)
        result = parseNode(str, result.index)
      }
      result = readNode(str, result.index)
      const end = result.value
      const endIndex = result.index
      if (end && end.name === start.name && end.flag === 2) { // 结束节点，返回节点
        return {value: start, index: endIndex}
      }
    } else { // 自结束节点
      return {value: start, index: startIndex}
    }
    return {value: null, index: startIndex} // 返回当前解析错误的下标，以便parseNode判断
  }
  return {value: null, index: index} // 返回当前解析错误的下标，以便parseNode判断
}

function parserXML (content) {
  if (typeof content === 'string' || content instanceof Uint8Array) {
    let fileString = ''
    if (typeof content === 'string') {
      fileString = content
    } else {
      for (const value of content) { // 只支持 0~255 的UTF-8编码的bytes
        fileString += String.fromCharCode(value)
      }
    }
    let result = readNode(fileString, 0)
    const declare = result.value
    if (!declare || declare.name !== 'xml' || declare.flag !== 3) {
      return null
    }
    result = parseNode(fileString, result.index)
    const root = result.value
    result = parseNode(fileString, result.index)
    if (!root || result.value) {
      return null
    }
    return root
  } else {
    throw new Error('content必须是String或者Uint8Array')
  }
}

function nodeAttrToString (attr) {
  return ` ${attr.name}="${attr.value}"`
}

function nodeEndString (node) {
  if (node.flag === 1) {
    return '>'
  } else if (node.flag === 3) {
    return '?>\n'
  } else if (node.flag === 4) {
    return '/>\n'
  } else {
    return ''
  }
}

function nodeToString (node, spaceCount) {
  let nodeString = ''
  for (let i = 0; i < spaceCount; i++) {
    nodeString += ' '
  }
  if (node.flag === 1 || node.flag === 4) {
    nodeString += `<${node.name}`
  } else if (node.flag === 3) {
    nodeString += `<?${node.name}`
  }
  if (node.attrs.length > 0) {
    for (const attr of node.attrs) {
      nodeString += nodeAttrToString(attr)
    }
  }
  nodeString += nodeEndString(node)
  if (node.flag === 1) {
    if (node.children.length > 0) {
      nodeString += '\n'
      if (node.value.length > 0) {
        for (let i = 0; i < spaceCount + 1; i++) {
          nodeString += ' '
        }
      }
    }
    nodeString += node.value // 只有开始节点才可能有内容，其他为‘’
    if (node.children.length > 0 && node.value.length > 0) {
      nodeString += '\n'
    }
  }
  for (const value of node.children) {
    nodeString += nodeToString(value, spaceCount + 1)
  }
  if (node.flag === 1) {
    if (node.children.length > 0) {
      for (let i = 0; i < spaceCount; i++) {
        nodeString += ' '
      }
    }
    nodeString += `</${node.name}>\n`
  }
  return nodeString
}

function getXML (root) {
  if (root instanceof XMLNode) {
    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xmlString += nodeToString(root, 0)
    xmlString = xmlString.slice(0, xmlString.length - 1)
    return xmlString
  } else {
    throw new Error('root必须是XMLNode')
  }
}

function getXMLNodeByName (node, name) {
  if (node instanceof XMLNode) {
    if (node.name === name) {
      return [node]
    }
    let nodes = []
    for (const value of node.children) {
      const result = getXMLNodeByName(value, name)
      if (result.length > 0) {
        nodes = [...nodes, ...result]
      }
    }
    return nodes
  } else {
    throw new Error('node必须是XMLNode')
  }
}

export { parserXML, XMLNode, getXML, getXMLNodeByName }
