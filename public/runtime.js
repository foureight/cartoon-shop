/* Cartoon-Shop – responzivní renderer šablon (React 18).
   Stránka načte views/<Desktop>.html při šířce >= 1024 px, jinak views/<Mobil>.html,
   a při změně šířky okna pohled přepne. */
(function () {
  'use strict';
  var R = window.React, RD = window.ReactDOM, h = R.createElement;
  var VOID = { area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1, link:1, meta:1, source:1, track:1, wbr:1 };
  var EVENTS = { onclick:'onClick', onchange:'onChange', oninput:'onInput', onmouseenter:'onMouseEnter', onmouseleave:'onMouseLeave', onsubmit:'onSubmit', onfocus:'onFocus', onblur:'onBlur', onkeydown:'onKeyDown', onmouseover:'onMouseOver', onmouseout:'onMouseOut' };
  var RENAME = { 'class':'className', 'for':'htmlFor', tabindex:'tabIndex', readonly:'readOnly', maxlength:'maxLength', minlength:'minLength', autocomplete:'autoComplete', inputmode:'inputMode', colspan:'colSpan', rowspan:'rowSpan', srcset:'srcSet', crossorigin:'crossOrigin', autofocus:'autoFocus', enterkeyhint:'enterKeyHint',
    'stroke-width':'strokeWidth', 'stroke-linecap':'strokeLinecap', 'stroke-linejoin':'strokeLinejoin', 'stroke-dasharray':'strokeDasharray', 'stroke-miterlimit':'strokeMiterlimit', 'fill-rule':'fillRule', 'clip-rule':'clipRule', 'fill-opacity':'fillOpacity', 'stroke-opacity':'strokeOpacity', 'stop-color':'stopColor', 'stop-opacity':'stopOpacity', 'text-anchor':'textAnchor', 'font-size':'fontSize', 'font-weight':'fontWeight', 'xlink:href':'xlinkHref', 'clip-path':'clipPath' };
  var BOOL = { checked:1, disabled:1, hidden:1, required:1, multiple:1, open:1, selected:1, readonly:1, autofocus:1, novalidate:1 };
  var HOLE = /\{\{\s*([^}]*?)\s*\}\}/g, WHOLE = /^\s*\{\{\s*([^}]*?)\s*\}\}\s*$/;

  function lookup(path, scope) {
    if (path === 'true') return true; if (path === 'false') return false;
    if (path === 'null') return null; if (path === 'undefined') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
    var m = /^(['"])(.*)\1$/.exec(path); if (m) return m[2];
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null || v === false ? '' : String(v); });
  }
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }
  function styleObj(s) {
    var o = {};
    String(s).split(';').forEach(function (decl) {
      var i = decl.indexOf(':'); if (i < 0) return;
      var k = decl.slice(0, i).trim(), v = decl.slice(i + 1).trim(); if (!k) return;
      var imp = /!important$/.test(v); if (imp) v = v.replace(/\s*!important$/, '');
      o[k.indexOf('--') === 0 ? k : camel(k)] = v;
    });
    return o;
  }

  function renderNodes(nodes, scope, ctx) {
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var r = renderNode(nodes[i], scope, ctx, i);
      if (r == null) continue;
      if (Array.isArray(r)) out.push.apply(out, r); else out.push(r);
    }
    return out;
  }

  function renderNode(n, scope, ctx, key) {
    if (n.nodeType === 3) {
      var t = n.nodeValue; if (t.indexOf('{{') < 0) return t;
      var parts = [], last = 0, m, k = 0; HOLE.lastIndex = 0;
      while ((m = HOLE.exec(t))) {
        if (m.index > last) parts.push(t.slice(last, m.index));
        var v = lookup(m[1], scope);
        parts.push(h('span', { key: 'h' + (k++) }, v == null || v === false ? '' : String(v)));
        last = HOLE.lastIndex;
      }
      if (last < t.length) parts.push(t.slice(last));
      return h(R.Fragment, { key: key }, parts);
    }
    if (n.nodeType !== 1) return null;
    var tag = n.tagName.toLowerCase();
    if (tag === 'helmet' || tag === 'script') return null;
    if (tag === 'sc-if') {
      var cond = valueOf(n.getAttribute('value'), scope);
      return cond ? h(R.Fragment, { key: key }, renderNodes(n.childNodes, scope, ctx)) : null;
    }
    if (tag === 'sc-for') {
      var list = valueOf(n.getAttribute('list'), scope) || [], as = n.getAttribute('as') || 'item';
      return h(R.Fragment, { key: key }, [].map.call(list, function (item, idx) {
        var s = Object.create(scope); s[as] = item; s.$index = idx;
        return h(R.Fragment, { key: idx }, renderNodes(n.childNodes, s, ctx));
      }));
    }
    if (tag === 'dc-import') {
      var name = n.getAttribute('name'), Comp = REG[name], props = { key: key };
      [].forEach.call(n.attributes, function (a) {
        if (a.name === 'name' || a.name.indexOf('hint-') === 0) return;
        props[camel(a.name)] = valueOf(a.value, scope);
      });
      return Comp ? h(Comp, props) : null;
    }
    var p = { key: key }, isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
    var hasChange = false;
    [].forEach.call(n.attributes, function (a) { if (a.name === 'onchange' || a.name === 'oninput') hasChange = true; });
    [].forEach.call(n.attributes, function (a) {
      var name = a.name, raw = a.value;
      if (name.indexOf('hint-') === 0) return;
      var whole = WHOLE.exec(raw), val = whole ? lookup(whole[1], scope) : (raw.indexOf('{{') >= 0 ? interp(raw, scope) : raw);
      if (EVENTS[name]) { if (typeof val === 'function') p[EVENTS[name]] = val; return; }
      if (name === 'style') { if (val) p.style = typeof val === 'string' ? styleObj(val) : val; return; }
      if (BOOL[name]) {
        var b = whole ? !!val && val !== 'false' : true;
        if (name === 'checked') { if (whole && hasChange) p.checked = b; else p.defaultChecked = b; return; }
        if (name === 'selected') { p.defaultSelected = b; return; }
        p[RENAME[name] || name] = b; return;
      }
      if (name === 'value' && isInput && !hasChange) { p.defaultValue = val; return; }
      p[RENAME[name] || name] = val;
    });
    if (p.checked !== undefined && !p.onChange) p.onChange = function () {};
    if (tag === 'textarea') { var tx = n.textContent; if (tx && p.defaultValue === undefined) p.defaultValue = tx; return h(tag, p); }
    if (VOID[tag]) return h(tag, p);
    return h(tag, p, renderNodes(n.childNodes, scope, ctx));
  }
  function valueOf(raw, scope) {
    if (raw == null) return undefined;
    var w = WHOLE.exec(raw); if (w) return lookup(w[1], scope);
    return raw.indexOf('{{') >= 0 ? interp(raw, scope) : raw;
  }

  var REG = {};
  function DCLogic(props) { R.Component.call(this, props); this.state = this.state || {}; }
  DCLogic.prototype = Object.create(R.Component.prototype);
  DCLogic.prototype.constructor = DCLogic;
  DCLogic.prototype.render = function () {
    var vals = this.renderVals ? this.renderVals() : {};
    return h(R.Fragment, null, renderNodes(this.__tpl, vals || {}, this));
  };

  function parseDoc(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var tp = doc.querySelector('template#x-dc'), root = tp ? tp.content : doc.querySelector('x-dc'), script = doc.querySelector('script[type="text/x-dc"]');
    var helmet = root ? root.querySelector('helmet') : null;
    var tpl = root ? [].filter.call(root.childNodes, function (c) { return !(c.nodeType === 1 && c.tagName.toLowerCase() === 'helmet'); }) : [];
    return { tpl: tpl, styles: helmet ? [].map.call(helmet.querySelectorAll('style'), function (s) { return s.textContent; }) : [], code: script ? script.textContent : '', imports: root ? [].map.call(root.querySelectorAll('dc-import'), function (d) { return d.getAttribute('name'); }) : [] };
  }
  function compile(name, parsed) {
    var Comp;
    try {
      Comp = new Function('DCLogic', 'React', '"use strict";' + parsed.code + '\n;return typeof Component!=="undefined"?Component:null;')(classBase(), R);
    } catch (e) { console.error('[' + name + ']', e); }
    if (!Comp) { Comp = function () { DCLogic.apply(this, arguments); }; Comp.prototype = Object.create(DCLogic.prototype); }
    Comp.prototype.__tpl = parsed.tpl;
    Comp.displayName = name;
    REG[name] = Comp;
    return Comp;
  }
  function classBase() {
    // ES class extending React.Component so that `class X extends DCLogic` + super() works
    return (new Function('R', 'render', 'return class DCLogic extends R.Component{constructor(p){super(p);this.state=this.state||{}}render(){return render.call(this)}}'))(R, DCLogic.prototype.render);
  }
  /* Styly z <helmet> si pamatujeme po šablonách; při přepnutí desktop/mobil
     se odstraní styly předchozího pohledu a vloží styly nového (pravidla se liší). */
  var STY = {}, IMP = {}, BASE = 'views/';
  function load(name) {
    if (REG[name]) return Promise.resolve(REG[name]);
    if (load.p[name]) return load.p[name];
    return (load.p[name] = fetch(BASE + name + '.html').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + name); return r.text();
    }).then(function (txt) {
      var parsed = parseDoc(txt); STY[name] = parsed.styles; IMP[name] = parsed.imports;
      return Promise.all(parsed.imports.map(load)).then(function () { return compile(name, parsed); });
    }));
  }
  load.p = {};
  function collectStyles(name, out, seen) {
    if (seen[name]) return out; seen[name] = 1;
    (STY[name] || []).forEach(function (css) { if (css && out.indexOf(css) < 0) out.push(css); });
    (IMP[name] || []).forEach(function (n) { collectStyles(n, out, seen); });
    return out;
  }
  function applyStyles(name) {
    [].forEach.call(document.querySelectorAll('style[data-dc-view]'), function (s) { s.parentNode.removeChild(s); });
    collectStyles(name, [], {}).forEach(function (css) {
      var s = document.createElement('style'); s.setAttribute('data-dc-view', name); s.textContent = css; document.head.appendChild(s);
    });
  }

  var me = document.currentScript, DESK = me && me.getAttribute('data-desktop'), MOB = me && me.getAttribute('data-mobile');
  var MQ = window.matchMedia('(min-width: 1024px)');
  function boot() {
    var mount = document.getElementById('app');
    if (!mount) { mount = document.createElement('div'); mount.id = 'app'; document.body.appendChild(mount); }
    var root = RD.createRoot(mount), current = null, token = 0;
    function show() {
      var name = MQ.matches ? DESK : MOB;
      if (!name || name === current) return;
      var my = ++token;
      load(name).then(function (Comp) {
        if (my !== token) return;
        current = name;
        document.documentElement.setAttribute('data-view', MQ.matches ? 'desktop' : 'mobile');
        applyStyles(name);
        root.render(h(Comp, { key: name }));
      }).catch(function (e) { console.error(e); });
    }
    if (MQ.addEventListener) MQ.addEventListener('change', show); else MQ.addListener(show);
    show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
