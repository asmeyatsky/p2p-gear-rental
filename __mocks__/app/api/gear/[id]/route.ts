import { NextResponse } from 'next/server';

export const GET = jest.fn(() => NextResponse.json({ mocked: true, method: 'GET_BY_ID' }));
export const PUT = jest.fn(() => NextResponse.json({ mocked: true, method: 'PUT' }));
export const DELETE = jest.fn(() => NextResponse.json({ mocked: true, method: 'DELETE' }));