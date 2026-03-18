import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo users
  const demoUsers = [
    { email: 'author1@demo.chapturs.com', username: 'storyweaver', displayName: 'Story Weaver', bio: 'Fantasy & sci-fi author. Weaving worlds one chapter at a time.', verified: true },
    { email: 'author2@demo.chapturs.com', username: 'moonlitpoet', displayName: 'Moonlit Poet', bio: 'Poetry and short fiction. Finding beauty in the quiet moments.', verified: false },
    { email: 'author3@demo.chapturs.com', username: 'inkmystic', displayName: 'Ink Mystic', bio: 'Dark fantasy and horror. Not for the faint of heart.', verified: true },
  ]

  const users = []
  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
    users.push(user)

    // Create author profile
    await prisma.author.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: userData.displayName,
        bio: userData.bio,
        totalFollowers: Math.floor(Math.random() * 5000),
        totalViews: Math.floor(Math.random() * 50000),
        socialLinks: JSON.stringify({}),
      },
    })
    console.log(`  ✓ User: ${userData.username}`)
  }

  // Create demo works
  const demoWorks = [
    {
      authorIndex: 0,
      title: 'The Last Ember',
      description: 'In a world where fire is forbidden, one girl discovers she can breathe flames. Hunted by the Ashguard Order, she must find the legendary Ember Throne before her power consumes everything she loves.',
      formatType: 'novel',
      genres: JSON.stringify(['fantasy', 'adventure']),
      tags: JSON.stringify(['magic', 'rebellion', 'coming-of-age']),
      maturityRating: 'teen',
      status: 'published',
      sections: [
        { title: 'Chapter 1: The Spark', content: 'The first spark came on a Tuesday, which felt wrong. Prophetic moments should happen on dramatic days — solstices, equinoxes, at least a Friday. But there I was, scrubbing pots in the back kitchen of the Ember Inn, when a flame danced from my fingertip.\n\nI stared at it. The flame stared back.\n\n"Linnea!" Cook Bramwell\'s voice shattered the moment. "Those pots won\'t wash themselves!"\n\nThe flame vanished, leaving only a faint warmth and the smell of smoke. My hands trembled. In the Kingdom of Ashford, fire was the domain of the Ashguard Order. Ordinary citizens who displayed pyric abilities were... well, nobody talked about what happened to them. The Order made sure of that.\n\nI plunged my hands back into the soapy water and scrubbed harder. Just a trick of the light. Heat from the stove. Anything but what it actually was.', wordCount: 148 },
        { title: 'Chapter 2: The Warning', content: 'Old Marta found me behind the woodshed that evening, knees hugged to my chest, staring at my hands like they belonged to someone else.\n\n"You saw it," she said. Not a question. Marta never asked questions she already knew the answers to.\n\n"Saw what?" My voice came out smaller than I intended.\n\nShe sat beside me on the damp ground, her joints creaking like old doors. "The flame, girl. I saw it in your eyes at supper. That particular shine." She pulled her shawl tighter. "Your mother had it too, you know. Before the Order came for her."\n\nMy heart stopped. "My mother died in a house fire."\n\n"That\'s the story they wanted told," Marta said quietly. "But I was there, Linnea. I saw what really happened. And I swore to her I\'d keep you safe."\n\nThe evening air suddenly felt very cold.', wordCount: 152 },
      ],
    },
    {
      authorIndex: 1,
      title: 'Midnight Frequencies',
      description: 'A collection of poems and short stories exploring the liminal spaces between sleep and waking, love and loss, the digital and the divine.',
      formatType: 'collection',
      genres: JSON.stringify(['poetry', 'literary-fiction']),
      tags: JSON.stringify(['experimental', 'lyrical', 'contemporary']),
      maturityRating: 'mature',
      status: 'published',
      sections: [
        { title: 'Static Lullaby', content: 'I found your voice in the radio static last night—\na frequency between stations where the dead still sing.\nYou told me about the city you built from broken glass,\nhow the light through your windows paints the floor in algebra.\n\nI pressed my ear against the speaker cone,\nfeeling the vibrations like a pulse against my skin.\nSomewhere in the white noise, you were humming\nthat song we used to play on repeat, the one\nthat made the neighbors knock and the cat hide under the bed.\n\nThe signal faded at 3:47 AM.\nI left the radio on until morning,\njust in case you called back.', wordCount: 108 },
      ],
    },
    {
      authorIndex: 2,
      title: 'Hollow Crown',
      description: 'When a disgraced knight inherits a cursed throne, she discovers that the kingdom\'s darkness comes from within its own walls. A grimdark tale of power, corruption, and the price of redemption.',
      formatType: 'novel',
      genres: JSON.stringify(['dark-fantasy', 'grimdark']),
      tags: JSON.stringify(['anti-hero', 'political', 'dark']),
      maturityRating: 'adult',
      status: 'published',
      sections: [
        { title: 'Chapter 1: The Broken Oath', content: 'They gave me the crown in a coffin.\n\nNot metaphorically — King Aldric\'s body was still warm when they placed his circlet on my head, his blood still wet on the velvet cushion. The court physicians called it poison. The priests called it divine punishment. I called it inconvenient, because now I had to rule a kingdom I\'d spent the last three years trying to leave.\n\n"You swore an oath," Chancellor Voss reminded me, his voice carrying the particular tone of a man who\'d rehearsed this conversation in a mirror. "When the king dies without heir, the crown passes to the Knight Commander."\n\n"I swore that oath when I was nineteen and stupid," I said. "The king had three sons. I never expected—" I gestured at the coffin. "This."\n\nVoss\'s expression didn\'t change. "The sons are all dead, Commander. Two in the eastern campaigns. One by his own hand. The kingdom needs leadership."\n\nThe kingdom needed a lot of things. Leadership was merely the most obvious.', wordCount: 158 },
      ],
    },
  ]

  for (const workData of demoWorks) {
    const author = await prisma.author.findFirst({
      where: { userId: users[workData.authorIndex].id },
    })
    if (!author) continue

    const work = await prisma.work.create({
      data: {
        authorId: author.id,
        title: workData.title,
        description: workData.description,
        formatType: workData.formatType,
        genres: workData.genres,
        tags: workData.tags,
        maturityRating: workData.maturityRating,
        status: workData.status,
        coverImage: null,
        totalViews: Math.floor(Math.random() * 10000),
        totalLikes: Math.floor(Math.random() * 500),
        totalComments: Math.floor(Math.random() * 100),
      },
    })

    for (let i = 0; i < workData.sections.length; i++) {
      const sec = workData.sections[i]
      await prisma.section.create({
        data: {
          workId: work.id,
          title: sec.title,
          content: JSON.stringify([{ id: `block-${i}`, type: 'text', content: sec.content }]),
          wordCount: sec.wordCount,
          status: 'published',
          orderIndex: i,
          publishedAt: new Date(),
        },
      })
    }
    console.log(`  ✓ Work: ${workData.title} (${workData.sections.length} chapters)`)
  }

  // Create some subscriptions between users
  await prisma.subscription.create({ data: { authorId: (await prisma.author.findFirst({ where: { userId: users[0].id } }))!.id, userId: users[1].id } })
  await prisma.subscription.create({ data: { authorId: (await prisma.author.findFirst({ where: { userId: users[1].id } }))!.id, userId: users[2].id } })
  console.log('  ✓ Subscriptions created')

  // Create some likes
  const works = await prisma.work.findMany()
  if (works.length > 0) {
    await prisma.like.create({ data: { workId: works[0].id, userId: users[1].id } })
    await prisma.like.create({ data: { workId: works[0].id, userId: users[2].id } })
    await prisma.like.create({ data: { workId: works[1].id, userId: users[0].id } })
    console.log('  ✓ Likes created')
  }

  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
