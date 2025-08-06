"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleExample = simpleExample;
const src_1 = require("../src");
/**
 * Simple example demonstrating basic browser automation
 */
async function simpleExample() {
    console.log('🚀 Starting Browser Automation Framework Example');
    // Create automation instance
    const automation = new src_1.BrowserAutomation({
        browserType: src_1.BrowserType.CHROMIUM,
        headless: false, // Set to true for headless mode
        viewport: { width: 1280, height: 720 }
    });
    try {
        // Initialize the framework
        await automation.initialize();
        console.log('✅ Framework initialized');
        // Navigate to a website
        console.log('🌐 Navigating to example.com');
        await automation.navigate('https://example.com');
        // Take a screenshot
        console.log('📸 Taking screenshot');
        await automation.screenshot('./screenshots/example-page.png');
        // Get page content
        const content = await automation.getContent();
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/);
        console.log('📄 Page title:', titleMatch?.[1] || 'No title found');
        // Execute a natural language instruction
        console.log('🤖 Executing natural language instruction');
        const result = await automation.execute('Take a screenshot of the current page');
        if (result.success) {
            console.log('✅ Task completed successfully');
        }
        else {
            console.log('❌ Task failed:', result.error);
        }
        console.log('📊 Browser Info:', automation.getBrowserInfo());
    }
    catch (error) {
        console.error('❌ Error occurred:', error);
    }
    finally {
        // Cleanup
        console.log('🧹 Cleaning up');
        await automation.close();
        console.log('✅ Example completed');
    }
}
// Run the example
if (require.main === module) {
    simpleExample().catch(console.error);
}
//# sourceMappingURL=simple-example.js.map