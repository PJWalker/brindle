/* One-shot player material for Brindlewood Bay.
   Rules text is paraphrased from the rulebook; check your copy. Lines marked "tip" are suggestions, not rules.
   House rules for one-shots are listed in TABLE_RULES and flagged in docs/oneshot.md. */

window.ONESHOT = {
  /* ---------- Basic moves (back of every playbook) ---------- */
  basics: [
    {
      col: 1, name: "Playing the game",
      body: [
        ["p", "<b>Talking is free.</b> Chat, look around, ask questions: no roll."],
        ["p", "A move happens when what you do matches its trigger. <b>Say what you do and which ability you lean on, then roll.</b>"],
        ["p", "Roll 2d6 + ability. <b>6−</b> miss · <b>7–9</b> partial · <b>10+</b> hit · <b>12+</b> extra."],
        ["p", "<b>Advantage:</b> roll 3d6, keep the best two. <b>Disadvantage:</b> keep the worst two. They cancel out and never stack."],
      ],
    },
    {
      col: 1, name: "Abilities",
      body: [
        ["dl", [
          ["Vitality", "strength, speed, stamina"],
          ["Composure", "steady hands, a cool head, a straight face"],
          ["Reason", "books, research, examining a scene"],
          ["Presence", "charm, intimidation, holding a room"],
          ["Sensitivity", "the occult and uncanny. The Keeper may swap it in when something strange is afoot"],
        ]],
      ],
    },
    {
      col: 1, name: "Day Move",
      trigger: "When you do something risky or face something you fear by daylight, say what you're afraid will happen, then roll +ability.",
      results: [
        ["10+", "You do it, or hold steady."],
        ["7–9", "The Keeper says how it would leave you exposed. Back down, or go through with it."],
        ["12+", "As 10+, and the Keeper adds a benefit."],
      ],
      tips: ["Make the fear specific and personal. It gives the Keeper something good to work with."],
    },
    {
      col: 1, name: "Night Move",
      trigger: "As the Day Move, after dark. Say what you fear; the Keeper tells you how it's worse. Back down, or go on and roll +ability.",
      results: [
        ["10+", "You do it, or hold steady."],
        ["7–9", "You do it, with a cost or a complication."],
        ["12+", "As 10+, and the Keeper adds a benefit."],
      ],
      tips: ["The strange things in the bay come out at night. Going anyway is a choice worth making."],
    },
    {
      col: 2, name: "Meddling Move",
      trigger: "When you search for a clue, research, or pry something out of someone, say how and roll +the ability your approach uses.",
      results: [
        ["Hit", "You find a Clue. The Keeper says what it is."],
        ["7–9", "There's also a complication, either with the Clue or while you find it."],
        ["12+", "You also find a Void Clue or learn something about the town's dark secret (Keeper's choice)."],
      ],
      tips: [
        "Charm = Presence · eavesdrop = Composure · a ledger or a crime scene = Reason · climb, grab, swim = Vitality.",
        "The best clues come sideways. Help with someone's trouble instead of asking about the murder.",
      ],
    },
    {
      col: 2, name: "Cozy Move", tag: "no roll",
      trigger: "When you share an intimate moment with another Maven while one of you does her Cozy Activity, you may each clear a Condition. If it's your activity, you may also stumble on a Clue: tell the Keeper what it is. It can't solve the case on its own.",
      tips: ["Invite someone over. \"Hold this skein while we talk.\""],
    },
    {
      col: 2, name: "Gold Crown Mysteries Move", tag: "once per mystery, whole table",
      trigger: "When someone says \"This reminds me of something that happened to Amanda Delacourt!\", the players name the book (no repeats), Amanda's similar trouble, and how she got out of it. Then either take 12+ on one relevant roll, or state a fact about the situation that the Keeper must use.",
    },
    {
      col: 2, name: "Occult Move",
      trigger: "When you try something supernatural for the first time, describe what doing it looks like and roll +Sensitivity.",
      results: [
        ["Hit", "It works, and it becomes a move every Maven can use."],
        ["7–9", "As a hit, but you also mark your Crown of the Void."],
        ["Miss", "It can never work, and you mark your Crown of the Void."],
      ],
      tips: ["The Keeper may ask for a good reason in the story first."],
    },
    {
      col: 3, name: "Theorize",
      trigger: "When the Mavens talk openly about who did it, have Clues equal to at least half the Complexity (rounded up), and agree, roll 2d6 + the Clues your theory uses or explains away − the Complexity. No advantage or disadvantage applies.",
      results: [
        ["10+", "You're right. The Keeper offers a chance to bring the culprit down."],
        ["7–9", "You're right, but there's a complication, or the chance is a dangerous one."],
        ["6−", "You're wrong. The Keeper reacts."],
        ["12+", "Someone in the town's dark conspiracy also reveals themself."],
      ],
      tips: [
        "Talk it out in character. For each Clue, say who, when, and what it proves.",
        "The Keeper has no answer written down. Your theory is what happened.",
      ],
    },
    {
      col: 3, name: "Crowns", tag: "after any roll",
      trigger: "Once the Keeper has narrated a result, you may put on a Crown. The result goes up one step (miss → 7–9 → 10–11 → 12+), and what was narrated never happened. Mark a box:",
      results: [
        ["Queen", "Any box. Play that scene before the session ends."],
        ["Void", "The next box, in order. It takes effect now."],
      ],
      after: "Theorize goes up a step only if every Maven puts on a Crown.",
      tips: ["Let the disaster play out first, then decide whether to undo it."],
    },
    {
      col: 3, name: "Conditions",
      trigger: "When a move or the Keeper gives you one, write it down (Frightened, Grieving, Smitten, Furious…). Roll at disadvantage when it would get in your way. You can hold three; a fourth means you mark a Crown instead. Clear them with the Cozy Move.",
    },
    {
      col: 3, name: "Cozy Little Place",
      trigger: "Things in your home, or in your handbag. To use an unmarked item, mark it and take advantage. Marked items stay in the story but give no bonus.",
    },
  ],

  /* House rules for a single session; shown boxed on the back of each playbook. */
  tableRules: [
    "<b>Clues go on cards in the middle.</b> A Clue counts for Theorize once it's on the table. You may keep one secret, but it can't help the theory until it's shared.",
    "<b>You heard every scene; your Maven didn't.</b> Pass things on in the story: a phone call, tea in the loft, \"I told them on the way over.\"",
    "<b>Spotlight.</b> When you do one of your marked questions on screen, tick it. Spend a tick for advantage on any roll.",
    "<b>Ask for scenes.</b> \"I want a scene with ___ about ___.\"",
  ],

  /* ---------- Maven moves: one-shot selection from both rulebook sets ---------- */
  mavenMoves: {
    quincy: { name: "R. Quincy", text: "You have a medical background; say what. Add a <b>Medical Bag</b> to your Cozy Little Place. When you use it for advantage, leave it unmarked.", tip: "For forensic noses, and patching people up." },
    cadfael: { name: "Cadfael", text: "You're a skilled herbalist: take <b>Herbalism</b> as a second Cozy Activity. When a tincture or decoction would help, you can take the time to make it; add it to your Cozy Little Place.", tip: "For practical remedies brewed on the stove." },
    baracus: { name: "B.A. Baracus", text: "Once per mystery, when you and/or other Mavens would suffer physical harm, describe how it's narrowly avoided.", tip: "For daring escapes. Keeps everyone safe once." },
    hart: { name: "Jonathan Hart", text: "You once lived the jet-set life, and the glamour never faded. <b>+1 Presence</b> (max 3).", tip: "For charm, and a past among the rich and famous." },
    crockett: { name: "Sonny Crockett", text: "People say \"Wow!\" when you pass. Describe your Style in detail and add a <b>Stylish Wardrobe</b> to your Cozy Little Place. When you use it for advantage, leave it unmarked.", tip: "For winning a room in a fabulous outfit." },
    steele: { name: "Remington Steele", text: "You can pass yourself off as someone you're not. If an ID or a disguise would help your ruse, you have it: say what it is and add it to your Cozy Little Place.", tip: "For ridiculous costumes and sneaky investigations." },
    marple: { name: "Jane Marple", text: "By day, you can walk into any place and move freely inside, as long as you do nothing openly hostile to the people there.", tip: "People trust a little old lady." },
    ramotswe: { name: "Mma Ramotswe", text: "Take two more Cozy Activities. Once per mystery, while doing one, you can use the Cozy Move with a townsperson. In a Cozy Move with a Maven, whoever is doing her activity may find a Clue or clear one more Condition.", tip: "For a town full of friends." },
    shumway: { name: "Gordon Shumway", text: "You share a strong bond with a remarkable cat who does tricks and follows simple commands. Name it and add it to your Cozy Little Place. When you use it for advantage, leave it unmarked.", tip: "Because cat." },
    poirot: { name: "Hercule Poirot", text: "<b>+1 Reason</b> (max 3).", tip: "The little grey cells." },
    encyclopedia: { name: "Encyclopedia Brown", text: "Once per mystery, bring in a piece of real-world trivia about something in the scene. That trivia is a Clue.", tip: "For trivia buffs." },
    holmes: { name: "Sherlock Holmes", text: "The first time you meet a Suspect, declare something about them based only on their appearance. It's true, but it isn't a Clue and can't solve the case.", tip: "For shaping how people are seen." },
    seavers: { name: "Colt Seavers", text: "Once per mystery, take 12+ on one roll for a wild or daring physical feat.", tip: "For stunts." },
    knight: { name: "Michael Knight", text: "You have a trusty vehicle that's got you out of trouble before: an oversized sedan, a motorbike, an old truck, a boat. Name it and add it to your Cozy Little Place. When you use it for advantage, leave it unmarked.", tip: "For chases, and getting everyone there." },
    frankjoe: { name: "Frank & Joe", text: "Once per mystery, when you would suffer grave physical harm, you're knocked out instead: take the Condition <i>A Little Rattled</i>. You wake in the perfect place to carry on investigating.", tip: "For getting into trouble." },
    cooper: { name: "Dale Cooper", text: "<b>+1 Sensitivity</b> (max 3). At the start of the session, the Keeper gives you a Void Clue as a strange, unsettling dream. Only one Maven may have this move.", tip: "For supernatural weirdness." },
    fatherbrown: { name: "Father Brown", text: "Once per mystery, narrate a flashback from the unknown killer's point of view. It needn't be true. Afterwards, the other Mavens define a Clue from it; it can't solve the case on its own.", tip: "For seeing it the killer's way." },
    scarecrow: { name: "Scarecrow", text: "At the start of the session, a stranger presses something into your hand or leaves it where you'll find it. The Keeper says what. It's a Clue you can use in this mystery.", tip: "Someone behind the scenes is helping you. Who?" },
  },

  /* "Which playbook?" guide on the Maven moves sheet. */
  picker: [
    ["patch people up and read a body like a book", "The Retired Nurse"],
    ["charm a room, dress up, play someone else", "The Former Starlet"],
    ["know everyone, go anywhere, keep a cat", "The Busybody"],
    ["solve it: trivia, deduction, the little grey cells", "The Schoolteacher"],
    ["climb, row, drive and get into trouble", "The Old Salt"],
    ["chase the strange things under the bay", "The Spiritualist"],
    ["build your own from the full lists", "The Maven"],
  ],

  /* ---------- Common sheet content ---------- */
  spotlight: [
    "Did you secretly undermine the authority of a local official?",
    "Did you share your wisdom with a young person?",
    "Did you share a memory of a late family member?",
    "Did you behave like a woman half your age?",
    "Did you dote on someone?",
    "Did you show someone that you've “still got it”?",
  ],
  queen: [
    "<b>Flashback:</b> your fondest memory of your late partner.",
    "<b>Flashback:</b> how you were an imperfect sister or daughter.",
    "<b>Flashback:</b> how you were an imperfect mother.",
    "<b>Flashback:</b> your fondest memory with one of your children.",
    "<b>Today:</b> a private side of you few people see.",
    "<b>Today:</b> a budding romance.",
    "<b>Today:</b> how you satisfy your physical desires.",
  ],
  void: [
    "<b>A Shadow in the Garden.</b> From now on, in cozy scenes about you, also narrate how dark things subtly show themselves.",
    "<b>The Chariot.</b> Reason −1, Sensitivity +1.",
    "<b>The Pallid Mask.</b> From now on, in any intimate conversation, casually mention death, dying, the afterlife or the End of All Things.",
    "<b>The Pomegranate Kernel.</b> Take the Condition <i>Obsessed with the Void</i>. It never clears.",
    "<b>The Void.</b> Your Maven is lost to the Void. Narrate how. (In a one-shot, a fine ending.)",
  ],
  abilities: ["Vitality", "Composure", "Reason", "Presence", "Sensitivity"],

  /* ---------- Playbooks ---------- */
  playbooks: [
    {
      id: "nurse", title: "The Retired Nurse",
      tagline: "She has seen everything, and nothing shocks her.",
      stats: { Vitality: 0, Composure: 2, Reason: 1, Presence: 0, Sensitivity: -1 },
      names: ["Doris", "Mavis", "Nellie", "Ruth"],
      styles: ["All the Cardigans", "Speed Walkin'", "Blouse Barn"],
      cozy: ["Knitting", "Baking"],
      careers: ["ward sister", "midwife", "army nurse", "ship's nurse"],
      items: ["a battered first-aid tin", "a shoebox of letters from old patients", "a blood-pressure cuff", "a photo of the ward, 1971"],
      stakes: ["a former patient who owes you their life", "the town doctor who never once listened to you", "a grandchild just home, and in trouble"],
      moves: ["quincy", "cadfael", "baracus"],
    },
    {
      id: "starlet", title: "The Former Starlet",
      tagline: "Two films, one scandal, and she still signs autographs.",
      stats: { Vitality: 0, Composure: 1, Reason: 0, Presence: 2, Sensitivity: -1 },
      names: ["Georgina", "Marilyn", "Maxine", "Violet"],
      styles: ["Alexis Carrington Colby", "Up in Pumps", "Jackie O"],
      cozy: ["Charity Events", "Antiques & Furniture"],
      careers: ["actress", "nightclub singer", "model", "TV hostess"],
      items: ["a fur stole", "a signed photo of a co-star", "a vanity case of stage make-up", "a scrapbook of reviews, good and bad"],
      stakes: ["an old rival who has just moved to town", "the co-star who was the love of your life", "a journalist who wants your memoir"],
      moves: ["hart", "crockett", "steele"],
    },
    {
      id: "busybody", title: "The Busybody",
      tagline: "Nothing happens in this town without her hearing by lunch.",
      stats: { Vitality: -1, Composure: 2, Reason: 0, Presence: 1, Sensitivity: 0 },
      names: ["Birdie", "Hyacinth", "Muriel", "Opal"],
      styles: ["Martha's Vineyard", "Blouse Barn", "All the Cardigans"],
      cozy: ["Gardening", "Quilting"],
      careers: ["postmistress", "church secretary", "telephone operator", "school receptionist"],
      items: ["binoculars, “for the birds”", "a church directory full of notes", "a tin of shortbread for visitors", "a police scanner"],
      stakes: ["a neighbour you've feuded with for thirty years", "the new minister you're set on matching with someone", "a daughter who never calls"],
      moves: ["marple", "ramotswe", "shumway"],
    },
    {
      id: "teacher", title: "The Schoolteacher",
      tagline: "She marked three generations of this town's homework and remembers every excuse.",
      stats: { Vitality: -1, Composure: 1, Reason: 2, Presence: 0, Sensitivity: 0 },
      names: ["Ernestine", "Jane", "Laura", "Louise"],
      styles: ["Office Hours", "Dorothy Zbornak"],
      cozy: ["Collecting (stamps, buttons, pressed flowers…)", "Scrapbooking"],
      careers: ["teacher", "librarian", "headmistress", "crossword setter"],
      items: ["a red pen", "every Gold Crown Mystery, annotated", "a card index of former pupils", "a magnifying glass"],
      stakes: ["a former pupil who's now on the town council", "a crossword rival at the Gazette", "the teaching award that went to someone else"],
      moves: ["poirot", "encyclopedia", "holmes"],
    },
    {
      id: "salt", title: "The Old Salt",
      tagline: "She ran a lobster boat for forty years and still won't wear a life jacket.",
      stats: { Vitality: 2, Composure: 1, Reason: 0, Presence: 0, Sensitivity: -1 },
      names: ["Barbara", "Billy", "Pearl", "Ruby"],
      styles: ["Goin' Fishin'", "Speed Walkin'"],
      cozy: ["Birding", "Cooking"],
      careers: ["lobsterwoman", "harbour pilot", "park ranger", "gym teacher"],
      items: ["a brass ship's compass", "a rowing skiff", "a thermos of something stronger than coffee", "a tide table with notes in the margin"],
      stakes: ["the harbourmaster, who's been sweet on you for years", "the rival who stole your best fishing spot", "a grandson who wants to sell the boat"],
      moves: ["seavers", "knight", "frankjoe"],
    },
    {
      id: "spiritualist", title: "The Spiritualist",
      tagline: "She reads tea leaves at the church fête. Sometimes they read her back.",
      stats: { Vitality: -1, Composure: 0, Reason: 1, Presence: 0, Sensitivity: 2 },
      names: ["Daisy", "Jessica", "Rosemary"],
      styles: ["Hippy Dippy", "Martha's Vineyard"],
      cozy: ["Painting", "Pottery"],
      careers: ["astrologer", "antiques dealer", "folklorist", "hospice chaplain"],
      items: ["a tarot deck with one card missing", "a crystal ball from a yard sale", "your late husband's pipe, which still smells of him", "a Ouija board in the attic"],
      stakes: ["a sister who thinks your gift is nonsense", "a client who stopped coming to readings last month", "your late partner, who you're sure is trying to tell you something"],
      moves: ["cooper", "fatherbrown", "scarecrow"],
    },
    {
      id: "maven", title: "The Maven",
      tagline: "Make her your own.",
      custom: true,
      stats: { Vitality: 0, Composure: 1, Reason: 1, Presence: 0, Sensitivity: -1 },
      names: ["Barbara", "Billy", "Birdie", "Daisy", "Doris", "Ernestine", "Georgina", "Hyacinth", "Jane", "Jessica", "Laura", "Louise", "Marilyn", "Mavis", "Maxine", "Muriel", "Nellie", "Opal", "Pearl", "Rosemary", "Ruby", "Ruth", "Violet"],
      styles: ["Alexis Carrington Colby", "All the Cardigans", "Blouse Barn", "Dorothy Zbornak", "Goin' Fishin'", "Hippy Dippy", "Jackie O", "Martha's Vineyard", "Office Hours", "Speed Walkin'", "Up in Pumps"],
      cozy: ["Antiques & Furniture", "Baking", "Birding", "Charity Events", "Cooking", "Gardening", "Knitting", "Painting", "Pottery", "Quilting", "Scrapbooking", "Collecting"],
      careers: [],
      items: [],
      stakes: ["a rival", "an old flame", "a grandchild", "a grudge"],
      moves: [],
    },
  ],
};
