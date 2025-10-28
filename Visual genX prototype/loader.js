<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AccessX Demo - Automated Accessibility Enhancement</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f7fa;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 40px;
            background: linear-gradient(90deg, #3498db 0%, transparent 100%);
            padding: 10px;
            color: white;
            border-radius: 4px;
        }
        .demo-section {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .example {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            border-radius: 4px;
        }
        .code {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
            overflow-x: auto;
        }
        .icon {
            display: inline-block;
            width: 24px;
            height: 24px;
            background: #3498db;
            border-radius: 50%;
            margin: 0 5px;
            vertical-align: middle;
        }
        .btn {
            background: #3498db;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .btn:hover {
            background: #2980b9;
        }
        .form-group {
            margin: 15px 0;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        input, textarea, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        .error {
            border-color: #e74c3c;
        }
        .ax-error-message {
            color: #e74c3c;
            font-size: 14px;
            margin-top: 5px;
            display: block;
        }
        .ax-help-text {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 5px;
            display: block;
        }
        .ax-char-count {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 5px;
            display: block;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #ecf0f1;
            font-weight: 600;
        }
        th[ax-sortable] {
            cursor: pointer;
            position: relative;
        }
        th[ax-sortable]::after {
            content: ' â†•';
            color: #7f8c8d;
        }
        th[aria-sort="ascending"]::after {
            content: ' â†‘';
            color: #3498db;
        }
        th[aria-sort="descending"]::after {
            content: ' â†“';
            color: #3498db;
        }
        .modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 500px;
            z-index: 1000;
        }
        .modal.active {
            display: block;
        }
        .modal-backdrop {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        }
        .modal-backdrop.active {
            display: block;
        }
        .status-message {
            padding: 10px;
            background: #2ecc71;
            color: white;
            border-radius: 4px;
            margin: 10px 0;
        }
        .nav-menu {
            background: #34495e;
            padding: 0;
            border-radius: 4px;
        }
        .nav-menu a {
            display: inline-block;
            padding: 10px 20px;
            color: white;
            text-decoration: none;
        }
        .nav-menu a:hover {
            background: #2c3e50;
        }
        .nav-menu a[aria-current="page"] {
            background: #3498db;
        }
    </style>
</head>
<body>
    <!-- Skip Link (auto-generated) -->
    <div ax-enhance="skipLink" ax-target="#main"></div>

    <h1>AccessX Demo - Automated Accessibility</h1>
    <p>Demonstrating how simple HTML attributes can automatically enhance accessibility compliance.</p>

    <!-- Navigation with automatic ARIA -->
    <nav class="nav-menu" ax-enhance="nav" ax-label="Main Navigation" ax-current="true">
        <a href="/">Home</a>
        <a href="/demo.html">Demo</a>
        <a href="#features">Features</a>
        <a href="#contact">Contact</a>
    </nav>

    <main id="main" ax-enhance="landmark" ax-role="main">

        <!-- Screen Reader Announcements -->
        <div class="demo-section">
            <h2>Screen Reader Support</h2>

            <div class="example">
                <h3>Automatic Screen Reader Text</h3>
                <p>Price: <span ax-enhance="srOnly" ax-sr-text="Twenty-five dollars">$25.00</span></p>
                <p>Icons with meaning:
                    <span class="icon icon-home" ax-enhance="label" ax-type="icon" ax-meaning="Home"></span>
                    <span class="icon icon-search" ax-enhance="label" ax-type="icon" ax-meaning="Search"></span>
                    <span class="icon icon-user" ax-enhance="label" ax-type="icon" ax-meaning="User Profile"></span>
                </p>
            </div>

            <div class="example">
                <h3>Abbreviations & Complex Content</h3>
                <p>Our <span ax-enhance="label" ax-type="abbreviation" ax-full="Application Programming Interface">API</span> serves over
                   <span ax-enhance="label" ax-type="auto" ax-label="One million requests">1M</span> requests daily.</p>
                <p>Meeting scheduled for <span ax-enhance="label" ax-type="date">2024-03-15</span></p>
                <p>Success rate: <span ax-enhance="label" ax-type="percentage">99.9%</span></p>
            </div>
        </div>

        <!-- Live Regions -->
        <div class="demo-section">
            <h2>Live Regions & Dynamic Content</h2>

            <div class="example">
                <h3>Status Updates (Polite)</h3>
                <div id="status" class="status-message" ax-enhance="live" ax-priority="polite" ax-status="true">
                    Status: Ready
                </div>
                <button onclick="updateStatus()">Update Status</button>
            </div>

            <div class="example">
                <h3>Critical Alerts (Assertive)</h3>
                <div id="alert" ax-enhance="live" ax-priority="assertive" ax-alert="true"></div>
                <button onclick="showAlert()">Trigger Alert</button>
            </div>
        </div>

        <!-- Form Accessibility -->
        <div class="demo-section">
            <h2>Form Field Enhancement</h2>

            <form>
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email"
                           id="email"
                           ax-enhance="field"
                           ax-required="true"
                           ax-help="We'll never share your email"
                           placeholder="user@example.com">
                </div>

                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text"
                           id="username"
                           ax-enhance="field"
                           ax-error="Username already taken"
                           ax-invalid="true"
                           class="error">
                </div>

                <div class="form-group">
                    <label for="bio">Biography</label>
                    <textarea id="bio"
                              maxlength="200"
                              ax-enhance="field"
                              ax-show-count="true"
                              ax-help="Tell us about yourself"
                              rows="4"></textarea>
                </div>

                <div class="form-group">
                    <label for="country">Country</label>
                    <select id="country" ax-enhance="field" ax-required="true">
                        <option value="">Select a country</option>
                        <option value="us">United States</option>
                        <option value="uk">United Kingdom</option>
                        <option value="ca">Canada</option>
                    </select>
                </div>
            </form>
        </div>

        <!-- Interactive Elements -->
        <div class="demo-section">
            <h2>Interactive Elements</h2>

            <div class="example">
                <h3>Accessible Buttons</h3>

                <!-- Non-button elements as buttons -->
                <div class="btn"
                     ax-enhance="button"
                     onclick="alert('Clicked!')">
                    Div as Button
                </div>

                <!-- Toggle button -->
                <button class="btn"
                        ax-enhance="button"
                        ax-pressed="false"
                        onclick="toggleButton(this)">
                    Toggle Feature
                </button>

                <!-- Loading state -->
                <button class="btn"
                        id="loadingBtn"
                        ax-enhance="button"
                        onclick="simulateLoading(this)">
                    Submit
                </button>
            </div>
        </div>

        <!-- Data Tables -->
        <div class="demo-section">
            <h2>Accessible Tables</h2>

            <table ax-enhance="table"
                   ax-caption="Quarterly Sales Report"
                   ax-auto-headers="true"
                   ax-row-headers="true">
                <tr>
                    <td>Product</td>
                    <td ax-sortable="true">Q1 Sales</td>
                    <td ax-sortable="true">Q2 Sales</td>
                    <td ax-sortable="true">Q3 Sales</td>
                    <td ax-sortable="true">Q4 Sales</td>
                </tr>
                <tr>
                    <td>Widget A</td>
                    <td>$45,000</td>
                    <td>$52,000</td>
                    <td>$48,000</td>
                    <td>$61,000</td>
                </tr>
                <tr>
                    <td>Widget B</td>
                    <td>$38,000</td>
                    <td>$41,000</td>
                    <td>$44,000</td>
                    <td>$47,000</td>
                </tr>
                <tr>
                    <td>Widget C</td>
                    <td>$22,000</td>
                    <td>$25,000</td>
                    <td>$28,000</td>
                    <td>$35,000</td>
                </tr>
            </table>
        </div>

        <!-- Images -->
        <div class="demo-section">
            <h2>Image Accessibility</h2>

            <div class="example">
                <h3>Decorative vs Informative</h3>

                <!-- Decorative image -->
                <img src="decoration.jpg" ax-enhance="image" ax-decorative="true">

                <!-- Informative image with description -->
                <img src="chart.jpg"
                     alt="Sales chart"
                     ax-enhance="image"
                     ax-description="Bar chart showing 40% increase in sales from Q1 to Q4, with steady growth each quarter">
            </div>
        </div>

        <!-- Modal Dialog -->
        <div class="demo-section">
            <h2>Modal Dialogs</h2>

            <button class="btn" onclick="openModal()">Open Accessible Modal</button>

            <div class="modal-backdrop" id="backdrop"></div>
            <div class="modal"
                 id="modal"
                 ax-enhance="modal"
                 ax-trap-focus="true"
                 ax-close-on-escape="true">
                <h2>Accessible Modal</h2>
                <p>This modal has automatic focus management and keyboard navigation.</p>
                <label for="modalInput">Your Input:</label>
                <input type="text" id="modalInput">
                <br><br>
                <button class="btn" onclick="closeModal()">Close</button>
            </div>
        </div>

        <!-- Focus Management -->
        <div class="demo-section">
            <h2>Focus Management</h2>

            <div class="example">
                <h3>Enhanced Focus Indicators</h3>
                <button class="btn" ax-enhance="focus" ax-enhance="true">Enhanced Focus</button>
                <input type="text" ax-enhance="focus" placeholder="Tab to see enhanced focus">
            </div>

            <div class="example">
                <h3>Focus Trap Navigation</h3>
                <div ax-enhance="focus" ax-trap="true" ax-selector=".nav-item">
                    <div class="nav-item" tabindex="0">Item 1 (Use arrows)</div>
                    <div class="nav-item" tabindex="0">Item 2</div>
                    <div class="nav-item" tabindex="0">Item 3</div>
                    <div class="nav-item" tabindex="0">Item 4</div>
                </div>
            </div>
        </div>

        <!-- Dynamic Announcements -->
        <div class="demo-section">
            <h2>Dynamic Announcements</h2>

            <button class="btn" onclick="makeAnnouncement('Your changes have been saved', 'polite')">
                Polite Announcement
            </button>
            <button class="btn" onclick="makeAnnouncement('Error: Invalid input', 'assertive')">
                Assertive Announcement
            </button>
        </div>

    </main>

    <script src="accessx.js"></script>
    <script>
        // Demo functions
        function updateStatus() {
            const status = document.getElementById('status');
            const messages = [
                'Processing your request...',
                'Almost done...',
                'Success! Operation completed.',
                'Ready for next action.'
            ];
            const random = messages[Math.floor(Math.random() * messages.length)];
            status.textContent = `Status: ${random}`;
        }

        function showAlert() {
            const alert = document.getElementById('alert');
            alert.textContent = 'Critical: System requires immediate attention!';
            setTimeout(() => alert.textContent = '', 3000);
        }

        function toggleButton(btn) {
            const pressed = btn.getAttribute('aria-pressed') === 'true';
            btn.setAttribute('aria-pressed', !pressed);
            btn.textContent = pressed ? 'Feature Off' : 'Feature On';
        }

        function simulateLoading(btn) {
            btn.setAttribute('ax-loading', 'true');
            btn.setAttribute('aria-busy', 'true');
            btn.setAttribute('aria-disabled', 'true');
            btn.textContent = 'Loading...';
            btn.disabled = true;

            setTimeout(() => {
                btn.removeAttribute('ax-loading');
                btn.setAttribute('aria-busy', 'false');
                btn.setAttribute('aria-disabled', 'false');
                btn.textContent = 'Submit';
                btn.disabled = false;
                makeAnnouncement('Form submitted successfully!', 'polite');
            }, 2000);
        }

        function openModal() {
            const modal = document.getElementById('modal');
            const backdrop = document.getElementById('backdrop');
            modal.classList.add('active');
            backdrop.classList.add('active');
            modal.querySelector('input').focus();
        }

        function closeModal() {
            const modal = document.getElementById('modal');
            const backdrop = document.getElementById('backdrop');
            modal.classList.remove('active');
            backdrop.classList.remove('active');
        }

        function makeAnnouncement(message, priority) {
            AccessX.announce(message, priority);
        }

        // Add some dynamic content after load
        setTimeout(() => {
            const dynamicDiv = document.createElement('div');
            dynamicDiv.className = 'demo-section';
            dynamicDiv.innerHTML = `
                <h2>Dynamically Added Content</h2>
                <p>This content was added after page load and is automatically enhanced!</p>
                <button ax-enhance="button">Dynamic Button</button>
                <span ax-enhance="label" ax-type="abbreviation" ax-full="Artificial Intelligence">AI</span>
            `;
            document.querySelector('main').appendChild(dynamicDiv);
        }, 3000);
    </script>
</body>
</html>