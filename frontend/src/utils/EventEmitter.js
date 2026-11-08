// simple event emitter class to allow components to communicate with each other
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    // if event 'eventName' doesn't exist, create it
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    // Logging
    // console.info(
    //   `Event registered: ${eventName} with callback: ${JSON.stringify(
    //     callback,
    //   )}`,
    // );

    // attach the provided callback to the event
    this.events[eventName].push(callback);
  }

  off(eventName, callback) {
    // if this event doesnt exist, do nothing
    if (!this.events[eventName]) return;

    // Logging
    // console.info(
    //   `Event deleted: ${eventName} with callback: ${JSON.stringify(callback)}`,
    // );

    // otherwise, remove the callback from the event
    const eventIndex = this.events[eventName].indexOf(callback);
    if (eventIndex > -1) {
      this.events[eventName].splice(eventIndex, 1);
    }
  }

  emit(eventName, ...args) {
    // if this event doesnt exist, do nothing
    if (!this.events[eventName]) return;

    // Logging
    // console.info(
    //   `Event emitted: ${eventName} with arguments: ${JSON.stringify(args)}`,
    // );

    // otherwise, call all callbacks attached to the event
    this.events[eventName].forEach((callback) => {
      callback(...args);
    });
  }

  async emitAsync(eventName, ...args) {
    const callbacks = this.events[eventName];
    if (!callbacks?.length) throw new Error(`No handler for ${eventName}`);
    await Promise.all(callbacks.map((callback) => callback(...args)));
  }
}

// create a singleton instance of the event emitter and export it
const emitter = new EventEmitter();
export default emitter;
