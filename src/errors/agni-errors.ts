export class AgniError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'AgniError';
  }
}
