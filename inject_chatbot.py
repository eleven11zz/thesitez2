#!/usr/bin/env python3
"""
Script to inject the TVMaster VIP Rasa chatbot widget into all HTML files.
Adds the chatbot snippet before the closing </body> tag.
"""

import os
import re
from pathlib import Path

# The chatbot widget snippet to inject
CHATBOT_SNIPPET = '''
<!-- TVMaster VIP Chatbot -->
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
</script>
'''

def should_process_file(filepath):
    """Check if this HTML file should be processed."""
    # Skip files in these directories
    skip_dirs = ['_includes', '_templates', '_config', '.git', '.github', 'node_modules']

    # Check if any skip_dir is in the file path
    for skip_dir in skip_dirs:
        if f'/{skip_dir}/' in str(filepath) or str(filepath).startswith(skip_dir):
            return False

    # Only process .html files
    return filepath.suffix == '.html'

def already_has_chatbot(content):
    """Check if the file already contains the chatbot widget."""
    return 'tvmaster-chat-widget' in content or 'RasaWebchat' in content

def inject_chatbot_widget(filepath):
    """Inject the chatbot widget before the closing body tag."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if already has the chatbot
        if already_has_chatbot(content):
            print(f"  ⏭️  Skipping (already has chatbot): {filepath}")
            return False

        # Check if file has a closing body tag
        if '</body>' not in content:
            print(f"  ⚠️  Skipping (no </body> tag): {filepath}")
            return False

        # Inject the chatbot snippet before </body>
        updated_content = content.replace('</body>', f'{CHATBOT_SNIPPET}\n</body>')

        # Write back to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"  ✅ Injected chatbot: {filepath}")
        return True

    except Exception as e:
        print(f"  ❌ Error processing {filepath}: {e}")
        return False

def main():
    """Main function to process all HTML files."""
    root_dir = Path('.')
    processed_count = 0
    skipped_count = 0

    print("🤖 TVMaster VIP Chatbot Widget Injector")
    print("=" * 60)
    print()

    # Find all HTML files
    html_files = []
    for filepath in root_dir.rglob('*.html'):
        if should_process_file(filepath):
            html_files.append(filepath)

    print(f"Found {len(html_files)} HTML files to process\n")

    # Process each file
    for filepath in sorted(html_files):
        if inject_chatbot_widget(filepath):
            processed_count += 1
        else:
            skipped_count += 1

    print()
    print("=" * 60)
    print(f"✨ Complete! Processed {processed_count} files, skipped {skipped_count} files")

if __name__ == '__main__':
    main()
