const $ = {}; // Root context
$.$ = $;
$.testInput = ["Try entering JSON here!"]

//------------------------------------------------
//VDOM

$.flatten = (value) => {
  return Array.isArray(value) ? [].concat(...value.map($.flatten)) : value;
};

$.h = (type, props, ...children) => {
  props = props || {};
  children = $.flatten(children);
  if (typeof type === 'function') {
    const constructor = type;
    type = 'vdom-component';
    return { type, props, children, constructor };
  }
  if (!(type && type.type)) {
    return { type, props, children };
  }
  const allProps = { ...type.props, ...props };
  if (props.className && type.props.className) {
    allProps.className = type.props.className + ' ' + props.className;
  }
  if (props.style && type.props.style) {
    allProps.style = type.props.style + ';' + props.style;
  }
  return { ...type, props: allProps, children: type.children.concat(children) };
};

$.setBooleanProp = (element, name, value) => {
  if (value) {
    element.setAttribute(name, name);
    element[name] = true;
  } else {
    element.removeAttribute(name);
    element[name] = false;
  }
};

$.isEventProp = (name) => {
  return /^on/.test(name);
};

$.extractEventName = (name) => {
  return name.slice(2).toLowerCase();
};

$.isCustomProp = (name) => {
  return ['key', 'component', 'initState'].includes(name);
};

$.setProp = (element, name, value) => {
  if ($.isCustomProp(name)) {
    return;
  } else if (name === 'className') {
    element.setAttribute('class', value);
  } else if (name === 'value') {
    element.value = value;
  } else if ($.isEventProp(name)) {
    const event = (typeof value === 'function') ? value : null;
    element[name.toLowerCase()] = event;
  } else if (typeof value === 'boolean') {
    $.setBooleanProp(element, name, value);
  } else {
    element.setAttribute(name, value);
  }
};

$.removeProp = (element, name, value) => {
  if ($.isCustomProp(name)) {
    return;
  } else if (name === 'className') {
    element.removeAttribute('class');
  } else if (name === 'value') {
    element.value = '';
  } else if ($.isEventProp(name)) {
    element[name.toLowerCase()] = null;
  } else if (typeof value === 'boolean') {
    $.setBooleanProp(element, name, false);
  } else {
    element.removeAttribute(name);
  }
};

$.setProps = (element, props) => {
  Object.keys(props).forEach(name => {
    $.setProp(element, name, props[name]);
  });
};

$.isNothing = (val) => {
  return val === null || (typeof val === 'undefined');
};

$.updateProp = (element, name, newVal, oldVal) => {
  if ($.isNothing(newVal)) {
    $.removeProp(element, name, oldVal);
  } else if ($.isNothing(oldVal) || newVal !== oldVal) {
    $.setProp(element, name, newVal);
  } else if (name === 'value' && newVal !== element.value) {
    $.setProp(element, name, newVal);
  }
};

$.updateProps = (element, newProps, oldProps = {}) => {
  const props = Object.assign({}, newProps, oldProps);
  Object.keys(props).forEach(name => {
    $.updateProp(element, name, newProps[name], oldProps[name]);
  });
};

$.createElement = (node) => {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  } else if (node.type === 'vdom-component') {
    node.component = node.constructor(node.props.initState);
    return node.component.getElement();
  }
  const element = document.createElement(node.type);
  $.setProps(element, node.props);
  node.children
    .map($.createElement)
    .forEach(el => element.appendChild(el));
  return element;
};

$.hasChanged = (node1, node2) => {
  return typeof node1 !== typeof node2 ||
         typeof node1 === 'string' && node1 !== node2 ||
         node1.type !== node2.type ||
         node1.constructor !== node2.constructor;
};

$.updateElement = (parent, newNode, oldNode, index = 0) => {
  if ($.isNothing(oldNode)) {
    if ($.isNothing(newNode)) { return; }
    if (index < parent.childNodes.length) {
      parent.insertBefore(
        $.createElement(newNode),
        parent.childNodes[index]
      );
    } else {
      parent.appendChild(
        $.createElement(newNode)
      );
    }
  } else if ($.isNothing(newNode)) {
    parent.removeChild(
      parent.childNodes[index]
    );
  } else if ($.hasChanged(newNode, oldNode)) {
    parent.replaceChild(
      $.createElement(newNode),
      parent.childNodes[index]
    );
  } else if (newNode.type === 'vdom-component') {
    newNode.component = oldNode.component;
    newNode.component.update();
  } else if (newNode.type) {
    $.updateProps(
      parent.childNodes[index],
      newNode.props,
      oldNode.props
    );
    $.updateElements(
      parent.childNodes[index],
      newNode.children,
      oldNode.children
    );
  }
};

$.getKey = (node, i) => {
  return (node && node.props && node.props.key) || '#' + i;
};

$.matchNodes = (newNodes, oldNodes) => {
  let ni = 0;
  let pairs = [];
  const newKeys = newNodes.map($.getKey);
  oldNodes.forEach((on, oi) => {
    let mi = newKeys.indexOf($.getKey(on, oi), ni);
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
};

$.updateElements = (parent, newNodes, oldNodes) => {
  const nodePairs = $.matchNodes(newNodes, oldNodes);
  let removedCount = 0;
  nodePairs.forEach((pair, i) => {
    const [n, o] = pair;
    $.updateElement(parent, n, o, i - removedCount);
    if ($.isNothing(n)) { removedCount++; }
  });
};

$.makeComponent = (render, initState, target) => {
  let prevState = initState || {};
  let prevContent = null;
  const update = (state) => {
    state = state || prevState;
    let content = render(state, update);
    if (Array.isArray(content)) {
      content = $.flatten(content);
      $.updateElements(target, content, prevContent || []);
    } else {
      $.updateElement(target, content, prevContent);
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
};

$.Component = (render, defaultState) => {
  return (initState, target) => $.makeComponent(
    render,
    initState || defaultState,
    target
  );
};

//---------------------------------------------------------
//UI APP

$.getType = (value) => {
  const type = typeof value;
  if (['string', 'number', 'function'].includes(type)) { return type; }
  if (type === 'boolean') { return 'bool'; }
  if (!value) { return 'null'; }
  if (Array.isArray(value)) { return 'list'; }
  return 'record';
};

$.isListOrRecord = (value) => {
  const type = $.getType(value);
  return type === 'list' || type === 'record';
};

$.stringify = (value) => {
  const type = $.getType(value);
  if (type === 'list') {
    return '[' +
      value.map($.stringify).join(',') +
    ']';
  }
  if (type === 'record') {
    return '{' +
      Object.entries(value).map(([k, v]) =>
        JSON.stringify(k) + ':' + $.stringify(v)
      ).join(',') +
    '}';
  }
  if (type === 'function') {
    return value.toString();
  }
  return JSON.stringify(value);
};

$.removeItem = (items, i) => {
  items.splice(i, 1); return items;
};

$.insertItem = (items, i, item) => {
  items.splice(i, 0, item); return items;
};

$.xButton = (onClick) => {
  return $.h('button', { className: 'x-button', onClick }, 'X')
};

$.cycleIndicator = (depth) => {
  return $.h('div', { className: 'cycle-indicator' }, '^' + depth + '^');
};

$.valueEditorOrCycle = (value, input, path, update) => {
  const parentIdx = path.indexOf(value);
  return (parentIdx >= 0) ? $.cycleIndicator(path.length - parentIdx) :
    $.anyValueEditor(value, input, path.concat([value]), update);
};

$.textEditor = (value, input, update, isValid) => {
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
  return $.h('textarea', {
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
        // TODO: These are really just needed for func-editor
        document.activeElement.blur();
        document.activeElement.scrollTop = 0;
        document.activeElement.scrollLeft = 0;
        update({ value, input: value });
      }
    }
  });
};

$.jsonEditor = (value, input, update) => {
  const json = JSON.stringify(value, null, 2);
  const updateJson = ({ value, input }) => {
    try {
      if (value !== json) { input = input.trim(); }
      value = JSON.parse(value);
      if ($.isListOrRecord(value)) { input = null; }
    } catch(ex) { }
    update({ value, input });
  };
  const isValid = (text) => {
    try { JSON.parse(text); return true; }
    catch(ex) { return false; }
  };
  return $.textEditor(json, input, updateJson, isValid)
};

$.listEditor = (value, input, path, update) => {
  input = input || { i: -1 };
  return $.h('div', { className: 'list-editor' },
    value.map((v, i) =>
      $.h('div', { key: i, className: 'editor-row' },
        $.xButton(() => {
          value = $.removeItem(value, i);
          update({ value, input: null });
        }),
        $.valueEditorOrCycle(
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
    $.h('button', {
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

$.recordEditor = (value, input, path, update) => {
  input = input || { k: null, v: null };
  return $.h('div', { className: 'record-editor' },
    Object.entries(value).map(([k, v], i) =>
      $.h('div', { key: i, className: 'editor-row' },
        $.xButton(() => {
          delete value[k];
          update({ value, input: null });
        }),
        $.textEditor(k, (input.k === k ? input.value : null), (state) => {
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
        $.h('span', { className: 'colon' }, ':'),
        $.valueEditorOrCycle(
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
    $.h('button', {
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

$.funcEditor = (value, input, update) => {
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
  return $.h('div', { className: 'func-editor' },
    $.textEditor(value.toString(), input, (state) => {
      if (state.value !== value.toString()) {
        value = parseFunc(state.value) || value;
      }
      input = state.input;
      update({ value, input });
    }, parseFunc)
  );
};

$.anyValueEditor = (value, input, path, update) => {
  const type = $.getType(value);
  return (
    (type === 'list'    ) ? $.listEditor  (value, input, path, update) :
    (type === 'record'  ) ? $.recordEditor(value, input, path, update) :
    (type === 'function') ? $.funcEditor  (value, input, update) :
                            $.jsonEditor  (value, input, update)
  );
};


$.initialize = () => {
  const ValueEditor = $.Component(({ value, input }, update) => {
    return $.anyValueEditor(value, input, [value], update);
  }, { value: null });

  const GlobalCssEditor = $.Component(({ css }, update) => {
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
      $.h('div', { className: 'css-editor' },
        $.h('p', {}, 'Global CSS:'),
        $.h('textarea', {
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
    auto 1fr;
  column-gap: 8px;
  row-gap: 8px;
}
body > :first-child {
  grid-row: 1 / 99;
  grid-column: 1;
}
button {
  cursor: pointer;
}
.regenerator {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: #FFE;
  font-weight: bold;
  color: #880;
  border: 2px solid #880;
  border-radius: 12px;
  padding: 6px;
  row-gap: 4px;
}
.regenerator button {
  background-color: #FFC;
  border: 1px solid #660;
  border-radius: 4px;
  color: #660;
}
.console {
  display: flex;
  flex-direction: column;
  background-color: #F8F8F8;
  border: 2px solid black;
  border-radius: 6px;
  padding: 4px;
  row-gap: 4px;
}
.console textarea,
.console .result {
  background-color: white;
  border: 1px solid #888888;
  min-width: 250px;
  min-height: 40px;
  margin: 0;
}
.console button {
  align-self: flex-start;
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
.editor-row > .text-editor,
.editor-row > .colon {
  margin-top: -3px;
  margin-bottom: -5px;
}
.colon + .text-editor, .colon {
  margin-left: -2px;
}
.cycle-indicator {
  color: #CC4400;
  font-weight: bold;
  font-family: monospace;
  letter-spacing: -1;
  margin-left: 4px;
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
.func-editor > .text-editor {
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  width: min-content;
  border: 2px solid #CCBB66;
  background-color: #FFEE99;
  border-radius: 6px;
  min-width: 26px;
  min-height: 20px;
  white-space: nowrap;
  /* minimized view: */
  max-width: 200px;
  max-height: 150px;
  overflow-x: hidden;
  overflow-y: hidden;
  font-size: 8px;
}
.func-editor > .text-editor:hover {
  background-color: #FFFFBB;
  border-color: #FFCC66;
}
.func-editor > .text-editor:focus {
  background-color: white;
  border-color: #DD8800;
  position: fixed;
  top: 20px;
  left: 20px;
  width: calc(100% - 42px);
  height: calc(100% - 42px);
  outline: none;
  /* un-minimized view: */
  max-width: initial;
  max-height: initial;
  overflow-x: auto;
  overflow-y: auto;
  font-size: initial;
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

  const JSConsole = $.Component(({ value, input, result }, update) => {
    let output = '';
    try { output = JSON.stringify(result); }
    catch (ex) { output = String(result); }
    const textDiv = document.createElement('div');
    textDiv.textContent = String(output);
    output = textDiv.innerHTML;
    return $.h('div', { className: 'console' }, 'CONSOLE:',
      $.textEditor(value, input, (state) => {
        value = input = state.input;
        update({ value, input, result });
      }),
      $.h('button', {
        type: 'button',
        onClick: () => {
          let result = undefined;
          try { eval('(result = (' + value + '));'); }
          catch (ex) { result = ex.toString(); }
          update({ value, input, result });
        }
      }, '> RUN'),
      $.h('pre', { className: 'result' }, output)
    );
  }, { value: 'alert("Hello, world!")' });
  
  const Regenerator = $.Component(() => {
    const regeneratePage = () => {
      const bootstrapCode = $.generateBootstrapCode();
      const bootScript = $.createElement($.h('script', {
        type: 'application/javascript'
      }));
      bootScript.innerHTML = '\n' + bootstrapCode + '\n';
      const title = document.head.querySelector('title').innerHTML;
      document.head.innerHTML = '<title>' + title + '</title>';
      document.body.innerHTML = '';
      setTimeout(() => document.head.appendChild(bootScript));
    };
    const downloadHTML = () => {
      const htmlContent = ['<html>' + document.head.outerHTML + '<body></body></html>'];
      const blob = new Blob(htmlContent, { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'bootstrap.html';
      link.click();
    };
    const downloadJS = () => {
      const jsContent = [document.head.querySelector('script').innerHTML];
      const blob = new Blob(jsContent, { type: 'application/javascript' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'bootstrap.js';
      link.click();
    };
    return $.h('div', { className: 'regenerator' },
      $.h('div', {}, 'Regenerate the entire app in its current state?'),
      $.h('button', {
        type: 'button',
        onClick: regeneratePage
      }, 'Regenerate the page from scratch!'),
      $.h('button', {
        type: 'button',
        onClick: () => {
          regeneratePage();
          setTimeout(downloadHTML, 200);
        }
      }, 'Download as self-bootstrapping HTML document'),
      $.h('button', {
        type: 'button',
        onClick: () => {
          regeneratePage();
          setTimeout(downloadJS, 200);
        }
      }, 'Download as self-bootstrapping JavaScript document')
    );
  }, { doDelay: false });

  $.afterWindowLoad(() => {
    GlobalCssEditor({ css: globalCss }).appendTo(document.body);
    Regenerator().appendTo(document.body);
    JSConsole().appendTo(document.body);
    ValueEditor({ value: $ }).appendTo(document.body);
  });
};

$.afterWindowLoad = (callback) => {
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener("load", callback);
  }
};

$.initialize();

// ------------- bootstrapper ------

$.serialize = (obj) => {
  const values = [];
  const entries = [];
  const addEntry = (value) => {
    const isArr = Array.isArray(value);
    const isObj = value && (typeof value === 'object');
    if (!(isArr || isObj)) { return value; }
    let idx = values.findIndex(r => r === value);
    if (idx >= 0) { return [idx]; }
    idx = values.push(value) - 1;
    const entry = (isArr) ? [] : {};
    entries.push(entry);
    Object.keys(value).forEach(k => entry[k] = addEntry(value[k]));
    return [idx];
  };
  addEntry(obj);
  return entries;
};

$.hydrateEntries = (entries) => {
  entries.forEach(entry => {
    Object.keys(entry).forEach(k => {
      const v = entry[k];
      if (Array.isArray(v)) {
        entry[k] = entries[v[0]];
      }
    })
  });
  return entries;
}

$.deepCopy = (obj) => {
  let result = undefined;
  try { eval('(result = (' + $.stringify(obj) + '));'); }
  catch (cause) { throw new Error('Unable to deep-copy', { cause }); }
  return result;
}

$.deserialize = (entries) => {
  return $.hydrateEntries($.deepCopy(entries));
};

$.generateBootstrapCode = () => {
  const entries = $.stringify($.serialize($));
  return '(function bootstrap(){' +
    'const e = ' + entries + ';' +
    'const $ = e[0];' +
    '$.hydrateEntries(e);' +
    '$.initialize();' +
  '}())';
};
