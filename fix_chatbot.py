#!/usr/bin/env python3
"""
Script to fix the Rasa chatbot widget implementation.
Updates to use the correct rasa-webchat library.
"""

import os
import re
from pathlib import Path

# Old snippet to find and replace
OLD_SNIPPET = '''<!-- TVMaster VIP Chatbot -->
<div id="tvmaster-chat-widget"></div>
<script src="https://unpkg.com/@rasahq/rasa-chat@1.0.1"></script>
<script>
  RasaWebchat.default.init({
    selector: "#tvmaster-chat-widget",
    initPayload: "/greet",
    socketUrl: "https://bot.tvmaster.work",
    socketPath: "/socket.io/",
    title: "TVMaster VIP",
    subtitle: "We're online 24/7",
    showFullScreenButton: true,
    profileAvatar: "https://eleven11zz.github.io/thesitez2/assets/footer_picture.png",
    inputTextFieldHint: "Ask about channels, trials, pricing…",
    customData: { language: "en" },
    params: { storage: "session" },
    tooltipPayload: "/greet",
    tooltipDelay: 2000,
    embedded: false   /* keeps it as a floating launcher */
  });
</script>'''

# New updated snippet with correct library
NEW_SNIPPET = '''<!-- TVMaster VIP Chatbot -->
<script src="https://cdn.jsdelivr.net/npm/rasa-webchat@1.x.x/lib/index.js"></script>
<script>
  window.WebChat.default({
    initPayload: "/greet",
    customData: {"language": "en"},
    socketUrl: "https://bot.tvmaster.work",
    socketPath: "/socket.io/",
    title: "TVMaster VIP",
    subtitle: "We're online 24/7",
    params: {
      storage: "session"
    },
    showFullScreenButton: true,
    profileAvatar: "https://eleven11zz.github.io/thesitez2/assets/footer_picture.png",
    inputTextFieldHint: "Ask about channels, trials, pricing…",
    tooltipPayload: "/greet",
    tooltipDelay: 2000,
    embedded: false
  }, null);
</script>'''

def should_process_file(filepath):
    """Check if this HTML file should be processed."""
    skip_dirs = ['_includes', '_templates', '_config', '.git', '.github', 'node_modules']
    for skip_dir in skip_dirs:
        if f'/{skip_dir}/' in str(filepath) or str(filepath).startswith(skip_dir):
            return False
    return filepath.suffix == '.html'

def fix_chatbot_widget(filepath):
    """Replace old chatbot snippet with new one."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        if OLD_SNIPPET not in content:
            return False

        updated_content = content.replace(OLD_SNIPPET, NEW_SNIPPET)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"  ✅ Updated: {filepath}")
        return True

    except Exception as e:
        print(f"  ❌ Error: {filepath}: {e}")
        return False

def main():
    """Main function to process all HTML files."""
    root_dir = Path('.')
    updated_count = 0

    print("🔧 Fixing TVMaster VIP Chatbot Widget")
    print("=" * 60)
    print()

    html_files = []
    for filepath in root_dir.rglob('*.html'):
        if should_process_file(filepath):
            html_files.append(filepath)

    print(f"Found {len(html_files)} HTML files to check\n")

    for filepath in sorted(html_files):
        if fix_chatbot_widget(filepath):
            updated_count += 1

    print()
    print("=" * 60)
    print(f"✨ Complete! Updated {updated_count} files")

if __name__ == '__main__':
    main()
