#!/usr/bin/env tsx

/**
 * Security Audit CLI Tool
 * 
 * Run comprehensive security audit of the application
 * 
 * Usage:
 *   npm run security:audit
 *   or
 *   npx tsx scripts/security-audit.ts
 */

import { generateSecurityReport, runSecurityCheck } from '../src/lib/security/audit';
import { redactSensitive } from '../src/lib/config/security';
import path from 'path';
import { writeFileSync } from 'fs';

interface AuditOptions {
  output?: string;
  format?: 'json' | 'text';
  exitOnCritical?: boolean;
  verbose?: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const options: AuditOptions = {
    format: 'text',
    exitOnCritical: true,
    verbose: false
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as 'json' | 'text';
        break;
      case '--no-exit':
        options.exitOnCritical = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  console.log('🔒 Starting Security Audit...\n');

  try {
    const report = await generateSecurityReport();
    
    // Display results
    if (options.format === 'json') {
      const output = JSON.stringify(redactSensitive(report), null, 2);
      
      if (options.output) {
        writeFileSync(options.output, output);
        console.log(`✅ Security report saved to ${options.output}`);
      } else {
        console.log(output);
      }
    } else {
      displayTextReport(report, options.verbose);
      
      if (options.output) {
        const textReport = generateTextReport(report, options.verbose);
        writeFileSync(options.output, textReport);
        console.log(`✅ Security report saved to ${options.output}`);
      }
    }

    // Exit with error code if critical issues found
    if (options.exitOnCritical && report.criticalIssues > 0) {
      console.error(`\n🚨 ${report.criticalIssues} critical security issues found!`);
      console.error('Fix these issues before deployment.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Security audit failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Security Audit Tool

USAGE:
  npm run security:audit [OPTIONS]

OPTIONS:
  -o, --output <file>     Save report to file
  -f, --format <format>   Output format: json|text (default: text)
  --no-exit              Don't exit with error code on critical issues
  -v, --verbose          Show detailed information
  -h, --help             Show this help message

EXAMPLES:
  npm run security:audit
  npm run security:audit --output security-report.json --format json
  npm run security:audit --verbose --no-exit
`);
}

function displayTextReport(report: any, verbose: boolean = false) {
  const { overallScore, criticalIssues, highIssues, mediumIssues, lowIssues, issues } = report;
  
  console.log('📊 SECURITY AUDIT REPORT');
  console.log('========================\n');
  
  // Overall Score
  const scoreColor = overallScore >= 80 ? '🟢' : overallScore >= 60 ? '🟡' : '🔴';
  console.log(`${scoreColor} Overall Security Score: ${overallScore}/100\n`);
  
  // Issue Summary
  console.log('📋 ISSUE SUMMARY');
  console.log('-----------------');
  console.log(`🚨 Critical: ${criticalIssues}`);
  console.log(`⚠️  High:     ${highIssues}`);
  console.log(`💛 Medium:   ${mediumIssues}`);
  console.log(`ℹ️  Low:      ${lowIssues}`);
  console.log(`📊 Total:    ${issues.length}\n`);

  // Issues by category
  const categories = ['critical', 'high', 'medium', 'low'];
  
  categories.forEach(severity => {
    const severityIssues = issues.filter((i: any) => i.severity === severity);
    
    if (severityIssues.length > 0) {
      const emoji = { critical: '🚨', high: '⚠️', medium: '💛', low: 'ℹ️' }[severity];
      console.log(`${emoji} ${severity.toUpperCase()} ISSUES (${severityIssues.length})`);
      console.log('-'.repeat(20));
      
      severityIssues.forEach((issue: any, index: number) => {
        console.log(`${index + 1}. ${issue.title}`);
        console.log(`   Category: ${issue.category}`);
        console.log(`   ${issue.description}`);
        console.log(`   Fix: ${issue.recommendation}`);
        if (issue.file) {
          console.log(`   File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }
        console.log();
      });
    }
  });

  // Recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS');
    console.log('-------------------');
    report.recommendations.forEach((rec: string, index: number) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log();
  }

  // Quick Actions
  console.log('⚡ QUICK ACTIONS');
  console.log('----------------');
  
  if (criticalIssues > 0) {
    console.log('1. 🚨 Address all critical security issues immediately');
  }
  
  if (highIssues > 0) {
    console.log('2. ⚠️ Fix high severity issues before deployment');
  }

  console.log('3. 📦 Run: npm audit fix');
  console.log('4. 🔍 Review and update dependencies regularly');
  console.log('5. 🔐 Ensure all secrets are properly configured');
  
  if (verbose) {
    console.log('\n📈 DETAILED METRICS');
    console.log('--------------------');
    console.log(`Dependencies: ${report.dependencies.total} total, ${report.dependencies.vulnerable} vulnerable`);
    console.log(`Timestamp: ${report.timestamp}`);
  }
}

function generateTextReport(report: any, verbose: boolean = false): string {
  // This would generate the same text report as above but return as string
  // Implementation similar to displayTextReport but building a string
  let output = '';
  
  output += '📊 SECURITY AUDIT REPORT\n';
  output += '========================\n\n';
  
  const scoreColor = report.overallScore >= 80 ? '🟢' : report.overallScore >= 60 ? '🟡' : '🔴';
  output += `${scoreColor} Overall Security Score: ${report.overallScore}/100\n\n`;
  
  // Add rest of the report content...
  output += `Issues found: ${report.issues.length}\n`;
  output += `Critical: ${report.criticalIssues}, High: ${report.highIssues}, Medium: ${report.mediumIssues}, Low: ${report.lowIssues}\n\n`;
  
  // Add issues details if verbose
  if (verbose) {
    report.issues.forEach((issue: any, index: number) => {
      output += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}\n`;
      output += `   ${issue.description}\n`;
      output += `   Fix: ${issue.recommendation}\n`;
      if (issue.file) {
        output += `   File: ${issue.file}\n`;
      }
      output += '\n';
    });
  }
  
  output += `Report generated: ${report.timestamp}\n`;
  
  return output;
}

// Run the audit
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}