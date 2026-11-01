// =============================================================================
// Traduction turque (session d'Eray). Clé = texte français d'origine.
// =============================================================================

export const TR_STRINGS = {
  // Quiz
  "Ta réponse n'a pas pu être enregistrée. Vérifie ta connexion et réessaie.":
    'Cevabın kaydedilemedi. İnternet bağlantını kontrol edip tekrar dene.',
  'Choisis une réponse pour continuer.': 'Devam etmek için bir cevap seç.',
  'Enregistré': 'Kaydedildi',
  'Enregistrement…': 'Kaydediliyor…',
  'Question précédente': 'Önceki soru',
  'Progression du questionnaire': 'Anket ilerlemesi',
  'Écris ton message ici…': 'Mesajını buraya yaz…',
  'Visible par tous sur le mur des messages · facultatif': 'Mesaj duvarında herkes görebilir · isteğe bağlı',
  'Voir les résultats': 'Sonuçları gör',
  'Continuer': 'Devam',
  'Plusieurs choix possibles': 'Birden fazla seçebilirsin',
  ' · facultatif': ' · isteğe bağlı',
  'Facultatif, tu peux passer.': 'İsteğe bağlı, geçebilirsin.',

  // Tableau de bord
  'Les votes.': 'Oylar.',
  'Chargement des réponses…': 'Cevaplar yükleniyor…',
  'En direct': 'Canlı',
  'Démo locale': 'Yerel demo',
  'Le week-end': 'Hafta sonu',
  'Pas encore de vote': 'Henüz oy yok',
  "Égalité pour l'instant": 'Şimdilik berabere',
  'En tête pour le moment.': 'Şu an önde.',
  'Ton vote peut faire la différence.': 'Senin oyun fark yaratabilir.',
  'Le reste des votes': 'Diğer oylar',
  'Le mur des messages': 'Mesaj duvarı',
  "Aucun message pour l'instant. Laisse le premier depuis « Mes réponses ».":
    'Henüz mesaj yok. İlk mesajı « Cevaplarım » kısmından bırak.',
  'Toi': 'Sen',
  'Ils ont répondu': 'Cevap verenler',
  "Personne n'a encore répondu. Les prénoms apparaîtront ici.": 'Henüz kimse cevap vermedi. İsimler burada görünecek.',
  'Invité(e)': 'Davetli',

  // Navigation / barre du haut
  'Votes': 'Oylar',
  'Mes réponses': 'Cevaplarım',
  'Mon intro': 'İntrom',
  'Bonsoir,': 'İyi akşamlar,',
  'Salut,': 'Selam,',
  'Se déconnecter': 'Çıkış yap',
  'Retour au site': 'Siteye dön',
  'Espace organisateur': 'Organizatör alanı'
};

// Mots qui suivent un nombre (pas de pluriel en turc après un nombre)
export const TR_WORDS = { vote: 'oy', message: 'mesaj', réponse: 'cevap' };

// Questions du vrai quiz, par identifiant (les réponses enregistrées ne changent pas)
export const TR_QUESTIONS = {
  q_date: {
    title: 'Doğum günümü hangi hafta sonu kutlayalım?',
    subtitle: '💡 Bilgin olsun: 25 Aralık Cuma ve 1 Ocak Cuma Fransa\'da resmi tatil! Uzun bir hafta sonu için birebir 🥂',
    badge: 'Öncelikli oy ⭐',
    options: {
      '19_dec': { label: '19 Aralık hafta sonu', sublabel: '19 Aralık Cumartesi & 20 Aralık Pazar' },
      '25_dec': { label: '25 Aralık hafta sonu', sublabel: '25 Aralık Cuma (Tatil / Noel) – 27 Aralık Pazar', badge: '25 Cuma tatil! 🎄' },
      '01_jan': { label: '1 Ocak hafta sonu', sublabel: '1 Ocak Cuma (Tatil / Yılbaşı) – 3 Ocak Pazar', badge: '1 Cuma tatil! 🎉' },
      any: { label: 'Hepsi olur!', sublabel: 'Çoğunluğa uyarım, her türlü varım' }
    }
  },
  q_city: {
    title: 'Parti Paris\'te mi olsun, Strazburg\'da mı?',
    subtitle: 'Masada iki seçenek var! Sana en uygun olana oy ver.',
    badge: 'Konum 📍',
    options: {
      paris: { label: 'Paris', sublabel: 'Başkent havası, popüler barlar, rooftop & gece hayatı 🗼' },
      strasbourg: { label: 'Strazburg', sublabel: 'Alsas eğlencesi, kış masalı & samimiyet 🥨' },
      both: { label: 'İkisi de olur, gelirim!', sublabel: 'Paris de olur Strazburg da, fark etmez!' }
    }
  },
  q_theme: {
    title: 'Hangi parti teması seni daha çok heyecanlandırıyor?',
    subtitle: 'Bütün gece içinde kaybolmak istediğin evrene oy ver!',
    badge: 'Gecenin teması 🎭',
    options: {
      gaming: { label: 'Video Oyunları & Gaming', sublabel: 'Oyun kostümleri, retro turnuvalar & geek şarkılar 🎮' },
      horror: { label: 'Korku & Gerilim', sublabel: 'Perili köşk, gizem, zombiler & çığlıklar 👻' },
      cinema: { label: 'Sinema, Diziler & Hollywood', sublabel: 'Kırmızı halı, efsane karakterler & patlamış mısır 🎬' },
      anime: { label: 'Manga, Anime & Neo-Tokyo', sublabel: 'Efsane shonenler, Japon cyberpunk & cosplay ⛩️' },
      y2k_2000s: { label: '2000\'ler & Retro Y2K', sublabel: 'Pop nostaljisi, bol pantolonlar, disko topları & retro hitler 🪩' },
      free: { label: 'Serbest gece / Hepsi olur!', sublabel: 'Kıyafet kuralı umurumda değil, her türlü varım! ✨' }
    }
  },
  q_presence: {
    title: 'Benimle kutlamaya gelecek misin?',
    subtitle: 'Kadeh kaldırıp ortalığı yakmak için orada olabilecek misin, söyle.',
    options: {
      yes: { label: '%100 oradayım!', sublabel: 'Dünyalar verseler kaçırmam 🥳' },
      maybe: { label: 'Belki / Sana hemen dönerim', sublabel: 'Programımı netleştirmem lazım 🤞' },
      no: { label: 'Maalesef gelemiyorum 😢', sublabel: 'Aklım sizinle olacak' }
    }
  },
  q_drinks: {
    title: 'Bar tarafında sana ne verelim?',
    subtitle: 'Gece boyunca içmekten keyif alacağın her şeyi seç.',
    options: {
      cocktails: { label: 'Kokteyller & Long drinkler', sublabel: 'Mojito, Spritz, Cin Tonik...' },
      beers: { label: 'Soğuk bira & Elma şarabı', sublabel: 'Sarışın, IPA, butik...' },
      wine: { label: 'Kırmızı, beyaz ya da köpüklü şarap', sublabel: 'Şampanya, Prosecco...' },
      shots: { label: 'Shotlar', sublabel: 'Tekila, Jäger, aromalı rom...' },
      soft: { label: 'Alkolsüz / Mocktail', sublabel: 'Gazozlar, taze meyve suları, meyveli mocktailler...' }
    }
  },
  q_food: {
    title: 'Büfe ve atıştırmalık tercihlerin?',
    subtitle: 'Herkesin kısıtlama olmadan doyması için.',
    options: {
      apero: { label: 'Meze tabakları & Tapas', sublabel: 'Şarküteri, olgun peynirler, ezmeler...' },
      street_food: { label: 'Sokak lezzetleri & Finger food', sublabel: 'Mini burgerler, pizzalar, samsalar...' },
      veggie: { label: 'Vejetaryen / Vegan', sublabel: '%100 bitkisel ve lezzetli' },
      gluten_free: { label: 'Glutensiz / Alerjiler', sublabel: 'Uygun seçenekler hazırlanmalı' },
      sweet: { label: 'Tatlı takımı', sublabel: 'Pastalar, şekerler, çikolata...' }
    }
  },
  q_music: {
    title: 'Dans pisti için hangi müzik?',
    subtitle: 'Gecenin ideal çalma listesi için demokratik bir oylama.',
    options: {
      urban: { label: 'Fransız & Amerikan Rap, Hip-Hop, R&B', sublabel: 'Klasikler ve anın hitleri' },
      pop_2000: { label: '2000\'ler & Pop nostaljisi', sublabel: 'Herkesin ezbere bildiği nakaratlar' },
      electro: { label: 'Elektro, House & Tekno', sublabel: 'Sabaha kadar dans için ağır ritim' },
      afro_latino: { label: 'Afrobeats, Reggaeton & Latin', sublabel: 'Güneşli ve hareketli havalar' }
    }
  },
  q_message: {
    title: 'Jibril\'e tatlı bir söz, çalma listesi için bir şarkı ya da bir meydan okuma?',
    subtitle: 'Bu mesaj davetlilerin Altın Duvarı\'nda görünecek!',
    placeholder: 'Örn: Seninle kutlamak için sabırsızlanıyorum! Hoparlörden şu şarkıyı patlat ve düelloya hazırlan...'
  }
};
