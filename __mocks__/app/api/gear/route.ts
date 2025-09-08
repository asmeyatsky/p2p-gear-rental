import { NextResponse } from 'next/server';

export const GET = jest.fn(() => NextResponse.json({ mocked: true, method: 'GET' }));
export const POST = jest.fn(() => NextResponse.json({ mocked: true, method: 'POST' }, { status: 201 }));
export const PUT = jest.fn(() => NextResponse.json({ mocked: true, method: 'PUT' }));
export const DELETE = jest.fn(() => NextResponse.json({ mocked: true, method: 'DELETE' }));