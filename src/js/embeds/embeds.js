// ==========================================================================
// embeds.js v2.0.11
// ==========================================================================
;(function(factory) {
    'use strict';
    /*global define,module*/
    if (typeof module === 'object' && typeof module.exports === 'object') {
        // Node, CommonJS-like
        var plyr = require('plyr');
        factory(plyr);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define('embeds', ['plyr'], function (plyr) { return factory(plyr); });
    } else {
        // Browser globals (root is window)
        factory(window.plyr);
    }
}(function(plyr) { 
    plyr.extensions.prototype.embeds = {
        // When embeds are ready
        embedReady: function() {
            // Setup the UI and call ready if full support
            if (this.supported.full) {
                this.setupInterface();
                this.ready();
            }

            // Set title
            this.setTitle(this.core.getElement.call(this, 'iframe'));
        },
        setup : function() {
            this.embeds.container = document.createElement('div');
            this.embeds.id = this.type + '-' + Math.floor(Math.random() * (10000));
            
            // Remove old containers
            var containers = this.core.getElements.call(this, '[id^="' + this.type + '-"]');
            for (var i = containers.length - 1; i >= 0; i--) {
                _remove(containers[i]);
            }

            // Add embed class for responsive
            this.core.toggleClass(this.media, this.config.classes.videoWrapper, true);
            this.core.toggleClass(this.media, this.config.classes.embedWrapper, true);

            // Parse IDs from URLs if supplied
            switch (this.type) {
                case 'youtube':
                    this.embeds.youtube.setup.call(this);
                    break;
                case 'vimeo':
                    this.embeds.vimeo.setup.call(this);
                    break;
                case 'soundcloud':
                    this.embeds.soundcloud.setup.call(this);
                    break;
                default:
                    throw Error('Embedtype: ' + this.type + ' not supported');
            }
        }
    }
}));