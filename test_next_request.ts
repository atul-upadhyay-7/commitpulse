import { NextRequest } from 'next/server';
const req = new NextRequest('http://localhost', { headers: { 'user-agent': 'test' } });
console.log(req.headers.get('user-agent'));
