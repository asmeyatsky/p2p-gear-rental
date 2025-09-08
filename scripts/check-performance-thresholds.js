#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Performance thresholds
const THRESHOLDS = {
  performance: 80,
  accessibility: 90,
  bestPractices: 80,
  seo: 80,
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  cumulativeLayoutShift: 0.1,
  totalBlockingTime: 200,
  speedIndex: 3000,
  timeToInteractive: 3500,
};

async function checkPerformanceThresholds() {
  try {
    const manifestPath = path.join(process.cwd(), '.lighthouseci', 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      console.error('❌ Lighthouse manifest not found');
      process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (!manifest || manifest.length === 0) {
      console.error('❌ No Lighthouse results found');
      process.exit(1);
    }

    let allPassed = true;
    const failures = [];

    for (const result of manifest) {
      console.log(`\n📊 Analyzing: ${result.url || 'Unknown URL'}`);
      
      if (result.summary) {
        // Check category scores
        const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
        
        for (const category of categories) {
          const score = result.summary[category];
          const threshold = THRESHOLDS[category.replace('-', '')];
          const scorePercent = Math.round(score * 100);
          
          if (scorePercent < threshold) {
            allPassed = false;
            failures.push(`${category}: ${scorePercent}% (threshold: ${threshold}%)`);
            console.log(`❌ ${category}: ${scorePercent}% < ${threshold}%`);
          } else {
            console.log(`✅ ${category}: ${scorePercent}% >= ${threshold}%`);
          }
        }
      }

      // Check detailed metrics if available
      if (result.jsonPath && fs.existsSync(result.jsonPath)) {
        const detailedResult = JSON.parse(fs.readFileSync(result.jsonPath, 'utf8'));
        
        if (detailedResult.audits) {
          const audits = detailedResult.audits;
          
          // First Contentful Paint
          if (audits['first-contentful-paint']?.numericValue) {
            const fcp = audits['first-contentful-paint'].numericValue;
            if (fcp > THRESHOLDS.firstContentfulPaint) {
              allPassed = false;
              failures.push(`FCP: ${Math.round(fcp)}ms > ${THRESHOLDS.firstContentfulPaint}ms`);
              console.log(`❌ FCP: ${Math.round(fcp)}ms > ${THRESHOLDS.firstContentfulPaint}ms`);
            } else {
              console.log(`✅ FCP: ${Math.round(fcp)}ms <= ${THRESHOLDS.firstContentfulPaint}ms`);
            }
          }

          // Largest Contentful Paint
          if (audits['largest-contentful-paint']?.numericValue) {
            const lcp = audits['largest-contentful-paint'].numericValue;
            if (lcp > THRESHOLDS.largestContentfulPaint) {
              allPassed = false;
              failures.push(`LCP: ${Math.round(lcp)}ms > ${THRESHOLDS.largestContentfulPaint}ms`);
              console.log(`❌ LCP: ${Math.round(lcp)}ms > ${THRESHOLDS.largestContentfulPaint}ms`);
            } else {
              console.log(`✅ LCP: ${Math.round(lcp)}ms <= ${THRESHOLDS.largestContentfulPaint}ms`);
            }
          }

          // Cumulative Layout Shift
          if (audits['cumulative-layout-shift']?.numericValue !== undefined) {
            const cls = audits['cumulative-layout-shift'].numericValue;
            if (cls > THRESHOLDS.cumulativeLayoutShift) {
              allPassed = false;
              failures.push(`CLS: ${cls.toFixed(3)} > ${THRESHOLDS.cumulativeLayoutShift}`);
              console.log(`❌ CLS: ${cls.toFixed(3)} > ${THRESHOLDS.cumulativeLayoutShift}`);
            } else {
              console.log(`✅ CLS: ${cls.toFixed(3)} <= ${THRESHOLDS.cumulativeLayoutShift}`);
            }
          }

          // Total Blocking Time
          if (audits['total-blocking-time']?.numericValue) {
            const tbt = audits['total-blocking-time'].numericValue;
            if (tbt > THRESHOLDS.totalBlockingTime) {
              allPassed = false;
              failures.push(`TBT: ${Math.round(tbt)}ms > ${THRESHOLDS.totalBlockingTime}ms`);
              console.log(`❌ TBT: ${Math.round(tbt)}ms > ${THRESHOLDS.totalBlockingTime}ms`);
            } else {
              console.log(`✅ TBT: ${Math.round(tbt)}ms <= ${THRESHOLDS.totalBlockingTime}ms`);
            }
          }

          // Speed Index
          if (audits['speed-index']?.numericValue) {
            const si = audits['speed-index'].numericValue;
            if (si > THRESHOLDS.speedIndex) {
              allPassed = false;
              failures.push(`Speed Index: ${Math.round(si)}ms > ${THRESHOLDS.speedIndex}ms`);
              console.log(`❌ Speed Index: ${Math.round(si)}ms > ${THRESHOLDS.speedIndex}ms`);
            } else {
              console.log(`✅ Speed Index: ${Math.round(si)}ms <= ${THRESHOLDS.speedIndex}ms`);
            }
          }

          // Time to Interactive
          if (audits['interactive']?.numericValue) {
            const tti = audits['interactive'].numericValue;
            if (tti > THRESHOLDS.timeToInteractive) {
              allPassed = false;
              failures.push(`TTI: ${Math.round(tti)}ms > ${THRESHOLDS.timeToInteractive}ms`);
              console.log(`❌ TTI: ${Math.round(tti)}ms > ${THRESHOLDS.timeToInteractive}ms`);
            } else {
              console.log(`✅ TTI: ${Math.round(tti)}ms <= ${THRESHOLDS.timeToInteractive}ms`);
            }
          }
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    
    if (allPassed) {
      console.log('🎉 All performance thresholds passed!');
      console.log('The application meets all performance requirements.');
    } else {
      console.log('❌ Performance thresholds failed:');
      failures.forEach(failure => console.log(`  - ${failure}`));
      console.log('\nPlease optimize the application to meet performance requirements.');
      
      // Generate performance report
      const report = {
        timestamp: new Date().toISOString(),
        passed: false,
        failures: failures,
        thresholds: THRESHOLDS,
        results: manifest
      };
      
      fs.writeFileSync(
        path.join(process.cwd(), 'performance-report.json'),
        JSON.stringify(report, null, 2)
      );
      
      process.exit(1);
    }

  } catch (error) {
    console.error('Error checking performance thresholds:', error);
    process.exit(1);
  }
}

// Generate performance recommendations
function generateRecommendations(failures) {
  const recommendations = [];
  
  failures.forEach(failure => {
    if (failure.includes('performance')) {
      recommendations.push('Consider optimizing JavaScript bundles and reducing unused code');
      recommendations.push('Implement lazy loading for images and components');
      recommendations.push('Use Next.js Image optimization');
    }
    
    if (failure.includes('FCP') || failure.includes('LCP')) {
      recommendations.push('Optimize server response time');
      recommendations.push('Minimize render-blocking resources');
      recommendations.push('Optimize critical rendering path');
    }
    
    if (failure.includes('CLS')) {
      recommendations.push('Set explicit dimensions for images and videos');
      recommendations.push('Avoid inserting content above existing content');
      recommendations.push('Use CSS aspect-ratio for responsive images');
    }
    
    if (failure.includes('TBT') || failure.includes('TTI')) {
      recommendations.push('Break up long-running JavaScript tasks');
      recommendations.push('Minimize main thread work');
      recommendations.push('Use code splitting to reduce initial bundle size');
    }
    
    if (failure.includes('accessibility')) {
      recommendations.push('Add alt text to images');
      recommendations.push('Ensure sufficient color contrast');
      recommendations.push('Add proper heading hierarchy');
    }
  });
  
  // Remove duplicates
  return [...new Set(recommendations)];
}

if (require.main === module) {
  checkPerformanceThresholds();
}

module.exports = checkPerformanceThresholds;