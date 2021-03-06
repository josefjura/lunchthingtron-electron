/// <reference path="../typings/tsd.d.ts" />

'use strict';
module services {
  export class Storage implements ng.IDirective {
    window: ng.IWindowService;
    static $inject = ['$window'];
    constructor(window: ng.IWindowService) {
      this.window = window;
    }

    set(key, value):void {
      window.localStorage[key] = value;
    };
    get(key, defaultValue) {
      return window.localStorage[key] || defaultValue;
    };
    setObject(key, value):void {
      window.localStorage[key] = JSON.stringify(value);
    };
    getObject(key) {
      return JSON.parse(window.localStorage[key] || '{}');
    }
  }

  angular.module('utils', []).service('Storage', services.Storage);
}
