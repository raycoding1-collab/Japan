#!/usr/bin/env python3
"""Lay the narration out in time: each line follows the previous one after its own pause.
Voices every sentence (cached), measures it, and writes the narration and chapters into film/film.json
(events are kept as they are). usage: /home/user/tts/venv/bin/python tools/layout.py"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from narrate import say, sentences, SR, GAP

# (pause before the line, text) and ('#', chapter title) markers: a chapter starts in the middle of the pause before its first line.
SCRIPT = [
  ('#', 'Clay and fire'),
  (4.5, "More than fifteen thousand years ago, on a chain of green islands at the edge of Asia, people began to fire pots of clay."),
  (1.8, "They are among the oldest pots in the world."),
  (3.0, "Later potters rolled twisted cord across the wet clay, so we call these people the Jōmon: cord-marked."),
  (2.0, "They fished, hunted and gathered chestnuts, and some of their villages lasted a thousand years."),
  (2.0, "Their potters made pots with rims like flames, and clay figures with great goggle eyes."),
  ('#', 'Rice and mirrors'),
  (3.1, "Then rice farming came across the sea from the mainland, and with it bronze and iron."),
  (1.6, "Villages dug moats, built watchtowers, and kept their rice in granaries on stilts."),
  (1.8, "A Chinese chronicle tells of a queen, Himiko, who ruled by sorcery and was seldom seen."),
  (1.2, "The emperor of Wei sent her a golden seal, and a hundred bronze mirrors."),
  ('#', 'Keyholes'),
  (3.1, "Japan's early kings were buried in great mounds, shaped like keyholes and ringed by moats."),
  (1.6, "On them stood hollow clay figures, called haniwa: houses, horses, warriors and dancers."),
  (1.8, "From these kings descends Japan's imperial family, the oldest reigning monarchy in the world."),
  ('#', 'The rising sun'),
  (3.1, "In the sixth century, Buddhism came from Korea, with its scriptures, its statues, and its carpenters."),
  (1.6, "Prince Shōtoku, it is said, wrote that harmony is to be valued above all things."),
  (1.6, "A letter to the emperor of China began: from the Son of Heaven where the sun rises."),
  (1.0, "Before long the country took the name it still has: Nihon, the origin of the sun."),
  (2.8, "The temple he founded, Hōryū-ji, has the oldest wooden buildings standing anywhere in the world."),
  (1.6, "One firm of temple carpenters, founded in 578, kept working for more than fourteen hundred years."),
  (2.2, "And at Ise, the holiest shrine is rebuilt from fresh cypress every twenty years, as it has been since the seventh century, so that the craft is never forgotten."),
  ('#', 'The Great Buddha'),
  (3.1, "At Nara, an emperor cast a Buddha of bronze, fifteen metres tall. It used up most of the country's bronze."),
  (2.0, "Its eyes were painted in with a great brush, tied to long cords, so that thousands of people could hold it too."),
  ('#', 'The court of beauty'),
  (3.1, "The capital moved to Heian-kyō, today's Kyoto. It would stay there for more than a thousand years."),
  (1.6, "Its court lived for beauty: for poetry, incense, moon-viewing, and robes of twelve layers, matched to the season."),
  (2.0, "Women at court wrote in a new, flowing script, called kana."),
  (1.6, "And Murasaki Shikibu wrote The Tale of Genji, often called the world's first novel."),
  (1.6, "In the painted scrolls of the tale, the roofs are lifted away, so that we can see inside."),
  ('#', 'The warriors'),
  (3.1, "Then the samurai took power. The emperor still reigned, but a military ruler, the shogun, governed, for most of the next seven hundred years."),
  (1.8, "Twice, the Mongols sailed against Japan, and twice, storms helped drive them back. People called them kamikaze: winds of the gods."),
  (2.8, "Swordsmiths folded their steel again and again, into thousands of layers."),
  (0.8, "They coated the blade in clay, heated it, and plunged it into water. The edge turned hard, and the blade took on its curve."),
  ('#', 'Gold and stillness'),
  (3.1, "Under the Ashikaga shoguns, a pavilion covered in gold leaf rose over a quiet pond."),
  (1.6, "Actors in carved masks performed Noh, a theatre still played much as it was six hundred years ago."),
  (1.8, "Zen monks raked gardens of gravel and stone, to quiet the mind."),
  (2.2, "There is a story that a shogun sent a cracked tea bowl to China for repair. It came back held together with ugly metal staples."),
  (0.8, "So Japanese craftsmen found another way. They mended it with lacquer and gold, and made the break the most beautiful part of the bowl."),
  (1.4, "It is called kintsugi: golden joinery."),
  (2.6, "Then the great lords fell out. Kyoto burned, and for a century, the country was at war with itself."),
  ('#', 'Guns and tea'),
  (3.1, "In 1543, Portuguese traders brought guns to Japan. Within a few years, Japanese smiths were making their own."),
  (1.6, "Three warlords, one after another, forced the country back together, and built great white castles to hold it."),
  (2.2, "Amid the wars, the tea master Sen no Rikyū built a tea room just two mats wide, with a door so low that every guest had to bow, and leave his sword outside."),
  (1.4, "His lord, Hideyoshi, had one made of gold."),
  (2.2, "In 1600, in the morning fog at Sekigahara, Tokugawa Ieyasu won the battle that decided who would rule Japan."),
  ('#', 'The floating world'),
  (3.1, "Then came two and a half centuries of peace."),
  (1.2, "Japan closed its doors. Only Dutch and Chinese ships could trade, at a single port: Nagasaki."),
  (2.0, "Edo, today's Tokyo, grew to a million people, perhaps the largest city on Earth."),
  (1.6, "Its people ate sushi from street stalls, crowded into kabuki theatres, and watched fireworks over the river on summer nights."),
  (3.0, "The poet Bashō wrote: An old pond. A frog jumps in. The sound of water."),
  (3.2, "Artists made woodblock prints, carved and printed one colour at a time, and sold them for about the price of a bowl of noodles."),
  (1.6, "The most famous is Hokusai's Great Wave."),
  (4.5, "When Europe saw these prints, painters like Van Gogh and Monet fell in love with them."),
  ('#', 'Black ships'),
  (3.1, "In 1853, American warships, black-hulled and trailing coal smoke, steamed into Edo Bay, and demanded that Japan open up."),
  (1.6, "Fifteen years later the shogun fell, and under the young emperor Meiji, Japan raced to catch up with the West."),
  (1.6, "Samurai cut off their topknots. Within a generation came railways, factories, schools and a parliament."),
  (1.6, "The far north, land of the Ainu, became Hokkaido, and the kingdom of Ryukyu became Okinawa."),
  (1.6, "In 1905, it defeated Russia: the first Asian power in modern times to beat a European one."),
  ('#', 'Empire and ashes'),
  (3.1, "Japan made Korea a colony, and in the 1930s invaded China. Its armies brought war, massacre and forced labour across Asia, and millions died."),
  (2.2, "In 1941, it attacked the United States at Pearl Harbor."),
  (2.2, "American bombers burned Japan's cities. In one night in Tokyo, about a hundred thousand people were killed."),
  (3.0, "In August 1945, two atomic bombs destroyed Hiroshima and Nagasaki."),
  (4.5, "Japan surrendered. Its cities lay in ashes."),
  (3.0, "In Hiroshima, a girl named Sadako, sick from the bomb, folded more than a thousand paper cranes. They have become a wish for peace."),
  ('#', 'The miracle'),
  (3.1, "Japan rebuilt itself, under a new constitution that renounced war."),
  (1.6, "For almost twenty years, its economy grew by around ten percent a year."),
  (1.6, "At Toyota, any worker could stop the whole assembly line by pulling a cord, to fix a problem where it began. Improving everything, a little, every day, was called kaizen."),
  (2.0, "Sony made a radio small enough for a shirt pocket. Almost: its salesmen wore shirts with slightly larger pockets."),
  (2.2, "In 1964, Tokyo held the Olympics. Nine days before, the world's first high-speed railway opened: the Shinkansen."),
  (1.6, "Its bullet trains have since carried billions of passengers, without one being killed in a crash."),
  (2.0, "By 1968, Japan had the second largest economy in the world."),
  (2.0, "In the 1980s its cities glowed. Land in Tokyo became so precious that the grounds of the Imperial Palace were said to be worth more than all of California."),
  (2.0, "Then, in 1990, the bubble burst."),
  ('#', 'Ink and light'),
  (3.1, "Meanwhile, a young medical student named Osamu Tezuka was drawing comics like films: close-ups, long shots, and big, expressive eyes."),
  (1.6, "Manga became something everyone read. In 1995, one weekly manga magazine sold more than six million copies an issue."),
  (1.6, "Its stories came to life as anime, drawn by hand, frame by frame."),
  (1.2, "For one four-second crowd scene, an animator at Studio Ghibli worked for more than a year."),
  (2.4, "Hayao Miyazaki's Spirited Away won an Oscar, and manga, anime and games went round the world."),
  (1.6, "Nintendo, founded in 1889 to make playing cards by hand, became a maker of games played all over the world."),
  ('#', 'The hands'),
  (3.1, "The old crafts carry on. Japan has more companies over a hundred years old than any other country. One inn has been run by the same family since 705."),
  (1.6, "Sushi chefs train for years. Swordsmiths still fold their steel. And in 2013, the shrine at Ise was rebuilt for the sixty-second time."),
  (3.0, "In 2011, the sea rose. A tsunami left nearly twenty thousand people dead or missing, and wrecked the nuclear plant at Fukushima."),
  (2.4, "Along that coast stand old stones, carved by earlier generations: Do not build your homes below this point."),
  (2.2, "Where the water stopped, people are planting a line of cherry trees."),
  (3.0, "Its engineers have built a train that floats at six hundred kilometres an hour, and probes that bring back dust from asteroids."),
  (1.6, "Its people live some of the longest lives on Earth."),
  ('#', 'Mended with gold'),
  (3.1, "This country has been broken many times: by war and fire, by earthquakes, and by the sea."),
  (2.0, "Each time, it was mended, carefully, by hand."),
  (2.6, "And like a bowl mended with gold, it does not hide its seams. It lets them shine."),
]
TAIL = 26.0  # the pull-back, the title and quiet after the last line

if __name__ == '__main__':
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'film', 'film.json')
    spec = json.load(open(path))
    t, chapters, narration, pending = 0.0, [], [], None
    for item in SCRIPT:
        if item[0] == '#': pending = item[1]; continue
        gap, text = item
        start = round(t + gap, 1)
        if pending: chapters.append({'t': 0 if not chapters else round(t + gap * 0.45, 1), 'title': pending}); pending = None
        dur = 0.0
        for s in sentences(text): dur += len(say(s, spec['voice'])) / SR + GAP
        narration.append({'t': start, 'text': text}); t = start + dur - GAP
    spec['duration'] = round(t + TAIL)
    spec['chapters'], spec['narration'] = chapters, narration
    json.dump(spec, open(path, 'w'), indent=1, ensure_ascii=False)
    for c in chapters: print(f"{c['t']:7.1f}  {c['title']}")
    print('duration', spec['duration'], 'lines', len(narration))
