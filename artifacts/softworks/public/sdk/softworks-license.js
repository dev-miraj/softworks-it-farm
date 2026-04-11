/**
 * SOFTWORKS License SDK v2.0
 * Military-Grade Software License Protection
 * 
 * Usage (Browser):
 *   <script src="https://softworksit.vercel.app/sdk/softworks-license.js"></script>
 *   <script>
 *     SoftworksLicense.init({
 *       licenseKey: 'SW-XXXX-XXXX-XXXX',
 *       serverUrl: 'https://softworksit.vercel.app',
 *       domain: window.location.hostname,
 *       onInvalid: function(err) { document.body.innerHTML = '<h1>License Invalid</h1>'; },
 *       heartbeatInterval: 300000 // 5 minutes
 *     });
 *   </script>
 *
 * Usage (Node.js):
 *   const SoftworksLicense = require('./softworks-license.js');
 *   const license = new SoftworksLicense({
 *     licenseKey: 'SW-XXXX-XXXX-XXXX',
 *     serverUrl: 'https://softworksit.vercel.app'
 *   });
 *   const result = await license.validate();
 */
(function(root) {
  'use strict';

  var SDK_VERSION = '2.0.0';

  function SoftworksLicense(config) {
    if (!(this instanceof SoftworksLicense)) return new SoftworksLicense(config);
    this.config = Object.assign({
      licenseKey: '',
      serverUrl: '',
      domain: (typeof window !== 'undefined') ? window.location.hostname : '',
      heartbeatInterval: 300000,
      onInvalid: null,
      onWarning: null,
      onValid: null,
      autoActivate: true,
      debug: false,
    }, config);
    this._heartbeatTimer = null;
    this._activated = false;
    this._fingerprint = this._generateFingerprint();
  }

  SoftworksLicense.prototype._log = function() {
    if (this.config.debug) console.log.apply(console, ['[SoftworksLicense]'].concat(Array.prototype.slice.call(arguments)));
  };

  SoftworksLicense.prototype._generateFingerprint = function() {
    if (typeof window === 'undefined') return 'node-' + (process.pid || 0) + '-' + Date.now();
    var nav = window.navigator;
    var screen = window.screen;
    var raw = [
      nav.userAgent, nav.language, screen.width, screen.height,
      screen.colorDepth, new Date().getTimezoneOffset(),
      nav.hardwareConcurrency || 0, nav.platform
    ].join('|');
    var hash = 0;
    for (var i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash = hash & hash;
    }
    return 'fp-' + Math.abs(hash).toString(36);
  };

  SoftworksLicense.prototype._request = function(endpoint, data) {
    var url = this.config.serverUrl.replace(/\/$/, '') + '/api/' + endpoint;
    var body = JSON.stringify(data);
    var timestamp = Date.now();

    if (typeof fetch !== 'undefined') {
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SDK-Version': SDK_VERSION,
          'X-Timestamp': String(timestamp),
        },
        body: body,
      }).then(function(r) { return r.json(); });
    }

    if (typeof require !== 'undefined') {
      var https = require('https');
      var http = require('http');
      var urlMod = require('url');
      var parsed = urlMod.parse(url);
      var mod = parsed.protocol === 'https:' ? https : http;

      return new Promise(function(resolve, reject) {
        var req = mod.request({
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SDK-Version': SDK_VERSION,
            'Content-Length': Buffer.byteLength(body),
          },
        }, function(res) {
          var chunks = [];
          res.on('data', function(c) { chunks.push(c); });
          res.on('end', function() {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
            catch(e) { reject(e); }
          });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });
    }

    return Promise.reject(new Error('No HTTP client available'));
  };

  SoftworksLicense.prototype.activate = function() {
    var self = this;
    this._log('Activating license:', this.config.licenseKey);
    return this._request('license/activate', {
      license_key: this.config.licenseKey,
      domain: this.config.domain,
      hardware_id: this._fingerprint,
      user_agent: (typeof navigator !== 'undefined') ? navigator.userAgent : 'Node.js',
      fingerprint: this._fingerprint,
    }).then(function(result) {
      if (result.success) {
        self._activated = true;
        self._log('Activation successful');
        if (self.config.onValid) self.config.onValid(result);
        self._startHeartbeat();
      } else {
        self._log('Activation failed:', result.error);
        if (self.config.onInvalid) self.config.onInvalid(result.error || 'Activation failed');
      }
      return result;
    });
  };

  SoftworksLicense.prototype.validate = function() {
    var self = this;
    this._log('Validating license:', this.config.licenseKey);
    return this._request('license/validate', {
      license_key: this.config.licenseKey,
      domain: this.config.domain,
      hardware_id: this._fingerprint,
    }).then(function(result) {
      var data = result.data || result;
      if (data.valid) {
        self._log('License is valid');
        if (data.payment_warning && self.config.onWarning) {
          self.config.onWarning(data.warning_message);
        }
        if (self.config.onValid) self.config.onValid(data);
      } else {
        self._log('License is invalid:', data.error);
        if (self.config.onInvalid) self.config.onInvalid(data.error || 'Invalid license');
      }
      return data;
    });
  };

  SoftworksLicense.prototype.heartbeat = function() {
    var self = this;
    return this._request('license/heartbeat', {
      license_key: this.config.licenseKey,
      domain: this.config.domain,
      hardware_id: this._fingerprint,
    }).then(function(result) {
      if (!result.success || !result.active) {
        self._log('Heartbeat failed — license inactive');
        if (self.config.onInvalid) self.config.onInvalid('License deactivated');
        self._stopHeartbeat();
      }
      if (result.payment_warning && self.config.onWarning) {
        self.config.onWarning(result.warning_message);
      }
      return result;
    });
  };

  SoftworksLicense.prototype.deactivate = function() {
    this._stopHeartbeat();
    return this._request('license/deactivate', {
      license_key: this.config.licenseKey,
      domain: this.config.domain,
      hardware_id: this._fingerprint,
    });
  };

  SoftworksLicense.prototype._startHeartbeat = function() {
    if (this._heartbeatTimer) return;
    var self = this;
    var interval = this.config.heartbeatInterval;
    if (interval > 0) {
      this._heartbeatTimer = setInterval(function() { self.heartbeat(); }, interval);
      this._log('Heartbeat started (every ' + (interval / 1000) + 's)');
    }
  };

  SoftworksLicense.prototype._stopHeartbeat = function() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  };

  SoftworksLicense.init = function(config) {
    var instance = new SoftworksLicense(config);
    if (instance.config.autoActivate) {
      instance.activate().catch(function(err) {
        console.error('[SoftworksLicense] Init failed:', err);
        if (instance.config.onInvalid) instance.config.onInvalid('Connection failed');
      });
    }
    return instance;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoftworksLicense;
  } else {
    root.SoftworksLicense = SoftworksLicense;
  }
})(typeof window !== 'undefined' ? window : global);
