// __mocks__/@/lib/monitoring.ts
// Pass-through mock for monitoring module

export const monitoring = {
  logRequest: jest.fn(),
  getMetrics: jest.fn().mockReturnValue({
    averageResponseTime: 0,
    requestCount: 0,
    errorCount: 0,
    errorRate: 0,
    slowQueries: 0,
  }),
  getEndpointStats: jest.fn().mockReturnValue([]),
  getHealthStatus: jest.fn().mockReturnValue({ status: 'healthy', metrics: {} }),
};

export class PerformanceTimer {
  mark = jest.fn();
  measure = jest.fn().mockReturnValue(0);
  getTotal = jest.fn().mockReturnValue(0);
  getAllMarkers = jest.fn().mockReturnValue({});
}

// Pass-through implementation - calls the actual handler
export function trackDatabaseQuery<T>(
  _operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return queryFn();
}

// Pass-through implementation - returns a function that calls the handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withMonitoring(handler: (req: any, context?: any) => Promise<any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: any, context?: any) => {
    return handler(req, context);
  };
}

export class AlertSystem {
  static checkAndSendAlerts = jest.fn();
  static sendAlert = jest.fn();
}

export function startAlertMonitoring() {
  // No-op in tests
}
