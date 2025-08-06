import { BrowserAutomation, BrowserType } from '../src';

/**
 * Advanced example showing multi-adapter usage and AI integration
 */
async function advancedExample() {
  console.log('🚀 Starting Advanced Browser Automation Example');
  
  // Test different adapters
  const adapters = ['playwright', 'puppeteer'] as const;
  
  for (const adapterName of adapters) {
    console.log(`\n📚 Testing ${adapterName} adapter...`);
    
    const automation = new BrowserAutomation({
      adapter: adapterName,
      headless: true,
      browserType: BrowserType.CHROME
    });

    try {
      // Navigate to a test page
      console.log('🌐 Navigating to example.com...');
      await automation.navigate('https://example.com');
      
      // Take a screenshot
      console.log('📸 Taking screenshot...');
      const screenshot = await automation.screenshot(`example-${adapterName}.png`);
      console.log(`📄 Screenshot saved (${screenshot.length} bytes)`);
      
      // Get page content
      const content = await automation.getContent();
      const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/);
      console.log('📄 Page title:', titleMatch?.[1] || 'No title found');
      
      // Natural language instruction processing
      console.log('🤖 Testing natural language instructions...');
      
      // Simulate AI-powered element detection
      const instructions = [
        'Take a screenshot of the page',
        'Get the page title',
        'Navigate to the main content'
      ];
      
      for (const instruction of instructions) {
        console.log(`💬 Processing: "${instruction}"`);
        try {
          const result = await automation.execute(instruction);
          console.log('✅ Result:', result.success ? 'Success' : 'Failed');
          if (result.extractedData) {
            console.log('📊 Data:', typeof result.extractedData === 'string' ? result.extractedData.substring(0, 100) + '...' : result.extractedData);
          }
        } catch (error) {
          console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
    } catch (error) {
      console.error(`❌ Error with ${adapterName}:`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      await automation.close();
      console.log(`✅ ${adapterName} adapter test completed`);
    }
  }
  
  console.log('\n🎉 Advanced example completed!');
}

/**
 * Cross-browser testing example
 */
async function crossBrowserExample() {
  console.log('\n🌐 Starting Cross-Browser Testing Example');
  
  const browsers = [BrowserType.CHROME, BrowserType.FIREFOX] as const;
  const testUrl = 'https://httpbin.org/html';
  
  for (const browserType of browsers) {
    console.log(`\n🔧 Testing with ${browserType}...`);
    
    const automation = new BrowserAutomation({
      adapter: 'playwright', // Playwright supports multiple browsers
      headless: true,
      browserType
    });

    try {
      await automation.navigate(testUrl);
      
      // Test basic functionality across browsers
      const content = await automation.getContent();
      console.log(`📄 Content length in ${browserType}:`, content.length);
      
      const screenshot = await automation.screenshot();
      console.log(`📸 Screenshot size in ${browserType}:`, screenshot.length, 'bytes');
      
    } catch (error) {
      console.error(`❌ Error with ${browserType}:`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      await automation.close();
    }
  }
  
  console.log('✅ Cross-browser testing completed!');
}

/**
 * Performance comparison example
 */
async function performanceExample() {
  console.log('\n⚡ Starting Performance Comparison Example');
  
  const adapters = ['playwright', 'puppeteer'] as const;
  const testUrl = 'https://example.com';
  
  for (const adapter of adapters) {
    console.log(`\n📊 Performance test with ${adapter}...`);
    
    const startTime = Date.now();
    
    const automation = new BrowserAutomation({
      adapter,
      headless: true,
      browserType: BrowserType.CHROME
    });

    try {
      const launchTime = Date.now();
      console.log(`🚀 Launch time: ${launchTime - startTime}ms`);
      
      await automation.navigate(testUrl);
      const navigationTime = Date.now();
      console.log(`🌐 Navigation time: ${navigationTime - launchTime}ms`);
      
      await automation.screenshot();
      const screenshotTime = Date.now();
      console.log(`📸 Screenshot time: ${screenshotTime - navigationTime}ms`);
      
      const totalTime = Date.now() - startTime;
      console.log(`⏱️  Total time with ${adapter}: ${totalTime}ms`);
      
    } catch (error) {
      console.error(`❌ Performance test error with ${adapter}:`, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      await automation.close();
    }
  }
  
  console.log('✅ Performance comparison completed!');
}

// Main execution
async function main() {
  try {
    await advancedExample();
    await crossBrowserExample();
    await performanceExample();
  } catch (error) {
    console.error('💥 Main execution error:', error);
    process.exit(1);
  }
}

// Run the examples
if (require.main === module) {
  main().catch(console.error);
}

export { advancedExample, crossBrowserExample, performanceExample };
