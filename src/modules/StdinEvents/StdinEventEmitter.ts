import EventEmitter from 'events';

export type StdinEventEmitterTypes = {
  'notification-icon-clicked': [arg: 'exit' | 'about'];
};

export class StdinEventEmitter {
  private emitter = new EventEmitter();

  emit<TEventName extends keyof StdinEventEmitterTypes & string>(
    eventName: TEventName,
    ...eventArg: StdinEventEmitterTypes[TEventName]
  ) {
    this.emitter.emit(eventName, ...eventArg);
  }

  on<TEventName extends keyof StdinEventEmitterTypes & string>(
    eventName: TEventName,
    handler: (...eventArg: StdinEventEmitterTypes[TEventName]) => void,
  ) {
    this.emitter.on(eventName, handler as any);
  }

  off<TEventName extends keyof StdinEventEmitterTypes & string>(
    eventName: TEventName,
    handler: (...eventArg: StdinEventEmitterTypes[TEventName]) => void,
  ) {
    this.emitter.off(eventName, handler as any);
  }
}
