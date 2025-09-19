import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';
import { logger } from '@/lib/logger';

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'dependency' | 'configuration' | 'code' | 'infrastructure';
  title: string;
  description: string;
  recommendation: string;
  file?: string;
  line?: number;
}

interface AuditReport {
  timestamp: string;
  overallScore: number; // 0-100
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  issues: SecurityIssue[];
  dependencies: {
    total: number;
    vulnerable: number;
    outdated: number;
  };
  recommendations: string[];
}

export class SecurityAuditor {
  private issues: SecurityIssue[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Run comprehensive security audit
   */
  public async runAudit(): Promise<AuditReport> {
    logger.info('Starting security audit', {}, 'SECURITY');
    
    this.issues = [];

    try {
      // Check different security aspects
      await this.auditDependencies();
      await this.auditConfiguration();
      await this.auditCodePatterns();
      await this.auditInfrastructure();

      const report = this.generateReport();
      
      logger.info('Security audit completed', {
        overallScore: report.overallScore,
        criticalIssues: report.criticalIssues,
        totalIssues: report.issues.length
      }, 'SECURITY');

      return report;

    } catch (error) {
      logger.error('Security audit failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 'SECURITY');
      
      throw error;
    }
  }

  /**
   * Audit npm dependencies for vulnerabilities
   */
  private async auditDependencies(): Promise<void> {
    try {
      // Check if package.json exists
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!existsSync(packageJsonPath)) {
        this.addIssue({
          severity: 'high',
          category: 'configuration',
          title: 'Missing package.json',
          description: 'No package.json found in project root',
          recommendation: 'Create package.json with proper dependency management'
        });
        return;
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      // Run npm audit
      let auditResult: any = {};
      try {
        const auditOutput = execSync('npm audit --json', { 
          cwd: this.projectRoot,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        auditResult = JSON.parse(auditOutput);
      } catch (error: any) {
        // npm audit returns non-zero exit code when vulnerabilities are found
        if (error.stdout) {
          try {
            auditResult = JSON.parse(error.stdout);
          } catch {
            // If we can't parse the output, create a generic issue
            this.addIssue({
              severity: 'medium',
              category: 'dependency',
              title: 'Dependency audit failed',
              description: 'Could not run npm audit successfully',
              recommendation: 'Run npm audit manually to check for vulnerabilities'
            });
            return;
          }
        }
      }

      // Process audit results
      if (auditResult.vulnerabilities) {
        const vulnerabilities = auditResult.vulnerabilities;
        
        Object.entries(vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
          const severity = this.mapNpmSeverity(vuln.severity);
          
          this.addIssue({
            severity,
            category: 'dependency',
            title: `Vulnerable dependency: ${pkg}`,
            description: `${pkg} has ${vuln.severity} severity vulnerabilities`,
            recommendation: `Update ${pkg} to a secure version or find an alternative`
          });
        });
      }

      // Check for outdated dependencies
      try {
        const outdatedOutput = execSync('npm outdated --json', { 
          cwd: this.projectRoot,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        const outdated = JSON.parse(outdatedOutput);
        
        Object.keys(outdated).forEach(pkg => {
          this.addIssue({
            severity: 'low',
            category: 'dependency',
            title: `Outdated dependency: ${pkg}`,
            description: `${pkg} is not using the latest version`,
            recommendation: `Consider updating ${pkg} to the latest version`
          });
        });
      } catch {
        // npm outdated returns non-zero when outdated packages exist
        // This is expected behavior
      }

      // Check for risky dependencies
      const riskyPackages = [
        'eval', 'vm2', 'serialize-javascript', 'node-serialize'
      ];
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      riskyPackages.forEach(pkg => {
        if (allDeps[pkg]) {
          this.addIssue({
            severity: 'high',
            category: 'dependency',
            title: `Risky dependency: ${pkg}`,
            description: `${pkg} can execute arbitrary code and poses security risks`,
            recommendation: `Review usage of ${pkg} and consider safer alternatives`
          });
        }
      });

    } catch (error) {
      this.addIssue({
        severity: 'medium',
        category: 'dependency',
        title: 'Dependency audit error',
        description: 'Failed to audit dependencies for vulnerabilities',
        recommendation: 'Manually review package.json and run npm audit'
      });
    }
  }

  /**
   * Audit configuration for security issues
   */
  private async auditConfiguration(): Promise<void> {
    // Check environment configuration
    this.auditEnvironmentConfig();
    
    // Check Next.js configuration
    this.auditNextjsConfig();
    
    // Check security headers
    this.auditSecurityHeaders();
    
    // Check authentication setup
    this.auditAuthConfig();
  }

  private auditEnvironmentConfig(): void {
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];

    const productionEnvVars = [
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        this.addIssue({
          severity: 'high',
          category: 'configuration',
          title: `Missing environment variable: ${envVar}`,
          description: `Required environment variable ${envVar} is not set`,
          recommendation: `Set ${envVar} in your environment or .env file`
        });
      }
    });

    if (process.env.NODE_ENV === 'production') {
      productionEnvVars.forEach(envVar => {
        if (!process.env[envVar]) {
          this.addIssue({
            severity: 'critical',
            category: 'configuration',
            title: `Missing production environment variable: ${envVar}`,
            description: `Critical environment variable ${envVar} is not set in production`,
            recommendation: `Set ${envVar} with a strong, random value in production`
          });
        }
      });
    }

    // Check for weak secrets
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      this.addIssue({
        severity: 'high',
        category: 'configuration',
        title: 'Weak NEXTAUTH_SECRET',
        description: 'NEXTAUTH_SECRET is too short (should be at least 32 characters)',
        recommendation: 'Generate a strong, random 32+ character secret for NEXTAUTH_SECRET'
      });
    }
  }

  private auditNextjsConfig(): void {
    const nextConfigPath = path.join(this.projectRoot, 'config/next.config.ts');
    const nextConfigJsPath = path.join(this.projectRoot, 'config/next.config.js');
    const rootNextConfigPath = path.join(this.projectRoot, 'next.config.ts');
    const rootNextConfigJsPath = path.join(this.projectRoot, 'next.config.js');

    const configPath = existsSync(nextConfigPath) ? nextConfigPath :
                      existsSync(nextConfigJsPath) ? nextConfigJsPath :
                      existsSync(rootNextConfigPath) ? rootNextConfigPath :
                      existsSync(rootNextConfigJsPath) ? rootNextConfigJsPath : null;

    if (!configPath) {
      this.addIssue({
        severity: 'medium',
        category: 'configuration',
        title: 'Missing Next.js configuration',
        description: 'No next.config.ts or next.config.js found',
        recommendation: 'Create Next.js configuration with security headers and CSP'
      });
      return;
    }

    try {
      const configContent = readFileSync(configPath, 'utf8');
      
      // Check for security headers
      if (!configContent.includes('X-Frame-Options') && 
          !configContent.includes('Content-Security-Policy')) {
        this.addIssue({
          severity: 'medium',
          category: 'configuration',
          title: 'Missing security headers in Next.js config',
          description: 'Next.js configuration lacks security headers',
          recommendation: 'Add security headers like CSP, X-Frame-Options, etc. to next.config'
        });
      }

      // Check for poweredByHeader disabled
      if (!configContent.includes('poweredByHeader: false')) {
        this.addIssue({
          severity: 'low',
          category: 'configuration',
          title: 'X-Powered-By header exposed',
          description: 'Next.js is exposing X-Powered-By header',
          recommendation: 'Set poweredByHeader: false in next.config to hide server information'
        });
      }

    } catch (error) {
      this.addIssue({
        severity: 'low',
        category: 'configuration',
        title: 'Could not analyze Next.js configuration',
        description: 'Failed to read or parse Next.js configuration file',
        recommendation: 'Review next.config file manually for security settings'
      });
    }
  }

  private auditSecurityHeaders(): void {
    // This would typically check a live deployment, but for now we'll check static config
    const middlewarePath = path.join(this.projectRoot, 'src/middleware.ts');
    
    if (existsSync(middlewarePath)) {
      try {
        const middlewareContent = readFileSync(middlewarePath, 'utf8');
        
        const requiredHeaders = [
          'X-Frame-Options',
          'Content-Security-Policy',
          'X-Content-Type-Options',
          'Referrer-Policy'
        ];

        requiredHeaders.forEach(header => {
          if (!middlewareContent.includes(header)) {
            this.addIssue({
              severity: 'medium',
              category: 'configuration',
              title: `Missing security header: ${header}`,
              description: `Security header ${header} is not set in middleware`,
              recommendation: `Add ${header} header to middleware.ts for better security`
            });
          }
        });

      } catch (error) {
        this.addIssue({
          severity: 'low',
          category: 'configuration',
          title: 'Could not analyze middleware',
          description: 'Failed to read middleware.ts for security header analysis',
          recommendation: 'Manually review middleware.ts for security headers'
        });
      }
    } else {
      this.addIssue({
        severity: 'medium',
        category: 'configuration',
        title: 'Missing middleware for security headers',
        description: 'No middleware.ts found to set security headers',
        recommendation: 'Create middleware.ts to set security headers on all responses'
      });
    }
  }

  private auditAuthConfig(): void {
    // Check Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.addIssue({
        severity: 'high',
        category: 'configuration',
        title: 'Incomplete Supabase configuration',
        description: 'Supabase authentication not properly configured',
        recommendation: 'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set'
      });
    }

    // Check for public keys in client code (basic check)
    const authFiles = [
      'src/lib/supabase.ts',
      'src/components/auth/AuthProvider.tsx'
    ];

    authFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf8');
          
          // Look for hardcoded secrets (basic patterns)
          const secretPatterns = [
            /sk_[a-zA-Z0-9]{48,}/g, // Stripe secret keys
            /rk_[a-zA-Z0-9]{48,}/g, // Stripe restricted keys
            /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}/g // JWT tokens
          ];

          secretPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              this.addIssue({
                severity: 'critical',
                category: 'code',
                title: 'Hardcoded secret detected',
                description: `Potential secret key found hardcoded in ${file}`,
                recommendation: 'Move all secrets to environment variables',
                file
              });
            }
          });

        } catch (error) {
          // File read error, skip
        }
      }
    });
  }

  /**
   * Audit code patterns for security issues
   */
  private async auditCodePatterns(): Promise<void> {
    // Check for dangerous patterns in API routes
    const apiRoutesPath = path.join(this.projectRoot, 'src/app/api');
    
    if (existsSync(apiRoutesPath)) {
      this.auditApiRoutes(apiRoutesPath);
    }

    // Check for client-side security issues
    this.auditClientSecurity();
  }

  private auditApiRoutes(apiPath: string): void {
    const dangerousPatterns = [
      {
        pattern: /eval\s*\(/g,
        severity: 'critical' as const,
        title: 'Dangerous eval() usage',
        description: 'eval() can execute arbitrary code',
        recommendation: 'Remove eval() usage and use safer alternatives'
      },
      {
        pattern: /new\s+Function\s*\(/g,
        severity: 'high' as const,
        title: 'Dangerous Function constructor',
        description: 'Function constructor can execute arbitrary code',
        recommendation: 'Avoid Function constructor, use safer alternatives'
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'medium' as const,
        title: 'Potential XSS with innerHTML',
        description: 'innerHTML can introduce XSS vulnerabilities',
        recommendation: 'Use textContent or sanitize HTML content'
      }
    ];

    // This is a simplified check - in production, you'd want a more sophisticated AST analysis
    try {
      execSync(`find ${apiPath} -name "*.ts" -o -name "*.js"`, { 
        cwd: this.projectRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      }).split('\n').forEach(file => {
        if (file.trim() && existsSync(file)) {
          try {
            const content = readFileSync(file, 'utf8');
            
            dangerousPatterns.forEach(({ pattern, severity, title, description, recommendation }) => {
              if (pattern.test(content)) {
                this.addIssue({
                  severity,
                  category: 'code',
                  title,
                  description,
                  recommendation,
                  file: path.relative(this.projectRoot, file)
                });
              }
            });

          } catch (error) {
            // Skip files that can't be read
          }
        }
      });
    } catch (error) {
      // find command failed, skip code pattern analysis
    }
  }

  private auditClientSecurity(): void {
    // Check for console.log statements that might leak sensitive data
    const clientFiles = path.join(this.projectRoot, 'src');
    
    try {
      execSync(`find ${clientFiles} -name "*.tsx" -o -name "*.ts" | grep -v ".test." | grep -v "node_modules"`, {
        cwd: this.projectRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      }).split('\n').forEach(file => {
        if (file.trim() && existsSync(file)) {
          try {
            const content = readFileSync(file, 'utf8');
            
            // Check for console.log with sensitive data
            if (content.includes('console.log') && 
                (content.includes('password') || content.includes('token') || content.includes('key'))) {
              this.addIssue({
                severity: 'medium',
                category: 'code',
                title: 'Potential sensitive data logging',
                description: 'console.log statements may expose sensitive information',
                recommendation: 'Remove console.log statements from production code',
                file: path.relative(this.projectRoot, file)
              });
            }

          } catch (error) {
            // Skip files that can't be read
          }
        }
      });
    } catch (error) {
      // Command failed, skip client security audit
    }
  }

  /**
   * Audit infrastructure and deployment security
   */
  private async auditInfrastructure(): Promise<void> {
    // Check Docker configuration
    this.auditDockerConfig();
    
    // Check deployment configuration
    this.auditDeploymentConfig();
  }

  private auditDockerConfig(): void {
    const dockerfilePath = path.join(this.projectRoot, 'Dockerfile');
    
    if (existsSync(dockerfilePath)) {
      try {
        const content = readFileSync(dockerfilePath, 'utf8');
        
        // Check for root user
        if (!content.includes('USER ') || content.includes('USER root')) {
          this.addIssue({
            severity: 'high',
            category: 'infrastructure',
            title: 'Docker container running as root',
            description: 'Dockerfile does not specify a non-root user',
            recommendation: 'Add USER directive to run container as non-root user'
          });
        }

        // Check for secrets in Dockerfile
        if (content.includes('SECRET') || content.includes('PASSWORD')) {
          this.addIssue({
            severity: 'high',
            category: 'infrastructure',
            title: 'Potential secrets in Dockerfile',
            description: 'Dockerfile may contain hardcoded secrets',
            recommendation: 'Use build args or runtime environment variables for secrets'
          });
        }

      } catch (error) {
        this.addIssue({
          severity: 'low',
          category: 'infrastructure',
          title: 'Could not analyze Dockerfile',
          description: 'Failed to read Dockerfile for security analysis',
          recommendation: 'Manually review Dockerfile for security issues'
        });
      }
    }
  }

  private auditDeploymentConfig(): void {
    // Check for .env files in repository
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    envFiles.forEach(envFile => {
      if (existsSync(path.join(this.projectRoot, envFile))) {
        this.addIssue({
          severity: 'high',
          category: 'configuration',
          title: `Environment file in repository: ${envFile}`,
          description: `${envFile} should not be committed to version control`,
          recommendation: `Add ${envFile} to .gitignore and use secure secret management`
        });
      }
    });

    // Check .gitignore
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignoreContent = readFileSync(gitignorePath, 'utf8');
      
      const requiredIgnores = ['.env', '.env.local', '.env.production', '*.log'];
      requiredIgnores.forEach(pattern => {
        if (!gitignoreContent.includes(pattern)) {
          this.addIssue({
            severity: 'medium',
            category: 'configuration',
            title: `Missing .gitignore pattern: ${pattern}`,
            description: `${pattern} should be ignored in version control`,
            recommendation: `Add ${pattern} to .gitignore`
          });
        }
      });
    }
  }

  /**
   * Helper methods
   */
  private addIssue(issue: SecurityIssue): void {
    this.issues.push(issue);
  }

  private mapNpmSeverity(npmSeverity: string): SecurityIssue['severity'] {
    switch (npmSeverity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'moderate': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private generateReport(): AuditReport {
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;

    // Calculate overall score (0-100)
    const totalIssues = this.issues.length;
    const severityWeights = { critical: 10, high: 5, medium: 2, low: 1 };
    const totalWeight = (criticalIssues * severityWeights.critical) + 
                       (highIssues * severityWeights.high) + 
                       (mediumIssues * severityWeights.medium) + 
                       (lowIssues * severityWeights.low);

    const overallScore = Math.max(0, Math.min(100, 100 - (totalWeight * 2)));

    const recommendations = this.generateRecommendations();

    return {
      timestamp: new Date().toISOString(),
      overallScore,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      issues: this.issues,
      dependencies: {
        total: 0, // Would be calculated from package.json
        vulnerable: criticalIssues + highIssues,
        outdated: lowIssues
      },
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations = [];

    if (this.issues.some(i => i.severity === 'critical')) {
      recommendations.push('🚨 Address all critical security issues immediately');
    }

    if (this.issues.some(i => i.category === 'dependency')) {
      recommendations.push('📦 Run npm audit and update vulnerable dependencies');
    }

    if (this.issues.some(i => i.category === 'configuration')) {
      recommendations.push('⚙️ Review and secure environment configuration');
    }

    if (this.issues.some(i => i.category === 'code')) {
      recommendations.push('🔍 Implement code review process for security');
    }

    recommendations.push('🔒 Enable automated security scanning in CI/CD');
    recommendations.push('📋 Schedule regular security audits');

    return recommendations;
  }
}

/**
 * Quick security check function
 */
export async function runSecurityCheck(): Promise<boolean> {
  const auditor = new SecurityAuditor();
  const report = await auditor.runAudit();
  
  // Return true if no critical issues
  return report.criticalIssues === 0;
}

/**
 * Generate security report
 */
export async function generateSecurityReport(): Promise<AuditReport> {
  const auditor = new SecurityAuditor();
  return auditor.runAudit();
}