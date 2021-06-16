const identifiables = new WeakMap<Object, number>();
let nextId = 1;
function assignId(obj: Object) {
  let id = identifiables.get(obj);
  if (id) {
    return id;
  }
  id = nextId;
  nextId += 1;
  identifiables.set(obj, id);
  return id;
}
function getSvg(me: d3.Selection) {
  const svg = me.select(function () {
    let target = this;
    while (target.tagName !== 'svg') {
      target = target.parentElement;
    }
    return target;
  })
  return svg;
}
function makeDraggable(me: d3.Selection) {
  const handleDrag = d3.drag()
    .subject(function () {
      const translateX = me.datum().translateX;
      const translateY = me.datum().translateY;
      return { x: translateX, y: translateY }
    })
    .on('drag', function () {
      const transform = `translate(${d3.event.x}, ${d3.event.y})`;
      me.datum().translateX = d3.event.x;
      me.datum().translateY = d3.event.y;
      me.attr('transform', transform);
      me.dispatch('moved');
    });
  handleDrag(me);
}
interface RectProps {
  node?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
class Rect extends React.Component {
  componentDidMount() {
    const me = d3.select(ReactDOM.findDOMNode(this));
    me.datum({
      translateX: 0,
      translateY: 0
    });
    const onMoved = () => {
      const centerX = this.props.x + this.props.width / 2 + me.datum().translateX;
      const centerY = this.props.y + this.props.height / 2 + me.datum().translateY;
      me.datum().center = [centerX, centerY];
    }
    onMoved();
    me.on('moved', onMoved);
    makeDraggable(me);
    const svg = getSvg(me);
    svg.dispatch('nodeAdded', { node: me });
  }
  render() {
    const { node, x, y, width, height, ...remainingProps } = this.props;
    return <rect id={node} x={x} y={y} width={width} height={height} {...remainingProps} />
  }
}
interface LineProps {
  from?: string;
  to?: string;
}
class Line extends React.Component {
  me: d3.Selection;
  from?: d3.Selection;
  to?: d3.Selection;
  id = assignId(this);
  componentDidMount() {
    this.me = d3.select(ReactDOM.findDOMNode(this));
    this.updateCollaborator();
  }
  updateCollaborator() {
    let allReady = true;
    if (this.props.from) {
      this.from = d3.select('#' + this.props.from);
      if (this.from.datum()) {
        this.from.on(`moved.${this.id}`, this.updatePosition.bind(this));
      } else {
        allReady = false;
        this.from = undefined;
      }
    }
    if (this.props.to) {
      this.to = d3.select('#' + this.props.to);
      if (this.to.datum()) {
        this.to.on(`moved.${this.id}`, this.updatePosition.bind(this));
      } else {
        allReady = false;
        this.to = undefined;
      }
    }
    const svg = getSvg(this.me);
    if (allReady) {
      svg.on('nodeAdded', null);
      this.me.raise();
      this.updatePosition();
    } else {
      svg.on('nodeAdded', this.updateCollaborator.bind(this))
    }
  }
  updatePosition() {
    if (this.from) {
      const fromCenter = this.from.datum().center;
      this.me.attr('x1', fromCenter[0]);
      this.me.attr('y1', fromCenter[1]);
    }
    if (this.to) {
      const toCenter = this.to.datum().center;
      this.me.attr('x2', toCenter[0]);
      this.me.attr('y2', toCenter[1]);
    }
  }
  render() {
    const { from, to, ...remainingProps } = this.props;
    return <line {...remainingProps} />
  }
}
class App extends React.Component {
  render() {
    return (
      <svg style={{ border: '1px solid' }} width={300} height={300}>
        <Line from="node-1" to="node-2" style={{ stroke: 'red' }} />
        <Rect node="node-1" x={30} y={30} width={50} height={50} />
        <Rect node="node-2" x={100} y={100} width={50} height={50} />
      </svg>
    )
  }
}

ReactDOM.render(<App />, document.getElementById("app"));