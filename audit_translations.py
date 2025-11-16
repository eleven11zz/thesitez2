#!/usr/bin/env python3
"""
Comprehensive Language Translation Audit Script
Analyzes translations in languages.json for completeness, consistency, and quality
"""

import json
import re
from typing import Dict, List, Set, Tuple
from collections import defaultdict

class TranslationAuditor:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.data = None
        self.reference_lang = 'en'
        self.issues = defaultdict(lambda: defaultdict(list))
        self.stats = defaultdict(dict)

    def load_data(self):
        """Load and validate JSON syntax"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            print("✓ JSON syntax is valid\n")
            return True
        except json.JSONDecodeError as e:
            print(f"✗ JSON syntax error: {e}")
            return False

    def get_all_keys(self, obj, prefix=''):
        """Recursively get all keys in a nested dictionary"""
        keys = set()
        if isinstance(obj, dict):
            for key, value in obj.items():
                full_key = f"{prefix}.{key}" if prefix else key
                keys.add(full_key)
                if isinstance(value, dict):
                    keys.update(self.get_all_keys(value, full_key))
        return keys

    def get_nested_value(self, obj, path):
        """Get value from nested dictionary using dot notation"""
        keys = path.split('.')
        value = obj
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None
        return value

    def check_structure(self, lang_code: str, lang_data: Dict) -> Tuple[Set, Set]:
        """Check if language has all required keys from reference language"""
        ref_data = self.data['languages'][self.reference_lang]

        ref_keys = self.get_all_keys(ref_data)
        lang_keys = self.get_all_keys(lang_data)

        missing_keys = ref_keys - lang_keys
        extra_keys = lang_keys - ref_keys

        return missing_keys, extra_keys

    def is_likely_untranslated(self, text: str, lang_code: str) -> bool:
        """Check if text appears to be untranslated (still in English)"""
        if not isinstance(text, str) or not text:
            return False

        # Skip certain fields that should remain in English
        skip_patterns = [
            r'^https?://',  # URLs
            r'@',  # Email addresses
            r'^\+?\d',  # Phone numbers
            r'^TVMaster VIP$',  # Brand name
            r'^24/7',  # Time format
            r'^\d{4}$',  # Years
            r'^[A-Z]{2,}$',  # Acronyms like FAQ, IPTV, 4K
        ]

        for pattern in skip_patterns:
            if re.match(pattern, text):
                return False

        # Common English phrases that might indicate untranslated content
        english_indicators = [
            'Premium IPTV Service', 'Start Streaming', 'All rights reserved',
            'Live Hub', 'TV Guide', 'Setup Guides', 'Global Support',
        ]

        # Check for exact matches of common English phrases (only for suspicious cases)
        for indicator in english_indicators:
            if indicator.lower() in text.lower() and lang_code != 'en':
                # Additional check: if the text is exactly the English version
                return True

        return False

    def check_translations(self, lang_code: str, lang_data: Dict):
        """Check for missing, empty, or suspicious translations"""
        ref_data = self.data['languages'][self.reference_lang]
        ref_keys = self.get_all_keys(ref_data)

        for key in ref_keys:
            ref_value = self.get_nested_value(ref_data, key)
            lang_value = self.get_nested_value(lang_data, key)

            # Skip non-string values
            if not isinstance(ref_value, str):
                continue

            # Check for empty strings
            if lang_value is not None and isinstance(lang_value, str):
                if lang_value.strip() == '':
                    self.issues[lang_code]['empty_translations'].append(key)

                # Check if value is identical to English (suspicious for content fields)
                elif lang_value == ref_value and lang_code != self.reference_lang:
                    # Some fields should be identical (URLs, emails, etc.)
                    if not any(x in key for x in ['url', 'email', 'phone', 'author', 'name', 'hreflang', 'locale', 'path', 'dir']):
                        self.issues[lang_code]['identical_to_english'].append({
                            'key': key,
                            'value': lang_value[:100] + ('...' if len(lang_value) > 100 else '')
                        })

    def check_placeholders(self, lang_code: str, lang_data: Dict):
        """Check for placeholder consistency"""
        ref_data = self.data['languages'][self.reference_lang]
        ref_keys = self.get_all_keys(ref_data)

        placeholder_patterns = [
            r'%s', r'%d', r'%[a-z]',  # printf-style
            r'\{[^}]*\}',  # {placeholder}
            r'\$\{[^}]*\}',  # ${placeholder}
        ]

        for key in ref_keys:
            ref_value = self.get_nested_value(ref_data, key)
            lang_value = self.get_nested_value(lang_data, key)

            if not isinstance(ref_value, str) or not isinstance(lang_value, str):
                continue

            for pattern in placeholder_patterns:
                ref_placeholders = re.findall(pattern, ref_value)
                lang_placeholders = re.findall(pattern, lang_value) if lang_value else []

                if ref_placeholders and ref_placeholders != lang_placeholders:
                    self.issues[lang_code]['placeholder_mismatch'].append({
                        'key': key,
                        'expected': ref_placeholders,
                        'found': lang_placeholders
                    })

    def check_html_tags(self, lang_code: str, lang_data: Dict):
        """Check for HTML tag consistency"""
        ref_data = self.data['languages'][self.reference_lang]
        ref_keys = self.get_all_keys(ref_data)

        for key in ref_keys:
            ref_value = self.get_nested_value(ref_data, key)
            lang_value = self.get_nested_value(lang_data, key)

            if not isinstance(ref_value, str) or not isinstance(lang_value, str):
                continue

            # Find HTML tags
            ref_tags = sorted(re.findall(r'<[^>]+>', ref_value))
            lang_tags = sorted(re.findall(r'<[^>]+>', lang_value)) if lang_value else []

            if ref_tags and ref_tags != lang_tags:
                self.issues[lang_code]['html_tag_mismatch'].append({
                    'key': key,
                    'expected': ref_tags,
                    'found': lang_tags
                })

    def check_special_characters(self, lang_code: str, lang_data: Dict):
        """Check for special characters that might cause issues"""
        ref_keys = self.get_all_keys(lang_data)

        problematic_chars = [
            (r'[\u0000-\u001F]', 'control characters'),
            (r'[\u2028\u2029]', 'line/paragraph separators'),
        ]

        for key in ref_keys:
            value = self.get_nested_value(lang_data, key)

            if not isinstance(value, str):
                continue

            for pattern, desc in problematic_chars:
                if re.search(pattern, value):
                    self.issues[lang_code]['special_characters'].append({
                        'key': key,
                        'issue': desc
                    })

    def audit_language(self, lang_code: str):
        """Perform complete audit of a single language"""
        if lang_code == self.reference_lang:
            return

        lang_data = self.data['languages'][lang_code]

        # Check structure
        missing_keys, extra_keys = self.check_structure(lang_code, lang_data)
        if missing_keys:
            self.issues[lang_code]['missing_keys'] = sorted(list(missing_keys))
        if extra_keys:
            self.issues[lang_code]['extra_keys'] = sorted(list(extra_keys))

        # Check translations
        self.check_translations(lang_code, lang_data)

        # Check placeholders
        self.check_placeholders(lang_code, lang_data)

        # Check HTML tags
        self.check_html_tags(lang_code, lang_data)

        # Check special characters
        self.check_special_characters(lang_code, lang_data)

        # Calculate stats
        total_keys = len(self.get_all_keys(lang_data))
        issue_count = sum(len(v) if isinstance(v, list) else 1 for v in self.issues[lang_code].values())

        self.stats[lang_code] = {
            'total_keys': total_keys,
            'issue_count': issue_count,
            'has_issues': issue_count > 0
        }

    def run_audit(self):
        """Run complete audit on all languages"""
        if not self.load_data():
            return

        languages = self.data['languages']
        print(f"Reference Language: {self.reference_lang} (English)")
        print(f"Languages to audit: {', '.join([k for k in languages.keys() if k != self.reference_lang])}\n")
        print("="*80)
        print("STARTING COMPREHENSIVE AUDIT")
        print("="*80)

        for lang_code in languages:
            if lang_code != self.reference_lang:
                print(f"\nAuditing {lang_code} ({languages[lang_code]['name']})...")
                self.audit_language(lang_code)

        self.print_report()

    def print_report(self):
        """Print comprehensive audit report"""
        print("\n\n")
        print("="*80)
        print("AUDIT REPORT")
        print("="*80)

        # Overall summary
        print("\n" + "─"*80)
        print("OVERALL SUMMARY")
        print("─"*80)

        languages_with_issues = [k for k, v in self.stats.items() if v['has_issues']]
        languages_without_issues = [k for k, v in self.stats.items() if not v['has_issues']]

        total_langs = len(self.stats)
        passed = len(languages_without_issues)
        failed = len(languages_with_issues)

        print(f"\nTotal Languages Audited: {total_langs}")
        print(f"✓ Passed (No Issues): {passed}")
        print(f"✗ Failed (Has Issues): {failed}")

        if languages_without_issues:
            print(f"\nLanguages with NO issues: {', '.join(languages_without_issues)}")

        if languages_with_issues:
            print(f"\nLanguages with issues: {', '.join(languages_with_issues)}")

        # Detailed reports for each language with issues
        for lang_code in sorted(languages_with_issues):
            lang_name = self.data['languages'][lang_code]['name']
            print(f"\n\n{'='*80}")
            print(f"DETAILED REPORT: {lang_code.upper()} ({lang_name})")
            print(f"{'='*80}")

            issues = self.issues[lang_code]

            # Missing keys
            if 'missing_keys' in issues and issues['missing_keys']:
                print(f"\n⚠ MISSING KEYS ({len(issues['missing_keys'])})")
                print("─"*80)
                for i, key in enumerate(issues['missing_keys'], 1):
                    print(f"  {i}. {key}")

            # Extra keys
            if 'extra_keys' in issues and issues['extra_keys']:
                print(f"\n⚠ EXTRA KEYS ({len(issues['extra_keys'])})")
                print("─"*80)
                for i, key in enumerate(issues['extra_keys'], 1):
                    print(f"  {i}. {key}")

            # Empty translations
            if 'empty_translations' in issues and issues['empty_translations']:
                print(f"\n⚠ EMPTY TRANSLATIONS ({len(issues['empty_translations'])})")
                print("─"*80)
                for i, key in enumerate(issues['empty_translations'], 1):
                    print(f"  {i}. {key}")

            # Identical to English (suspicious)
            if 'identical_to_english' in issues and issues['identical_to_english']:
                print(f"\n⚠ IDENTICAL TO ENGLISH (Potentially Untranslated) ({len(issues['identical_to_english'])})")
                print("─"*80)
                for i, item in enumerate(issues['identical_to_english'], 1):
                    print(f"  {i}. {item['key']}")
                    print(f"     Value: {item['value']}")

            # Placeholder mismatches
            if 'placeholder_mismatch' in issues and issues['placeholder_mismatch']:
                print(f"\n⚠ PLACEHOLDER MISMATCHES ({len(issues['placeholder_mismatch'])})")
                print("─"*80)
                for i, item in enumerate(issues['placeholder_mismatch'], 1):
                    print(f"  {i}. {item['key']}")
                    print(f"     Expected: {item['expected']}")
                    print(f"     Found: {item['found']}")

            # HTML tag mismatches
            if 'html_tag_mismatch' in issues and issues['html_tag_mismatch']:
                print(f"\n⚠ HTML TAG MISMATCHES ({len(issues['html_tag_mismatch'])})")
                print("─"*80)
                for i, item in enumerate(issues['html_tag_mismatch'], 1):
                    print(f"  {i}. {item['key']}")
                    print(f"     Expected: {item['expected']}")
                    print(f"     Found: {item['found']}")

            # Special characters
            if 'special_characters' in issues and issues['special_characters']:
                print(f"\n⚠ SPECIAL CHARACTER ISSUES ({len(issues['special_characters'])})")
                print("─"*80)
                for i, item in enumerate(issues['special_characters'], 1):
                    print(f"  {i}. {item['key']}")
                    print(f"     Issue: {item['issue']}")

            # Summary for this language
            total_issues = sum(len(v) if isinstance(v, list) else 1 for v in issues.values())
            print(f"\n{'─'*80}")
            print(f"Total Issues for {lang_code}: {total_issues}")

        # Final summary
        print(f"\n\n{'='*80}")
        print("AUDIT COMPLETE")
        print(f"{'='*80}")

        if failed == 0:
            print("\n✓ All languages passed the audit! No issues found.")
        else:
            print(f"\n✗ {failed} language(s) have issues that need attention.")
            print(f"✓ {passed} language(s) have no issues.")


if __name__ == '__main__':
    auditor = TranslationAuditor('/home/user/thesitez2/_config/languages.json')
    auditor.run_audit()
