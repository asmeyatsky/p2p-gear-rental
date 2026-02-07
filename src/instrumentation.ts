export async function register() {
  // Validate environment variables at server startup (not during build)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvironment } = await import('@/lib/config/env-validation');
    try {
      validateEnvironment();
    } catch (error) {
      console.error('Environment validation failed:', error);
      // Don't crash the server - just warn. Some vars may be set via runtime config.
    }
  }
}
