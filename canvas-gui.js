const assign = Object.assign;

function createComponent(ctor, props, children) {
  props = props || {}
  if (props.children) children = props.children.concat(children)
  children.forEach(function (child) { child.parent = this })
  return new ctor(assign({}, props, { children }))
}

class App {
  constructor(root) {
    this.surface = new Surface()
    this.root = root
  }

  render() {
    this.surface.clear()
    this.surface.renderComponent(this.root)
  }

  maybeRender() {
    if (Component.pendingUpdates.length) {
      Component.applyUpdates()
      this.render()
    }
  }

  start() {
    this.render()

    const loop = () => {
      this.maybeRender()
      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  }
}

// this is more like a canvas renderable element
// it shouldn't directly represent UI state in most cases ...

class Component {
  static create(props, ...children) {
    return createComponent(this, props, children)
  }

  static find(id) {
    return this.registry[id - 1]
  }

  static register(component) {
    var arr = this.registry
    var id = arr.length
    arr.push(component)
    return id + 1
  }

  static requestUpdate(target, nextProps, nextState) {
    this.pendingUpdates.push({ target, nextState, nextProps })
  }

  static applyUpdates() {
    this.pendingUpdates.forEach(function ({ target, nextProps, nextState }) {
      if (nextProps) { target.props = assign({}, target.props, nextProps) }
      if (nextState) { target.state = assign({}, target.state, nextState) }
    })

    this.pendingUpdates.length = 0
  }

  constructor(props) {
    this.props = props
    this.id = Component.register(this)
    this.parent = null
    this.idColor = '#' + (0x1000000 | this.id).toString(16).substring(1)
  }

  setState(nextState, callback) {
    Component.requestUpdate(this, null, nextState, callback)
  }

  _render(context, overrideProps) {
    if (overrideProps) {
      var oldProps = this.props
      var oldState = this.state
      this.props = assign({}, oldProps, overrideProps)
      this.state = assign({}, oldState, overrideProps)

      try {
        this.render(context)
      } finally {
        this.props = oldProps
        this.state = oldState
      }
    } else {
      this.render(context)
    }
  }
}

Component.registry = []
Component.pendingUpdates = []
Component.updateRequested = []

class Rect extends Component {
  constructor(props) {
    super(props)
    this.state = {
      color: props.color,
      borderColor: props.borderColor,
    }
  }

  render(context) {
    context.translate(this.props.left | 0, this.props.top | 0)

    if (this.state.borderColor != null) {
      context.strokeStyle = this.state.borderColor
      context.strokeRect(0, 0, this.props.width, this.props.height)
    }

    if (this.state.color != null) {
      context.fillStyle = this.state.color
      context.fillRect(0, 0, this.props.width, this.props.height)
    }
  }
}

class Text extends Component {
  render(context) {
    context.font = this.props.font

    if (this.props.borderColor != null) {
      context.strokeStyle = this.props.borderColor
      context.strokeText(this.props.content, this.props.left, this.props.left)
    }

    if (this.props.color != null) {
      context.strokeStyle = this.props.borderColor
      context.fillText(this.props.content, this.props.left, this.props.left)
    }
  }
}

class Artist {
  constructor(context, constraints) {
    this.context = context
    this.constraints = constraints
  }

  fillRect(x, y, w, h) {
    this.context.fillRect(x, y, w, h)
  }
}

class Surface {
  constructor() {
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')

    this.eventCanvas = document.createElement('canvas')
    this.eventContext = this.eventCanvas.getContext('2d')

    document.body.appendChild(this.canvas)
    document.body.appendChild(this.eventCanvas)

    this.resize()
    this.addEvents()

    this.mouse = { x: 0, y: 0, target: null }

  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.eventContext.clearRect(0, 0, this.eventCanvas.width, this.eventCanvas.height)
  }

  emit(type, target, data) {
    if (!target) return

    var shouldBubble = true
    var callback = target.props[type]

    if (typeof callback === 'function') {
      callback.call(target, data)
    }

    // while (target && shouldBubble) {
    //   if (target.events && target.events[type]) {
    //     shouldBubble = target[type](props) !== false
    //   }
    //   target = target.parent
    // }
  }

  addEvents() {
    window.addEventListener('resize', () => {
      this.resize()
    })

    this.canvas.addEventListener('click', (e) => {
      this.emit('onClick', this.mouse.target, e)
    })

    this.canvas.addEventListener('mousemove', (e) => {
      var x = this.mouse.x = e.clientX
      var y = this.mouse.y = e.clientY
      var id = this.getPixel(x, y)

      var prevTarget = this.mouse.target
      var nextTarget = this.mouse.target = Component.find(id)

      if (prevTarget !== nextTarget) {
        this.emit('onMouseExit', prevTarget, e)
        this.emit('onMouseEnter', nextTarget, e)
      }

      this.emit('onMouseMove', nextTarget, e)
    })
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.eventCanvas.width = window.innerWidth;
    this.eventCanvas.height = window.innerHeight;
  }

  renderComponent(component) {
    this.context.save()
    this.eventContext.save()

    component._render(this.context)
    component._render(this.eventContext, { color: component.idColor })

    var children = component.props.children
    var len = children.length

    for (var i = 0; i < len; i++) {
      this.renderComponent(children[i])
    }

    this.context.restore()
    this.eventContext.restore()

  }

  getPixel(x, y) {
    var p = this.eventContext.getImageData(x, y, 1, 1).data
    return (p[0] << 16) | (p[1] << 8) | (p[2] << 0)
  }
}
