# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

The Agent team and community take security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability?

If you believe you have found a security vulnerability in The Agent, please report it to us through coordinated disclosure.

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please send an email to security@nuraly.co with the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 2 business days.
- **Updates**: We will send you regular updates about our progress, at least every 5 business days.
- **Timeline**: We aim to resolve critical vulnerabilities within 7 days and other vulnerabilities within 30 days.
- **Disclosure**: Once we've resolved the vulnerability, we may ask you to test the fix. We'll credit you in our security advisory unless you prefer to remain anonymous.

### Security Update Process

1. **Receive vulnerability report**
2. **Confirm the problem and determine affected versions**
3. **Audit code to find any similar problems**
4. **Prepare fixes for all supported versions**
5. **Release new versions with security patches**
6. **Publish security advisory**

## Security Best Practices

When using The Agent, we recommend following these security best practices:

### Environment Configuration

- **API Keys**: Store AI provider API keys securely using environment variables
- **Access Control**: Limit browser automation to trusted domains when possible
- **Network Security**: Run automation in isolated environments for untrusted content
- **Resource Limits**: Set appropriate timeouts and resource limits

### Browser Security

- **Sandboxing**: Use browser sandboxing features when available
- **Content Security**: Be cautious when automating interactions with untrusted web content
- **Data Handling**: Avoid logging or storing sensitive data from automated sessions
- **Update Dependencies**: Keep browser adapters and dependencies up to date

### AI Provider Security

- **API Key Management**: Rotate API keys regularly and use least-privilege access
- **Input Validation**: Validate and sanitize inputs to AI providers
- **Output Filtering**: Review AI-generated actions before execution in sensitive environments
- **Provider Isolation**: Use different API keys for different environments (dev/staging/prod)

## Known Security Considerations

### Browser Automation Risks

- **Code Injection**: Malicious websites could potentially inject code into automation scripts
- **Data Exposure**: Automated browsers may expose sensitive information
- **Resource Exhaustion**: Uncontrolled automation could lead to resource exhaustion

### AI Provider Risks

- **Prompt Injection**: Malicious prompts could potentially affect AI behavior
- **Data Leakage**: AI providers may log or store input data
- **Model Limitations**: AI models may generate unsafe or inappropriate actions

### Mitigation Strategies

- Use headless browsers in production environments
- Implement proper input validation and sanitization
- Use rate limiting and resource constraints
- Monitor automation activities and logs
- Regular security audits and dependency updates

## Vulnerability Disclosure Policy

We support responsible disclosure of security vulnerabilities. We commit to:

- Working with security researchers to verify and address reported vulnerabilities
- Providing credit to researchers who help improve our security (unless they prefer anonymity)
- Not pursuing legal action against researchers who follow responsible disclosure practices
- Keeping researchers informed throughout the process

## Contact

For security-related questions that don't involve vulnerabilities, you can reach us at:

- **Email**: security@nuraly.co
- **General Issues**: [GitHub Issues](https://github.com/Nuralyio/the-agent/issues)
- **Community**: [GitHub Discussions](https://github.com/Nuralyio/the-agent/discussions)

---

Thank you for helping keep The Agent and our users safe!
