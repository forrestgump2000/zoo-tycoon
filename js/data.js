/* Zoo Tycoon — static game data */
'use strict';

// Tier tables (index = tier 1..6)
const TIER = {
  cost:   [0, 250, 700, 2000, 6000, 18000, 55000],
  attr:   [0, 3, 6, 12, 22, 40, 75],
  food:   [0, 2, 4, 8, 15, 30, 55],
  litter: [0, 3, 2, 2, 1, 1, 1],
  breed:  [0, .06, .045, .035, .026, .02, .014],
  label:  ['', 'Common', 'Uncommon', 'Popular', 'Star', 'Superstar', 'Legend'],
};

const VARIANTS = [
  { id: 'common',  name: '',        label: 'Common',  cost: 1,   attr: 1,   filter: '' },
  { id: 'spotted', name: 'Spotted', label: 'Spotted', cost: 1.4, attr: 1.3, filter: 'contrast(1.25) saturate(1.4)' },
  { id: 'striped', name: 'Striped', label: 'Striped', cost: 1.6, attr: 1.4, filter: 'hue-rotate(28deg) saturate(1.5)' },
  { id: 'golden',  name: 'Golden',  label: 'Golden',  cost: 2.6, attr: 2,   filter: 'sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.15)', glow: '#ffd54a' },
  { id: 'shadow',  name: 'Shadow',  label: 'Shadow',  cost: 3,   attr: 2.3, filter: 'brightness(.55) contrast(1.4) saturate(1.3)', glow: '#7e57c2' },
  { id: 'albino',  name: 'Albino',  label: 'Albino',  cost: 3.6, attr: 2.6, filter: 'grayscale(1) brightness(1.65) contrast(.85)', glow: '#ffffff' },
  { id: 'giant',   name: 'Giant',   label: 'Giant',   cost: 5,   attr: 3.2, filter: 'saturate(1.15)', scale: 1.45 },
  { id: 'rainbow', name: 'Rainbow', label: 'Rainbow', cost: 12,  attr: 6,   filter: '', rainbow: true, glow: '#ff4fd8' },
];
const VARIANT_BY_ID = Object.fromEntries(VARIANTS.map(v => [v.id, v]));

const COMPANIES = [
  { id: 'global',  name: 'Global Fauna Traders',   logo: '🌐', mult: 1,    age: [30, 90],   happy: 70, desc: 'Reliable adult animals at fair market prices.' },
  { id: 'nursery', name: 'Little Paws Nursery',    logo: '🍼', mult: 1.3,  age: [0, 8],     happy: 85, desc: 'Newborns! +30% appeal while young and the longest careers.' },
  { id: 'budget',  name: 'Budget Beasts Co.',      logo: '💸', mult: 0.6,  age: [230, 330], happy: 50, desc: 'Cheap seniors. Not much time left to breed.' },
  { id: 'rescue',  name: 'Second Chance Rescue',   logo: '💚', mult: 0.45, age: [60, 300],  happy: 38, rep: 0.25, desc: 'Rescued animals. Super cheap, need TLC. Boosts reputation.' },
  { id: 'royal',   name: 'Royal Pedigree Imports', logo: '👑', mult: 1.9,  age: [15, 40],   happy: 95, pedigree: true, desc: 'Prize bloodlines: +20% appeal forever & better breeding.' },
];
const COMPANY_BY_ID = Object.fromEntries(COMPANIES.map(c => [c.id, c]));

const BULK = [[50, .22], [25, .15], [10, .1], [5, .05]];

// Species lists: "Name:emoji:tier"
const BIOMES = [
  {
    id: 'forest', name: 'Whispering Forest', icon: '🌲', cost: 0, starter: 'White-tailed Deer', mascot: 'Dottie the Deer', foodTheme: 'Pinecone',
    desc: 'Sunbeams filter through tall pines while deer graze among ferns.',
    sky: ['#8fd3f4', '#d4f1c5'], ground: ['#6fae4f', '#3f7a2c'], path: '#c9a46a', fence: '#7a4f2a',
    decor: ['🌲', '🌳', '🌲', '🍄', '🌿', '🪨', '🌲', '🌳', '🌲'], far: ['🌲', '🌲', '🌳'], particles: 'leaves',
    attractions: [['Nature Trail', '🥾'], ['Treetop Walkway', '🌉'], ['Canopy Zipline', '🪂']],
    species: 'White-tailed Deer:🦌:1|Cottontail Rabbit:🐇:1|Red Squirrel:🐿️:1|Chipmunk:🐿️:1|Raccoon:🦝:1|Hedgehog:🦔:1|Striped Skunk:🦨:1|Garter Snake:🐍:1|American Toad:🐸:1|Box Turtle:🐢:1|Wild Turkey:🦃:2|Badger:🦡:2|Beaver:🦫:2|Porcupine:🦔:2|Barn Owl:🦉:2|Woodpecker:🐦:2|Red Fox:🦊:2|Wild Boar:🐗:2|Red-tailed Hawk:🦅:3|Bobcat:🐈:3|Elk:🦌:3|Gray Wolf:🐺:3|Lynx:🐈:3|Black Bear:🐻:4|Moose:🫎:4|Cougar:🐆:4|American Bison:🦬:4|Bald Eagle:🦅:4|Grizzly Bear:🐻:5|White Stag:🦌:6',
  },
  {
    id: 'farm', name: 'Sunny Acres Farm', icon: '🚜', cost: 4000, starter: 'Chicken', mascot: 'Clucky the Chicken', foodTheme: 'Barnyard',
    desc: 'Red barns, golden hay bales and the happy clucks of the coop.',
    sky: ['#9ad7ff', '#fff3c4'], ground: ['#9ccc65', '#6d9b3a'], path: '#d7b377', fence: '#b5651d',
    decor: ['🌻', '🌾', '🏡', '🌽', '🌾', '🪵', '🌻', '🚜', '🌾'], far: ['🌳', '🏡', '🌳'], particles: 'pollen',
    attractions: [['Petting Corral', '🤲'], ['Hay Ride', '🛻'], ['Harvest Festival', '🎪']],
    species: 'Chicken:🐔:1|Rooster:🐓:1|Duck:🦆:1|Goose:🪿:1|Turkey:🦃:1|Guinea Pig:🐹:1|Rabbit:🐰:1|Quail:🐦:1|Pigeon:🕊️:1|Honeybee Hive:🐝:1|Barn Cat:🐈:1|Sheep:🐑:2|Goat:🐐:2|Angora Goat:🐐:2|Pig:🐖:2|Miniature Pig:🐷:2|Donkey:🫏:2|Pony:🐴:2|Mule:🫏:2|Sheepdog:🐕:2|Cow:🐄:3|Highland Cow:🐄:3|Horse:🐎:3|Llama:🦙:3|Alpaca:🦙:3|Ox:🐂:3|Water Buffalo:🐃:3|Yak:🐂:3|Peacock:🦚:3|Clydesdale:🐎:4',
  },
  {
    id: 'desert', name: 'Scorched Sands Desert', icon: '🏜️', cost: 10000, starter: 'Rattlesnake', mascot: 'Rattles the Snake', foodTheme: 'Oasis',
    desc: 'Heat shimmers over dunes, cacti stand guard and rattles echo.',
    sky: ['#ffd27f', '#ffeccc'], ground: ['#e8c07a', '#c9954c'], path: '#f2d9a6', fence: '#8d6e63',
    decor: ['🌵', '🌵', '🪨', '🌵', '🦴', '🪨', '🌵', '🌵'], far: ['🏜️', '⛰️'], particles: 'sand',
    attractions: [['Sandstone Lookout', '🪨'], ['Camel Caravan', '🐪'], ['Oasis Lagoon', '🏝️']],
    species: 'Rattlesnake:🐍:1|Scorpion:🦂:1|Desert Tarantula:🕷️:1|Jackrabbit:🐇:1|Horned Lizard:🦎:1|Kangaroo Rat:🐀:1|Jerboa:🐁:1|Dung Beetle:🪲:1|Sidewinder:🐍:2|Gila Monster:🦎:2|Roadrunner:🐦:2|Desert Tortoise:🐢:2|Coyote:🐺:2|Thorny Devil:🦎:2|Bearded Dragon:🦎:2|Vulture:🦅:2|Desert Hedgehog:🦔:2|Javelina:🐗:2|Uromastyx:🦎:2|Fennec Fox:🦊:3|Sand Cat:🐈:3|Addax:🐐:3|Caracal:🐈:3|Desert Bighorn:🐏:3|Arabian Wolf:🐺:3|Golden Eagle:🦅:3|Monitor Lizard:🦎:3|Arabian Oryx:🦌:4|Dromedary Camel:🐪:4|Bactrian Camel:🐫:4',
  },
  {
    id: 'wetlands', name: 'Misty Bayou Wetlands', icon: '🪷', cost: 18000, starter: 'Bullfrog', mascot: 'Ribbit the Frog', foodTheme: 'Bayou',
    desc: 'Fog curls over lily pads while gators drift through the reeds.',
    sky: ['#a5d6a7', '#e0f2f1'], ground: ['#6b8e5a', '#3e6150'], path: '#a1887f', fence: '#5d4037',
    decor: ['🌾', '🪷', '🌿', '🪵', '🌾', '🍃', '🪷', '🌳'], far: ['🌳', '🌳'], particles: 'mist',
    attractions: [['Boardwalk', '🪵'], ['Swamp Boat Tour', '🛶'], ['Bayou Lantern Night', '🏮']],
    species: 'Bullfrog:🐸:1|Mallard:🦆:1|Pond Turtle:🐢:1|Muskrat:🐀:1|Nutria:🐀:1|Salamander:🦎:1|Newt:🦎:1|Crayfish:🦞:1|Catfish:🐟:1|Dragonfly:🦗:1|Canada Goose:🪿:1|Great Heron:🐦:2|Snowy Egret:🦢:2|Beaver:🦫:2|Snapping Turtle:🐢:2|Water Moccasin:🐍:2|Longnose Gar:🐟:2|Mute Swan:🦢:2|Kingfisher:🐦:2|River Otter:🦦:3|Pelican:🐦:3|Roseate Spoonbill:🦩:3|Flamingo:🦩:3|Capybara:🦫:3|Marsh Harrier:🦅:3|Axolotl:🦎:3|American Alligator:🐊:4|Black Caiman:🐊:4|Manatee:🦭:5|Green Anaconda:🐍:5',
  },
  {
    id: 'taiga', name: 'Frostpine Taiga', icon: '🌨️', cost: 30000, starter: 'Red Fox', mascot: 'Rusty the Fox', foodTheme: 'Timberline',
    desc: 'Snow-dusted spruce, crackling cabins and howls in the cold air.',
    sky: ['#a9c9e8', '#e3eef7'], ground: ['#8fa98a', '#53704f'], path: '#b8a88a', fence: '#5d4037',
    decor: ['🌲', '🌲', '🌲', '🪵', '🍄', '🌲', '🪨', '🌲'], far: ['🏔️', '🌲', '🏔️'], particles: 'snowlight',
    attractions: [['Log Cabin Lodge', '🛖'], ['Husky Sled Run', '🛷'], ['Aurora Observatory', '🌌']],
    species: 'Red Fox:🦊:2|Snowshoe Hare:🐇:1|Ermine:🦦:1|Siberian Chipmunk:🐿️:1|Common Raven:🐦‍⬛:1|Red Squirrel:🐿️:1|Boreal Toad:🐸:1|Crossbill:🐦:1|Sable:🦦:2|Pine Marten:🦦:2|Great Gray Owl:🦉:2|Capercaillie:🦃:2|Musk Deer:🦌:2|Wild Boar:🐗:2|Beaver:🦫:2|Eurasian Otter:🦦:2|Siberian Husky:🐕:2|Lynx:🐈:3|Wolverine:🦡:3|Reindeer:🦌:3|Timber Wolf:🐺:3|Elk:🦌:3|Eagle-Owl:🦉:3|Golden Eagle:🦅:3|Steller Sea Eagle:🦅:3|Moose:🫎:4|Brown Bear:🐻:4|Wood Bison:🦬:4|Amur Leopard:🐆:5|Siberian Tiger:🐅:6',
  },
  {
    id: 'insectarium', name: 'Buzzing Bug House', icon: '🦋', cost: 40000, starter: 'Monarch Butterfly', mascot: 'Flutter the Monarch', foodTheme: 'Honeycomb',
    desc: 'A sun-warmed glasshouse of blossoms, wings and tiny wonders.',
    sky: ['#d7f5d8', '#fffde7'], ground: ['#8bc34a', '#558b2f'], path: '#d7ccc8', fence: '#8d9a8a',
    decor: ['🌺', '🌼', '🌸', '🍀', '🌷', '🌻', '🌿', '🌺', '🌼'], far: ['🌳', '🌸'], particles: 'sparkle', motion: 'flutter',
    attractions: [['Bug Microscope Lab', '🔬'], ['Butterfly Garden', '🌺'], ['Giant Bug Dome', '🏟️']],
    species: 'Monarch Butterfly:🦋:1|Ladybug:🐞:1|Honeybee:🐝:1|Bumblebee:🐝:1|Ant Colony:🐜:1|Beetle:🪲:1|Grasshopper:🦗:1|Cricket:🦗:1|Caterpillar:🐛:1|Garden Snail:🐌:1|Earthworm:🪱:1|Cockroach:🪳:1|Fruit Fly:🪰:1|Mosquito:🦟:1|Stag Beetle:🪲:2|Rhino Beetle:🪲:2|Praying Mantis:🦗:2|Firefly:🪲:2|Centipede:🐛:2|Leaf Insect:🦗:2|Walking Stick:🦗:2|Tarantula:🕷️:2|Emperor Scorpion:🦂:2|Atlas Moth:🦋:3|Blue Morpho:🦋:3|Goliath Beetle:🪲:3|Orchid Mantis:🦗:3|Hercules Beetle:🪲:4|Birdwing Butterfly:🦋:4|Queen Alexandra Birdwing:🦋:5',
  },
  {
    id: 'arctic', name: 'Polar Ice Arctic', icon: '🧊', cost: 55000, starter: 'Snowy Owl', mascot: 'Hoot the Snowy Owl', foodTheme: 'Igloo',
    desc: 'Glittering ice floes, swirling snow and penguins on parade.',
    sky: ['#b3e5fc', '#f4fcff'], ground: ['#ffffff', '#cfe8f5'], path: '#9ec9e0', fence: '#78909c',
    decor: ['🧊', '❄️', '🧊', '⛄', '🧊', '🧊', '❄️'], far: ['🏔️', '🏔️', '🧊'], particles: 'snow',
    attractions: [['Igloo Village', '🛖'], ['Ice Skating Rink', '⛸️'], ['Northern Lights Dome', '🌌']],
    species: 'Snowy Owl:🦉:2|Arctic Hare:🐇:1|Lemming:🐹:1|Snow Goose:🪿:1|Ptarmigan:🐦:1|Arctic Tern:🐦:1|Ermine:🦦:1|Snow Petrel:🕊️:1|Arctic Char:🐟:1|Arctic Fox:🦊:2|Atlantic Puffin:🐦:2|Harp Seal:🦭:3|Adélie Penguin:🐧:3|Gentoo Penguin:🐧:3|Rockhopper Penguin:🐧:3|Caribou:🦌:3|Sea Otter:🦦:3|Gyrfalcon:🦅:3|King Penguin:🐧:4|Emperor Penguin:🐧:4|Musk Ox:🐂:4|Arctic Wolf:🐺:4|Elephant Seal:🦭:4|Leopard Seal:🦭:4|Walrus:🦭:5|Polar Bear:🐻‍❄️:6|Beluga Whale:🐋:6|Narwhal:🐋:6|Orca:🐋:6|Bowhead Whale:🐋:6',
  },
  {
    id: 'alpine', name: 'Summit Peaks Alpine', icon: '🏔️', cost: 75000, starter: 'Mountain Goat', mascot: 'Billy the Goat', foodTheme: 'Chalet',
    desc: 'Wildflower meadows beneath jagged snowy peaks and cable cars.',
    sky: ['#81d4fa', '#e1f5fe'], ground: ['#9ccc65', '#689f38'], path: '#bcaaa4', fence: '#6d4c41',
    decor: ['🌲', '🪨', '🌼', '🌲', '🪨', '🌸', '🌲'], far: ['🏔️', '⛰️', '🏔️'], particles: 'snowlight',
    attractions: [['Mountain Overlook', '🔭'], ['Cable Car', '🚡'], ['Summit Chalet', '🏔️']],
    species: 'Mountain Goat:🐐:2|Marmot:🐿️:1|Pika:🐹:1|Alpine Salamander:🦎:1|Ermine:🦦:1|Mountain Hare:🐇:1|Chamois:🐐:2|Chinchilla:🐭:2|Alpaca:🦙:2|Llama:🦙:2|St. Bernard:🐕:2|Ibex:🐐:3|Bighorn Sheep:🐏:3|Golden Eagle:🦅:3|Bearded Vulture:🦅:3|Yak:🐂:3|Vicuña:🦙:3|Red Panda:🦝:3|Takin:🐂:3|Himalayan Tahr:🐐:3|Gray Wolf:🐺:3|Andean Condor:🦅:4|Spectacled Bear:🐻:4|Mountain Lion:🐆:4|Markhor:🐐:4|Brown Bear:🐻:4|Lammergeier:🦅:4|Snow Leopard:🐆:5|Golden Snub Monkey:🐒:4|Yeti (Legendary):👣:6',
  },
  {
    id: 'china', name: 'Bamboo Kingdom (China)', icon: '🏯', cost: 100000, starter: 'Giant Panda', mascot: 'Bao the Panda', foodTheme: 'Dim Sum',
    desc: 'Lanterns sway over bamboo groves, pagodas and cherry blossoms.',
    sky: ['#ffd3c4', '#fff8e1'], ground: ['#8bc34a', '#558b2f'], path: '#e0c097', fence: '#c62828',
    decor: ['🎋', '🎍', '🌸', '🏮', '🎋', '🎋', '🌸', '🎍', '🎋'], far: ['🏯', '⛰️', '🏯'], particles: 'petals',
    attractions: [['Lantern Garden', '🏮'], ['Bamboo Maze', '🎋'], ['Dragon Dance Pavilion', '🐉']],
    species: 'Giant Panda:🐼:5|Mandarin Duck:🦆:1|Silkworm:🐛:1|Koi:🐟:1|Chinese Hamster:🐹:1|Golden Pheasant:🐓:2|Chinese Water Deer:🦌:2|Muntjac:🦌:2|Softshell Turtle:🐢:2|Tibetan Fox:🦊:2|Rhesus Macaque:🐒:2|Red Panda:🦝:3|Giant Salamander:🦎:3|Crested Ibis:🐦:3|Takin:🐂:3|Yak:🐂:3|Père David\'s Deer:🦌:3|Red-crowned Crane:🦢:3|Golden Monkey:🐒:3|White-cheeked Gibbon:🐒:3|Dhole:🐕:3|Golden Snub-nosed Monkey:🐒:4|Chinese Alligator:🐊:4|Chinese Pangolin:🦔:4|Bactrian Camel:🐫:4|Asiatic Black Bear:🐻:4|Clouded Leopard:🐆:4|Przewalski\'s Horse:🐎:4|Snow Leopard:🐆:5|South China Tiger:🐅:6',
  },
  {
    id: 'africa', name: 'Savanna Safari (Africa)', icon: '🦁', cost: 150000, starter: 'Meerkat', mascot: 'Mo the Meerkat', foodTheme: 'Savanna',
    desc: 'Golden grasslands, acacia silhouettes and the roar of the pride.',
    sky: ['#ffcc80', '#fff3e0'], ground: ['#d4b05a', '#a1883f'], path: '#e6c78e', fence: '#6d4c41',
    decor: ['🌳', '🌾', '🪨', '🌾', '🌳', '🌾', '🌳', '🪨'], far: ['⛰️', '🌳'], particles: 'dust',
    attractions: [['Safari Lookout', '🔭'], ['Jeep Safari', '🚙'], ['Hot Air Balloon Safari', '🎈']],
    species: 'Meerkat:🦦:1|Crested Porcupine:🦔:1|Warthog:🐗:2|Thomson\'s Gazelle:🦌:2|Impala:🦌:2|Aardvark:🐖:2|Bush Baby:🐒:2|Zebra:🦓:3|Spotted Hyena:🐕:3|Wildebeest:🐃:3|Ostrich:🐦:3|Flamingo:🦩:3|African Wild Dog:🐕:3|Baboon:🐒:3|Ring-tailed Lemur:🐒:3|Cape Buffalo:🐃:3|Secretary Bird:🦅:3|Greater Kudu:🦌:3|Serval:🐈:3|Nile Crocodile:🐊:4|Pangolin:🦔:4|Mandrill:🐒:4|Giraffe:🦒:5|Hippopotamus:🦛:5|Chimpanzee:🐒:5|Cheetah:🐆:5|Leopard:🐆:5|Okapi:🦒:5|Lion:🦁:6|African Elephant:🐘:6|Black Rhino:🦏:6|Silverback Gorilla:🦍:6',
  },
  {
    id: 'rainforest', name: 'Emerald Rainforest', icon: '🌴', cost: 200000, starter: 'Spider Monkey', mascot: 'Coco the Monkey', foodTheme: 'Tiki',
    desc: 'Dripping vines, misty waterfalls and calls from the canopy.',
    sky: ['#5bab5f', '#c8e6c9'], ground: ['#2e7d32', '#1b5e20'], path: '#8d6e63', fence: '#4e342e',
    decor: ['🌴', '🌿', '🌺', '🍄', '🌴', '🪴', '🌿', '🌺', '🌴'], far: ['🌴', '🌳', '🌴'], particles: 'rain',
    attractions: [['Jungle Rope Bridge', '🌉'], ['Waterfall Cave', '💦'], ['Canopy Sky Tram', '🚠']],
    species: 'Spider Monkey:🐒:2|Red-eyed Tree Frog:🐸:1|Leafcutter Ants:🐜:1|Morpho Butterfly:🦋:1|Poison Dart Frog:🐸:2|Howler Monkey:🐒:2|Iguana:🦎:2|Chameleon:🦎:2|Kinkajou:🐒:2|Tamarin:🐒:2|Marmoset:🐒:2|Piranha:🐟:2|Coati:🦝:2|Tarsier:🐒:2|Scarlet Macaw:🦜:3|Toucan:🐦:3|Two-toed Sloth:🦥:3|Boa Constrictor:🐍:3|Capybara:🦫:3|Tapir:🐖:3|Ocelot:🐈:3|Caiman:🐊:3|Reticulated Python:🐍:3|Hornbill:🐦:3|Green Anaconda:🐍:4|Harpy Eagle:🦅:4|Sun Bear:🐻:4|Cassowary:🐦:4|Bird of Paradise:🦚:4|Jaguar:🐆:5|Orangutan:🦧:6|Sumatran Tiger:🐅:6',
  },
  {
    id: 'aviary', name: 'Skyward Aviary', icon: '🦜', cost: 260000, starter: 'Parakeet', mascot: 'Pip the Parakeet', foodTheme: 'Nest',
    desc: 'A soaring netted dome filled with song, color and feathers.',
    sky: ['#b3e5fc', '#fce4ec'], ground: ['#aed581', '#7cb342'], path: '#d7ccc8', fence: '#90a4ae',
    decor: ['🌳', '🌸', '🪺', '🌳', '🌼', '🌳', '🌸'], far: ['🌳', '🌳'], particles: 'feathers', motion: 'fly',
    attractions: [['Feeding Station', '🌻'], ['Bird Show Theater', '🎭'], ['Sky Walk Dome', '🌐']],
    species: 'Parakeet:🦜:1|Canary:🐤:1|Cockatiel:🦜:1|Lovebird:🦜:1|Hummingbird:🐦:1|Robin:🐦:1|Blue Jay:🐦:1|Cardinal:🐦:1|Dove:🕊️:1|Raven:🐦‍⬛:1|African Grey Parrot:🦜:2|Mute Swan:🦢:2|Stork:🐦:2|Pelican:🐦:2|Barn Owl:🦉:2|Puffin:🐧:2|Macaw:🦜:3|Peacock:🦚:3|Flamingo:🦩:3|Peregrine Falcon:🦅:3|Crowned Crane:🦢:3|Toucan:🐦:3|Kiwi:🐦:3|Hornbill:🐦:3|Ostrich:🐦:3|Bald Eagle:🦅:4|California Condor:🦅:4|Harpy Eagle:🦅:4|Cassowary:🐦:4|Shoebill:🐦:5|Dodo (Cloned):🦤:6',
  },
  {
    id: 'aquarium', name: 'Deep Blue Aquarium', icon: '🐠', cost: 350000, starter: 'Goldfish', mascot: 'Goldie the Goldfish', foodTheme: 'Coral Reef',
    desc: 'Shimmering tanks, kelp forests and sharks gliding overhead.',
    sky: ['#0b3d91', '#4fc3f7'], ground: ['#ffe0b2', '#e6b980'], path: '#607d8b', fence: '#b3e5fc',
    decor: ['🪸', '🌿', '🐚', '🪨', '🪸', '🌿', '🪸', '🐚'], far: ['🪸', '🪨'], particles: 'bubbles', motion: 'swim',
    attractions: [['Touch Pool', '🖐️'], ['Underwater Tunnel', '🚇'], ['Dolphin Show Stadium', '🏟️']],
    species: 'Goldfish:🐟:1|Clownfish:🐠:1|Betta Fish:🐟:1|Koi:🐟:1|Hermit Crab:🦀:1|Shrimp:🦐:1|Starfish:⭐:1|Sea Snail:🐌:1|Oyster:🦪:1|Brain Coral:🪸:1|Blue Tang:🐠:2|Angelfish:🐠:2|Moon Jellyfish:🪼:2|Pufferfish:🐡:2|Lobster:🦞:2|Squid:🦑:2|Seahorse:🐠:2|Octopus:🐙:3|Lionfish:🐠:3|Stingray:🐟:3|Moray Eel:🐍:3|Nautilus:🐚:3|Sea Otter:🦦:3|Sea Turtle:🐢:4|Harbor Seal:🦭:4|Manatee:🦭:4|Swordfish:🐟:4|Ocean Sunfish:🐟:4|Reef Shark:🦈:5|Hammerhead Shark:🦈:5|Manta Ray:🐟:5|Bottlenose Dolphin:🐬:5|Giant Squid:🦑:5|Great White Shark:🦈:6|Whale Shark:🦈:6|Humpback Whale:🐋:6',
  },
  {
    id: 'outback', name: 'Red Rock Outback', icon: '🦘', cost: 450000, starter: 'Kangaroo', mascot: 'Joey the Kangaroo', foodTheme: 'Billabong',
    desc: 'Rust-red earth, eucalyptus shade and kangaroos bounding by.',
    sky: ['#ffb74d', '#ffe0b2'], ground: ['#d0603a', '#a83f1e'], path: '#f2c6a8', fence: '#5d4037',
    decor: ['🌳', '🪨', '🌾', '🦴', '🪨', '🌳', '🌾'], far: ['🪨', '⛰️'], particles: 'dust',
    attractions: [['Walkabout Trail', '🥾'], ['Kangaroo Mob Walk', '🦘'], ['Campfire Theatre', '🔥']],
    species: 'Kangaroo:🦘:2|Budgerigar:🦜:1|Galah:🦜:1|Sugar Glider:🐿️:1|Brushtail Possum:🐀:1|Huntsman Spider:🕷️:1|Wallaby:🦘:2|Wombat:🐹:2|Dingo:🐕:2|Kookaburra:🐦:2|Cockatoo:🦜:2|Frilled Lizard:🦎:2|Quokka:🐹:2|Bilby:🐇:2|Goanna:🦎:2|Numbat:🐿️:2|Black Swan:🦢:2|Thorny Devil:🦎:2|Koala:🐨:3|Emu:🐦:3|Tasmanian Devil:🦡:3|Echidna:🦔:3|Inland Taipan:🐍:3|Red Kangaroo:🦘:3|Tree Kangaroo:🦘:3|Lyrebird:🦚:3|Wedge-tailed Eagle:🦅:3|Platypus:🦫:4|Cassowary:🐦:4|Saltwater Crocodile:🐊:5',
  },
  {
    id: 'nocturnal', name: 'Moonlight Nocturnal House', icon: '🌙', cost: 600000, starter: 'Fruit Bat', mascot: 'Bruce the Bat', foodTheme: 'Midnight',
    desc: 'An eternal starlit night of glowing eyes and fireflies.',
    sky: ['#0b1026', '#2c2f6b'], ground: ['#2e3b2e', '#18221a'], path: '#4a4a6a', fence: '#3e3e5e',
    decor: ['🌳', '🍄', '🌲', '🪨', '🍄', '🌳', '🌲'], far: ['🌲', '🌳'], particles: 'fireflies', night: true,
    attractions: [['Glow Path', '✨'], ['Night Vision Tour', '🔦'], ['Moonlight Planetarium', '🔭']],
    species: 'Fruit Bat:🦇:1|Hedgehog:🦔:1|Opossum:🐀:1|Firefly:🪲:1|Raccoon:🦝:1|Skunk:🦨:1|Luna Moth:🦋:1|Leopard Gecko:🦎:1|Field Mouse:🐁:1|Brown Rat:🐀:1|Glow Worm:🐛:1|Vampire Bat:🦇:2|Barn Owl:🦉:2|Bush Baby:🐒:2|Kinkajou:🐒:2|Armadillo:🦔:2|Sugar Glider:🐿️:2|Flying Squirrel:🐿️:2|Scorpion:🦂:2|Night Monkey:🐒:2|Aye-aye:🐒:3|Slow Loris:🐒:3|Kiwi:🐦:3|Fennec Fox:🦊:3|Tarsier:🐒:3|Aardvark:🐖:3|Binturong:🐈:3|Ocelot:🐈:3|Eagle-Owl:🦉:3|Pangolin:🦔:4|Black Panther:🐈‍⬛:5',
  },
  {
    id: 'prehistoric', name: 'Jurassic Frontier', icon: '🦖', cost: 2500000, starter: 'Triceratops', mascot: 'Trixie the Triceratops', foodTheme: 'Fossil',
    desc: 'Smoking volcanoes, giant ferns and the thunder of ancient footsteps.',
    sky: ['#ff8a65', '#ffccbc'], ground: ['#6d8b3a', '#4a5f25'], path: '#a1887f', fence: '#3e2723',
    decor: ['🌴', '🌿', '🪨', '🦴', '🌴', '🥚', '🌿', '🌴'], far: ['🌋', '⛰️', '🌋'], particles: 'embers',
    attractions: [['Fossil Dig Site', '⛏️'], ['Dino Safari Jeep', '🚙'], ['Jurassic Sky Gondola', '🚠']],
    species: 'Triceratops:🦕:4|Compsognathus:🦖:1|Archaeopteryx:🐦:2|Dimetrodon:🦎:2|Moa:🐦:2|Dodo:🦤:2|Velociraptor:🦖:3|Dilophosaurus:🦖:3|Glyptodon:🐢:3|Terror Bird:🐦:3|Irish Elk:🦌:3|Pachycephalosaurus:🦕:3|Iguanodon:🦕:3|Parasaurolophus:🦕:3|Stegosaurus:🦕:4|Ankylosaurus:🦕:4|Woolly Rhino:🦏:4|Cave Bear:🐻:4|Pteranodon:🦅:4|Giant Ground Sloth:🦥:4|Smilodon:🐅:5|Woolly Mammoth:🦣:5|Allosaurus:🦖:5|Quetzalcoatlus:🦅:5|Diplodocus:🦕:5|Spinosaurus:🦖:6|Brachiosaurus:🦕:6|Tyrannosaurus Rex:🦖:6',
  },
];

const BIOME_BY_ID = Object.fromEntries(BIOMES.map(b => [b.id, b]));

// Expand species
const SPECIES = {};
const FLUTTER = new Set(['🦋', '🐝', '🦇', '🪰', '🦟', '🐞']);
const FLYERS = new Set(['🦅', '🦉', '🕊️', '🦜', '🐦', '🐦‍⬛', '🐤', '🦢', '🦩', '🦚']);
const SWIMMERS = new Set(['🐟', '🐠', '🐡', '🦈', '🐬', '🐋', '🐙', '🦑', '🪼', '🦐']);
const SLITHER = new Set(['🐍', '🐛', '🪱', '🐌']);
const HOPPERS = new Set(['🐇', '🐰', '🦘', '🐸', '🦗']);

for (const b of BIOMES) {
  b.speciesKeys = [];
  b.species.split('|').forEach((s, i) => {
    const [name, emoji, t] = s.split(':');
    const tier = +t;
    let motion = 'walk';
    if (b.motion === 'swim' || SWIMMERS.has(emoji)) motion = 'swim';
    else if (FLUTTER.has(emoji)) motion = 'flutter';
    else if (b.motion === 'fly' && FLYERS.has(emoji)) motion = 'fly';
    else if (FLYERS.has(emoji) && /eagle|hawk|falcon|owl|vulture|condor|harrier|lammergeier|pteranodon|quetzal|gyrfalcon|petrel|tern/i.test(name)) motion = 'fly';
    else if (SLITHER.has(emoji)) motion = 'slither';
    else if (HOPPERS.has(emoji)) motion = 'hop';
    const key = b.id + ':' + i;
    SPECIES[key] = {
      key, name, emoji, tier, biome: b.id, motion,
      adultAge: 18 + tier * 6,
      lifespan: 380 + tier * 70,
      size: [0, 38, 42, 48, 54, 62, 72][tier],
    };
    b.speciesKeys.push(key);
  });
  b.starterKey = b.speciesKeys.find(k => SPECIES[k].name === b.starter);
}

const LISTING_COUNT = BIOMES.reduce((n, b) => n + b.speciesKeys.length * VARIANTS.length, 0);

function speciesBaseCost(sp, variantId) { return Math.round(TIER.cost[sp.tier] * VARIANT_BY_ID[variantId].cost); }
function speciesAttr(sp, variantId) { return TIER.attr[sp.tier] * VARIANT_BY_ID[variantId].attr; }
function displayName(sp, variantId) { const v = VARIANT_BY_ID[variantId]; return (v.name ? v.name + ' ' : '') + sp.name; }

// Facility chains (per-biome)
const FAC = {
  enclosure: {
    label: 'Enclosures', icon: '🏞️', max: 8, desc: 'House your animals. Better habitats = happier animals & more appeal.', levels: [
      { name: 'Basic Pen', icon: '🪵', cost: 500, cap: 4, happy: 0, appeal: 0, maint: 2 },
      { name: 'Fenced Habitat', icon: '🚧', cost: 2500, cap: 8, happy: 5, appeal: 2, maint: 5 },
      { name: 'Naturalistic Habitat', icon: '🌿', cost: 9000, cap: 14, happy: 12, appeal: 6, maint: 10 },
      { name: 'Premium Sanctuary', icon: '🏡', cost: 30000, cap: 22, happy: 18, appeal: 14, maint: 20 },
      { name: 'Mega Reserve', icon: '🏰', cost: 90000, cap: 35, happy: 25, appeal: 30, maint: 40 },
    ],
  },
  keeper: {
    label: 'Zookeepers', icon: '🧑‍🌾', max: 12, desc: 'Each keeper cares for a number of animals. Understaffed = unhappy animals.', levels: [
      { name: 'Trainee Keeper', icon: '🧑‍🎓', cost: 300, salary: 12, handles: 5, happy: 0 },
      { name: 'Zookeeper', icon: '🧑‍🌾', cost: 1500, salary: 25, handles: 10, happy: 4 },
      { name: 'Senior Keeper', icon: '🧑‍🔧', cost: 6000, salary: 50, handles: 18, happy: 8 },
      { name: 'Head Veterinarian', icon: '🧑‍⚕️', cost: 20000, salary: 100, handles: 30, happy: 14, breed: .5 },
    ],
  },
  restroom: {
    label: 'Restrooms', icon: '🚻', max: 10, desc: 'Visitors need to go! Too few restrooms tanks satisfaction.', levels: [
      { name: 'Port-a-Potty', icon: '🚽', cost: 250, cap: 40, maint: 2, sat: 0 },
      { name: 'Restroom', icon: '🚻', cost: 1500, cap: 130, maint: 6, sat: 2 },
      { name: 'Deluxe Restroom', icon: '🚾', cost: 6000, cap: 350, maint: 14, sat: 4 },
      { name: 'Luxury Spa Restroom', icon: '🛁', cost: 25000, cap: 900, maint: 30, sat: 8 },
    ],
  },
  food: {
    label: 'Restaurants', icon: '🍔', max: 10, desc: 'Hungry visitors spend money. Bigger venues serve more & charge more.', levels: [
      { name: 'Snack Cart', icon: '🌭', cost: 350, cap: 45, spend: 3, maint: 3, sat: 0 },
      { name: 'Food Stand', icon: '🍔', cost: 2000, cap: 140, spend: 4.5, maint: 8, sat: 1 },
      { name: 'Café', icon: '☕', cost: 8000, cap: 350, spend: 6.5, maint: 18, sat: 2 },
      { name: 'Restaurant', icon: '🍝', cost: 30000, cap: 900, spend: 9, maint: 40, sat: 4 },
      { name: 'Gourmet Bistro', icon: '🍷', cost: 100000, cap: 2200, spend: 14, maint: 90, sat: 6 },
    ],
  },
  gift: {
    label: 'Gift Shops', icon: '🎁', max: 6, desc: 'Plushies, hats and snow globes. Pure profit!', levels: [
      { name: 'Souvenir Kiosk', icon: '🎈', cost: 600, cap: 50, spend: 2.5, maint: 3 },
      { name: 'Gift Shop', icon: '🎁', cost: 5000, cap: 200, spend: 4.5, maint: 10 },
      { name: 'Mega Store', icon: '🛍️', cost: 25000, cap: 700, spend: 7, maint: 30 },
    ],
  },
  mascot: {
    label: 'Mascots', icon: '🎭', max: 2, desc: 'A costumed star who draws crowds into this area.', levels: [
      { name: 'Costume Intern', icon: '🧸', cost: 1200, salary: 15, boost: .06, sat: 1 },
      { name: 'Pro Mascot', icon: '🎭', cost: 8000, salary: 45, boost: .13, sat: 3 },
      { name: 'Celebrity Mascot', icon: '🌟', cost: 40000, salary: 140, boost: .26, sat: 6 },
    ],
  },
  themed: {
    label: 'Themed Attractions', icon: '🎟️', max: 3, desc: 'Signature experiences unique to this area.', themed: true, levels: [
      { cost: 3000, appeal: 8, fee: 1, cap: 150, maint: 5 },
      { cost: 15000, appeal: 25, fee: 2, cap: 450, maint: 15 },
      { cost: 60000, appeal: 70, fee: 4, cap: 1300, maint: 40 },
    ],
  },
  ride: {
    label: 'Rides', icon: '🎡', max: 3, desc: 'Classic rides that charge a ticket and add buzz.', levels: [
      { name: 'Carousel', icon: '🎠', cost: 4000, appeal: 6, fee: 1.5, cap: 200, maint: 8 },
      { name: 'Mini Train', icon: '🚂', cost: 15000, appeal: 15, fee: 2, cap: 500, maint: 18 },
      { name: 'Ferris Wheel', icon: '🎡', cost: 50000, appeal: 35, fee: 3, cap: 1100, maint: 40 },
      { name: 'Roller Coaster', icon: '🎢', cost: 150000, appeal: 80, fee: 5, cap: 2600, maint: 90 },
    ],
  },
  seating: {
    label: 'Rest Areas', icon: '🪑', max: 6, desc: 'Tired feet = grumpy guests. Add places to rest.', levels: [
      { name: 'Benches', icon: '🪑', cost: 200, sat: 1, appeal: 0, maint: 1 },
      { name: 'Picnic Grove', icon: '🧺', cost: 1500, sat: 3, appeal: 1, maint: 3 },
      { name: 'Garden Plaza', icon: '⛲', cost: 8000, sat: 6, appeal: 4, maint: 8 },
    ],
  },
};
const FAC_ORDER = ['enclosure', 'keeper', 'restroom', 'food', 'gift', 'seating', 'themed', 'ride', 'mascot'];

function facLevel(type, level, biomeId) {
  const L = FAC[type].levels[level];
  if (FAC[type].themed) {
    const b = BIOME_BY_ID[biomeId];
    const [name, icon] = b.attractions[level];
    return Object.assign({ name, icon }, L);
  }
  if (type === 'food') return Object.assign({}, L, { name: BIOME_BY_ID[biomeId].foodTheme + ' ' + L.name });
  return L;
}

// Global park upgrades
const GATES = [
  { name: 'Wooden Gate', icon: '🚪', cost: 0, boost: 0, rep: 0 },
  { name: 'Ticket Booth', icon: '🎫', cost: 3000, boost: .08, rep: 2 },
  { name: 'Grand Entrance', icon: '🏛️', cost: 25000, boost: .18, rep: 5 },
  { name: 'Iconic Gateway', icon: '🌈', cost: 120000, boost: .3, rep: 8 },
  { name: 'World Wonder Arch', icon: '🗽', cost: 600000, boost: .45, rep: 12 },
];
const PARKING = [
  { name: 'Dirt Lot', icon: '🅿️', cost: 0, cap: 90 },
  { name: 'Gravel Lot', icon: '🚗', cost: 2500, cap: 240 },
  { name: 'Paved Lot', icon: '🚙', cost: 12000, cap: 650 },
  { name: 'Parking Garage', icon: '🏢', cost: 50000, cap: 1800 },
  { name: 'Shuttle Network', icon: '🚌', cost: 200000, cap: 6000 },
  { name: 'Monorail Line', icon: '🚝', cost: 800000, cap: 25000 },
];
const MARKETING = [
  { id: 'flyers', name: 'Neighborhood Flyers', icon: '📰', cost: 300, boost: .1, days: 7 },
  { id: 'radio', name: 'Radio Spot', icon: '📻', cost: 2000, boost: .25, days: 10 },
  { id: 'billboard', name: 'Highway Billboard', icon: '🪧', cost: 8000, boost: .35, days: 14 },
  { id: 'tv', name: 'TV Commercial', icon: '📺', cost: 25000, boost: .55, days: 14 },
  { id: 'viral', name: 'Viral Influencer Campaign', icon: '📱', cost: 90000, boost: 1, days: 14 },
];

const SEASONS = [
  { name: 'Spring', icon: '🌷', mult: 1.05 },
  { name: 'Summer', icon: '☀️', mult: 1.2 },
  { name: 'Autumn', icon: '🍁', mult: 1 },
  { name: 'Winter', icon: '❄️', mult: .78 },
];
const WEATHER = {
  sunny: { icon: '☀️', name: 'Sunny', mult: 1.12 },
  cloudy: { icon: '⛅', name: 'Cloudy', mult: 1 },
  rainy: { icon: '🌧️', name: 'Rainy', mult: .7 },
  stormy: { icon: '⛈️', name: 'Stormy', mult: .45 },
  snowy: { icon: '🌨️', name: 'Snowy', mult: .65 },
  heat: { icon: '🥵', name: 'Heatwave', mult: .85 },
};

const NAMES = ('Acorn Ada Ajax Alfie Apollo Aria Asher Aspen Atlas Aurora Bandit Barley Basil Bean Bella Benny Biscuit Blaze Blossom Blue Bonnie Boomer Bramble Breeze Brownie Bubbles Buddy Buttercup Buttons Caramel Casper Cedar Champ Charlie Chester Chewie Chip Clover Coco Comet Cookie Copper Cosmo Cricket Daisy Dash Dexter Dino Dot Duke Dusty Echo Ember Fern Fig Finn Flash Fluffy Fudge Gizmo Ginger Goldie Gus Hazel Honey Hugo Indie Iris Ivy Jasper Jelly Juniper Kiki Kiwi Koda Lemon Leo Lily Loki Lulu Luna Mango Maple Marble Max Meadow Milo Minnie Mischief Mocha Moose Muffin Nala Nemo Nova Nugget Oakley Olive Ollie Onyx Oreo Otis Peanut Pebble Pepper Pickles Pip Pippa Pixel Plum Poppy Pretzel Pumpkin Quinn Rascal Reggie Remy Ripley River Rocket Rosie Ruby Rusty Sage Sahara Scout Shadow Simba Skye Smokey Snickers Sparky Sprout Storm Sunny Taco Tango Thor Thistle Tiger Toffee Truffle Tucker Twix Waffles Willow Winnie Ziggy Zola Zuma').split(' ');
const NAME_SUFFIX = ['', '', '', '', ' Jr.', ' II', ' the Brave', ' the Small', ' Sunbeam', ' Stardust'];
