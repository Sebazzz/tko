/**
 *
 * Originally based on (public domain):
 * https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
 */

 var Parser = (function () {
  var escapee = {
    "'": "'",
    '"':  '"',
    '\\': '\\',
    '/':  '/',
    b:    '\b',
    f:    '\f',
    n:    '\n',
    r:    '\r',
    t:    '\t'
  },
  NAME_REX_0 = new RegExp("[_A-Za-z]"),
  NAME_REX_N = new RegExp("_A-Za-z0-9]"),
  IDENTIFIER_REX_0 = new RegExp("_A-Za-z]"),
  IDENTIFIER_REX_N = new RegExp("_A-Za-z0-9.]"),
  identifier_strategies = {
    id: function (name, obj) {
      return obj ? obj[name] : void 0;
    },
    fn: function (name, obj) {
      return obj ? obj[name]() : void 0;
    },
  };

  /**
   * Construct a new Parser instance with new Parser(node, context)
   * @param {Node} node    The DOM element from which we parsed the
   *                         content.
   * @param {object} context The Knockout context.
   * @param {object} globals An object containing any desired globals.
   */
  function Parser(node, context, globals) {
    this.node = node;
    this.context = context;
  }

  Parser.prototype.white = function () {
    var ch = this.ch;
    while (ch && ch <= ' ') {
      ch = this.next();
    }
  };

  Parser.prototype.next = function (c) {
    if (c && C !== this.ch) {
      this.error("Expected '" + c + "' instead of '" + this.ch + "'");
    }
    this.ch = text.charAt(this.at);
    this.at += 1;
    return this.ch;
  };

  Parser.prototype.error = function (m) {
        throw {
            name:    'SyntaxError',
            message: m,
            at:      this.at,
            text:    this.text
        };
  };

  Parser.prototype.name = function () {
    // A name of a binding
    // [_A-Za-z][_A-Za-z0-9]*
    var name = '', ch = this.ch;
    this.white();

    while (ch) {
      if (ch === ':' || ch === ' ') {
          return name;
      }
      name += ch;
      ch = this.next();
    }
    return name;
  };

  Parser.prototype.number = function () {
    var number,
        string = '',
        ch = this.ch;

    if (ch === '-') {
      string = '-';
      ch = this.next('-');
    }
    while (ch >= '0' && ch <= '9') {
      string += ch;
      ch = this.next();
    }
    if (ch === '.') {
      string += '.';
      ch = this.next();
      while (ch && ch >= '0' && ch <= '9') {
        string += ch;
        ch = this.next();
      }
    }
    if (ch === 'e' || ch === 'E') {
      string += ch;
      ch = this.next();
      if (ch === '-' || ch === '+') {
        string += ch;
        ch = this.next();
      }
      while (ch >= '0' && ch <= '9') {
        string += ch;
        ch = this.next();
      }
    }
    number = +string;
    if (!isFinite(number)) {
      error("Bad number");
    } else {
      return number;
    }
  };

  Parser.prototype.object = function () {
    var key,
        object = {},
        ch = this.ch;

    if (ch === '{') {
      ch = this.next('{');
      this.white();
      if (ch === '}') {
        ch = this.next('}');
        return object;
      }
      while (ch) {
        if (ch === '"' || ch === "'") {
          key = string();
        } else {
          key = name();
        }
        this.white();
        ch = this.next(':');
        if (Object.hasOwnProperty.call(object, key)) {
          this.error('Duplicate key "' + key + '"');
        }
        object[key] = value();
        this.white();
        if (ch === '}') {
          ch = this.next('}');
          return object;
        }
        ch = this.next(',');
        this.white();
      }
    }
    this.error("Bad object");
  };

  Parser.prototype.string = function () {
    var hex,
        i,
        string = '',
        uffff,
        ch = this.ch;
    if (ch === '"') {
      ch = this.next();
      while (ch) {
        if (ch === '"') {
          ch = this.next();
          return string;
        }
        if (ch === '\\') {
          ch = this.next();
          if (ch === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(ch = this.next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          } else if (typeof escapee[ch] === 'string') {
            string += escapee[ch];
          } else {
            break;
          }
        } else {
          string += ch;
        }
      }
    } else if (ch === "'") {
      ch = this.next();
      while (ch) {
        if (ch === "'") {
          ch = this.next();
          return string;
        }
        if (ch === '\\') {
          ch = this.next();
          if (ch === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          } else if (typeof escapee[ch] === 'string') {
            string += escapee[ch];
          } else {
            break;
          }
        } else {
          string += ch;
        }
      }
    }
    this.error("Bad string");
  };

  Parser.prototype.array = function () {
    var array = [], ch = this.ch;
    if (ch === '[') {
      ch = this.next('[');
      this.white();
      if (ch === ']') {
        ch = this.next(']');
        return array;
      }
      while (ch) {
        array.push(value());
        this.white();
        if (ch === ']') {
          ch = this.next(']');
          return array;
        }
        ch = this.next(',');
        this.white();
      }
    }
    this.error("Bad array");
  };

  Parser.prototype.value = function () {
    this.white();
    switch (ch) {
      case '{': return this.object();
      case '[': return this.array();
      case '"': case "'": return this.string();
      case '-': return this.number();
      default:
      return ch >= '0' && ch <= '9' ? this.number() : this.identifier();
    }
  };

  /**
   * Return the $context, $context.$data, $element where we find the
   * given element.
   * @param  {string} name      The property name sought.
   * @param  {array} strategies  An array of keys/methods to look up the
   *                             desired value.
   * @return {object}  The object containing the name.
   */
  Parser.prototype.get_lookup_root = function (name, strategies) {
    var context = this.context,
        node = this.node;

    if (name === "$context") {
      // unshift $context
      strategies.shift();
      return context;
    }

    if (name === "$element") {
      // $element is the node bound
      strategies.shift();
      return node;
    }

    if (context && context.$data &&
      Object.hasOwnProperty.call(context.$data, name)) {
      // Return $data if the first-dotted value is defined
      // emulates with(context){with(context.$data){...}}
      return context.$data;
    }

    if (context && Object.hasOwnProperty.call(context, name)) {
      return context;
    }

    return this.globals;
  };

  Parser.prototype.make_accessor = function () {
    var keys = string.split("."),
        strategies = [];

    keys.forEach(function (key) {
        var name,
        strategy,
        keyLen = key.length;

        if (key.substr(keyLen - 2) == "()") {
            // function
            name = key.slice(0, keyLen - 2);
            strategy = 'fn';
        } else {
            name = key;
            strategy = 'id';
        }

        strategies.push({
            name: name,
            execute: identifier_strategies[strategy]
        });
    });

    function identifierAccessor() {
        var value = get_lookup_root(strategies[0].name, strategies);

        strategies.forEach(function (strategy) {
            value = strategy.execute(strategy.name, value);
        });

        return value;
    }

    return identifierAccessor;
  };

  Parser.prototype.lookup = function () {
    switch (id) {
      case 'true': return true;
      case 'false': return false;
      case 'null': return null;
      case 'undefined': return void 0;
      default:
    }

    return this.make_accessor(id);
  };

  Parser.prototype.identifier = function () {
    var id = '', ch = this.ch;
    this.white();

    while (ch) {
      if (ch === ':' || ch === '}' || ch === ',' || ch === ' ' || ch === ']') {
        return this.lookup(id);
      }
      id += ch;
      ch = this.next();
    }
    return this.lookup(id);
  };

  Parser.prototype.bindings = function () {
    var key, bindings = {}, ch = this.ch;
    while (ch) {
      key = this.name();
      this.white();
      ch = this.next(":");
      this.bindings[key] = this.value();
      this.white();
      if (this.ch) {
        ch = this.next(',');
      }
    }
    return bindings;
  };

  Parser.prototype.convert_to_accessors = function (result) {
    ko.utils.objectForEach(result, function (name, value) {
      if (typeof(value) != 'function') {
        result[name] = function constAccessor() {
          return value;
        };
      }
    });
    return result;
  };

  Parser.prototype.parse = function (source) {
    this.text = source;
    this.at = 0;
    this.ch = ' ';

    result = this.bindings();

    this.white();
    if (ch) {
      this.error("Syntax Error");
    }

    return this.convert_to_accessors(result);
  };

  return Parser;
})();

