import Swiper from '../plugins/swiper/swiper-bundle.min.js';
import { fetchApi } from '../plugins/fetch/fetch.js';

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.IMask = {}));
})(this, (function (exports) { 'use strict';

  /** Checks if value is string */
  function isString(str) {
    return typeof str === 'string' || str instanceof String;
  }

  /** Checks if value is object */
  function isObject(obj) {
    var _obj$constructor;
    return typeof obj === 'object' && obj != null && (obj == null || (_obj$constructor = obj.constructor) == null ? void 0 : _obj$constructor.name) === 'Object';
  }
  function pick(obj, keys) {
    if (Array.isArray(keys)) return pick(obj, (_, k) => keys.includes(k));
    return Object.entries(obj).reduce((acc, _ref) => {
      let [k, v] = _ref;
      if (keys(v, k)) acc[k] = v;
      return acc;
    }, {});
  }

  /** Direction */
  const DIRECTION = {
    NONE: 'NONE',
    LEFT: 'LEFT',
    FORCE_LEFT: 'FORCE_LEFT',
    RIGHT: 'RIGHT',
    FORCE_RIGHT: 'FORCE_RIGHT'
  };

  /** Direction */

  function forceDirection(direction) {
    switch (direction) {
      case DIRECTION.LEFT:
        return DIRECTION.FORCE_LEFT;
      case DIRECTION.RIGHT:
        return DIRECTION.FORCE_RIGHT;
      default:
        return direction;
    }
  }

  /** Escapes regular expression control chars */
  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
  }

  // cloned from https://github.com/epoberezkin/fast-deep-equal with small changes
  function objectIncludes(b, a) {
    if (a === b) return true;
    const arrA = Array.isArray(a),
      arrB = Array.isArray(b);
    let i;
    if (arrA && arrB) {
      if (a.length != b.length) return false;
      for (i = 0; i < a.length; i++) if (!objectIncludes(a[i], b[i])) return false;
      return true;
    }
    if (arrA != arrB) return false;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const dateA = a instanceof Date,
        dateB = b instanceof Date;
      if (dateA && dateB) return a.getTime() == b.getTime();
      if (dateA != dateB) return false;
      const regexpA = a instanceof RegExp,
        regexpB = b instanceof RegExp;
      if (regexpA && regexpB) return a.toString() == b.toString();
      if (regexpA != regexpB) return false;
      const keys = Object.keys(a);
      // if (keys.length !== Object.keys(b).length) return false;

      for (i = 0; i < keys.length; i++) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
      for (i = 0; i < keys.length; i++) if (!objectIncludes(b[keys[i]], a[keys[i]])) return false;
      return true;
    } else if (a && b && typeof a === 'function' && typeof b === 'function') {
      return a.toString() === b.toString();
    }
    return false;
  }

  /** Selection range */

  /** Provides details of changing input */
  class ActionDetails {
    /** Current input value */

    /** Current cursor position */

    /** Old input value */

    /** Old selection */

    constructor(opts) {
      Object.assign(this, opts);

      // double check if left part was changed (autofilling, other non-standard input triggers)
      while (this.value.slice(0, this.startChangePos) !== this.oldValue.slice(0, this.startChangePos)) {
        --this.oldSelection.start;
      }
    }

    /** Start changing position */
    get startChangePos() {
      return Math.min(this.cursorPos, this.oldSelection.start);
    }

    /** Inserted symbols count */
    get insertedCount() {
      return this.cursorPos - this.startChangePos;
    }

    /** Inserted symbols */
    get inserted() {
      return this.value.substr(this.startChangePos, this.insertedCount);
    }

    /** Removed symbols count */
    get removedCount() {
      // Math.max for opposite operation
      return Math.max(this.oldSelection.end - this.startChangePos ||
      // for Delete
      this.oldValue.length - this.value.length, 0);
    }

    /** Removed symbols */
    get removed() {
      return this.oldValue.substr(this.startChangePos, this.removedCount);
    }

    /** Unchanged head symbols */
    get head() {
      return this.value.substring(0, this.startChangePos);
    }

    /** Unchanged tail symbols */
    get tail() {
      return this.value.substring(this.startChangePos + this.insertedCount);
    }

    /** Remove direction */
    get removeDirection() {
      if (!this.removedCount || this.insertedCount) return DIRECTION.NONE;

      // align right if delete at right
      return (this.oldSelection.end === this.cursorPos || this.oldSelection.start === this.cursorPos) &&
      // if not range removed (event with backspace)
      this.oldSelection.end === this.oldSelection.start ? DIRECTION.RIGHT : DIRECTION.LEFT;
    }
  }

  /** Applies mask on element */
  function IMask(el, opts) {
    // currently available only for input-like elements
    return new IMask.InputMask(el, opts);
  }

  // TODO can't use overloads here because of https://github.com/microsoft/TypeScript/issues/50754
  // export function maskedClass(mask: string): typeof MaskedPattern;
  // export function maskedClass(mask: DateConstructor): typeof MaskedDate;
  // export function maskedClass(mask: NumberConstructor): typeof MaskedNumber;
  // export function maskedClass(mask: Array<any> | ArrayConstructor): typeof MaskedDynamic;
  // export function maskedClass(mask: MaskedDate): typeof MaskedDate;
  // export function maskedClass(mask: MaskedNumber): typeof MaskedNumber;
  // export function maskedClass(mask: MaskedEnum): typeof MaskedEnum;
  // export function maskedClass(mask: MaskedRange): typeof MaskedRange;
  // export function maskedClass(mask: MaskedRegExp): typeof MaskedRegExp;
  // export function maskedClass(mask: MaskedFunction): typeof MaskedFunction;
  // export function maskedClass(mask: MaskedPattern): typeof MaskedPattern;
  // export function maskedClass(mask: MaskedDynamic): typeof MaskedDynamic;
  // export function maskedClass(mask: Masked): typeof Masked;
  // export function maskedClass(mask: typeof Masked): typeof Masked;
  // export function maskedClass(mask: typeof MaskedDate): typeof MaskedDate;
  // export function maskedClass(mask: typeof MaskedNumber): typeof MaskedNumber;
  // export function maskedClass(mask: typeof MaskedEnum): typeof MaskedEnum;
  // export function maskedClass(mask: typeof MaskedRange): typeof MaskedRange;
  // export function maskedClass(mask: typeof MaskedRegExp): typeof MaskedRegExp;
  // export function maskedClass(mask: typeof MaskedFunction): typeof MaskedFunction;
  // export function maskedClass(mask: typeof MaskedPattern): typeof MaskedPattern;
  // export function maskedClass(mask: typeof MaskedDynamic): typeof MaskedDynamic;
  // export function maskedClass<Mask extends typeof Masked> (mask: Mask): Mask;
  // export function maskedClass(mask: RegExp): typeof MaskedRegExp;
  // export function maskedClass(mask: (value: string, ...args: any[]) => boolean): typeof MaskedFunction;
  /** Get Masked class by mask type */
  function maskedClass(mask) /* TODO */{
    if (mask == null) throw new Error('mask property should be defined');
    if (mask instanceof RegExp) return IMask.MaskedRegExp;
    if (isString(mask)) return IMask.MaskedPattern;
    if (mask === Date) return IMask.MaskedDate;
    if (mask === Number) return IMask.MaskedNumber;
    if (Array.isArray(mask) || mask === Array) return IMask.MaskedDynamic;
    if (IMask.Masked && mask.prototype instanceof IMask.Masked) return mask;
    if (IMask.Masked && mask instanceof IMask.Masked) return mask.constructor;
    if (mask instanceof Function) return IMask.MaskedFunction;
    console.warn('Mask not found for mask', mask); // eslint-disable-line no-console
    return IMask.Masked;
  }
  function normalizeOpts(opts) {
    if (!opts) throw new Error('Options in not defined');
    if (IMask.Masked) {
      if (opts.prototype instanceof IMask.Masked) return {
        mask: opts
      };

      /*
        handle cases like:
        1) opts = Masked
        2) opts = { mask: Masked, ...instanceOpts }
      */
      const {
        mask = undefined,
        ...instanceOpts
      } = opts instanceof IMask.Masked ? {
        mask: opts
      } : isObject(opts) && opts.mask instanceof IMask.Masked ? opts : {};
      if (mask) {
        const _mask = mask.mask;
        return {
          ...pick(mask, (_, k) => !k.startsWith('_')),
          mask: mask.constructor,
          _mask,
          ...instanceOpts
        };
      }
    }
    if (!isObject(opts)) return {
      mask: opts
    };
    return {
      ...opts
    };
  }

  // TODO can't use overloads here because of https://github.com/microsoft/TypeScript/issues/50754

  // From masked
  // export default function createMask<Opts extends Masked, ReturnMasked=Opts> (opts: Opts): ReturnMasked;
  // // From masked class
  // export default function createMask<Opts extends MaskedOptions<typeof Masked>, ReturnMasked extends Masked=InstanceType<Opts['mask']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedDate>, ReturnMasked extends MaskedDate=MaskedDate<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedNumber>, ReturnMasked extends MaskedNumber=MaskedNumber<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedEnum>, ReturnMasked extends MaskedEnum=MaskedEnum<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedRange>, ReturnMasked extends MaskedRange=MaskedRange<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedRegExp>, ReturnMasked extends MaskedRegExp=MaskedRegExp<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedFunction>, ReturnMasked extends MaskedFunction=MaskedFunction<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedPattern>, ReturnMasked extends MaskedPattern=MaskedPattern<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedDynamic>, ReturnMasked extends MaskedDynamic=MaskedDynamic<Opts['parent']>> (opts: Opts): ReturnMasked;
  // // From mask opts
  // export default function createMask<Opts extends MaskedOptions<Masked>, ReturnMasked=Opts extends MaskedOptions<infer M> ? M : never> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedNumberOptions, ReturnMasked extends MaskedNumber=MaskedNumber<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedDateFactoryOptions, ReturnMasked extends MaskedDate=MaskedDate<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedEnumOptions, ReturnMasked extends MaskedEnum=MaskedEnum<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedRangeOptions, ReturnMasked extends MaskedRange=MaskedRange<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedPatternOptions, ReturnMasked extends MaskedPattern=MaskedPattern<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedDynamicOptions, ReturnMasked extends MaskedDynamic=MaskedDynamic<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<RegExp>, ReturnMasked extends MaskedRegExp=MaskedRegExp<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<Function>, ReturnMasked extends MaskedFunction=MaskedFunction<Opts['parent']>> (opts: Opts): ReturnMasked;

  /** Creates new {@link Masked} depending on mask type */
  function createMask(opts) {
    if (IMask.Masked && opts instanceof IMask.Masked) return opts;
    const nOpts = normalizeOpts(opts);
    const MaskedClass = maskedClass(nOpts.mask);
    if (!MaskedClass) throw new Error('Masked class is not found for provided mask, appropriate module needs to be imported manually before creating mask.');
    if (nOpts.mask === MaskedClass) delete nOpts.mask;
    if (nOpts._mask) {
      nOpts.mask = nOpts._mask;
      delete nOpts._mask;
    }
    return new MaskedClass(nOpts);
  }
  IMask.createMask = createMask;

  /**  Generic element API to use with mask */
  class MaskElement {
    /** */

    /** */

    /** */

    /** Safely returns selection start */
    get selectionStart() {
      let start;
      try {
        start = this._unsafeSelectionStart;
      } catch {}
      return start != null ? start : this.value.length;
    }

    /** Safely returns selection end */
    get selectionEnd() {
      let end;
      try {
        end = this._unsafeSelectionEnd;
      } catch {}
      return end != null ? end : this.value.length;
    }

    /** Safely sets element selection */
    select(start, end) {
      if (start == null || end == null || start === this.selectionStart && end === this.selectionEnd) return;
      try {
        this._unsafeSelect(start, end);
      } catch {}
    }

    /** */
    get isActive() {
      return false;
    }
    /** */

    /** */

    /** */
  }

  IMask.MaskElement = MaskElement;

  /** Bridge between HTMLElement and {@link Masked} */
  class HTMLMaskElement extends MaskElement {
    /** HTMLElement to use mask on */

    constructor(input) {
      super();
      this.input = input;
      this._handlers = {};
    }
    get rootElement() {
      var _this$input$getRootNo, _this$input$getRootNo2, _this$input;
      return (_this$input$getRootNo = (_this$input$getRootNo2 = (_this$input = this.input).getRootNode) == null ? void 0 : _this$input$getRootNo2.call(_this$input)) != null ? _this$input$getRootNo : document;
    }

    /**
      Is element in focus
    */
    get isActive() {
      return this.input === this.rootElement.activeElement;
    }

    /**
      Binds HTMLElement events to mask internal events
    */
    bindEvents(handlers) {
      Object.keys(handlers).forEach(event => this._toggleEventHandler(HTMLMaskElement.EVENTS_MAP[event], handlers[event]));
    }

    /**
      Unbinds HTMLElement events to mask internal events
    */
    unbindEvents() {
      Object.keys(this._handlers).forEach(event => this._toggleEventHandler(event));
    }
    _toggleEventHandler(event, handler) {
      if (this._handlers[event]) {
        this.input.removeEventListener(event, this._handlers[event]);
        delete this._handlers[event];
      }
      if (handler) {
        this.input.addEventListener(event, handler);
        this._handlers[event] = handler;
      }
    }
  }
  /** Mapping between HTMLElement events and mask internal events */
  HTMLMaskElement.EVENTS_MAP = {
    selectionChange: 'keydown',
    input: 'input',
    drop: 'drop',
    click: 'click',
    focus: 'focus',
    commit: 'blur'
  };
  IMask.HTMLMaskElement = HTMLMaskElement;

  /** Bridge between InputElement and {@link Masked} */
  class HTMLInputMaskElement extends HTMLMaskElement {
    /** InputElement to use mask on */

    constructor(input) {
      super(input);
      this.input = input;
      this._handlers = {};
    }

    /** Returns InputElement selection start */
    get _unsafeSelectionStart() {
      return this.input.selectionStart != null ? this.input.selectionStart : this.value.length;
    }

    /** Returns InputElement selection end */
    get _unsafeSelectionEnd() {
      return this.input.selectionEnd;
    }

    /** Sets InputElement selection */
    _unsafeSelect(start, end) {
      this.input.setSelectionRange(start, end);
    }
    get value() {
      return this.input.value;
    }
    set value(value) {
      this.input.value = value;
    }
  }
  IMask.HTMLMaskElement = HTMLMaskElement;

  class HTMLContenteditableMaskElement extends HTMLMaskElement {
    /** Returns HTMLElement selection start */
    get _unsafeSelectionStart() {
      const root = this.rootElement;
      const selection = root.getSelection && root.getSelection();
      const anchorOffset = selection && selection.anchorOffset;
      const focusOffset = selection && selection.focusOffset;
      if (focusOffset == null || anchorOffset == null || anchorOffset < focusOffset) {
        return anchorOffset;
      }
      return focusOffset;
    }

    /** Returns HTMLElement selection end */
    get _unsafeSelectionEnd() {
      const root = this.rootElement;
      const selection = root.getSelection && root.getSelection();
      const anchorOffset = selection && selection.anchorOffset;
      const focusOffset = selection && selection.focusOffset;
      if (focusOffset == null || anchorOffset == null || anchorOffset > focusOffset) {
        return anchorOffset;
      }
      return focusOffset;
    }

    /** Sets HTMLElement selection */
    _unsafeSelect(start, end) {
      if (!this.rootElement.createRange) return;
      const range = this.rootElement.createRange();
      range.setStart(this.input.firstChild || this.input, start);
      range.setEnd(this.input.lastChild || this.input, end);
      const root = this.rootElement;
      const selection = root.getSelection && root.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    /** HTMLElement value */
    get value() {
      return this.input.textContent || '';
    }
    set value(value) {
      this.input.textContent = value;
    }
  }
  IMask.HTMLContenteditableMaskElement = HTMLContenteditableMaskElement;

  /** Listens to element events and controls changes between element and {@link Masked} */
  class InputMask {
    /**
      View element
    */

    /** Internal {@link Masked} model */

    constructor(el, opts) {
      this.el = el instanceof MaskElement ? el : el.isContentEditable && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' ? new HTMLContenteditableMaskElement(el) : new HTMLInputMaskElement(el);
      this.masked = createMask(opts);
      this._listeners = {};
      this._value = '';
      this._unmaskedValue = '';
      this._saveSelection = this._saveSelection.bind(this);
      this._onInput = this._onInput.bind(this);
      this._onChange = this._onChange.bind(this);
      this._onDrop = this._onDrop.bind(this);
      this._onFocus = this._onFocus.bind(this);
      this._onClick = this._onClick.bind(this);
      this.alignCursor = this.alignCursor.bind(this);
      this.alignCursorFriendly = this.alignCursorFriendly.bind(this);
      this._bindEvents();

      // refresh
      this.updateValue();
      this._onChange();
    }
    maskEquals(mask) {
      var _this$masked;
      return mask == null || ((_this$masked = this.masked) == null ? void 0 : _this$masked.maskEquals(mask));
    }

    /** Masked */
    get mask() {
      return this.masked.mask;
    }
    set mask(mask) {
      if (this.maskEquals(mask)) return;
      if (!(mask instanceof IMask.Masked) && this.masked.constructor === maskedClass(mask)) {
        // TODO "any" no idea
        this.masked.updateOptions({
          mask
        });
        return;
      }
      const masked = mask instanceof IMask.Masked ? mask : createMask({
        mask
      });
      masked.unmaskedValue = this.masked.unmaskedValue;
      this.masked = masked;
    }

    /** Raw value */
    get value() {
      return this._value;
    }
    set value(str) {
      if (this.value === str) return;
      this.masked.value = str;
      this.updateControl();
      this.alignCursor();
    }

    /** Unmasked value */
    get unmaskedValue() {
      return this._unmaskedValue;
    }
    set unmaskedValue(str) {
      if (this.unmaskedValue === str) return;
      this.masked.unmaskedValue = str;
      this.updateControl();
      this.alignCursor();
    }

    /** Typed unmasked value */
    get typedValue() {
      return this.masked.typedValue;
    }
    set typedValue(val) {
      if (this.masked.typedValueEquals(val)) return;
      this.masked.typedValue = val;
      this.updateControl();
      this.alignCursor();
    }

    /** Display value */
    get displayValue() {
      return this.masked.displayValue;
    }

    /** Starts listening to element events */
    _bindEvents() {
      this.el.bindEvents({
        selectionChange: this._saveSelection,
        input: this._onInput,
        drop: this._onDrop,
        click: this._onClick,
        focus: this._onFocus,
        commit: this._onChange
      });
    }

    /** Stops listening to element events */
    _unbindEvents() {
      if (this.el) this.el.unbindEvents();
    }

    /** Fires custom event */
    _fireEvent(ev, e) {
      const listeners = this._listeners[ev];
      if (!listeners) return;
      listeners.forEach(l => l(e));
    }

    /** Current selection start */
    get selectionStart() {
      return this._cursorChanging ? this._changingCursorPos : this.el.selectionStart;
    }

    /** Current cursor position */
    get cursorPos() {
      return this._cursorChanging ? this._changingCursorPos : this.el.selectionEnd;
    }
    set cursorPos(pos) {
      if (!this.el || !this.el.isActive) return;
      this.el.select(pos, pos);
      this._saveSelection();
    }

    /** Stores current selection */
    _saveSelection( /* ev */
    ) {
      if (this.displayValue !== this.el.value) {
        console.warn('Element value was changed outside of mask. Syncronize mask using `mask.updateValue()` to work properly.'); // eslint-disable-line no-console
      }

      this._selection = {
        start: this.selectionStart,
        end: this.cursorPos
      };
    }

    /** Syncronizes model value from view */
    updateValue() {
      this.masked.value = this.el.value;
      this._value = this.masked.value;
    }

    /** Syncronizes view from model value, fires change events */
    updateControl() {
      const newUnmaskedValue = this.masked.unmaskedValue;
      const newValue = this.masked.value;
      const newDisplayValue = this.displayValue;
      const isChanged = this.unmaskedValue !== newUnmaskedValue || this.value !== newValue;
      this._unmaskedValue = newUnmaskedValue;
      this._value = newValue;
      if (this.el.value !== newDisplayValue) this.el.value = newDisplayValue;
      if (isChanged) this._fireChangeEvents();
    }

    /** Updates options with deep equal check, recreates {@link Masked} model if mask type changes */
    updateOptions(opts) {
      const {
        mask,
        ...restOpts
      } = opts;
      const updateMask = !this.maskEquals(mask);
      const updateOpts = !objectIncludes(this.masked, restOpts);
      if (updateMask) this.mask = mask;
      if (updateOpts) this.masked.updateOptions(restOpts); // TODO

      if (updateMask || updateOpts) this.updateControl();
    }

    /** Updates cursor */
    updateCursor(cursorPos) {
      if (cursorPos == null) return;
      this.cursorPos = cursorPos;

      // also queue change cursor for mobile browsers
      this._delayUpdateCursor(cursorPos);
    }

    /** Delays cursor update to support mobile browsers */
    _delayUpdateCursor(cursorPos) {
      this._abortUpdateCursor();
      this._changingCursorPos = cursorPos;
      this._cursorChanging = setTimeout(() => {
        if (!this.el) return; // if was destroyed
        this.cursorPos = this._changingCursorPos;
        this._abortUpdateCursor();
      }, 10);
    }

    /** Fires custom events */
    _fireChangeEvents() {
      this._fireEvent('accept', this._inputEvent);
      if (this.masked.isComplete) this._fireEvent('complete', this._inputEvent);
    }

    /** Aborts delayed cursor update */
    _abortUpdateCursor() {
      if (this._cursorChanging) {
        clearTimeout(this._cursorChanging);
        delete this._cursorChanging;
      }
    }

    /** Aligns cursor to nearest available position */
    alignCursor() {
      this.cursorPos = this.masked.nearestInputPos(this.masked.nearestInputPos(this.cursorPos, DIRECTION.LEFT));
    }

    /** Aligns cursor only if selection is empty */
    alignCursorFriendly() {
      if (this.selectionStart !== this.cursorPos) return; // skip if range is selected
      this.alignCursor();
    }

    /** Adds listener on custom event */
    on(ev, handler) {
      if (!this._listeners[ev]) this._listeners[ev] = [];
      this._listeners[ev].push(handler);
      return this;
    }

    /** Removes custom event listener */
    off(ev, handler) {
      if (!this._listeners[ev]) return this;
      if (!handler) {
        delete this._listeners[ev];
        return this;
      }
      const hIndex = this._listeners[ev].indexOf(handler);
      if (hIndex >= 0) this._listeners[ev].splice(hIndex, 1);
      return this;
    }

    /** Handles view input event */
    _onInput(e) {
      this._inputEvent = e;
      this._abortUpdateCursor();

      // fix strange IE behavior
      if (!this._selection) return this.updateValue();
      const details = new ActionDetails({
        // new state
        value: this.el.value,
        cursorPos: this.cursorPos,
        // old state
        oldValue: this.displayValue,
        oldSelection: this._selection
      });
      const oldRawValue = this.masked.rawInputValue;
      const offset = this.masked.splice(details.startChangePos, details.removed.length, details.inserted, details.removeDirection, {
        input: true,
        raw: true
      }).offset;

      // force align in remove direction only if no input chars were removed
      // otherwise we still need to align with NONE (to get out from fixed symbols for instance)
      const removeDirection = oldRawValue === this.masked.rawInputValue ? details.removeDirection : DIRECTION.NONE;
      let cursorPos = this.masked.nearestInputPos(details.startChangePos + offset, removeDirection);
      if (removeDirection !== DIRECTION.NONE) cursorPos = this.masked.nearestInputPos(cursorPos, DIRECTION.NONE);
      this.updateControl();
      this.updateCursor(cursorPos);
      delete this._inputEvent;
    }

    /** Handles view change event and commits model value */
    _onChange() {
      if (this.displayValue !== this.el.value) {
        this.updateValue();
      }
      this.masked.doCommit();
      this.updateControl();
      this._saveSelection();
    }

    /** Handles view drop event, prevents by default */
    _onDrop(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    /** Restore last selection on focus */
    _onFocus(ev) {
      this.alignCursorFriendly();
    }

    /** Restore last selection on focus */
    _onClick(ev) {
      this.alignCursorFriendly();
    }

    /** Unbind view events and removes element reference */
    destroy() {
      this._unbindEvents();
      this._listeners.length = 0;
      delete this.el;
    }
  }
  IMask.InputMask = InputMask;

  /** Provides details of changing model value */
  class ChangeDetails {
    /** Inserted symbols */

    /** Can skip chars */

    /** Additional offset if any changes occurred before tail */

    /** Raw inserted is used by dynamic mask */

    static normalize(prep) {
      return Array.isArray(prep) ? prep : [prep, new ChangeDetails()];
    }
    constructor(details) {
      Object.assign(this, {
        inserted: '',
        rawInserted: '',
        skip: false,
        tailShift: 0
      }, details);
    }

    /** Aggregate changes */
    aggregate(details) {
      this.rawInserted += details.rawInserted;
      this.skip = this.skip || details.skip;
      this.inserted += details.inserted;
      this.tailShift += details.tailShift;
      return this;
    }

    /** Total offset considering all changes */
    get offset() {
      return this.tailShift + this.inserted.length;
    }
  }
  IMask.ChangeDetails = ChangeDetails;

  /** Provides details of continuous extracted tail */
  class ContinuousTailDetails {
    /** Tail value as string */

    /** Tail start position */

    /** Start position */

    constructor(value, from, stop) {
      if (value === void 0) {
        value = '';
      }
      if (from === void 0) {
        from = 0;
      }
      this.value = value;
      this.from = from;
      this.stop = stop;
    }
    toString() {
      return this.value;
    }
    extend(tail) {
      this.value += String(tail);
    }
    appendTo(masked) {
      return masked.append(this.toString(), {
        tail: true
      }).aggregate(masked._appendPlaceholder());
    }
    get state() {
      return {
        value: this.value,
        from: this.from,
        stop: this.stop
      };
    }
    set state(state) {
      Object.assign(this, state);
    }
    unshift(beforePos) {
      if (!this.value.length || beforePos != null && this.from >= beforePos) return '';
      const shiftChar = this.value[0];
      this.value = this.value.slice(1);
      return shiftChar;
    }
    shift() {
      if (!this.value.length) return '';
      const shiftChar = this.value[this.value.length - 1];
      this.value = this.value.slice(0, -1);
      return shiftChar;
    }
  }

  /** Append flags */

  /** Extract flags */

  // see https://github.com/microsoft/TypeScript/issues/6223

  /** Provides common masking stuff */
  class Masked {
    /** */

    /** */

    /** Transforms value before mask processing */

    /** Transforms each char before mask processing */

    /** Validates if value is acceptable */

    /** Does additional processing at the end of editing */

    /** Format typed value to string */

    /** Parse string to get typed value */

    /** Enable characters overwriting */

    /** */

    /** */

    /** */

    constructor(opts) {
      this._value = '';
      this._update({
        ...Masked.DEFAULTS,
        ...opts
      });
      this._initialized = true;
    }

    /** Sets and applies new options */
    updateOptions(opts) {
      if (!Object.keys(opts).length) return;
      this.withValueRefresh(this._update.bind(this, opts));
    }

    /** Sets new options */
    _update(opts) {
      Object.assign(this, opts);
    }

    /** Mask state */
    get state() {
      return {
        _value: this.value,
        _rawInputValue: this.rawInputValue
      };
    }
    set state(state) {
      this._value = state._value;
    }

    /** Resets value */
    reset() {
      this._value = '';
    }
    get value() {
      return this._value;
    }
    set value(value) {
      this.resolve(value, {
        input: true
      });
    }

    /** Resolve new value */
    resolve(value, flags) {
      if (flags === void 0) {
        flags = {
          input: true
        };
      }
      this.reset();
      this.append(value, flags, '');
      this.doCommit();
    }
    get unmaskedValue() {
      return this.value;
    }
    set unmaskedValue(value) {
      this.resolve(value, {});
    }
    get typedValue() {
      return this.parse ? this.parse(this.value, this) : this.unmaskedValue;
    }
    set typedValue(value) {
      if (this.format) {
        this.value = this.format(value, this);
      } else {
        this.unmaskedValue = String(value);
      }
    }

    /** Value that includes raw user input */
    get rawInputValue() {
      return this.extractInput(0, this.displayValue.length, {
        raw: true
      });
    }
    set rawInputValue(value) {
      this.resolve(value, {
        raw: true
      });
    }
    get displayValue() {
      return this.value;
    }
    get isComplete() {
      return true;
    }
    get isFilled() {
      return this.isComplete;
    }

    /** Finds nearest input position in direction */
    nearestInputPos(cursorPos, direction) {
      return cursorPos;
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      return Math.min(this.displayValue.length, toPos - fromPos);
    }

    /** Extracts value in range considering flags */
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      return this.displayValue.slice(fromPos, toPos);
    }

    /** Extracts tail in range */
    extractTail(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      return new ContinuousTailDetails(this.extractInput(fromPos, toPos), fromPos);
    }

    /** Appends tail */
    appendTail(tail) {
      if (isString(tail)) tail = new ContinuousTailDetails(String(tail));
      return tail.appendTo(this);
    }

    /** Appends char */
    _appendCharRaw(ch, flags) {
      if (!ch) return new ChangeDetails();
      this._value += ch;
      return new ChangeDetails({
        inserted: ch,
        rawInserted: ch
      });
    }

    /** Appends char */
    _appendChar(ch, flags, checkTail) {
      if (flags === void 0) {
        flags = {};
      }
      const consistentState = this.state;
      let details;
      [ch, details] = this.doPrepareChar(ch, flags);
      details = details.aggregate(this._appendCharRaw(ch, flags));
      if (details.inserted) {
        let consistentTail;
        let appended = this.doValidate(flags) !== false;
        if (appended && checkTail != null) {
          // validation ok, check tail
          const beforeTailState = this.state;
          if (this.overwrite === true) {
            consistentTail = checkTail.state;
            checkTail.unshift(this.displayValue.length - details.tailShift);
          }
          let tailDetails = this.appendTail(checkTail);
          appended = tailDetails.rawInserted === checkTail.toString();

          // not ok, try shift
          if (!(appended && tailDetails.inserted) && this.overwrite === 'shift') {
            this.state = beforeTailState;
            consistentTail = checkTail.state;
            checkTail.shift();
            tailDetails = this.appendTail(checkTail);
            appended = tailDetails.rawInserted === checkTail.toString();
          }

          // if ok, rollback state after tail
          if (appended && tailDetails.inserted) this.state = beforeTailState;
        }

        // revert all if something went wrong
        if (!appended) {
          details = new ChangeDetails();
          this.state = consistentState;
          if (checkTail && consistentTail) checkTail.state = consistentTail;
        }
      }
      return details;
    }

    /** Appends optional placeholder at the end */
    _appendPlaceholder() {
      return new ChangeDetails();
    }

    /** Appends optional eager placeholder at the end */
    _appendEager() {
      return new ChangeDetails();
    }

    /** Appends symbols considering flags */
    append(str, flags, tail) {
      if (!isString(str)) throw new Error('value should be string');
      const checkTail = isString(tail) ? new ContinuousTailDetails(String(tail)) : tail;
      if (flags != null && flags.tail) flags._beforeTailState = this.state;
      let details;
      [str, details] = this.doPrepare(str, flags);
      for (let ci = 0; ci < str.length; ++ci) {
        const d = this._appendChar(str[ci], flags, checkTail);
        if (!d.rawInserted && !this.doSkipInvalid(str[ci], flags, checkTail)) break;
        details.aggregate(d);
      }
      if ((this.eager === true || this.eager === 'append') && flags != null && flags.input && str) {
        details.aggregate(this._appendEager());
      }

      // append tail but aggregate only tailShift
      if (checkTail != null) {
        details.tailShift += this.appendTail(checkTail).tailShift;
        // TODO it's a good idea to clear state after appending ends
        // but it causes bugs when one append calls another (when dynamic dispatch set rawInputValue)
        // this._resetBeforeTailState();
      }

      return details;
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      this._value = this.displayValue.slice(0, fromPos) + this.displayValue.slice(toPos);
      return new ChangeDetails();
    }

    /** Calls function and reapplies current value */
    withValueRefresh(fn) {
      if (this._refreshing || !this._initialized) return fn();
      this._refreshing = true;
      const rawInput = this.rawInputValue;
      const value = this.value;
      const ret = fn();
      this.rawInputValue = rawInput;
      // append lost trailing chars at the end
      if (this.value && this.value !== value && value.indexOf(this.value) === 0) {
        this.append(value.slice(this.displayValue.length), {}, '');
      }
      delete this._refreshing;
      return ret;
    }
    runIsolated(fn) {
      if (this._isolated || !this._initialized) return fn(this);
      this._isolated = true;
      const state = this.state;
      const ret = fn(this);
      this.state = state;
      delete this._isolated;
      return ret;
    }
    doSkipInvalid(ch, flags, checkTail) {
      return Boolean(this.skipInvalid);
    }

    /** Prepares string before mask processing */
    doPrepare(str, flags) {
      if (flags === void 0) {
        flags = {};
      }
      return ChangeDetails.normalize(this.prepare ? this.prepare(str, this, flags) : str);
    }

    /** Prepares each char before mask processing */
    doPrepareChar(str, flags) {
      if (flags === void 0) {
        flags = {};
      }
      return ChangeDetails.normalize(this.prepareChar ? this.prepareChar(str, this, flags) : str);
    }

    /** Validates if value is acceptable */
    doValidate(flags) {
      return (!this.validate || this.validate(this.value, this, flags)) && (!this.parent || this.parent.doValidate(flags));
    }

    /** Does additional processing at the end of editing */
    doCommit() {
      if (this.commit) this.commit(this.value, this);
    }
    splice(start, deleteCount, inserted, removeDirection, flags) {
      if (removeDirection === void 0) {
        removeDirection = DIRECTION.NONE;
      }
      if (flags === void 0) {
        flags = {
          input: true
        };
      }
      const tailPos = start + deleteCount;
      const tail = this.extractTail(tailPos);
      const eagerRemove = this.eager === true || this.eager === 'remove';
      let oldRawValue;
      if (eagerRemove) {
        removeDirection = forceDirection(removeDirection);
        oldRawValue = this.extractInput(0, tailPos, {
          raw: true
        });
      }
      let startChangePos = start;
      const details = new ChangeDetails();

      // if it is just deletion without insertion
      if (removeDirection !== DIRECTION.NONE) {
        startChangePos = this.nearestInputPos(start, deleteCount > 1 && start !== 0 && !eagerRemove ? DIRECTION.NONE : removeDirection);

        // adjust tailShift if start was aligned
        details.tailShift = startChangePos - start;
      }
      details.aggregate(this.remove(startChangePos));
      if (eagerRemove && removeDirection !== DIRECTION.NONE && oldRawValue === this.rawInputValue) {
        if (removeDirection === DIRECTION.FORCE_LEFT) {
          let valLength;
          while (oldRawValue === this.rawInputValue && (valLength = this.displayValue.length)) {
            details.aggregate(new ChangeDetails({
              tailShift: -1
            })).aggregate(this.remove(valLength - 1));
          }
        } else if (removeDirection === DIRECTION.FORCE_RIGHT) {
          tail.unshift();
        }
      }
      return details.aggregate(this.append(inserted, flags, tail));
    }
    maskEquals(mask) {
      return this.mask === mask;
    }
    typedValueEquals(value) {
      const tval = this.typedValue;
      return value === tval || Masked.EMPTY_VALUES.includes(value) && Masked.EMPTY_VALUES.includes(tval) || (this.format ? this.format(value, this) === this.format(this.typedValue, this) : false);
    }
  }
  Masked.DEFAULTS = {
    skipInvalid: true
  };
  Masked.EMPTY_VALUES = [undefined, null, ''];
  IMask.Masked = Masked;

  class ChunksTailDetails {
    /** */

    constructor(chunks, from) {
      if (chunks === void 0) {
        chunks = [];
      }
      if (from === void 0) {
        from = 0;
      }
      this.chunks = chunks;
      this.from = from;
    }
    toString() {
      return this.chunks.map(String).join('');
    }
    extend(tailChunk) {
      if (!String(tailChunk)) return;
      tailChunk = isString(tailChunk) ? new ContinuousTailDetails(String(tailChunk)) : tailChunk;
      const lastChunk = this.chunks[this.chunks.length - 1];
      const extendLast = lastChunk && (
      // if stops are same or tail has no stop
      lastChunk.stop === tailChunk.stop || tailChunk.stop == null) &&
      // if tail chunk goes just after last chunk
      tailChunk.from === lastChunk.from + lastChunk.toString().length;
      if (tailChunk instanceof ContinuousTailDetails) {
        // check the ability to extend previous chunk
        if (extendLast) {
          // extend previous chunk
          lastChunk.extend(tailChunk.toString());
        } else {
          // append new chunk
          this.chunks.push(tailChunk);
        }
      } else if (tailChunk instanceof ChunksTailDetails) {
        if (tailChunk.stop == null) {
          // unwrap floating chunks to parent, keeping `from` pos
          let firstTailChunk;
          while (tailChunk.chunks.length && tailChunk.chunks[0].stop == null) {
            firstTailChunk = tailChunk.chunks.shift(); // not possible to be `undefined` because length was checked above
            firstTailChunk.from += tailChunk.from;
            this.extend(firstTailChunk);
          }
        }

        // if tail chunk still has value
        if (tailChunk.toString()) {
          // if chunks contains stops, then popup stop to container
          tailChunk.stop = tailChunk.blockIndex;
          this.chunks.push(tailChunk);
        }
      }
    }
    appendTo(masked) {
      if (!(masked instanceof IMask.MaskedPattern)) {
        const tail = new ContinuousTailDetails(this.toString());
        return tail.appendTo(masked);
      }
      const details = new ChangeDetails();
      for (let ci = 0; ci < this.chunks.length && !details.skip; ++ci) {
        const chunk = this.chunks[ci];
        const lastBlockIter = masked._mapPosToBlock(masked.displayValue.length);
        const stop = chunk.stop;
        let chunkBlock;
        if (stop != null && (
        // if block not found or stop is behind lastBlock
        !lastBlockIter || lastBlockIter.index <= stop)) {
          if (chunk instanceof ChunksTailDetails ||
          // for continuous block also check if stop is exist
          masked._stops.indexOf(stop) >= 0) {
            const phDetails = masked._appendPlaceholder(stop);
            details.aggregate(phDetails);
          }
          chunkBlock = chunk instanceof ChunksTailDetails && masked._blocks[stop];
        }
        if (chunkBlock) {
          const tailDetails = chunkBlock.appendTail(chunk);
          tailDetails.skip = false; // always ignore skip, it will be set on last
          details.aggregate(tailDetails);
          masked._value += tailDetails.inserted;

          // get not inserted chars
          const remainChars = chunk.toString().slice(tailDetails.rawInserted.length);
          if (remainChars) details.aggregate(masked.append(remainChars, {
            tail: true
          }));
        } else {
          details.aggregate(masked.append(chunk.toString(), {
            tail: true
          }));
        }
      }
      return details;
    }
    get state() {
      return {
        chunks: this.chunks.map(c => c.state),
        from: this.from,
        stop: this.stop,
        blockIndex: this.blockIndex
      };
    }
    set state(state) {
      const {
        chunks,
        ...props
      } = state;
      Object.assign(this, props);
      this.chunks = chunks.map(cstate => {
        const chunk = "chunks" in cstate ? new ChunksTailDetails() : new ContinuousTailDetails();
        chunk.state = cstate;
        return chunk;
      });
    }
    unshift(beforePos) {
      if (!this.chunks.length || beforePos != null && this.from >= beforePos) return '';
      const chunkShiftPos = beforePos != null ? beforePos - this.from : beforePos;
      let ci = 0;
      while (ci < this.chunks.length) {
        const chunk = this.chunks[ci];
        const shiftChar = chunk.unshift(chunkShiftPos);
        if (chunk.toString()) {
          // chunk still contains value
          // but not shifted - means no more available chars to shift
          if (!shiftChar) break;
          ++ci;
        } else {
          // clean if chunk has no value
          this.chunks.splice(ci, 1);
        }
        if (shiftChar) return shiftChar;
      }
      return '';
    }
    shift() {
      if (!this.chunks.length) return '';
      let ci = this.chunks.length - 1;
      while (0 <= ci) {
        const chunk = this.chunks[ci];
        const shiftChar = chunk.shift();
        if (chunk.toString()) {
          // chunk still contains value
          // but not shifted - means no more available chars to shift
          if (!shiftChar) break;
          --ci;
        } else {
          // clean if chunk has no value
          this.chunks.splice(ci, 1);
        }
        if (shiftChar) return shiftChar;
      }
      return '';
    }
  }

  class PatternCursor {
    constructor(masked, pos) {
      this.masked = masked;
      this._log = [];
      const {
        offset,
        index
      } = masked._mapPosToBlock(pos) || (pos < 0 ?
      // first
      {
        index: 0,
        offset: 0
      } :
      // last
      {
        index: this.masked._blocks.length,
        offset: 0
      });
      this.offset = offset;
      this.index = index;
      this.ok = false;
    }
    get block() {
      return this.masked._blocks[this.index];
    }
    get pos() {
      return this.masked._blockStartPos(this.index) + this.offset;
    }
    get state() {
      return {
        index: this.index,
        offset: this.offset,
        ok: this.ok
      };
    }
    set state(s) {
      Object.assign(this, s);
    }
    pushState() {
      this._log.push(this.state);
    }
    popState() {
      const s = this._log.pop();
      if (s) this.state = s;
      return s;
    }
    bindBlock() {
      if (this.block) return;
      if (this.index < 0) {
        this.index = 0;
        this.offset = 0;
      }
      if (this.index >= this.masked._blocks.length) {
        this.index = this.masked._blocks.length - 1;
        this.offset = this.block.displayValue.length; // TODO this is stupid type error, `block` depends on index that was changed above
      }
    }

    _pushLeft(fn) {
      this.pushState();
      for (this.bindBlock(); 0 <= this.index; --this.index, this.offset = ((_this$block = this.block) == null ? void 0 : _this$block.displayValue.length) || 0) {
        var _this$block;
        if (fn()) return this.ok = true;
      }
      return this.ok = false;
    }
    _pushRight(fn) {
      this.pushState();
      for (this.bindBlock(); this.index < this.masked._blocks.length; ++this.index, this.offset = 0) {
        if (fn()) return this.ok = true;
      }
      return this.ok = false;
    }
    pushLeftBeforeFilled() {
      return this._pushLeft(() => {
        if (this.block.isFixed || !this.block.value) return;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.FORCE_LEFT);
        if (this.offset !== 0) return true;
      });
    }
    pushLeftBeforeInput() {
      // cases:
      // filled input: 00|
      // optional empty input: 00[]|
      // nested block: XX<[]>|
      return this._pushLeft(() => {
        if (this.block.isFixed) return;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.LEFT);
        return true;
      });
    }
    pushLeftBeforeRequired() {
      return this._pushLeft(() => {
        if (this.block.isFixed || this.block.isOptional && !this.block.value) return;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.LEFT);
        return true;
      });
    }
    pushRightBeforeFilled() {
      return this._pushRight(() => {
        if (this.block.isFixed || !this.block.value) return;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.FORCE_RIGHT);
        if (this.offset !== this.block.value.length) return true;
      });
    }
    pushRightBeforeInput() {
      return this._pushRight(() => {
        if (this.block.isFixed) return;

        // const o = this.offset;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.NONE);
        // HACK cases like (STILL DOES NOT WORK FOR NESTED)
        // aa|X
        // aa<X|[]>X_    - this will not work
        // if (o && o === this.offset && this.block instanceof PatternInputDefinition) continue;
        return true;
      });
    }
    pushRightBeforeRequired() {
      return this._pushRight(() => {
        if (this.block.isFixed || this.block.isOptional && !this.block.value) return;

        // TODO check |[*]XX_
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.NONE);
        return true;
      });
    }
  }

  class PatternFixedDefinition {
    /** */

    /** */

    /** */

    /** */

    /** */

    /** */

    constructor(opts) {
      Object.assign(this, opts);
      this._value = '';
      this.isFixed = true;
    }
    get value() {
      return this._value;
    }
    get unmaskedValue() {
      return this.isUnmasking ? this.value : '';
    }
    get rawInputValue() {
      return this._isRawInput ? this.value : '';
    }
    get displayValue() {
      return this.value;
    }
    reset() {
      this._isRawInput = false;
      this._value = '';
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this._value.length;
      }
      this._value = this._value.slice(0, fromPos) + this._value.slice(toPos);
      if (!this._value) this._isRawInput = false;
      return new ChangeDetails();
    }
    nearestInputPos(cursorPos, direction) {
      if (direction === void 0) {
        direction = DIRECTION.NONE;
      }
      const minPos = 0;
      const maxPos = this._value.length;
      switch (direction) {
        case DIRECTION.LEFT:
        case DIRECTION.FORCE_LEFT:
          return minPos;
        case DIRECTION.NONE:
        case DIRECTION.RIGHT:
        case DIRECTION.FORCE_RIGHT:
        default:
          return maxPos;
      }
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this._value.length;
      }
      return this._isRawInput ? toPos - fromPos : 0;
    }
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this._value.length;
      }
      if (flags === void 0) {
        flags = {};
      }
      return flags.raw && this._isRawInput && this._value.slice(fromPos, toPos) || '';
    }
    get isComplete() {
      return true;
    }
    get isFilled() {
      return Boolean(this._value);
    }
    _appendChar(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const details = new ChangeDetails();
      if (this.isFilled) return details;
      const appendEager = this.eager === true || this.eager === 'append';
      const appended = this.char === ch;
      const isResolved = appended && (this.isUnmasking || flags.input || flags.raw) && (!flags.raw || !appendEager) && !flags.tail;
      if (isResolved) details.rawInserted = this.char;
      this._value = details.inserted = this.char;
      this._isRawInput = isResolved && (flags.raw || flags.input);
      return details;
    }
    _appendEager() {
      return this._appendChar(this.char, {
        tail: true
      });
    }
    _appendPlaceholder() {
      const details = new ChangeDetails();
      if (this.isFilled) return details;
      this._value = details.inserted = this.char;
      return details;
    }
    extractTail() {
      return new ContinuousTailDetails('');
    }
    appendTail(tail) {
      if (isString(tail)) tail = new ContinuousTailDetails(String(tail));
      return tail.appendTo(this);
    }
    append(str, flags, tail) {
      const details = this._appendChar(str[0], flags);
      if (tail != null) {
        details.tailShift += this.appendTail(tail).tailShift;
      }
      return details;
    }
    doCommit() {}
    get state() {
      return {
        _value: this._value,
        _rawInputValue: this.rawInputValue
      };
    }
    set state(state) {
      this._value = state._value;
      this._isRawInput = Boolean(state._rawInputValue);
    }
  }

  class PatternInputDefinition {
    /** */

    /** */

    /** */

    /** */

    /** */

    /** */

    /** */

    /** */

    constructor(opts) {
      const {
        parent,
        isOptional,
        placeholderChar,
        displayChar,
        lazy,
        eager,
        ...maskOpts
      } = opts;
      this.masked = createMask(maskOpts);
      Object.assign(this, {
        parent,
        isOptional,
        placeholderChar,
        displayChar,
        lazy,
        eager
      });
    }
    reset() {
      this.isFilled = false;
      this.masked.reset();
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.value.length;
      }
      if (fromPos === 0 && toPos >= 1) {
        this.isFilled = false;
        return this.masked.remove(fromPos, toPos);
      }
      return new ChangeDetails();
    }
    get value() {
      return this.masked.value || (this.isFilled && !this.isOptional ? this.placeholderChar : '');
    }
    get unmaskedValue() {
      return this.masked.unmaskedValue;
    }
    get rawInputValue() {
      return this.masked.rawInputValue;
    }
    get displayValue() {
      return this.masked.value && this.displayChar || this.value;
    }
    get isComplete() {
      return Boolean(this.masked.value) || this.isOptional;
    }
    _appendChar(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      if (this.isFilled) return new ChangeDetails();
      const state = this.masked.state;
      // simulate input
      const details = this.masked._appendChar(ch, this.currentMaskFlags(flags));
      if (details.inserted && this.doValidate(flags) === false) {
        details.inserted = details.rawInserted = '';
        this.masked.state = state;
      }
      if (!details.inserted && !this.isOptional && !this.lazy && !flags.input) {
        details.inserted = this.placeholderChar;
      }
      details.skip = !details.inserted && !this.isOptional;
      this.isFilled = Boolean(details.inserted);
      return details;
    }
    append(str, flags, tail) {
      // TODO probably should be done via _appendChar
      return this.masked.append(str, this.currentMaskFlags(flags), tail);
    }
    _appendPlaceholder() {
      const details = new ChangeDetails();
      if (this.isFilled || this.isOptional) return details;
      this.isFilled = true;
      details.inserted = this.placeholderChar;
      return details;
    }
    _appendEager() {
      return new ChangeDetails();
    }
    extractTail(fromPos, toPos) {
      return this.masked.extractTail(fromPos, toPos);
    }
    appendTail(tail) {
      return this.masked.appendTail(tail);
    }
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.value.length;
      }
      return this.masked.extractInput(fromPos, toPos, flags);
    }
    nearestInputPos(cursorPos, direction) {
      if (direction === void 0) {
        direction = DIRECTION.NONE;
      }
      const minPos = 0;
      const maxPos = this.value.length;
      const boundPos = Math.min(Math.max(cursorPos, minPos), maxPos);
      switch (direction) {
        case DIRECTION.LEFT:
        case DIRECTION.FORCE_LEFT:
          return this.isComplete ? boundPos : minPos;
        case DIRECTION.RIGHT:
        case DIRECTION.FORCE_RIGHT:
          return this.isComplete ? boundPos : maxPos;
        case DIRECTION.NONE:
        default:
          return boundPos;
      }
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.value.length;
      }
      return this.value.slice(fromPos, toPos).length;
    }
    doValidate(flags) {
      return this.masked.doValidate(this.currentMaskFlags(flags)) && (!this.parent || this.parent.doValidate(this.currentMaskFlags(flags)));
    }
    doCommit() {
      this.masked.doCommit();
    }
    get state() {
      return {
        _value: this.value,
        _rawInputValue: this.rawInputValue,
        masked: this.masked.state,
        isFilled: this.isFilled
      };
    }
    set state(state) {
      this.masked.state = state.masked;
      this.isFilled = state.isFilled;
    }
    currentMaskFlags(flags) {
      var _flags$_beforeTailSta;
      return {
        ...flags,
        _beforeTailState: (flags == null || (_flags$_beforeTailSta = flags._beforeTailState) == null ? void 0 : _flags$_beforeTailSta.masked) || (flags == null ? void 0 : flags._beforeTailState)
      };
    }
  }
  PatternInputDefinition.DEFAULT_DEFINITIONS = {
    '0': /\d/,
    'a': /[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
    // http://stackoverflow.com/a/22075070
    '*': /./
  };

  /** Masking by RegExp */
  class MaskedRegExp extends Masked {
    /** */

    /** Enable characters overwriting */

    /** */

    /** */

    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      const mask = opts.mask;
      if (mask) opts.validate = value => value.search(mask) >= 0;
      super._update(opts);
    }
  }
  IMask.MaskedRegExp = MaskedRegExp;

  /** Pattern mask */
  class MaskedPattern extends Masked {
    /** */

    /** */

    /** Single char for empty input */

    /** Single char for filled input */

    /** Show placeholder only when needed */

    /** Enable characters overwriting */

    /** */

    /** */

    constructor(opts) {
      super({
        ...MaskedPattern.DEFAULTS,
        ...opts,
        definitions: Object.assign({}, PatternInputDefinition.DEFAULT_DEFINITIONS, opts == null ? void 0 : opts.definitions)
      });
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      opts.definitions = Object.assign({}, this.definitions, opts.definitions);
      super._update(opts);
      this._rebuildMask();
    }
    _rebuildMask() {
      const defs = this.definitions;
      this._blocks = [];
      this.exposeBlock = undefined;
      this._stops = [];
      this._maskedBlocks = {};
      const pattern = this.mask;
      if (!pattern || !defs) return;
      let unmaskingBlock = false;
      let optionalBlock = false;
      for (let i = 0; i < pattern.length; ++i) {
        if (this.blocks) {
          const p = pattern.slice(i);
          const bNames = Object.keys(this.blocks).filter(bName => p.indexOf(bName) === 0);
          // order by key length
          bNames.sort((a, b) => b.length - a.length);
          // use block name with max length
          const bName = bNames[0];
          if (bName) {
            const {
              expose,
              ...blockOpts
            } = normalizeOpts(this.blocks[bName]);
            const maskedBlock = createMask({
              lazy: this.lazy,
              eager: this.eager,
              placeholderChar: this.placeholderChar,
              displayChar: this.displayChar,
              overwrite: this.overwrite,
              ...blockOpts,
              parent: this
            });
            if (maskedBlock) {
              this._blocks.push(maskedBlock);
              if (expose) this.exposeBlock = maskedBlock;

              // store block index
              if (!this._maskedBlocks[bName]) this._maskedBlocks[bName] = [];
              this._maskedBlocks[bName].push(this._blocks.length - 1);
            }
            i += bName.length - 1;
            continue;
          }
        }
        let char = pattern[i];
        let isInput = (char in defs);
        if (char === MaskedPattern.STOP_CHAR) {
          this._stops.push(this._blocks.length);
          continue;
        }
        if (char === '{' || char === '}') {
          unmaskingBlock = !unmaskingBlock;
          continue;
        }
        if (char === '[' || char === ']') {
          optionalBlock = !optionalBlock;
          continue;
        }
        if (char === MaskedPattern.ESCAPE_CHAR) {
          ++i;
          char = pattern[i];
          if (!char) break;
          isInput = false;
        }
        const def = isInput ? new PatternInputDefinition({
          isOptional: optionalBlock,
          lazy: this.lazy,
          eager: this.eager,
          placeholderChar: this.placeholderChar,
          displayChar: this.displayChar,
          ...normalizeOpts(defs[char]),
          parent: this
        }) : new PatternFixedDefinition({
          char,
          eager: this.eager,
          isUnmasking: unmaskingBlock
        });
        this._blocks.push(def);
      }
    }
    get state() {
      return {
        ...super.state,
        _blocks: this._blocks.map(b => b.state)
      };
    }
    set state(state) {
      const {
        _blocks,
        ...maskedState
      } = state;
      this._blocks.forEach((b, bi) => b.state = _blocks[bi]);
      super.state = maskedState;
    }
    reset() {
      super.reset();
      this._blocks.forEach(b => b.reset());
    }
    get isComplete() {
      return this.exposeBlock ? this.exposeBlock.isComplete : this._blocks.every(b => b.isComplete);
    }
    get isFilled() {
      return this._blocks.every(b => b.isFilled);
    }
    get isFixed() {
      return this._blocks.every(b => b.isFixed);
    }
    get isOptional() {
      return this._blocks.every(b => b.isOptional);
    }
    doCommit() {
      this._blocks.forEach(b => b.doCommit());
      super.doCommit();
    }
    get unmaskedValue() {
      return this.exposeBlock ? this.exposeBlock.unmaskedValue : this._blocks.reduce((str, b) => str += b.unmaskedValue, '');
    }
    set unmaskedValue(unmaskedValue) {
      if (this.exposeBlock) {
        const tail = this.extractTail(this._blockStartPos(this._blocks.indexOf(this.exposeBlock)) + this.exposeBlock.displayValue.length);
        this.exposeBlock.unmaskedValue = unmaskedValue;
        this.appendTail(tail);
        this.doCommit();
      } else super.unmaskedValue = unmaskedValue;
    }
    get value() {
      return this.exposeBlock ? this.exposeBlock.value :
      // TODO return _value when not in change?
      this._blocks.reduce((str, b) => str += b.value, '');
    }
    set value(value) {
      if (this.exposeBlock) {
        const tail = this.extractTail(this._blockStartPos(this._blocks.indexOf(this.exposeBlock)) + this.exposeBlock.displayValue.length);
        this.exposeBlock.value = value;
        this.appendTail(tail);
        this.doCommit();
      } else super.value = value;
    }
    get typedValue() {
      return this.exposeBlock ? this.exposeBlock.typedValue : super.typedValue;
    }
    set typedValue(value) {
      if (this.exposeBlock) {
        const tail = this.extractTail(this._blockStartPos(this._blocks.indexOf(this.exposeBlock)) + this.exposeBlock.displayValue.length);
        this.exposeBlock.typedValue = value;
        this.appendTail(tail);
        this.doCommit();
      } else super.typedValue = value;
    }
    get displayValue() {
      return this._blocks.reduce((str, b) => str += b.displayValue, '');
    }
    appendTail(tail) {
      return super.appendTail(tail).aggregate(this._appendPlaceholder());
    }
    _appendEager() {
      var _this$_mapPosToBlock;
      const details = new ChangeDetails();
      let startBlockIndex = (_this$_mapPosToBlock = this._mapPosToBlock(this.displayValue.length)) == null ? void 0 : _this$_mapPosToBlock.index;
      if (startBlockIndex == null) return details;

      // TODO test if it works for nested pattern masks
      if (this._blocks[startBlockIndex].isFilled) ++startBlockIndex;
      for (let bi = startBlockIndex; bi < this._blocks.length; ++bi) {
        const d = this._blocks[bi]._appendEager();
        if (!d.inserted) break;
        details.aggregate(d);
      }
      return details;
    }
    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const blockIter = this._mapPosToBlock(this.displayValue.length);
      const details = new ChangeDetails();
      if (!blockIter) return details;
      for (let bi = blockIter.index;; ++bi) {
        var _flags$_beforeTailSta;
        const block = this._blocks[bi];
        if (!block) break;
        const blockDetails = block._appendChar(ch, {
          ...flags,
          _beforeTailState: (_flags$_beforeTailSta = flags._beforeTailState) == null || (_flags$_beforeTailSta = _flags$_beforeTailSta._blocks) == null ? void 0 : _flags$_beforeTailSta[bi]
        });
        const skip = blockDetails.skip;
        details.aggregate(blockDetails);
        if (skip || blockDetails.rawInserted) break; // go next char
      }

      return details;
    }
    extractTail(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      const chunkTail = new ChunksTailDetails();
      if (fromPos === toPos) return chunkTail;
      this._forEachBlocksInRange(fromPos, toPos, (b, bi, bFromPos, bToPos) => {
        const blockChunk = b.extractTail(bFromPos, bToPos);
        blockChunk.stop = this._findStopBefore(bi);
        blockChunk.from = this._blockStartPos(bi);
        if (blockChunk instanceof ChunksTailDetails) blockChunk.blockIndex = bi;
        chunkTail.extend(blockChunk);
      });
      return chunkTail;
    }
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      if (flags === void 0) {
        flags = {};
      }
      if (fromPos === toPos) return '';
      let input = '';
      this._forEachBlocksInRange(fromPos, toPos, (b, _, fromPos, toPos) => {
        input += b.extractInput(fromPos, toPos, flags);
      });
      return input;
    }
    _findStopBefore(blockIndex) {
      let stopBefore;
      for (let si = 0; si < this._stops.length; ++si) {
        const stop = this._stops[si];
        if (stop <= blockIndex) stopBefore = stop;else break;
      }
      return stopBefore;
    }

    /** Appends placeholder depending on laziness */
    _appendPlaceholder(toBlockIndex) {
      const details = new ChangeDetails();
      if (this.lazy && toBlockIndex == null) return details;
      const startBlockIter = this._mapPosToBlock(this.displayValue.length);
      if (!startBlockIter) return details;
      const startBlockIndex = startBlockIter.index;
      const endBlockIndex = toBlockIndex != null ? toBlockIndex : this._blocks.length;
      this._blocks.slice(startBlockIndex, endBlockIndex).forEach(b => {
        if (!b.lazy || toBlockIndex != null) {
          var _blocks2;
          const bDetails = b._appendPlaceholder((_blocks2 = b._blocks) == null ? void 0 : _blocks2.length);
          this._value += bDetails.inserted;
          details.aggregate(bDetails);
        }
      });
      return details;
    }

    /** Finds block in pos */
    _mapPosToBlock(pos) {
      let accVal = '';
      for (let bi = 0; bi < this._blocks.length; ++bi) {
        const block = this._blocks[bi];
        const blockStartPos = accVal.length;
        accVal += block.displayValue;
        if (pos <= accVal.length) {
          return {
            index: bi,
            offset: pos - blockStartPos
          };
        }
      }
    }
    _blockStartPos(blockIndex) {
      return this._blocks.slice(0, blockIndex).reduce((pos, b) => pos += b.displayValue.length, 0);
    }
    _forEachBlocksInRange(fromPos, toPos, fn) {
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      const fromBlockIter = this._mapPosToBlock(fromPos);
      if (fromBlockIter) {
        const toBlockIter = this._mapPosToBlock(toPos);
        // process first block
        const isSameBlock = toBlockIter && fromBlockIter.index === toBlockIter.index;
        const fromBlockStartPos = fromBlockIter.offset;
        const fromBlockEndPos = toBlockIter && isSameBlock ? toBlockIter.offset : this._blocks[fromBlockIter.index].displayValue.length;
        fn(this._blocks[fromBlockIter.index], fromBlockIter.index, fromBlockStartPos, fromBlockEndPos);
        if (toBlockIter && !isSameBlock) {
          // process intermediate blocks
          for (let bi = fromBlockIter.index + 1; bi < toBlockIter.index; ++bi) {
            fn(this._blocks[bi], bi, 0, this._blocks[bi].displayValue.length);
          }

          // process last block
          fn(this._blocks[toBlockIter.index], toBlockIter.index, 0, toBlockIter.offset);
        }
      }
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      const removeDetails = super.remove(fromPos, toPos);
      this._forEachBlocksInRange(fromPos, toPos, (b, _, bFromPos, bToPos) => {
        removeDetails.aggregate(b.remove(bFromPos, bToPos));
      });
      return removeDetails;
    }
    nearestInputPos(cursorPos, direction) {
      if (direction === void 0) {
        direction = DIRECTION.NONE;
      }
      if (!this._blocks.length) return 0;
      const cursor = new PatternCursor(this, cursorPos);
      if (direction === DIRECTION.NONE) {
        // -------------------------------------------------
        // NONE should only go out from fixed to the right!
        // -------------------------------------------------
        if (cursor.pushRightBeforeInput()) return cursor.pos;
        cursor.popState();
        if (cursor.pushLeftBeforeInput()) return cursor.pos;
        return this.displayValue.length;
      }

      // FORCE is only about a|* otherwise is 0
      if (direction === DIRECTION.LEFT || direction === DIRECTION.FORCE_LEFT) {
        // try to break fast when *|a
        if (direction === DIRECTION.LEFT) {
          cursor.pushRightBeforeFilled();
          if (cursor.ok && cursor.pos === cursorPos) return cursorPos;
          cursor.popState();
        }

        // forward flow
        cursor.pushLeftBeforeInput();
        cursor.pushLeftBeforeRequired();
        cursor.pushLeftBeforeFilled();

        // backward flow
        if (direction === DIRECTION.LEFT) {
          cursor.pushRightBeforeInput();
          cursor.pushRightBeforeRequired();
          if (cursor.ok && cursor.pos <= cursorPos) return cursor.pos;
          cursor.popState();
          if (cursor.ok && cursor.pos <= cursorPos) return cursor.pos;
          cursor.popState();
        }
        if (cursor.ok) return cursor.pos;
        if (direction === DIRECTION.FORCE_LEFT) return 0;
        cursor.popState();
        if (cursor.ok) return cursor.pos;
        cursor.popState();
        if (cursor.ok) return cursor.pos;
        return 0;
      }
      if (direction === DIRECTION.RIGHT || direction === DIRECTION.FORCE_RIGHT) {
        // forward flow
        cursor.pushRightBeforeInput();
        cursor.pushRightBeforeRequired();
        if (cursor.pushRightBeforeFilled()) return cursor.pos;
        if (direction === DIRECTION.FORCE_RIGHT) return this.displayValue.length;

        // backward flow
        cursor.popState();
        if (cursor.ok) return cursor.pos;
        cursor.popState();
        if (cursor.ok) return cursor.pos;
        return this.nearestInputPos(cursorPos, DIRECTION.LEFT);
      }
      return cursorPos;
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      let total = 0;
      this._forEachBlocksInRange(fromPos, toPos, (b, _, bFromPos, bToPos) => {
        total += b.totalInputPositions(bFromPos, bToPos);
      });
      return total;
    }

    /** Get block by name */
    maskedBlock(name) {
      return this.maskedBlocks(name)[0];
    }

    /** Get all blocks by name */
    maskedBlocks(name) {
      const indices = this._maskedBlocks[name];
      if (!indices) return [];
      return indices.map(gi => this._blocks[gi]);
    }
  }
  MaskedPattern.DEFAULTS = {
    lazy: true,
    placeholderChar: '_'
  };
  MaskedPattern.STOP_CHAR = '`';
  MaskedPattern.ESCAPE_CHAR = '\\';
  MaskedPattern.InputDefinition = PatternInputDefinition;
  MaskedPattern.FixedDefinition = PatternFixedDefinition;
  IMask.MaskedPattern = MaskedPattern;

  /** Pattern which accepts ranges */
  class MaskedRange extends MaskedPattern {
    /**
      Optionally sets max length of pattern.
      Used when pattern length is longer then `to` param length. Pads zeros at start in this case.
    */

    /** Min bound */

    /** Max bound */

    /** */

    get _matchFrom() {
      return this.maxLength - String(this.from).length;
    }
    constructor(opts) {
      super(opts); // mask will be created in _update
    }

    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      const {
        to = this.to || 0,
        from = this.from || 0,
        maxLength = this.maxLength || 0,
        autofix = this.autofix,
        ...patternOpts
      } = opts;
      this.to = to;
      this.from = from;
      this.maxLength = Math.max(String(to).length, maxLength);
      this.autofix = autofix;
      const fromStr = String(this.from).padStart(this.maxLength, '0');
      const toStr = String(this.to).padStart(this.maxLength, '0');
      let sameCharsCount = 0;
      while (sameCharsCount < toStr.length && toStr[sameCharsCount] === fromStr[sameCharsCount]) ++sameCharsCount;
      patternOpts.mask = toStr.slice(0, sameCharsCount).replace(/0/g, '\\0') + '0'.repeat(this.maxLength - sameCharsCount);
      super._update(patternOpts);
    }
    get isComplete() {
      return super.isComplete && Boolean(this.value);
    }
    boundaries(str) {
      let minstr = '';
      let maxstr = '';
      const [, placeholder, num] = str.match(/^(\D*)(\d*)(\D*)/) || [];
      if (num) {
        minstr = '0'.repeat(placeholder.length) + num;
        maxstr = '9'.repeat(placeholder.length) + num;
      }
      minstr = minstr.padEnd(this.maxLength, '0');
      maxstr = maxstr.padEnd(this.maxLength, '9');
      return [minstr, maxstr];
    }
    doPrepareChar(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      let details;
      [ch, details] = super.doPrepareChar(ch.replace(/\D/g, ''), flags);
      if (!this.autofix || !ch) return [ch, details];
      const fromStr = String(this.from).padStart(this.maxLength, '0');
      const toStr = String(this.to).padStart(this.maxLength, '0');
      const nextVal = this.value + ch;
      if (nextVal.length > this.maxLength) return ['', details];
      const [minstr, maxstr] = this.boundaries(nextVal);
      if (Number(maxstr) < this.from) return [fromStr[nextVal.length - 1], details];
      if (Number(minstr) > this.to) {
        if (this.autofix === 'pad' && nextVal.length < this.maxLength) {
          return ['', details.aggregate(this.append(fromStr[nextVal.length - 1] + ch, flags))];
        }
        return [toStr[nextVal.length - 1], details];
      }
      return [ch, details];
    }
    doValidate(flags) {
      const str = this.value;
      const firstNonZero = str.search(/[^0]/);
      if (firstNonZero === -1 && str.length <= this._matchFrom) return true;
      const [minstr, maxstr] = this.boundaries(str);
      return this.from <= Number(maxstr) && Number(minstr) <= this.to && super.doValidate(flags);
    }
  }
  IMask.MaskedRange = MaskedRange;

  /** Date mask */
  class MaskedDate extends MaskedPattern {
    /** Pattern mask for date according to {@link MaskedDate#format} */

    /** Start date */

    /** End date */

    /** */

    /** Format typed value to string */

    /** Parse string to get typed value */

    constructor(opts) {
      const {
        mask,
        pattern,
        ...patternOpts
      } = {
        ...MaskedDate.DEFAULTS,
        ...opts
      };
      super({
        ...patternOpts,
        mask: isString(mask) ? mask : pattern
      });
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      const {
        mask,
        pattern,
        blocks,
        ...patternOpts
      } = {
        ...MaskedDate.DEFAULTS,
        ...opts
      };
      const patternBlocks = Object.assign({}, MaskedDate.GET_DEFAULT_BLOCKS());
      // adjust year block
      if (opts.min) patternBlocks.Y.from = opts.min.getFullYear();
      if (opts.max) patternBlocks.Y.to = opts.max.getFullYear();
      if (opts.min && opts.max && patternBlocks.Y.from === patternBlocks.Y.to) {
        patternBlocks.m.from = opts.min.getMonth() + 1;
        patternBlocks.m.to = opts.max.getMonth() + 1;
        if (patternBlocks.m.from === patternBlocks.m.to) {
          patternBlocks.d.from = opts.min.getDate();
          patternBlocks.d.to = opts.max.getDate();
        }
      }
      Object.assign(patternBlocks, this.blocks, blocks);

      // add autofix
      Object.keys(patternBlocks).forEach(bk => {
        const b = patternBlocks[bk];
        if (!('autofix' in b) && 'autofix' in opts) b.autofix = opts.autofix;
      });
      super._update({
        ...patternOpts,
        mask: isString(mask) ? mask : pattern,
        blocks: patternBlocks
      });
    }
    doValidate(flags) {
      const date = this.date;
      return super.doValidate(flags) && (!this.isComplete || this.isDateExist(this.value) && date != null && (this.min == null || this.min <= date) && (this.max == null || date <= this.max));
    }

    /** Checks if date is exists */
    isDateExist(str) {
      return this.format(this.parse(str, this), this).indexOf(str) >= 0;
    }

    /** Parsed Date */
    get date() {
      return this.typedValue;
    }
    set date(date) {
      this.typedValue = date;
    }
    get typedValue() {
      return this.isComplete ? super.typedValue : null;
    }
    set typedValue(value) {
      super.typedValue = value;
    }
    maskEquals(mask) {
      return mask === Date || super.maskEquals(mask);
    }
  }
  MaskedDate.GET_DEFAULT_BLOCKS = () => ({
    d: {
      mask: MaskedRange,
      from: 1,
      to: 31,
      maxLength: 2
    },
    m: {
      mask: MaskedRange,
      from: 1,
      to: 12,
      maxLength: 2
    },
    Y: {
      mask: MaskedRange,
      from: 1900,
      to: 9999
    }
  });
  MaskedDate.DEFAULTS = {
    mask: Date,
    pattern: 'd{.}`m{.}`Y',
    format: (date, masked) => {
      if (!date) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return [day, month, year].join('.');
    },
    parse: (str, masked) => {
      const [day, month, year] = str.split('.').map(Number);
      return new Date(year, month - 1, day);
    }
  };
  IMask.MaskedDate = MaskedDate;

  /** Dynamic mask for choosing appropriate mask in run-time */
  class MaskedDynamic extends Masked {
    /** Currently chosen mask */

    /** Currently chosen mask */

    /** Compliled {@link Masked} options */

    /** Chooses {@link Masked} depending on input value */

    constructor(opts) {
      super({
        ...MaskedDynamic.DEFAULTS,
        ...opts
      });
      this.currentMask = undefined;
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      super._update(opts);
      if ('mask' in opts) {
        this.exposeMask = undefined;
        // mask could be totally dynamic with only `dispatch` option
        this.compiledMasks = Array.isArray(opts.mask) ? opts.mask.map(m => {
          const {
            expose,
            ...maskOpts
          } = normalizeOpts(m);
          const masked = createMask({
            overwrite: this._overwrite,
            eager: this._eager,
            skipInvalid: this._skipInvalid,
            ...maskOpts
          });
          if (expose) this.exposeMask = masked;
          return masked;
        }) : [];

        // this.currentMask = this.doDispatch(''); // probably not needed but lets see
      }
    }

    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const details = this._applyDispatch(ch, flags);
      if (this.currentMask) {
        details.aggregate(this.currentMask._appendChar(ch, this.currentMaskFlags(flags)));
      }
      return details;
    }
    _applyDispatch(appended, flags, tail) {
      if (appended === void 0) {
        appended = '';
      }
      if (flags === void 0) {
        flags = {};
      }
      if (tail === void 0) {
        tail = '';
      }
      const prevValueBeforeTail = flags.tail && flags._beforeTailState != null ? flags._beforeTailState._value : this.value;
      const inputValue = this.rawInputValue;
      const insertValue = flags.tail && flags._beforeTailState != null ? flags._beforeTailState._rawInputValue : inputValue;
      const tailValue = inputValue.slice(insertValue.length);
      const prevMask = this.currentMask;
      const details = new ChangeDetails();
      const prevMaskState = prevMask == null ? void 0 : prevMask.state;

      // clone flags to prevent overwriting `_beforeTailState`
      this.currentMask = this.doDispatch(appended, {
        ...flags
      }, tail);

      // restore state after dispatch
      if (this.currentMask) {
        if (this.currentMask !== prevMask) {
          // if mask changed reapply input
          this.currentMask.reset();
          if (insertValue) {
            const d = this.currentMask.append(insertValue, {
              raw: true
            });
            details.tailShift = d.inserted.length - prevValueBeforeTail.length;
          }
          if (tailValue) {
            details.tailShift += this.currentMask.append(tailValue, {
              raw: true,
              tail: true
            }).tailShift;
          }
        } else if (prevMaskState) {
          // Dispatch can do something bad with state, so
          // restore prev mask state
          this.currentMask.state = prevMaskState;
        }
      }
      return details;
    }
    _appendPlaceholder() {
      const details = this._applyDispatch();
      if (this.currentMask) {
        details.aggregate(this.currentMask._appendPlaceholder());
      }
      return details;
    }
    _appendEager() {
      const details = this._applyDispatch();
      if (this.currentMask) {
        details.aggregate(this.currentMask._appendEager());
      }
      return details;
    }
    appendTail(tail) {
      const details = new ChangeDetails();
      if (tail) details.aggregate(this._applyDispatch('', {}, tail));
      return details.aggregate(this.currentMask ? this.currentMask.appendTail(tail) : super.appendTail(tail));
    }
    currentMaskFlags(flags) {
      var _flags$_beforeTailSta, _flags$_beforeTailSta2;
      return {
        ...flags,
        _beforeTailState: ((_flags$_beforeTailSta = flags._beforeTailState) == null ? void 0 : _flags$_beforeTailSta.currentMaskRef) === this.currentMask && ((_flags$_beforeTailSta2 = flags._beforeTailState) == null ? void 0 : _flags$_beforeTailSta2.currentMask) || flags._beforeTailState
      };
    }
    doDispatch(appended, flags, tail) {
      if (flags === void 0) {
        flags = {};
      }
      if (tail === void 0) {
        tail = '';
      }
      return this.dispatch(appended, this, flags, tail);
    }
    doValidate(flags) {
      return super.doValidate(flags) && (!this.currentMask || this.currentMask.doValidate(this.currentMaskFlags(flags)));
    }
    doPrepare(str, flags) {
      if (flags === void 0) {
        flags = {};
      }
      let [s, details] = super.doPrepare(str, flags);
      if (this.currentMask) {
        let currentDetails;
        [s, currentDetails] = super.doPrepare(s, this.currentMaskFlags(flags));
        details = details.aggregate(currentDetails);
      }
      return [s, details];
    }
    doPrepareChar(str, flags) {
      if (flags === void 0) {
        flags = {};
      }
      let [s, details] = super.doPrepareChar(str, flags);
      if (this.currentMask) {
        let currentDetails;
        [s, currentDetails] = super.doPrepareChar(s, this.currentMaskFlags(flags));
        details = details.aggregate(currentDetails);
      }
      return [s, details];
    }
    reset() {
      var _this$currentMask;
      (_this$currentMask = this.currentMask) == null ? void 0 : _this$currentMask.reset();
      this.compiledMasks.forEach(m => m.reset());
    }
    get value() {
      return this.exposeMask ? this.exposeMask.value : this.currentMask ? this.currentMask.value : '';
    }
    set value(value) {
      if (this.exposeMask) {
        this.exposeMask.value = value;
        this.currentMask = this.exposeMask;
        this._applyDispatch();
      } else super.value = value;
    }
    get unmaskedValue() {
      return this.exposeMask ? this.exposeMask.unmaskedValue : this.currentMask ? this.currentMask.unmaskedValue : '';
    }
    set unmaskedValue(unmaskedValue) {
      if (this.exposeMask) {
        this.exposeMask.unmaskedValue = unmaskedValue;
        this.currentMask = this.exposeMask;
        this._applyDispatch();
      } else super.unmaskedValue = unmaskedValue;
    }
    get typedValue() {
      return this.exposeMask ? this.exposeMask.typedValue : this.currentMask ? this.currentMask.typedValue : '';
    }
    set typedValue(typedValue) {
      if (this.exposeMask) {
        this.exposeMask.typedValue = typedValue;
        this.currentMask = this.exposeMask;
        this._applyDispatch();
        return;
      }
      let unmaskedValue = String(typedValue);

      // double check it
      if (this.currentMask) {
        this.currentMask.typedValue = typedValue;
        unmaskedValue = this.currentMask.unmaskedValue;
      }
      this.unmaskedValue = unmaskedValue;
    }
    get displayValue() {
      return this.currentMask ? this.currentMask.displayValue : '';
    }
    get isComplete() {
      var _this$currentMask2;
      return Boolean((_this$currentMask2 = this.currentMask) == null ? void 0 : _this$currentMask2.isComplete);
    }
    get isFilled() {
      var _this$currentMask3;
      return Boolean((_this$currentMask3 = this.currentMask) == null ? void 0 : _this$currentMask3.isFilled);
    }
    remove(fromPos, toPos) {
      const details = new ChangeDetails();
      if (this.currentMask) {
        details.aggregate(this.currentMask.remove(fromPos, toPos))
        // update with dispatch
        .aggregate(this._applyDispatch());
      }
      return details;
    }
    get state() {
      var _this$currentMask4;
      return {
        ...super.state,
        _rawInputValue: this.rawInputValue,
        compiledMasks: this.compiledMasks.map(m => m.state),
        currentMaskRef: this.currentMask,
        currentMask: (_this$currentMask4 = this.currentMask) == null ? void 0 : _this$currentMask4.state
      };
    }
    set state(state) {
      const {
        compiledMasks,
        currentMaskRef,
        currentMask,
        ...maskedState
      } = state;
      if (compiledMasks) this.compiledMasks.forEach((m, mi) => m.state = compiledMasks[mi]);
      if (currentMaskRef != null) {
        this.currentMask = currentMaskRef;
        this.currentMask.state = currentMask;
      }
      super.state = maskedState;
    }
    extractInput(fromPos, toPos, flags) {
      return this.currentMask ? this.currentMask.extractInput(fromPos, toPos, flags) : '';
    }
    extractTail(fromPos, toPos) {
      return this.currentMask ? this.currentMask.extractTail(fromPos, toPos) : super.extractTail(fromPos, toPos);
    }
    doCommit() {
      if (this.currentMask) this.currentMask.doCommit();
      super.doCommit();
    }
    nearestInputPos(cursorPos, direction) {
      return this.currentMask ? this.currentMask.nearestInputPos(cursorPos, direction) : super.nearestInputPos(cursorPos, direction);
    }
    get overwrite() {
      return this.currentMask ? this.currentMask.overwrite : this._overwrite;
    }
    set overwrite(overwrite) {
      this._overwrite = overwrite;
    }
    get eager() {
      return this.currentMask ? this.currentMask.eager : this._eager;
    }
    set eager(eager) {
      this._eager = eager;
    }
    get skipInvalid() {
      return this.currentMask ? this.currentMask.skipInvalid : this._skipInvalid;
    }
    set skipInvalid(skipInvalid) {
      this._skipInvalid = skipInvalid;
    }
    maskEquals(mask) {
      return Array.isArray(mask) ? this.compiledMasks.every((m, mi) => {
        if (!mask[mi]) return;
        const {
          mask: oldMask,
          ...restOpts
        } = mask[mi];
        return objectIncludes(m, restOpts) && m.maskEquals(oldMask);
      }) : super.maskEquals(mask);
    }
    typedValueEquals(value) {
      var _this$currentMask5;
      return Boolean((_this$currentMask5 = this.currentMask) == null ? void 0 : _this$currentMask5.typedValueEquals(value));
    }
  }
  MaskedDynamic.DEFAULTS = void 0;
  MaskedDynamic.DEFAULTS = {
    dispatch: (appended, masked, flags, tail) => {
      if (!masked.compiledMasks.length) return;
      const inputValue = masked.rawInputValue;

      // simulate input
      const inputs = masked.compiledMasks.map((m, index) => {
        const isCurrent = masked.currentMask === m;
        const startInputPos = isCurrent ? m.displayValue.length : m.nearestInputPos(m.displayValue.length, DIRECTION.FORCE_LEFT);
        if (m.rawInputValue !== inputValue) {
          m.reset();
          m.append(inputValue, {
            raw: true
          });
        } else if (!isCurrent) {
          m.remove(startInputPos);
        }
        m.append(appended, masked.currentMaskFlags(flags));
        m.appendTail(tail);
        return {
          index,
          weight: m.rawInputValue.length,
          totalInputPositions: m.totalInputPositions(0, Math.max(startInputPos, m.nearestInputPos(m.displayValue.length, DIRECTION.FORCE_LEFT)))
        };
      });

      // pop masks with longer values first
      inputs.sort((i1, i2) => i2.weight - i1.weight || i2.totalInputPositions - i1.totalInputPositions);
      return masked.compiledMasks[inputs[0].index];
    }
  };
  IMask.MaskedDynamic = MaskedDynamic;

  /** Pattern which validates enum values */
  class MaskedEnum extends MaskedPattern {
    constructor(opts) {
      super(opts); // mask will be created in _update
    }

    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      const {
        enum: _enum,
        ...eopts
      } = opts;
      if (_enum) {
        const lengths = _enum.map(e => e.length);
        const requiredLength = Math.min(...lengths);
        const optionalLength = Math.max(...lengths) - requiredLength;
        eopts.mask = '*'.repeat(requiredLength);
        if (optionalLength) eopts.mask += '[' + '*'.repeat(optionalLength) + ']';
        this.enum = _enum;
      }
      super._update(eopts);
    }
    doValidate(flags) {
      return this.enum.some(e => e.indexOf(this.unmaskedValue) === 0) && super.doValidate(flags);
    }
  }
  IMask.MaskedEnum = MaskedEnum;

  /** Masking by custom Function */
  class MaskedFunction extends Masked {
    /** */

    /** Enable characters overwriting */

    /** */

    /** */

    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      super._update({
        ...opts,
        validate: opts.mask
      });
    }
  }
  IMask.MaskedFunction = MaskedFunction;

  /** Number mask */
  class MaskedNumber extends Masked {
    /** Single char */

    /** Single char */

    /** Array of single chars */

    /** */

    /** */

    /** Digits after point */

    /** Flag to remove leading and trailing zeros in the end of editing */

    /** Flag to pad trailing zeros after point in the end of editing */

    /** Enable characters overwriting */

    /** */

    /** */

    /** Format typed value to string */

    /** Parse string to get typed value */

    constructor(opts) {
      super({
        ...MaskedNumber.DEFAULTS,
        ...opts
      });
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      super._update(opts);
      this._updateRegExps();
    }
    _updateRegExps() {
      const start = '^' + (this.allowNegative ? '[+|\\-]?' : '');
      const mid = '\\d*';
      const end = (this.scale ? "(" + escapeRegExp(this.radix) + "\\d{0," + this.scale + "})?" : '') + '$';
      this._numberRegExp = new RegExp(start + mid + end);
      this._mapToRadixRegExp = new RegExp("[" + this.mapToRadix.map(escapeRegExp).join('') + "]", 'g');
      this._thousandsSeparatorRegExp = new RegExp(escapeRegExp(this.thousandsSeparator), 'g');
    }
    _removeThousandsSeparators(value) {
      return value.replace(this._thousandsSeparatorRegExp, '');
    }
    _insertThousandsSeparators(value) {
      // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
      const parts = value.split(this.radix);
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandsSeparator);
      return parts.join(this.radix);
    }
    doPrepareChar(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const [prepCh, details] = super.doPrepareChar(this._removeThousandsSeparators(this.scale && this.mapToRadix.length && (
      /*
        radix should be mapped when
        1) input is done from keyboard = flags.input && flags.raw
        2) unmasked value is set = !flags.input && !flags.raw
        and should not be mapped when
        1) value is set = flags.input && !flags.raw
        2) raw value is set = !flags.input && flags.raw
      */
      flags.input && flags.raw || !flags.input && !flags.raw) ? ch.replace(this._mapToRadixRegExp, this.radix) : ch), flags);
      if (ch && !prepCh) details.skip = true;
      if (prepCh && !this.allowPositive && !this.value && prepCh !== '-') details.aggregate(this._appendChar('-'));
      return [prepCh, details];
    }
    _separatorsCount(to, extendOnSeparators) {
      if (extendOnSeparators === void 0) {
        extendOnSeparators = false;
      }
      let count = 0;
      for (let pos = 0; pos < to; ++pos) {
        if (this._value.indexOf(this.thousandsSeparator, pos) === pos) {
          ++count;
          if (extendOnSeparators) to += this.thousandsSeparator.length;
        }
      }
      return count;
    }
    _separatorsCountFromSlice(slice) {
      if (slice === void 0) {
        slice = this._value;
      }
      return this._separatorsCount(this._removeThousandsSeparators(slice).length, true);
    }
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      [fromPos, toPos] = this._adjustRangeWithSeparators(fromPos, toPos);
      return this._removeThousandsSeparators(super.extractInput(fromPos, toPos, flags));
    }
    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      if (!this.thousandsSeparator) return super._appendCharRaw(ch, flags);
      const prevBeforeTailValue = flags.tail && flags._beforeTailState ? flags._beforeTailState._value : this._value;
      const prevBeforeTailSeparatorsCount = this._separatorsCountFromSlice(prevBeforeTailValue);
      this._value = this._removeThousandsSeparators(this.value);
      const appendDetails = super._appendCharRaw(ch, flags);
      this._value = this._insertThousandsSeparators(this._value);
      const beforeTailValue = flags.tail && flags._beforeTailState ? flags._beforeTailState._value : this._value;
      const beforeTailSeparatorsCount = this._separatorsCountFromSlice(beforeTailValue);
      appendDetails.tailShift += (beforeTailSeparatorsCount - prevBeforeTailSeparatorsCount) * this.thousandsSeparator.length;
      appendDetails.skip = !appendDetails.rawInserted && ch === this.thousandsSeparator;
      return appendDetails;
    }
    _findSeparatorAround(pos) {
      if (this.thousandsSeparator) {
        const searchFrom = pos - this.thousandsSeparator.length + 1;
        const separatorPos = this.value.indexOf(this.thousandsSeparator, searchFrom);
        if (separatorPos <= pos) return separatorPos;
      }
      return -1;
    }
    _adjustRangeWithSeparators(from, to) {
      const separatorAroundFromPos = this._findSeparatorAround(from);
      if (separatorAroundFromPos >= 0) from = separatorAroundFromPos;
      const separatorAroundToPos = this._findSeparatorAround(to);
      if (separatorAroundToPos >= 0) to = separatorAroundToPos + this.thousandsSeparator.length;
      return [from, to];
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      [fromPos, toPos] = this._adjustRangeWithSeparators(fromPos, toPos);
      const valueBeforePos = this.value.slice(0, fromPos);
      const valueAfterPos = this.value.slice(toPos);
      const prevBeforeTailSeparatorsCount = this._separatorsCount(valueBeforePos.length);
      this._value = this._insertThousandsSeparators(this._removeThousandsSeparators(valueBeforePos + valueAfterPos));
      const beforeTailSeparatorsCount = this._separatorsCountFromSlice(valueBeforePos);
      return new ChangeDetails({
        tailShift: (beforeTailSeparatorsCount - prevBeforeTailSeparatorsCount) * this.thousandsSeparator.length
      });
    }
    nearestInputPos(cursorPos, direction) {
      if (!this.thousandsSeparator) return cursorPos;
      switch (direction) {
        case DIRECTION.NONE:
        case DIRECTION.LEFT:
        case DIRECTION.FORCE_LEFT:
          {
            const separatorAtLeftPos = this._findSeparatorAround(cursorPos - 1);
            if (separatorAtLeftPos >= 0) {
              const separatorAtLeftEndPos = separatorAtLeftPos + this.thousandsSeparator.length;
              if (cursorPos < separatorAtLeftEndPos || this.value.length <= separatorAtLeftEndPos || direction === DIRECTION.FORCE_LEFT) {
                return separatorAtLeftPos;
              }
            }
            break;
          }
        case DIRECTION.RIGHT:
        case DIRECTION.FORCE_RIGHT:
          {
            const separatorAtRightPos = this._findSeparatorAround(cursorPos);
            if (separatorAtRightPos >= 0) {
              return separatorAtRightPos + this.thousandsSeparator.length;
            }
          }
      }
      return cursorPos;
    }
    doValidate(flags) {
      // validate as string
      let valid = Boolean(this._removeThousandsSeparators(this.value).match(this._numberRegExp));
      if (valid) {
        // validate as number
        const number = this.number;
        valid = valid && !isNaN(number) && (
        // check min bound for negative values
        this.min == null || this.min >= 0 || this.min <= this.number) && (
        // check max bound for positive values
        this.max == null || this.max <= 0 || this.number <= this.max);
      }
      return valid && super.doValidate(flags);
    }
    doCommit() {
      if (this.value) {
        const number = this.number;
        let validnum = number;

        // check bounds
        if (this.min != null) validnum = Math.max(validnum, this.min);
        if (this.max != null) validnum = Math.min(validnum, this.max);
        if (validnum !== number) this.unmaskedValue = this.format(validnum, this);
        let formatted = this.value;
        if (this.normalizeZeros) formatted = this._normalizeZeros(formatted);
        if (this.padFractionalZeros && this.scale > 0) formatted = this._padFractionalZeros(formatted);
        this._value = formatted;
      }
      super.doCommit();
    }
    _normalizeZeros(value) {
      const parts = this._removeThousandsSeparators(value).split(this.radix);

      // remove leading zeros
      parts[0] = parts[0].replace(/^(\D*)(0*)(\d*)/, (match, sign, zeros, num) => sign + num);
      // add leading zero
      if (value.length && !/\d$/.test(parts[0])) parts[0] = parts[0] + '0';
      if (parts.length > 1) {
        parts[1] = parts[1].replace(/0*$/, ''); // remove trailing zeros
        if (!parts[1].length) parts.length = 1; // remove fractional
      }

      return this._insertThousandsSeparators(parts.join(this.radix));
    }
    _padFractionalZeros(value) {
      if (!value) return value;
      const parts = value.split(this.radix);
      if (parts.length < 2) parts.push('');
      parts[1] = parts[1].padEnd(this.scale, '0');
      return parts.join(this.radix);
    }
    doSkipInvalid(ch, flags, checkTail) {
      if (flags === void 0) {
        flags = {};
      }
      const dropFractional = this.scale === 0 && ch !== this.thousandsSeparator && (ch === this.radix || ch === MaskedNumber.UNMASKED_RADIX || this.mapToRadix.includes(ch));
      return super.doSkipInvalid(ch, flags, checkTail) && !dropFractional;
    }
    get unmaskedValue() {
      return this._removeThousandsSeparators(this._normalizeZeros(this.value)).replace(this.radix, MaskedNumber.UNMASKED_RADIX);
    }
    set unmaskedValue(unmaskedValue) {
      super.unmaskedValue = unmaskedValue;
    }
    get typedValue() {
      return this.parse(this.unmaskedValue, this);
    }
    set typedValue(n) {
      this.rawInputValue = this.format(n, this).replace(MaskedNumber.UNMASKED_RADIX, this.radix);
    }

    /** Parsed Number */
    get number() {
      return this.typedValue;
    }
    set number(number) {
      this.typedValue = number;
    }

    /**
      Is negative allowed
    */
    get allowNegative() {
      return this.min != null && this.min < 0 || this.max != null && this.max < 0;
    }

    /**
      Is positive allowed
    */
    get allowPositive() {
      return this.min != null && this.min > 0 || this.max != null && this.max > 0;
    }
    typedValueEquals(value) {
      // handle  0 -> '' case (typed = 0 even if value = '')
      // for details see https://github.com/uNmAnNeR/imaskjs/issues/134
      return (super.typedValueEquals(value) || MaskedNumber.EMPTY_VALUES.includes(value) && MaskedNumber.EMPTY_VALUES.includes(this.typedValue)) && !(value === 0 && this.value === '');
    }
  }
  MaskedNumber.UNMASKED_RADIX = '.';
  MaskedNumber.EMPTY_VALUES = [...Masked.EMPTY_VALUES, 0];
  MaskedNumber.DEFAULTS = {
    mask: Number,
    radix: ',',
    thousandsSeparator: '',
    mapToRadix: [MaskedNumber.UNMASKED_RADIX],
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    scale: 2,
    normalizeZeros: true,
    padFractionalZeros: false,
    parse: Number,
    format: n => n.toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 20
    })
  };
  IMask.MaskedNumber = MaskedNumber;

  /** Mask pipe source and destination types */
  const PIPE_TYPE = {
    MASKED: 'value',
    UNMASKED: 'unmaskedValue',
    TYPED: 'typedValue'
  };
  /** Creates new pipe function depending on mask type, source and destination options */
  function createPipe(arg, from, to) {
    if (from === void 0) {
      from = PIPE_TYPE.MASKED;
    }
    if (to === void 0) {
      to = PIPE_TYPE.MASKED;
    }
    const masked = createMask(arg);
    return value => masked.runIsolated(m => {
      m[from] = value;
      return m[to];
    });
  }

  /** Pipes value through mask depending on mask type, source and destination options */
  function pipe(value, mask, from, to) {
    return createPipe(mask, from, to)(value);
  }
  IMask.PIPE_TYPE = PIPE_TYPE;
  IMask.createPipe = createPipe;
  IMask.pipe = pipe;

  try {
    globalThis.IMask = IMask;
  } catch {}

  exports.ChangeDetails = ChangeDetails;
  exports.ChunksTailDetails = ChunksTailDetails;
  exports.DIRECTION = DIRECTION;
  exports.HTMLContenteditableMaskElement = HTMLContenteditableMaskElement;
  exports.HTMLInputMaskElement = HTMLInputMaskElement;
  exports.HTMLMaskElement = HTMLMaskElement;
  exports.InputMask = InputMask;
  exports.MaskElement = MaskElement;
  exports.Masked = Masked;
  exports.MaskedDate = MaskedDate;
  exports.MaskedDynamic = MaskedDynamic;
  exports.MaskedEnum = MaskedEnum;
  exports.MaskedFunction = MaskedFunction;
  exports.MaskedNumber = MaskedNumber;
  exports.MaskedPattern = MaskedPattern;
  exports.MaskedRange = MaskedRange;
  exports.MaskedRegExp = MaskedRegExp;
  exports.PIPE_TYPE = PIPE_TYPE;
  exports.PatternFixedDefinition = PatternFixedDefinition;
  exports.PatternInputDefinition = PatternInputDefinition;
  exports.createMask = createMask;
  exports.createPipe = createPipe;
  exports.default = IMask;
  exports.forceDirection = forceDirection;
  exports.normalizeOpts = normalizeOpts;
  exports.pipe = pipe;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=imask.js.map

!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).noUiSlider={})}(this,function(ut){"use strict";function n(t){return"object"==typeof t&&"function"==typeof t.to}function ct(t){t.parentElement.removeChild(t)}function pt(t){return null!=t}function ft(t){t.preventDefault()}function i(t){return"number"==typeof t&&!isNaN(t)&&isFinite(t)}function dt(t,e,r){0<r&&(gt(t,e),setTimeout(function(){vt(t,e)},r))}function ht(t){return Math.max(Math.min(t,100),0)}function mt(t){return Array.isArray(t)?t:[t]}function e(t){t=(t=String(t)).split(".");return 1<t.length?t[1].length:0}function gt(t,e){t.classList&&!/\s/.test(e)?t.classList.add(e):t.className+=" "+e}function vt(t,e){t.classList&&!/\s/.test(e)?t.classList.remove(e):t.className=t.className.replace(new RegExp("(^|\\b)"+e.split(" ").join("|")+"(\\b|$)","gi")," ")}function bt(t){var e=void 0!==window.pageXOffset,r="CSS1Compat"===(t.compatMode||"");return{x:e?window.pageXOffset:(r?t.documentElement:t.body).scrollLeft,y:e?window.pageYOffset:(r?t.documentElement:t.body).scrollTop}}function s(t,e){return 100/(e-t)}function a(t,e,r){return 100*e/(t[r+1]-t[r])}function l(t,e){for(var r=1;t>=e[r];)r+=1;return r}function r(t,e,r){if(r>=t.slice(-1)[0])return 100;var n=l(r,t),i=t[n-1],o=t[n],t=e[n-1],n=e[n];return t+(r=r,a(o=[i,o],o[0]<0?r+Math.abs(o[0]):r-o[0],0)/s(t,n))}function o(t,e,r,n){if(100===n)return n;var i=l(n,t),o=t[i-1],s=t[i];return r?(s-o)/2<n-o?s:o:e[i-1]?t[i-1]+(t=n-t[i-1],i=e[i-1],Math.round(t/i)*i):n}ut.PipsMode=void 0,(z=ut.PipsMode||(ut.PipsMode={})).Range="range",z.Steps="steps",z.Positions="positions",z.Count="count",z.Values="values",ut.PipsType=void 0,(z=ut.PipsType||(ut.PipsType={}))[z.None=-1]="None",z[z.NoValue=0]="NoValue",z[z.LargeValue=1]="LargeValue",z[z.SmallValue=2]="SmallValue";var u=(t.prototype.getDistance=function(t){for(var e=[],r=0;r<this.xNumSteps.length-1;r++)e[r]=a(this.xVal,t,r);return e},t.prototype.getAbsoluteDistance=function(t,e,r){var n=0;if(t<this.xPct[this.xPct.length-1])for(;t>this.xPct[n+1];)n++;else t===this.xPct[this.xPct.length-1]&&(n=this.xPct.length-2);r||t!==this.xPct[n+1]||n++;for(var i,o=1,s=(e=null===e?[]:e)[n],a=0,l=0,u=0,c=r?(t-this.xPct[n])/(this.xPct[n+1]-this.xPct[n]):(this.xPct[n+1]-t)/(this.xPct[n+1]-this.xPct[n]);0<s;)i=this.xPct[n+1+u]-this.xPct[n+u],100<e[n+u]*o+100-100*c?(a=i*c,o=(s-100*c)/e[n+u],c=1):(a=e[n+u]*i/100*o,o=0),r?(l-=a,1<=this.xPct.length+u&&u--):(l+=a,1<=this.xPct.length-u&&u++),s=e[n+u]*o;return t+l},t.prototype.toStepping=function(t){return t=r(this.xVal,this.xPct,t)},t.prototype.fromStepping=function(t){return function(t,e,r){if(100<=r)return t.slice(-1)[0];var n=l(r,e),i=t[n-1],o=t[n],t=e[n-1],n=e[n];return(r-t)*s(t,n)*((o=[i,o])[1]-o[0])/100+o[0]}(this.xVal,this.xPct,t)},t.prototype.getStep=function(t){return t=o(this.xPct,this.xSteps,this.snap,t)},t.prototype.getDefaultStep=function(t,e,r){var n=l(t,this.xPct);return(100===t||e&&t===this.xPct[n-1])&&(n=Math.max(n-1,1)),(this.xVal[n]-this.xVal[n-1])/r},t.prototype.getNearbySteps=function(t){t=l(t,this.xPct);return{stepBefore:{startValue:this.xVal[t-2],step:this.xNumSteps[t-2],highestStep:this.xHighestCompleteStep[t-2]},thisStep:{startValue:this.xVal[t-1],step:this.xNumSteps[t-1],highestStep:this.xHighestCompleteStep[t-1]},stepAfter:{startValue:this.xVal[t],step:this.xNumSteps[t],highestStep:this.xHighestCompleteStep[t]}}},t.prototype.countStepDecimals=function(){var t=this.xNumSteps.map(e);return Math.max.apply(null,t)},t.prototype.hasNoSize=function(){return this.xVal[0]===this.xVal[this.xVal.length-1]},t.prototype.convert=function(t){return this.getStep(this.toStepping(t))},t.prototype.handleEntryPoint=function(t,e){t="min"===t?0:"max"===t?100:parseFloat(t);if(!i(t)||!i(e[0]))throw new Error("noUiSlider: 'range' value isn't numeric.");this.xPct.push(t),this.xVal.push(e[0]);e=Number(e[1]);t?this.xSteps.push(!isNaN(e)&&e):isNaN(e)||(this.xSteps[0]=e),this.xHighestCompleteStep.push(0)},t.prototype.handleStepPoint=function(t,e){e&&(this.xVal[t]!==this.xVal[t+1]?(this.xSteps[t]=a([this.xVal[t],this.xVal[t+1]],e,0)/s(this.xPct[t],this.xPct[t+1]),e=(this.xVal[t+1]-this.xVal[t])/this.xNumSteps[t],e=Math.ceil(Number(e.toFixed(3))-1),e=this.xVal[t]+this.xNumSteps[t]*e,this.xHighestCompleteStep[t]=e):this.xSteps[t]=this.xHighestCompleteStep[t]=this.xVal[t])},t);function t(e,t,r){var n;this.xPct=[],this.xVal=[],this.xSteps=[],this.xNumSteps=[],this.xHighestCompleteStep=[],this.xSteps=[r||!1],this.xNumSteps=[!1],this.snap=t;var i=[];for(Object.keys(e).forEach(function(t){i.push([mt(e[t]),t])}),i.sort(function(t,e){return t[0][0]-e[0][0]}),n=0;n<i.length;n++)this.handleEntryPoint(i[n][1],i[n][0]);for(this.xNumSteps=this.xSteps.slice(0),n=0;n<this.xNumSteps.length;n++)this.handleStepPoint(n,this.xNumSteps[n])}var c={to:function(t){return void 0===t?"":t.toFixed(2)},from:Number},p={target:"target",base:"base",origin:"origin",handle:"handle",handleLower:"handle-lower",handleUpper:"handle-upper",touchArea:"touch-area",horizontal:"horizontal",vertical:"vertical",background:"background",connect:"connect",connects:"connects",ltr:"ltr",rtl:"rtl",textDirectionLtr:"txt-dir-ltr",textDirectionRtl:"txt-dir-rtl",draggable:"draggable",drag:"state-drag",tap:"state-tap",active:"active",tooltip:"tooltip",pips:"pips",pipsHorizontal:"pips-horizontal",pipsVertical:"pips-vertical",marker:"marker",markerHorizontal:"marker-horizontal",markerVertical:"marker-vertical",markerNormal:"marker-normal",markerLarge:"marker-large",markerSub:"marker-sub",value:"value",valueHorizontal:"value-horizontal",valueVertical:"value-vertical",valueNormal:"value-normal",valueLarge:"value-large",valueSub:"value-sub"},St={tooltips:".__tooltips",aria:".__aria"};function f(t,e){if(!i(e))throw new Error("noUiSlider: 'step' is not numeric.");t.singleStep=e}function d(t,e){if(!i(e))throw new Error("noUiSlider: 'keyboardPageMultiplier' is not numeric.");t.keyboardPageMultiplier=e}function h(t,e){if(!i(e))throw new Error("noUiSlider: 'keyboardMultiplier' is not numeric.");t.keyboardMultiplier=e}function m(t,e){if(!i(e))throw new Error("noUiSlider: 'keyboardDefaultStep' is not numeric.");t.keyboardDefaultStep=e}function g(t,e){if("object"!=typeof e||Array.isArray(e))throw new Error("noUiSlider: 'range' is not an object.");if(void 0===e.min||void 0===e.max)throw new Error("noUiSlider: Missing 'min' or 'max' in 'range'.");t.spectrum=new u(e,t.snap||!1,t.singleStep)}function v(t,e){if(e=mt(e),!Array.isArray(e)||!e.length)throw new Error("noUiSlider: 'start' option is incorrect.");t.handles=e.length,t.start=e}function b(t,e){if("boolean"!=typeof e)throw new Error("noUiSlider: 'snap' option must be a boolean.");t.snap=e}function S(t,e){if("boolean"!=typeof e)throw new Error("noUiSlider: 'animate' option must be a boolean.");t.animate=e}function x(t,e){if("number"!=typeof e)throw new Error("noUiSlider: 'animationDuration' option must be a number.");t.animationDuration=e}function xt(t,e){var r,n=[!1];if("lower"===e?e=[!0,!1]:"upper"===e&&(e=[!1,!0]),!0===e||!1===e){for(r=1;r<t.handles;r++)n.push(e);n.push(!1)}else{if(!Array.isArray(e)||!e.length||e.length!==t.handles+1)throw new Error("noUiSlider: 'connect' option doesn't match handle count.");n=e}t.connect=n}function y(t,e){switch(e){case"horizontal":t.ort=0;break;case"vertical":t.ort=1;break;default:throw new Error("noUiSlider: 'orientation' option is invalid.")}}function w(t,e){if(!i(e))throw new Error("noUiSlider: 'margin' option must be numeric.");0!==e&&(t.margin=t.spectrum.getDistance(e))}function E(t,e){if(!i(e))throw new Error("noUiSlider: 'limit' option must be numeric.");if(t.limit=t.spectrum.getDistance(e),!t.limit||t.handles<2)throw new Error("noUiSlider: 'limit' option is only supported on linear sliders with 2 or more handles.")}function P(t,e){var r;if(!i(e)&&!Array.isArray(e))throw new Error("noUiSlider: 'padding' option must be numeric or array of exactly 2 numbers.");if(Array.isArray(e)&&2!==e.length&&!i(e[0])&&!i(e[1]))throw new Error("noUiSlider: 'padding' option must be numeric or array of exactly 2 numbers.");if(0!==e){for(Array.isArray(e)||(e=[e,e]),t.padding=[t.spectrum.getDistance(e[0]),t.spectrum.getDistance(e[1])],r=0;r<t.spectrum.xNumSteps.length-1;r++)if(t.padding[0][r]<0||t.padding[1][r]<0)throw new Error("noUiSlider: 'padding' option must be a positive number(s).");var n=e[0]+e[1],e=t.spectrum.xVal[0];if(1<n/(t.spectrum.xVal[t.spectrum.xVal.length-1]-e))throw new Error("noUiSlider: 'padding' option must not exceed 100% of the range.")}}function C(t,e){switch(e){case"ltr":t.dir=0;break;case"rtl":t.dir=1;break;default:throw new Error("noUiSlider: 'direction' option was not recognized.")}}function N(t,e){if("string"!=typeof e)throw new Error("noUiSlider: 'behaviour' must be a string containing options.");var r=0<=e.indexOf("tap"),n=0<=e.indexOf("drag"),i=0<=e.indexOf("fixed"),o=0<=e.indexOf("snap"),s=0<=e.indexOf("hover"),a=0<=e.indexOf("unconstrained"),l=0<=e.indexOf("invert-connects"),u=0<=e.indexOf("drag-all"),e=0<=e.indexOf("smooth-steps");if(i){if(2!==t.handles)throw new Error("noUiSlider: 'fixed' behaviour must be used with 2 handles");w(t,t.start[1]-t.start[0])}if(l&&2!==t.handles)throw new Error("noUiSlider: 'invert-connects' behaviour must be used with 2 handles");if(a&&(t.margin||t.limit))throw new Error("noUiSlider: 'unconstrained' behaviour cannot be used with margin or limit");t.events={tap:r||o,drag:n,dragAll:u,smoothSteps:e,fixed:i,snap:o,hover:s,unconstrained:a,invertConnects:l}}function V(t,e){if(!1!==e)if(!0===e||n(e)){t.tooltips=[];for(var r=0;r<t.handles;r++)t.tooltips.push(e)}else{if((e=mt(e)).length!==t.handles)throw new Error("noUiSlider: must pass a formatter for all handles.");e.forEach(function(t){if("boolean"!=typeof t&&!n(t))throw new Error("noUiSlider: 'tooltips' must be passed a formatter or 'false'.")}),t.tooltips=e}}function A(t,e){if(e.length!==t.handles)throw new Error("noUiSlider: must pass a attributes for all handles.");t.handleAttributes=e}function k(t,e){if(!n(e))throw new Error("noUiSlider: 'ariaFormat' requires 'to' method.");t.ariaFormat=e}function M(t,e){if(!n(r=e)||"function"!=typeof r.from)throw new Error("noUiSlider: 'format' requires 'to' and 'from' methods.");var r;t.format=e}function U(t,e){if("boolean"!=typeof e)throw new Error("noUiSlider: 'keyboardSupport' option must be a boolean.");t.keyboardSupport=e}function D(t,e){t.documentElement=e}function O(t,e){if("string"!=typeof e&&!1!==e)throw new Error("noUiSlider: 'cssPrefix' must be a string or `false`.");t.cssPrefix=e}function L(e,r){if("object"!=typeof r)throw new Error("noUiSlider: 'cssClasses' must be an object.");"string"==typeof e.cssPrefix?(e.cssClasses={},Object.keys(r).forEach(function(t){e.cssClasses[t]=e.cssPrefix+r[t]})):e.cssClasses=r}function yt(e){var r={margin:null,limit:null,padding:null,animate:!0,animationDuration:300,ariaFormat:c,format:c},n={step:{r:!1,t:f},keyboardPageMultiplier:{r:!1,t:d},keyboardMultiplier:{r:!1,t:h},keyboardDefaultStep:{r:!1,t:m},start:{r:!0,t:v},connect:{r:!0,t:xt},direction:{r:!0,t:C},snap:{r:!1,t:b},animate:{r:!1,t:S},animationDuration:{r:!1,t:x},range:{r:!0,t:g},orientation:{r:!1,t:y},margin:{r:!1,t:w},limit:{r:!1,t:E},padding:{r:!1,t:P},behaviour:{r:!0,t:N},ariaFormat:{r:!1,t:k},format:{r:!1,t:M},tooltips:{r:!1,t:V},keyboardSupport:{r:!0,t:U},documentElement:{r:!1,t:D},cssPrefix:{r:!0,t:O},cssClasses:{r:!0,t:L},handleAttributes:{r:!1,t:A}},i={connect:!1,direction:"ltr",behaviour:"tap",orientation:"horizontal",keyboardSupport:!0,cssPrefix:"noUi-",cssClasses:p,keyboardPageMultiplier:5,keyboardMultiplier:1,keyboardDefaultStep:10};e.format&&!e.ariaFormat&&(e.ariaFormat=e.format),Object.keys(n).forEach(function(t){if(pt(e[t])||void 0!==i[t])n[t].t(r,(pt(e[t])?e:i)[t]);else if(n[t].r)throw new Error("noUiSlider: '"+t+"' is required.")}),r.pips=e.pips;var t=document.createElement("div"),o=void 0!==t.style.msTransform,t=void 0!==t.style.transform;r.transformRule=t?"transform":o?"msTransform":"webkitTransform";return r.style=[["left","top"],["right","bottom"]][r.dir][r.ort],r}function T(t,f,o){var i,n,l,u,s,a,c=window.navigator.pointerEnabled?{start:"pointerdown",move:"pointermove",end:"pointerup"}:window.navigator.msPointerEnabled?{start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}:{start:"mousedown touchstart",move:"mousemove touchmove",end:"mouseup touchend"},p=window.CSS&&CSS.supports&&CSS.supports("touch-action","none")&&function(){var t=!1;try{var e=Object.defineProperty({},"passive",{get:function(){t=!0}});window.addEventListener("test",null,e)}catch(t){}return t}(),d=t,S=f.spectrum,h=[],m=[],g=[],v=0,b={},x=!1,y=t.ownerDocument,w=f.documentElement||y.documentElement,E=y.body,r="rtl"===y.dir||1===f.ort?0:100;function P(t,e){var r=y.createElement("div");return e&&gt(r,e),t.appendChild(r),r}function C(t,e){var r,t=P(t,f.cssClasses.origin),n=P(t,f.cssClasses.handle);return P(n,f.cssClasses.touchArea),n.setAttribute("data-handle",String(e)),f.keyboardSupport&&(n.setAttribute("tabindex","0"),n.addEventListener("keydown",function(t){return function(t,e){if(V()||A(e))return!1;var r=["Left","Right"],n=["Down","Up"],i=["PageDown","PageUp"],o=["Home","End"];f.dir&&!f.ort?r.reverse():f.ort&&!f.dir&&(n.reverse(),i.reverse());var s=t.key.replace("Arrow",""),a=s===i[0],l=s===i[1],i=s===n[0]||s===r[0]||a,n=s===n[1]||s===r[1]||l,r=s===o[0],o=s===o[1];if(!(i||n||r||o))return!0;if(t.preventDefault(),n||i){var u=i?0:1,u=st(e)[u];if(null===u)return!1;!1===u&&(u=S.getDefaultStep(m[e],i,f.keyboardDefaultStep)),u*=l||a?f.keyboardPageMultiplier:f.keyboardMultiplier,u=Math.max(u,1e-7),u*=i?-1:1,u=h[e]+u}else u=o?f.spectrum.xVal[f.spectrum.xVal.length-1]:f.spectrum.xVal[0];return et(e,S.toStepping(u),!0,!0),$("slide",e),$("update",e),$("change",e),$("set",e),!1}(t,e)})),void 0!==f.handleAttributes&&(r=f.handleAttributes[e],Object.keys(r).forEach(function(t){n.setAttribute(t,r[t])})),n.setAttribute("role","slider"),n.setAttribute("aria-orientation",f.ort?"vertical":"horizontal"),0===e?gt(n,f.cssClasses.handleLower):e===f.handles-1&&gt(n,f.cssClasses.handleUpper),t.handle=n,t}function N(t,e){return!!e&&P(t,f.cssClasses.connect)}function e(t,e){return!(!f.tooltips||!f.tooltips[e])&&P(t.firstChild,f.cssClasses.tooltip)}function V(){return d.hasAttribute("disabled")}function A(t){return l[t].hasAttribute("disabled")}function k(){a&&(W("update"+St.tooltips),a.forEach(function(t){t&&ct(t)}),a=null)}function M(){k(),a=l.map(e),I("update"+St.tooltips,function(t,e,r){a&&f.tooltips&&!1!==a[e]&&(t=t[e],!0!==f.tooltips[e]&&(t=f.tooltips[e].to(r[e])),a[e].innerHTML=t)})}function U(t,e){return t.map(function(t){return S.fromStepping(e?S.getStep(t):t)})}function D(d){var h=function(t){if(t.mode===ut.PipsMode.Range||t.mode===ut.PipsMode.Steps)return S.xVal;if(t.mode!==ut.PipsMode.Count)return t.mode===ut.PipsMode.Positions?U(t.values,t.stepped):t.mode===ut.PipsMode.Values?t.stepped?t.values.map(function(t){return S.fromStepping(S.getStep(S.toStepping(t)))}):t.values:[];if(t.values<2)throw new Error("noUiSlider: 'values' (>= 2) required for mode 'count'.");for(var e=t.values-1,r=100/e,n=[];e--;)n[e]=e*r;return n.push(100),U(n,t.stepped)}(d),m={},t=S.xVal[0],e=S.xVal[S.xVal.length-1],g=!1,v=!1,b=0;return(h=h.slice().sort(function(t,e){return t-e}).filter(function(t){return!this[t]&&(this[t]=!0)},{}))[0]!==t&&(h.unshift(t),g=!0),h[h.length-1]!==e&&(h.push(e),v=!0),h.forEach(function(t,e){var r,n,i,o,s,a,l,u,t=t,c=h[e+1],p=d.mode===ut.PipsMode.Steps,f=(f=p?S.xNumSteps[e]:f)||c-t;for(void 0===c&&(c=t),f=Math.max(f,1e-7),r=t;r<=c;r=Number((r+f).toFixed(7))){for(a=(o=(i=S.toStepping(r))-b)/(d.density||1),u=o/(l=Math.round(a)),n=1;n<=l;n+=1)m[(s=b+n*u).toFixed(5)]=[S.fromStepping(s),0];a=-1<h.indexOf(r)?ut.PipsType.LargeValue:p?ut.PipsType.SmallValue:ut.PipsType.NoValue,!e&&g&&r!==c&&(a=0),r===c&&v||(m[i.toFixed(5)]=[r,a]),b=i}}),m}function O(i,o,s){var t,a=y.createElement("div"),n=((t={})[ut.PipsType.None]="",t[ut.PipsType.NoValue]=f.cssClasses.valueNormal,t[ut.PipsType.LargeValue]=f.cssClasses.valueLarge,t[ut.PipsType.SmallValue]=f.cssClasses.valueSub,t),l=((t={})[ut.PipsType.None]="",t[ut.PipsType.NoValue]=f.cssClasses.markerNormal,t[ut.PipsType.LargeValue]=f.cssClasses.markerLarge,t[ut.PipsType.SmallValue]=f.cssClasses.markerSub,t),u=[f.cssClasses.valueHorizontal,f.cssClasses.valueVertical],c=[f.cssClasses.markerHorizontal,f.cssClasses.markerVertical];function p(t,e){var r=e===f.cssClasses.value;return e+" "+(r?u:c)[f.ort]+" "+(r?n:l)[t]}return gt(a,f.cssClasses.pips),gt(a,0===f.ort?f.cssClasses.pipsHorizontal:f.cssClasses.pipsVertical),Object.keys(i).forEach(function(t){var e,r,n;r=i[e=t][0],n=i[t][1],(n=o?o(r,n):n)!==ut.PipsType.None&&((t=P(a,!1)).className=p(n,f.cssClasses.marker),t.style[f.style]=e+"%",n>ut.PipsType.NoValue&&((t=P(a,!1)).className=p(n,f.cssClasses.value),t.setAttribute("data-value",String(r)),t.style[f.style]=e+"%",t.innerHTML=String(s.to(r))))}),a}function L(){s&&(ct(s),s=null)}function T(t){L();var e=D(t),r=t.filter,t=t.format||{to:function(t){return String(Math.round(t))}};return s=d.appendChild(O(e,r,t))}function j(){var t=i.getBoundingClientRect(),e="offset"+["Width","Height"][f.ort];return 0===f.ort?t.width||i[e]:t.height||i[e]}function z(n,i,o,s){function e(t){var e,r=function(e,t,r){var n=0===e.type.indexOf("touch"),i=0===e.type.indexOf("mouse"),o=0===e.type.indexOf("pointer"),s=0,a=0;0===e.type.indexOf("MSPointer")&&(o=!0);if("mousedown"===e.type&&!e.buttons&&!e.touches)return!1;if(n){var l=function(t){t=t.target;return t===r||r.contains(t)||e.composed&&e.composedPath().shift()===r};if("touchstart"===e.type){n=Array.prototype.filter.call(e.touches,l);if(1<n.length)return!1;s=n[0].pageX,a=n[0].pageY}else{l=Array.prototype.find.call(e.changedTouches,l);if(!l)return!1;s=l.pageX,a=l.pageY}}t=t||bt(y),(i||o)&&(s=e.clientX+t.x,a=e.clientY+t.y);return e.pageOffset=t,e.points=[s,a],e.cursor=i||o,e}(t,s.pageOffset,s.target||i);return!!r&&(!(V()&&!s.doNotReject)&&(e=d,t=f.cssClasses.tap,!((e.classList?e.classList.contains(t):new RegExp("\\b"+t+"\\b").test(e.className))&&!s.doNotReject)&&(!(n===c.start&&void 0!==r.buttons&&1<r.buttons)&&((!s.hover||!r.buttons)&&(p||r.preventDefault(),r.calcPoint=r.points[f.ort],void o(r,s))))))}var r=[];return n.split(" ").forEach(function(t){i.addEventListener(t,e,!!p&&{passive:!0}),r.push([t,e])}),r}function H(t){var e,r,n=ht(n=100*(t-(n=i,e=f.ort,r=n.getBoundingClientRect(),n=(t=n.ownerDocument).documentElement,t=bt(t),/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)&&(t.x=0),e?r.top+t.y-n.clientTop:r.left+t.x-n.clientLeft))/j());return f.dir?100-n:n}function F(t,e){"mouseout"===t.type&&"HTML"===t.target.nodeName&&null===t.relatedTarget&&_(t,e)}function R(t,e){if(-1===navigator.appVersion.indexOf("MSIE 9")&&0===t.buttons&&0!==e.buttonsProperty)return _(t,e);t=(f.dir?-1:1)*(t.calcPoint-e.startCalcPoint);K(0<t,100*t/e.baseSize,e.locations,e.handleNumbers,e.connect)}function _(t,e){e.handle&&(vt(e.handle,f.cssClasses.active),--v),e.listeners.forEach(function(t){w.removeEventListener(t[0],t[1])}),0===v&&(vt(d,f.cssClasses.drag),tt(),t.cursor&&(E.style.cursor="",E.removeEventListener("selectstart",ft))),f.events.smoothSteps&&(e.handleNumbers.forEach(function(t){et(t,m[t],!0,!0,!1,!1)}),e.handleNumbers.forEach(function(t){$("update",t)})),e.handleNumbers.forEach(function(t){$("change",t),$("set",t),$("end",t)})}function B(t,e){var r,n,i,o;e.handleNumbers.some(A)||(1===e.handleNumbers.length&&(o=l[e.handleNumbers[0]].children[0],v+=1,gt(o,f.cssClasses.active)),t.stopPropagation(),n=z(c.move,w,R,{target:t.target,handle:o,connect:e.connect,listeners:r=[],startCalcPoint:t.calcPoint,baseSize:j(),pageOffset:t.pageOffset,handleNumbers:e.handleNumbers,buttonsProperty:t.buttons,locations:m.slice()}),i=z(c.end,w,_,{target:t.target,handle:o,listeners:r,doNotReject:!0,handleNumbers:e.handleNumbers}),o=z("mouseout",w,F,{target:t.target,handle:o,listeners:r,doNotReject:!0,handleNumbers:e.handleNumbers}),r.push.apply(r,n.concat(i,o)),t.cursor&&(E.style.cursor=getComputedStyle(t.target).cursor,1<l.length&&gt(d,f.cssClasses.drag),E.addEventListener("selectstart",ft,!1)),e.handleNumbers.forEach(function(t){$("start",t)}))}function q(t){t.stopPropagation();var i,o,s,e=H(t.calcPoint),r=(i=e,s=!(o=100),l.forEach(function(t,e){var r,n;A(e)||(r=m[e],((n=Math.abs(r-i))<o||n<=o&&r<i||100===n&&100===o)&&(s=e,o=n))}),s);!1!==r&&(f.events.snap||dt(d,f.cssClasses.tap,f.animationDuration),et(r,e,!0,!0),tt(),$("slide",r,!0),$("update",r,!0),f.events.snap?B(t,{handleNumbers:[r]}):($("change",r,!0),$("set",r,!0)))}function X(t){var t=H(t.calcPoint),t=S.getStep(t),e=S.fromStepping(t);Object.keys(b).forEach(function(t){"hover"===t.split(".")[0]&&b[t].forEach(function(t){t.call(lt,e)})})}function Y(a){a.fixed||l.forEach(function(t,e){z(c.start,t.children[0],B,{handleNumbers:[e]})}),a.tap&&z(c.start,i,q,{}),a.hover&&z(c.move,i,X,{hover:!0}),a.drag&&u.forEach(function(e,t){var r,n,i,o,s;!1!==e&&0!==t&&t!==u.length-1&&(r=l[t-1],n=l[t],i=[e],o=[r,n],s=[t-1,t],gt(e,f.cssClasses.draggable),a.fixed&&(i.push(r.children[0]),i.push(n.children[0])),a.dragAll&&(o=l,s=g),i.forEach(function(t){z(c.start,t,B,{handles:o,handleNumbers:s,connect:e})}))})}function I(t,e){b[t]=b[t]||[],b[t].push(e),"update"===t.split(".")[0]&&l.forEach(function(t,e){$("update",e)})}function W(t){var n=t&&t.split(".")[0],i=n?t.substring(n.length):t;Object.keys(b).forEach(function(t){var e=t.split(".")[0],r=t.substring(e.length);n&&n!==e||i&&i!==r||((e=r)!==St.aria&&e!==St.tooltips||i===r)&&delete b[t]})}function $(r,n,i){Object.keys(b).forEach(function(t){var e=t.split(".")[0];r===e&&b[t].forEach(function(t){t.call(lt,h.map(f.format.to),n,h.slice(),i||!1,m.slice(),lt)})})}function G(t,e,r,n,i,o,s){var a;return 1<l.length&&!f.events.unconstrained&&(n&&0<e&&(a=S.getAbsoluteDistance(t[e-1],f.margin,!1),r=Math.max(r,a)),i&&e<l.length-1&&(a=S.getAbsoluteDistance(t[e+1],f.margin,!0),r=Math.min(r,a))),1<l.length&&f.limit&&(n&&0<e&&(a=S.getAbsoluteDistance(t[e-1],f.limit,!1),r=Math.min(r,a)),i&&e<l.length-1&&(a=S.getAbsoluteDistance(t[e+1],f.limit,!0),r=Math.max(r,a))),f.padding&&(0===e&&(a=S.getAbsoluteDistance(0,f.padding[0],!1),r=Math.max(r,a)),e===l.length-1&&(a=S.getAbsoluteDistance(100,f.padding[1],!0),r=Math.min(r,a))),!((r=ht(r=!s?S.getStep(r):r))===t[e]&&!o)&&r}function J(t,e){var r=f.ort;return(r?e:t)+", "+(r?t:e)}function K(t,r,n,e,i){var o=n.slice(),s=e[0],a=f.events.smoothSteps,l=[!t,t],u=[t,!t];e=e.slice(),t&&e.reverse(),1<e.length?e.forEach(function(t,e){e=G(o,t,o[t]+r,l[e],u[e],!1,a);!1===e?r=0:(r=e-o[t],o[t]=e)}):l=u=[!0];var c=!1;e.forEach(function(t,e){c=et(t,n[t]+r,l[e],u[e],!1,a)||c}),c&&(e.forEach(function(t){$("update",t),$("slide",t)}),null!=i&&$("drag",s))}function Q(t,e){return f.dir?100-t-e:t}function Z(t,e){m[t]=e,h[t]=S.fromStepping(e);e="translate("+J(Q(e,0)-r+"%","0")+")";if(l[t].style[f.transformRule]=e,f.events.invertConnects&&1<m.length){e=m.every(function(t,e,r){return 0===e||t>=r[e-1]});if(x!==!e)return x=!x,xt(f,f.connect.map(function(t){return!t})),void at()}rt(t),rt(t+1),x&&(rt(t-1),rt(t+2))}function tt(){g.forEach(function(t){var e=50<m[t]?-1:1,e=3+(l.length+e*t);l[t].style.zIndex=String(e)})}function et(t,e,r,n,i,o){return!1!==(e=i?e:G(m,t,e,r,n,!1,o))&&(Z(t,e),!0)}function rt(t){var e,r,n;u[t]&&(e=m.slice(),x&&e.sort(function(t,e){return t-e}),n=100,r="translate("+J(Q(r=(r=0)!==t?e[t-1]:r,n=(n=t!==u.length-1?e[t]:n)-r)+"%","0")+")",n="scale("+J(n/100,"1")+")",u[t].style[f.transformRule]=r+" "+n)}function nt(t,e){return null===t||!1===t||void 0===t?m[e]:("number"==typeof t&&(t=String(t)),!1===(t=!1!==(t=f.format.from(t))?S.toStepping(t):t)||isNaN(t)?m[e]:t)}function it(t,e,r){var n=mt(t),t=void 0===m[0];e=void 0===e||e,f.animate&&!t&&dt(d,f.cssClasses.tap,f.animationDuration),g.forEach(function(t){et(t,nt(n[t],t),!0,!1,r)});var i,o=1===g.length?0:1;for(t&&S.hasNoSize()&&(r=!0,m[0]=0,1<g.length&&(i=100/(g.length-1),g.forEach(function(t){m[t]=t*i})));o<g.length;++o)g.forEach(function(t){et(t,m[t],!0,!0,r)});tt(),g.forEach(function(t){$("update",t),null!==n[t]&&e&&$("set",t)})}function ot(t){if(t=void 0===t?!1:t)return 1===h.length?h[0]:h.slice(0);t=h.map(f.format.to);return 1===t.length?t[0]:t}function st(t){var e=m[t],r=S.getNearbySteps(e),n=h[t],i=r.thisStep.step,t=null;if(f.snap)return[n-r.stepBefore.startValue||null,r.stepAfter.startValue-n||null];!1!==i&&n+i>r.stepAfter.startValue&&(i=r.stepAfter.startValue-n),t=n>r.thisStep.startValue?r.thisStep.step:!1!==r.stepBefore.step&&n-r.stepBefore.highestStep,100===e?i=null:0===e&&(t=null);e=S.countStepDecimals();return null!==i&&!1!==i&&(i=Number(i.toFixed(e))),[t=null!==t&&!1!==t?Number(t.toFixed(e)):t,i]}function at(){for(;n.firstChild;)n.removeChild(n.firstChild);for(var t=0;t<=f.handles;t++)u[t]=N(n,f.connect[t]),rt(t);Y({drag:f.events.drag,fixed:!0})}gt(t=d,f.cssClasses.target),0===f.dir?gt(t,f.cssClasses.ltr):gt(t,f.cssClasses.rtl),0===f.ort?gt(t,f.cssClasses.horizontal):gt(t,f.cssClasses.vertical),gt(t,"rtl"===getComputedStyle(t).direction?f.cssClasses.textDirectionRtl:f.cssClasses.textDirectionLtr),i=P(t,f.cssClasses.base),function(t,e){n=P(e,f.cssClasses.connects),l=[],(u=[]).push(N(n,t[0]));for(var r=0;r<f.handles;r++)l.push(C(e,r)),g[r]=r,u.push(N(n,t[r+1]))}(f.connect,i),Y(f.events),it(f.start),f.pips&&T(f.pips),f.tooltips&&M(),W("update"+St.aria),I("update"+St.aria,function(t,e,o,r,s){g.forEach(function(t){var e=l[t],r=G(m,t,0,!0,!0,!0),n=G(m,t,100,!0,!0,!0),i=s[t],t=String(f.ariaFormat.to(o[t])),r=S.fromStepping(r).toFixed(1),n=S.fromStepping(n).toFixed(1),i=S.fromStepping(i).toFixed(1);e.children[0].setAttribute("aria-valuemin",r),e.children[0].setAttribute("aria-valuemax",n),e.children[0].setAttribute("aria-valuenow",i),e.children[0].setAttribute("aria-valuetext",t)})});var lt={destroy:function(){for(W(St.aria),W(St.tooltips),Object.keys(f.cssClasses).forEach(function(t){vt(d,f.cssClasses[t])});d.firstChild;)d.removeChild(d.firstChild);delete d.noUiSlider},steps:function(){return g.map(st)},on:I,off:W,get:ot,set:it,setHandle:function(t,e,r,n){if(!(0<=(t=Number(t))&&t<g.length))throw new Error("noUiSlider: invalid handle number, got: "+t);et(t,nt(e,t),!0,!0,n),$("update",t),r&&$("set",t)},reset:function(t){it(f.start,t)},disable:function(t){null!=t?(l[t].setAttribute("disabled",""),l[t].handle.removeAttribute("tabindex")):(d.setAttribute("disabled",""),l.forEach(function(t){t.handle.removeAttribute("tabindex")}))},enable:function(t){null!=t?(l[t].removeAttribute("disabled"),l[t].handle.setAttribute("tabindex","0")):(d.removeAttribute("disabled"),l.forEach(function(t){t.removeAttribute("disabled"),t.handle.setAttribute("tabindex","0")}))},__moveHandles:function(t,e,r){K(t,e,m,r)},options:o,updateOptions:function(e,t){var r=ot(),n=["margin","limit","padding","range","animate","snap","step","format","pips","tooltips","connect"];n.forEach(function(t){void 0!==e[t]&&(o[t]=e[t])});var i=yt(o);n.forEach(function(t){void 0!==e[t]&&(f[t]=i[t])}),S=i.spectrum,f.margin=i.margin,f.limit=i.limit,f.padding=i.padding,f.pips?T(f.pips):L(),(f.tooltips?M:k)(),m=[],it(pt(e.start)?e.start:r,t),e.connect&&at()},target:d,removePips:L,removeTooltips:k,getPositions:function(){return m.slice()},getTooltips:function(){return a},getOrigins:function(){return l},pips:T};return lt}function j(t,e){if(!t||!t.nodeName)throw new Error("noUiSlider: create requires a single element, got: "+t);if(t.noUiSlider)throw new Error("noUiSlider: Slider was already initialized.");e=T(t,yt(e),e);return t.noUiSlider=e}var z={__spectrum:u,cssClasses:p,create:j};ut.create=j,ut.cssClasses=p,ut.default=z,Object.defineProperty(ut,"__esModule",{value:!0})});
/*!
 * lightgallery | 2.8.0-beta.1 | November 27th 2023
 * http://www.lightgalleryjs.com/
 * Copyright (c) 2020 Sachin Neravath;
 * @license GPLv3
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.lgThumbnail = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var thumbnailsSettings = {
        thumbnail: true,
        animateThumb: true,
        currentPagerPosition: 'middle',
        alignThumbnails: 'middle',
        thumbWidth: 100,
        thumbHeight: '80px',
        thumbMargin: 5,
        appendThumbnailsTo: '.lg-components',
        toggleThumb: false,
        enableThumbDrag: true,
        enableThumbSwipe: true,
        thumbnailSwipeThreshold: 10,
        loadYouTubeThumbnail: true,
        youTubeThumbSize: 1,
        thumbnailPluginStrings: {
            toggleThumbnails: 'Toggle thumbnails',
        },
    };

    /**
     * List of lightGallery events
     * All events should be documented here
     * Below interfaces are used to build the website documentations
     * */
    var lGEvents = {
        afterAppendSlide: 'lgAfterAppendSlide',
        init: 'lgInit',
        hasVideo: 'lgHasVideo',
        containerResize: 'lgContainerResize',
        updateSlides: 'lgUpdateSlides',
        afterAppendSubHtml: 'lgAfterAppendSubHtml',
        beforeOpen: 'lgBeforeOpen',
        afterOpen: 'lgAfterOpen',
        slideItemLoad: 'lgSlideItemLoad',
        beforeSlide: 'lgBeforeSlide',
        afterSlide: 'lgAfterSlide',
        posterClick: 'lgPosterClick',
        dragStart: 'lgDragStart',
        dragMove: 'lgDragMove',
        dragEnd: 'lgDragEnd',
        beforeNextSlide: 'lgBeforeNextSlide',
        beforePrevSlide: 'lgBeforePrevSlide',
        beforeClose: 'lgBeforeClose',
        afterClose: 'lgAfterClose',
        rotateLeft: 'lgRotateLeft',
        rotateRight: 'lgRotateRight',
        flipHorizontal: 'lgFlipHorizontal',
        flipVertical: 'lgFlipVertical',
        autoplay: 'lgAutoplay',
        autoplayStart: 'lgAutoplayStart',
        autoplayStop: 'lgAutoplayStop',
    };

    var Thumbnail = /** @class */ (function () {
        function Thumbnail(instance, $LG) {
            this.thumbOuterWidth = 0;
            this.thumbTotalWidth = 0;
            this.translateX = 0;
            this.thumbClickable = false;
            // get lightGallery core plugin instance
            this.core = instance;
            this.$LG = $LG;
            return this;
        }
        Thumbnail.prototype.init = function () {
            // extend module default settings with lightGallery core settings
            this.settings = __assign(__assign({}, thumbnailsSettings), this.core.settings);
            this.thumbOuterWidth = 0;
            this.thumbTotalWidth =
                this.core.galleryItems.length *
                    (this.settings.thumbWidth + this.settings.thumbMargin);
            // Thumbnail animation value
            this.translateX = 0;
            this.setAnimateThumbStyles();
            if (!this.core.settings.allowMediaOverlap) {
                this.settings.toggleThumb = false;
            }
            if (this.settings.thumbnail) {
                this.build();
                if (this.settings.animateThumb) {
                    if (this.settings.enableThumbDrag) {
                        this.enableThumbDrag();
                    }
                    if (this.settings.enableThumbSwipe) {
                        this.enableThumbSwipe();
                    }
                    this.thumbClickable = false;
                }
                else {
                    this.thumbClickable = true;
                }
                this.toggleThumbBar();
                this.thumbKeyPress();
            }
        };
        Thumbnail.prototype.build = function () {
            var _this = this;
            this.setThumbMarkup();
            this.manageActiveClassOnSlideChange();
            this.$lgThumb.first().on('click.lg touchend.lg', function (e) {
                var $target = _this.$LG(e.target);
                if (!$target.hasAttribute('data-lg-item-id')) {
                    return;
                }
                setTimeout(function () {
                    // In IE9 and bellow touch does not support
                    // Go to slide if browser does not support css transitions
                    if (_this.thumbClickable && !_this.core.lgBusy) {
                        var index = parseInt($target.attr('data-lg-item-id'));
                        _this.core.slide(index, false, true, false);
                    }
                }, 50);
            });
            this.core.LGel.on(lGEvents.beforeSlide + ".thumb", function (event) {
                var index = event.detail.index;
                _this.animateThumb(index);
            });
            this.core.LGel.on(lGEvents.beforeOpen + ".thumb", function () {
                _this.thumbOuterWidth = _this.core.outer.get().offsetWidth;
            });
            this.core.LGel.on(lGEvents.updateSlides + ".thumb", function () {
                _this.rebuildThumbnails();
            });
            this.core.LGel.on(lGEvents.containerResize + ".thumb", function () {
                if (!_this.core.lgOpened)
                    return;
                setTimeout(function () {
                    _this.thumbOuterWidth = _this.core.outer.get().offsetWidth;
                    _this.animateThumb(_this.core.index);
                    _this.thumbOuterWidth = _this.core.outer.get().offsetWidth;
                }, 50);
            });
        };
        Thumbnail.prototype.setThumbMarkup = function () {
            var thumbOuterClassNames = 'lg-thumb-outer ';
            if (this.settings.alignThumbnails) {
                thumbOuterClassNames += "lg-thumb-align-" + this.settings.alignThumbnails;
            }
            var html = "<div class=\"" + thumbOuterClassNames + "\">\n        <div class=\"lg-thumb lg-group\">\n        </div>\n        </div>";
            this.core.outer.addClass('lg-has-thumb');
            if (this.settings.appendThumbnailsTo === '.lg-components') {
                this.core.$lgComponents.append(html);
            }
            else {
                this.core.outer.append(html);
            }
            this.$thumbOuter = this.core.outer.find('.lg-thumb-outer').first();
            this.$lgThumb = this.core.outer.find('.lg-thumb').first();
            if (this.settings.animateThumb) {
                this.core.outer
                    .find('.lg-thumb')
                    .css('transition-duration', this.core.settings.speed + 'ms')
                    .css('width', this.thumbTotalWidth + 'px')
                    .css('position', 'relative');
            }
            this.setThumbItemHtml(this.core.galleryItems);
        };
        Thumbnail.prototype.enableThumbDrag = function () {
            var _this = this;
            var thumbDragUtils = {
                cords: {
                    startX: 0,
                    endX: 0,
                },
                isMoved: false,
                newTranslateX: 0,
                startTime: new Date(),
                endTime: new Date(),
                touchMoveTime: 0,
            };
            var isDragging = false;
            this.$thumbOuter.addClass('lg-grab');
            this.core.outer
                .find('.lg-thumb')
                .first()
                .on('mousedown.lg.thumb', function (e) {
                if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
                    // execute only on .lg-object
                    e.preventDefault();
                    thumbDragUtils.cords.startX = e.pageX;
                    thumbDragUtils.startTime = new Date();
                    _this.thumbClickable = false;
                    isDragging = true;
                    // ** Fix for webkit cursor issue https://code.google.com/p/chromium/issues/detail?id=26723
                    _this.core.outer.get().scrollLeft += 1;
                    _this.core.outer.get().scrollLeft -= 1;
                    // *
                    _this.$thumbOuter
                        .removeClass('lg-grab')
                        .addClass('lg-grabbing');
                }
            });
            this.$LG(window).on("mousemove.lg.thumb.global" + this.core.lgId, function (e) {
                if (!_this.core.lgOpened)
                    return;
                if (isDragging) {
                    thumbDragUtils.cords.endX = e.pageX;
                    thumbDragUtils = _this.onThumbTouchMove(thumbDragUtils);
                }
            });
            this.$LG(window).on("mouseup.lg.thumb.global" + this.core.lgId, function () {
                if (!_this.core.lgOpened)
                    return;
                if (thumbDragUtils.isMoved) {
                    thumbDragUtils = _this.onThumbTouchEnd(thumbDragUtils);
                }
                else {
                    _this.thumbClickable = true;
                }
                if (isDragging) {
                    isDragging = false;
                    _this.$thumbOuter.removeClass('lg-grabbing').addClass('lg-grab');
                }
            });
        };
        Thumbnail.prototype.enableThumbSwipe = function () {
            var _this = this;
            var thumbDragUtils = {
                cords: {
                    startX: 0,
                    endX: 0,
                },
                isMoved: false,
                newTranslateX: 0,
                startTime: new Date(),
                endTime: new Date(),
                touchMoveTime: 0,
            };
            this.$lgThumb.on('touchstart.lg', function (e) {
                if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
                    e.preventDefault();
                    thumbDragUtils.cords.startX = e.targetTouches[0].pageX;
                    _this.thumbClickable = false;
                    thumbDragUtils.startTime = new Date();
                }
            });
            this.$lgThumb.on('touchmove.lg', function (e) {
                if (_this.thumbTotalWidth > _this.thumbOuterWidth) {
                    e.preventDefault();
                    thumbDragUtils.cords.endX = e.targetTouches[0].pageX;
                    thumbDragUtils = _this.onThumbTouchMove(thumbDragUtils);
                }
            });
            this.$lgThumb.on('touchend.lg', function () {
                if (thumbDragUtils.isMoved) {
                    thumbDragUtils = _this.onThumbTouchEnd(thumbDragUtils);
                }
                else {
                    _this.thumbClickable = true;
                }
            });
        };
        // Rebuild thumbnails
        Thumbnail.prototype.rebuildThumbnails = function () {
            var _this = this;
            // Remove transitions
            this.$thumbOuter.addClass('lg-rebuilding-thumbnails');
            setTimeout(function () {
                _this.thumbTotalWidth =
                    _this.core.galleryItems.length *
                        (_this.settings.thumbWidth + _this.settings.thumbMargin);
                _this.$lgThumb.css('width', _this.thumbTotalWidth + 'px');
                _this.$lgThumb.empty();
                _this.setThumbItemHtml(_this.core.galleryItems);
                _this.animateThumb(_this.core.index);
            }, 50);
            setTimeout(function () {
                _this.$thumbOuter.removeClass('lg-rebuilding-thumbnails');
            }, 200);
        };
        // @ts-check
        Thumbnail.prototype.setTranslate = function (value) {
            this.$lgThumb.css('transform', 'translate3d(-' + value + 'px, 0px, 0px)');
        };
        Thumbnail.prototype.getPossibleTransformX = function (left) {
            if (left > this.thumbTotalWidth - this.thumbOuterWidth) {
                left = this.thumbTotalWidth - this.thumbOuterWidth;
            }
            if (left < 0) {
                left = 0;
            }
            return left;
        };
        Thumbnail.prototype.animateThumb = function (index) {
            this.$lgThumb.css('transition-duration', this.core.settings.speed + 'ms');
            if (this.settings.animateThumb) {
                var position = 0;
                switch (this.settings.currentPagerPosition) {
                    case 'left':
                        position = 0;
                        break;
                    case 'middle':
                        position =
                            this.thumbOuterWidth / 2 - this.settings.thumbWidth / 2;
                        break;
                    case 'right':
                        position = this.thumbOuterWidth - this.settings.thumbWidth;
                }
                this.translateX =
                    (this.settings.thumbWidth + this.settings.thumbMargin) * index -
                        1 -
                        position;
                if (this.translateX > this.thumbTotalWidth - this.thumbOuterWidth) {
                    this.translateX = this.thumbTotalWidth - this.thumbOuterWidth;
                }
                if (this.translateX < 0) {
                    this.translateX = 0;
                }
                this.setTranslate(this.translateX);
            }
        };
        Thumbnail.prototype.onThumbTouchMove = function (thumbDragUtils) {
            thumbDragUtils.newTranslateX = this.translateX;
            thumbDragUtils.isMoved = true;
            thumbDragUtils.touchMoveTime = new Date().valueOf();
            thumbDragUtils.newTranslateX -=
                thumbDragUtils.cords.endX - thumbDragUtils.cords.startX;
            thumbDragUtils.newTranslateX = this.getPossibleTransformX(thumbDragUtils.newTranslateX);
            // move current slide
            this.setTranslate(thumbDragUtils.newTranslateX);
            this.$thumbOuter.addClass('lg-dragging');
            return thumbDragUtils;
        };
        Thumbnail.prototype.onThumbTouchEnd = function (thumbDragUtils) {
            thumbDragUtils.isMoved = false;
            thumbDragUtils.endTime = new Date();
            this.$thumbOuter.removeClass('lg-dragging');
            var touchDuration = thumbDragUtils.endTime.valueOf() -
                thumbDragUtils.startTime.valueOf();
            var distanceXnew = thumbDragUtils.cords.endX - thumbDragUtils.cords.startX;
            var speedX = Math.abs(distanceXnew) / touchDuration;
            // Some magical numbers
            // Can be improved
            if (speedX > 0.15 &&
                thumbDragUtils.endTime.valueOf() - thumbDragUtils.touchMoveTime < 30) {
                speedX += 1;
                if (speedX > 2) {
                    speedX += 1;
                }
                speedX =
                    speedX +
                        speedX * (Math.abs(distanceXnew) / this.thumbOuterWidth);
                this.$lgThumb.css('transition-duration', Math.min(speedX - 1, 2) + 'settings');
                distanceXnew = distanceXnew * speedX;
                this.translateX = this.getPossibleTransformX(this.translateX - distanceXnew);
                this.setTranslate(this.translateX);
            }
            else {
                this.translateX = thumbDragUtils.newTranslateX;
            }
            if (Math.abs(thumbDragUtils.cords.endX - thumbDragUtils.cords.startX) <
                this.settings.thumbnailSwipeThreshold) {
                this.thumbClickable = true;
            }
            return thumbDragUtils;
        };
        Thumbnail.prototype.getThumbHtml = function (thumb, index, alt) {
            var slideVideoInfo = this.core.galleryItems[index].__slideVideoInfo || {};
            var thumbImg;
            if (slideVideoInfo.youtube) {
                if (this.settings.loadYouTubeThumbnail) {
                    thumbImg =
                        '//img.youtube.com/vi/' +
                            slideVideoInfo.youtube[1] +
                            '/' +
                            this.settings.youTubeThumbSize +
                            '.jpg';
                }
                else {
                    thumbImg = thumb;
                }
            }
            else {
                thumbImg = thumb;
            }
            var altAttr = alt ? 'alt="' + alt + '"' : '';
            return "<div data-lg-item-id=\"" + index + "\" class=\"lg-thumb-item " + (index === this.core.index ? ' active' : '') + "\"\n        style=\"width:" + this.settings.thumbWidth + "px; height: " + this.settings.thumbHeight + ";\n            margin-right: " + this.settings.thumbMargin + "px;\">\n            <img " + altAttr + " data-lg-item-id=\"" + index + "\" src=\"" + thumbImg + "\" />\n        </div>";
        };
        Thumbnail.prototype.getThumbItemHtml = function (items) {
            var thumbList = '';
            for (var i = 0; i < items.length; i++) {
                thumbList += this.getThumbHtml(items[i].thumb, i, items[i].alt);
            }
            return thumbList;
        };
        Thumbnail.prototype.setThumbItemHtml = function (items) {
            var thumbList = this.getThumbItemHtml(items);
            this.$lgThumb.html(thumbList);
        };
        Thumbnail.prototype.setAnimateThumbStyles = function () {
            if (this.settings.animateThumb) {
                this.core.outer.addClass('lg-animate-thumb');
            }
        };
        // Manage thumbnail active calss
        Thumbnail.prototype.manageActiveClassOnSlideChange = function () {
            var _this = this;
            // manage active class for thumbnail
            this.core.LGel.on(lGEvents.beforeSlide + ".thumb", function (event) {
                var $thumb = _this.core.outer.find('.lg-thumb-item');
                var index = event.detail.index;
                $thumb.removeClass('active');
                $thumb.eq(index).addClass('active');
            });
        };
        // Toggle thumbnail bar
        Thumbnail.prototype.toggleThumbBar = function () {
            var _this = this;
            if (this.settings.toggleThumb) {
                this.core.outer.addClass('lg-can-toggle');
                this.core.$toolbar.append('<button type="button" aria-label="' +
                    this.settings.thumbnailPluginStrings['toggleThumbnails'] +
                    '" class="lg-toggle-thumb lg-icon"></button>');
                this.core.outer
                    .find('.lg-toggle-thumb')
                    .first()
                    .on('click.lg', function () {
                    _this.core.outer.toggleClass('lg-components-open');
                });
            }
        };
        Thumbnail.prototype.thumbKeyPress = function () {
            var _this = this;
            this.$LG(window).on("keydown.lg.thumb.global" + this.core.lgId, function (e) {
                if (!_this.core.lgOpened || !_this.settings.toggleThumb)
                    return;
                if (e.keyCode === 38) {
                    e.preventDefault();
                    _this.core.outer.addClass('lg-components-open');
                }
                else if (e.keyCode === 40) {
                    e.preventDefault();
                    _this.core.outer.removeClass('lg-components-open');
                }
            });
        };
        Thumbnail.prototype.destroy = function () {
            if (this.settings.thumbnail) {
                this.$LG(window).off(".lg.thumb.global" + this.core.lgId);
                this.core.LGel.off('.lg.thumb');
                this.core.LGel.off('.thumb');
                this.$thumbOuter.remove();
                this.core.outer.removeClass('lg-has-thumb');
            }
        };
        return Thumbnail;
    }());

    return Thumbnail;

})));
//# sourceMappingURL=lg-thumbnail.umd.js.map
;
/*!
 * lightgallery | 2.8.0-beta.1 | November 27th 2023
 * http://www.lightgalleryjs.com/
 * Copyright (c) 2020 Sachin Neravath;
 * @license GPLv3
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.lgZoom = factory());
}(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var zoomSettings = {
        scale: 1,
        zoom: true,
        infiniteZoom: true,
        actualSize: true,
        showZoomInOutIcons: false,
        actualSizeIcons: {
            zoomIn: 'lg-zoom-in',
            zoomOut: 'lg-zoom-out',
        },
        enableZoomAfter: 300,
        zoomPluginStrings: {
            zoomIn: 'Zoom in',
            zoomOut: 'Zoom out',
            viewActualSize: 'View actual size',
        },
    };

    /**
     * List of lightGallery events
     * All events should be documented here
     * Below interfaces are used to build the website documentations
     * */
    var lGEvents = {
        afterAppendSlide: 'lgAfterAppendSlide',
        init: 'lgInit',
        hasVideo: 'lgHasVideo',
        containerResize: 'lgContainerResize',
        updateSlides: 'lgUpdateSlides',
        afterAppendSubHtml: 'lgAfterAppendSubHtml',
        beforeOpen: 'lgBeforeOpen',
        afterOpen: 'lgAfterOpen',
        slideItemLoad: 'lgSlideItemLoad',
        beforeSlide: 'lgBeforeSlide',
        afterSlide: 'lgAfterSlide',
        posterClick: 'lgPosterClick',
        dragStart: 'lgDragStart',
        dragMove: 'lgDragMove',
        dragEnd: 'lgDragEnd',
        beforeNextSlide: 'lgBeforeNextSlide',
        beforePrevSlide: 'lgBeforePrevSlide',
        beforeClose: 'lgBeforeClose',
        afterClose: 'lgAfterClose',
        rotateLeft: 'lgRotateLeft',
        rotateRight: 'lgRotateRight',
        flipHorizontal: 'lgFlipHorizontal',
        flipVertical: 'lgFlipVertical',
        autoplay: 'lgAutoplay',
        autoplayStart: 'lgAutoplayStart',
        autoplayStop: 'lgAutoplayStop',
    };

    var ZOOM_TRANSITION_DURATION = 500;
    var Zoom = /** @class */ (function () {
        function Zoom(instance, $LG) {
            // get lightGallery core plugin instance
            this.core = instance;
            this.$LG = $LG;
            this.settings = __assign(__assign({}, zoomSettings), this.core.settings);
            return this;
        }
        // Append Zoom controls. Actual size, Zoom-in, Zoom-out
        Zoom.prototype.buildTemplates = function () {
            var zoomIcons = this.settings.showZoomInOutIcons
                ? "<button id=\"" + this.core.getIdName('lg-zoom-in') + "\" type=\"button\" aria-label=\"" + this.settings.zoomPluginStrings['zoomIn'] + "\" class=\"lg-zoom-in lg-icon\"></button><button id=\"" + this.core.getIdName('lg-zoom-out') + "\" type=\"button\" aria-label=\"" + this.settings.zoomPluginStrings['zoomIn'] + "\" class=\"lg-zoom-out lg-icon\"></button>"
                : '';
            if (this.settings.actualSize) {
                zoomIcons += "<button id=\"" + this.core.getIdName('lg-actual-size') + "\" type=\"button\" aria-label=\"" + this.settings.zoomPluginStrings['viewActualSize'] + "\" class=\"" + this.settings.actualSizeIcons.zoomIn + " lg-icon\"></button>";
            }
            this.core.outer.addClass('lg-use-transition-for-zoom');
            this.core.$toolbar.first().append(zoomIcons);
        };
        /**
         * @desc Enable zoom option only once the image is completely loaded
         * If zoomFromOrigin is true, Zoom is enabled once the dummy image has been inserted
         *
         * Zoom styles are defined under lg-zoomable CSS class.
         */
        Zoom.prototype.enableZoom = function (event) {
            var _this = this;
            // delay will be 0 except first time
            var _speed = this.settings.enableZoomAfter + event.detail.delay;
            // set _speed value 0 if gallery opened from direct url and if it is first slide
            if (this.$LG('body').first().hasClass('lg-from-hash') &&
                event.detail.delay) {
                // will execute only once
                _speed = 0;
            }
            else {
                // Remove lg-from-hash to enable starting animation.
                this.$LG('body').first().removeClass('lg-from-hash');
            }
            this.zoomableTimeout = setTimeout(function () {
                if (!_this.isImageSlide(_this.core.index)) {
                    return;
                }
                _this.core.getSlideItem(event.detail.index).addClass('lg-zoomable');
                if (event.detail.index === _this.core.index) {
                    _this.setZoomEssentials();
                }
            }, _speed + 30);
        };
        Zoom.prototype.enableZoomOnSlideItemLoad = function () {
            // Add zoomable class
            this.core.LGel.on(lGEvents.slideItemLoad + ".zoom", this.enableZoom.bind(this));
        };
        Zoom.prototype.getDragCords = function (e) {
            return {
                x: e.pageX,
                y: e.pageY,
            };
        };
        Zoom.prototype.getSwipeCords = function (e) {
            var x = e.touches[0].pageX;
            var y = e.touches[0].pageY;
            return {
                x: x,
                y: y,
            };
        };
        Zoom.prototype.getDragAllowedAxises = function (scale, scaleDiff) {
            var $image = this.core
                .getSlideItem(this.core.index)
                .find('.lg-image')
                .first()
                .get();
            var height = 0;
            var width = 0;
            var rect = $image.getBoundingClientRect();
            if (scale) {
                height = $image.offsetHeight * scale;
                width = $image.offsetWidth * scale;
            }
            else if (scaleDiff) {
                height = rect.height + scaleDiff * rect.height;
                width = rect.width + scaleDiff * rect.width;
            }
            else {
                height = rect.height;
                width = rect.width;
            }
            var allowY = height > this.containerRect.height;
            var allowX = width > this.containerRect.width;
            return {
                allowX: allowX,
                allowY: allowY,
            };
        };
        Zoom.prototype.setZoomEssentials = function () {
            this.containerRect = this.core.$content.get().getBoundingClientRect();
        };
        /**
         * @desc Image zoom
         * Translate the wrap and scale the image to get better user experience
         *
         * @param {String} scale - Zoom decrement/increment value
         */
        Zoom.prototype.zoomImage = function (scale, scaleDiff, reposition, resetToMax) {
            if (Math.abs(scaleDiff) <= 0)
                return;
            var offsetX = this.containerRect.width / 2 + this.containerRect.left;
            var offsetY = this.containerRect.height / 2 +
                this.containerRect.top +
                this.scrollTop;
            var originalX;
            var originalY;
            if (scale === 1) {
                this.positionChanged = false;
            }
            var dragAllowedAxises = this.getDragAllowedAxises(0, scaleDiff);
            var allowY = dragAllowedAxises.allowY, allowX = dragAllowedAxises.allowX;
            if (this.positionChanged) {
                originalX = this.left / (this.scale - scaleDiff);
                originalY = this.top / (this.scale - scaleDiff);
                this.pageX = offsetX - originalX;
                this.pageY = offsetY - originalY;
                this.positionChanged = false;
            }
            var possibleSwipeCords = this.getPossibleSwipeDragCords(scaleDiff);
            var x;
            var y;
            var _x = offsetX - this.pageX;
            var _y = offsetY - this.pageY;
            if (scale - scaleDiff > 1) {
                var scaleVal = (scale - scaleDiff) / Math.abs(scaleDiff);
                _x =
                    (scaleDiff < 0 ? -_x : _x) +
                        this.left * (scaleVal + (scaleDiff < 0 ? -1 : 1));
                _y =
                    (scaleDiff < 0 ? -_y : _y) +
                        this.top * (scaleVal + (scaleDiff < 0 ? -1 : 1));
                x = _x / scaleVal;
                y = _y / scaleVal;
            }
            else {
                var scaleVal = (scale - scaleDiff) * scaleDiff;
                x = _x * scaleVal;
                y = _y * scaleVal;
            }
            if (reposition) {
                if (allowX) {
                    if (this.isBeyondPossibleLeft(x, possibleSwipeCords.minX)) {
                        x = possibleSwipeCords.minX;
                    }
                    else if (this.isBeyondPossibleRight(x, possibleSwipeCords.maxX)) {
                        x = possibleSwipeCords.maxX;
                    }
                }
                else {
                    if (scale > 1) {
                        if (x < possibleSwipeCords.minX) {
                            x = possibleSwipeCords.minX;
                        }
                        else if (x > possibleSwipeCords.maxX) {
                            x = possibleSwipeCords.maxX;
                        }
                    }
                }
                // @todo fix this
                if (allowY) {
                    if (this.isBeyondPossibleTop(y, possibleSwipeCords.minY)) {
                        y = possibleSwipeCords.minY;
                    }
                    else if (this.isBeyondPossibleBottom(y, possibleSwipeCords.maxY)) {
                        y = possibleSwipeCords.maxY;
                    }
                }
                else {
                    // If the translate value based on index of beyond the viewport, utilize the available space to prevent image being cut out
                    if (scale > 1) {
                        //If image goes beyond viewport top, use the minim possible translate value
                        if (y < possibleSwipeCords.minY) {
                            y = possibleSwipeCords.minY;
                        }
                        else if (y > possibleSwipeCords.maxY) {
                            y = possibleSwipeCords.maxY;
                        }
                    }
                }
            }
            this.setZoomStyles({
                x: x,
                y: y,
                scale: scale,
            });
            this.left = x;
            this.top = y;
            if (resetToMax) {
                this.setZoomImageSize();
            }
        };
        Zoom.prototype.resetImageTranslate = function (index) {
            if (!this.isImageSlide(index)) {
                return;
            }
            var $image = this.core.getSlideItem(index).find('.lg-image').first();
            this.imageReset = false;
            $image.removeClass('reset-transition reset-transition-y reset-transition-x');
            this.core.outer.removeClass('lg-actual-size');
            $image.css('width', 'auto').css('height', 'auto');
            setTimeout(function () {
                $image.removeClass('no-transition');
            }, 10);
        };
        Zoom.prototype.setZoomImageSize = function () {
            var _this = this;
            var $image = this.core
                .getSlideItem(this.core.index)
                .find('.lg-image')
                .first();
            setTimeout(function () {
                var actualSizeScale = _this.getCurrentImageActualSizeScale();
                if (_this.scale >= actualSizeScale) {
                    $image.addClass('no-transition');
                    _this.imageReset = true;
                }
            }, ZOOM_TRANSITION_DURATION);
            setTimeout(function () {
                var actualSizeScale = _this.getCurrentImageActualSizeScale();
                if (_this.scale >= actualSizeScale) {
                    var dragAllowedAxises = _this.getDragAllowedAxises(_this.scale);
                    $image
                        .css('width', $image.get().naturalWidth + 'px')
                        .css('height', $image.get().naturalHeight + 'px');
                    _this.core.outer.addClass('lg-actual-size');
                    if (dragAllowedAxises.allowX && dragAllowedAxises.allowY) {
                        $image.addClass('reset-transition');
                    }
                    else if (dragAllowedAxises.allowX &&
                        !dragAllowedAxises.allowY) {
                        $image.addClass('reset-transition-x');
                    }
                    else if (!dragAllowedAxises.allowX &&
                        dragAllowedAxises.allowY) {
                        $image.addClass('reset-transition-y');
                    }
                }
            }, ZOOM_TRANSITION_DURATION + 50);
        };
        /**
         * @desc apply scale3d to image and translate to image wrap
         * @param {style} X,Y and scale
         */
        Zoom.prototype.setZoomStyles = function (style) {
            var $imageWrap = this.core
                .getSlideItem(this.core.index)
                .find('.lg-img-wrap')
                .first();
            var $image = this.core
                .getSlideItem(this.core.index)
                .find('.lg-image')
                .first();
            var $dummyImage = this.core.outer
                .find('.lg-current .lg-dummy-img')
                .first();
            this.scale = style.scale;
            $image.css('transform', 'scale3d(' + style.scale + ', ' + style.scale + ', 1)');
            $dummyImage.css('transform', 'scale3d(' + style.scale + ', ' + style.scale + ', 1)');
            var transform = 'translate3d(' + style.x + 'px, ' + style.y + 'px, 0)';
            $imageWrap.css('transform', transform);
        };
        /**
         * @param index - Index of the current slide
         * @param event - event will be available only if the function is called on clicking/taping the imags
         */
        Zoom.prototype.setActualSize = function (index, event) {
            var _this = this;
            if (this.zoomInProgress) {
                return;
            }
            this.zoomInProgress = true;
            var currentItem = this.core.galleryItems[this.core.index];
            this.resetImageTranslate(index);
            setTimeout(function () {
                // Allow zoom only on image
                if (!currentItem.src ||
                    _this.core.outer.hasClass('lg-first-slide-loading')) {
                    return;
                }
                var scale = _this.getCurrentImageActualSizeScale();
                var prevScale = _this.scale;
                if (_this.core.outer.hasClass('lg-zoomed')) {
                    _this.scale = 1;
                }
                else {
                    _this.scale = _this.getScale(scale);
                }
                _this.setPageCords(event);
                _this.beginZoom(_this.scale);
                _this.zoomImage(_this.scale, _this.scale - prevScale, true, true);
            }, 50);
            setTimeout(function () {
                _this.core.outer.removeClass('lg-grabbing').addClass('lg-grab');
            }, 60);
            setTimeout(function () {
                _this.zoomInProgress = false;
            }, ZOOM_TRANSITION_DURATION + 110);
        };
        Zoom.prototype.getNaturalWidth = function (index) {
            var $image = this.core.getSlideItem(index).find('.lg-image').first();
            var naturalWidth = this.core.galleryItems[index].width;
            return naturalWidth
                ? parseFloat(naturalWidth)
                : $image.get().naturalWidth;
        };
        Zoom.prototype.getActualSizeScale = function (naturalWidth, width) {
            var _scale;
            var scale;
            if (naturalWidth >= width) {
                _scale = naturalWidth / width;
                scale = _scale || 2;
            }
            else {
                scale = 1;
            }
            return scale;
        };
        Zoom.prototype.getCurrentImageActualSizeScale = function () {
            var $image = this.core
                .getSlideItem(this.core.index)
                .find('.lg-image')
                .first();
            var width = $image.get().offsetWidth;
            var naturalWidth = this.getNaturalWidth(this.core.index) || width;
            return this.getActualSizeScale(naturalWidth, width);
        };
        Zoom.prototype.getPageCords = function (event) {
            var cords = {};
            if (event) {
                cords.x = event.pageX || event.touches[0].pageX;
                cords.y = event.pageY || event.touches[0].pageY;
            }
            else {
                var containerRect = this.core.$content
                    .get()
                    .getBoundingClientRect();
                cords.x = containerRect.width / 2 + containerRect.left;
                cords.y =
                    containerRect.height / 2 + this.scrollTop + containerRect.top;
            }
            return cords;
        };
        Zoom.prototype.setPageCords = function (event) {
            var pageCords = this.getPageCords(event);
            this.pageX = pageCords.x;
            this.pageY = pageCords.y;
        };
        Zoom.prototype.manageActualPixelClassNames = function () {
            var $actualSize = this.core.getElementById('lg-actual-size');
            $actualSize
                .removeClass(this.settings.actualSizeIcons.zoomIn)
                .addClass(this.settings.actualSizeIcons.zoomOut);
        };
        // If true, zoomed - in else zoomed out
        Zoom.prototype.beginZoom = function (scale) {
            this.core.outer.removeClass('lg-zoom-drag-transition lg-zoom-dragging');
            if (scale > 1) {
                this.core.outer.addClass('lg-zoomed');
                this.manageActualPixelClassNames();
            }
            else {
                this.resetZoom();
            }
            return scale > 1;
        };
        Zoom.prototype.getScale = function (scale) {
            var actualSizeScale = this.getCurrentImageActualSizeScale();
            if (scale < 1) {
                scale = 1;
            }
            else if (scale > actualSizeScale) {
                scale = actualSizeScale;
            }
            return scale;
        };
        Zoom.prototype.init = function () {
            var _this = this;
            if (!this.settings.zoom) {
                return;
            }
            this.buildTemplates();
            this.enableZoomOnSlideItemLoad();
            var tapped = null;
            this.core.outer.on('dblclick.lg', function (event) {
                if (!_this.$LG(event.target).hasClass('lg-image')) {
                    return;
                }
                _this.setActualSize(_this.core.index, event);
            });
            this.core.outer.on('touchstart.lg', function (event) {
                var $target = _this.$LG(event.target);
                if (event.touches.length === 1 && $target.hasClass('lg-image')) {
                    if (!tapped) {
                        tapped = setTimeout(function () {
                            tapped = null;
                        }, 300);
                    }
                    else {
                        clearTimeout(tapped);
                        tapped = null;
                        event.preventDefault();
                        _this.setActualSize(_this.core.index, event);
                    }
                }
            });
            this.core.LGel.on(lGEvents.containerResize + ".zoom " + lGEvents.rotateRight + ".zoom " + lGEvents.rotateLeft + ".zoom " + lGEvents.flipHorizontal + ".zoom " + lGEvents.flipVertical + ".zoom", function () {
                if (!_this.core.lgOpened ||
                    !_this.isImageSlide(_this.core.index) ||
                    _this.core.touchAction) {
                    return;
                }
                var _LGel = _this.core
                    .getSlideItem(_this.core.index)
                    .find('.lg-img-wrap')
                    .first();
                _this.top = 0;
                _this.left = 0;
                _this.setZoomEssentials();
                _this.setZoomSwipeStyles(_LGel, { x: 0, y: 0 });
                _this.positionChanged = true;
            });
            // Update zoom on resize and orientationchange
            this.$LG(window).on("scroll.lg.zoom.global" + this.core.lgId, function () {
                if (!_this.core.lgOpened)
                    return;
                _this.scrollTop = _this.$LG(window).scrollTop();
            });
            this.core.getElementById('lg-zoom-out').on('click.lg', function () {
                // Allow zoom only on image
                if (!_this.isImageSlide(_this.core.index)) {
                    return;
                }
                var timeout = 0;
                if (_this.imageReset) {
                    _this.resetImageTranslate(_this.core.index);
                    timeout = 50;
                }
                setTimeout(function () {
                    var scale = _this.scale - _this.settings.scale;
                    if (scale < 1) {
                        scale = 1;
                    }
                    _this.beginZoom(scale);
                    _this.zoomImage(scale, -_this.settings.scale, true, !_this.settings.infiniteZoom);
                }, timeout);
            });
            this.core.getElementById('lg-zoom-in').on('click.lg', function () {
                _this.zoomIn();
            });
            this.core.getElementById('lg-actual-size').on('click.lg', function () {
                _this.setActualSize(_this.core.index);
            });
            this.core.LGel.on(lGEvents.beforeOpen + ".zoom", function () {
                _this.core.outer.find('.lg-item').removeClass('lg-zoomable');
            });
            this.core.LGel.on(lGEvents.afterOpen + ".zoom", function () {
                _this.scrollTop = _this.$LG(window).scrollTop();
                // Set the initial value center
                _this.pageX = _this.core.outer.width() / 2;
                _this.pageY = _this.core.outer.height() / 2 + _this.scrollTop;
                _this.scale = 1;
            });
            // Reset zoom on slide change
            this.core.LGel.on(lGEvents.afterSlide + ".zoom", function (event) {
                var prevIndex = event.detail.prevIndex;
                _this.scale = 1;
                _this.positionChanged = false;
                _this.zoomInProgress = false;
                _this.resetZoom(prevIndex);
                _this.resetImageTranslate(prevIndex);
                if (_this.isImageSlide(_this.core.index)) {
                    _this.setZoomEssentials();
                }
            });
            // Drag option after zoom
            this.zoomDrag();
            this.pinchZoom();
            this.zoomSwipe();
            // Store the zoomable timeout value just to clear it while closing
            this.zoomableTimeout = false;
            this.positionChanged = false;
            this.zoomInProgress = false;
        };
        Zoom.prototype.zoomIn = function () {
            // Allow zoom only on image
            if (!this.isImageSlide(this.core.index)) {
                return;
            }
            var scale = this.scale + this.settings.scale;
            if (!this.settings.infiniteZoom) {
                scale = this.getScale(scale);
            }
            this.beginZoom(scale);
            this.zoomImage(scale, Math.min(this.settings.scale, scale - this.scale), true, !this.settings.infiniteZoom);
        };
        // Reset zoom effect
        Zoom.prototype.resetZoom = function (index) {
            this.core.outer.removeClass('lg-zoomed lg-zoom-drag-transition');
            var $actualSize = this.core.getElementById('lg-actual-size');
            var $item = this.core.getSlideItem(index !== undefined ? index : this.core.index);
            $actualSize
                .removeClass(this.settings.actualSizeIcons.zoomOut)
                .addClass(this.settings.actualSizeIcons.zoomIn);
            $item.find('.lg-img-wrap').first().removeAttr('style');
            $item.find('.lg-image').first().removeAttr('style');
            this.scale = 1;
            this.left = 0;
            this.top = 0;
            // Reset pagx pagy values to center
            this.setPageCords();
        };
        Zoom.prototype.getTouchDistance = function (e) {
            return Math.sqrt((e.touches[0].pageX - e.touches[1].pageX) *
                (e.touches[0].pageX - e.touches[1].pageX) +
                (e.touches[0].pageY - e.touches[1].pageY) *
                    (e.touches[0].pageY - e.touches[1].pageY));
        };
        Zoom.prototype.pinchZoom = function () {
            var _this = this;
            var startDist = 0;
            var pinchStarted = false;
            var initScale = 1;
            var prevScale = 0;
            var $item = this.core.getSlideItem(this.core.index);
            this.core.outer.on('touchstart.lg', function (e) {
                $item = _this.core.getSlideItem(_this.core.index);
                if (!_this.isImageSlide(_this.core.index)) {
                    return;
                }
                if (e.touches.length === 2) {
                    e.preventDefault();
                    if (_this.core.outer.hasClass('lg-first-slide-loading')) {
                        return;
                    }
                    initScale = _this.scale || 1;
                    _this.core.outer.removeClass('lg-zoom-drag-transition lg-zoom-dragging');
                    _this.setPageCords(e);
                    _this.resetImageTranslate(_this.core.index);
                    _this.core.touchAction = 'pinch';
                    startDist = _this.getTouchDistance(e);
                }
            });
            this.core.$inner.on('touchmove.lg', function (e) {
                if (e.touches.length === 2 &&
                    _this.core.touchAction === 'pinch' &&
                    (_this.$LG(e.target).hasClass('lg-item') ||
                        $item.get().contains(e.target))) {
                    e.preventDefault();
                    var endDist = _this.getTouchDistance(e);
                    var distance = startDist - endDist;
                    if (!pinchStarted && Math.abs(distance) > 5) {
                        pinchStarted = true;
                    }
                    if (pinchStarted) {
                        prevScale = _this.scale;
                        var _scale = Math.max(1, initScale + -distance * 0.02);
                        _this.scale =
                            Math.round((_scale + Number.EPSILON) * 100) / 100;
                        var diff = _this.scale - prevScale;
                        _this.zoomImage(_this.scale, Math.round((diff + Number.EPSILON) * 100) / 100, false, false);
                    }
                }
            });
            this.core.$inner.on('touchend.lg', function (e) {
                if (_this.core.touchAction === 'pinch' &&
                    (_this.$LG(e.target).hasClass('lg-item') ||
                        $item.get().contains(e.target))) {
                    pinchStarted = false;
                    startDist = 0;
                    if (_this.scale <= 1) {
                        _this.resetZoom();
                    }
                    else {
                        var actualSizeScale = _this.getCurrentImageActualSizeScale();
                        if (_this.scale >= actualSizeScale) {
                            var scaleDiff = actualSizeScale - _this.scale;
                            if (scaleDiff === 0) {
                                scaleDiff = 0.01;
                            }
                            _this.zoomImage(actualSizeScale, scaleDiff, false, true);
                        }
                        _this.manageActualPixelClassNames();
                        _this.core.outer.addClass('lg-zoomed');
                    }
                    _this.core.touchAction = undefined;
                }
            });
        };
        Zoom.prototype.touchendZoom = function (startCoords, endCoords, allowX, allowY, touchDuration) {
            var distanceXnew = endCoords.x - startCoords.x;
            var distanceYnew = endCoords.y - startCoords.y;
            var speedX = Math.abs(distanceXnew) / touchDuration + 1;
            var speedY = Math.abs(distanceYnew) / touchDuration + 1;
            if (speedX > 2) {
                speedX += 1;
            }
            if (speedY > 2) {
                speedY += 1;
            }
            distanceXnew = distanceXnew * speedX;
            distanceYnew = distanceYnew * speedY;
            var _LGel = this.core
                .getSlideItem(this.core.index)
                .find('.lg-img-wrap')
                .first();
            var distance = {};
            distance.x = this.left + distanceXnew;
            distance.y = this.top + distanceYnew;
            var possibleSwipeCords = this.getPossibleSwipeDragCords();
            if (Math.abs(distanceXnew) > 15 || Math.abs(distanceYnew) > 15) {
                if (allowY) {
                    if (this.isBeyondPossibleTop(distance.y, possibleSwipeCords.minY)) {
                        distance.y = possibleSwipeCords.minY;
                    }
                    else if (this.isBeyondPossibleBottom(distance.y, possibleSwipeCords.maxY)) {
                        distance.y = possibleSwipeCords.maxY;
                    }
                }
                if (allowX) {
                    if (this.isBeyondPossibleLeft(distance.x, possibleSwipeCords.minX)) {
                        distance.x = possibleSwipeCords.minX;
                    }
                    else if (this.isBeyondPossibleRight(distance.x, possibleSwipeCords.maxX)) {
                        distance.x = possibleSwipeCords.maxX;
                    }
                }
                if (allowY) {
                    this.top = distance.y;
                }
                else {
                    distance.y = this.top;
                }
                if (allowX) {
                    this.left = distance.x;
                }
                else {
                    distance.x = this.left;
                }
                this.setZoomSwipeStyles(_LGel, distance);
                this.positionChanged = true;
            }
        };
        Zoom.prototype.getZoomSwipeCords = function (startCoords, endCoords, allowX, allowY, possibleSwipeCords) {
            var distance = {};
            if (allowY) {
                distance.y = this.top + (endCoords.y - startCoords.y);
                if (this.isBeyondPossibleTop(distance.y, possibleSwipeCords.minY)) {
                    var diffMinY = possibleSwipeCords.minY - distance.y;
                    distance.y = possibleSwipeCords.minY - diffMinY / 6;
                }
                else if (this.isBeyondPossibleBottom(distance.y, possibleSwipeCords.maxY)) {
                    var diffMaxY = distance.y - possibleSwipeCords.maxY;
                    distance.y = possibleSwipeCords.maxY + diffMaxY / 6;
                }
            }
            else {
                distance.y = this.top;
            }
            if (allowX) {
                distance.x = this.left + (endCoords.x - startCoords.x);
                if (this.isBeyondPossibleLeft(distance.x, possibleSwipeCords.minX)) {
                    var diffMinX = possibleSwipeCords.minX - distance.x;
                    distance.x = possibleSwipeCords.minX - diffMinX / 6;
                }
                else if (this.isBeyondPossibleRight(distance.x, possibleSwipeCords.maxX)) {
                    var difMaxX = distance.x - possibleSwipeCords.maxX;
                    distance.x = possibleSwipeCords.maxX + difMaxX / 6;
                }
            }
            else {
                distance.x = this.left;
            }
            return distance;
        };
        Zoom.prototype.isBeyondPossibleLeft = function (x, minX) {
            return x >= minX;
        };
        Zoom.prototype.isBeyondPossibleRight = function (x, maxX) {
            return x <= maxX;
        };
        Zoom.prototype.isBeyondPossibleTop = function (y, minY) {
            return y >= minY;
        };
        Zoom.prototype.isBeyondPossibleBottom = function (y, maxY) {
            return y <= maxY;
        };
        Zoom.prototype.isImageSlide = function (index) {
            var currentItem = this.core.galleryItems[index];
            return this.core.getSlideType(currentItem) === 'image';
        };
        Zoom.prototype.getPossibleSwipeDragCords = function (scale) {
            var $image = this.core
                .getSlideItem(this.core.index)
                .find('.lg-image')
                .first();
            var bottom = this.core.mediaContainerPosition.bottom;
            var imgRect = $image.get().getBoundingClientRect();
            var imageHeight = imgRect.height;
            var imageWidth = imgRect.width;
            if (scale) {
                imageHeight = imageHeight + scale * imageHeight;
                imageWidth = imageWidth + scale * imageWidth;
            }
            var minY = (imageHeight - this.containerRect.height) / 2;
            var maxY = (this.containerRect.height - imageHeight) / 2 + bottom;
            var minX = (imageWidth - this.containerRect.width) / 2;
            var maxX = (this.containerRect.width - imageWidth) / 2;
            var possibleSwipeCords = {
                minY: minY,
                maxY: maxY,
                minX: minX,
                maxX: maxX,
            };
            return possibleSwipeCords;
        };
        Zoom.prototype.setZoomSwipeStyles = function (LGel, distance) {
            LGel.css('transform', 'translate3d(' + distance.x + 'px, ' + distance.y + 'px, 0)');
        };
        Zoom.prototype.zoomSwipe = function () {
            var _this = this;
            var startCoords = {};
            var endCoords = {};
            var isMoved = false;
            // Allow x direction drag
            var allowX = false;
            // Allow Y direction drag
            var allowY = false;
            var startTime = new Date();
            var endTime = new Date();
            var possibleSwipeCords;
            var _LGel;
            var $item = this.core.getSlideItem(this.core.index);
            this.core.$inner.on('touchstart.lg', function (e) {
                // Allow zoom only on image
                if (!_this.isImageSlide(_this.core.index)) {
                    return;
                }
                $item = _this.core.getSlideItem(_this.core.index);
                if ((_this.$LG(e.target).hasClass('lg-item') ||
                    $item.get().contains(e.target)) &&
                    e.touches.length === 1 &&
                    _this.core.outer.hasClass('lg-zoomed')) {
                    e.preventDefault();
                    startTime = new Date();
                    _this.core.touchAction = 'zoomSwipe';
                    _LGel = _this.core
                        .getSlideItem(_this.core.index)
                        .find('.lg-img-wrap')
                        .first();
                    var dragAllowedAxises = _this.getDragAllowedAxises(0);
                    allowY = dragAllowedAxises.allowY;
                    allowX = dragAllowedAxises.allowX;
                    if (allowX || allowY) {
                        startCoords = _this.getSwipeCords(e);
                    }
                    possibleSwipeCords = _this.getPossibleSwipeDragCords();
                    // reset opacity and transition duration
                    _this.core.outer.addClass('lg-zoom-dragging lg-zoom-drag-transition');
                }
            });
            this.core.$inner.on('touchmove.lg', function (e) {
                if (e.touches.length === 1 &&
                    _this.core.touchAction === 'zoomSwipe' &&
                    (_this.$LG(e.target).hasClass('lg-item') ||
                        $item.get().contains(e.target))) {
                    e.preventDefault();
                    _this.core.touchAction = 'zoomSwipe';
                    endCoords = _this.getSwipeCords(e);
                    var distance = _this.getZoomSwipeCords(startCoords, endCoords, allowX, allowY, possibleSwipeCords);
                    if (Math.abs(endCoords.x - startCoords.x) > 15 ||
                        Math.abs(endCoords.y - startCoords.y) > 15) {
                        isMoved = true;
                        _this.setZoomSwipeStyles(_LGel, distance);
                    }
                }
            });
            this.core.$inner.on('touchend.lg', function (e) {
                if (_this.core.touchAction === 'zoomSwipe' &&
                    (_this.$LG(e.target).hasClass('lg-item') ||
                        $item.get().contains(e.target))) {
                    e.preventDefault();
                    _this.core.touchAction = undefined;
                    _this.core.outer.removeClass('lg-zoom-dragging');
                    if (!isMoved) {
                        return;
                    }
                    isMoved = false;
                    endTime = new Date();
                    var touchDuration = endTime.valueOf() - startTime.valueOf();
                    _this.touchendZoom(startCoords, endCoords, allowX, allowY, touchDuration);
                }
            });
        };
        Zoom.prototype.zoomDrag = function () {
            var _this = this;
            var startCoords = {};
            var endCoords = {};
            var isDragging = false;
            var isMoved = false;
            // Allow x direction drag
            var allowX = false;
            // Allow Y direction drag
            var allowY = false;
            var startTime;
            var endTime;
            var possibleSwipeCords;
            var _LGel;
            this.core.outer.on('mousedown.lg.zoom', function (e) {
                // Allow zoom only on image
                if (!_this.isImageSlide(_this.core.index)) {
                    return;
                }
                var $item = _this.core.getSlideItem(_this.core.index);
                if (_this.$LG(e.target).hasClass('lg-item') ||
                    $item.get().contains(e.target)) {
                    startTime = new Date();
                    _LGel = _this.core
                        .getSlideItem(_this.core.index)
                        .find('.lg-img-wrap')
                        .first();
                    var dragAllowedAxises = _this.getDragAllowedAxises(0);
                    allowY = dragAllowedAxises.allowY;
                    allowX = dragAllowedAxises.allowX;
                    if (_this.core.outer.hasClass('lg-zoomed')) {
                        if (_this.$LG(e.target).hasClass('lg-object') &&
                            (allowX || allowY)) {
                            e.preventDefault();
                            startCoords = _this.getDragCords(e);
                            possibleSwipeCords = _this.getPossibleSwipeDragCords();
                            isDragging = true;
                            _this.core.outer
                                .removeClass('lg-grab')
                                .addClass('lg-grabbing lg-zoom-drag-transition lg-zoom-dragging');
                            // reset opacity and transition duration
                        }
                    }
                }
            });
            this.$LG(window).on("mousemove.lg.zoom.global" + this.core.lgId, function (e) {
                if (isDragging) {
                    isMoved = true;
                    endCoords = _this.getDragCords(e);
                    var distance = _this.getZoomSwipeCords(startCoords, endCoords, allowX, allowY, possibleSwipeCords);
                    _this.setZoomSwipeStyles(_LGel, distance);
                }
            });
            this.$LG(window).on("mouseup.lg.zoom.global" + this.core.lgId, function (e) {
                if (isDragging) {
                    endTime = new Date();
                    isDragging = false;
                    _this.core.outer.removeClass('lg-zoom-dragging');
                    // Fix for chrome mouse move on click
                    if (isMoved &&
                        (startCoords.x !== endCoords.x ||
                            startCoords.y !== endCoords.y)) {
                        endCoords = _this.getDragCords(e);
                        var touchDuration = endTime.valueOf() - startTime.valueOf();
                        _this.touchendZoom(startCoords, endCoords, allowX, allowY, touchDuration);
                    }
                    isMoved = false;
                }
                _this.core.outer.removeClass('lg-grabbing').addClass('lg-grab');
            });
        };
        Zoom.prototype.closeGallery = function () {
            this.resetZoom();
            this.zoomInProgress = false;
        };
        Zoom.prototype.destroy = function () {
            // Unbind all events added by lightGallery zoom plugin
            this.$LG(window).off(".lg.zoom.global" + this.core.lgId);
            this.core.LGel.off('.lg.zoom');
            this.core.LGel.off('.zoom');
            clearTimeout(this.zoomableTimeout);
            this.zoomableTimeout = false;
        };
        return Zoom;
    }());

    return Zoom;

})));
//# sourceMappingURL=lg-zoom.umd.js.map
;
/**
 * lightgallery | 2.8.0-beta.1 | November 27th 2023
 * http://www.lightgalleryjs.com/
 * Copyright (c) 2020 Sachin Neravath;
 * @license GPLv3
 */

!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).lightGallery=e()}(this,(function(){"use strict";var t=function(){return(t=Object.assign||function(t){for(var e,i=1,s=arguments.length;i<s;i++)for(var n in e=arguments[i])Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n]);return t}).apply(this,arguments)};var e="lgAfterAppendSlide",i="lgInit",s="lgHasVideo",n="lgContainerResize",o="lgUpdateSlides",r="lgAfterAppendSubHtml",l="lgBeforeOpen",a="lgAfterOpen",d="lgSlideItemLoad",g="lgBeforeSlide",h="lgAfterSlide",c="lgPosterClick",u="lgDragStart",m="lgDragMove",p="lgDragEnd",f="lgBeforeNextSlide",y="lgBeforePrevSlide",v="lgBeforeClose",b="lgAfterClose",I={mode:"lg-slide",easing:"ease",speed:400,licenseKey:"0000-0000-000-0000",height:"100%",width:"100%",addClass:"",startClass:"lg-start-zoom",backdropDuration:300,container:"",startAnimationDuration:400,zoomFromOrigin:!0,hideBarsDelay:0,showBarsAfter:1e4,slideDelay:0,supportLegacyBrowser:!0,allowMediaOverlap:!1,videoMaxSize:"1280-720",loadYouTubePoster:!0,defaultCaptionHeight:0,ariaLabelledby:"",ariaDescribedby:"",resetScrollPosition:!0,hideScrollbar:!1,closable:!0,swipeToClose:!0,closeOnTap:!0,showCloseIcon:!0,showMaximizeIcon:!1,loop:!0,escKey:!0,keyPress:!0,trapFocus:!0,controls:!0,slideEndAnimation:!0,hideControlOnEnd:!1,mousewheel:!1,getCaptionFromTitleOrAlt:!0,appendSubHtmlTo:".lg-sub-html",subHtmlSelectorRelative:!1,preload:2,numberOfSlideItemsInDom:10,selector:"",selectWithin:"",nextHtml:"",prevHtml:"",index:0,iframeWidth:"100%",iframeHeight:"100%",iframeMaxWidth:"100%",iframeMaxHeight:"100%",download:!0,counter:!0,appendCounterTo:".lg-toolbar",swipeThreshold:50,enableSwipe:!0,enableDrag:!0,dynamic:!1,dynamicEl:[],extraProps:[],exThumbImage:"",isMobile:void 0,mobileSettings:{controls:!1,showCloseIcon:!1,download:!1},plugins:[],strings:{closeGallery:"Close gallery",toggleMaximize:"Toggle maximize",previousSlide:"Previous slide",nextSlide:"Next slide",download:"Download",playVideo:"Play video",mediaLoadingFailed:"Oops... Failed to load content..."}};var C=function(){function t(t){return this.cssVenderPrefixes=["TransitionDuration","TransitionTimingFunction","Transform","Transition"],this.selector=this._getSelector(t),this.firstElement=this._getFirstEl(),this}return t.generateUUID=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(function(t){var e=16*Math.random()|0;return("x"==t?e:3&e|8).toString(16)}))},t.prototype._getSelector=function(t,e){return void 0===e&&(e=document),"string"!=typeof t?t:(e=e||document,"#"===t.substring(0,1)?e.querySelector(t):e.querySelectorAll(t))},t.prototype._each=function(t){return this.selector?(void 0!==this.selector.length?[].forEach.call(this.selector,t):t(this.selector,0),this):this},t.prototype._setCssVendorPrefix=function(t,e,i){var s=e.replace(/-([a-z])/gi,(function(t,e){return e.toUpperCase()}));-1!==this.cssVenderPrefixes.indexOf(s)?(t.style[s.charAt(0).toLowerCase()+s.slice(1)]=i,t.style["webkit"+s]=i,t.style["moz"+s]=i,t.style["ms"+s]=i,t.style["o"+s]=i):t.style[s]=i},t.prototype._getFirstEl=function(){return this.selector&&void 0!==this.selector.length?this.selector[0]:this.selector},t.prototype.isEventMatched=function(t,e){var i=e.split(".");return t.split(".").filter((function(t){return t})).every((function(t){return-1!==i.indexOf(t)}))},t.prototype.attr=function(t,e){return void 0===e?this.firstElement?this.firstElement.getAttribute(t):"":(this._each((function(i){i.setAttribute(t,e)})),this)},t.prototype.find=function(t){return x(this._getSelector(t,this.selector))},t.prototype.first=function(){return this.selector&&void 0!==this.selector.length?x(this.selector[0]):x(this.selector)},t.prototype.eq=function(t){return x(this.selector[t])},t.prototype.parent=function(){return x(this.selector.parentElement)},t.prototype.get=function(){return this._getFirstEl()},t.prototype.removeAttr=function(t){var e=t.split(" ");return this._each((function(t){e.forEach((function(e){return t.removeAttribute(e)}))})),this},t.prototype.wrap=function(t){if(!this.firstElement)return this;var e=document.createElement("div");return e.className=t,this.firstElement.parentNode.insertBefore(e,this.firstElement),this.firstElement.parentNode.removeChild(this.firstElement),e.appendChild(this.firstElement),this},t.prototype.addClass=function(t){return void 0===t&&(t=""),this._each((function(e){t.split(" ").forEach((function(t){t&&e.classList.add(t)}))})),this},t.prototype.removeClass=function(t){return this._each((function(e){t.split(" ").forEach((function(t){t&&e.classList.remove(t)}))})),this},t.prototype.hasClass=function(t){return!!this.firstElement&&this.firstElement.classList.contains(t)},t.prototype.hasAttribute=function(t){return!!this.firstElement&&this.firstElement.hasAttribute(t)},t.prototype.toggleClass=function(t){return this.firstElement?(this.hasClass(t)?this.removeClass(t):this.addClass(t),this):this},t.prototype.css=function(t,e){var i=this;return this._each((function(s){i._setCssVendorPrefix(s,t,e)})),this},t.prototype.on=function(e,i){var s=this;return this.selector?(e.split(" ").forEach((function(e){Array.isArray(t.eventListeners[e])||(t.eventListeners[e]=[]),t.eventListeners[e].push(i),s.selector.addEventListener(e.split(".")[0],i)})),this):this},t.prototype.once=function(t,e){var i=this;return this.on(t,(function(){i.off(t),e(t)})),this},t.prototype.off=function(e){var i=this;return this.selector?(Object.keys(t.eventListeners).forEach((function(s){i.isEventMatched(e,s)&&(t.eventListeners[s].forEach((function(t){i.selector.removeEventListener(s.split(".")[0],t)})),t.eventListeners[s]=[])})),this):this},t.prototype.trigger=function(t,e){if(!this.firstElement)return this;var i=new CustomEvent(t.split(".")[0],{detail:e||null});return this.firstElement.dispatchEvent(i),this},t.prototype.load=function(t){var e=this;return fetch(t).then((function(t){return t.text()})).then((function(t){e.selector.innerHTML=t})),this},t.prototype.html=function(t){return void 0===t?this.firstElement?this.firstElement.innerHTML:"":(this._each((function(e){e.innerHTML=t})),this)},t.prototype.append=function(t){return this._each((function(e){"string"==typeof t?e.insertAdjacentHTML("beforeend",t):e.appendChild(t)})),this},t.prototype.prepend=function(t){return this._each((function(e){e.insertAdjacentHTML("afterbegin",t)})),this},t.prototype.remove=function(){return this._each((function(t){t.parentNode.removeChild(t)})),this},t.prototype.empty=function(){return this._each((function(t){t.innerHTML=""})),this},t.prototype.scrollTop=function(t){return void 0!==t?(document.body.scrollTop=t,document.documentElement.scrollTop=t,this):window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0},t.prototype.scrollLeft=function(t){return void 0!==t?(document.body.scrollLeft=t,document.documentElement.scrollLeft=t,this):window.pageXOffset||document.documentElement.scrollLeft||document.body.scrollLeft||0},t.prototype.offset=function(){if(!this.firstElement)return{left:0,top:0};var t=this.firstElement.getBoundingClientRect(),e=x("body").style().marginLeft;return{left:t.left-parseFloat(e)+this.scrollLeft(),top:t.top+this.scrollTop()}},t.prototype.style=function(){return this.firstElement?this.firstElement.currentStyle||window.getComputedStyle(this.firstElement):{}},t.prototype.width=function(){var t=this.style();return this.firstElement.clientWidth-parseFloat(t.paddingLeft)-parseFloat(t.paddingRight)},t.prototype.height=function(){var t=this.style();return this.firstElement.clientHeight-parseFloat(t.paddingTop)-parseFloat(t.paddingBottom)},t.eventListeners={},t}();function x(t){return function(){if("function"==typeof window.CustomEvent)return!1;window.CustomEvent=function(t,e){e=e||{bubbles:!1,cancelable:!1,detail:null};var i=document.createEvent("CustomEvent");return i.initCustomEvent(t,e.bubbles,e.cancelable,e.detail),i}}(),Element.prototype.matches||(Element.prototype.matches=Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector),new C(t)}var w=["src","sources","subHtml","subHtmlUrl","html","video","poster","slideName","responsive","srcset","sizes","iframe","downloadUrl","download","width","facebookShareUrl","tweetText","iframeTitle","twitterShareUrl","pinterestShareUrl","pinterestText","fbHtml","disqusIdentifier","disqusUrl"];function S(t){return"href"===t?"src":t=(t=(t=t.replace("data-","")).charAt(0).toLowerCase()+t.slice(1)).replace(/-([a-z])/g,(function(t){return t[1].toUpperCase()}))}var T=function(t,e,i,s){void 0===i&&(i=0);var n=x(t).attr("data-lg-size")||s;if(n){var o=n.split(",");if(o[1])for(var r=window.innerWidth,l=0;l<o.length;l++){var a=o[l];if(parseInt(a.split("-")[2],10)>r){n=a;break}l===o.length-1&&(n=a)}var d=n.split("-"),g=parseInt(d[0],10),h=parseInt(d[1],10),c=e.width(),u=e.height()-i,m=Math.min(c,g),p=Math.min(u,h),f=Math.min(m/g,p/h);return{width:g*f,height:h*f}}},E=function(t,e,i,s,n){if(n){var o=x(t).find("img").first();if(o.get()){var r=e.get().getBoundingClientRect(),l=r.width,a=e.height()-(i+s),d=o.width(),g=o.height(),h=o.style(),c=(l-d)/2-o.offset().left+(parseFloat(h.paddingLeft)||0)+(parseFloat(h.borderLeft)||0)+x(window).scrollLeft()+r.left,u=(a-g)/2-o.offset().top+(parseFloat(h.paddingTop)||0)+(parseFloat(h.borderTop)||0)+x(window).scrollTop()+i;return"translate3d("+(c*=-1)+"px, "+(u*=-1)+"px, 0) scale3d("+d/n.width+", "+g/n.height+", 1)"}}},O=function(t,e,i,s,n,o){return'<div class="lg-video-cont lg-has-iframe" style="width:'+t+"; max-width:"+i+"; height: "+e+"; max-height:"+s+'">\n                    <iframe class="lg-object" frameborder="0" '+(o?'title="'+o+'"':"")+' src="'+n+'"  allowfullscreen="true"></iframe>\n                </div>'},D=function(t,e,i,s,n,o){var r="<img "+i+" "+(s?'srcset="'+s+'"':"")+"  "+(n?'sizes="'+n+'"':"")+' class="lg-object lg-image" data-index="'+t+'" src="'+e+'" />',l="";o&&(l=("string"==typeof o?JSON.parse(o):o).map((function(t){var e="";return Object.keys(t).forEach((function(i){e+=" "+i+'="'+t[i]+'"'})),"<source "+e+"></source>"})));return""+l+r},L=function(t){for(var e=[],i=[],s="",n=0;n<t.length;n++){var o=t[n].split(" ");""===o[0]&&o.splice(0,1),i.push(o[0]),e.push(o[1])}for(var r=window.innerWidth,l=0;l<e.length;l++)if(parseInt(e[l],10)>r){s=i[l];break}return s},z=function(t){return!!t&&(!!t.complete&&0!==t.naturalWidth)},M=function(t,e,i,s,n){return'<div class="lg-video-cont '+(n&&n.youtube?"lg-has-youtube":n&&n.vimeo?"lg-has-vimeo":"lg-has-html5")+'" style="'+i+'">\n                <div class="lg-video-play-button">\n                <svg\n                    viewBox="0 0 20 20"\n                    preserveAspectRatio="xMidYMid"\n                    focusable="false"\n                    aria-labelledby="'+s+'"\n                    role="img"\n                    class="lg-video-play-icon"\n                >\n                    <title>'+s+'</title>\n                    <polygon class="lg-video-play-icon-inner" points="1,0 20,10 1,20"></polygon>\n                </svg>\n                <svg class="lg-video-play-icon-bg" viewBox="0 0 50 50" focusable="false">\n                    <circle cx="50%" cy="50%" r="20"></circle></svg>\n                <svg class="lg-video-play-icon-circle" viewBox="0 0 50 50" focusable="false">\n                    <circle cx="50%" cy="50%" r="20"></circle>\n                </svg>\n            </div>\n            '+(e||"")+'\n            <img class="lg-object lg-video-poster" src="'+t+'" />\n        </div>'},G=function(t){var e=t.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');return[].filter.call(e,(function(t){var e=window.getComputedStyle(t);return"none"!==e.display&&"hidden"!==e.visibility}))},k=function(t,e,i,s){var n=[],o=function(){for(var t=0,e=0,i=arguments.length;e<i;e++)t+=arguments[e].length;var s=Array(t),n=0;for(e=0;e<i;e++)for(var o=arguments[e],r=0,l=o.length;r<l;r++,n++)s[n]=o[r];return s}(w,e);return[].forEach.call(t,(function(t){for(var e={},r=0;r<t.attributes.length;r++){var l=t.attributes[r];if(l.specified){var a=S(l.name),d="";o.indexOf(a)>-1&&(d=a),d&&(e[d]=l.value)}}var g=x(t),h=g.find("img").first().attr("alt"),c=g.attr("title"),u=s?g.attr(s):g.find("img").first().attr("src");e.thumb=u,i&&!e.subHtml&&(e.subHtml=c||h||""),e.alt=h||c||"",n.push(e)})),n},A=function(){return/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)},P=function(t,e,i){if(!t)return e?{html5:!0}:void console.error("lightGallery :- data-src is not provided on slide item "+(i+1)+". Please make sure the selector property is properly configured. More info - https://www.lightgalleryjs.com/demos/html-markup/");var s=t.match(/\/\/(?:www\.)?youtu(?:\.be|be\.com|be-nocookie\.com)\/(?:watch\?v=|embed\/)?([a-z0-9\-\_\%]+)([\&|?][\S]*)*/i),n=t.match(/\/\/(?:www\.)?(?:player\.)?vimeo.com\/(?:video\/)?([0-9a-z\-_]+)(.*)?/i),o=t.match(/https?:\/\/(.+)?(wistia\.com|wi\.st)\/(medias|embed)\/([0-9a-z\-_]+)(.*)/);return s?{youtube:s}:n?{vimeo:n}:o?{wistia:o}:void 0},B=0,F=function(){function w(t,e){if(this.lgOpened=!1,this.index=0,this.plugins=[],this.lGalleryOn=!1,this.lgBusy=!1,this.currentItemsInDom=[],this.prevScrollTop=0,this.bodyPaddingRight=0,this.isDummyImageRemoved=!1,this.dragOrSwipeEnabled=!1,this.mediaContainerPosition={top:0,bottom:0},!t)return this;if(B++,this.lgId=B,this.el=t,this.LGel=x(t),this.generateSettings(e),this.buildModules(),this.settings.dynamic&&void 0!==this.settings.dynamicEl&&!Array.isArray(this.settings.dynamicEl))throw"When using dynamic mode, you must also define dynamicEl as an Array.";return this.galleryItems=this.getItems(),this.normalizeSettings(),this.init(),this.validateLicense(),this}return w.prototype.generateSettings=function(e){if(this.settings=t(t({},I),e),this.settings.isMobile&&"function"==typeof this.settings.isMobile?this.settings.isMobile():A()){var i=t(t({},this.settings.mobileSettings),this.settings.mobileSettings);this.settings=t(t({},this.settings),i)}},w.prototype.normalizeSettings=function(){this.settings.slideEndAnimation&&(this.settings.hideControlOnEnd=!1),this.settings.closable||(this.settings.swipeToClose=!1),this.zoomFromOrigin=this.settings.zoomFromOrigin,this.settings.dynamic&&(this.zoomFromOrigin=!1),this.settings.container||(this.settings.container=document.body),this.settings.preload=Math.min(this.settings.preload,this.galleryItems.length)},w.prototype.init=function(){var t=this;this.addSlideVideoInfo(this.galleryItems),this.buildStructure(),this.LGel.trigger(i,{instance:this}),this.settings.keyPress&&this.keyPress(),setTimeout((function(){t.enableDrag(),t.enableSwipe(),t.triggerPosterClick()}),50),this.arrow(),this.settings.mousewheel&&this.mousewheel(),this.settings.dynamic||this.openGalleryOnItemClick()},w.prototype.openGalleryOnItemClick=function(){for(var t=this,e=function(e){var s=i.items[e],n=x(s),o=C.generateUUID();n.attr("data-lg-id",o).on("click.lgcustom-item-"+o,(function(i){i.preventDefault();var n=t.settings.index||e;t.openGallery(n,s)}))},i=this,s=0;s<this.items.length;s++)e(s)},w.prototype.buildModules=function(){var t=this;this.settings.plugins.forEach((function(e){t.plugins.push(new e(t,x))}))},w.prototype.validateLicense=function(){this.settings.licenseKey?"0000-0000-000-0000"===this.settings.licenseKey&&console.warn("lightGallery: "+this.settings.licenseKey+" license key is not valid for production use"):console.error("Please provide a valid license key")},w.prototype.getSlideItem=function(t){return x(this.getSlideItemId(t))},w.prototype.getSlideItemId=function(t){return"#lg-item-"+this.lgId+"-"+t},w.prototype.getIdName=function(t){return t+"-"+this.lgId},w.prototype.getElementById=function(t){return x("#"+this.getIdName(t))},w.prototype.manageSingleSlideClassName=function(){this.galleryItems.length<2?this.outer.addClass("lg-single-item"):this.outer.removeClass("lg-single-item")},w.prototype.buildStructure=function(){var t=this;if(!(this.$container&&this.$container.get())){var e="",i="";this.settings.controls&&(e='<button type="button" id="'+this.getIdName("lg-prev")+'" aria-label="'+this.settings.strings.previousSlide+'" class="lg-prev lg-icon"> '+this.settings.prevHtml+' </button>\n                <button type="button" id="'+this.getIdName("lg-next")+'" aria-label="'+this.settings.strings.nextSlide+'" class="lg-next lg-icon"> '+this.settings.nextHtml+" </button>"),".lg-item"!==this.settings.appendSubHtmlTo&&(i='<div class="lg-sub-html" role="status" aria-live="polite"></div>');var s="";this.settings.allowMediaOverlap&&(s+="lg-media-overlap ");var n=this.settings.ariaLabelledby?'aria-labelledby="'+this.settings.ariaLabelledby+'"':"",o=this.settings.ariaDescribedby?'aria-describedby="'+this.settings.ariaDescribedby+'"':"",r="lg-container "+this.settings.addClass+" "+(document.body!==this.settings.container?"lg-inline":""),l=this.settings.closable&&this.settings.showCloseIcon?'<button type="button" aria-label="'+this.settings.strings.closeGallery+'" id="'+this.getIdName("lg-close")+'" class="lg-close lg-icon"></button>':"",a=this.settings.showMaximizeIcon?'<button type="button" aria-label="'+this.settings.strings.toggleMaximize+'" id="'+this.getIdName("lg-maximize")+'" class="lg-maximize lg-icon"></button>':"",d='\n        <div class="'+r+'" id="'+this.getIdName("lg-container")+'" tabindex="-1" aria-modal="true" '+n+" "+o+' role="dialog"\n        >\n            <div id="'+this.getIdName("lg-backdrop")+'" class="lg-backdrop"></div>\n\n            <div id="'+this.getIdName("lg-outer")+'" class="lg-outer lg-use-css3 lg-css3 lg-hide-items '+s+' ">\n\n              <div id="'+this.getIdName("lg-content")+'" class="lg-content">\n                <div id="'+this.getIdName("lg-inner")+'" class="lg-inner">\n                </div>\n                '+e+'\n              </div>\n                <div id="'+this.getIdName("lg-toolbar")+'" class="lg-toolbar lg-group">\n                    '+a+"\n                    "+l+"\n                    </div>\n                    "+(".lg-outer"===this.settings.appendSubHtmlTo?i:"")+'\n                <div id="'+this.getIdName("lg-components")+'" class="lg-components">\n                    '+(".lg-sub-html"===this.settings.appendSubHtmlTo?i:"")+"\n                </div>\n            </div>\n        </div>\n        ";x(this.settings.container).append(d),document.body!==this.settings.container&&x(this.settings.container).css("position","relative"),this.outer=this.getElementById("lg-outer"),this.$lgComponents=this.getElementById("lg-components"),this.$backdrop=this.getElementById("lg-backdrop"),this.$container=this.getElementById("lg-container"),this.$inner=this.getElementById("lg-inner"),this.$content=this.getElementById("lg-content"),this.$toolbar=this.getElementById("lg-toolbar"),this.$backdrop.css("transition-duration",this.settings.backdropDuration+"ms");var g=this.settings.mode+" ";this.manageSingleSlideClassName(),this.settings.enableDrag&&(g+="lg-grab "),this.outer.addClass(g),this.$inner.css("transition-timing-function",this.settings.easing),this.$inner.css("transition-duration",this.settings.speed+"ms"),this.settings.download&&this.$toolbar.append('<a id="'+this.getIdName("lg-download")+'" target="_blank" rel="noopener" aria-label="'+this.settings.strings.download+'" download class="lg-download lg-icon"></a>'),this.counter(),x(window).on("resize.lg.global"+this.lgId+" orientationchange.lg.global"+this.lgId,(function(){t.refreshOnResize()})),this.hideBars(),this.manageCloseGallery(),this.toggleMaximize(),this.initModules()}},w.prototype.refreshOnResize=function(){if(this.lgOpened){var t=this.galleryItems[this.index].__slideVideoInfo;this.mediaContainerPosition=this.getMediaContainerPosition();var e=this.mediaContainerPosition,i=e.top,s=e.bottom;if(this.currentImageSize=T(this.items[this.index],this.outer,i+s,t&&this.settings.videoMaxSize),t&&this.resizeVideoSlide(this.index,this.currentImageSize),this.zoomFromOrigin&&!this.isDummyImageRemoved){var o=this.getDummyImgStyles(this.currentImageSize);this.outer.find(".lg-current .lg-dummy-img").first().attr("style",o)}this.LGel.trigger(n)}},w.prototype.resizeVideoSlide=function(t,e){var i=this.getVideoContStyle(e);this.getSlideItem(t).find(".lg-video-cont").attr("style",i)},w.prototype.updateSlides=function(t,e){if(this.index>t.length-1&&(this.index=t.length-1),1===t.length&&(this.index=0),t.length){var i=this.galleryItems[e].src;this.galleryItems=t,this.updateControls(),this.$inner.empty(),this.currentItemsInDom=[];var s=0;this.galleryItems.some((function(t,e){return t.src===i&&(s=e,!0)})),this.currentItemsInDom=this.organizeSlideItems(s,-1),this.loadContent(s,!0),this.getSlideItem(s).addClass("lg-current"),this.index=s,this.updateCurrentCounter(s),this.LGel.trigger(o)}else this.closeGallery()},w.prototype.getItems=function(){if(this.items=[],this.settings.dynamic)return this.settings.dynamicEl||[];if("this"===this.settings.selector)this.items.push(this.el);else if(this.settings.selector)if("string"==typeof this.settings.selector)if(this.settings.selectWithin){var t=x(this.settings.selectWithin);this.items=t.find(this.settings.selector).get()}else this.items=this.el.querySelectorAll(this.settings.selector);else this.items=this.settings.selector;else this.items=this.el.children;return k(this.items,this.settings.extraProps,this.settings.getCaptionFromTitleOrAlt,this.settings.exThumbImage)},w.prototype.shouldHideScrollbar=function(){return this.settings.hideScrollbar&&document.body===this.settings.container},w.prototype.hideScrollbar=function(){if(this.shouldHideScrollbar()){this.bodyPaddingRight=parseFloat(x("body").style().paddingRight);var t=document.documentElement.getBoundingClientRect(),e=window.innerWidth-t.width;x(document.body).css("padding-right",e+this.bodyPaddingRight+"px"),x(document.body).addClass("lg-overlay-open")}},w.prototype.resetScrollBar=function(){this.shouldHideScrollbar()&&(x(document.body).css("padding-right",this.bodyPaddingRight+"px"),x(document.body).removeClass("lg-overlay-open"))},w.prototype.openGallery=function(t,e){var i=this;if(void 0===t&&(t=this.settings.index),!this.lgOpened){this.lgOpened=!0,this.outer.removeClass("lg-hide-items"),this.hideScrollbar(),this.$container.addClass("lg-show");var s=this.getItemsToBeInsertedToDom(t,t);this.currentItemsInDom=s;var n="";s.forEach((function(t){n=n+'<div id="'+t+'" class="lg-item"></div>'})),this.$inner.append(n),this.addHtml(t);var o="";this.mediaContainerPosition=this.getMediaContainerPosition();var r=this.mediaContainerPosition,d=r.top,g=r.bottom;this.settings.allowMediaOverlap||this.setMediaContainerPosition(d,g);var h=this.galleryItems[t].__slideVideoInfo;this.zoomFromOrigin&&e&&(this.currentImageSize=T(e,this.outer,d+g,h&&this.settings.videoMaxSize),o=E(e,this.outer,d,g,this.currentImageSize)),this.zoomFromOrigin&&o||(this.outer.addClass(this.settings.startClass),this.getSlideItem(t).removeClass("lg-complete"));var c=this.settings.zoomFromOrigin?100:this.settings.backdropDuration;setTimeout((function(){i.outer.addClass("lg-components-open")}),c),this.index=t,this.LGel.trigger(l),this.getSlideItem(t).addClass("lg-current"),this.lGalleryOn=!1,this.prevScrollTop=x(window).scrollTop(),setTimeout((function(){if(i.zoomFromOrigin&&o){var e=i.getSlideItem(t);e.css("transform",o),setTimeout((function(){e.addClass("lg-start-progress lg-start-end-progress").css("transition-duration",i.settings.startAnimationDuration+"ms"),i.outer.addClass("lg-zoom-from-image")})),setTimeout((function(){e.css("transform","translate3d(0, 0, 0)")}),100)}setTimeout((function(){i.$backdrop.addClass("in"),i.$container.addClass("lg-show-in")}),10),setTimeout((function(){i.settings.trapFocus&&document.body===i.settings.container&&i.trapFocus()}),i.settings.backdropDuration+50),i.zoomFromOrigin&&o||setTimeout((function(){i.outer.addClass("lg-visible")}),i.settings.backdropDuration),i.slide(t,!1,!1,!1),i.LGel.trigger(a)})),document.body===this.settings.container&&x("html").addClass("lg-on")}},w.prototype.getMediaContainerPosition=function(){if(this.settings.allowMediaOverlap)return{top:0,bottom:0};var t=this.$toolbar.get().clientHeight||0,e=this.outer.find(".lg-components .lg-sub-html").get(),i=this.settings.defaultCaptionHeight||e&&e.clientHeight||0,s=this.outer.find(".lg-thumb-outer").get();return{top:t,bottom:(s?s.clientHeight:0)+i}},w.prototype.setMediaContainerPosition=function(t,e){void 0===t&&(t=0),void 0===e&&(e=0),this.$content.css("top",t+"px").css("bottom",e+"px")},w.prototype.hideBars=function(){var t=this;setTimeout((function(){t.outer.removeClass("lg-hide-items"),t.settings.hideBarsDelay>0&&(t.outer.on("mousemove.lg click.lg touchstart.lg",(function(){t.outer.removeClass("lg-hide-items"),clearTimeout(t.hideBarTimeout),t.hideBarTimeout=setTimeout((function(){t.outer.addClass("lg-hide-items")}),t.settings.hideBarsDelay)})),t.outer.trigger("mousemove.lg"))}),this.settings.showBarsAfter)},w.prototype.initPictureFill=function(t){if(this.settings.supportLegacyBrowser)try{picturefill({elements:[t.get()]})}catch(t){console.warn("lightGallery :- If you want srcset or picture tag to be supported for older browser please include picturefil javascript library in your document.")}},w.prototype.counter=function(){if(this.settings.counter){var t='<div class="lg-counter" role="status" aria-live="polite">\n                <span id="'+this.getIdName("lg-counter-current")+'" class="lg-counter-current">'+(this.index+1)+' </span> /\n                <span id="'+this.getIdName("lg-counter-all")+'" class="lg-counter-all">'+this.galleryItems.length+" </span></div>";this.outer.find(this.settings.appendCounterTo).append(t)}},w.prototype.addHtml=function(t){var e,i;if(this.galleryItems[t].subHtmlUrl?i=this.galleryItems[t].subHtmlUrl:e=this.galleryItems[t].subHtml,!i)if(e){var s=e.substring(0,1);"."!==s&&"#"!==s||(e=this.settings.subHtmlSelectorRelative&&!this.settings.dynamic?x(this.items).eq(t).find(e).first().html():x(e).first().html())}else e="";if(".lg-item"!==this.settings.appendSubHtmlTo)i?this.outer.find(".lg-sub-html").load(i):this.outer.find(".lg-sub-html").html(e);else{var n=x(this.getSlideItemId(t));i?n.load(i):n.append('<div class="lg-sub-html">'+e+"</div>")}null!=e&&(""===e?this.outer.find(this.settings.appendSubHtmlTo).addClass("lg-empty-html"):this.outer.find(this.settings.appendSubHtmlTo).removeClass("lg-empty-html")),this.LGel.trigger(r,{index:t})},w.prototype.preload=function(t){for(var e=1;e<=this.settings.preload&&!(e>=this.galleryItems.length-t);e++)this.loadContent(t+e,!1);for(var i=1;i<=this.settings.preload&&!(t-i<0);i++)this.loadContent(t-i,!1)},w.prototype.getDummyImgStyles=function(t){return t?"width:"+t.width+"px;\n                margin-left: -"+t.width/2+"px;\n                margin-top: -"+t.height/2+"px;\n                height:"+t.height+"px":""},w.prototype.getVideoContStyle=function(t){return t?"width:"+t.width+"px;\n                height:"+t.height+"px":""},w.prototype.getDummyImageContent=function(t,e,i){var s;if(this.settings.dynamic||(s=x(this.items).eq(e)),s){var n=void 0;if(!(n=this.settings.exThumbImage?s.attr(this.settings.exThumbImage):s.find("img").first().attr("src")))return"";var o="<img "+i+' style="'+this.getDummyImgStyles(this.currentImageSize)+'" class="lg-dummy-img" src="'+n+'" />';return t.addClass("lg-first-slide"),this.outer.addClass("lg-first-slide-loading"),o}return""},w.prototype.setImgMarkup=function(t,e,i){var s=this.galleryItems[i],n=s.alt,o=s.srcset,r=s.sizes,l=s.sources,a=n?'alt="'+n+'"':"",d='<picture class="lg-img-wrap"> '+(this.isFirstSlideWithZoomAnimation()?this.getDummyImageContent(e,i,a):D(i,t,a,o,r,l))+"</picture>";e.prepend(d)},w.prototype.onSlideObjectLoad=function(t,e,i,s){var n=t.find(".lg-object").first();z(n.get())||e?i():(n.on("load.lg error.lg",(function(){i&&i()})),n.on("error.lg",(function(){s&&s()})))},w.prototype.onLgObjectLoad=function(t,e,i,s,n,o){var r=this;this.onSlideObjectLoad(t,o,(function(){r.triggerSlideItemLoad(t,e,i,s,n)}),(function(){t.addClass("lg-complete lg-complete_"),t.html('<span class="lg-error-msg">'+r.settings.strings.mediaLoadingFailed+"</span>")}))},w.prototype.triggerSlideItemLoad=function(t,e,i,s,n){var o=this,r=this.galleryItems[e],l=n&&"video"===this.getSlideType(r)&&!r.poster?s:0;setTimeout((function(){t.addClass("lg-complete lg-complete_"),o.LGel.trigger(d,{index:e,delay:i||0,isFirstSlide:n})}),l)},w.prototype.isFirstSlideWithZoomAnimation=function(){return!(this.lGalleryOn||!this.zoomFromOrigin||!this.currentImageSize)},w.prototype.addSlideVideoInfo=function(t){var e=this;t.forEach((function(t,i){t.__slideVideoInfo=P(t.src,!!t.video,i),t.__slideVideoInfo&&e.settings.loadYouTubePoster&&!t.poster&&t.__slideVideoInfo.youtube&&(t.poster="//img.youtube.com/vi/"+t.__slideVideoInfo.youtube[1]+"/maxresdefault.jpg")}))},w.prototype.loadContent=function(t,i){var n=this,o=this.galleryItems[t],r=x(this.getSlideItemId(t)),l=o.poster,a=o.srcset,d=o.sizes,g=o.sources,h=o.src,c=o.video,u=c&&"string"==typeof c?JSON.parse(c):c;if(o.responsive){var m=o.responsive.split(",");h=L(m)||h}var p=o.__slideVideoInfo,f="",y=!!o.iframe,v=!this.lGalleryOn,b=0;if(v&&(b=this.zoomFromOrigin&&this.currentImageSize?this.settings.startAnimationDuration+10:this.settings.backdropDuration+10),!r.hasClass("lg-loaded")){if(p){var I=this.mediaContainerPosition,C=I.top,w=I.bottom,S=T(this.items[t],this.outer,C+w,p&&this.settings.videoMaxSize);f=this.getVideoContStyle(S)}if(y){var E=O(this.settings.iframeWidth,this.settings.iframeHeight,this.settings.iframeMaxWidth,this.settings.iframeMaxHeight,h,o.iframeTitle);r.prepend(E)}else if(l){var z="";v&&this.zoomFromOrigin&&this.currentImageSize&&(z=this.getDummyImageContent(r,t,""));E=M(l,z||"",f,this.settings.strings.playVideo,p);r.prepend(E)}else if(p){E='<div class="lg-video-cont " style="'+f+'"></div>';r.prepend(E)}else if(this.setImgMarkup(h,r,t),a||g){var G=r.find(".lg-object");this.initPictureFill(G)}(l||p)&&this.LGel.trigger(s,{index:t,src:h,html5Video:u,hasPoster:!!l}),this.LGel.trigger(e,{index:t}),this.lGalleryOn&&".lg-item"===this.settings.appendSubHtmlTo&&this.addHtml(t)}var k=0;b&&!x(document.body).hasClass("lg-from-hash")&&(k=b),this.isFirstSlideWithZoomAnimation()&&(setTimeout((function(){r.removeClass("lg-start-end-progress lg-start-progress").removeAttr("style")}),this.settings.startAnimationDuration+100),r.hasClass("lg-loaded")||setTimeout((function(){if("image"===n.getSlideType(o)){var e=o.alt,i=e?'alt="'+e+'"':"";if(r.find(".lg-img-wrap").append(D(t,h,i,a,d,o.sources)),a||g){var s=r.find(".lg-object");n.initPictureFill(s)}}("image"===n.getSlideType(o)||"video"===n.getSlideType(o)&&l)&&(n.onLgObjectLoad(r,t,b,k,!0,!1),n.onSlideObjectLoad(r,!(!p||!p.html5||l),(function(){n.loadContentOnFirstSlideLoad(t,r,k)}),(function(){n.loadContentOnFirstSlideLoad(t,r,k)})))}),this.settings.startAnimationDuration+100)),r.addClass("lg-loaded"),this.isFirstSlideWithZoomAnimation()&&("video"!==this.getSlideType(o)||l)||this.onLgObjectLoad(r,t,b,k,v,!(!p||!p.html5||l)),this.zoomFromOrigin&&this.currentImageSize||!r.hasClass("lg-complete_")||this.lGalleryOn||setTimeout((function(){r.addClass("lg-complete")}),this.settings.backdropDuration),this.lGalleryOn=!0,!0===i&&(r.hasClass("lg-complete_")?this.preload(t):r.find(".lg-object").first().on("load.lg error.lg",(function(){n.preload(t)})))},w.prototype.loadContentOnFirstSlideLoad=function(t,e,i){var s=this;setTimeout((function(){e.find(".lg-dummy-img").remove(),e.removeClass("lg-first-slide"),s.outer.removeClass("lg-first-slide-loading"),s.isDummyImageRemoved=!0,s.preload(t)}),i+300)},w.prototype.getItemsToBeInsertedToDom=function(t,e,i){var s=this;void 0===i&&(i=0);var n=[],o=Math.max(i,3);o=Math.min(o,this.galleryItems.length);var r="lg-item-"+this.lgId+"-"+e;if(this.galleryItems.length<=3)return this.galleryItems.forEach((function(t,e){n.push("lg-item-"+s.lgId+"-"+e)})),n;if(t<(this.galleryItems.length-1)/2){for(var l=t;l>t-o/2&&l>=0;l--)n.push("lg-item-"+this.lgId+"-"+l);var a=n.length;for(l=0;l<o-a;l++)n.push("lg-item-"+this.lgId+"-"+(t+l+1))}else{for(l=t;l<=this.galleryItems.length-1&&l<t+o/2;l++)n.push("lg-item-"+this.lgId+"-"+l);for(a=n.length,l=0;l<o-a;l++)n.push("lg-item-"+this.lgId+"-"+(t-l-1))}return this.settings.loop&&(t===this.galleryItems.length-1?n.push("lg-item-"+this.lgId+"-0"):0===t&&n.push("lg-item-"+this.lgId+"-"+(this.galleryItems.length-1))),-1===n.indexOf(r)&&n.push("lg-item-"+this.lgId+"-"+e),n},w.prototype.organizeSlideItems=function(t,e){var i=this,s=this.getItemsToBeInsertedToDom(t,e,this.settings.numberOfSlideItemsInDom);return s.forEach((function(t){-1===i.currentItemsInDom.indexOf(t)&&i.$inner.append('<div id="'+t+'" class="lg-item"></div>')})),this.currentItemsInDom.forEach((function(t){-1===s.indexOf(t)&&x("#"+t).remove()})),s},w.prototype.getPreviousSlideIndex=function(){var t=0;try{var e=this.outer.find(".lg-current").first().attr("id");t=parseInt(e.split("-")[3])||0}catch(e){t=0}return t},w.prototype.setDownloadValue=function(t){if(this.settings.download){var e=this.galleryItems[t];if(!1===e.downloadUrl||"false"===e.downloadUrl)this.outer.addClass("lg-hide-download");else{var i=this.getElementById("lg-download");this.outer.removeClass("lg-hide-download"),i.attr("href",e.downloadUrl||e.src),e.download&&i.attr("download",e.download)}}},w.prototype.makeSlideAnimation=function(t,e,i){var s=this;this.lGalleryOn&&i.addClass("lg-slide-progress"),setTimeout((function(){s.outer.addClass("lg-no-trans"),s.outer.find(".lg-item").removeClass("lg-prev-slide lg-next-slide"),"prev"===t?(e.addClass("lg-prev-slide"),i.addClass("lg-next-slide")):(e.addClass("lg-next-slide"),i.addClass("lg-prev-slide")),setTimeout((function(){s.outer.find(".lg-item").removeClass("lg-current"),e.addClass("lg-current"),s.outer.removeClass("lg-no-trans")}),50)}),this.lGalleryOn?this.settings.slideDelay:0)},w.prototype.slide=function(t,e,i,s){var n=this,o=this.getPreviousSlideIndex();if(this.currentItemsInDom=this.organizeSlideItems(t,o),!this.lGalleryOn||o!==t){var r=this.galleryItems.length;if(!this.lgBusy){this.settings.counter&&this.updateCurrentCounter(t);var l=this.getSlideItem(t),a=this.getSlideItem(o),d=this.galleryItems[t],c=d.__slideVideoInfo;if(this.outer.attr("data-lg-slide-type",this.getSlideType(d)),this.setDownloadValue(t),c){var u=this.mediaContainerPosition,m=u.top,p=u.bottom,f=T(this.items[t],this.outer,m+p,c&&this.settings.videoMaxSize);this.resizeVideoSlide(t,f)}if(this.LGel.trigger(g,{prevIndex:o,index:t,fromTouch:!!e,fromThumb:!!i}),this.lgBusy=!0,clearTimeout(this.hideBarTimeout),this.arrowDisable(t),s||(t<o?s="prev":t>o&&(s="next")),e){this.outer.find(".lg-item").removeClass("lg-prev-slide lg-current lg-next-slide");var y=void 0,v=void 0;r>2?(y=t-1,v=t+1,(0===t&&o===r-1||t===r-1&&0===o)&&(v=0,y=r-1)):(y=0,v=1),"prev"===s?this.getSlideItem(v).addClass("lg-next-slide"):this.getSlideItem(y).addClass("lg-prev-slide"),l.addClass("lg-current")}else this.makeSlideAnimation(s,l,a);this.lGalleryOn?setTimeout((function(){n.loadContent(t,!0),".lg-item"!==n.settings.appendSubHtmlTo&&n.addHtml(t)}),this.settings.speed+50+(e?0:this.settings.slideDelay)):this.loadContent(t,!0),setTimeout((function(){n.lgBusy=!1,a.removeClass("lg-slide-progress"),n.LGel.trigger(h,{prevIndex:o,index:t,fromTouch:e,fromThumb:i})}),(this.lGalleryOn?this.settings.speed+100:100)+(e?0:this.settings.slideDelay))}this.index=t}},w.prototype.updateCurrentCounter=function(t){this.getElementById("lg-counter-current").html(t+1+"")},w.prototype.updateCounterTotal=function(){this.getElementById("lg-counter-all").html(this.galleryItems.length+"")},w.prototype.getSlideType=function(t){return t.__slideVideoInfo?"video":t.iframe?"iframe":"image"},w.prototype.touchMove=function(t,e,i){var s=e.pageX-t.pageX,n=e.pageY-t.pageY,o=!1;if(this.swipeDirection?o=!0:Math.abs(s)>15?(this.swipeDirection="horizontal",o=!0):Math.abs(n)>15&&(this.swipeDirection="vertical",o=!0),o){var r=this.getSlideItem(this.index);if("horizontal"===this.swipeDirection){null==i||i.preventDefault(),this.outer.addClass("lg-dragging"),this.setTranslate(r,s,0);var l=r.get().offsetWidth,a=15*l/100-Math.abs(10*s/100);this.setTranslate(this.outer.find(".lg-prev-slide").first(),-l+s-a,0),this.setTranslate(this.outer.find(".lg-next-slide").first(),l+s+a,0)}else if("vertical"===this.swipeDirection&&this.settings.swipeToClose){null==i||i.preventDefault(),this.$container.addClass("lg-dragging-vertical");var d=1-Math.abs(n)/window.innerHeight;this.$backdrop.css("opacity",d);var g=1-Math.abs(n)/(2*window.innerWidth);this.setTranslate(r,0,n,g,g),Math.abs(n)>100&&this.outer.addClass("lg-hide-items").removeClass("lg-components-open")}}},w.prototype.touchEnd=function(t,e,i){var s,n=this;"lg-slide"!==this.settings.mode&&this.outer.addClass("lg-slide"),setTimeout((function(){n.$container.removeClass("lg-dragging-vertical"),n.outer.removeClass("lg-dragging lg-hide-items").addClass("lg-components-open");var o=!0;if("horizontal"===n.swipeDirection){s=t.pageX-e.pageX;var r=Math.abs(t.pageX-e.pageX);s<0&&r>n.settings.swipeThreshold?(n.goToNextSlide(!0),o=!1):s>0&&r>n.settings.swipeThreshold&&(n.goToPrevSlide(!0),o=!1)}else if("vertical"===n.swipeDirection){if(s=Math.abs(t.pageY-e.pageY),n.settings.closable&&n.settings.swipeToClose&&s>100)return void n.closeGallery();n.$backdrop.css("opacity",1)}if(n.outer.find(".lg-item").removeAttr("style"),o&&Math.abs(t.pageX-e.pageX)<5){var l=x(i.target);n.isPosterElement(l)&&n.LGel.trigger(c)}n.swipeDirection=void 0})),setTimeout((function(){n.outer.hasClass("lg-dragging")||"lg-slide"===n.settings.mode||n.outer.removeClass("lg-slide")}),this.settings.speed+100)},w.prototype.enableSwipe=function(){var t=this,e={},i={},s=!1,n=!1;this.settings.enableSwipe&&(this.$inner.on("touchstart.lg",(function(i){t.dragOrSwipeEnabled=!0;var s=t.getSlideItem(t.index);!x(i.target).hasClass("lg-item")&&!s.get().contains(i.target)||t.outer.hasClass("lg-zoomed")||t.lgBusy||1!==i.touches.length||(n=!0,t.touchAction="swipe",t.manageSwipeClass(),e={pageX:i.touches[0].pageX,pageY:i.touches[0].pageY})})),this.$inner.on("touchmove.lg",(function(o){n&&"swipe"===t.touchAction&&1===o.touches.length&&(i={pageX:o.touches[0].pageX,pageY:o.touches[0].pageY},t.touchMove(e,i,o),s=!0)})),this.$inner.on("touchend.lg",(function(o){if("swipe"===t.touchAction){if(s)s=!1,t.touchEnd(i,e,o);else if(n){var r=x(o.target);t.isPosterElement(r)&&t.LGel.trigger(c)}t.touchAction=void 0,n=!1}})))},w.prototype.enableDrag=function(){var t=this,e={},i={},s=!1,n=!1;this.settings.enableDrag&&(this.outer.on("mousedown.lg",(function(i){t.dragOrSwipeEnabled=!0;var n=t.getSlideItem(t.index);(x(i.target).hasClass("lg-item")||n.get().contains(i.target))&&(t.outer.hasClass("lg-zoomed")||t.lgBusy||(i.preventDefault(),t.lgBusy||(t.manageSwipeClass(),e={pageX:i.pageX,pageY:i.pageY},s=!0,t.outer.get().scrollLeft+=1,t.outer.get().scrollLeft-=1,t.outer.removeClass("lg-grab").addClass("lg-grabbing"),t.LGel.trigger(u))))})),x(window).on("mousemove.lg.global"+this.lgId,(function(o){s&&t.lgOpened&&(n=!0,i={pageX:o.pageX,pageY:o.pageY},t.touchMove(e,i),t.LGel.trigger(m))})),x(window).on("mouseup.lg.global"+this.lgId,(function(o){if(t.lgOpened){var r=x(o.target);n?(n=!1,t.touchEnd(i,e,o),t.LGel.trigger(p)):t.isPosterElement(r)&&t.LGel.trigger(c),s&&(s=!1,t.outer.removeClass("lg-grabbing").addClass("lg-grab"))}})))},w.prototype.triggerPosterClick=function(){var t=this;this.$inner.on("click.lg",(function(e){!t.dragOrSwipeEnabled&&t.isPosterElement(x(e.target))&&t.LGel.trigger(c)}))},w.prototype.manageSwipeClass=function(){var t=this.index+1,e=this.index-1;this.settings.loop&&this.galleryItems.length>2&&(0===this.index?e=this.galleryItems.length-1:this.index===this.galleryItems.length-1&&(t=0)),this.outer.find(".lg-item").removeClass("lg-next-slide lg-prev-slide"),e>-1&&this.getSlideItem(e).addClass("lg-prev-slide"),this.getSlideItem(t).addClass("lg-next-slide")},w.prototype.goToNextSlide=function(t){var e=this,i=this.settings.loop;t&&this.galleryItems.length<3&&(i=!1),this.lgBusy||(this.index+1<this.galleryItems.length?(this.index++,this.LGel.trigger(f,{index:this.index}),this.slide(this.index,!!t,!1,"next")):i?(this.index=0,this.LGel.trigger(f,{index:this.index}),this.slide(this.index,!!t,!1,"next")):this.settings.slideEndAnimation&&!t&&(this.outer.addClass("lg-right-end"),setTimeout((function(){e.outer.removeClass("lg-right-end")}),400)))},w.prototype.goToPrevSlide=function(t){var e=this,i=this.settings.loop;t&&this.galleryItems.length<3&&(i=!1),this.lgBusy||(this.index>0?(this.index--,this.LGel.trigger(y,{index:this.index,fromTouch:t}),this.slide(this.index,!!t,!1,"prev")):i?(this.index=this.galleryItems.length-1,this.LGel.trigger(y,{index:this.index,fromTouch:t}),this.slide(this.index,!!t,!1,"prev")):this.settings.slideEndAnimation&&!t&&(this.outer.addClass("lg-left-end"),setTimeout((function(){e.outer.removeClass("lg-left-end")}),400)))},w.prototype.keyPress=function(){var t=this;x(window).on("keydown.lg.global"+this.lgId,(function(e){t.lgOpened&&!0===t.settings.escKey&&27===e.keyCode&&(e.preventDefault(),t.settings.allowMediaOverlap&&t.outer.hasClass("lg-can-toggle")&&t.outer.hasClass("lg-components-open")?t.outer.removeClass("lg-components-open"):t.closeGallery()),t.lgOpened&&t.galleryItems.length>1&&(37===e.keyCode&&(e.preventDefault(),t.goToPrevSlide()),39===e.keyCode&&(e.preventDefault(),t.goToNextSlide()))}))},w.prototype.arrow=function(){var t=this;this.getElementById("lg-prev").on("click.lg",(function(){t.goToPrevSlide()})),this.getElementById("lg-next").on("click.lg",(function(){t.goToNextSlide()}))},w.prototype.arrowDisable=function(t){if(!this.settings.loop&&this.settings.hideControlOnEnd){var e=this.getElementById("lg-prev"),i=this.getElementById("lg-next");t+1===this.galleryItems.length?i.attr("disabled","disabled").addClass("disabled"):i.removeAttr("disabled").removeClass("disabled"),0===t?e.attr("disabled","disabled").addClass("disabled"):e.removeAttr("disabled").removeClass("disabled")}},w.prototype.setTranslate=function(t,e,i,s,n){void 0===s&&(s=1),void 0===n&&(n=1),t.css("transform","translate3d("+e+"px, "+i+"px, 0px) scale3d("+s+", "+n+", 1)")},w.prototype.mousewheel=function(){var t=this,e=0;this.outer.on("wheel.lg",(function(i){if(i.deltaY&&!(t.galleryItems.length<2)){i.preventDefault();var s=(new Date).getTime();s-e<1e3||(e=s,i.deltaY>0?t.goToNextSlide():i.deltaY<0&&t.goToPrevSlide())}}))},w.prototype.isSlideElement=function(t){return t.hasClass("lg-outer")||t.hasClass("lg-item")||t.hasClass("lg-img-wrap")},w.prototype.isPosterElement=function(t){var e=this.getSlideItem(this.index).find(".lg-video-play-button").get();return t.hasClass("lg-video-poster")||t.hasClass("lg-video-play-button")||e&&e.contains(t.get())},w.prototype.toggleMaximize=function(){var t=this;this.getElementById("lg-maximize").on("click.lg",(function(){t.$container.toggleClass("lg-inline"),t.refreshOnResize()}))},w.prototype.invalidateItems=function(){for(var t=0;t<this.items.length;t++){var e=x(this.items[t]);e.off("click.lgcustom-item-"+e.attr("data-lg-id"))}},w.prototype.trapFocus=function(){var t=this;this.$container.get().focus({preventScroll:!0}),x(window).on("keydown.lg.global"+this.lgId,(function(e){if(t.lgOpened&&("Tab"===e.key||9===e.keyCode)){var i=G(t.$container.get()),s=i[0],n=i[i.length-1];e.shiftKey?document.activeElement===s&&(n.focus(),e.preventDefault()):document.activeElement===n&&(s.focus(),e.preventDefault())}}))},w.prototype.manageCloseGallery=function(){var t=this;if(this.settings.closable){var e=!1;this.getElementById("lg-close").on("click.lg",(function(){t.closeGallery()})),this.settings.closeOnTap&&(this.outer.on("mousedown.lg",(function(i){var s=x(i.target);e=!!t.isSlideElement(s)})),this.outer.on("mousemove.lg",(function(){e=!1})),this.outer.on("mouseup.lg",(function(i){var s=x(i.target);t.isSlideElement(s)&&e&&(t.outer.hasClass("lg-dragging")||t.closeGallery())})))}},w.prototype.closeGallery=function(t){var e=this;if(!this.lgOpened||!this.settings.closable&&!t)return 0;this.LGel.trigger(v),this.settings.resetScrollPosition&&!this.settings.hideScrollbar&&x(window).scrollTop(this.prevScrollTop);var i,s=this.items[this.index];if(this.zoomFromOrigin&&s){var n=this.mediaContainerPosition,o=n.top,r=n.bottom,l=this.galleryItems[this.index],a=l.__slideVideoInfo,d=l.poster,g=T(s,this.outer,o+r,a&&d&&this.settings.videoMaxSize);i=E(s,this.outer,o,r,g)}this.zoomFromOrigin&&i?(this.outer.addClass("lg-closing lg-zoom-from-image"),this.getSlideItem(this.index).addClass("lg-start-end-progress").css("transition-duration",this.settings.startAnimationDuration+"ms").css("transform",i)):(this.outer.addClass("lg-hide-items"),this.outer.removeClass("lg-zoom-from-image")),this.destroyModules(),this.lGalleryOn=!1,this.isDummyImageRemoved=!1,this.zoomFromOrigin=this.settings.zoomFromOrigin,clearTimeout(this.hideBarTimeout),this.hideBarTimeout=!1,x("html").removeClass("lg-on"),this.outer.removeClass("lg-visible lg-components-open"),this.$backdrop.removeClass("in").css("opacity",0);var h=this.zoomFromOrigin&&i?Math.max(this.settings.startAnimationDuration,this.settings.backdropDuration):this.settings.backdropDuration;return this.$container.removeClass("lg-show-in"),setTimeout((function(){e.zoomFromOrigin&&i&&e.outer.removeClass("lg-zoom-from-image"),e.$container.removeClass("lg-show"),e.resetScrollBar(),e.$backdrop.removeAttr("style").css("transition-duration",e.settings.backdropDuration+"ms"),e.outer.removeClass("lg-closing "+e.settings.startClass),e.getSlideItem(e.index).removeClass("lg-start-end-progress"),e.$inner.empty(),e.lgOpened&&e.LGel.trigger(b,{instance:e}),e.$container.get()&&e.$container.get().blur(),e.lgOpened=!1}),h+100),h+100},w.prototype.initModules=function(){this.plugins.forEach((function(t){try{t.init()}catch(t){console.warn("lightGallery:- make sure lightGallery module is properly initiated")}}))},w.prototype.destroyModules=function(t){this.plugins.forEach((function(e){try{t?e.destroy():e.closeGallery&&e.closeGallery()}catch(t){console.warn("lightGallery:- make sure lightGallery module is properly destroyed")}}))},w.prototype.refresh=function(t){this.settings.dynamic||this.invalidateItems(),this.galleryItems=t||this.getItems(),this.updateControls(),this.openGalleryOnItemClick(),this.LGel.trigger(o)},w.prototype.updateControls=function(){this.addSlideVideoInfo(this.galleryItems),this.updateCounterTotal(),this.manageSingleSlideClassName()},w.prototype.destroyGallery=function(){this.destroyModules(!0),this.settings.dynamic||this.invalidateItems(),x(window).off(".lg.global"+this.lgId),this.LGel.off(".lg"),this.$container.remove()},w.prototype.destroy=function(){var t=this.closeGallery(!0);return t?setTimeout(this.destroyGallery.bind(this),t):this.destroyGallery(),t},w}();return function(t,e){return new F(t,e)}}));
;

const html = document.body.parentNode;
let fixedElementsQuery = ['body', '#header'];
let fixedElements = [];

function isMobile () {
  return window.innerWidth <= 576;
}
function initFixedElements () {
  const arr = [];

  fixedElementsQuery.forEach(el => {
    const element = document.querySelector(el);
    const paddingRight = element ? Number(window.getComputedStyle(element, null).getPropertyValue('padding-right')?.replace(/\D/gm, '')) : '0px';

    if (element) {
      arr.push({
        el: element,
        paddingRight: paddingRight,
      });
    }
  })

  fixedElements = arr;
}
function clearNum (num = '') {
  return num.replace(/\s/g, '')
};
function formatedNum (num = '') {
  return String(num).replace(/\D/gm, '').replace(/(\d)(?=(\d{3})+([^\d]|$))/g, "$1 ");
}
function lockScreen () {
  html.classList.add('lock');
  fixedElements.forEach(element => {
    element.el.style.paddingRight = Number(element.paddingRight + getScrollSize()) + 'px';
  })

}
function unLockScreen () {
  html.classList.remove('lock');
  fixedElements.forEach(element => {
    element.el.style.paddingRight = element.paddingRight + 'px';
  })
}
function getScrollSize () {
  let div = document.createElement('div');
  let scrollSize = 0;

  div.style = "position: fixed; overflow: scroll; pointer-events:none; opacity:0;";

  document.body.appendChild(div);
  scrollSize = div.offsetWidth - div.clientWidth;
  document.body.removeChild(div);

  return scrollSize;
};
function insertPlaceholder (target, placeholderId, copyClasses = true, callback = () => {}) {
  const parent = target.parentNode;
  const placeholder = document.createElement('div');
  const existPlaceholder = document.getElementById(placeholderId);

  // Setup placeholder
  if (copyClasses) {
    placeholder.classList = target.classList;
  }

  placeholder.style.maxWidth = '100%';
  placeholder.style.width = target.offsetWidth + 'px';
  placeholder.style.height = target.offsetHeight + 'px';

  if (placeholderId) placeholder.setAttribute('id', placeholderId);
  if (existPlaceholder) existPlaceholder.remove();

  parent.insertBefore(placeholder, target.nextSibling);

  requestAnimationFrame(callback);
}
function getNodeFromString (string) {
  const el = document.createElement('div');
  el.innerHTML = string.trim();
  return el.firstChild;
}
function getIcon (icon = '') {
  return /*html*/`
    <div class="icon">
      <svg>
        <use xlink:href="./img/sprite.svg?ver=${ Date.now() }#${icon}"></use>
      </svg>
    </div>
  `;
}
function morph (count, array = ['пассажир', 'пассажира', 'пассажиров']) {
  return array[(count % 100 > 4 && count % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(count % 10 < 5) ? count % 10 : 5]];
}
function getQueryParam (name = '', returnQueryObject = false) {
  const urlParams = new URLSearchParams(window.location.search);

  return !returnQueryObject ? urlParams.get(name) : urlParams;
}

function getFormDataEntities (form) {
  const formEntries = new FormData(form).entries();
  return Object.assign(...Array.from(formEntries, ([name, value]) => ({[name]: value})));
}

function isValidUrl (str = '') {
  try {
    return Boolean(new URL(str));
  }
  catch(e){
      return false;
  }
}

function throttle(func, ms) {

  let isThrottled = false,
    savedArgs,
    savedThis;

  function wrapper() {

    if (isThrottled) { // (2)
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    func.apply(this, arguments); // (1)

    isThrottled = true;

    setTimeout(function() {
      isThrottled = false; // (3)
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

function initAll (selector = null, fn = () => {}) {
  if (!selector) return;

  const elements = document.querySelectorAll(selector);
  const initedClass = '_inited';

  elements.forEach(el => {
    if (!el.classList.contains(initedClass)) {
      fn(el);
      el.classList.add(initedClass);
    }
  });
}

function elEvent (event = 'click', selector = '', callback = () => {}) {
  document.addEventListener(event, (e) => {
    if (!e.target.matches(selector) && !e.target.closest(selector)) {
      return;
    }

    callback(e.target, e);
  });
}

function slideToggle (el, callback) {
  const animClass = '_anim';
  if (el.classList.contains(animClass)) {
    return;
  }

  const doOpen = el.offsetHeight <= 0;
  const keyFrames = [{ height: 0 }, { height: el.scrollHeight + 'px' }];
  const animOptions = {
    duration: 350,
    easing: 'cubic-bezier(.25,.75,.5,1)',
    fill: 'forwards',
  }

  el.style.height = '';
  el.style.overflow = '';
  el.classList.add(animClass);
  el.animate(
    doOpen ? keyFrames : keyFrames.reverse(),
    animOptions
  ).finished.then(() => {
    el.style.height = doOpen ? 'unset !important' : '';
    el.style.overflow = doOpen ? 'unset !important' : '';
    el.classList.remove(animClass);
    callback();
  });

  el.classList.toggle('_active', doOpen);
}

function wrapString (str = '', tag = 'div', doWrap = true) {
  let res = str;

  if (doWrap) {
    res = `<${tag}>` + str + `</${tag}>`;
  }

  return res;
}


document.addEventListener("DOMContentLoaded", function () {
  // Modules
  document.body.classList.remove('no-js');

  function testWebP(callback) {
  var webP = new Image();
  webP.onload = webP.onerror = function () {
    callback(webP.height == 2);
  };
  webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
}

testWebP(function (support) {
  document.querySelector('body').classList.add(support ? 'webp' : 'no-webp');
});


  // Parts
  function initHeader () {
  const header = document.getElementById('header');

  const scrollHandler = () => {
    const farBp = 400;

    header.classList.toggle('_far', window.scrollY > farBp);
    header.classList.toggle('_clipped', window.scrollY <= 0);
  }
  const initFixedHeader = () => {
    insertPlaceholder(header, 'header-placeholder', false, () => {
      header.classList.add('_fixed');
    });
  }

  window.addEventListener('scroll', scrollHandler);
  scrollHandler();
  initFixedHeader();
}
initHeader();

  function initSwiperSliders () {
  const initSlider = (selector, getProps = (sliderWrapper) => { return {} }, initCallback = (slider, sliderWrapper) => {}) => {
    const wrappers = document.querySelectorAll(selector);
    if (!wrappers) return;

    const init = (sliderWrapper) => {
      const slider = new Swiper(sliderWrapper.matches('.swiper') ? sliderWrapper : sliderWrapper.querySelector('.swiper'), getProps(sliderWrapper));
      const initAdditionalControlls = (wrapper = sliderWrapper) => {
        const prevBtns = wrapper.querySelectorAll('[data-slider-prev]');
        const nextBtns = wrapper.querySelectorAll('[data-slider-next]');
        const thumbs = wrapper.parentNode.querySelectorAll('[data-slide]');

        const updateBtns = () => {
          const setDisabled = (elems, doReset = false) => elems.forEach(el => !doReset ? el.classList.add('disabled') : el.classList.remove('disabled'));
          const resetDisabled = (elems) => setDisabled(elems, true);

          if (slider.isBeginning) {
            setDisabled(prevBtns);
          } else {
            resetDisabled(prevBtns);
          }

          if (slider.isEnd) {
            setDisabled(nextBtns);
          } else {
            resetDisabled(nextBtns);
          }
        }

        const prevHandler = () => {
          slider.slidePrev();
        }

        const nextHandler = () => {
          slider.slideNext();
        }

        const updateThumbs = () => {
          thumbs?.forEach(el => el.classList.toggle('_active', el.dataset.slide == slider.realIndex + 1));
        }

        const thumbHandler = (thumb) => {
          slider.slideTo(thumb.dataset.slide - 1);
          updateThumbs();
        }

        const setListeners = () => {
          prevBtns?.forEach(btn => btn.addEventListener('click', prevHandler));
          nextBtns?.forEach(btn => btn.addEventListener('click', nextHandler));
          thumbs?.forEach(thumb => thumb.addEventListener('click', () => thumbHandler(thumb)));

          slider.on('toEdge', updateBtns);
          slider.on('slideChange', updateBtns);
          slider.on('slideChange', updateThumbs);
          updateThumbs();
          updateBtns();
        }

        setListeners();
      }

      initAdditionalControlls();
      initCallback(slider, sliderWrapper);
    }

    wrappers.forEach(wrap => init(wrap));
  }
  const getBtn = (selector, sliderWrapper) => {
    const wrapper = sliderWrapper.classList.contains('slider--outer-controll') ? sliderWrapper.closest('.section') : sliderWrapper;
    return wrapper.querySelector(selector);
  }

  // Sliders
  const countriesSlider = () => {
    initSlider('.countries-slider', (sliderWrapper) => {
      let nextBtnEl = getBtn('.slider-button--next', sliderWrapper);
      let prevBtnEl = getBtn('.slider-button--prev', sliderWrapper);

      return {
        slidesPerView: 3.5,
        centeredSlides: false,
        spaceBetween: 6,

        navigation: {
          nextEl: nextBtnEl,
          prevEl: prevBtnEl,
        },

        breakpoints: {
          576: {
            slidesPerView: 4.5,
            slidesPerGroup: 4,
            spaceBetween: 10,
          },

          768: {
            slidesPerView: 6,
            slidesPerGroup: 6,
            spaceBetween: 16,
          },

          992: {
            slidesPerView: 8,
            slidesPerGroup: 8,
            spaceBetween: 16,
          },

          1200: {
            slidesPerView: 9,
            slidesPerGroup: 9,
            spaceBetween: 16,
          }
        }
      }
    });
  }

  const productCardSlider = () => {
    initSlider('.product-card-gallery', (sliderWrapper) => {
      const pagination = sliderWrapper.querySelector('.slider__pagintaion');

      return {
        slidesPerView: 1.25,
        spaceBetween: 2,

        pagination: {
          el: pagination,
          clickable: true,
        },

        breakpoints: {
          576: {
            slidesPerView: 1,
            slidesPerGroup: 1,
          },
        }
      }
    });
  }

  const brandsSlider = () => {
    initSlider('.brands-slider', (sliderWrapper) => {
      let nextBtnEl = getBtn('.slider-button--next', sliderWrapper);
      let prevBtnEl = getBtn('.slider-button--prev', sliderWrapper);

      return {
        slidesPerView: 4.2,
        centeredSlides: false,
        spaceBetween: 6,

        navigation: {
          nextEl: nextBtnEl,
          prevEl: prevBtnEl,
        },

        breakpoints: {
          576: {
            slidesPerView: 5.5,
            slidesPerGroup: 4,
          },

          768: {
            slidesPerView: 7,
            slidesPerGroup: 7,
            spaceBetween: 16,
          },

          992: {
            slidesPerView: 9,
            slidesPerGroup: 9,
            spaceBetween: 16,
          },
        }
      }
    });
  }

  const productGallerySlider = () => {
    initSlider('.gallery-slider__slider', (sliderWrapper) => {
      let nextBtnEl = getBtn('.slider-button--next', sliderWrapper);
      let prevBtnEl = getBtn('.slider-button--prev', sliderWrapper);

      return {
        slidesPerView: 1.1,
        centeredSlides: false,
        spaceBetween: 3,

        navigation: {
          nextEl: nextBtnEl,
          prevEl: prevBtnEl,
        },

        breakpoints: {
          576: {
            slidesPerView: 1,
            slidesPerGroup: 1,
            spaceBetween: 2,
          },
        }
      }
    });
  }

  const similarProducts = () => {
    if (window.innerWidth < 576) {
      return;
    }


    initSlider('.similar-products-slider', (sliderWrapper) => {
      let nextBtnEl = getBtn('.slider-button--next', sliderWrapper);
      let prevBtnEl = getBtn('.slider-button--prev', sliderWrapper);

      return {
        slidesPerView: 1.2,
        centeredSlides: false,
        spaceBetween: 10,

        navigation: {
          nextEl: nextBtnEl,
          prevEl: prevBtnEl,
        },

        breakpoints: {
          768: {
            slidesPerView: 2,
            sliderPerGroup: 2,
          }
        }
      }
    });
  }

  const similarPosts = () => {
    if (window.innerWidth < 576) {
      return;
    }


    initSlider('.similar-posts-slider', (sliderWrapper) => {
      let nextBtnEl = getBtn('.slider-button--next', sliderWrapper);
      let prevBtnEl = getBtn('.slider-button--prev', sliderWrapper);

      return {
        slidesPerView: 1.2,
        centeredSlides: false,
        spaceBetween: 10,

        navigation: {
          nextEl: nextBtnEl,
          prevEl: prevBtnEl,
        },

        breakpoints: {
          576: {
            slidesPerView: 1.7,
            sliderPerGroup: 1,
          },

          768: {
            slidesPerView: 3,
            sliderPerGroup: 3,
          }
        }
      }
    });
  }

  countriesSlider();
  productCardSlider();
  brandsSlider();
  productGallerySlider();
  similarProducts();
  similarPosts();
}

initSwiperSliders();

  const allPopups = document.querySelectorAll('.popup[id]');
const popupTrigers = document.querySelectorAll('[data-popup]')
let currentPopup = null;

// Setup popups
allPopups.forEach(popup => {
  const popupId = popup.getAttribute('id');
  const content = popup.querySelector('.popup__content');
  const closeBtn = popup.querySelectorAll('[data-close]');

  popup.onclick = () => closePopup(popupId);
  popup.addEventListener('animationend', popupAnimEnd);

  closeBtn.forEach(btn => btn.onclick = () => closePopup(popupId ? popupId : closeBtn.closest('.popup').getAttribute('id')));
  content.onclick = (e) => e.stopPropagation();
})

// Setup triggers
popupTrigers.forEach(trigger => {
  const popupId = trigger.dataset.popup;
  const popupMaxBp = trigger.dataset.popupMaxBp;

  if (!document.getElementById(popupId)) {
    trigger.classList.add('disabled');
    return;
  }

  trigger.onclick = async (e) => {
    if (popupMaxBp && window.innerWidth > popupMaxBp) {
      return;
    }

    const popupTitle = trigger.dataset.popupTitle ? trigger.dataset.popupTitle : null;
    const popupSubTitle = trigger.dataset.popupSubTitle ? trigger.dataset.popupSubTitle : null;

    if (popupId == 'selector-popup') {
      setupPopupSelector(trigger, popupId);
    }

    openPopup(popupId, trigger.closest('.popup') ? false : true, popupTitle, popupSubTitle);
  };
});

function setupPopupSelector (trigger, popupId) {
  const wrapper = trigger.closest('.input-popup-selector');

  if (!wrapper) return;

  const popup = document.getElementById(popupId);
  const popupSelector = popup ? popup.querySelector('.select-list-wrapper .select-list') : null;
  const selectedOption = trigger.dataset.selected;

  let options = wrapper.querySelectorAll('.input-popup-selector__option');

  if (!options || !popup || !popupSelector) return;

  const getOptionTpl = (option) => /*html*/`
    <button type="button" class="select-list__btn" data-value="${ option.dataset.value }">${ option.innerHTML }</button>
  `;

  if (selectedOption) {
    options = [...options].filter(el => el.dataset.value != selectedOption);
  }
  popupSelector.innerHTML = '';

  options.forEach(option => {
    const optionNode = getNodeFromString(getOptionTpl(option));

    optionNode.addEventListener('click', () => {
      closePopup(popupId);
      wrapper.dispatchEvent(new CustomEvent('option-change', {
        bubbles: true,
        detail: {
          option: {
            value: option.dataset.value,
            title: option.innerHTML,
          }
        }
      }));
    });

    popupSelector.append(optionNode);
  })
}

function popupAnimEnd (e) {
  if (e.target !== this || !e.target.classList.contains('out')) return;
  this.classList.remove('out', '_active');

  if (currentPopup === this) unLockScreen();
};

function openPopup (popupId, doLockScreen = true, title = null, subTitle = null) {
  const popup = document.getElementById(popupId);
  if (!popup || (popup.classList.contains('_active') && !popup.classList.contains('out'))) return;

  // Preparations
  setElement('.popup__title', 'title', title);
  setElement('.popup__sub-title', 'subTitle', subTitle);
  closeActivePopups();
  if (doLockScreen) lockScreen();

  // Actions
  currentPopup = popup;
  popup.classList.remove('out', '_active')
  popup.classList.add('_active');

  popup.querySelector('video[data-autoplay]')?.play();

  // Functions
  function setElement (selector, dataAttr = 'title', value) {
    const elements = popup.querySelectorAll(selector);
    if (!elements) return;

    elements.forEach(el => {
      const elDataVal = el.dataset[dataAttr];

       // Save started value if title change
      if (!elDataVal && value) {
        elements.forEach(el => {
          el.dataset[dataAttr] = el.innerHTML;
        })
      }

      // Set value
      if (!value && !elDataVal) return;
      el.innerHTML = value ? value :elDataVal;
    })


  }
  function setTitle () {
    const titleEl = popup.querySelector('.popup__title');
    if (!titleEl) return;

    // Save started title if title change
    if (!popup.dataset.title && title) {
      popup.dataset.title = titleEl ? titleEl.innerHTML : '';
    }

    // Set title
    if (!title && !popup.dataset.title) return;
    titleEl.innerHTML = title ? title : popup.dataset.title;
  }
}

function closePopup (popupId) {
  const popup = popupId ? document.getElementById(popupId) : this.closest('.popup');
  if (!popup) return;

  popup.classList.add('out');

  popup.querySelectorAll('video')?.forEach(video => video.pause());
  popup.querySelectorAll('.video-popup__video iframe')?.forEach(videoIframe => videoIframe.src = '');
}

function closeActivePopups () {
  const activePopups = document.querySelectorAll('.popup._active');
  activePopups.forEach(popup => closePopup(popup.getAttribute('id')));
}

  const accordions = document.querySelectorAll(".accordion,[data-accordion]");
accordions.forEach((accordion) => initAccordionHandler(accordion));

function initAccordion(accordion) {
  const animationOptions = { duration: 180, fill: "forwards" };
  const items = accordion.querySelectorAll(".accordion-item,[data-accordion-item]");
  const defaultItem = accordion.querySelector('.accordion-item.default,[data-accordion-item-default]');

  const closeAllItems = (...exepts) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const content = item.querySelector('.accordion-item__content,[data-accordion-item-content]');

      if (exepts.find(el => el === item)) continue;
      closeItem(item, content);
    }
  }
  const closeItem = (item, content) => {
    content.animate({ height: "0px" }, animationOptions);
    item.classList.remove("open");
  };
  const openItem = (item, content) => {
    content.animate({ height: `${ content.scrollHeight }px` }, animationOptions);
    item.classList.add("open");
  }

  // Data options
  const onlyMode = accordion.dataset.only ? true : false;

  items.forEach((item) => {
    const trigger = item.querySelector(".accordion-item__header,[data-accordion-item-header]");
    const content = item.querySelector(".accordion-item__content,[data-accordion-item-content]");

    trigger.onclick = () => {
      if (onlyMode) {
        closeAllItems(item);
      }

      if (item.classList.contains("open")) {
        closeItem(item, content);
        return;
      }

      openItem(item, content);
    };
  });

  if (defaultItem) {
    const trigger = defaultItem.querySelector('.accordion-item__header,[data-accordion-item-header]');
    trigger.click();
  }
}

function initAccordionHandler (accordion) {
  const availableTo = accordion.dataset.availableTo ? accordion.dataset.availableTo : undefined;
  let doLoad = true;

  if (availableTo && availableTo <= window.innerWidth) {
    doLoad = false;
  }

  if (!doLoad) {
    accordion.classList.add('no-init');
    return;
  }

  accordion.classList.remove('no-init');
  initAccordion(accordion);
}

window.addEventListener('resize', () => {
  accordions.forEach((accordion) => initAccordionHandler(accordion));
})

  function initSmoothAnchor (anchor, doScrollNow = false) {
  const doScroll = () => {
    const headerHeight = document.querySelector('#header').offsetHeight;
    const additionalOffset = 20;
    const offsetTop = document.querySelector(anchor.getAttribute('href')).offsetTop || 0;

    if (window.innerWidth <= 998 && anchor.closest('.mobile-menu._active')) {
      document.dispatchEvent(new CustomEvent('close-menu', { bubbles: true }));
    }

    window.scrollTo({
      left: 0,
      top: offsetTop - headerHeight - additionalOffset,
      behavior: 'smooth'
    });
  }

  if (anchor.getAttribute('href') == '#') return;

  if (doScrollNow) {
    doScroll();
    return;
  }

  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    doScroll();
  });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  if (anchor.getAttribute('href')[0] == '#') {
    initSmoothAnchor(anchor);
  }
});
document.addEventListener('click', (e) => {
  const target = e.target;

  if (target.hasAttribute('href') && target.tagName == 'a') {
    if (!target.href.includes('#') || target.href[0] != '#') return;

    e.preventDefault();
    initSmoothAnchor(target, true);
  }
})

  function initCustomSelectors () {
  const dSelects = document.querySelectorAll('.d-select');
  const initClass = '_inited';

  const getOptionTpl = (optionObj = {}) => {
    const dataAttrs = optionObj.dataset ?? [];
    const datasetString = [];

    for (const attrName in dataAttrs) {
      if (!Object.hasOwnProperty.call(dataAttrs, attrName)) continue;

      const attrVal = dataAttrs[attrName];
      const dataName = 'data-' + attrName.replace(/([A-Z])/gm, '-$1').toLowerCase();

      datasetString.push(dataName + '="' + attrVal + '"');
    }

    return /*html*/`
      <button
        class="selector__option ${optionObj.disabled ? 'disabled' : ''} ${optionObj.selected ? 'active' : ''} ${optionObj.value ? '' : 'hidden'} ${optionObj.class ? optionObj.class : ''}"
        data-label="${optionObj.label}"
        data-value="${optionObj.value}"
        ${ optionObj.href ? `data-href="${ optionObj.href }"` : '' }
        ${datasetString.join(' ')}
        type="button"
      >
        ${ dataAttrs.preview ?  `<span class="selector__option-preview"><img src="${ dataAttrs.preview }" alt=""></span>` : '' }
        <span class="selector__option-value">
          <span>${optionObj.label}</span>
        </span>
      </button>
    `
  };

  const generateSelectHtml = (dSelect, curIndex = 0, selectsCount = 0) => {
    const defaultZIndex = 99;
    const selectorHtml = dSelect.outerHTML;
    const options = dSelect.querySelectorAll('option');
    const selectLabel = dSelect.dataset.label ? dSelect.dataset.label : '';
    const selectClass = dSelect.dataset.class ?? '';
    const selectedOption = [...options].find(el => el.selected);
    const customClass = dSelect.dataset.class ?? '';
    const optionsWithLabels = [...options].map(el => {
      return {
        value: el.value,
        label: el.innerHTML.trim(),
        selected: el.selected,
        disabled: el.disabled,
        dataset: el.dataset,
      }
    })

    const getSelectInput = (label = '', selectedOption = {}) => /*html*/`
      <label class="selector__input-label input-label">
        <input type="text" class="input selector__input" value="${selectedOption.label}"/>
        <div class="input-label__label">${label}</div>
        ${getIcon('arrow-down')}
      </label>
    `;
    const getSelectorList = (optionsWithLabels = []) => {
      let optionsTpl = '';

      optionsWithLabels.forEach(el => {
        optionsTpl += getOptionTpl(el);
      })

      return /*html*/`
      <div class="selector__list-wrapper">
        <div class="selector__list">
          ${optionsTpl}
        </div>
      </div>
      `;
     }
    const correctTpl = /*html*/`
      <div class="selector-wrapper ${customClass}">
        ${selectorHtml}

        <div class="selector ${ selectClass }">
          ${getSelectInput(selectLabel, selectedOption)}
          ${getSelectorList(optionsWithLabels)}
        </div>
      </div>
    `;
    const correctNode = getNodeFromString(correctTpl);

    requestAnimationFrame(() => {
      const innerDSelect = correctNode.querySelector('.d-select');
      innerDSelect.classList.add('hidden');
      correctNode.style.zIndex = defaultZIndex + selectsCount - curIndex - 1;

      dSelect.parentNode.replaceChild(correctNode, dSelect);
      dSelect.remove();
      init(correctNode);
    })
  }

  const closeOthersSelects = (curEl) => {
    const activeSelects = document.querySelectorAll('.selector__list-wrapper.active');

    if (!activeSelects) return;

    [...activeSelects].filter(el => el != curEl).forEach(el => {
      el.closest('.selector').dispatchEvent(new CustomEvent('close'));
    });
  }

  const init = (wrapper) => {
    const targetSelect = wrapper.querySelector('select');
    const select = wrapper.querySelector('.selector');
    const input = select.querySelector('.selector__input');
    const optionList = select.querySelector('.selector__list-wrapper')
    const optionListInner = select.querySelector('.selector__list');
    const options = select.querySelectorAll('button.selector__option');
    const isButtonSelect = targetSelect.dataset.class?.indexOf('selector--button') != -1;
    const selectorLabel = select.querySelector('.selector__input-label');
    const doLockScreen = targetSelect.dataset.lock == 'true';

    const hasNulOption = (options[0].dataset.value == '') || (options[0].dataset.value == '-');
    const listHeight = optionList.scrollHeight;
    const listAnimationKFrames = [
      {
        height: 0,
        opacity: 0,
      },
      {
        height: listHeight + 'px',
        opacity: 1,
      }
    ];
    const listAnimationOptions = {
      duration: 200,
      iterations: 1,
      fill: 'forwards',
    }
    let curOption = ![...options].find(el => el.classList.contains('active')) ? options[0] : [...options].find(el => el.classList.contains('active'));
    let isAnimation = false;

    targetSelect.classList.add(initClass);
    input.addEventListener('input', () => filterOptionList());
    options.forEach(option => option.onclick = (e) => optionHandler(option, e));
    optionHandler(curOption, null, true);

    select.addEventListener('close', () => toggleOptionList(true));
    wrapper.addEventListener('click', (e) => e.stopPropagation());
    window.addEventListener('click', () => toggleOptionList(true));
    select.addEventListener('reset', reset)

    if (isButtonSelect) {
      selectorLabel.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOptionList(input.classList.contains('active'));
      });
    } else {
      input.addEventListener('focusin', () => toggleOptionList());
    }

    function reset () {
      optionHandler(options[0], null, true);
    }

    function filterOptionList (inputVal = input.value.toLowerCase()) {
      let foundedOptionsCount = 0;
      const notFoundOption = optionListInner.querySelector('.select__option--not-found');

      options.forEach(option => {
        const isEmptyOption = option.dataset.value == '' || option.dataset.value == '-'
        const optionValue = option.dataset.label.toLowerCase();
        const optionSecondNames = option.dataset.secondName ? option.dataset.secondName.toLowerCase() : '';

        const showOption = () => {
          option.classList.remove('hidden-option');
          foundedOptionsCount++;
        }
        const hideOption = () => {
          option.classList.add('hidden-option');
        }

        const isNotMatch = optionValue.indexOf(inputVal) == -1 && optionSecondNames.indexOf(inputVal) == -1 && inputVal;

        if (isNotMatch || isEmptyOption) {
          hideOption();
        } else {
          showOption();
        }
      });

      if (foundedOptionsCount == 0 && !notFoundOption) {
        const notFoundOptionTpl = getOptionTpl({
          label: 'Нет совпадений',
          value: 'not-found',
          select: false,
          disabled: true,
          class: 'select__option--not-found',
        });

        optionListInner.appendChild(getNodeFromString(notFoundOptionTpl));
      }

      if (foundedOptionsCount > 0 && notFoundOption) {
        notFoundOption.remove();
      }
    }

    function toggleOptionList (doClose = false) {
      if (!doClose) {
        closeOthersSelects(select);
      }

      if (isAnimation || (input.classList.contains('active') && !doClose) || (!input.classList.contains('active') && doClose)) return;

      let KFrames = [...listAnimationKFrames];
      isAnimation = true;

      optionList.style.overflowY = 'hidden';

      if (doClose) {
        KFrames.reverse()
      }

      const animation = optionList.animate(KFrames, listAnimationOptions);
      animation.finished.finally(() => {
        isAnimation = false;
        optionList.style.overflowY = 'auto';
      });

      input.classList.toggle('active', !doClose);
      select.classList.toggle('_active', !doClose);
      optionList.classList.toggle('active', !doClose);

      if (doClose) {
        input.value = curOption.dataset.label;
        filterOptionList('');
      }

      if (doLockScreen) {
        if (doClose) {
          unLockScreen();
        } else {
          lockScreen();
        }
      }
    }

    function dispatchSelectorChange () {
      targetSelect.dispatchEvent(new Event('change', { bubbles: true }));
      targetSelect.dispatchEvent(new CustomEvent('select-change', { bubbles: true }));
      document.dispatchEvent(new CustomEvent('selector-change', {
        bubbles: true,
        detail: {
          el: targetSelect,
          id: targetSelect.id,
          name: targetSelect.name,
          value: targetSelect.value,
          renderEl: select,
        }
      }))
    }

    function optionHandler (option, e, isInit = false) {
      e?.stopPropagation();

      if (hasNulOption && (option.dataset.value == targetSelect.value)) {
        option = options[0];
      }

      setActiveOption(option);
      updateValue(option);
      filterOptionList('');
      dispatchSelectorChange();

      if (option.dataset.href && !isInit) {
        window.locaiton.href = option.dataset.href;
      }

      select.classList.toggle('_changed', !isInit);
    }

    function setActiveOption (option) {
      options.forEach(el => el.classList.remove('active'));
      option.classList.add('active');

      toggleOptionList(true);
    }

    function updateValue (option) {
      const value = option.dataset.value;

      targetSelect.value = value;
      input.value = option.dataset.label;
      curOption = option;

      if (!value || value == '-') {
        input.classList.add('selector__value--unselected');
      } else {
        input.classList.remove('selector__value--unselected');
      }
    }
  }

  dSelects.forEach((el, index) => {
    if (el.classList.contains(initClass) || !el.querySelectorAll('option').length) return;

    generateSelectHtml(el, index, dSelects.length)
  });
}
initCustomSelectors();

  const notifications = document.querySelectorAll('.notification');

notifications.forEach(el => initNotificationHandler(el));

function initNotification (wrapper) {
  const closeBtn = wrapper.querySelector('.notification__close-btn');
  const notificationName = wrapper.dataset.name;

  closeBtn.onclick = (e) => {
    e.preventDefault();

    if (notificationName) {
      localStorage.setItem(notificationName, true);
    }

    wrapper.classList.add('close');
    setTimeout(() => wrapper.remove(), 500);
  }
}

function initNotificationHandler (wrapper) {
  const showed = localStorage.getItem(wrapper.dataset.name);

  if (showed) {
    wrapper.remove();
    return;
  }

  initNotification(wrapper);
}

class ModalNotification {
  add = throttle((text = '', status = '', showTime = 1500) => {
    const notification = document.createElement('div');
    const notificationCloseTime = 230;

    if (status) {
      notification.classList.add('modal-notification--' + status);
    }

    notification.classList.add('modal-notification');
    notification.innerHTML = text;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add('_close');
      setTimeout(() => notification.remove(), notificationCloseTime);
    }, showTime);
  }, 1000);
}

window.notification = new ModalNotification();

  function initInputMasks () {
  if (!IMask) return;

  const phoneInputs = document.querySelectorAll(".input-phone-mask");
  const phoneMask = {
    mask: '+{7} (000) 000-00-00'
  };

  phoneInputs.forEach(input => {
    const mask = IMask(input, phoneMask);
  });
}

initInputMasks();

  function initRanges () {
  initAll('[data-range]', (range) => {
    const wrapper = range.closest('.range');
    const inputFrom = wrapper.querySelector('.range-input--from');
    const inputTo = wrapper.querySelector('.range-input--to');
    const rangeData = JSON.parse(range.dataset.range);

    noUiSlider.create(range, {
      start: [+rangeData.from || +rangeData.min, +rangeData.to || +rangeData.max],
      connect: true,
      step: 1,
      range: {
        min: +rangeData.min,
        max: +rangeData.max,
      },
    });

    range.noUiSlider.on('update', (values, handle) => {
      const value = +values[handle];
      const changedInput =  handle ? inputTo : inputFrom;

      if (handle) {
        inputTo.value = formatedNum(value);
      } else {
        inputFrom.value = formatedNum(value);
      }

      changedInput.dispatchEvent(new CustomEvent('custom-change', { bubbles: true }));
    });

    const setSlider = (values) => {
      range.noUiSlider.set(values);
    }

    inputFrom.addEventListener("change", () => {
      setSlider([clearNum(inputFrom.value), null])
    });
    inputTo.addEventListener("change", () => {
      setSlider([null, clearNum(inputTo.value)])
    });

    range.addEventListener('reset', () => setSlider([rangeData.min, rangeData.max]));
    inputTo.addEventListener('input', () => inputTo.value = formatedNum(inputTo.value));
    inputFrom.addEventListener('input', () => inputFrom.value = formatedNum(inputFrom.value));
  });
}
initRanges();

  function normalizeContent () {
  const limitMobileItems = (selector, limit) => {
    if (!isMobile()) return

    const items = document.querySelectorAll(selector);
    if (!items) return;

    items.forEach((item, index) => {
      if (index > limit - 1) {
        item.remove();
      }
    })
  }

  limitMobileItems('.s-reviews__grid .review-card', 3);
  limitMobileItems('.companies-list .company', 12);
}

normalizeContent();

  function initMobileLinks () {
  const mobLinks = document.querySelectorAll('[data-mobile-link]');

  mobLinks.forEach(link => {
    if (isMobile()) {
      link.removeAttribute('data-popup');
    }

    link.addEventListener('click', (e) => {
      if (!isMobile()) return;

      e.preventDefault();
      window.location.href = link.dataset.mobileLink;
    })
  })
}
initMobileLinks();

  function initInputFormat () {
  function strChunks (str, len) {
    let chunks = [];

    for (let i = 0; i < Math.ceil(str.length / len); i++) {
      chunks[i] = str.slice(i * len, Math.min(str.length, (i + 1) * len));
    }

    return chunks;
  }

  const ticketNumberFormat = (str) => {
    return strChunks(str.replace(/\D/gm, ''), 3).join(' ');
  }

  const onInput = (e) => {
    const input = e.target;
    const formatType = e.target.dataset.inputFormat;
    if (!formatType) return;

    switch (formatType) {
      case 'ticket-number':
        input.value = ticketNumberFormat(input.value);
        break;

      default:
        break;
    }
  }

  window.addEventListener('input', onInput);
  window.addEventListener('change', onInput);
}
initInputFormat();

  function initPopupSelectors () {
  const selectors = document.querySelectorAll('.input-popup-selector')
  const init = (selector) => {
    const onOptionChange = (e) => {
      const option = e.detail?.option;
      if (!option) return;

      const inputLabel = selector.querySelector('.input-popup-selector__input-label');
      const input = inputLabel.querySelector('.input[type="text"]');
      const mask = inputLabel.querySelector('.input-label__mask');
      const popupTriggers = selector.querySelectorAll('[data-popup="selector-popup"]');

      input.value = option.value;
      mask.innerHTML = option.title;
      input.dispatchEvent(new Event('change'));
      popupTriggers.forEach(el => el.dataset.selected = input.value);
    }

    selector.addEventListener('option-change', onOptionChange)
  }

  selectors.forEach(selector => init(selector));
}
initPopupSelectors();

  function initSelectWrappers () {
  const wrappers = document.querySelectorAll('.select-list-wrapper');
  const init = (wrapper) => {
    const searchInput = wrapper.querySelector('input[name="search"]');
    const list = wrapper.querySelector('.select-list');

    const filterList = () => {
      const searchWord = searchInput.value.toLowerCase().trim();
      const options = list.querySelectorAll('.select-list__btn');

      let isFound = false;

      list.style.minHeight = list.offsetHeight + 'px';

      options.forEach(el => {
        const isMatched = el.innerHTML.toLowerCase().trim().indexOf(searchWord) != -1;
        el.classList.toggle('hidden', !isMatched);

        if (isMatched) {
          isFound = true;
        }
      });

      if (!isFound) {
        list.appendChild(getNodeFromString(/*html*/`
          <button type="button" class="select-list__btn disabled not-found">Ничего не найдено</button>
        `));
      } else {
        list.querySelectorAll('.not-found')?.forEach(el => el.remove());
      }
    }

    searchInput.addEventListener('input', filterList);
  }

  wrappers.forEach(wrapper => init(wrapper));
}
initSelectWrappers();

  function initFilter (filter) {
  const filterToggleBtn = filter.querySelector('.filter__toggle');
  const filterToggleContent = filter.querySelector('.filter__toggle-content');
  const filterResetBtns = document.getElementById('filter-popup')?.querySelectorAll('[data-filter-reset]');

  const reset = (e) => {
    const resetElements = filter.querySelectorAll('.range-slider, .selector');
    e.preventDefault();
    filter.reset();
    resetElements.forEach(el => el.dispatchEvent(new CustomEvent('reset')));
  }

  const toggleFilter = (e) => {
    if (window.innerWidth <= 768) {
      return;
    }

    filterToggleBtn.classList.toggle('_active', filterToggleContent.offsetHeight <= 0);
    filterToggleBtn.style.pointerEvents = 'none';

    slideToggle(filterToggleContent, () => {
      filterToggleBtn.style.pointerEvents = 'auto';
    });
  }

  elEvent('click', '[data-filter-reset]', (el, event) => reset(event));
  filterToggleBtn?.addEventListener('click', toggleFilter);
  filterResetBtns?.forEach(el => el.addEventListener('click', reset));
}
initAll('.filter', initFilter);

  function initVideoPlay () {
  initAll('.video-container', (el) => {
    const btn = el.querySelector('.video-container__play');
    const video = el.querySelector('video');
    const source = video.querySelector('source');

    btn.addEventListener('click', () => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
      video.load();
      video.play();
      el.classList.add('_active');
    });
  })
}
initVideoPlay();

  function initLightgallery () {
  if (typeof lightGallery == 'undefined') return;

  const galleries = document.querySelectorAll('.lightbox-gallery');
  const initedClass = '_inited';

  galleries.forEach(gallery => {
    if (!gallery.classList.contains(initedClass)) {
      lightGallery(gallery, {
          plugins: [lgZoom, lgThumbnail],
          selector: '.lightbox-gallery__item',
          licenseKey: `0000-0000-000-0000`,
          speed: 500,
          addClass: 'custom-lightgallery',
      });

      gallery.classList.add(initedClass);
    }
  });
}
initLightgallery();

  function initProductPriceChange () {
  const selector = document.getElementById('product-delivery-city');
  const pricePopup = document.getElementById('price-info-popup');
  const productPrice = document.querySelectorAll('[data-product-price]');
  const priceTable = pricePopup?.querySelector('.price-table');

  if (!selector || !pricePopup) {
    return;
  }

  const getData = async ({ value, renderEl, }) => {
    let res = {};

    renderEl.classList.add('_loading');

    // Получение данных. На бэк отправляем параметр city с текущим значением селекта
    // *Базовый путь к API можно поменять в файле plugins/fetch.js
    // try {
    //   res = await fetchApi.get('/', { city: value, });
    //   res = await res.json();
    // } catch (e) {
    //   renderEl.classList.remove('_loading');
    // }

    // Пример ответа
    res = {
      minPrice: 1320174,
      priceTable: [
        {
          name: 'Стоимость авто на аукционе',
          value: '14 800 000 ₩',
        },
        {
          name: 'Комиссия агента в Корее',
          value: '740 000 ₩',
        },
        {
          name: 'Расходы в Корее',
          value: '500 000 ₩',
        },
        {
          name: 'Доставка до порта во Владивостоке',
          value: '750 $',
        },
        {
          name: 'Комиссия Японии-Трейд (агента)',
          value: '50 000 ₽',
        },
        {
          name: 'Расходы по России',
          note: 'Таможенное оформление автомобиля, услуги брокера, базовая ставка СВХ, вывоз на стоянку, фотоотчёт; расходы, связанные с лабораторией',
          value: '50 000 ₽',
        },
        {
          name: 'Утилизационный сбор',
          value: '5 200 ₽',
        },
        {
          name: 'Итого в Москве с ПТС',
          value: '1 320 174 ₽',
          total: true,
        },
      ],
    }

    // Проверка разных данных
    if (value == 'Уфа') {
      res = {
        minPrice: 124000,
        priceTable: [
          {
            name: 'Доставка до уфы',
            value: '124 000 р.',
            note: 'Транспортная и тд',
          },
          {
            name: 'Общая стоимость',
            value: '124 000 р.',
            total: true,
          },
        ]
      }
    }

    renderEl.classList.remove('_loading');

    return res;
  }

  const getTableRow = ({ name, value, total, note }) => {
    return getNodeFromString(`
      <div class="table-row ${ total ? 'table-row--total' : '' }">

        ${ wrapString(
            `
              <span>${ name }</span>
              ${ note ? `<span class="note">${ note }</span>` : '' }
            `,
            'div',
            note
        )}

        <span>${ value }</span>
      </div>
    `);
  }

  const updateTemplate = ({ minPrice, priceTable: table }) => {
    productPrice.forEach(el => el.innerHTML = `от ${ formatedNum(minPrice) } ₽`);

    if (!table) {
      return;
    }

    priceTable.innerHTML = '';
    table.forEach(row => {
      priceTable.appendChild(getTableRow(row));
    })
  }

  const updatePrice = async (selectorData) => {
    const data = await getData(selectorData);

    updateTemplate(data);
  }

  document.addEventListener('selector-change', ({ detail }) => {
    if (detail.id != 'product-delivery-city') {
      return;
    }

    updatePrice(detail);
  });
}
initProductPriceChange();

  function initScrollUp () {
  const triggers = document.querySelectorAll('[data-scroll-up]');

  const scrollUp = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  triggers.forEach(el => el.addEventListener('click', scrollUp));
}
initScrollUp();

function initContactPopup () {
  const popup = document.getElementById('contact-popup');
  if (!popup) return;

  const form = popup.querySelector('form');

  const submit = (e) => {
    e.preventDefault();

    // Валидация и отправка

    openPopup('thank-you-popup');
  }

  form.addEventListener('submit', submit);
}
initContactPopup();


  initFixedElements();
});
