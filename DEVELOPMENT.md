# Development Guide

This guide helps developers set up and use the code quality tools for this project.

## 📦 Initial Setup

### 1. Install Node.js and npm

Ensure you have Node.js (version 14 or higher) and npm installed:

```bash
node --version
npm --version
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### 2. Install Dependencies

Install all development dependencies defined in `package.json`:

```bash
npm install
```

This will install:
- **HTMLHint** - HTML validation
- **Stylelint** - CSS linting
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting

## 🚀 Available Commands

### Linting Commands

Run all linters at once:
```bash
npm run lint
```

Run individual linters:
```bash
# HTML validation
npm run lint:html

# CSS linting
npm run lint:css

# JavaScript linting
npm run lint:js
```

### Formatting Commands

Format all code:
```bash
npm run format
```

Check if code is formatted correctly (without modifying files):
```bash
npm run format:check
```

### Combined Commands

Run full audit (linting + format check):
```bash
npm run audit
```

Auto-fix issues where possible:
```bash
npm run fix
```

## 🔧 Editor Integration

### Visual Studio Code

Install these extensions for real-time linting:

1. **HTMLHint** - `mkaufman.htmlhint`
2. **Stylelint** - `stylelint.vscode-stylelint`
3. **ESLint** - `dbaeumer.vscode-eslint`
4. **Prettier** - `esbenp.prettier-vscode`

Add to your `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  }
}
```

### WebStorm / IntelliJ IDEA

1. Go to **Settings** → **Languages & Frameworks**
2. Enable ESLint, Stylelint, and Prettier
3. Enable "Run eslint --fix on save"
4. Enable "Run stylelint --fix on save"

### Sublime Text

Install via Package Control:
1. SublimeLinter
2. SublimeLinter-htmlhint
3. SublimeLinter-stylelint
4. SublimeLinter-eslint
5. JsPrettier

## 📋 Pre-Commit Workflow

Before committing code, run:

```bash
# Check for issues
npm run audit

# Fix auto-fixable issues
npm run fix

# Review remaining issues manually
```

## 🐛 Troubleshooting

### "Command not found" errors

If you get command not found errors:

```bash
# Install tools globally (optional)
npm install -g htmlhint stylelint eslint prettier
```

### Permission errors

On Linux/Mac, you may need to use:

```bash
sudo npm install -g htmlhint stylelint eslint prettier
```

### Linting errors on legacy code

When working with legacy code, you may see many linting errors. Fix them gradually:

1. Fix critical errors first (syntax errors, broken functionality)
2. Fix warnings in files you're actively working on
3. Schedule time to fix remaining warnings

### Stylelint "Unknown rule" error

Install the standard config:

```bash
npm install --save-dev stylelint-config-standard
```

## 📚 Configuration Files

- `.htmlhintrc` - HTML validation rules
- `.stylelintrc.json` - CSS linting rules
- `.eslintrc.json` - JavaScript linting rules
- `.prettierrc` - Code formatting rules
- `.prettierignore` - Files to exclude from formatting

## 🔍 Manual Testing

### HTML Validation

Online: [W3C Validator](https://validator.w3.org/)

### CSS Validation

Online: [W3C CSS Validator](https://jigsaw.w3.org/css-validator/)

### Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Click "Generate report"
4. Aim for 90+ scores in all categories

### Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing

Test on:
- iOS Safari
- Android Chrome
- Various screen sizes using DevTools device emulation

## 📖 Additional Resources

- [CODE_QUALITY_AUDIT.md](./CODE_QUALITY_AUDIT.md) - Comprehensive code quality guide
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - Accessibility guidelines
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance optimization guide

## 💡 Tips

1. **Commit often** - Make small, focused commits
2. **Write descriptive commit messages** - Explain what and why
3. **Test before pushing** - Run `npm run audit` before pushing
4. **Keep dependencies updated** - Run `npm outdated` regularly
5. **Document your code** - Add comments for complex logic
6. **Follow conventions** - Use established patterns in the codebase

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes following code quality standards
3. Run `npm run audit` and fix all issues
4. Test your changes thoroughly
5. Submit a pull request with a clear description

---

**Questions?** Check the [CODE_QUALITY_AUDIT.md](./CODE_QUALITY_AUDIT.md) guide or ask the team!
