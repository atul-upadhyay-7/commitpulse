const OriginalRequest = globalThis.Request;
globalThis.Request = class extends OriginalRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
    if (!this.headers.has('origin') && !this.headers.has('referer')) {
      this.headers.set('origin', 'https://commitpulse.vercel.app');
    }
  }
};
const req = new Request('http://localhost', { method: 'POST' });
console.log(req.headers.get('origin'));
