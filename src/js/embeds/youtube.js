// ==========================================================================
// youtube.js v2.0.11
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
        define('youtube', ['plyr'], function (plyr) { return factory(plyr); });
    } else {
        // Browser globals (root is window)
        factory(window.plyr);
    }
}(function(plyr) {
    'use strict';
    // Parse YouTube ID from url
    function _parseYouTubeId (url) {
        var regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        return (url.match(regex)) ? RegExp.$2 : url;
    }
    // Handle YouTube API ready
    function _youTubeReady(videoId) {
        // Setup instance
        // https://developers.google.com/youtube/iframe_api_reference
        this.embed = new window.YT.Player(this.embeds.container.id, {
            videoId: videoId,
            playerVars: {
                autoplay:       (this.config.autoplay ? 1 : 0),
                controls:       (this.supported.full ? 0 : 1),
                rel:            0,
                showinfo:       0,
                iv_load_policy: 3,
                cc_load_policy: (this.config.captions.defaultActive ? 1 : 0),
                cc_lang_pref:   'en',
                wmode:          'transparent',
                modestbranding: 1,
                disablekb:      1,
                origin:         '*' // https://code.google.com/p/gdata-issues/issues/detail?id=5788#c45
            },
            events: {
                'onError': function(event) {
                    this.coretriggerEvent.call(this, this.container, 'error', true, {
                        code:   event.data,
                        embed:  event.target
                    });
                }.bind(this),
                'onReady': function(event) {
                    // Get the instance
                    var instance = event.target;

                    // Create a faux HTML5 API using the YouTube API
                    this.media.play = function() {
                        instance.playVideo();
                        this.media.paused = false;
                    }.bind(this);
                    this.media.pause = function() {
                        instance.pauseVideo();
                        this.media.paused = true;
                    }.bind(this);
                    this.media.stop = function() {
                        instance.stopVideo();
                        this.media.paused = true;
                    }.bind(this);
                    this.media.duration = instance.getDuration();
                    this.media.paused = true;
                    this.media.currentTime = 0;
                    this.media.muted = instance.isMuted();

                    // Set title
                    this.config.title = instance.getVideoData().title;

                    // Set the tabindex
                    if (this.supported.full) {
                        this.media.querySelector('iframe').setAttribute('tabindex', '-1');
                    }

                    // Update UI
                    this.embeds.embedReady.call(this);

                    // Trigger timeupdate
                    this.core.triggerEvent.call(this, this.media, 'timeupdate');

                    // Trigger timeupdate
                    this.core.triggerEvent.call(this, this.media, 'durationchange');

                    // Reset timer
                    window.clearInterval(this.timers.buffering);

                    // Setup buffering
                    this.timers.buffering = window.setInterval(function() {
                        // Get loaded % from YouTube
                        this.media.buffered = instance.getVideoLoadedFraction();

                        // Trigger progress only when we actually buffer something
                        if (this.media.lastBuffered === null || this.media.lastBuffered < this.media.buffered) {
                            this.core.triggerEvent.call(this, this.media, 'progress');
                        }

                        // Set last buffer point
                        this.media.lastBuffered = this.media.buffered;

                        // Bail if we're at 100%
                        if (this.media.buffered === 1) {
                            window.clearInterval(this.timers.buffering);

                            // Trigger event
                            this.core.triggerEvent.call(this, this.media, 'canplaythrough');
                        }
                    }.bind(this), 200);
                }.bind(this),
                'onStateChange': function(event) {
                    // Get the instance
                    var instance = event.target;

                    // Reset timer
                    window.clearInterval(this.timers.playing);

                    // Handle events
                    // -1   Unstarted
                    // 0    Ended
                    // 1    Playing
                    // 2    Paused
                    // 3    Buffering
                    // 5    Video cued
                    switch (event.data) {
                        case 0:
                            this.media.paused = true;
                            this.core.triggerEvent.call(this, this.media, 'ended');
                            break;

                        case 1:
                            this.media.paused = false;

                            // If we were seeking, fire seeked event
                            if (this.media.seeking) {
                                this.core.triggerEvent.call(this, this.media, 'seeked');
                            }

                            this.media.seeking = false;
                            this.core.triggerEvent.call(this, this.media, 'play');
                            this.core.triggerEvent.call(this, this.media, 'playing');

                            // Poll to get playback progress
                            this.timers.playing = window.setInterval(function() {
                                // Set the current time
                                this.media.currentTime = instance.getCurrentTime();

                                // Trigger timeupdate
                                this.core.triggerEvent.call(this, this.media, 'timeupdate');
                            }.bind(this), 100);

                            // Check duration again due to YouTube bug
                            // https://github.com/Selz/this/issues/374
                            // https://code.google.com/p/gdata-issues/issues/detail?id=8690
                            if (this.media.duration !== instance.getDuration()) {
                                this.media.duration = instance.getDuration();
                                this.core.triggerEvent.call(this, this.media, 'durationchange');
                            }

                            break;

                        case 2:
                            this.media.paused = true;
                            this.core.triggerEvent.call(this, this.media, 'pause');
                            break;
                    }

                    this.core.triggerEvent.call(this, this.container, 'statechange', false, {
                        code: event.data
                    });
                }.bind(this)
            }
        });
    }
    plyr.extensions.prototype.embeds.youtube = {
        setup: function() {
            var mediaId = _parseYouTubeId(this.embedId);
            // Create the YouTube container
            this.media.appendChild(this.embeds.container);

            // Set ID
            this.embeds.container.setAttribute('id', this.embeds.id);

            // Setup API
            if (this.core.is.object(window.YT)) {
                _youTubeReady.call(this, mediaId);
            } else {
                // Load the API
                this.core.injectScript(this.config.urls.youtube.api);

                // Setup callback for the API
                window.onYouTubeReadyCallbacks = window.onYouTubeReadyCallbacks || [];

                // Add to queue
                window.onYouTubeReadyCallbacks.push(function() { _youTubeReady.call(this, mediaId); }.bind(this));

                // Set callback to process queue
                window.onYouTubeIframeAPIReady = function () {
                    window.onYouTubeReadyCallbacks.forEach(function(callback) { callback(); });
                };
            }
        }
    }
}));