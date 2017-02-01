// ==========================================================================
// soundcloud.js v2.0.11
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
        define('soundcloud', ['plyr'], function (plyr) { return factory(plyr); });
    } else {
        // Browser globals (root is window)
        factory(window.plyr);
    }
}(function(plyr) {
    'use strict';
    // Soundcloud ready
    function _soundcloudReady() {
        /* jshint validthis: true */
        this.embed = window.SC.Widget(this);

        // Setup on ready
        this.embed.bind(window.SC.Widget.Events.READY, function() {
            // Create a faux HTML5 API using the Soundcloud API
            this.media.play = function() {
                this.embed.play();
                this.media.paused = false;
            }.bind(this);
            this.media.pause = function() {
                this.embed.pause();
                this.media.paused = true;
            };
            this.media.stop = function() {
                this.embed.seekTo(0);
                this.embed.pause();
                this.media.paused = true;
            }.bind(this);

            this.media.paused = true;
            this.media.currentTime = 0;

            this.embed.getDuration(function(value) {
                this.media.duration = value/1000;
                // Update UI
                this.embeds.embedReady();
            }.bind(this))

            this.embed.getPosition(function(value) {
                this.media.currentTime = value;

                // Trigger timeupdate
                this.core.triggerEvent.call(this, this.media, 'timeupdate');
            }.bind(this));

            this.embed.bind(window.SC.Widget.Events.PLAY, function() {
                this.media.paused = false;
                this.triggerEvent.call(this, this.media, 'play');
                this.triggerEvent.call(this, this.media, 'playing');
            }.bind(this));

            this.embed.bind(window.SC.Widget.Events.PAUSE, function() {
                this.media.paused = true;
                this.triggerEvent.call(this, this.media, 'pause');
            }.bind(this));

            this.embed.bind(window.SC.Widget.Events.PLAY_PROGRESS, function(data) {
                this.media.seeking = false;
                this.media.currentTime = data.currentPosition/1000;
                this.triggerEvent.call(this, this.media, 'timeupdate');
            }.bind(this));

            this.embed.bind(window.SC.Widget.Events.LOAD_PROGRESS, function(data) {
                this.media.buffered = data.loadProgress;
                this.triggerEvent.call(this, this.media, 'progress');

                if (parseInt(data.loadProgress) === 1) {
                    // Trigger event
                    this.triggerEvent.call(this, this.media, 'canplaythrough');
                }
            }.bind(this));

            this.embed.bind(window.SC.Widget.Events.FINISH, function() {
                this.media.paused = true;
                this.triggerEvent.call(this, this.media, 'ended');
            }.bind(this));
        });
    }
    plyr.extensions.prototype.embeds.soundcloud = {
        setup: function() {
            // TODO: Currently unsupported and undocumented
            // Inject the iframe
            var soundCloud = document.createElement('iframe');

            // Watch for iframe load
            soundCloud.loaded = false;
            this.core.on.call(this, soundCloud, 'load', function() { soundCloud.loaded = true; });

            this.core.setAttributes.call(this, soundCloud, {
                'src':  'https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/' + this.embedId,
                'id':   this.embeds.id
            });

            this.embeds.container.appendChild(soundCloud);
            this.media.appendChild(this.embeds.container);

            // Load the API if not already
            if (!window.SC) {
                this.core.injectScript.call(this, this.config.urls.soundcloud.api);
            }

            // Wait for SC load
            var soundCloudTimer = window.setInterval(function() {
                if (window.SC && soundCloud.loaded) {
                    window.clearInterval(soundCloudTimer);
                    _soundcloudReady.call(this, soundCloud);
                }
            }.bind(this), 50);
        }   
    }
}));