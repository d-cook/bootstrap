//------------------------------------------------
//VDOM

function h(type, props, ...children) {
  if (typeof type === 'function') {
    const constructor = type;
    type = 'vdom-component';
    return { type, props: props || {}, children, constructor };
  }
  return { type, props: props || {}, children };
}

function setBooleanProp($target, name, value) {
  if (value) {
    $target.setAttribute(name, name);
    $target[name] = true;
  } else {
    $target.removeAttribute(name);
    $target[name] = false;
  }
}

function isEventProp(name) {
  return /^on/.test(name);
}

function extractEventName(name) {
  return name.slice(2).toLowerCase();
}

function isCustomProp(name) {
  return ['key', 'component', 'initState'].includes(name);
}

function setProp($target, name, value) {
  if (isCustomProp(name)) {
    return;
  } else if (name === 'className') {
    $target.setAttribute('class', value);
  } else if (name === 'value') {
    $target.value = value;
  } else if (isEventProp(name)) {
    const event = (typeof value === 'function') ? value : null;
    $target[name.toLowerCase()] = event;
  } else if (typeof value === 'boolean') {
    setBooleanProp($target, name, value);
  } else {
    $target.setAttribute(name, value);
  }
}

function removeProp($target, name, value) {
  if (isCustomProp(name)) {
    return;
  } else if (name === 'className') {
    $target.removeAttribute('class');
  } else if (name === 'value') {
    $target.value = '';
  } else if (isEventProp(name)) {
    $target[name.toLowerCase()] = null;
  } else if (typeof value === 'boolean') {
    setBooleanProp($target, name, false);
  } else {
    $target.removeAttribute(name);
  }
}

function setProps($target, props) {
  Object.keys(props).forEach(name => {
    setProp($target, name, props[name]);
  });
}

function isNothing(val) {
  return val === null || (typeof val === 'undefined');
}

function updateProp($target, name, newVal, oldVal) {
  if (isNothing(newVal)) {
    removeProp($target, name, oldVal);
  } else if (isNothing(oldVal) || newVal !== oldVal) {
    setProp($target, name, newVal);
  } else if (name === 'value' && newVal !== $target.value) {
    setProp($target, name, newVal);
  }
}

function updateProps($target, newProps, oldProps = {}) {
  const props = Object.assign({}, newProps, oldProps);
  Object.keys(props).forEach(name => {
    updateProp($target, name, newProps[name], oldProps[name]);
  });
}

function createElement(node) {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  } else if (node.type === 'vdom-component') {
    const target = document.createElement('vdom-component');
    node.component = node.constructor({ state: node.props.initState, target });
    return node.component.getTarget();
  }
  const $el = document.createElement(node.type);
  setProps($el, node.props);
  node.children
    .map(createElement)
    .forEach($el.appendChild.bind($el));
  return $el;
}

function hasChanged(node1, node2) {
  return typeof node1 !== typeof node2 ||
         typeof node1 === 'string' && node1 !== node2 ||
         node1.type !== node2.type ||
         node1.constructor !== node2.constructor;
}

function updateElement($parent, newNode, oldNode, index = 0) {
  if (isNothing(oldNode)) {
    if (isNothing(newNode)) { return; }
    if (index < $parent.childNodes.length) {
      $parent.insertBefore(
        createElement(newNode),
        $parent.childNodes[index]
      );
    } else {
      $parent.appendChild(
        createElement(newNode)
      );
    }
  } else if (isNothing(newNode)) {
    $parent.removeChild(
      $parent.childNodes[index]
    );
  } else if (hasChanged(newNode, oldNode)) {
    $parent.replaceChild(
      createElement(newNode),
      $parent.childNodes[index]
    );
  } else if (newNode.type === 'vdom-component') {
    newNode.component = oldNode.component;
    newNode.component.update();
  } else if (newNode.type) {
    updateProps(
      $parent.childNodes[index],
      newNode.props,
      oldNode.props
    );
    updateElements(
      $parent.childNodes[index],
      newNode.children,
      oldNode.children
    );
  }
}

function getKey(node, i) {
  return (node && node.props && node.props.key) || '#' + i;
}

function matchNodes(newNodes, oldNodes) {
  let ni = 0;
  let pairs = [];
  const newKeys = newNodes.map(getKey);
  oldNodes.forEach((on, oi) => {
    let mi = newKeys.indexOf(getKey(on, oi), ni);
    if (mi < 0) {
      pairs.push([null, on]);
    } else {
      pairs = pairs.concat(newNodes.slice(ni, mi).map(v => [v, null]));
      pairs.push([newNodes[mi], on]);
      ni = mi + 1;
    }
  });
  if (ni < newNodes.length) {
    pairs = pairs.concat(newNodes.slice(ni).map(v => [v, null]));
  }
  return pairs;
}

function updateElements($parent, newNodes, oldNodes) {
  const nodePairs = matchNodes(newNodes, oldNodes);
  let removedCount = 0;
  nodePairs.forEach((pair, i) => {
    const [n, o] = pair;
    updateElement($parent, n, o, i - removedCount);
    if (isNothing(n)) { removedCount++; }
  });
}

function makeComponent(render, initState, target) {
  let prevState = {};
  let prevContent = null;
  const getElement = (ref) => {
    const element =
      (typeof ref === 'string'  ) ? document.querySelector(ref) :
      (typeof ref === 'function') ? ref() : ref;
    return element || document.createElement('div');
  };
  const setTarget = (newTarget) => {
    target = getElement(newTarget);
  };
  const getTarget = () => target;
  const update = (state) => {
    state = state || prevState;
    const content = render(state, update);
    if (Array.isArray(content)) {
      updateElements(target, content, prevContent || []);
    } else {
      updateElement(target, content, prevContent);
    }
    prevContent = content;
    prevState = state;
  };
  const appendTo = (parent) => {
    getElement(parent).appendChild(target);
  }
  setTarget(target);
  if (initState) { update(initState); }
  return { getTarget, setTarget, appendTo, update };
}

function Component(render, defaultState, defaultTarget) {
  return ({ target, state } = {}) => makeComponent(
    render,
    state || defaultState,
    target || defaultTarget
  );
}

//---------------------------------------------------------
//UI APP

const CssEditor = Component(({ css }, update) => {
  const head = document.getElementsByTagName('head')[0];
  let styleTag = head.getElementsByTagName('style')[0];
  if (!styleTag) {
    styleTag = document.createElement('style');
    head.appendChild(styleTag);
  }
  styleTag.innerHTML = css;
  const lines = css.split('\n');
  const cols = Math.max(...lines.map(L => L.length));
  const rows = lines.length;
  return (
    h('div', { className: 'css-editor' },
      h('p', {}, 'Global CSS:'),
      h('textarea', {
        rows, cols,
        onInput: (e) => {
          console.log('oninput');
          css = e.target.value;
          update({ css });
        }
      }, css)
    )
  );
}, {
  css: (`
    .css-editor {
      border-radius: 4px;
      border: solid 2px #CCCCCC;
      background-color: #FDFDFD;
      width: min-content;
      height: min-content;
      padding: 5px;
    }
    
    .css-editor p {
      margin: 0;
      margin-bottom: 5px;
      margin-left: 2px;
    }
    
    .css-editor textarea {
      outline: none;
      font-size: 13px;
      font-family: monospace;
      color: #004444;
      background-color: #F8F8F8;
      border: 3px solid #4488AA;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      resize: none;
    }
  `).replace(/\n\s{4}/g, '\n').trim()
});

window.onload = () => {
  CssEditor().appendTo(document.body);
};
