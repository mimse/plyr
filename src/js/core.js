// ==========================================================================
// core.js v2.0.11
// ==========================================================================
; (function (factory) {
    'use strict';
    /*global define,module*/
    if (typeof module === 'object' && typeof module.exports === 'object') {
        // Node, CommonJS-like
        var plyr = require('plyr');
        factory(plyr);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define('core', ['plyr'], function (plyr) { return factory(plyr); });
    } else {
        // Browser globals (root is window)
        factory(window.plyr);
    }
} (function (plyr) {
    plyr.extensions.prototype.core = {
        // Find all elements
        getElements: function (selector) {
            return this.container.querySelectorAll(selector);
        },
        // Find a single element
        getElement: function (selector) {
            return this.core.getElements.call(this, selector)[0];
        },
        // Set attributes
        setAttributes: function (element, attributes) {
            for (var key in attributes) {
                element.setAttribute(key, (this.core.is.boolean(attributes[key]) && attributes[key]) ? '' : attributes[key]);
            }
        },
        // Toggle class on an element
        toggleClass: function (element, className, state) {
            if (element) {
                if (element.classList) {
                    element.classList[state ? 'add' : 'remove'](className);
                } else {
                    var name = (' ' + element.className + ' ').replace(/\s+/g, ' ').replace(' ' + className + ' ', '');
                    element.className = name + (state ? ' ' + className : '');
                }
            }
        },
        // Bind event
        on: function (element, events, callback, useCapture) {
            if (element) {
                this.core.toggleListener.call(this, element, events, callback, true, useCapture);
            }
        },
        // Toggle event listener
        toggleListener: function (element, events, callback, toggle, useCapture) {
            var eventList = events.split(' ');

            // Whether the listener is a capturing listener or not
            // Default to false
            if (!this.core.is.boolean(useCapture)) {
                useCapture = false;
            }

            // If a nodelist is passed, call itself on each node
            if (element instanceof NodeList) {
                for (var x = 0; x < element.length; x++) {
                    if (element[x] instanceof Node) {
                        this.core.toggleListener.call(this, element[x], arguments[1], arguments[2], arguments[3]);
                    }
                }
                return;
            }

            // If a single node is passed, bind the event listener
            for (var i = 0; i < eventList.length; i++) {
                element[toggle ? 'addEventListener' : 'removeEventListener'](eventList[i], callback, useCapture);
            }
        },
        // Check variable types
        is : {
            object: function (input) {
                return input !== null && typeof (input) === 'object';
            },
            array: function (input) {
                return input !== null && (typeof (input) === 'object' && input.constructor === Array);
            },
            number: function (input) {
                return input !== null && (typeof (input) === 'number' && !isNaN(input - 0) || (typeof input === 'object' && input.constructor === Number));
            },
            string: function (input) {
                return input !== null && (typeof input === 'string' || (typeof input === 'object' && input.constructor === String));
            },
            boolean: function (input) {
                return input !== null && typeof input === 'boolean';
            },
            nodeList: function (input) {
                return input !== null && input instanceof NodeList;
            },
            htmlElement: function (input) {
                return input !== null && input instanceof HTMLElement;
            },
            function: function (input) {
                return input !== null && typeof input === 'function';
            },
            undefined: function (input) {
                return input !== null && typeof input === 'undefined';
            }
        },
        // Inject a script
        injectScript: function (source) {
            if (document.querySelectorAll('script[src="' + source + '"]').length) {
                return;
            }

            var tag = document.createElement('script');
            tag.src = source;
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        },
        // Trigger events, with plyr instance passed
        triggerEvent: function (element, type, bubbles, properties) {
            this.core.event.call(this, element, type, bubbles, this.core.extend({}, properties, {
                plyr: this
            }));
        },
        // Trigger event
        event: function (element, type, bubbles, properties) {
            // Bail if no element
            if (!element || !type) {
                return;
            }

            // Default bubbles to false
            if (!this.core.is.boolean(bubbles)) {
                bubbles = false;
            }

            // Create and dispatch the event
            var event = new CustomEvent(type, {
                bubbles: bubbles,
                detail: properties
            });

            // Dispatch the event
            element.dispatchEvent(event);
        },
        // Deep extend/merge destination object with N more objects
        // http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
        // Removed call to arguments.callee (used explicit function name instead)
        extend: function () {
            // Get arguments
            var objects = arguments;

            // Bail if nothing to merge
            if (!objects.length) {
                return;
            }

            // Return first if specified but nothing to merge
            if (objects.length === 1) {
                return objects[0];
            }

            // First object is the destination
            var destination = Array.prototype.shift.call(objects),
                length = objects.length;

            // Loop through all objects to merge
            for (var i = 0; i < length; i++) {
                var source = objects[i];

                for (var property in source) {
                    if (source[property] && source[property].constructor && source[property].constructor === Object) {
                        destination[property] = destination[property] || {};
                        this.core.extend.call(this, destination[property], source[property]);
                    } else {
                        destination[property] = source[property];
                    }
                }
            }

            return destination;
        }
    }
}));