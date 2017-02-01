// ==========================================================================
// vimeo.js v2.0.11
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
        define('vimeo', ['plyr'], function (plyr) { return factory(plyr); });
    } else {
        // Browser globals (root is window)
        factory(window.plyr);
    }
}(function(plyr) {
    'use strict';
    // Parse Vimeo ID from url
    function _parseVimeoId(url) {
        var regex = /^.*(vimeo.com\/|video\/)(\d+).*/;
        return (url.match(regex)) ? RegExp.$2 : url;
    }
    // Vimeo ready
    function _vimeoReady(mediaId, container) {
        // Setup instance
        // https://github.com/vimeo/player.js
        this.embed = new window.Vimeo.Player(container, {
            id:         parseInt(mediaId),
            loop:       this.config.loop,
            autoplay:   this.config.autoplay,
            byline:     false,
            portrait:   false,
            title:      false
        });

        // Create a faux HTML5 API using the Vimeo API
        this.media.play = function() {
            this.embed.play();
            this.media.paused = false;
        }.bind(this);
        this.media.pause = function() {
            this.embed.pause();
            this.media.paused = true;
        }.bind(this);
        this.media.stop = function() {
            this.embed.stop();
            this.media.paused = true;
        }.bind(this);

        this.media.paused = true;
        this.media.currentTime = 0;

        // Update UI
        this.embeds.embedReady.call(this);

        this.embed.getCurrentTime().then(function(value) {
            this.media.currentTime = value;

            // Trigger timeupdate
            this.core.triggerEvent.call(this, this.media, 'timeupdate');
        }.bind(this));

        this.embed.getDuration().then(function(value) {
            this.media.duration = value;

            // Trigger timeupdate
            this.core.triggerEvent.call(this, this.media, 'durationchange');
        }.bind(this));

        // TODO: Captions
        /*if (config.captions.defaultActive) {
            plyr.embed.enableTextTrack('en');
        }*/

        this.embed.on('loaded', function() {
            // Fix keyboard focus issues
            // https://github.com/Selz/plyr/issues/317
            if (this.core.is.htmlElement(this.embed.element) && this.supported.full) {
                this.embed.element.setAttribute('tabindex', '-1');
            }
        }.bind(this));

        this.embed.on('play', function() {
            this.media.paused = false;
            this.core.triggerEvent.call(this, this.media, 'play');
            this.core.triggerEvent.call(this, this.media, 'playing');
        }.bind(this));

        this.embed.on('pause', function() {
            this.media.paused = true;
            this.triggerEvent.call(this, this.media, 'pause');
        }.bind(this));

        this.embed.on('timeupdate', function(data) {
            this.media.seeking = false;
            this.media.currentTime = data.seconds;
            this.core.triggerEvent.call(this, this.media, 'timeupdate');
        }.bind(this));

        this.embed.on('progress', function(data) {
            this.media.buffered = data.percent;
            this.core.triggerEvent.call(this, this.media, 'progress');

            if (parseInt(data.percent) === 1) {
                // Trigger event
                this.core.triggerEvent.call(this, this.media, 'canplaythrough');
            }
        }.bind(this));

        this.embed.on('seeked', function() {
            this.media.seeking = false;
            this.core.triggerEvent.call(this, this.media, 'seeked');
            this.core.triggerEvent.call(this, this.media, 'play');
        }.bind(this));

        this.embed.on('ended', function() {
            this.media.paused = true;
            this.core.triggerEvent.call(this, this.media, 'ended');
        }.bind(this));
    }
    plyr.extensions.prototype.embeds.vimeo = {
        setup: function() {
            var mediaId = _parseVimeoId(this.embedId);
            // Vimeo needs an extra div to hide controls on desktop (which has full support)
            if (this.supported.full) {
                this.media.appendChild(this.embeds.container);
            } else {
                this.embeds.container = this.media;
            }

            // Set ID
            this.embeds.container.setAttribute('id', this.embeds.id);

            // Load the API if not already
            if (this.core.is.object(window.Vimeo)) {
                _vimeoReady.call(this, mediaId, this.embeds.container);
            } else {
                 this.core.injectScript(this.config.urls.vimeo.api);

                // Wait for fragaloop load
                var vimeoTimer = window.setInterval(function() {
                    if (this.core.is.object(window.Vimeo)) {
                        window.clearInterval(vimeoTimer);
                        _vimeoReady.call(this, mediaId, this.embed.container);
                    }
                }.bind(this), 50);
               
            }
        }
    }
}));