// =============================================================================
// FAUX QUIZ D'ERAY (avant le vrai quiz)
// -----------------------------------------------------------------------------
// wrong : la réponse qui déclenche "Yazıklar olsun!" (la honte) puis le renvoi
//         sur Google. 'no' = Hayır, 'yes' = Evet, null = jamais renvoyé
//         (le site le chambre simplement, quelle que soit la réponse).
// search : ce qui est tapé dans Google quand il est renvoyé.
// yes / no : petite réaction affichée quand la réponse est acceptée.
// =============================================================================

export const TROLL_QUESTIONS = [
  {
    id: 'turk',
    question: 'Türk müsün?',
    wrong: 'no',
    search: 'nasıl türk olunur',
    yes: 'Tabii ki Türksün! 🇹🇷',
    shame: 'Türk olmayan bu siteye giremez.'
  },
  {
    id: 'kebap',
    question: 'Kebap sever misin?',
    wrong: 'no',
    search: 'kebap neden bu kadar güzel',
    yes: 'Aferin! Doğru cevap 🥙',
    shame: 'Kebap sevmeyen Türk mü olur?!'
  },
  {
    id: 'erdogan',
    question: 'Erdoğan hükümetini destekliyor musun?',
    wrong: null,
    search: 'türkiye siyaset',
    yes: 'Tamam abi, not edildi 🫡',
    no: 'Tamam abi, not edildi 📝',
    shame: 'Bu cevap kabul edilemez.'
  },
  {
    id: 'gay',
    question: 'Gay misin?',
    wrong: null,
    search: 'gay',
    yes: 'Not edildi kanka 🌈 Devam!',
    no: 'Not edildi kanka 📝 Devam!',
    shame: 'Bu cevap kabul edilemez.'
  },
  {
    id: 'biyik',
    question: 'Bıyığın var mı?',
    wrong: 'no',
    search: 'bıyık nasıl hızlı uzar',
    yes: 'İşte gerçek bir Türk bıyığı! 🥸',
    shame: 'Bıyıksız Türk olmaz kardeşim.'
  }
];
