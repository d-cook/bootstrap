//------------------------------------------------
//VDOM

function flatten(value) {
  return Array.isArray(value) ? [].concat(...value.map(flatten)) : value;
}

function h(type, props, ...children) {
  props = props || {};
  children = flatten(children);
  if (typeof type === 'function') {
    const constructor = type;
    type = 'vdom-component';
    return { type, props: props, children, constructor };
  }
  if (!(type && type.type)) {
    return { type, props: props, children };
  }
  const allProps = { ...type.props, ...props };
  if (props.className && type.props.className) {
    allProps.className = type.props.className + ' ' + props.className;
  }
  if (props.style && type.props.style) {
    allProps.style = type.props.style + ';' + props.style;
  }
  return { ...type, props: allProps, children: type.children.concat(children) };
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
    node.component = node.constructor(node.props.initState);
    return node.component.getElement();
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
  let prevState = initState || {};
  let prevContent = null;
  const update = (state) => {
    state = state || prevState;
    let content = render(state, update);
    if (Array.isArray(content)) {
      content = flatten(content);
      updateElements(target, content, prevContent || []);
    } else {
      updateElement(target, content, prevContent);
    }
    prevContent = content;
    prevState = state;
  };
  const getElementFromRef = (ref) => (
    (typeof ref === 'string'  ) ? document.querySelector(ref) :
    (typeof ref === 'function') ? ref() : ref
  );
  const appendTo = (parent) => {
    parent = getElementFromRef(parent);
    if (parent && parent.appendChild) {
      parent.appendChild(target);
    }
  }
  target = getElementFromRef(target) ||
    document.createElement('vdom-component');
  update();
  return { update, appendTo, getElement: () => target };
}

function Component(render, defaultState) {
  return (initState, target) => makeComponent(
    render,
    initState || defaultState,
    target
  );
}

//---------------------------------------------------------
//UI APP

const getType = (value) => {
  const type = typeof value;
  if (['string', 'number', 'function'].includes(type)) { return type; }
  if (type === 'boolean') { return 'bool'; }
  if (!value) { return 'null'; }
  if (Array.isArray(value)) { return 'list'; }
  return 'record';
};

const isListOrRecord = (value) => {
  const type = getType(value);
  return type === 'list' || type === 'record';
};

const removeItem = (items, i) => {
  items.splice(i, 1); return items;
};

const insertItem = (items, i, item) => {
  items.splice(i, 0, item); return items;
};

const xButton = (onClick) => {
  return h('button', { className: 'x-button', onClick }, 'X')
};

const cycleIndicator = (depth) => {
  return h('div', { className: 'cycle-indicator' }, '^' + depth + '^');
};

const valueEditorOrCycle = (value, input, path, update) => {
  const parentIdx = path.indexOf(value);
  return (parentIdx >= 0) ? cycleIndicator(path.length - parentIdx) :
    anyValueEditor(value, input, path.concat([value]), update);
};

const textEditor = (value, input, update, isValid) => {
  if (typeof input !== 'string') { input = value; }
  if (typeof isValid !== 'function') { isValid = () => true; }
  const isChanged = () => (input !== value);
  const lines = input.split('\n');
  const updateInput = (e) => {
    input = e.target.value;
    update({ value, input });
  };
  const saveValidChanges = () => {
    if (isChanged() && isValid(input)) {
      update({ value: input, input });
    }
  };
  return h('textarea', {
    className: 'text-editor' + (
      !isValid(input) ? ' error' :
      isChanged( ) ? ' changed' : ''
    ),
    style: 'resize:none',
    value: input,
    rows: lines.length,
    cols: Math.max(1, ...lines.map(s => s.length - 1)),
    onInput: updateInput,
    onFocus: updateInput,
    onBlur : saveValidChanges,
    onKeyUp: ({ key, ctrlKey }) => {
      if (key === 'Enter' && ctrlKey && isChanged() && isValid(input)) {
        saveValidChanges();
      }
      if (key === 'Escape') {
        update({ value, input: value });
      }
    }
  });
};

const jsonEditor = (value, input, update) => {
  const json = JSON.stringify(value, null, 2);
  const updateJson = ({ value, input }) => {
    try {
      if (value !== json) { input = input.trim(); }
      value = JSON.parse(value);
      if (isListOrRecord(value)) { input = null; }
    } catch(ex) { }
    update({ value, input });
  };
  const isValid = (text) => {
    try { JSON.parse(text); return true; }
    catch(ex) { return false; }
  };
  return textEditor(json, input, updateJson, isValid)
};

const listEditor = (value, input, path, update) => {
  input = input || { i: -1 };
  return h('div', { className: 'list-editor' },
    value.map((v, i) =>
      h('div', { key: i, className: 'editor-row' },
        xButton(() => {
          value = removeItem(value, i);
          update({ value, input: null });
        }),
        valueEditorOrCycle(
          v,
          (input.i === i ? input.value : null),
          path,
          (state) => {
            value[i] = state.value;
            input = (state.input === null) ? null :
              { i, value: state.input };
            update({ value, input });
          }
        )
      )
    ),
    h('button', {
      className: 'add-button',
      onClick: (e) => {
        const nums = value.filter(n => parseInt(n) === n);
        const next = (nums.length > 0) ? Math.max(...nums) + 1 : value.length;
        value.push(next);
        update({ value, input: null });
      }
    }, '+')
  );
};

const recordEditor = (value, input, path, update) => {
  input = input || { k: null, v: null };
  return h('div', { className: 'record-editor' },
    Object.entries(value).map(([k, v], i) =>
      h('div', { key: i, className: 'editor-row' },
        xButton(() => {
          delete value[k];
          update({ value, input: null });
        }),
        textEditor(k, (input.k === k ? input.value : null), (state) => {
          input = (state.input === null) ? null :
            { k: state.value, value: state.input };
          if (state.value !== k) {
            const keys = Object.keys(value);
            const keyIndex = keys.indexOf(state.value);
            // The new key becomes last entry or is an already existing entry:
            const newIndex = (keyIndex < 0) ? keys.length - 1 : keyIndex;
            const val = value[k];
            delete value[k];
            value[state.value] = val;
            const parentEditor = document.activeElement.parentNode.parentNode;
            // "Keep" focus on the same key by re-focusing on it after next render:
            setTimeout(() => {
              parentEditor.children[newIndex].querySelector('.text-editor').focus();
            });
          }
          update({ input, value });
        }),
        h('span', { className: 'colon' }, ':'),
        valueEditorOrCycle(
          v,
          (input.v === v ? input.value : null),
          path,
          (state) => {
            value[k] = state.value;
            input = (state.input === null) ? null :
              { v: state.value, value: state.input };
            update({ value, input });
          }
        )
      )
    ),
    h('button', {
      className: 'add-button',
      onClick: (e) => {
        const allKeys = Object.keys(value);
        const numKeys = (allKeys
          .filter(k => /^_\d+_$/.test(k))
          .map(k => parseInt(k.slice(1, k.length - 1)))
          .concat(allKeys.length)
        );
        const nextNum = Math.max(...numKeys) + 1;
        value['_' + nextNum + '_'] = nextNum;
        update({ value, input: null });
      }
    }, '+')
  );
};

const funcEditor = (value, input, update) => {
  input = input || value.toString();
  const parseFunc = (src) => {
    const cleanSrc = src.replace(/\/\/[^\n]*\n|\/\*(.|\n)*\*\//g, ' ').trim();
    if (
      !/^function\s*\w*\s*\((.|\n)*\)\s*\{(.|\n)*\}$/.test(cleanSrc) &&
      !/^(\((.|\n)*\)|\w+)\s*=>\s*(\{(.|\n)*\}|\((.|\n)*\))$/.test(cleanSrc)
    ) { return null; }
    try {
      const func = eval('(' + src + ')');
      return (typeof func === 'function') ? func : null;
    } catch (ex) { }
  };
  return h('div', { className: 'func-editor' },
    textEditor(value.toString(), input, (state) => {
      if (state.value !== value.toString()) {
        value = parseFunc(state.value) || value;
      }
      input = state.input;
      update({ value, input });
    }, parseFunc)
  );
}

const anyValueEditor = (value, input, path, update) => {
  const type = getType(value);
  return (
    (type === 'list'    ) ? listEditor  (value, input, path, update) :
    (type === 'record'  ) ? recordEditor(value, input, path, update) :
    (type === 'function') ? funcEditor  (value, input, update) :
                            jsonEditor  (value, input, update)
  );
};

const ValueEditor = Component(({ value, input }, update) => {
  return anyValueEditor(value, input, [value], update);
}, { value: null });

const GlobalCssEditor = Component(({ css }, update) => {
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
          css = e.target.value;
          update({ css });
        }
      }, css)
    )
  );
}, { css: '' });

const globalCss = `
body {
  display: grid;
  grid-template-columns:
    1fr 1fr 1fr 1fr;
  column-gap: 8px;
  row-gap: 8px;
}

body > :first-child {
  grid-row: 1 / 99;
}

button {
  cursor: pointer;
}

.css-editor {
  border-radius: 4px;
  border: solid 2px #CCCCCC;
  background-color: #FDFDFD;
  width: min-content;
  height: min-content;
  padding: 0;
}

.css-editor p {
  margin: 0;
  margin-left: 2px;
}

.css-editor textarea {
  outline: none;
  font-size: 13px;
  font-family: monospace;
  color: #004444;
  background-color: #F8F8F8;
  border: none;
  border-top: 2px solid #CCCCCC;
  padding: 2px;
  display: flex;
  resize: none;
}

.x-button {
  display: none;
  position: absolute;
  border: solid 1px red;
  border-radius: 10px;
  padding: 2px;
  background-color: white;
  font-weight: bold;
  font-size: 10px;
  color: red;
  line-height: 0.7;
  margin-left: -4px;
  margin-top: -4px;
}

.editor-row:hover > .x-button {
  display: initial;
}

.x-button:hover {
  color: white;
  background-color: red;
}

.add-button {
  display: none;
  border: 1px solid #AAAAAA;
  border-radius: 4px;
  background: white;
  color: #AAAAAA;
  font-weight: bold;
  font-size: 12px;
  line-height: 0.8;
  width: 25px;
  height: 9px;
  margin-top: -2px;
  margin-bottom: -12px;
  align-self: center;
  justify-content: center;
  align-items: center;
}

div:hover > .add-button {
  display: flex;
}

.add-button:first-child {
  margin-top: 3px;
  margin-bottom: -13px
}

.add-button:hover {
  background-color: #AAAAAA;
  color: white;
}

.text-editor {
  font-family: monospace;
  border: solid 2px transparent;
  border-radius: 4px;
  background: none;
}

.text-editor:hover {
  border-color: rgba(0,0,0,0.2);
  background-color: rgba(255,255,255,0.7);
}

.text-editor:focus {
  border-color: black;
  background-color: white;
}

.text-editor, .colon {
  margin-top: -3px;
  margin-bottom: -5px;
}

.colon + .text-editor, .colon {
  margin-left: -2px;
}

.cycle-indicator {
  display: flex;
  color: #CC4400;
  font-weight: bold;
  background-color: #FFEECC;
  font-family: monospace;
  letter-spacing: -1;
  border: solid 1px #CC4400;
  border-radius: 4px;
  padding: 0 2px;
  margin: -2px 0 -2px 2px;
  justify-content: center;
  align-items: center;
  width: min-content;
}

.list-editor {
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  width: min-content;
  padding: 6px;
  border: 2px solid #8888CC;
  background-color: #EEEEFF;
  border-radius: 6px;
  min-width: 26px;
}

.list-editor > .add-button {
  border-color: blue;
  color: blue;
}

.list-editor > .add-button:hover {
  background-color: blue;
  color: white;
}

.record-editor {
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  width: min-content;
  padding: 6px;
  border: 2px solid #88CC88;
  background-color: #EEFFEE;
  border-radius: 6px;
  min-width: 26px;
}

.record-editor > div {
  display: flex;
  flex-direction: row;
  align-items: start;
  column-gap: 2px;
}

.record-editor > .add-button {
  border-color: green;
  color: green;
}

.record-editor > .add-button:hover {
  background-color: green;
  color: white;
}

.func-editor {
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  width: min-content;
  padding: 6px;
  border: 2px solid #CCCC88;
  background-color: #FFFFEE;
  border-radius: 6px;
  min-width: 26px;
}

.changed {
  color: #004488 !important;
  background-color: #DDFFFF !important;
}

.error {
  color: #880000 !important;
  background-color: #FFCCCC !important;
}
`.trim();

window.onload = () => {
  GlobalCssEditor({ css: globalCss }).appendTo(document.body);
  var list = [ 4, 5 ];
  var obj = { w: 'six' };
  var xyz = { x: 3, y: list, z: obj };
  var value = [1, 2, xyz, 'seven', 'eight', () => {}, function abc(a,b,c) { return 123; }];
  obj.self = obj;
  list.push(xyz);
  var editors = [value, value, xyz, list, obj].map(v => {
    var ve = ValueEditor({ value: v });
    ve.appendTo(document.body);
    return ve;
  });
  setInterval(() => editors.forEach(e => e.update()), 200);
};
