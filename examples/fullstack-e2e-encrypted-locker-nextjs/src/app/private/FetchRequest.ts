type FetchState<T> = {
  isLoading: boolean;
  error?: unknown;
  data?: T;
};

export default class FetchRequest<T> {
  private state: FetchState<T>;
  private listeners: (() => void)[] = [];
  constructor(fetch: () => Promise<T>) {
    this.state = { isLoading: true };
    fetch()
      .then((data) => {
        this.state = { isLoading: false, data };
      })
      .catch((error) => {
        this.state = { isLoading: false, error };
      })
      .finally(() => {
        this.notify();
      });
  }
  private notify() {
    for (let listener of this.listeners) {
      listener();
    }
  }
  subscribe = (listener: () => void) => {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  };
  getSnapshot = () => {
    return this.state;
  };
}
