const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.TEST_SERVER_PORT || 3005;

// Enable CORS and body parsing
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// HTML page route
app.get('/html', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test HTML Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        p { line-height: 1.6; }
        .content { max-width: 800px; margin: 0 auto; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .link-section { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="content">
        <h1>Test HTML Page</h1>
        <p>This is a test page for browser automation testing.</p>
        <p>It contains various HTML elements for testing navigation and screenshot functionality.</p>

        <div class="link-section">
            <h2>Test Links</h2>
            <ul>
                <li><a href="/forms/post">Pizza Order Form</a></li>
                <li><a href="/about">About Page</a></li>
                <li><a href="#test-content">Internal Link to Test Content</a></li>
                <li><a href="https://httpbin.org" target="_blank">External Link (HTTPBin)</a></li>
            </ul>
        </div>

        <h2>Sample Content</h2>
        <ul>
            <li>Navigation testing</li>
            <li>Screenshot capture</li>
            <li>Element detection</li>
        </ul>

        <div id="test-content">
            <p>This div has an ID for testing element selection.</p>
        </div>

        <button id="test-button">Test Button</button>
    </div>
</body>
</html>
  `);
});

// Forms page route - pizza order form similar to httpbin
app.get('/forms/post', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pizza Order Form</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .form-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; text-align: center; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input[type="text"], input[type="email"], input[type="tel"], input[type="time"], textarea {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        input[type="text"]:focus, input[type="email"]:focus, input[type="tel"]:focus, textarea:focus {
            border-color: #4CAF50;
            outline: none;
        }
        .radio-group, .checkbox-group { margin: 10px 0; }
        .radio-group label, .checkbox-group label {
            display: inline;
            margin-left: 8px;
            font-weight: normal;
        }
        input[type="radio"], input[type="checkbox"] { margin-right: 5px; }
        fieldset {
            border: 2px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }
        legend {
            font-weight: bold;
            color: #333;
            padding: 0 10px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        button:hover { background-color: #45a049; }
        .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #e8f5e8;
            border-radius: 4px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h1>Pizza Order Form</h1>
        <form id="pizza-form" method="POST" action="/forms/submit">
            <div class="form-group">
                <label for="custname">Customer Name:</label>
                <input type="text" id="custname" name="custname" required>
            </div>

            <div class="form-group">
                <label for="custtel">Phone Number:</label>
                <input type="tel" id="custtel" name="custtel" placeholder="555-123-4567">
            </div>

            <div class="form-group">
                <label for="custemail">Email Address:</label>
                <input type="email" id="custemail" name="custemail" required>
            </div>

            <fieldset>
                <legend>Pizza Size</legend>
                <div class="radio-group">
                    <input type="radio" id="small" name="size" value="small">
                    <label for="small">Small ($10)</label>
                </div>
                <div class="radio-group">
                    <input type="radio" id="medium" name="size" value="medium">
                    <label for="medium">Medium ($15)</label>
                </div>
                <div class="radio-group">
                    <input type="radio" id="large" name="size" value="large">
                    <label for="large">Large ($20)</label>
                </div>
            </fieldset>

            <fieldset>
                <legend>Toppings</legend>
                <div class="checkbox-group">
                    <input type="checkbox" id="bacon" name="topping" value="bacon">
                    <label for="bacon">Bacon (+$2)</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="cheese" name="topping" value="cheese">
                    <label for="cheese">Extra Cheese (+$1)</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="mushroom" name="topping" value="mushroom">
                    <label for="mushroom">Mushrooms (+$1)</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="onion" name="topping" value="onion">
                    <label for="onion">Onions (+$1)</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="pepperoni" name="topping" value="pepperoni">
                    <label for="pepperoni">Pepperoni (+$2)</label>
                </div>
            </fieldset>

            <div class="form-group">
                <label for="delivery">Delivery Time:</label>
                <input type="time" id="delivery" name="delivery">
            </div>

            <div class="form-group">
                <label for="comments">Delivery Instructions:</label>
                <textarea id="comments" name="comments" rows="3" placeholder="Any special delivery instructions..."></textarea>
            </div>

            <button type="submit">Place Order</button>
        </form>

        <div id="result" class="result">
            <h3>Order Submitted Successfully!</h3>
            <p>Thank you for your order. We'll prepare your pizza soon.</p>
        </div>
    </div>

    <script>
        document.getElementById('pizza-form').addEventListener('submit', function(e) {
            e.preventDefault();

            // Show success message
            document.getElementById('result').style.display = 'block';

            // Scroll to result
            document.getElementById('result').scrollIntoView({ behavior: 'smooth' });

            // Optional: Reset form after delay
            setTimeout(() => {
                if (confirm('Reset form?')) {
                    this.reset();
                    document.getElementById('result').style.display = 'none';
                }
            }, 3000);
        });
    </script>
</body>
</html>
  `);
});

// Handle form submission
app.post('/forms/submit', (req, res) => {
    console.log('Form submitted:', req.body);

    res.json({
        success: true,
        message: 'Order received successfully!',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

// Simple contact form for testing
app.get('/contact', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .form-container { max-width: 500px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="form-container">
        <h1>Contact Us</h1>
        <form method="POST" action="/contact/submit">
            <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" required>
            </div>

            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>

            <div class="form-group">
                <label for="subject">Subject:</label>
                <input type="text" id="subject" name="subject">
            </div>

            <div class="form-group">
                <label for="message">Message:</label>
                <textarea id="message" name="message" rows="5" required></textarea>
            </div>

            <button type="submit">Send Message</button>
        </form>
    </div>
</body>
</html>
  `);
});

// Handle contact form submission
app.post('/contact/submit', (req, res) => {
    console.log('Contact form submitted:', req.body);
    res.json({
        success: true,
        message: 'Message sent successfully!',
        data: req.body
    });
});

// About page route
app.get('/about', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - Test Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        p { line-height: 1.6; }
        .content { max-width: 800px; margin: 0 auto; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="content">
        <h1>About This Test Server</h1>
        <p>This is a local test server designed for browser automation testing.</p>
        <p>It provides various endpoints and pages to test different automation scenarios:</p>

        <ul>
            <li><strong>/html</strong> - Basic HTML page with links and elements</li>
            <li><strong>/forms/post</strong> - Pizza order form for testing form interactions</li>
            <li><strong>/contact</strong> - Contact form for additional form testing</li>
            <li><strong>/about</strong> - This about page</li>
        </ul>

        <p><a href="/html">← Back to HTML Test Page</a></p>
        <p><a href="/">← Back to Home</a></p>
    </div>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'browser-automation-test-server'
    });
});

// Root page with links to all test pages
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser Automation Test Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
        .test-links { list-style: none; padding: 0; }
        .test-links li { margin: 10px 0; }
        .test-links a {
            display: inline-block;
            padding: 10px 15px;
            background-color: #f8f9fa;
            text-decoration: none;
            border-radius: 4px;
            color: #333;
            border: 1px solid #ddd;
        }
        .test-links a:hover { background-color: #e9ecef; }
        .info { background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Browser Automation Test Server</h1>

        <div class="info">
            <strong>Server Status:</strong> Running on port ${PORT}<br>
            <strong>Purpose:</strong> Local test server for stable browser automation testing
        </div>

        <h2>Test Pages</h2>
        <ul class="test-links">
            <li><a href="/html">HTML Test Page</a> - Basic HTML content for navigation and screenshot tests</li>
            <li><a href="/forms/post">Pizza Order Form</a> - Complex form with inputs, radio buttons, checkboxes, and textareas</li>
            <li><a href="/contact">Contact Form</a> - Simple contact form for basic form testing</li>
            <li><a href="/health">Health Check</a> - Server health status endpoint</li>
        </ul>

        <h2>Usage in Tests</h2>
        <p>Replace httpbin.org URLs with:</p>
        <ul>
            <li><code>http://localhost:${PORT}/html</code> instead of <code>https://httpbin.org/html</code></li>
            <li><code>http://localhost:${PORT}/forms/post</code> instead of <code>https://httpbin.org/forms/post</code></li>
        </ul>
    </div>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Browser Automation Test Server running on http://localhost:${PORT}`);
    console.log(`📝 Available test pages:`);
    console.log(`   • HTML Test: http://localhost:${PORT}/html`);
    console.log(`   • Pizza Form: http://localhost:${PORT}/forms/post`);
    console.log(`   • Contact Form: http://localhost:${PORT}/contact`);
    console.log(`   • Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down test server...');
    process.exit(0);
});

module.exports = app;
