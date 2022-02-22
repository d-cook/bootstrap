//------------------------------------------------
//VDOM

function flatten(value) {
  return Array.isArray(value) ? [].concat(...value.map(flatten)) : value;
};

function h(type, props, ...children) {
  children = flatten(children);
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
    node.component = node.constructor(node.props.initState, target);
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
  const getElement = (ref) => (
    (typeof ref === 'string'  ) ? document.querySelector(ref) :
    (typeof ref === 'function') ? ref() : ref
  );
  const appendTo = (parent) => {
    parent = getElement(parent);
    if (parent && parent.appendChild) {
      parent.appendChild(target);
    }
  }
  target = getElement(target) || document.createElement('vdom-component');
  update();
  return { update, appendTo };
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
  if (type === 'string' || type === 'number') { return type; }
  if (type === 'boolean') { return 'bool'; }
  if (!value) { return 'null'; }
  if (Array.isArray(value)) { return 'list'; }
  return 'record';
}

const removeItem = (items, i) => {
  items.splice(i, 1); return items;
};

const insertItem = (items, i, item) => {
  items.splice(i, 0, item); return items;
};

const xButton = (onClick) => {
  return h('button', { className: 'x-button', onClick }, 'X')
};

const getEditorInputState = (value) => {
  const type = getType(value);
  if (type === 'list') { return value.map(getEditorInputState); }
  if (type === 'record') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) =>
        [key, { key, val: getEditorInputState(val) }]
      )
    );
  }
  return JSON.stringify(value);
};

const rawStringEditor = (value, input, update) => {
  if (typeof input !== 'string') { input = value; }
  const save = () => {
    setTimeout(() => {
      if (value !== input) {
        update({ value: input, input });
      }
    });
  };
  const isChanged = (input !== value);
  return h('input', {
    className: 'value-editor' +
      (isChanged ? ' changed' : ''),
    type: 'text',
    value: input,
    size: Math.max(1, input.length),
    onInput: (e) => {
      input = e.target.value;
      update({ value, input });
    },
    onBlur: save,
    onKeyUp: ({ key }) => {
      if (key === 'Enter') { save(); }
      if (key === 'Escape') {
        update({ value, input: value });
      }
    }
  });
};

const jsonStringEditor = (value, input, update) => {
  if (typeof input !== 'string') { input = JSON.stringify(value); }
  const save = () => {
    setTimeout(() => {
      if (JSON.stringify(value) !== input) {
        try { value = JSON.parse(input); } catch(ex) { }
        input = getEditorInputState(value);
        update({ value, input });
      }
    });
  };
  let isError = true;
  try { JSON.parse(input); isError = false; } catch(ex) { }
  const isChanged = !isError && (input !== JSON.stringify(value));
  return h('input', {
    className: 'value-editor' +
      (isError ? ' error' : isChanged ? ' changed' : ''),
    type: 'text',
    value: input,
    size: Math.max(1, input.length),
    onInput: (e) => {
      input = e.target.value;
      update({ value, input });
    },
    onBlur: save,
    onKeyUp: ({ key }) => {
      if (key === 'Enter') { save(); }
      if (key === 'Escape') {
        input = JSON.stringify(value);
        update({ value, input });
      }
    }
  });
};

const listEditor = (value, input, update) => {
  return h('div', { className: 'list-editor' },
    value.map((v, i) =>
      h('div', { key: i },
        xButton(() => {
          value = removeItem(value, i);
          input = removeItem(input, i);
          update({ value, input });
        }),
        anyValueEditor(v, input[i], (state) => {
          value[i] = state.value;
          input[i] = state.input;
          update({ value, input });
        })
      )
    ),
    h('button', {
      className: 'add-button',
      onClick: (e) => {
        value.push(null);
        input.push('null');
        update({ value, input });
      }
    }, '+')
  );
};

const recordEditor = (value, input, update) => {
  const newKey = (keys, k) => {
    const A = (Math.random() < 0.5) ? 65 : 97;
    k = (k || '') + String.fromCharCode(A + Math.floor(Math.random() * 26));
    return keys.includes(k) ? newKey(keys, k) : k;
  };
  const keyInputSize = Math.max(1, ...Object.values(input).map(kv => kv.key.length));
  return h('div', { className: 'record-editor' },
    Object.entries(value).map(([k, v], i) =>
      h('div', { key: i },
        xButton(() => {
          delete value[k];
          delete input[k];
          update({ value, input });
        }),
        rawStringEditor(k, input[k].key, (state) => {
          input[k].key = state.input;
          if (state.value !== k) {
            Object.entries(input)
              // Look for mismatch instead of specific key, in case of duplicate key:
              .filter(([ik, iv]) => iv.key !== ik)
              .forEach(([ik, iv]) => {
                const val = value[ik];
                delete value[ik];
                delete input[ik];
                value[iv.key] = val;
                input[iv.key] = iv;
              });
          }
          update({ input, value });
        }),
        ':',
        anyValueEditor(v, input[k].val, (state) => {
          value[k] = state.value;
          input[k].val = state.input;
          update({ value, input });
        })
      )
    ),
    h('button', {
      className: 'add-button',
      onClick: (e) => {
        const key = newKey(Object.keys(value));
        value[key] = null;
        input[key] = { key, val: 'null' };
        update({ value, input });
      }
    }, '+')
  );
};

const anyValueEditor = (value, input, update) => {
  const type = getType(value);
  if (getType(input) === 'null') {
    input = getEditorInputState(value);
  }
  const editor =
    (type === 'list'  ) ? listEditor :
    (type === 'record') ? recordEditor : jsonStringEditor;
  return editor(value, input, update);
}

const ValueEditor = Component(({ value, input }, update) => {
  return anyValueEditor(value, input, update);
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
  position: absolute;
  border: solid 1px red;
  border-radius: 10px;
  padding: 2px;
  background-color: red;
  font-weight: bold;
  font-size: 10px;
  color: white;
  line-height: 0.7;
  margin-left: -5px;
  margin-top: -4px;
}

.add-button {
  border: none;
  border-radius: 4px;
  background-color: #AAAAAA;
  color: white;
  font-weight: bold;
  font-size: 12px;
  line-height: 0.8;
  min-width: 40px;
  padding: 0;
}

.add-button:first-child {
  margin-left: -4px;
  margin-top: -3px;
}

.value-editor {
  font-family: monospace;
  border: solid 2px black;
  border-radius: 4px;
}

.list-editor {
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  width: min-content;
  padding: 8px 4px 4px 8px;
  border: 2px solid #8888CC;
  background-color: #EEEEFF;
  border-radius: 6px;
}

.list-editor .value-editor {
  padding-left: 5px;
}

.list-editor > .add-button {
  background-color: blue;
}

.record-editor {
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  width: min-content;
  padding: 8px 4px 4px 8px;
  border: 2px solid #88CC88;
  background-color: #EEFFEE;
  border-radius: 6px;
}

.record-editor > div {
  display: flex;
  flex-direction: row;
  align-items: start;
  column-gap: 2px;
}

.record-editor .value-editor {
  padding-left: 5px;
}

.record-editor > .add-button {
  background-color: green;
}

.changed {
  color: #004488;
  background-color: #DDFFFF;
}

.error {
  color: #880000;
  background-color: #FFCCCC;
}
`.trim();

window.onload = () => {
  GlobalCssEditor({ css: globalCss }).appendTo(document.body);
  var list = [4,5];
  var obj = {w:'six'};
  var xyz = {x:3,y:list,z:obj};
  var value = [1,2,xyz,'seven','eight'];
  ValueEditor({ value }).appendTo(document.body);
  var editors = [value,xyz,list,obj].map(v => {
    var ve = ValueEditor({ value: v });
    ve.appendTo(document.body);
    return ve;
  });
  setInterval(() => editors.forEach(e => e.update()), 200);
};
