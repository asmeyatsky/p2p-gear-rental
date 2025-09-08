import { jest } from '@jest/globals';

export const useParams = jest.fn();
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}));

export const useSearchParams = jest.fn();
export const usePathname = jest.fn();