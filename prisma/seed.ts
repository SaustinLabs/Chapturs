import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// tsx --env-file is unreliable on Windows. Prisma also reads .env independently
// at startup and can override what the runner sets. Load .env.local explicitly
// here — this code runs BEFORE new PrismaClient() reads process.env.DATABASE_URL.
function loadEnvLocal() {
  try {
    const buf = readFileSync(join(process.cwd(), '.env.local'))
    // .env.local may be saved as UTF-16 LE on Windows (BOM = FF FE)
    let text: string
    if (buf[0] === 0xff && buf[1] === 0xfe) {
      text = buf.slice(2).toString('utf16le')
    } else {
      text = buf.toString('utf-8')
    }
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#') || !line.includes('=')) continue
      const eqIdx = line.indexOf('=')
      const key = line.slice(0, eqIdx).trim()
      let value = line.slice(eqIdx + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  } catch { /* .env.local absent — rely on environment */ }
}
loadEnvLocal()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─────────────────────────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────────────────────────
  const demoUsers = [
    {
      email: 'author1@demo.chapturs.com',
      username: 'veylaroshe',
      displayName: 'Veyla Roshe',
      bio: 'Serial fantasy author. *The Ashen Covenant* is my third series — I\'ve been building this world for six years. I post a new chapter every Thursday.\n\nI also write short horror under a pen name nobody has found yet.',
      verified: true,
    },
    {
      email: 'author2@demo.chapturs.com',
      username: 'calderwick',
      displayName: 'J. Calderwick',
      bio: 'Retired archaeologist turned fiction writer. I put real history in my fantasy — if something seems too specific to be made up, it probably isn\'t.',
      verified: false,
    },
    {
      email: 'reader1@demo.chapturs.com',
      username: 'emberchaser',
      displayName: 'Ember Chaser',
      bio: 'I read everything. Currently obsessed with portal fantasy and dark academia. Featured comment badge owner 🌟',
      verified: false,
    },
    {
      email: 'reader2@demo.chapturs.com',
      username: 'sable_morrow',
      displayName: 'Sable Morrow',
      bio: 'Binge reader. I finish a whole series before bed and regret nothing.',
      verified: false,
    },
    {
      email: 'reader3@demo.chapturs.com',
      username: 'theorist_nyx',
      displayName: 'Nyx (Theorist)',
      bio: 'Reader, theorist, professional spoiler-avoider. I leave long comments and I\'m not sorry about it.',
      verified: false,
    },
    {
      email: 'reader4@demo.chapturs.com',
      username: 'quillborne',
      displayName: 'Quillborne',
      bio: 'Literary fiction enjoyer who accidentally fell into serial fantasy and never left.',
      verified: false,
    },
  ]

  // ─────────────────────────────────────────────────────────────────────
  // UPSERT USERS + AUTHORS
  // ─────────────────────────────────────────────────────────────────────
  const users: any[] = []
  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { bio: userData.bio, displayName: userData.displayName },
      create: userData,
    })
    users.push(user)

    await prisma.author.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        socialLinks: JSON.stringify({}),
        verified: userData.verified,
      },
    })
  }
  console.log(`  ✓ ${users.length} users upserted`)

  const [veylaUser, calderUser, readerA, readerB, readerC, readerD] = users
  const veylaAuthor = await prisma.author.findFirstOrThrow({ where: { userId: veylaUser.id } })
  const calderAuthor = await prisma.author.findFirstOrThrow({ where: { userId: calderUser.id } })

  // ─────────────────────────────────────────────────────────────────────
  // WORKS
  // ─────────────────────────────────────────────────────────────────────

  // -- "The Ashen Covenant" by Veyla Roshe --
  let emberWork = await prisma.work.findFirst({ where: { title: 'The Ashen Covenant' } })
  if (!emberWork) {
    emberWork = await prisma.work.create({
      data: {
        authorId: veylaAuthor.id,
        title: 'The Ashen Covenant',
        description: 'In the Kingdom of Ashford, fire is forbidden. The Ashguard Order enforces the Extinguishing with cold devotion, and citizens who manifest pyric abilities vanish without a trace.\n\nLinnea has worked at the Ember Inn her whole life, unremarkable and invisible by choice. Then a flame dances from her fingertip, and everything she believed about her past turns to smoke.\n\nWith a Warden-class Ashguard on her trail and a mysterious archivist as her only guide, Linnea must find the legendary Ember Throne before her power consumes everything — and everyone — she loves.',
        formatType: 'novel',
        genres: JSON.stringify(['fantasy', 'adventure']),
        tags: JSON.stringify(['magic-system', 'rebellion', 'coming-of-age', 'political-intrigue', 'chosen-one']),
        maturityRating: 'teen',
        status: 'published',
        viewCount: 41820,
        statistics: JSON.stringify({ views: 41820, likes: 2103, comments: 318, rating: 4.7 }),
      },
    })
  }

  // -- "The Scholar of Sunken Roads" by Calderwick --
  let scholarWork = await prisma.work.findFirst({ where: { title: 'The Scholar of Sunken Roads' } })
  if (!scholarWork) {
    scholarWork = await prisma.work.create({
      data: {
        authorId: calderAuthor.id,
        title: 'The Scholar of Sunken Roads',
        description: 'Professor Isadora Vale has spent twenty years cataloguing ruins that don\'t appear on any official map. When a student arrives with a journal she has never shown anyone, she begins to suspect the ruins aren\'t remnants of a lost civilization — they\'re infrastructure for one that never left.\n\nAn archaeological thriller woven with genuine history and very careful speculation.',
        formatType: 'novel',
        genres: JSON.stringify(['historical-fiction', 'thriller', 'mystery']),
        tags: JSON.stringify(['archaeology', 'academia', 'conspiracy', 'slow-burn']),
        maturityRating: 'teen',
        status: 'published',
        viewCount: 9340,
        statistics: JSON.stringify({ views: 9340, likes: 512, comments: 87, rating: 4.5 }),
      },
    })
  }

  // -- "Hollow Crown" (legacy, keep it) --
  let hollowWork = await prisma.work.findFirst({ where: { title: 'Hollow Crown' } })
  if (!hollowWork) {
    hollowWork = await prisma.work.create({
      data: {
        authorId: veylaAuthor.id,
        title: 'Hollow Crown',
        description: 'When a disgraced knight inherits a cursed throne, she discovers that the kingdom\'s darkness comes not from old magic — but from new politics. A grimdark tale of power, corruption, and the price of staying clean.',
        formatType: 'novel',
        genres: JSON.stringify(['dark-fantasy', 'grimdark']),
        tags: JSON.stringify(['anti-hero', 'political', 'morally-grey', 'war']),
        maturityRating: 'adult',
        status: 'published',
        viewCount: 17600,
        statistics: JSON.stringify({ views: 17600, likes: 980, comments: 144, rating: 4.8 }),
      },
    })
  }
  console.log('  ✓ Works upserted')

  // ─────────────────────────────────────────────────────────────────────
  // CHAPTERS — The Ashen Covenant
  // ─────────────────────────────────────────────────────────────────────
  const emberChapters = [
    {
      chapterNumber: 1,
      title: 'The Spark',
      wordCount: 3420,
      content: `The first spark came on a Tuesday, which felt wrong.

Prophetic moments should happen on dramatic days — solstices, equinoxes, at least a Friday. But there I was, scrubbing the enormous copper pots in the back kitchen of the Ember Inn, both forearms deep in grey water that smelled of lye and old grease, when a flame danced from my fingertip.

Small. No bigger than the tip of a birthday candle from a fairy story. It wavered once, as if it wasn't quite sure of itself, and then burned perfectly steady.

I stared at it. The flame seemed to stare back.

"Linnea!" Cook Bramwell's voice cracked through the kitchen like a thrown skillet. "Those pots won't wash themselves!"

The flame vanished. I plunged my hand into the water and felt nothing — not warmth, not a blister, not even the faint pins-and-needles of something that had almost happened. Just the bite of cold soapy water and the rough scrape of copper under my fingernails.

Just nothing.

I scrubbed harder.

In the Kingdom of Ashford, fire was old law. It had always been old law — the kind baked so deeply into a culture that people stopped questioning it the way they stopped questioning why you didn't look the sun directly in the eye. You used hearth-stones. You used alchemic heating coils if you could afford them. You used wool and layers in winter. You did not, under any circumstances, manifest pyric ability.

The Ashguard Order was not subtle about the consequences. They didn't need to be. In seventeen years of living in Linnethrope, I had seen three people taken. The baker's apprentice, who was twelve and had made the mistake of startling awake from a nightmare in a room shared with four siblings. The miller's oldest daughter. A travelling merchant whose name nobody had bothered to learn before he was gone.

None of them had come back.

None of them were ever officially discussed.

The Ashguard had a way of making the outline of a thing visible while making the thing itself unspeakable. You knew what the Order did. You felt it in the careful space every adult left around the subject. But the thing itself — the cells under the Citadel, the extraction process, what came after — that maintained a careful fiction of uncertainty.

I had spent seventeen years making sure uncertainty never applied to me.

I finished the pots. I didn't look at my hands again for the rest of the day.

---

Old Marta was sitting on the back steps when I came out to dump the wash water. She had her shawl pulled up despite the mild evening, her chin tipped down, watching the yard with the particular stillness of someone who had been waiting.

"You saw it," she said.

Not a question. Marta never asked questions she already knew the answers to — considered it a waste of both parties' time.

"I don't know what you mean," I said, and dumped the water into the drain channel.

"Mm." She shifted on the step, making room. It occurred to me that the invitation could be refused, and then occurred to me that I never refused Marta anything, and I sat down beside her.

The yard smelled of woodsmoke from next door's chimney. In the dusk, every lamplight in Linnethrope was a hearthstone, orange-tinged, the colour that wasn't fire but was designed to feel like it. The whole village was an imitation of warmth.

"There's something I should have told you a long time ago," Marta said.

"You tell me things all the time," I said.

"True things," she said. "I should have told you true things a long time ago."

The evening air went cold in a way that had nothing to do with temperature.`,
    },
    {
      chapterNumber: 2,
      title: 'The Warning',
      wordCount: 3180,
      content: `Old Marta told me about my mother slowly, the way you let cold water into a bath so the shock doesn't stop your heart.

Her name had been Asha. Not the name on my birth record — Marta had taken care of that, substituting a dead woman's identity before the Order could trace the inheritance — but the name she'd actually used, the name she'd answered to, the name she'd said quietly when she wanted someone to actually know her.

She had come to Linnethrope twelve years before I was born, already running. Marta had been running too, in those days — less from anything specific and more from the general sensation that the world she'd been born into was growing smaller every year, and she needed to find the seams before they sealed completely.

They had found each other the way certain people do: through a shared and very particular kind of tiredness.

"She had the same flicker you did," Marta said. She was looking at the yard, not at me. "Not strong, not then. Just the sort of thing that happens when someone strong enough hasn't learned quite yet to hold it still." A pause. "You get that from her."

"I don't—" I stopped. Started again. "I was told she died in a fire."

"You were told what was easy."

The bluntness of it knocked the air out of me.

"I was there," Marta continued, in the same tone she used to describe market prices or weather patterns. "She'd been getting harder to hide. The flicker was getting stronger, and she knew — your mother always knew things before she should have — she knew someone had noticed. We had a plan. Two horses, packed the night before, the route through the eastern ridge." She stopped. "The Order came early."

The yard was very quiet. From inside, I could hear the low rumble of the inn's common room, the clink of tankards, someone laughing at something.

"She made sure I got out," Marta said. "She made me promise to find you. You weren't born yet — she was three months from her time." A sound might have been a laugh or might have been something else entirely. "She thought if she stayed, if she held their attention, they wouldn't look for what else she'd been hiding."

"She hid me."

"She hid the possibility of you. And then she made it a certainty." Marta finally looked at me. Her eyes in the lamplight were very old and very level. "She bought you seventeen years. I'd say it was worth it, but that's not my accounting to do."

I sat with that for a long moment.

"The flame today," I said finally. "It was small."

"They usually are, to start."

"What does start mean?"

Marta was quiet for a moment. Then: "It means you have a few weeks, maybe a month, before it starts happening without your trying. Before you can't hide it the way you've been hiding it."

"I haven't been hiding it. I didn't know I had anything to hide."

"Your body knew," she said simply. "You've been very controlled for a very careful girl who didn't know she had anything to control."

I thought about seventeen years of being quiet, of being unnoticed, of learning extremely early that invisibility was a survival skill. I thought about the care I'd always taken, the way I'd always stood at the edge of every room.

"What am I supposed to do?" I asked.

"I know someone," Marta said. "A scholar. He deals in old things, inconvenient knowledge, the kind of maps the Order burns when it finds them." She reached into her shawl and produced a folded square of paper, worn soft at the creases. "He knew your mother. He's been waiting for this, in his way."

I took the paper. Unfolded it.

An address. A city two weeks' walk east. Three words below it, in a different hand: *When she's ready.*

"He wrote that twelve years ago?" I asked.

"Eighteen," Marta said. "He's a patient man."`,
    },
    {
      chapterNumber: 3,
      title: 'The Road to Caldenmere',
      wordCount: 3750,
      content: `I left three days later, which was two days longer than I should have stayed and three days sooner than felt survivable.

Marta packed my bag herself. She had opinions about packing that I had never been allowed to hold. Each item was chosen for weight versus utility, redundancy eliminated, everything that might rattle or shine subject to her quiet veto. Watching her work, I understood something I'd never articulated before: she had done this before. She had packed a bag for exactly this kind of leaving and she had learned from it.

She put the folded paper in the bottom of the satchel, under the food.

"If you're searched," she said, "they find the food first."

"I'm not going to be searched."

"You're not going to plan to be searched." She pressed the bag flat, testing its profile. "Different thing."

I asked her, the morning I left, whether she was coming.

The look she gave me was one I recognized from seventeen years of Marta-looks: the one that was kind in its certainty and firm in its kindness.

"Linnethrope is mine to take care of," she said. "You're not mine to keep."

I tried very hard not to cry on the road out of town. I managed until I hit the eastern ridge, where the road curved and the village dropped out of sight behind the low hills, and then I stopped managing and sat down in the bracken for a while.

The flame didn't manifest while I cried. I wasn't sure if that was control or grief or both.

---

The road to Caldenmere was old, the kind of road that had been walked smooth by centuries of the same foot traffic. It passed through four villages, twelve farmsteads, and one crossroads inn that I stopped at on the fourth night, spending exactly as much coin as was necessary to confirm I was an ordinary traveller and no more.

I was learning to be invisible in motion, which was harder than being invisible standing still. Stillness came naturally to me. Movement required active management — who I smiled at, which questions I answered, how to seem unremarkably from somewhere slightly to the left of where I actually was.

On the sixth day, I encountered an Ashguard patrol for the first time.

There were three of them. Two junior wardens and someone senior enough to wear the grey mantle. They were checking documents at a river crossing — routine procedure, the kind of thing they did to remind people they could. I had my documents. I joined the queue.

The senior warden's name, I learned from the people around me, was Commander Varek.

I didn't know that name. But several people in line did, and the knowing of it moved through them like a cold current. Shoulders drew in. Voices dropped. A woman ahead of me adjusted her shawl and stopped meeting eyes.

Varek himself was younger than the grey mantle suggested — late thirties, perhaps, with the deliberate stillness of someone who had trained stillness into a weapon. He didn't look cruel, which was, I would learn, the most dangerous kind of dangerous.

He looked at documents carefully. He asked questions in a mild, reasonable tone. He thanked people for their cooperation.

When he reached me, he looked at my documents for a long moment. He looked at my face. He handed the documents back.

"Where are you travelling to?" he asked.

"Caldenmere," I said. "My aunt is ill."

"Long walk," he said.

"She's particular about who she allows in her house."

He smiled at that. It was a real smile, slightly amused, which was worse than a false one would have been.

"Safe travels," he said, and moved on.

I walked across the bridge with my hands very still at my sides and didn't look at them until I was well out of sight.`,
    },
    {
      chapterNumber: 4,
      title: 'The Archivist',
      wordCount: 4100,
      content: `The address on Marta's paper led me to a narrow building on Caldenmere's west side, wedged between a mapmaker's shop and something that sold extremely specific types of rope. The building had no sign, which was itself a kind of sign. The door was old wood with a brass handle worn smooth to shine.

I stood outside for a while.

The Archivist was a title. Marta had never given me a name. The note had said *when she's ready*, which I had understood to mean *when something forces the issue*, which had turned out to be accurate.

I knocked.

---

His name was Orin Vael. He was seventy-something and moved like seventy wasn't slowing him down, which I found immediately suspicious in the way I found competent elderly people suspicious — they knew something about time that I didn't.

He opened the door, looked at me, said "There she is," and stepped back to let me in.

The inside of his building was every book its outside had implied. Floor-to-ceiling shelves, papers in stacks that clearly meant something to him and nothing legible to anyone else, a table covered in what turned out to be a single enormous maps divided across six sheets. There were two chairs. Both had been cleared of books, which suggested the second chair had been waiting.

"You knew I was coming," I said.

"I knew you'd come eventually." He gestured to the cleared chair. "Sit. You've been walking for two weeks and you're holding your hands like they're dangerous."

I sat. I looked at my hands. They looked ordinary.

"They are dangerous," he said. "That's not a criticism. It's context." He poured tea from something that had been keeping warm on an alchemic coil and put a cup in front of me. "Your mother told me about you before you were born. She called you the ember at the end of the covenant."

"The Ashen Covenant," I said. I'd heard the phrase once, years ago, in a conversation I wasn't supposed to overhear. Two travellers at the inn. Marta had ended the conversation by walking over and refilling their drinks until they stopped talking.

"The Covenant is what the current law was built over," Vael said. "Fifteen hundred years ago, give or take, there was a different agreement. The pyric-gifted were not hidden. They were organised. Trained. The Ember Throne—" He paused, watching my face.

"Marta mentioned it once," I said. "I thought it was a story."

"All the most important things were stories first." He reached across the table and produced a book from beneath one of the map sections — thin, cloth-bound, the colour of old ash. "The Throne was real. Is real, depending on your philosophy of existence. The Ashguard Order destroyed the public record of it as part of the Extinguishing two hundred years ago, but they can't destroy the thing itself. Objects of that kind don't work that way."

He set the book in front of me.

The cover had no title. But embossed into the cloth, so faintly you had to catch it at an angle, was the outline of a flame.

"Your mother's research," he said. "She gave it to me for safekeeping. She always intended you to have it." A pause. "She was more optimistic than the situation warranted. One of her best qualities."

I put my hand on the book. Through the cloth, I felt — nothing. And then something. A faint warmth that had nothing to do with the room temperature and everything to do with the fact that my hands were beginning to be dangerous in the way he'd described.

"What am I supposed to do with it?" I asked.

The Archivist folded his hands on the table and looked at me with the expression of a very patient man who had waited eighteen years for this conversation.

"Read it," he said. "And then we'll talk about what comes next."`,
    },
    {
      chapterNumber: 5,
      title: 'The Pyric Veil',
      wordCount: 3890,
      content: `I read the book in three days, which was faster than it should've been possible, because the handwriting was small and the language was old and several sections used a cipher that I had to work out by feel rather than logic.

The working-it-out-by-feel part should have frightened me more than it did.

My mother had been — the book made clear, in a way Marta's careful disclosures had not — exceptional. Not in the way everything-is-special-in-its-own-way makes someone exceptional, but in the way that very particular people are exceptional: the kind that their era wasn't ready for, the kind that gets remembered wrong or erased entirely, the kind that has to hide so effectively they become a rumour.

She'd been researching the Ember Throne since she was fourteen. She'd found references in sources the Order had considered safely obscure. She'd learned the cipher because it appeared in three separate locations that had no apparent connection, until she found the fourth.

She'd been trying to find the Throne's location when the Order found her first.

The location wasn't in the book. She'd been careful. But the shape of where to look was there, if you knew how to read it — and I was, apparently, the kind of person who knew how to read it without being taught, which Orin Vael found very interesting and which I found deeply inconvenient.

---

On the fourth morning, I woke to find I'd set fire to my pillow.

Not dramatically. Not even significantly — a small scorch mark, fist-sized, already cooling when I opened my eyes. But there it was. The control I'd been maintaining without knowing I was maintaining it had slipped in sleep, and now I was looking at evidence of what Marta had warned me about.

The weeks were getting shorter.

Orin Vael did not appear surprised when I came downstairs with the scorched pillow.

"We should start your training today," he said.

"I don't want training," I said. "I want to understand what's happening."

"Those are the same thing," he said, with the infuriating patience of someone who'd had this argument before, probably with my mother, probably multiple times. "Understanding what's happening with pyric ability is structural knowledge. You can't understand a river from the bank — you have to get in it."

"I don't like rivers," I said.

He handed me a cup of tea. "The Pyric Veil is what practitioners in the old covenant called the membrane between ordinary sensation and pyric perception. Your ability isn't separate from you — it's a second way of reading the world that's been developing in parallel to your primary senses since birth." He sat down in his chair and gestured at the opposite one. "What you're experiencing as unpredictable flame is actually perception trying to manifest physically before you have the language for it."

I sat. "You make it sound almost reasonable."

"It is reasonable. It's also dangerous. Both things are true." He opened a small case on the corner of the table, revealing a set of objects arranged in careful order: a disc of dark stone, a glass bead, a coil of wire that might have been copper or might have been something else. "The Order destroyed the formal curriculum. But they couldn't destroy the principles, because principles aren't documents — they're physics. I reconstructed the theory from forty years of research." A pause. "Your mother helped with the last third."

I looked at the objects.

"The stone is Mage-bonded iron," I said, without meaning to. The words surfaced before I'd decided to produce them.

Orin Vael went very still.

"I don't know how I know that," I said.

"That," he said quietly, "is the Veil opening." He looked at me with the expression of a man recalibrating his timeline. "We should start your training today. I may have underestimated how quickly we're working."

Outside the narrow window, the street of Caldenmere went about its business, unremarkable in the golden morning light. Somewhere in the city's administrative quarter, I would later learn, Commander Varek had received a new assignment.

He had been told to find the girl with ash-coloured hair and hands that didn't stay cold.

He was already north of the river.`,
    },
  ]

  const existingEmberChapters = await prisma.section.count({ where: { workId: emberWork.id } })
  if (existingEmberChapters === 0) {
    for (const ch of emberChapters) {
      await prisma.section.create({
        data: {
          workId: emberWork.id,
          title: ch.title,
          chapterNumber: ch.chapterNumber,
          wordCount: ch.wordCount,
          status: 'published',
          publishedAt: new Date(Date.now() - (6 - ch.chapterNumber) * 7 * 24 * 60 * 60 * 1000),
          content: JSON.stringify([{ id: `block-${ch.chapterNumber}`, type: 'text', content: ch.content }]),
        },
      })
    }
    console.log(`  ✓ ${emberChapters.length} chapters for The Ashen Covenant`)
  } else {
    console.log(`  - Chapters already seeded for The Ashen Covenant`)
  }

  // One chapter for Scholar of Sunken Roads
  const existingScholarChapters = await prisma.section.count({ where: { workId: scholarWork.id } })
  if (existingScholarChapters === 0) {
    await prisma.section.create({
      data: {
        workId: scholarWork.id,
        title: 'Chapter 1: The Unrecorded Room',
        chapterNumber: 1,
        wordCount: 2840,
        status: 'published',
        publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        content: JSON.stringify([{
          id: 'block-1', type: 'text',
          content: `Professor Isadora Vale had a rule about rooms that shouldn't exist: do not tell anyone about them until you understand why they're hidden.\n\nShe'd broken the rule twice in twenty years. Both times, the room disappeared before she could bring a witness.\n\nThe room she was standing in now was going to test that rule considerably.\n\nIt was beneath the Tesseval excavation site, three metres lower than the survey had shown anything to be, accessed through a collapse in the eastern wall that looked accidental until you noticed the collapse was geometrically precise. The walls were dressed stone, not poured aggregate — deliberately constructed, not naturally formed. The ceiling was intact. Whatever this room was, it had been built to last and built to be forgotten.\n\nThe thing that most arrested her attention was the map.\n\nNot the carved relief on the north wall, though that warranted its own sustained panic. Not the row of sealed vessels along the western shelf, though she was cataloguing them systematically in the back of her mind. The map on the floor: worn into the stone over what must have been generations of use, an image worn by feet rather than carved by tools, which meant this room had been regularly visited for long enough to leave a mark.\n\nThe map showed a network of sites. Twelve of them, connected by lines that followed no road she had on record.\n\nShe recognised six of the twelve.\n\nAll six were sites she had excavated personally in the last twenty years.\n\nThe other six, she would spend the next hour noting down in meticulous detail, were unmarked on every official map she owned.\n\nWhen she eventually climbed back out of the site, her graduate student Marcus was eating a sandwich and reading something on his phone with the benign oblivion that only people who had no idea what was underground could achieve.\n\n"Find anything?" he asked.\n\n"Pottery shards," she said. "Consistent with the period."\n\nShe climbed into the site vehicle and drove two miles before she pulled over, looked at her field notebook, and said a word that the university handbook strongly discouraged in professional settings.\n\nThen she drove the rest of the way to the archive and didn't mention the room to anyone for three months.`,
        }]),
      },
    })
    console.log(`  ✓ 1 chapter for The Scholar of Sunken Roads`)
  }

  // ─────────────────────────────────────────────────────────────────────
  // GLOSSARY — The Ashen Covenant
  // ─────────────────────────────────────────────────────────────────────
  const currentGlossaryCount = await prisma.glossaryEntry.count({ where: { workId: emberWork.id } })
  if (currentGlossaryCount === 0) {
    const glossaryEntries = [
      {
        term: 'Ashguard Order',
        definition: 'The Kingdom of Ashford\'s state enforcement body, charged with identifying, containing, and "processing" citizens who manifest pyric ability. The Order operates with full legal authority and maintains a network of wardens, scribes, and inquisitors throughout the kingdom. Junior members wear black. Senior wardens wear grey. The high command\'s colours are not publicly documented.',
        type: 'concept',
        category: 'Organizations',
        chapterIntroduced: 1,
        aliases: JSON.stringify(['The Order', 'Ashguard', 'the wardens']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 0 }),
      },
      {
        term: 'Warden-class Ashguard',
        definition: 'The investigative and enforcement tier of the Ashguard Order, above junior wardens and below the high command. Warden-class officers are typically assigned to specific provinces and have authority to detain, search, and extract individuals without external review. Commander Varek holds the highest warden-class rank in Ashford\'s northern territory.',
        type: 'concept',
        category: 'Organizations',
        chapterIntroduced: 3,
        aliases: JSON.stringify(['Wardens', 'Warden-class']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 0 }),
      },
      {
        term: 'Pyric Ability',
        definition: 'The rare inherited capacity to perceive and manipulate what the old covenant called the Pyric Veil — the underlying thermal and energetic fabric of the physical world. In practice, the most visible manifestation is fire generation, but trained practitioners historically demonstrated a much wider range of abilities. The Ashguard Order\'s official position is that pyric ability is a dangerous mutation. The Archivist\'s research suggests it is a form of expanded sensory perception.',
        type: 'concept',
        category: 'Magic System',
        chapterIntroduced: 1,
        aliases: JSON.stringify(['pyric gift', 'the gift', 'fire-blooded', 'Pyric']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 0 }),
      },
      {
        term: 'The Pyric Veil',
        definition: 'The term used in pre-Extinguishing scholarship to describe the perceptual membrane between ordinary sensory experience and pyric cognition. Practitioners described it as a second layer of the world, simultaneously present with the physical one. The Archivist\'s reconstruction of the old curriculum treats the Veil as a real structural phenomenon rather than metaphor — a claim with implications the current Order finds dangerous for obvious reasons.',
        type: 'concept',
        category: 'Magic System',
        chapterIntroduced: 5,
        aliases: JSON.stringify(['the Veil', 'pyric perception', 'second sight']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 0 }),
      },
      {
        term: 'The Ember Throne',
        definition: 'A legendary object from the pre-Extinguishing period, referenced in the Ashen Covenant as the seat of organized pyric authority. The Ashguard Order publicly maintains no such object ever existed. The Archivist\'s research and Asha\'s notes suggest it is real, still intact, and hidden — and that its location is encoded in the cipher fragments Asha spent years collecting. Its exact capabilities are unknown, but the old covenant texts describe it as "the place where the Veil becomes stable ground."',
        type: 'item',
        category: 'Artifacts & Lore',
        chapterIntroduced: 4,
        aliases: JSON.stringify(['the Throne', 'the Seat of Embers']),
        metadata: JSON.stringify({ importance: 'critical', spoilerLevel: 1 }),
      },
      {
        term: 'The Ashen Covenant',
        definition: 'The original political and supernatural agreement signed fifteen hundred years ago between the pyric-gifted and the ruling class of early Ashford, establishing formal protocols for coexistence. The Extinguishing was a deliberate and violent dismantling of this covenant two hundred years ago, replaced by the current total prohibition. The title carries significant symbolic weight — Orin Vael\'s use of it in context of Linnea is not accidental.',
        type: 'concept',
        category: 'History & Politics',
        chapterIntroduced: 4,
        aliases: JSON.stringify(['the covenant', 'the old covenant', 'the original compact']),
        metadata: JSON.stringify({ importance: 'critical', spoilerLevel: 0 }),
      },
      {
        term: 'The Extinguishing',
        definition: 'The historical event two hundred years ago in which the Kingdom of Ashford formally abolished the Ashen Covenant, disbanded the organized pyric communities, and established the Ashguard Order. The official historical account describes it as a necessary response to a catastrophic misuse of pyric ability. The Archivist\'s research suggests the "catastrophe" was staged.',
        type: 'concept',
        category: 'History & Politics',
        chapterIntroduced: 4,
        aliases: JSON.stringify(['the great suppression', 'the silent purge']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 0 }),
      },
      {
        term: 'Kingdom of Ashford',
        definition: 'The primary political entity of the story\'s setting, ruled by a monarchy that delegates day-to-day enforcement to administrative bodies including the Ashguard Order. Ashford is roughly divided into northern territories (where Linnethrope sits) and the southern administrative core centred on the capital city of Caldenmere. The kingdom is, by most external measures, prosperous and orderly. The ordering mechanism is the subject of the story.',
        type: 'place',
        category: 'Locations',
        chapterIntroduced: 1,
        aliases: JSON.stringify(['Ashford', 'the Kingdom']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 0 }),
      },
      {
        term: 'Caldenmere',
        definition: 'The southern capital city of Ashford, seat of the royal administrative apparatus and headquarters of the Ashguard Order\'s high command. Caldenmere is also home to the largest surviving archive of pre-Extinguishing records — heavily curated, but not entirely purged — which is why Orin Vael chose to establish his practice there. The city is two weeks\' walk east of Linnethrope.',
        type: 'place',
        category: 'Locations',
        chapterIntroduced: 3,
        aliases: JSON.stringify(['the capital', 'the southern city']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 0 }),
      },
      {
        term: 'Linnethrope',
        definition: 'The village in Ashford\'s northern territory where Linnea grew up, working at the Ember Inn under Bramwell\'s employ and Marta\'s guardianship. A small agricultural settlement, notable primarily for being the kind of place the Ashguard Order considers thoroughly mapped and low-risk. Which is, of course, exactly why Marta chose it.',
        type: 'place',
        category: 'Locations',
        chapterIntroduced: 1,
        aliases: JSON.stringify(['the village', 'home']),
        metadata: JSON.stringify({ importance: 'medium', spoilerLevel: 0 }),
      },
      {
        term: 'Ember Inn',
        definition: 'The inn in Linnethrope where Linnea works as a kitchen hand, owned by Cook Bramwell. The name is an old one — predating the prohibition on fire references — and Marta has noted, when pressed, that the original owner had a particular sense of humour. The inn serves as Linnea\'s effective home; she\'s lived in the back room since childhood.',
        type: 'place',
        category: 'Locations',
        chapterIntroduced: 1,
        aliases: JSON.stringify(['the inn', 'the kitchen']),
        metadata: JSON.stringify({ importance: 'medium', spoilerLevel: 0 }),
      },
      {
        term: 'The Archivist',
        definition: 'The title and primary identity of Orin Vael, the Caldenmere-based scholar who spent forty years reconstructing the pre-Extinguishing curriculum and corresponding directly with Asha (Linnea\'s mother) in the years before her detention. Vael runs an officially-listed "private research collection" that serves as cover for his actual activities. He has been waiting for Linnea with a patience that suggests either deep faith or advance knowledge of something he hasn\'t explained yet.',
        type: 'character',
        category: 'Characters',
        chapterIntroduced: 4,
        aliases: JSON.stringify(['Orin Vael', 'Vael', 'the scholar']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 0 }),
      },
      {
        term: 'Mage-bonded Iron',
        definition: 'A material referenced in pre-Extinguishing scholarship as having a specific relationship to pyric ability — it doesn\'t suppress the Veil so much as make it visible, acting as a kind of diagnostic material. The Order, which has suppressed most knowledge of pyric material science, continues to manufacture Mage-bonded iron instruments for its inquisitors\' use, under a different name. Linnea identifies the material on sight in Chapter 5 without being taught its name, which alarms Vael considerably.',
        type: 'item',
        category: 'Objects & Materials',
        chapterIntroduced: 5,
        aliases: JSON.stringify(['bonded iron', 'ashglass (misnomer)']),
        metadata: JSON.stringify({ importance: 'medium', spoilerLevel: 0 }),
      },
      {
        term: 'Coldfire',
        definition: 'The alchemic substitute for open flame in the Kingdom of Ashford — a catalytic reaction between specific mineral compounds that produces light and contained heat without actual combustion. Hearthstones and alchemic coils are coldfire-based. The Order licenses Coldfire production and use. Practitioners in the old covenant considered Coldfire a useful but philosophically pale substitute — like speaking in code when you know the original language.',
        type: 'item',
        category: 'Objects & Materials',
        chapterIntroduced: 1,
        aliases: JSON.stringify(['hearthstone', 'alchemic fire', 'the permitted light']),
        metadata: JSON.stringify({ importance: 'medium', spoilerLevel: 0 }),
      },
      {
        term: 'The Burning Plague',
        definition: 'The official historical explanation for the Extinguishing — a period of catastrophic wildfires attributed to uncontrolled pyric manifestations that destroyed three of Ashford\'s original seven cities. The Archivist\'s research suggests the fires were real but the cause was not pyric ability run amok — it was pyric ability deliberately weaponised by a third party that benefited from the subsequent prohibition. Who that third party was is a question Asha\'s notes circle without answering.',
        type: 'concept',
        category: 'History & Politics',
        chapterIntroduced: 4,
        aliases: JSON.stringify(['the great fires', 'the pyric catastrophe']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 1 }),
      },
      {
        term: 'The Hollow Flame',
        definition: 'A specific phenomenon documented in the old covenant curriculum: a pyric ability that manifests as fire that does not burn, moving through physical matter without igniting it. Considered among the rarest expressions of advanced pyric training. Mentioned in Asha\'s notes in the context of the Ember Throne — not as something Asha possessed, but as something she believed the Throne could teach.',
        type: 'concept',
        category: 'Magic System',
        chapterIntroduced: 5,
        aliases: JSON.stringify(['hollowfire', 'the unburning flame']),
        metadata: JSON.stringify({ importance: 'high', spoilerLevel: 2 }),
      },
      {
        term: 'Asha',
        definition: 'Linnea\'s mother. A pyric practitioner of exceptional strength and a meticulous scholar in her own right, who spent most of her adult life researching the Ember Throne while simultaneously running from the Ashguard Order. She was eventually captured shortly before Linnea was born. The circumstances of her detention — and what happened after — are information Orin Vael holds carefully, releasing it on a need-to-know basis that Linnea is beginning to find infuriating.',
        type: 'character',
        category: 'Characters',
        chapterIntroduced: 2,
        aliases: JSON.stringify(['Linnea\'s mother', 'the scholar']),
        metadata: JSON.stringify({ importance: 'critical', spoilerLevel: 0 }),
      },
      {
        term: 'Commander Varek',
        definition: 'The highest Warden-class officer in Ashford\'s northern territory, currently assigned to what his superiors have described as a "discreet asset retrieval" in the north. Varek is notable for his apparent reasonableness — he doesn\'t seem cruel, doesn\'t seem fanatical, seems in fact almost apologetic about the nature of his work, which makes him significantly more effective at it than a crueller man would be. He encountered Linnea at a river crossing without identifying her. He will not make this mistake twice.',
        type: 'character',
        category: 'Characters',
        chapterIntroduced: 3,
        aliases: JSON.stringify(['the Commander', 'the grey warden']),
        metadata: JSON.stringify({ importance: 'critical', spoilerLevel: 0 }),
      },
      {
        term: 'The Last Ember Prophecy',
        definition: 'A fragment appearing in multiple pre-Extinguishing texts: "In the generation after the covenant breaks entirely, the last ember will find the throne, and what was extinguished will not be restored — it will be replaced." The Archivist takes the position that prophecies are pattern recognition by people who understood the mechanics of a situation better than we do. He has not yet told Linnea that this particular pattern appears to be tracking well.',
        type: 'concept',
        category: 'Prophecy & Lore',
        chapterIntroduced: 4,
        aliases: JSON.stringify(['the ember prophecy', 'the last flame']),
        metadata: JSON.stringify({ importance: 'critical', spoilerLevel: 2 }),
      },
    ]

    for (const entry of glossaryEntries) {
      await prisma.glossaryEntry.create({ data: { workId: emberWork.id, ...entry } })
    }
    console.log(`  ✓ ${glossaryEntries.length} glossary entries for The Ashen Covenant`)
  } else {
    console.log(`  - Glossary already seeded for The Ashen Covenant`)
  }

  // ─────────────────────────────────────────────────────────────────────
  // CHARACTER PROFILES — The Ashen Covenant
  // ─────────────────────────────────────────────────────────────────────
  const currentCharCount = await prisma.characterProfile.count({ where: { workId: emberWork.id } })
  if (currentCharCount === 0) {
    const characters = [
      {
        name: 'Linnea',
        aliases: JSON.stringify(['Lin', 'the girl from the inn']),
        role: 'protagonist',
        firstAppearance: 1,
        quickGlance: 'Seventeen-year-old kitchen hand. Ash-coloured hair. Very controlled person currently losing control of something significant.',
        physicalDescription: 'Medium height, lean from years of the kind of work that keeps you in motion. Hair the colour of cold ash — the exact shade that reads as brown in poor light and silver in good light. Eyes similarly ambiguous, described at various points as grey, dark green, or "the colour of smoke." Hands that are almost always slightly warm, recently.',
        age: '17',
        height: `5'4"`,
        backstory: 'Left at the Ember Inn by Marta under a false name, with false documents, at three days old. Grew up knowing only that her mother was dead, her father was irrelevant, and that she was the kind of person who attracted less attention when she actively tried to. Seventeen years of successful invisibility, interrupted by a spark on a Tuesday.',
        personalityTraits: JSON.stringify(['controlled', 'observant', 'self-reliant', 'quietly sardonic', 'more emotionally literate than she admits']),
        motivations: 'Survival, then answers. The survival instinct precedes the curiosity but doesn\'t eliminate it. She wants to understand what she is before she decides what she\'s going to do about it.',
      },
      {
        name: 'Orin Vael',
        aliases: JSON.stringify(['The Archivist', 'Vael', 'the old man']),
        role: 'mentor',
        firstAppearance: 4,
        quickGlance: 'Seventy-something scholar with forty years of illegal research and one empty chair he\'s been keeping ready.',
        physicalDescription: 'Old in the manner of people who have always seemed old — it\'s hard to imagine him young. Average height, slight, with hands that are ink-stained to a degree suggesting the staining started decades ago and has become part of his skin. He moves quickly for his apparent age, which is one of the things Linnea notes as suspicious.',
        age: '72',
        height: `5'6"`,
        backstory: 'Former court scholar, dismissed twenty years ago for pursuing "prohibited historical inquiry." Had been collaborating covertly with Asha, Linnea\'s mother, for seven years before her capture. Has spent the intervening years completing her research, running an officially-tolerated private archive as cover, and waiting for the person he was told would eventually walk through his door.',
        personalityTraits: JSON.stringify(['patient', 'precise', 'strategically withholding', 'genuinely kind', 'convinced he\'s protecting people by not telling them things they\'re not ready for']),
        motivations: 'Completer. He wants to finish what Asha started. The degree to which this is personal grief versus intellectual commitment is something he hasn\'t examined closely.',
      },
      {
        name: 'Commander Varek',
        aliases: JSON.stringify(['the Commander', 'the grey warden', 'Varek']),
        role: 'antagonist',
        firstAppearance: 3,
        quickGlance: 'Senior Ashguard warden. Reasonable affect. Does terrible things with the expression of someone following workflow.',
        physicalDescription: 'Late thirties, the kind of face that is generically handsome in a way that makes it hard to describe precisely afterward. Grey mantle of warden-class rank over practical field clothing. Carries identification documents rather than weapons visibly, which is not because he doesn\'t have weapons.',
        age: '38',
        height: `6'0"`,
        backstory: 'Rose through the Ashguard Order on the basis of results rather than zealotry — unusual for senior wardens. His personnel file would show an impressive case-closed rate and zero official complaints. The thing that makes him effective is that he\'s not ideologically invested in the prohibition. He enforces it because it is the structure he operates within, and dismantling the structure isn\'t in his job description. He might, in a different world, be a reasonable man.',
        personalityTraits: JSON.stringify(['methodical', 'professionally courteous', 'genuinely difficult to dislike', 'completely committed to the work', 'capable of compartmentalisation that should probably alarm him more than it does']),
        motivations: 'Completion of assignment. Then the next assignment. He hasn\'t examined whether the assignments are collectively toward anything he believes in.',
      },
      {
        name: 'Marta',
        aliases: JSON.stringify(['Old Marta', 'Marta of Linnethrope']),
        role: 'supporting',
        firstAppearance: 1,
        quickGlance: 'Linnea\'s guardian figure. Has known significantly more than she said for seventeen years and is finally saying it.',
        physicalDescription: 'Old in the way of people who earned it through physical work — lean, joints that complain vocally, hair gone entirely white. She walks with the specific carriage of someone who decided long ago that age was going to have to keep up with her rather than the other way around.',
        age: '65',
        height: `5'3"`,
        backstory: 'Was running her own particular kind of problem when she met Asha. They recognized something in each other — the specific quality of people who have spent significant energy being somewhere other than where official records suggest they are. Promised Asha on the night of her capture to find the child and keep her safe. Has spent seventeen years honoring that promise with the particular intensity of someone who failed to keep the other promise that mattered.',
        personalityTraits: JSON.stringify(['blunt', 'practical', 'deeply loyal', 'carries guilt like furniture', 'expressive only when precision requires expression']),
        motivations: 'Debt. Honor. The particular stubbornness of someone who has been waiting for an ending and isn\'t willing to let it arrive badly.',
      },
      {
        name: 'Cook Bramwell',
        aliases: JSON.stringify(['Bramwell', 'the Cook']),
        role: 'supporting',
        firstAppearance: 1,
        quickGlance: 'Owner and head cook of the Ember Inn. Uncomplicated man. Genuinely good employer. Not involved in anything.',
        physicalDescription: 'Large in all dimensions, with forearms like bread loaves and a voice that carries across a full common room without effort. Ruddy-complexioned from kitchen heat. Perpetually smells of whatever was last in the oven.',
        age: '50',
        height: `5'11"`,
        backstory: 'Inherited the Ember Inn from his father, improved the menu considerably, likes things predictable and orderly and Linnea specifically because she is both. Does not know anything. Is not going to know anything. Is doing fine.',
        personalityTraits: JSON.stringify(['straightforward', 'work-focused', 'fair employer', 'does not notice things that are not his business']),
        motivations: 'Good food. Smooth service. Everyone paid and no trouble.',
      },
    ]

    for (const char of characters) {
      await prisma.characterProfile.create({ data: { workId: emberWork.id, ...char } })
    }
    console.log(`  ✓ ${characters.length} character profiles for The Ashen Covenant`)
  } else {
    console.log(`  - Characters already seeded for The Ashen Covenant`)
  }

  // ─────────────────────────────────────────────────────────────────────
  // COMMENTS & FEATURED COMMENTS
  // ─────────────────────────────────────────────────────────────────────
  const emberSections = await prisma.section.findMany({
    where: { workId: emberWork.id },
    orderBy: { chapterNumber: 'asc' },
  })

  const existingComments = await prisma.comment.count({ where: { workId: emberWork.id } })
  if (existingComments === 0 && emberSections.length > 0) {
    const commentData = [
      // ── Chapter 1 comments ──────────────────────────────────────────
      {
        sectionId: emberSections[0]?.id,
        userId: readerA.id,
        content: 'The "prophecies should happen on Fridays" line in the first paragraph made me literally laugh out loud. Immediately set the tone. I wasn\'t expecting dry humor in what looked like a serious fantasy and now I\'m obsessed.',
        isFeatured: true,
        featuredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        sectionId: emberSections[0]?.id,
        userId: readerB.id,
        content: 'The way the Ashguard Order is introduced is so effective — you never explain what happens to people, you just note that "nobody talked about it." That negative space is scarier than anything explicit would be.',
        isFeatured: true,
        featuredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        sectionId: emberSections[0]?.id,
        userId: readerC.id,
        content: 'Just here to note that "the flame stared back" is four words and they did something to me. continuing immediately.',
        isFeatured: false,
      },
      {
        sectionId: emberSections[0]?.id,
        userId: readerD.id,
        content: 'I love how controlled Linnea already is in chapter one before we understand WHY she\'s controlled. Looking back after chapter 5, the re-read hits different. She knew something was wrong with herself for years.',
        isFeatured: true,
        featuredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      // ── Chapter 2 comments ──────────────────────────────────────────
      {
        sectionId: emberSections[1]?.id,
        userId: readerA.id,
        content: 'Marta is such a carefully drawn character. "I was there, Linnea. I saw what really happened." Delivered so flatly. This woman has been carrying that for seventeen years and she just says it like a weather report.',
        isFeatured: true,
        featuredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        sectionId: emberSections[1]?.id,
        userId: readerC.id,
        content: 'THE MOTHER WAS ALIVE WHEN MARTA LEFT. That implication is sitting on my chest. "She bought you seventeen years." I need to lie down.',
        isFeatured: false,
      },
      {
        sectionId: emberSections[1]?.id,
        userId: readerB.id,
        content: 'Small detail that hit me: "the story they wanted told." Not "the story I told you." Marta is specifically noting that the lie was institutional, not hers. She\'s been holding onto that distinction.',
        isFeatured: true,
        featuredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      // ── Chapter 3 comments ──────────────────────────────────────────
      {
        sectionId: emberSections[2]?.id,
        userId: readerD.id,
        content: 'Varek is terrifying precisely because he\'s not horrible. "Safe travels" and that slight smile. He\'s good at his job AND pleasant about it. The horror is completely mundane.',
        isFeatured: true,
        featuredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        sectionId: emberSections[2]?.id,
        userId: readerA.id,
        content: 'Marta teaching Linnea to pack is one of my favorite small scenes in any serial fiction I\'ve read this year. It\'s a skills transfer scene that\'s ALSO an emotional scene without ever announcing itself as either.',
        isFeatured: false,
      },
      // ── Chapter 4 comments ──────────────────────────────────────────
      {
        sectionId: emberSections[3]?.id,
        userId: readerC.id,
        content: 'The detail that the second chair had been CLEARED and waiting. He\'s had that chair ready for eighteen years. I\'m fine. Completely fine.',
        isFeatured: false,
      },
      {
        sectionId: emberSections[3]?.id,
        userId: readerB.id,
        content: 'Okay the lore is immaculate. The Covenant being a POLITICAL agreement that got violently dismantled and replaced with law rather than magic being inherently forbidden — that\'s so much more interesting than the usual "power is simply banned" setup.',
        isFeatured: true,
        featuredAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      },
      // ── Chapter 5 comments ──────────────────────────────────────────
      {
        sectionId: emberSections[4]?.id,
        userId: readerD.id,
        content: 'Linnea naming the Mage-bonded iron without being taught it might be the single most chilling moment in the story so far. The Veil going both ways — she\'s not just gifted, she\'s ALREADY operating in it. The whole curriculum Vael spent forty years reconstructing is just... native to her.',
        isFeatured: true,
        featuredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        sectionId: emberSections[4]?.id,
        userId: readerA.id,
        content: 'The scorched pillow at the start of chapter 5 — she set fire to her doubt. She spent the whole book so far fighting the knowledge and her body just quietly gave up arguing. This chapter is a turning point even though nothing dramatic happens in it.',
        isFeatured: false,
      },
      {
        sectionId: emberSections[4]?.id,
        userId: readerC.id,
        content: 'VAREK IS ALREADY NORTH OF THE RIVER. the chapter ended and i immediately scrolled back up to check if I\'d missed something and no, it was just there in the last sentence, calmly. @ author why do you do this to us every chapter. immediate update needed.',
        isFeatured: false,
      },
    ]

    for (const c of commentData) {
      if (!c.sectionId) continue
      await prisma.comment.create({
        data: {
          workId: emberWork.id,
          sectionId: c.sectionId,
          userId: c.userId,
          content: c.content,
          isFeatured: c.isFeatured,
          featuredAt: c.featuredAt ?? null,
          isPinned: false,
          isHidden: false,
        },
      })
    }
    console.log(`  ✓ ${commentData.length} comments seeded for The Ashen Covenant`)
  } else {
    console.log(`  - Comments already seeded (or no chapters found)`)
  }

  // ─────────────────────────────────────────────────────────────────────
  // RATINGS
  // ─────────────────────────────────────────────────────────────────────
  const existingRatings = await prisma.workRating.count({ where: { workId: emberWork.id } })
  if (existingRatings === 0) {
    const ratings = [
      {
        userId: readerA.id,
        overall: 5,
        writing: 5,
        plot: 5,
        characters: 5,
        worldBuilding: 5,
        pacing: 4,
        review: 'This is the fantasy I\'ve been waiting for since I finished the Farseer trilogy. The magic system is internally consistent AND metaphorically interesting, which is absurdly rare. Linnea is the protagonist I didn\'t know I needed: competent but not infallible, emotionally intelligent but not expressive, motivated by survival rather than destiny. And Marta. My god. Marta alone is worth the read. Docking one star from pacing only because I want more chapters faster, which is not actually a critique.',
      },
      {
        userId: readerB.id,
        overall: 5,
        writing: 5,
        plot: 4,
        characters: 5,
        worldBuilding: 5,
        pacing: 4,
        review: 'The prose is genuinely exceptional for serial fiction. Most web serials (including very good ones) write competently at best. This writes beautifully. The sentence-level craft is there. The world-building is the kind that gives you more the more carefully you read — I caught three things on reread that I completely missed first time through. Varek is my favorite kind of antagonist: you understand why he\'s good at his job while finding that understanding deeply uncomfortable.',
      },
      {
        userId: readerC.id,
        overall: 5,
        writing: 4,
        plot: 5,
        characters: 5,
        worldBuilding: 4,
        pacing: 5,
        review: 'I read all five chapters in one sitting starting at 11 PM and I regret nothing except that there isn\'t a chapter 6 yet. The pacing is extraordinary — every chapter ends on something that isn\'t a cliffhanger exactly, just a door that opened one inch. You can see through it but you can\'t quite tell what\'s behind. I\'m going to be thinking about the scorched pillow scene for a long time.',
      },
      {
        userId: readerD.id,
        overall: 4,
        writing: 5,
        plot: 4,
        characters: 5,
        worldBuilding: 4,
        pacing: 4,
        review: 'Exceptional characterization, particularly in the secondary cast. Marta and Vael feel like people with forty years of history we can only partially see, which is the right kind of depth for supporting characters. The plotline is moving securely toward something that feels earned rather than arbitrary. Bumping down very slightly on worldbuilding only because I want MORE detail on the magic system — I can see the edges of something very sophisticated and I want the center of it.',
      },
    ]
    for (const r of ratings) {
      await prisma.workRating.create({ data: { workId: emberWork.id, ...r } })
    }
    console.log(`  ✓ ${ratings.length} ratings for The Ashen Covenant`)
  } else {
    console.log(`  - Ratings already seeded for The Ashen Covenant`)
  }

  // ─────────────────────────────────────────────────────────────────────
  // LEVEL TIERS
  // ─────────────────────────────────────────────────────────────────────
  const levelTiers = [
    { level: 1, minPoints: 0, title: 'Newcomer', badge: '🌱' },
    { level: 2, minPoints: 50, title: 'Apprentice', badge: '📖' },
    { level: 3, minPoints: 150, title: 'Journeyman', badge: '✨' },
    { level: 4, minPoints: 400, title: 'Master', badge: '👑' },
    { level: 5, minPoints: 1000, title: 'Sage', badge: '🏆' },
  ]
  for (const tier of levelTiers) {
    const exists = await prisma.levelTier.findFirst({ where: { level: tier.level } })
    if (!exists) await prisma.levelTier.create({ data: tier })
  }
  console.log(`  ✓ ${levelTiers.length} level tiers seeded`)

  // ─────────────────────────────────────────────────────────────────────
  // ACHIEVEMENTS
  // ─────────────────────────────────────────────────────────────────────
  const achievements = [
    // Author achievements
    {
      key: 'first_chapter',
      title: 'First Chapter',
      description: 'Published your first chapter.',
      badgeIcon: '📝',
      pointValue: 10,
      tier: 'bronze',
      category: 'author',
    },
    {
      key: 'founding_creator',
      title: 'Founding Creator',
      description: 'One of the first 100 creators on Chapturs.',
      badgeIcon: '⭐',
      pointValue: 50,
      tier: 'gold',
      category: 'author',
    },
    {
      key: 'ten_chapters',
      title: 'Prolific',
      description: 'Published 10 chapters.',
      badgeIcon: '📚',
      pointValue: 30,
      tier: 'silver',
      category: 'author',
    },
    {
      key: 'glossary_10',
      title: 'Worldbuilder',
      description: 'Created 10 glossary entries.',
      badgeIcon: '🌍',
      pointValue: 25,
      tier: 'silver',
      category: 'author',
    },
    {
      key: 'characters_25',
      title: 'Cast Creator',
      description: 'Added 25 characters to profile.',
      badgeIcon: '👥',
      pointValue: 40,
      tier: 'silver',
      category: 'author',
    },
    {
      key: 'premium_supporter',
      title: 'Premium Supporter',
      description: 'Subscribed to premium membership.',
      badgeIcon: '💎',
      pointValue: 100,
      tier: 'platinum',
      category: 'reader',
    },
    // Reader achievements
    {
      key: 'first_read',
      title: 'Reading Begins',
      description: 'Read your first chapter.',
      badgeIcon: '📖',
      pointValue: 5,
      tier: 'bronze',
      category: 'reader',
    },
    {
      key: 'hundred_pages',
      title: 'Voracious',
      description: 'Read 100+ pages on Chapturs.',
      badgeIcon: '🔥',
      pointValue: 25,
      tier: 'silver',
      category: 'reader',
    },
    {
      key: 'first_comment',
      title: 'Critic',
      description: 'Left your first comment on a chapter.',
      badgeIcon: '💬',
      pointValue: 10,
      tier: 'bronze',
      category: 'reader',
    },
    {
      key: 'featured_comment',
      title: 'Insightful',
      description: 'Had a comment featured by the author.',
      badgeIcon: '⭐',
      pointValue: 30,
      tier: 'gold',
      category: 'reader',
    },
    {
      key: 'bookmarked_ten',
      title: 'Collector',
      description: 'Bookmarked 10 stories.',
      badgeIcon: '🎯',
      pointValue: 15,
      tier: 'bronze',
      category: 'reader',
    },
  ]
  for (const achievement of achievements) {
    const exists = await prisma.achievement.findFirst({
      where: { key: achievement.key },
    })
    if (!exists) await prisma.achievement.create({ data: achievement })
  }
  console.log(`  ✓ ${achievements.length} achievements seeded`)

  // ─────────────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS & LIKES
  // ─────────────────────────────────────────────────────────────────────
  const allSubscriptions = [
    { authorId: veylaAuthor.id, userId: readerA.id },
    { authorId: veylaAuthor.id, userId: readerB.id },
    { authorId: veylaAuthor.id, userId: readerC.id },
    { authorId: veylaAuthor.id, userId: readerD.id },
    { authorId: calderAuthor.id, userId: readerA.id },
    { authorId: calderAuthor.id, userId: readerD.id },
  ]
  for (const sub of allSubscriptions) {
    const exists = await prisma.subscription.findFirst({ where: sub })
    if (!exists) await prisma.subscription.create({ data: sub })
  }

  const allLikes = [
    { workId: emberWork.id, userId: readerA.id },
    { workId: emberWork.id, userId: readerB.id },
    { workId: emberWork.id, userId: readerC.id },
    { workId: emberWork.id, userId: readerD.id },
    { workId: scholarWork.id, userId: readerA.id },
    { workId: scholarWork.id, userId: readerD.id },
    { workId: hollowWork.id, userId: readerB.id },
    { workId: hollowWork.id, userId: readerC.id },
  ]
  for (const like of allLikes) {
    const exists = await prisma.like.findFirst({ where: like })
    if (!exists) await prisma.like.create({ data: like })
  }
  console.log('  ✓ Subscriptions and likes seeded')

  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
