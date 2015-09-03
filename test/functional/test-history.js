/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {History} from '../../src/history';
import {listenOncePromise} from '../../src/event-helper';
import * as sinon from 'sinon';

describe('History', () => {

  let sandbox;
  let clock;
  let history;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    clock = sandbox.useFakeTimers();
    history = new History(window);
  });

  afterEach(() => {
    history.cleanup_();
    history = null;
    clock.restore();
    clock = null;
    sandbox.restore();
    sandbox = null;
  });

  it('initial', () => {
    expect(history.stackIndex_).to.equal(window.history.length - 1);
    expect(history.startIndex_).to.equal(window.history.length - 1);
    expect(history.stackOnPop_.length).to.equal(0);
    expect(history.unsupportedState_['AMP.History']).to.equal(
        window.history.length - 1);
  });

  it('history.pushState', () => {
    window.history.pushState({a: 111});
    expect(history.unsupportedState_.a).to.equal(111);
    expect(history.unsupportedState_['AMP.History']).to.equal(
        window.history.length - 1);
  });

  it('history.replaceState', () => {
    window.history.replaceState({a: 112});
    expect(history.unsupportedState_.a).to.equal(112);
    expect(history.unsupportedState_['AMP.History']).to.equal(
        window.history.length - 1);
  });

  it('push', () => {
    let onPop = sinon.spy();
    return history.push(onPop).then((historyId) => {
      expect(history.stackIndex_).to.equal(window.history.length - 1);
      expect(history.unsupportedState_['AMP.History']).to.equal(
          window.history.length - 1);
      expect(history.stackOnPop_.length).to.equal(window.history.length);
      expect(history.stackOnPop_[window.history.length - 1]).to.equal(onPop);
      expect(onPop.callCount).to.equal(0);
    });
  });

  it('pop', () => {
    let onPop = sinon.spy();
    return history.push(onPop).then((historyId) => {
      expect(onPop.callCount).to.equal(0);
      let histPromise = listenOncePromise(window, 'popstate').then(() => {
        clock.tick(100);
      });
      let popPromise = history.pop(historyId);
      return Promise.all([histPromise, popPromise]).then(() => {
        expect(history.stackIndex_).to.equal(window.history.length - 2);
        expect(history.unsupportedState_['AMP.History']).to.equal(
            window.history.length - 2);
        expect(history.stackOnPop_.length).to.equal(window.history.length - 1);
        clock.tick(1);
        expect(onPop.callCount).to.equal(1);
      });
    });
  });

  it('history.back', () => {
    let onPop = sinon.spy();
    return history.push(onPop).then((historyId) => {
      expect(onPop.callCount).to.equal(0);
      let histPromise = listenOncePromise(window, 'popstate').then(() => {
        clock.tick(100);
      });
      window.history.go(-1);
      return histPromise.then(() => {
        clock.tick(100);
        expect(history.stackIndex_).to.equal(window.history.length - 2);
        expect(history.unsupportedState_['AMP.History']).to.equal(
            window.history.length - 2);
        expect(history.stackOnPop_.length).to.equal(window.history.length - 1);
        clock.tick(1);
        expect(onPop.callCount).to.equal(1);
      });
    });
  });
});
