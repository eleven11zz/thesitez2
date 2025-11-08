#!/usr/bin/env python3
"""
Generate index.html files for language directories
"""
import os
import shutil

# Language configurations
languages = {
    'de': {
        'lang': 'de',
        'locale': 'de_DE',
        'language_name': 'German',
        'title': 'TVMaster VIP - #1 Premium IPTV Service | 30.000+ Kanäle, 4K Streaming',
        'description': '🏆 Bewertet mit 4,9/5 von 50.000+ Nutzern! TVMaster VIP bietet 30.000+ Live-TV-Kanäle, 3.000+ Sportnetzwerke & 10.000+ Filme in atemberaubendem 4K. Bester IPTV-Anbieter mit sofortiger Aktivierung, 99,9% Verfügbarkeit, ohne Puffern, Mehrgerätezugriff & 24/7 Expertenunterstützung. Starten Sie heute Ihre risikofreie 7-Tage-Testversion!',
        'keywords': 'bester IPTV-Service 2025, Premium IPTV-Anbieter, 4K IPTV-Streaming, Live-TV-Streaming-Service, Sport IPTV-Abonnement, IPTV für Smart TV, Android TV Box IPTV, Multi-Device IPTV, IPTV ohne Puffern, günstige IPTV-Pläne, IPTV vs Kabelfernsehen, internationale IPTV-Kanäle',
    },
    'fr': {
        'lang': 'fr',
        'locale': 'fr_FR',
        'language_name': 'French',
        'title': 'TVMaster VIP - #1 Service IPTV Premium | 30 000+ Chaînes, Streaming 4K',
        'description': '🏆 Noté 4,9/5 par 50 000+ utilisateurs! TVMaster VIP propose 30 000+ chaînes de télévision en direct, 3 000+ réseaux sportifs et 10 000+ films en 4K époustouflant. Meilleur fournisseur IPTV avec activation instantanée, disponibilité de 99,9%, sans mise en mémoire tampon, accès multi-appareils et support expert 24/7. Commencez votre essai gratuit de 7 jours sans risque aujourd\'hui!',
        'keywords': 'meilleur service IPTV 2025, fournisseur IPTV premium, streaming IPTV 4K, service de streaming TV en direct, abonnement IPTV sport, IPTV pour Smart TV, boîtier Android TV IPTV, IPTV multi-appareils, IPTV sans mise en mémoire tampon, forfaits IPTV pas chers, IPTV vs télévision par câble, chaînes IPTV internationales',
    },
    'it': {
        'lang': 'it',
        'locale': 'it_IT',
        'language_name': 'Italian',
        'title': 'TVMaster VIP - #1 Servizio IPTV Premium | 30.000+ Canali, Streaming 4K',
        'description': '🏆 Valutato 4,9/5 da 50.000+ utenti! TVMaster VIP offre 30.000+ canali TV in diretta, 3.000+ reti sportive e 10.000+ film in straordinario 4K. Miglior provider IPTV con attivazione istantanea, uptime del 99,9%, zero buffering, accesso multi-dispositivo e supporto esperto 24/7. Inizia oggi la tua prova gratuita di 7 giorni senza rischi!',
        'keywords': 'miglior servizio IPTV 2025, provider IPTV premium, streaming IPTV 4K, servizio streaming TV in diretta, abbonamento IPTV sport, IPTV per Smart TV, box Android TV IPTV, IPTV multi-dispositivo, IPTV senza buffering, piani IPTV economici, IPTV vs TV via cavo, canali IPTV internazionali',
    },
    'nl': {
        'lang': 'nl',
        'locale': 'nl_NL',
        'language_name': 'Dutch',
        'title': 'TVMaster VIP - #1 Premium IPTV Service | 30.000+ Kanalen, 4K Streaming',
        'description': '🏆 Beoordeeld met 4,9/5 door 50.000+ gebruikers! TVMaster VIP levert 30.000+ live tv-kanalen, 3.000+ sportnetwerken & 10.000+ films in prachtige 4K. Beste IPTV-provider met directe activering, 99,9% uptime, geen buffering, toegang op meerdere apparaten & 24/7 deskundige ondersteuning. Start vandaag nog uw risicovrije proefperiode van 7 dagen!',
        'keywords': 'beste IPTV-service 2025, premium IPTV-provider, 4K IPTV-streaming, live tv-streamingservice, sport IPTV-abonnement, IPTV voor Smart TV, Android TV box IPTV, multi-device IPTV, IPTV zonder buffering, goedkope IPTV-abonnementen, IPTV vs kabeltelevisie, internationale IPTV-kanalen',
    },
    'no': {
        'lang': 'no',
        'locale': 'no_NO',
        'language_name': 'Norwegian',
        'title': 'TVMaster VIP - #1 Premium IPTV-tjeneste | 30 000+ Kanaler, 4K Streaming',
        'description': '🏆 Vurdert 4,9/5 av 50 000+ brukere! TVMaster VIP leverer 30 000+ direkte TV-kanaler, 3 000+ sportnettverk & 10 000+ filmer i fantastisk 4K. Best IPTV-leverandør med øyeblikkelig aktivering, 99,9% oppetid, null buffring, tilgang på flere enheter & 24/7 ekspertstøtte. Start din risikofrie 7-dagers prøveperiode i dag!',
        'keywords': 'beste IPTV-tjeneste 2025, premium IPTV-leverandør, 4K IPTV-streaming, direkte TV-strømmetjeneste, sport IPTV-abonnement, IPTV for Smart TV, Android TV-boks IPTV, flerenhets IPTV, IPTV uten buffring, billige IPTV-planer, IPTV vs kabel-TV, internasjonale IPTV-kanaler',
    },
    'sv': {
        'lang': 'sv',
        'locale': 'sv_SE',
        'language_name': 'Swedish',
        'title': 'TVMaster VIP - #1 Premium IPTV-tjänst | 30 000+ Kanaler, 4K Streaming',
        'description': '🏆 Betygsatt 4,9/5 av 50 000+ användare! TVMaster VIP levererar 30 000+ live-TV-kanaler, 3 000+ sportnätverk & 10 000+ filmer i fantastisk 4K. Bästa IPTV-leverantören med omedelbar aktivering, 99,9% drifttid, noll buffring, åtkomst till flera enheter & 24/7 expertstöd. Starta din riskfria 7-dagars provperiod idag!',
        'keywords': 'bästa IPTV-tjänsten 2025, premium IPTV-leverantör, 4K IPTV-streaming, live-TV-streamingtjänst, sport IPTV-prenumeration, IPTV för Smart TV, Android TV-box IPTV, flerdatorers IPTV, IPTV utan buffring, billiga IPTV-planer, IPTV vs kabel-TV, internationella IPTV-kanaler',
    }
}

def read_template():
    """Read the Thai index.html as a template"""
    with open('th/index.html', 'r', encoding='utf-8') as f:
        return f.read()

def create_lang_index(lang_code, config, template):
    """Create index.html for a specific language"""
    # For now, we'll use the English index as base and update meta tags
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace language-specific elements
    content = content.replace('lang="en"', f'lang="{config["lang"]}"')
    content = content.replace('content="en_US"', f'content="{config["locale"]}"')
    content = content.replace('content="English"', f'content="{config["language_name"]}"')

    # Update canonical URL
    content = content.replace(
        'href="https://web.tvmaster.vip/"',
        f'href="https://web.tvmaster.vip/{lang_code}/"'
    )

    # Update og:url
    content = content.replace(
        '<meta property="og:url" content="https://web.tvmaster.vip/"',
        f'<meta property="og:url" content="https://web.tvmaster.vip/{lang_code}/"'
    )

    # Update twitter:url
    content = content.replace(
        '<meta name="twitter:url" content="https://web.tvmaster.vip/"',
        f'<meta name="twitter:url" content="https://web.tvmaster.vip/{lang_code}/"'
    )

    # Update title
    content = content.replace(
        '<title>TVMaster VIP - #1 Premium IPTV Service | 30,000+ Channels, 4K Streaming, Zero Buffering</title>',
        f'<title>{config["title"]}</title>'
    )

    # Update meta description
    import re
    content = re.sub(
        r'<meta name="description" content="[^"]*"',
        f'<meta name="description" content="{config["description"]}"',
        content
    )

    # Update meta keywords
    content = re.sub(
        r'<meta name="keywords" content="[^"]*"',
        f'<meta name="keywords" content="{config["keywords"]}"',
        content
    )

    # Update og:title
    content = re.sub(
        r'<meta property="og:title" content="[^"]*"',
        f'<meta property="og:title" content="{config["title"]}"',
        content
    )

    # Update og:description
    content = re.sub(
        r'<meta property="og:description" content="[^"]*"',
        f'<meta property="og:description" content="{config["description"]}"',
        content
    )

    # Update twitter:title
    content = re.sub(
        r'<meta name="twitter:title" content="[^"]*"',
        f'<meta name="twitter:title" content="{config["title"]}"',
        content
    )

    # Update twitter:description
    content = re.sub(
        r'<meta name="twitter:description" content="[^"]*"',
        f'<meta name="twitter:description" content="{config["description"]}"',
        content
    )

    # Write the file
    output_path = f'{lang_code}/index.html'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'✅ Created {output_path}')

def main():
    template = read_template()

    for lang_code, config in languages.items():
        create_lang_index(lang_code, config, template)

    print('\n✅ All language index files created successfully!')

if __name__ == '__main__':
    main()
