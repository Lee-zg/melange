/**
 * @fileoverview Tests for core OOP utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  EventEmitter,
  Container,
  Lifecycle,
  Disposable,
  DisposableStore,
  toDisposable,
} from '../src/core';

describe('EventEmitter', () => {
  it('should subscribe and emit events', () => {
    const emitter = new EventEmitter<{ message: string }>();
    const handler = vi.fn();

    emitter.on('message', handler);
    emitter.emit('message', 'Hello');

    expect(handler).toHaveBeenCalledWith('Hello');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support multiple listeners', () => {
    const emitter = new EventEmitter<{ event: number }>();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('event', handler1);
    emitter.on('event', handler2);
    emitter.emit('event', 42);

    expect(handler1).toHaveBeenCalledWith(42);
    expect(handler2).toHaveBeenCalledWith(42);
  });

  it('should unsubscribe listeners', () => {
    const emitter = new EventEmitter<{ event: number }>();
    const handler = vi.fn();

    const subscription = emitter.on('event', handler);
    subscription.unsubscribe();
    emitter.emit('event', 42);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support once listeners', () => {
    const emitter = new EventEmitter<{ event: number }>();
    const handler = vi.fn();

    emitter.once('event', handler);
    emitter.emit('event', 1);
    emitter.emit('event', 2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });

  it('should remove all listeners', () => {
    const emitter = new EventEmitter<{ event: number }>();
    const handler = vi.fn();

    emitter.on('event', handler);
    emitter.removeAllListeners('event');
    emitter.emit('event', 42);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should return correct listener count', () => {
    const emitter = new EventEmitter<{ event: number }>();

    emitter.on('event', () => {});
    emitter.on('event', () => {});

    expect(emitter.listenerCount('event')).toBe(2);
  });
});

describe('Container', () => {
  it('should register and resolve dependencies', () => {
    const container = new Container();

    container.register('value', () => 42);

    expect(container.resolve('value')).toBe(42);
  });

  it('should support transient lifecycle', () => {
    const container = new Container();
    let counter = 0;

    container.register('counter', () => ++counter, Lifecycle.Transient);

    expect(container.resolve('counter')).toBe(1);
    expect(container.resolve('counter')).toBe(2);
  });

  it('should support singleton lifecycle', () => {
    const container = new Container();
    let counter = 0;

    container.registerSingleton('counter', () => ++counter);

    expect(container.resolve('counter')).toBe(1);
    expect(container.resolve('counter')).toBe(1);
  });

  it('should register values directly', () => {
    const container = new Container();
    const config = { debug: true };

    container.registerValue('config', config);

    expect(container.resolve('config')).toBe(config);
  });

  it('should check if dependency is registered', () => {
    const container = new Container();

    container.register('value', () => 42);

    expect(container.has('value')).toBe(true);
    expect(container.has('unknown')).toBe(false);
  });

  it('should throw for unregistered dependencies', () => {
    const container = new Container();

    expect(() => container.resolve('unknown')).toThrow();
  });

  it('should support child containers', () => {
    const parent = new Container();
    parent.registerValue('parentValue', 'parent');

    const child = parent.createChild();
    child.registerValue('childValue', 'child');

    expect(child.resolve('parentValue')).toBe('parent');
    expect(child.resolve('childValue')).toBe('child');
  });
});

describe('Disposable', () => {
  class TestDisposable extends Disposable {
    public disposed = false;

    protected override onDispose(): void {
      this.disposed = true;
    }

    public doSomething(): void {
      this.ensureNotDisposed();
    }
  }

  it('should track disposal state', () => {
    const disposable = new TestDisposable();

    expect(disposable.isDisposed).toBe(false);
    disposable.dispose();
    expect(disposable.isDisposed).toBe(true);
  });

  it('should call onDispose', () => {
    const disposable = new TestDisposable();

    disposable.dispose();
    expect(disposable.disposed).toBe(true);
  });

  it('should prevent double disposal', () => {
    const disposable = new TestDisposable();

    disposable.dispose();
    disposable.dispose(); // Should not throw
    expect(disposable.isDisposed).toBe(true);
  });

  it('should throw when used after disposal', () => {
    const disposable = new TestDisposable();

    disposable.dispose();
    expect(() => disposable.doSomething()).toThrow('Object has been disposed');
  });
});

describe('DisposableStore', () => {
  it('should store and dispose multiple disposables', () => {
    const store = new DisposableStore();
    const disposed1 = { value: false };
    const disposed2 = { value: false };

    store.add(toDisposable(() => (disposed1.value = true)));
    store.add(toDisposable(() => (disposed2.value = true)));

    store.dispose();

    expect(disposed1.value).toBe(true);
    expect(disposed2.value).toBe(true);
  });

  it('should track size', () => {
    const store = new DisposableStore();

    store.add(toDisposable(() => {}));
    store.add(toDisposable(() => {}));

    expect(store.size).toBe(2);
  });

  it('should clear without disposing store', () => {
    const store = new DisposableStore();
    const disposed = { value: false };

    store.add(toDisposable(() => (disposed.value = true)));
    store.clear();

    expect(disposed.value).toBe(true);
    expect(store.isDisposed).toBe(false);
    expect(store.size).toBe(0);
  });
});
