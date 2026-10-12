/* Zoo Tycoon 3D — static game data (no emojis: every creature maps to a 3D model preset) */
'use strict';

// Tier tables (index = tier 1..7; 7 = Mythic / legendary creatures)
const TIER = {
  cost:   [0, 250, 700, 2000, 6000, 18000, 55000, 1000000],
  attr:   [0, 3, 6, 12, 22, 40, 75, 400],
  food:   [0, 2, 4, 8, 15, 30, 55, 400],
  litter: [0, 3, 2, 2, 1, 1, 1, 1],
  breed:  [0, .06, .045, .035, .026, .02, .014, .003],
  label:  ['', 'Common', 'Uncommon', 'Popular', 'Star', 'Superstar', 'Legend', 'Mythic'],
};

// Variant looks are applied to the 3D materials (see models.js)
const VARIANTS = [
  { id: 'common',  name: '',        label: 'Common',  cost: 1,   attr: 1 },
  { id: 'spotted', name: 'Spotted', label: 'Spotted', cost: 1.4, attr: 1.3, pattern: 'spots' },
  { id: 'striped', name: 'Striped', label: 'Striped', cost: 1.6, attr: 1.4, pattern: 'stripes' },
  { id: 'golden',  name: 'Golden',  label: 'Golden',  cost: 2.6, attr: 2,   tint: '#f2c230', sparkle: true },
  { id: 'shadow',  name: 'Shadow',  label: 'Shadow',  cost: 3,   attr: 2.3, tint: '#2a2440', glowEyes: '#b388ff' },
  { id: 'albino',  name: 'Albino',  label: 'Albino',  cost: 3.6, attr: 2.6, tint: '#fbf8f2', eyes: '#ff6f91' },
  { id: 'giant',   name: 'Giant',   label: 'Giant',   cost: 5,   attr: 3.2, scale: 1.6 },
  { id: 'rainbow', name: 'Rainbow', label: 'Rainbow', cost: 12,  attr: 6,   rainbow: true, sparkle: true },
];
const VARIANT_BY_ID = Object.fromEntries(VARIANTS.map(v => [v.id, v]));

const COMPANIES = [
  { id: 'global',  name: 'Global Fauna Traders',   icon: 'globe',  mult: 1,    age: [30, 90],   happy: 70, desc: 'Reliable adult animals at fair market prices.' },
  { id: 'nursery', name: 'Little Paws Nursery',    icon: 'bottle', mult: 1.3,  age: [0, 8],     happy: 85, desc: 'Newborns! +30% appeal while young and the longest careers.' },
  { id: 'budget',  name: 'Budget Beasts Co.',      icon: 'coins',  mult: 0.6,  age: [230, 330], happy: 50, desc: 'Cheap seniors. Not much time left to breed.' },
  { id: 'rescue',  name: 'Second Chance Rescue',   icon: 'heart',  mult: 0.45, age: [60, 300],  happy: 38, rep: 0.25, desc: 'Rescued animals. Super cheap, need TLC. Boosts reputation.' },
  { id: 'royal',   name: 'Royal Pedigree Imports', icon: 'crown',  mult: 1.9,  age: [15, 40],   happy: 95, pedigree: true, desc: 'Prize bloodlines: +20% appeal forever & better breeding.' },
];
const COMPANY_BY_ID = Object.fromEntries(COMPANIES.map(c => [c.id, c]));
const BULK = [[50, .22], [25, .15], [10, .1], [5, .05]];

/* Species: "Name|model|tier|main/secondary/accent|costOverride" */
const BIOMES = [
  {
    id: 'forest', name: 'Whispering Forest', cost: 0, starter: 'White-tailed Deer', mascot: 'Dottie the Deer', foodTheme: 'Pinecone',
    desc: 'Sunbeams filter through tall pines while deer graze among ferns.',
    ground: '#5f9e43', ground2: '#4b8536', accent: '#7a4f2a', fence: 'wood', props: ['pine', 'pine', 'oak', 'birch', 'mushroom', 'fern', 'rock', 'log', 'bush'], particles: 'leaves', water: '#4f9fd0', pond: true,
    attractions: ['Nature Trail', 'Treetop Walkway', 'Canopy Zipline'],
    species: `White-tailed Deer|deer|1|a8703f/f1dcc0/3b2a1a
Cottontail Rabbit|rabbit|1|9c8b78/f3ece2/5a4a3a
Red Squirrel|squirrel|1|c0532a/f3d9b8/7a2e12
Chipmunk|chipmunk|1|a87447/f4e1c4/3a2a1a
Raccoon|raccoon|1|8a8a8a/d8d8d8/2a2a2a
Hedgehog|hedgehog|1|7a5a3c/e8cfaa/3a2a1a
Striped Skunk|skunk|1|262626/f5f5f5/111111
Garter Snake|snake|1|2f5a2a/e8d36a/1a2a10
American Toad|toad|1|8a7a4a/c9b98a/4a3a1a
Box Turtle|turtle|1|5a3e1e/e0a030/2a1a0a
Wild Turkey|turkey|2|5a3a24/c62828/2a1a10
Badger|badger|2|8a8a8a/f0f0f0/222222
Beaver|beaver|2|7a4a24/a8784a/3a2010
Porcupine|porcupine|2|5a4a3a/c8b8a0/2a1a0a
Barn Owl|owl|2|d8a868/fbf3e4/6a4a2a
Woodpecker|woodpecker|2|262626/f5f5f5/d32f2f
Red Fox|fox|2|d2691e/f8f0e3/2a1a10
Wild Boar|boar|2|5a4a3a/7a6a5a/f0e6d0
Red-tailed Hawk|hawk|3|8a5a3a/f0e0c8/c0532a
Bobcat|bobcat|3|b08a5a/f0e2c8/3a2a1a
Elk|elk|3|9a6a3a/d8c0a0/4a3020
Gray Wolf|wolf|3|8a8a8a/e0e0e0/3a3a3a
Lynx|lynx|3|b8a07a/f0e6d6/2a2a2a
Black Bear|bear|4|2a2a2a/8a6a4a/111111
Moose|moose|4|5a3a22/8a6a4a/d8c8a8
Cougar|cougar|4|c49a6a/f2e4cf/3a2a1a
American Bison|bison|4|5a3a1e/3a2412/2a1a0a
Bald Eagle|baldeagle|4|4a3020/ffffff/f2c230
Grizzly Bear|grizzly|5|8a5a30/a87a50/2a1a0a
White Stag|stag|6|f5f5f0/ffffff/d8c8a0
Jackalope|jackalope|7|b08a5a/f3ece2/7a5a3a|1200000
Forest Spirit Stag|spiritstag|7|8ef0c8/e0fff4/50e0a0|2500000
Bigfoot|bigfoot|7|5a3a22/8a6a4a/2a1a0a|5000000
Unicorn|unicorn|7|ffffff/ffc0e8/b388ff|8000000`,
  },
  {
    id: 'farm', name: 'Sunny Acres Farm', cost: 4000, starter: 'Chicken', mascot: 'Clucky the Chicken', foodTheme: 'Barnyard',
    desc: 'Red barns, golden hay bales and the happy clucks of the coop.',
    ground: '#8cc152', ground2: '#78ab43', accent: '#b5651d', fence: 'picket', props: ['oak', 'hay', 'sunflower', 'corn', 'barn', 'bush', 'flowers', 'hay'], particles: 'pollen', water: '#5aa9d6',
    attractions: ['Petting Corral', 'Hay Ride', 'Harvest Festival'],
    species: `Chicken|chicken|1|f5f0e6/f5f0e6/d32f2f
Rooster|rooster|1|c0532a/2e5a2a/d32f2f
Duck|duck|1|f5f5f0/f2c230/ff9800
Goose|goose|1|f0f0f0/d8d8d8/ff9800
Turkey|turkey|1|6a4a34/c62828/3a2410
Guinea Pig|guineapig|1|d8a060/ffffff/5a3a1a
Rabbit|rabbit|1|f5f5f5/ffd0d8/8a8a8a
Quail|quail|1|8a6a4a/d8c0a0/3a2a1a
Pigeon|pigeon|1|8a94a8/b0b8c8/5a2a7a
Honeybee Hive|bee|1|f2b830/262626/ffffff
Barn Cat|cat|1|f2a050/ffffff/7a4a20
Sheep|sheep|2|f5f2ea/2a2a2a/d8d0c0
Goat|goat|2|f0ece4/8a7a6a/5a4a3a
Angora Goat|angora|2|fbfaf6/e8e0d0/8a7a6a
Pig|pig|2|f8b8c8/ffd0dc/d07a90
Miniature Pig|minipig|2|3a3a3a/f8b8c8/f0f0f0
Donkey|donkey|2|8a8a8a/e0e0e0/3a3a3a
Pony|pony|2|c08850/f5e8d0/5a3a1a
Mule|mule|2|7a5a3a/d8c0a0/3a2a1a
Sheepdog|dog|2|262626/ffffff/8a6a4a
Cow|cow|3|ffffff/262626/f8c0c8
Highland Cow|highland|3|c0602a/e08a4a/f0e0c8
Horse|horse|3|7a4a2a/3a2414/f0e6d6
Llama|llama|3|f0e0c8/c8a880/5a4a3a
Alpaca|alpaca|3|e8d0b0/fbf3e4/8a6a4a
Ox|ox|3|8a5a3a/d8c0a0/f0e6d0
Water Buffalo|waterbuffalo|3|3a3a3a/6a6a6a/d8d0c0
Yak|yak|3|3a2a1e/6a5a4a/f0e6d6
Peacock|peacock|3|1a5ab0/2e9a6a/f2c230
Clydesdale|clydesdale|4|8a4a2a/ffffff/2a1a0a
Golden Goose|goldengoose|7|f2c230/fff0a0/ff9800|1500000
Flying Pig|flyingpig|7|f8b8c8/ffffff/ffd0dc|2500000
Mega Hen|megahen|7|f5f0e6/f5f0e6/d32f2f|3000000`,
  },
  {
    id: 'desert', name: 'Scorched Sands Desert', cost: 10000, starter: 'Rattlesnake', mascot: 'Rattles the Snake', foodTheme: 'Oasis',
    desc: 'Heat shimmers over dunes, cacti stand guard and rattles echo.',
    ground: '#e3bc78', ground2: '#d2a560', accent: '#8d6e63', fence: 'adobe', props: ['cactus', 'cactus', 'redrock', 'rock', 'deadtree', 'bone', 'cactus'], particles: 'sand', water: '#4fc3c7',
    attractions: ['Sandstone Lookout', 'Camel Caravan', 'Oasis Lagoon'],
    species: `Rattlesnake|rattlesnake|1|b8925a/e8d0a0/4a3420
Scorpion|scorpion|1|c8a050/e0c070/3a2a10
Desert Tarantula|tarantula|1|5a3a22/c08a50/2a1a0a
Jackrabbit|jackrabbit|1|b8a07a/f0e6d6/4a3a2a
Horned Lizard|hornedlizard|1|c8a070/e8d0a0/6a4a2a
Kangaroo Rat|kangaroorat|1|d0a870/f8f0e0/6a4a2a
Jerboa|jerboa|1|e0c090/fbf3e4/6a4a2a
Dung Beetle|dungbeetle|1|2a2a2a/4a4a4a/7a5a3a
Sidewinder|sidewinder|2|e0c890/f8e8c0/8a6a3a
Gila Monster|gila|2|f28a3a/2a1a1a/f8c0a0
Roadrunner|roadrunner|2|6a5a4a/e8dcc8/3a5a9a
Desert Tortoise|tortoise|2|8a6a40/c8a060/4a3a20
Coyote|coyote|2|b0905a/e8dcc0/5a4a3a
Thorny Devil|thornydevil|2|c8803a/e8b070/6a3a1a
Bearded Dragon|beardeddragon|2|d0a060/e8c890/7a5a2a
Vulture|vulture|2|3a3030/f0d8d0/c86a6a
Desert Hedgehog|hedgehog|2|c8b090/f8f0e0/5a4a3a
Javelina|javelina|2|5a5a5a/8a8a8a/2a2a2a
Uromastyx|uromastyx|2|e8c050/f08a3a/5a4a2a
Fennec Fox|fennec|3|f0d0a0/fbf3e4/c08a50
Sand Cat|sandcat|3|e0c890/f8f0e0/8a6a4a
Addax|addax|3|f0e6d6/ffffff/8a6a4a
Caracal|caracal|3|c8905a/f8ecd8/2a1a0a
Desert Bighorn|bighorn|3|b8946a/f0e6d6/8a6a4a
Arabian Wolf|wolf|3|c8a880/f0e6d6/6a5a4a
Golden Eagle|eagle|3|6a4a2a/c89a4a/f2c230
Monitor Lizard|monitor|3|5a5a3a/a8a070/2a2a1a
Arabian Oryx|oryx|4|f5f2ea/2a2a2a/8a7a6a
Dromedary Camel|camel1|4|d8b078/f0d8a8/7a5a3a
Bactrian Camel|camel2|4|a07040/c89a6a/5a3a1a
Chupacabra|chupacabra|7|5a6a5a/8a9a8a/b0f0a0|1500000
Great Sandworm|sandworm|7|c9955c/e8c07a/5a3a1a|9000000
Sphinx|sphinx|7|d8b060/f0d890/2a5aa0|12000000`,
  },
  {
    id: 'wetlands', name: 'Misty Bayou Wetlands', cost: 18000, starter: 'Bullfrog', mascot: 'Ribbit the Frog', foodTheme: 'Bayou',
    desc: 'Fog curls over lily pads while gators drift through the reeds.',
    ground: '#5f8a52', ground2: '#4a7343', accent: '#5d4037', fence: 'wood', props: ['reeds', 'reeds', 'cypress', 'lilypad', 'log', 'bush', 'reeds', 'cypress'], particles: 'mist', water: '#3f7f6a', pond: true,
    attractions: ['Boardwalk', 'Swamp Boat Tour', 'Bayou Lantern Night'],
    species: `Bullfrog|frog|1|5a7a3a/c8d890/2a3a1a
Mallard|mallard|1|8a6a4a/2e7a3a/f2c230
Pond Turtle|turtle|1|4a5a3a/e8d070/2a2a1a
Muskrat|muskrat|1|6a4a2a/a87a5a/2a1a0a
Nutria|nutria|1|7a5a3a/a08060/f28a30
Salamander|salamander|1|2a2a2a/f2c230/111111
Newt|newt|1|c8603a/f2a030/3a2a1a
Crayfish|crayfish|1|b8402a/e0703a/5a1a0a
Catfish|catfish|1|6a6a5a/c8c0a8/2a2a2a
Dragonfly|dragonfly|1|2a8ab0/7ae0ff/1a3a5a
Canada Goose|goose|1|6a5a4a/262626/f5f5f5
Great Heron|heron|2|8a9ab0/f0f0f0/f2c230
Snowy Egret|egret|2|ffffff/ffffff/f2c230
Beaver|beaver|2|7a4a24/a8784a/3a2010
Snapping Turtle|snapping|2|4a4a3a/7a7a5a/2a2a1a
Water Moccasin|snake|2|3a3a2a/6a5a4a/1a1a1a
Longnose Gar|gar|2|7a8a5a/c8d0a0/3a4a2a
Mute Swan|swan|2|ffffff/f8f8f8/ff7a2a
Kingfisher|kingfisher|2|2a7ad0/f28a3a/ffffff
River Otter|otter|3|6a4a2a/a88060/2a1a0a
Pelican|pelican|3|f5f5f0/f2c230/f8a050
Roseate Spoonbill|spoonbill|3|f8a0b8/ffffff/d0607a
Flamingo|flamingo|3|ff8aa8/ffb8c8/262626
Capybara|capybara|3|9a6a3a/b88a5a/3a2a1a
Marsh Harrier|hawk|3|7a5a3a/d8c0a0/f2c230
Axolotl|axolotl|3|ffb8c8/ffd8e0/e0507a
American Alligator|alligator|4|3a4a2a/b8b080/1a2a10
Black Caiman|caiman|4|2a2a2a/8a8a6a/111111
Manatee|manatee|5|8a9098/b0b8c0/4a5058
Green Anaconda|anaconda|5|4a6a2a/a8b060/1a2a10
Swamp Monster|swampmonster|7|3e5a2a/6a8a4a/9ad06a|4000000
Bayou Hydra|hydra|7|2e6a4a/7ab08a/f2c230|15000000`,
  },
  {
    id: 'taiga', name: 'Frostpine Taiga', cost: 30000, starter: 'Red Fox', mascot: 'Rusty the Fox', foodTheme: 'Timberline',
    desc: 'Snow-dusted spruce, crackling cabins and howls in the cold air.',
    ground: '#a9bba4', ground2: '#e8eef0', accent: '#5d4037', fence: 'log', props: ['snowpine', 'snowpine', 'snowpine', 'log', 'snowrock', 'cabin', 'snowpine'], particles: 'snowlight', water: '#6aa8c8',
    attractions: ['Log Cabin Lodge', 'Husky Sled Run', 'Aurora Observatory'],
    species: `Red Fox|fox|2|d2691e/f8f0e3/2a1a10
Snowshoe Hare|hare|1|f5f5f5/e8e8e8/8a7a6a
Ermine|ermine|1|ffffff/f8f8f8/262626
Siberian Chipmunk|chipmunk|1|b08a5a/f0e2c8/3a2a1a
Common Raven|raven|1|1e1e2a/2a2a3a/3a3a5a
Red Squirrel|squirrel|1|b04a20/f0d0b0/6a2a10
Boreal Toad|toad|1|6a6a4a/a8a080/3a3a2a
Crossbill|songbird|1|c0402a/8a3020/5a5a5a
Sable|sable|2|4a3020/7a5a3a/c8a070
Pine Marten|marten|2|7a4a24/f2c890/3a2010
Great Gray Owl|owl|2|8a8a8a/d8d8d8/f2c230
Capercaillie|capercaillie|2|2a2a2a/3a5a3a/d32f2f
Musk Deer|muskdeer|2|6a5a40/a8946a/3a2a1a
Wild Boar|boar|2|4a3a2a/6a5a4a/f0e6d0
Beaver|beaver|2|7a4a24/a8784a/3a2010
Eurasian Otter|otter|2|7a5a3a/c8a880/3a2a1a
Siberian Husky|husky|2|6a7080/ffffff/4a90d0
Lynx|lynx|3|c8b090/f0e6d6/2a2a2a
Wolverine|wolverine|3|3a2a1e/a07a4a/1a1a1a
Reindeer|reindeer|3|8a7a6a/f0ece4/5a4a3a
Timber Wolf|wolf|3|6a6a6a/d0d0d0/2a2a2a
Elk|elk|3|9a6a3a/d8c0a0/4a3020
Eagle-Owl|owl|3|9a6a3a/e0c090/ff8a1a
Golden Eagle|eagle|3|6a4a2a/c89a4a/f2c230
Steller Sea Eagle|eagle|3|2a2a2a/ffffff/f2a030
Moose|moose|4|4a3020/7a5a3a/d8c8a8
Brown Bear|bear|4|7a4a24/9a6a3a/2a1a0a
Wood Bison|bison|4|4a3018/2e1c0c/2a1a0a
Amur Leopard|leopard|5|f0c890/fbf3e4/2a1a0a
Siberian Tiger|tiger|6|e8803a/ffffff/1a1a1a
Frost Wolf Spirit|frostwolf|7|bfe6ff/ffffff/6ad0ff|3000000
Ice Dragon|frostdragon|7|9ad8ff/e8f8ff/4aa8e0|20000000`,
  },
  {
    id: 'insectarium', name: 'Buzzing Bug House', cost: 40000, starter: 'Monarch Butterfly', mascot: 'Flutter the Monarch', foodTheme: 'Honeycomb',
    desc: 'A sun-warmed glasshouse of blossoms, wings and tiny wonders.',
    ground: '#7cb342', ground2: '#689f38', accent: '#a1887f', fence: 'glass', props: ['flowers', 'flowers', 'bush', 'fern', 'mushroom', 'sunflower', 'flowers'], particles: 'sparkle', water: '#5ab0d0', indoor: 'greenhouse',
    attractions: ['Bug Microscope Lab', 'Butterfly Garden', 'Giant Bug Dome'],
    species: `Monarch Butterfly|butterfly|1|f28a1a/262626/ffffff
Ladybug|ladybug|1|e02a2a/1a1a1a/ffffff
Honeybee|bee|1|f2b830/262626/ffffff
Bumblebee|bumblebee|1|f2c230/1a1a1a/ffffff
Ant Colony|ant|1|5a2a1a/3a1a0a/1a1a1a
Beetle|beetle|1|2a5a3a/1a3a2a/111111
Grasshopper|grasshopper|1|7ab040/a8d060/3a5a1a
Cricket|cricket|1|5a4a2a/8a7a4a/2a2a1a
Caterpillar|caterpillar|1|7ac040/f2e030/1a1a1a
Garden Snail|snail|1|c8a070/8a6a4a/e8d8c0
Earthworm|worm|1|d88a8a/e8a8a8/8a4a4a
Cockroach|cockroach|1|6a3a1a/8a5a2a/3a1a0a
Fruit Fly|fly|1|8a6a3a/d04a2a/c8e0f0
Mosquito|mosquito|1|4a4a4a/8a8a8a/c8e0f0
Stag Beetle|stagbeetle|2|3a1a0a/5a2a1a/1a0a0a
Rhino Beetle|rhinobeetle|2|5a3a1a/7a4a2a/2a1a0a
Praying Mantis|mantis|2|7ac050/a8e080/3a6a2a
Firefly|firefly|2|3a3a2a/f2e030/1a1a1a
Centipede|centipede|2|a0401a/e07a3a/3a1a0a
Leaf Insect|leafinsect|2|6ab040/9ad060/3a6a1a
Walking Stick|stickinsect|2|8a6a3a/a8885a/4a3a1a
Tarantula|tarantula|2|3a2a1a/d06a2a/1a1a1a
Emperor Scorpion|scorpion|2|1a1a2a/2a2a3a/3a5a2a
Atlas Moth|moth|3|c0602a/f0c890/5a2a1a
Blue Morpho|butterfly|3|2a7aff/1a2a5a/7ae0ff
Goliath Beetle|goliathbeetle|3|f0f0e0/2a2a2a/8a5a2a
Orchid Mantis|orchidmantis|3|ffd0e8/ffffff/f08ac0
Hercules Beetle|herculesbeetle|4|c8b060/2a2a2a/5a4a2a
Birdwing Butterfly|birdwing|4|2a2a2a/2ad07a/f2e030
Queen Alexandra Birdwing|birdwing|5|1a1a2a/4ae0d0/f2c230
Pixie Fairy|fairy|7|ffd0f0/ffffff/8ef0ff|2500000
Colossal Moth|colossalmoth|7|f2a030/fff0c0/5a3a1a|6000000`,
  },
  {
    id: 'arctic', name: 'Polar Ice Arctic', cost: 55000, starter: 'Snowy Owl', mascot: 'Hoot the Snowy Owl', foodTheme: 'Igloo',
    desc: 'Glittering ice floes, swirling snow and penguins on parade.',
    ground: '#f2f7fa', ground2: '#dbe9f1', accent: '#78909c', fence: 'ice', props: ['ice', 'ice', 'snowrock', 'igloo', 'ice', 'snowpine'], particles: 'snow', water: '#4a90c0', pond: true,
    attractions: ['Igloo Village', 'Ice Skating Rink', 'Northern Lights Dome'],
    species: `Snowy Owl|snowyowl|2|ffffff/f5f5f5/262626
Arctic Hare|hare|1|ffffff/f5f5f5/c8c8c8
Lemming|lemming|1|c8905a/f0d8b8/3a2a1a
Snow Goose|goose|1|ffffff/f5f5f5/ff8a8a
Ptarmigan|ptarmigan|1|ffffff/e8e8e8/d32f2f
Arctic Tern|tern|1|f5f5f5/c8d0d8/d32f2f
Ermine|ermine|1|ffffff/f8f8f8/262626
Snow Petrel|petrel|1|ffffff/f8f8f8/262626
Arctic Char|fish|1|c86a4a/f0a080/3a5a6a
Arctic Fox|arcticfox|2|ffffff/f5f5f5/262626
Atlantic Puffin|puffin|2|1a1a1a/ffffff/f28a1a
Harp Seal|seal|3|f0f0f0/ffffff/262626
Adélie Penguin|penguin|3|1a1a2a/ffffff/f2f2f2
Gentoo Penguin|penguin|3|2a2a3a/ffffff/ff6a1a
Rockhopper Penguin|rockhopper|3|1a1a2a/ffffff/f2c230
Caribou|reindeer|3|7a6a5a/e8e0d0/4a3a2a
Sea Otter|otter|3|5a3a22/c8a880/2a1a0a
Gyrfalcon|falcon|3|f0f0f0/c8c8c8/3a3a3a
King Penguin|kingpenguin|4|2a2a3a/ffffff/f2a030
Emperor Penguin|emperorpenguin|4|1a1a2a/ffffff/f2c230
Musk Ox|muskox|4|3a2a1e/6a5040/d8c8a8
Arctic Wolf|wolf|4|ffffff/f0f0f0/8a8a8a
Elephant Seal|elephantseal|4|8a7a6a/b0a090/4a3a2a
Leopard Seal|leopardseal|4|6a7078/c0c8d0/2a2a2a
Walrus|walrus|5|a87a5a/c89a7a/f0e6d0
Polar Bear|polarbear|6|fbf8f0/f0ece0/1a1a1a
Beluga Whale|beluga|6|f5f8fa/ffffff/8a9aa8
Narwhal|narwhal|6|9aa8b8/d0d8e0/f0ece0
Orca|orca|6|111111/ffffff/f0f0f0
Bowhead Whale|whale|6|2a2a2a/f0f0f0/4a4a4a
Yeti|yeti|7|f5f8ff/dce8f5/6a8ab0|7000000
Aurora Whale|aurorawhale|7|3a6ad0/8ef0ff/c080ff|18000000`,
  },
  {
    id: 'alpine', name: 'Summit Peaks Alpine', cost: 75000, starter: 'Mountain Goat', mascot: 'Billy the Goat', foodTheme: 'Chalet',
    desc: 'Wildflower meadows beneath jagged snowy peaks and cable cars.',
    ground: '#8fbf5a', ground2: '#7aa84a', accent: '#6d4c41', fence: 'stone', props: ['pine', 'rock', 'flowers', 'boulder', 'pine', 'flowers', 'chalet'], particles: 'snowlight', water: '#5ab0e0',
    attractions: ['Mountain Overlook', 'Cable Car', 'Summit Chalet'],
    species: `Mountain Goat|mountaingoat|2|f8f6f0/ffffff/2a2a2a
Marmot|marmot|1|a07a4a/d0b080/4a3a2a
Pika|pika|1|a08a6a/d8c8a8/4a3a2a
Alpine Salamander|salamander|1|1a1a1a/2a2a2a/111111
Ermine|ermine|1|a07040/ffffff/262626
Mountain Hare|hare|1|b8b0a0/f0ece4/4a4a4a
Chamois|chamois|2|7a5a3a/e8dcc8/1a1a1a
Chinchilla|chinchilla|2|b8b8c0/f0f0f0/3a3a3a
Alpaca|alpaca|2|fbf3e4/e8d0b0/8a6a4a
Llama|llama|2|8a5a3a/f0e0c8/3a2a1a
St. Bernard|stbernard|2|c0602a/ffffff/3a2a1a
Ibex|ibex|3|8a7050/d8c8a8/5a4a3a
Bighorn Sheep|bighorn|3|8a6a4a/f0e6d6/c8a880
Golden Eagle|eagle|3|6a4a2a/c89a4a/f2c230
Bearded Vulture|vulture|3|5a4a3a/f2a060/ff3a2a
Yak|yak|3|2a1e14/5a4a3a/f0e6d6
Vicuña|vicuna|3|d8a060/fbf3e4/8a5a2a
Red Panda|redpanda|3|c8502a/f0e0c8/2a1a10
Takin|takin|3|d8b060/f0d890/3a2a1a
Himalayan Tahr|tahr|3|7a5a3a/a88a6a/3a2a1a
Gray Wolf|wolf|3|8a8a8a/e0e0e0/3a3a3a
Andean Condor|condor|4|1a1a1a/ffffff/d07a7a
Spectacled Bear|spectacledbear|4|1a1a1a/f0e0b0/0a0a0a
Mountain Lion|cougar|4|c49a6a/f2e4cf/3a2a1a
Markhor|markhor|4|a0805a/e0d0b8/5a4a3a
Brown Bear|bear|4|7a4a24/9a6a3a/2a1a0a
Lammergeier|vulture|4|3a3a3a/f2c090/ff2a2a
Golden Snub Monkey|snubmonkey|4|f2a030/f8d8a0/5aa0e0
Snow Leopard|snowleopard|5|e8e8e0/f8f8f5/3a3a3a
Mountain Golem|golem|7|8a8a8a/6a6a6a/f2a030|6000000
Griffin|griffin|7|c49a4a/ffffff/f2c230|10000000`,
  },
  {
    id: 'china', name: 'Bamboo Kingdom (China)', cost: 100000, starter: 'Giant Panda', mascot: 'Bao the Panda', foodTheme: 'Dim Sum',
    desc: 'Lanterns sway over bamboo groves, pagodas and cherry blossoms.',
    ground: '#7fb347', ground2: '#6a9e3a', accent: '#c62828', fence: 'lacquer', props: ['bamboo', 'bamboo', 'cherry', 'lantern', 'pagoda', 'bamboo', 'rock', 'cherry'], particles: 'petals', water: '#4fa8b8', pond: true,
    attractions: ['Lantern Garden', 'Bamboo Maze', 'Dragon Dance Pavilion'],
    species: `Giant Panda|panda|5|ffffff/1a1a1a/1a1a1a
Mandarin Duck|mandarinduck|1|f28a1a/2a5aa0/ffffff
Silkworm|silkworm|1|f5f2ea/e8e0d0/8a8a8a
Koi|koi|1|ffffff/f25a1a/1a1a1a
Chinese Hamster|hamster|1|a8a090/f0ece4/3a3a3a
Golden Pheasant|goldenpheasant|2|f2c230/d32f2f/1a5aa0
Chinese Water Deer|waterdeer|2|b08a5a/e8d8c0/3a2a1a
Muntjac|muntjac|2|b0603a/e8c8a8/3a2a1a
Softshell Turtle|softshell|2|7a7a5a/c8c0a0/3a3a2a
Tibetan Fox|tibetanfox|2|c8a070/e8dcc8/6a5a4a
Rhesus Macaque|macaque|2|a08a6a/f0b8a8/5a4a3a
Red Panda|redpanda|3|c8502a/f0e0c8/2a1a10
Giant Salamander|giantsalamander|3|5a4a3a/7a6a5a/2a2a1a
Crested Ibis|ibis|3|ffe0e0/ffffff/d32f2f
Takin|takin|3|d8b060/f0d890/3a2a1a
Yak|yak|3|2a1e14/5a4a3a/f0e6d6
Père David's Deer|pdavid|3|9a6a3a/c8a070/4a3020
Red-crowned Crane|crane|3|ffffff/1a1a1a/d32f2f
Golden Monkey|snubmonkey|3|f2b040/f8e0b0/7ab0e0
White-cheeked Gibbon|gibbon|3|2a2a2a/f0f0f0/1a1a1a
Dhole|dhole|3|c8602a/f0d8b8/2a1a10
Golden Snub-nosed Monkey|snubmonkey|4|f2a030/f8d8a0/5aa0e0
Chinese Alligator|alligator|4|4a4a3a/c8c0a0/2a2a1a
Chinese Pangolin|pangolin|4|8a6a4a/c8a880/4a3a2a
Bactrian Camel|camel2|4|a07040/c89a6a/5a3a1a
Asiatic Black Bear|moonbear|4|1a1a1a/f5f5f0/0a0a0a
Clouded Leopard|cloudedleopard|4|c8a878/f0e6d6/4a3a2a
Przewalski's Horse|przewalski|4|c8a070/f0e0c8/3a2a1a
Snow Leopard|snowleopard|5|e8e8e0/f8f8f5/3a3a3a
South China Tiger|tiger|6|f08a3a/ffffff/1a1a1a
Fenghuang|fenghuang|7|d32f2f/f2c230/3a8ad0|9000000
Qilin|qilin|7|f2c230/2e8a6a/d32f2f|12000000
Imperial Dragon|easterndragon|7|d32f2f/f2c230/2e7d32|30000000`,
  },
  {
    id: 'africa', name: 'Savanna Safari (Africa)', cost: 150000, starter: 'Meerkat', mascot: 'Mo the Meerkat', foodTheme: 'Savanna',
    desc: 'Golden grasslands, acacia silhouettes and the roar of the pride.',
    ground: '#cfae5a', ground2: '#b8963f', accent: '#6d4c41', fence: 'thorn', props: ['acacia', 'acacia', 'grass', 'termite', 'rock', 'grass', 'baobab'], particles: 'dust', water: '#6aa0b0', pond: true,
    attractions: ['Safari Lookout', 'Jeep Safari', 'Hot Air Balloon Safari'],
    species: `Meerkat|meerkat|1|d0b080/f0e0c0/3a2a1a
Crested Porcupine|porcupine|1|2a2a2a/f0f0f0/111111
Warthog|warthog|2|7a6a5a/a8988a/f0e6d0
Thomson's Gazelle|gazelle|2|c8904a/ffffff/1a1a1a
Impala|impala|2|b8703a/f0e0c8/1a1a1a
Aardvark|aardvark|2|c8a090/e8c8b8/6a5a4a
Bush Baby|bushbaby|2|c8b090/f0e6d6/6a5a4a
Zebra|zebra|3|ffffff/1a1a1a/1a1a1a
Spotted Hyena|hyena|3|c8a878/e8dcc0/3a2a1a
Wildebeest|wildebeest|3|5a5a6a/8a8a8a/1a1a1a
Ostrich|ostrich|3|1a1a1a/ffffff/f0c0b0
Flamingo|flamingo|3|ff8aa8/ffb8c8/262626
African Wild Dog|wilddog|3|8a6a3a/f2c230/1a1a1a
Baboon|baboon|3|8a7a5a/c8b090/d07a7a
Ring-tailed Lemur|lemur|3|a8a8a8/ffffff/1a1a1a
Cape Buffalo|buffalo|3|2a2a2a/4a4a4a/8a8a8a
Secretary Bird|secretarybird|3|c8c8c8/1a1a1a/f28a1a
Greater Kudu|kudu|3|8a7a6a/ffffff/5a4a3a
Serval|serval|3|f2c070/fbf3e4/1a1a1a
Nile Crocodile|crocodile|4|5a6a3a/c8c090/2a3a1a
Pangolin|pangolin|4|a0784a/d8b080/5a3a1a
Mandrill|mandrill|4|5a6a3a/2a6ad0/d32f2f
Giraffe|giraffe|5|f2c070/8a4a1a/5a3a1a
Hippopotamus|hippo|5|8a7a8a/e8b0b0/4a3a4a
Chimpanzee|chimp|5|2a2a2a/e0c0a0/1a1a1a
Cheetah|cheetah|5|f2c070/fbf3e4/1a1a1a
Leopard|leopard|5|f0c070/fbf3e4/1a1a1a
Okapi|okapi|5|4a2a1a/ffffff/2a1a10
Lion|lion|6|e0a860/f0d8b0/8a4a1a
African Elephant|elephant|6|8a8a8a/a8a8a8/f0ece0
Black Rhino|rhino|6|7a7a7a/9a9a9a/d8d0c0
Silverback Gorilla|gorilla|6|2a2a2a/8a8a8a/1a1a1a
Manticore|manticore|7|c48a3a/a0522d/d32f2f|8000000
Mokele-mbembe|mokele|7|5a7a4a/8aa07a/2a3a1a|15000000`,
  },
  {
    id: 'rainforest', name: 'Emerald Rainforest', cost: 200000, starter: 'Spider Monkey', mascot: 'Coco the Monkey', foodTheme: 'Tiki',
    desc: 'Dripping vines, misty waterfalls and calls from the canopy.',
    ground: '#3f8a3a', ground2: '#2e702d', accent: '#4e342e', fence: 'bamboo', props: ['palm', 'jungletree', 'fern', 'palm', 'bush', 'flowers', 'jungletree', 'fern'], particles: 'rain', water: '#3a9a8a', pond: true,
    attractions: ['Jungle Rope Bridge', 'Waterfall Cave', 'Canopy Sky Tram'],
    species: `Spider Monkey|spidermonkey|2|3a2a1e/c8a070/1a1a1a
Red-eyed Tree Frog|treefrog|1|4ad04a/2a7ad0/ff2a2a
Leafcutter Ants|ant|1|b0401a/d06a2a/3a1a0a
Morpho Butterfly|butterfly|1|2a7aff/1a2a5a/7ae0ff
Poison Dart Frog|dartfrog|2|2a6aff/1a1a1a/f2e030
Howler Monkey|howler|2|8a3a1a/5a2a10/2a1a0a
Iguana|iguana|2|5ab040/8ad060/2a5a1a
Chameleon|chameleon|2|4ac06a/f2e030/ff7a2a
Kinkajou|kinkajou|2|c8903a/e8c070/5a3a1a
Tamarin|tamarin|2|f28a1a/f2c230/1a1a1a
Marmoset|marmoset|2|8a8a7a/ffffff/2a2a2a
Piranha|piranha|2|8a9aa8/e0402a/3a4a5a
Coati|coati|2|a0703a/e0c090/2a1a0a
Tarsier|tarsier|2|a88a6a/d8c0a0/f2a030
Scarlet Macaw|macaw|3|e02a2a/2a6ad0/f2e030
Toucan|toucan|3|1a1a1a/ffffff/f28a1a
Two-toed Sloth|sloth|3|a0906a/c8b890/4a3a2a
Boa Constrictor|boa|3|a08a6a/5a3a2a/e0d0b0
Capybara|capybara|3|9a6a3a/b88a5a/3a2a1a
Tapir|tapir|3|2a2a2a/f0f0f0/1a1a1a
Ocelot|ocelot|3|e0b070/fbf3e4/2a1a0a
Caiman|caiman|3|5a6a4a/c8c090/2a3a1a
Reticulated Python|python|3|c8a050/5a3a1a/f0e0a0
Hornbill|hornbill|3|1a1a1a/ffffff/f2c230
Green Anaconda|anaconda|4|4a6a2a/a8b060/1a2a10
Harpy Eagle|harpy|4|8a8a8a/ffffff/2a2a2a
Sun Bear|sunbear|4|1a1a1a/f2c070/0a0a0a
Cassowary|cassowary|4|1a1a1a/2a6ad0/d32f2f
Bird of Paradise|birdofparadise|4|f2c230/2a2a2a/2ad0a0
Jaguar|jaguar|5|e8b050/fbf3e4/1a1a1a
Orangutan|orangutan|6|c8501a/e07a3a/5a2a10
Sumatran Tiger|tiger|6|d8702a/ffffff/1a1a1a
Feathered Serpent|featheredserpent|7|2e9a5a/f2c230/d32f2f|20000000
Titan Ape|titanape|7|3a3030/6a5a5a/ff5a3a|25000000
Atomic Kaiju|kaiju|7|3d5a35/6f8f5f/7fe8ff|50000000`,
  },
  {
    id: 'aviary', name: 'Skyward Aviary', cost: 260000, starter: 'Parakeet', mascot: 'Pip the Parakeet', foodTheme: 'Nest',
    desc: 'Soaring netted domes filled with song, color and feathers.',
    ground: '#9ccc65', ground2: '#8bbf55', accent: '#90a4ae', fence: 'net', props: ['oak', 'cherry', 'birdhouse', 'oak', 'flowers', 'bush'], particles: 'feathers', water: '#5ab0e0', motion: 'fly',
    attractions: ['Feeding Station', 'Bird Show Theater', 'Sky Walk Dome'],
    species: `Parakeet|parakeet|1|5ad04a/f2e030/2a6ad0
Canary|canary|1|f2e030/f8f080/ff9a2a
Cockatiel|cockatiel|1|c8c8c8/f2e030/ff7a2a
Lovebird|lovebird|1|4ac04a/ff6a3a/f2e030
Hummingbird|hummingbird|1|2ad07a/ff2a7a/1a5a3a
Robin|songbird|1|7a6a5a/f2702a/2a2a2a
Blue Jay|bluejay|1|3a7ad0/ffffff/1a1a1a
Cardinal|cardinal|1|e02a2a/c01a1a/1a1a1a
Dove|dove|1|f0ece8/ffffff/c8b8b0
Raven|raven|1|1e1e2a/2a2a3a/3a3a5a
African Grey Parrot|parrot|2|8a8a8a/c8c8c8/d32f2f
Mute Swan|swan|2|ffffff/f8f8f8/ff7a2a
Stork|stork|2|ffffff/1a1a1a/ff5a2a
Pelican|pelican|2|f5f5f0/f2c230/f8a050
Barn Owl|owl|2|d8a868/fbf3e4/6a4a2a
Puffin|puffin|2|1a1a1a/ffffff/f28a1a
Macaw|macaw|3|2a6ad0/f2c230/1a1a1a
Peacock|peacock|3|1a5ab0/2e9a6a/f2c230
Flamingo|flamingo|3|ff8aa8/ffb8c8/262626
Peregrine Falcon|falcon|3|5a6a7a/f0e6d6/f2c230
Crowned Crane|crownedcrane|3|6a6a7a/ffffff/f2c230
Toucan|toucan|3|1a1a1a/ffffff/f28a1a
Kiwi|kiwi|3|7a5a3a/a07a5a/f0e0c0
Hornbill|hornbill|3|1a1a1a/ffffff/f2c230
Ostrich|ostrich|3|1a1a1a/ffffff/f0c0b0
Bald Eagle|baldeagle|4|4a3020/ffffff/f2c230
California Condor|condor|4|1a1a1a/ffffff/f2a080
Harpy Eagle|harpy|4|8a8a8a/ffffff/2a2a2a
Cassowary|cassowary|4|1a1a1a/2a6ad0/d32f2f
Shoebill|shoebill|5|8a9aa8/b0c0c8/c8b080
Dodo (Cloned)|dodo|6|8a8a9a/c8c8d0/f2e0a0
Roc|roc|7|6a4a2a/c8a070/f2c230|8000000
Thunderbird|thunderbird|7|2a3a6a/8ab0ff/f2e030|12000000
Phoenix|phoenix|7|ff5a1a/ffc030/ff2a00|15000000`,
  },
  {
    id: 'aquarium', name: 'Deep Blue Aquarium', cost: 350000, starter: 'Goldfish', mascot: 'Goldie the Goldfish', foodTheme: 'Coral Reef',
    desc: 'Shimmering glass tanks, kelp forests and sharks gliding by.',
    ground: '#e8d3a8', ground2: '#d8be8a', accent: '#b3e5fc', fence: 'tank', props: ['coral', 'kelp', 'shell', 'rock', 'coral', 'kelp'], particles: 'bubbles', water: '#2a8ad0', motion: 'swim', indoor: 'aquarium',
    attractions: ['Touch Pool', 'Underwater Tunnel', 'Dolphin Show Stadium'],
    species: `Goldfish|goldfish|1|f28a1a/f2b040/ffffff
Clownfish|clownfish|1|f2701a/ffffff/1a1a1a
Betta Fish|betta|1|d02a5a/2a4ad0/ff7aa0
Koi|koi|1|ffffff/f25a1a/1a1a1a
Hermit Crab|hermitcrab|1|e0602a/f0d0a0/c8a070
Shrimp|shrimp|1|f28a7a/ffb0a0/d04a3a
Starfish|starfish|1|f2702a/f2a050/d0402a
Sea Snail|snail|1|c8a0c0/e0c0e0/6a5a6a
Oyster|oyster|1|a8a090/e8e0d0/f8f0f0
Brain Coral|coral|1|e07a9a/f0a0b8/a04a6a
Blue Tang|tang|2|2a6aff/1a1a3a/f2e030
Angelfish|angelfish|2|f2e030/2a6ad0/1a1a1a
Moon Jellyfish|jellyfish|2|c8e0ff/f0f8ff/ff9ad0
Pufferfish|pufferfish|2|e8d090/ffffff/6a5a3a
Lobster|lobster|2|c02a1a/e0502a/5a1a0a
Squid|squid|2|f0a0a0/ffd0d0/c06060
Seahorse|seahorse|2|f2b030/f8d070/c07010
Octopus|octopus|3|d0503a/f08a70/7a2a1a
Lionfish|lionfish|3|c84a2a/ffffff/5a1a0a
Stingray|stingray|3|8a7a6a/f0e6d6/4a3a2a
Moray Eel|moray|3|5a6a2a/a8b060/2a3a1a
Nautilus|nautilus|3|f0e6d6/c0602a/ffffff
Sea Otter|otter|3|5a3a22/c8a880/2a1a0a
Sea Turtle|seaturtle|4|5a7a4a/c8b070/2a3a1a
Harbor Seal|seal|4|8a8a8a/c8c8c8/3a3a3a
Manatee|manatee|4|8a9098/b0b8c0/4a5058
Swordfish|swordfish|4|3a4a6a/c8d0d8/1a2a3a
Ocean Sunfish|sunfish|4|a8b0b8/e0e8f0/6a7078
Reef Shark|shark|5|7a8a98/f0f0f0/3a4a5a
Hammerhead Shark|hammerhead|5|7a8090/e8ecf0/3a4048
Manta Ray|mantaray|5|1a2a3a/f0f0f0/0a1a2a
Bottlenose Dolphin|dolphin|5|7a8aa0/e0e8f0/3a4a5a
Giant Squid|giantsquid|5|b0302a/e07a6a/5a1a0a
Great White Shark|greatwhite|6|7a8088/ffffff/2a2a2a
Whale Shark|whaleshark|6|3a4a6a/f0f0f0/f0f0f0
Humpback Whale|humpback|6|2a3038/e0e4e8/1a1e22
Giggling Sea Sponge|sponge|7|ff9a6a/ffd0a8/d0603a|5000000
Mermaid|mermaid|7|2ab0a0/f2d0b0/ff6ab0|20000000
Leviathan|seaserpent|7|1a4a7a/4aa0d0/a0f0ff|35000000
Kraken|kraken|7|a0303a/e07a7a/ffd0d0|40000000`,
  },
  {
    id: 'outback', name: 'Red Rock Outback', cost: 450000, starter: 'Kangaroo', mascot: 'Joey the Kangaroo', foodTheme: 'Billabong',
    desc: 'Rust-red earth, eucalyptus shade and kangaroos bounding by.',
    ground: '#c8643c', ground2: '#b05030', accent: '#5d4037', fence: 'wire', props: ['eucalyptus', 'redrock', 'grass', 'redrock', 'eucalyptus', 'termite', 'deadtree'], particles: 'dust', water: '#6aa8b0',
    attractions: ['Walkabout Trail', 'Kangaroo Mob Walk', 'Campfire Theatre'],
    species: `Kangaroo|kangaroo|2|b8703a/e8c8a0/5a3a1a
Budgerigar|parakeet|1|7ad04a/f2e030/2a2a2a
Galah|galah|1|f08aa8/c8c8d0/f0d0e0
Sugar Glider|sugarglider|1|a8a8b0/f0f0f0/2a2a2a
Brushtail Possum|possum|1|8a8a8a/f0e8e0/2a2a2a
Huntsman Spider|tarantula|1|8a6a4a/b0906a/3a2a1a
Wallaby|wallaby|2|8a7a6a/d8c8b8/3a3a3a
Wombat|wombat|2|8a7050/a8906a/3a2a1a
Dingo|dingo|2|e0a050/f8ecd8/6a4a2a
Kookaburra|kookaburra|2|8a6a4a/f0ece4/3a6ad0
Cockatoo|cockatoo|2|ffffff/f2e030/1a1a1a
Frilled Lizard|frilledlizard|2|a0784a/e0702a/4a3a2a
Quokka|quokka|2|8a6a4a/b09070/3a2a1a
Bilby|bilby|2|a8a0a0/f0ece4/f0b0c0
Goanna|goanna|2|5a4a2a/c8b070/2a2a1a
Numbat|numbat|2|c0703a/ffffff/2a1a10
Black Swan|blackswan|2|1a1a1a/2a2a2a/d32f2f
Thorny Devil|thornydevil|2|c8803a/e8b070/6a3a1a
Koala|koala|3|9a9aa0/f0f0f0/2a2a2a
Emu|emu|3|5a4a3a/7a6a5a/3a6ad0
Tasmanian Devil|tasdevil|3|1a1a1a/ffffff/f08a8a
Echidna|echidna|3|5a4a3a/e8d8c0/2a2a2a
Inland Taipan|snake|3|b8925a/e8d0a0/3a2a1a
Red Kangaroo|redkangaroo|3|c0502a/f0d0b0/5a2a10
Tree Kangaroo|treekangaroo|3|8a4a2a/f2c070/3a2010
Lyrebird|lyrebird|3|7a5a3a/c8a880/f0e6d6
Wedge-tailed Eagle|eagle|3|3a2a1a/7a5a3a/f2c230
Platypus|platypus|4|6a4a2a/a07a5a/2a2a2a
Cassowary|cassowary|4|1a1a1a/2a6ad0/d32f2f
Saltwater Crocodile|crocodile|5|6a6a3a/d0c890/2a2a1a
Drop Bear|dropbear|7|8a8a8a/d8d8d8/d32f2f|1500000
Bunyip|bunyip|7|4a3a2a/7a6a5a/2a1a10|4000000`,
  },
  {
    id: 'nocturnal', name: 'Moonlight Nocturnal House', cost: 600000, starter: 'Fruit Bat', mascot: 'Bruce the Bat', foodTheme: 'Midnight',
    desc: 'A starlit dome of glowing eyes, fireflies and quiet wings.',
    ground: '#2f3d38', ground2: '#25312d', accent: '#3e3e5e', fence: 'dark', props: ['glowshroom', 'deadtree', 'glowshroom', 'rock', 'pine', 'crystal'], particles: 'fireflies', water: '#2a4a7a', night: true, indoor: 'dome',
    attractions: ['Glow Path', 'Night Vision Tour', 'Moonlight Planetarium'],
    species: `Fruit Bat|fruitbat|1|5a3a2a/c0803a/1a1a1a
Hedgehog|hedgehog|1|7a5a3c/e8cfaa/3a2a1a
Opossum|opossum|1|c8c8c8/ffffff/f0b0c0
Firefly|firefly|1|3a3a2a/f2e030/1a1a1a
Raccoon|raccoon|1|8a8a8a/d8d8d8/2a2a2a
Skunk|skunk|1|262626/f5f5f5/111111
Luna Moth|lunamoth|1|b0f0a0/e0ffe0/c87aa0
Leopard Gecko|gecko|1|f2d070/f8f0d0/3a2a1a
Field Mouse|mouse|1|a08060/f0e0d0/f0b0b0
Brown Rat|rat|1|7a6a5a/b0a090/f0b0b0
Glow Worm|glowworm|1|c0f0a0/e0ffd0/7ad04a
Vampire Bat|bat|2|3a2a2a/6a4a4a/d32f2f
Barn Owl|owl|2|d8a868/fbf3e4/6a4a2a
Bush Baby|bushbaby|2|c8b090/f0e6d6/6a5a4a
Kinkajou|kinkajou|2|c8903a/e8c070/5a3a1a
Armadillo|armadillo|2|a89080/d8c8b8/5a4a3a
Sugar Glider|sugarglider|2|a8a8b0/f0f0f0/2a2a2a
Flying Squirrel|flyingsquirrel|2|a08a70/f0e6d6/3a2a1a
Scorpion|scorpion|2|3a3a5a/5a5a8a/6ad0ff
Night Monkey|nightmonkey|2|8a7a6a/f0d0a0/2a2a2a
Aye-aye|ayeaye|3|3a3030/6a5a5a/f2c230
Slow Loris|loris|3|c8a080/f0e0c8/5a3a2a
Kiwi|kiwi|3|7a5a3a/a07a5a/f0e0c0
Fennec Fox|fennec|3|f0d0a0/fbf3e4/c08a50
Tarsier|tarsier|3|a88a6a/d8c0a0/f2a030
Aardvark|aardvark|3|c8a090/e8c8b8/6a5a4a
Binturong|binturong|3|2a2a2a/6a6a6a/f0e0c0
Ocelot|ocelot|3|e0b070/fbf3e4/2a1a0a
Eagle-Owl|owl|3|9a6a3a/e0c090/ff8a1a
Pangolin|pangolin|4|a0784a/d8b080/5a3a1a
Black Panther|panther|5|1a1a22/2a2a33/f2e030
Will-o'-Wisp|wisp|7|8ef0ff/ffffff/4ad0ff|3000000
Shadow Panther Spirit|spiritpanther|7|2a1a4a/6a3ab0/c08aff|6000000
Vampire Bat Lord|batlord|7|2a1a2a/6a1a2a/ff2a4a|9000000`,
  },
  {
    id: 'prehistoric', name: 'Jurassic Frontier', cost: 2500000, starter: 'Triceratops', mascot: 'Trixie the Triceratops', foodTheme: 'Fossil',
    desc: 'Smoking volcanoes, giant ferns and the thunder of ancient footsteps.',
    ground: '#6d8b3a', ground2: '#5a7530', accent: '#3e2723', fence: 'electric', props: ['cycad', 'fern', 'boulder', 'cycad', 'volcano', 'bone', 'fern', 'cycad'], particles: 'embers', water: '#4a8a7a', pond: true,
    attractions: ['Fossil Dig Site', 'Dino Safari Jeep', 'Jurassic Sky Gondola'],
    species: `Triceratops|triceratops|4|7a8a5a/a8b080/4a5a3a
Compsognathus|compy|1|6a8a4a/c8d0a0/3a4a2a
Archaeopteryx|archaeopteryx|2|3a4a5a/8a9aa8/d32f2f
Dimetrodon|dimetrodon|2|8a5a3a/c8803a/e04a2a
Moa|moa|2|6a4a2a/8a6a4a/3a2a1a
Dodo|dodo|2|8a8a9a/c8c8d0/f2e0a0
Velociraptor|raptor|3|8a6a3a/c8a070/3a2a1a
Dilophosaurus|dilopho|3|5a7a3a/f2c230/d32f2f
Glyptodon|glyptodon|3|8a6a4a/b08a60/4a3a2a
Terror Bird|terrorbird|3|5a5a6a/c8c0b0/f2a030
Irish Elk|irishelk|3|8a5a30/c8a070/4a3020
Pachycephalosaurus|pachy|3|8a7a5a/c8b890/4a3a2a
Iguanodon|iguanodon|3|6a7a4a/a8b080/3a4a2a
Parasaurolophus|parasaur|3|5a8a6a/d8c070/c8502a
Stegosaurus|stegosaurus|4|6a7a4a/a8a070/c8502a
Ankylosaurus|ankylosaurus|4|8a7a5a/b0a080/4a3a2a
Woolly Rhino|woollyrhino|4|7a5a3a/a07a50/e8dcc8
Cave Bear|cavebear|4|5a3a22/8a6a4a/2a1a0a
Pteranodon|pteranodon|4|8a7a6a/e0d0c0/d32f2f
Giant Ground Sloth|giantsloth|4|8a6a4a/b09070/4a3a2a
Smilodon|smilodon|5|c8a070/f0e0c8/f8f8f0
Woolly Mammoth|mammoth|5|7a4a24/a06a3a/f0e8d8
Allosaurus|allosaurus|5|8a5a3a/c8a070/d32f2f
Quetzalcoatlus|quetzal|5|6a6a7a/f0e6d6/f2a030
Diplodocus|diplodocus|5|7a8a6a/b8c0a0/4a5a3a
Spinosaurus|spinosaurus|6|5a6a4a/c8a070/d0502a
Brachiosaurus|brachiosaurus|6|6a8a7a/a8c0b0/3a5a4a
Tyrannosaurus Rex|trex|6|5a6a3a/a8a070/2a3a1a
Ancient Titanosaur|titanosaur|7|6a7a5a/9aaa8a/3a4a2a|40000000
Volcano Dragon|dragon|7|8a1a1a/f2a030/2a0a0a|45000000`,
  },
];
const BIOME_BY_ID = Object.fromEntries(BIOMES.map(b => [b.id, b]));

// Model keys that hunt (used by the rare "eaten" event)
const PREDATORS = new Set(['wolf', 'fox', 'coyote', 'dingo', 'hyena', 'wilddog', 'dhole', 'arcticfox', 'fennec', 'tibetanfox', 'lion', 'tiger', 'leopard', 'cheetah', 'jaguar', 'cougar', 'bobcat', 'lynx', 'caracal', 'serval', 'ocelot', 'snowleopard', 'cloudedleopard', 'panther', 'smilodon', 'sandcat', 'bear', 'grizzly', 'polarbear', 'cavebear', 'crocodile', 'alligator', 'caiman', 'anaconda', 'python', 'boa', 'shark', 'greatwhite', 'hammerhead', 'orca', 'eagle', 'baldeagle', 'hawk', 'harpy', 'falcon', 'trex', 'raptor', 'allosaurus', 'spinosaurus', 'dilopho', 'kaiju', 'dragon', 'frostdragon', 'kraken', 'wolverine', 'tasdevil', 'manticore', 'monitor', 'leopardseal', 'moray', 'giantsquid', 'terrorbird', 'chupacabra', 'dropbear', 'bunyip', 'batlord', 'spiritpanther', 'frostwolf', 'titanape', 'hydra', 'sandworm', 'seaserpent', 'swampmonster', 'griffin']);

const SPECIES = {};
for (const b of BIOMES) {
  b.speciesKeys = [];
  b.species.trim().split('\n').forEach((line, i) => {
    const [name, model, t, cols, costO] = line.trim().split('|');
    const tier = +t;
    const colors = (cols || '').split('/').map(c => '#' + c);
    const key = b.id + ':' + i;
    SPECIES[key] = {
      key, name, model, tier, biome: b.id, colors,
      costOverride: costO ? +costO : null,
      mythic: tier === 7,
      predator: PREDATORS.has(model),
      adultAge: 18 + Math.min(tier, 6) * 6,
      lifespan: tier === 7 ? 3000 : 380 + tier * 70,
    };
    b.speciesKeys.push(key);
  });
  b.starterKey = b.speciesKeys.find(k => SPECIES[k].name === b.starter);
}
const LISTING_COUNT = BIOMES.reduce((n, b) => n + b.speciesKeys.length * VARIANTS.length, 0);
const SPECIES_COUNT = Object.keys(SPECIES).length;

function speciesBaseCost(sp, variantId) { return Math.round((sp.costOverride || TIER.cost[sp.tier]) * VARIANT_BY_ID[variantId].cost); }
function speciesAttr(sp, variantId) {
  const base = sp.mythic ? TIER.attr[7] * Math.pow(Math.max(1, (sp.costOverride || 1e6) / 1e6), .55) : TIER.attr[sp.tier];
  return base * VARIANT_BY_ID[variantId].attr;
}
function displayName(sp, variantId) { const v = VARIANT_BY_ID[variantId]; return (v.name ? v.name + ' ' : '') + sp.name; }

// Facility chains (per-biome); each level has its own 3D building in models.js
const FAC = {
  enclosure: {
    label: 'Enclosures', icon: 'fence', max: 8, desc: 'House your animals. Better habitats = happier animals & more appeal.', levels: [
      { name: 'Basic Pen', cost: 500, cap: 4, happy: 0, appeal: 0, maint: 2 },
      { name: 'Fenced Habitat', cost: 2500, cap: 8, happy: 5, appeal: 2, maint: 5 },
      { name: 'Naturalistic Habitat', cost: 9000, cap: 14, happy: 12, appeal: 6, maint: 10 },
      { name: 'Premium Sanctuary', cost: 30000, cap: 22, happy: 18, appeal: 14, maint: 20 },
      { name: 'Mega Reserve', cost: 90000, cap: 35, happy: 25, appeal: 30, maint: 40 },
    ],
  },
  keeper: {
    label: 'Zookeepers', icon: 'keeper', max: 12, desc: 'Each keeper cares for a number of animals. Understaffed = unhappy animals.', levels: [
      { name: 'Trainee Keeper', cost: 300, salary: 12, handles: 5, happy: 0 },
      { name: 'Zookeeper', cost: 1500, salary: 25, handles: 10, happy: 4 },
      { name: 'Senior Keeper', cost: 6000, salary: 50, handles: 18, happy: 8 },
      { name: 'Head Veterinarian', cost: 20000, salary: 100, handles: 30, happy: 14, breed: .5 },
    ],
  },
  restroom: {
    label: 'Restrooms', icon: 'restroom', max: 6, desc: 'Visitors need to go! Too few restrooms tanks satisfaction.', levels: [
      { name: 'Port-a-Potty', cost: 250, cap: 40, maint: 2, sat: 0 },
      { name: 'Restroom', cost: 1500, cap: 130, maint: 6, sat: 2 },
      { name: 'Deluxe Restroom', cost: 6000, cap: 350, maint: 14, sat: 4 },
      { name: 'Luxury Spa Restroom', cost: 25000, cap: 900, maint: 30, sat: 8 },
    ],
  },
  food: {
    label: 'Restaurants', icon: 'food', max: 6, desc: 'Hungry visitors spend money. Bigger venues serve more & charge more.', levels: [
      { name: 'Snack Cart', cost: 350, cap: 45, spend: 3, maint: 3, sat: 0 },
      { name: 'Food Stand', cost: 2000, cap: 140, spend: 4.5, maint: 8, sat: 1 },
      { name: 'Café', cost: 8000, cap: 350, spend: 6.5, maint: 18, sat: 2 },
      { name: 'Restaurant', cost: 30000, cap: 900, spend: 9, maint: 40, sat: 4 },
      { name: 'Gourmet Bistro', cost: 100000, cap: 2200, spend: 14, maint: 90, sat: 6 },
    ],
  },
  gift: {
    label: 'Gift Shops', icon: 'gift', max: 4, desc: 'Plushies, hats and snow globes. Pure profit!', levels: [
      { name: 'Souvenir Kiosk', cost: 600, cap: 50, spend: 2.5, maint: 3 },
      { name: 'Gift Shop', cost: 5000, cap: 200, spend: 4.5, maint: 10 },
      { name: 'Mega Store', cost: 25000, cap: 700, spend: 7, maint: 30 },
    ],
  },
  mascot: {
    label: 'Mascots', icon: 'mascot', max: 2, desc: 'A costumed star who draws crowds into this area.', levels: [
      { name: 'Costume Intern', cost: 1200, salary: 15, boost: .06, sat: 1 },
      { name: 'Pro Mascot', cost: 8000, salary: 45, boost: .13, sat: 3 },
      { name: 'Celebrity Mascot', cost: 40000, salary: 140, boost: .26, sat: 6 },
    ],
  },
  themed: {
    label: 'Themed Attractions', icon: 'ticket', max: 2, desc: 'Signature experiences unique to this area.', themed: true, levels: [
      { cost: 3000, appeal: 8, fee: 1, cap: 150, maint: 5 },
      { cost: 15000, appeal: 25, fee: 2, cap: 450, maint: 15 },
      { cost: 60000, appeal: 70, fee: 4, cap: 1300, maint: 40 },
    ],
  },
  ride: {
    label: 'Rides', icon: 'ride', max: 2, desc: 'Classic rides that charge a ticket and add buzz.', levels: [
      { name: 'Carousel', cost: 4000, appeal: 6, fee: 1.5, cap: 200, maint: 8 },
      { name: 'Mini Train', cost: 15000, appeal: 15, fee: 2, cap: 500, maint: 18 },
      { name: 'Ferris Wheel', cost: 50000, appeal: 35, fee: 3, cap: 1100, maint: 40 },
      { name: 'Roller Coaster', cost: 150000, appeal: 80, fee: 5, cap: 2600, maint: 90 },
    ],
  },
  seating: {
    label: 'Rest Areas', icon: 'bench', max: 4, desc: 'Tired feet = grumpy guests. Add places to rest.', levels: [
      { name: 'Benches', cost: 200, sat: 1, appeal: 0, maint: 1 },
      { name: 'Picnic Grove', cost: 1500, sat: 3, appeal: 1, maint: 3 },
      { name: 'Garden Plaza', cost: 8000, sat: 6, appeal: 4, maint: 8 },
    ],
  },
};
const FAC_ORDER = ['enclosure', 'keeper', 'restroom', 'food', 'gift', 'seating', 'themed', 'ride', 'mascot'];

function facLevel(type, level, biomeId) {
  const L = FAC[type].levels[level];
  if (FAC[type].themed) return Object.assign({ name: BIOME_BY_ID[biomeId].attractions[level] }, L);
  if (type === 'food') return Object.assign({}, L, { name: BIOME_BY_ID[biomeId].foodTheme + ' ' + L.name });
  return L;
}

const GATES = [
  { name: 'Wooden Gate', cost: 0, boost: 0, rep: 0 },
  { name: 'Ticket Booth', cost: 3000, boost: .08, rep: 2 },
  { name: 'Grand Entrance', cost: 25000, boost: .18, rep: 5 },
  { name: 'Iconic Gateway', cost: 120000, boost: .3, rep: 8 },
  { name: 'World Wonder Arch', cost: 600000, boost: .45, rep: 12 },
];
const PARKING = [
  { name: 'Dirt Lot', cost: 0, cap: 90 },
  { name: 'Gravel Lot', cost: 2500, cap: 240 },
  { name: 'Paved Lot', cost: 12000, cap: 650 },
  { name: 'Parking Garage', cost: 50000, cap: 1800 },
  { name: 'Shuttle Network', cost: 200000, cap: 6000 },
  { name: 'Monorail Line', cost: 800000, cap: 25000 },
];
const MARKETING = [
  { id: 'flyers', name: 'Neighborhood Flyers', icon: 'flyer', cost: 300, boost: .1, days: 7 },
  { id: 'radio', name: 'Radio Spot', icon: 'radio', cost: 2000, boost: .25, days: 10 },
  { id: 'billboard', name: 'Highway Billboard', icon: 'billboard', cost: 8000, boost: .35, days: 14 },
  { id: 'tv', name: 'TV Commercial', icon: 'tv', cost: 25000, boost: .55, days: 14 },
  { id: 'viral', name: 'Viral Influencer Campaign', icon: 'phone', cost: 90000, boost: 1, days: 14 },
];

const SEASONS = [
  { name: 'Spring', icon: 'flower', mult: 1.05 },
  { name: 'Summer', icon: 'sun', mult: 1.2 },
  { name: 'Autumn', icon: 'leaf', mult: 1 },
  { name: 'Winter', icon: 'snowflake', mult: .78 },
];
const WEATHER = {
  sunny: { icon: 'sun', name: 'Sunny', mult: 1.12 },
  cloudy: { icon: 'cloud', name: 'Cloudy', mult: 1 },
  rainy: { icon: 'rain', name: 'Rainy', mult: .7 },
  stormy: { icon: 'storm', name: 'Stormy', mult: .45 },
  snowy: { icon: 'snowflake', name: 'Snowy', mult: .65 },
  heat: { icon: 'heat', name: 'Heatwave', mult: .85 },
};

const NAMES = ('Acorn Ada Ajax Alfie Apollo Aria Asher Aspen Atlas Aurora Bandit Barley Basil Bean Bella Benny Biscuit Blaze Blossom Blue Bonnie Boomer Bramble Breeze Brownie Bubbles Buddy Buttercup Buttons Caramel Casper Cedar Champ Charlie Chester Chewie Chip Clover Coco Comet Cookie Copper Cosmo Cricket Daisy Dash Dexter Dino Dot Duke Dusty Echo Ember Fern Fig Finn Flash Fluffy Fudge Gizmo Ginger Goldie Gus Hazel Honey Hugo Indie Iris Ivy Jasper Jelly Juniper Kiki Kiwi Koda Lemon Leo Lily Loki Lulu Luna Mango Maple Marble Max Meadow Milo Minnie Mischief Mocha Moose Muffin Nala Nemo Nova Nugget Oakley Olive Ollie Onyx Oreo Otis Peanut Pebble Pepper Pickles Pip Pippa Pixel Plum Poppy Pretzel Pumpkin Quinn Rascal Reggie Remy Ripley River Rocket Rosie Ruby Rusty Sage Sahara Scout Shadow Simba Skye Smokey Snickers Sparky Sprout Storm Sunny Taco Tango Thor Thistle Tiger Toffee Truffle Tucker Twix Waffles Willow Winnie Ziggy Zola Zuma').split(' ');
const NAME_SUFFIX = ['', '', '', '', '', ' Jr.', ' II', ' III', ' Sunbeam', ' Stardust'];
const KEEPER_NAMES = ['Sam', 'Priya', 'Jordan', 'Mateo', 'Aiko', 'Noah', 'Fatima', 'Liam', 'Chen', 'Zoe', 'Omar', 'Grace', 'Ivan', 'Maya', 'Kofi', 'Elena'];
const QUIT_REASONS = ['to become a professional yodeler', 'to open a llama-themed bakery', 'after a goose stole their lunch one too many times', 'to join the circus', 'to follow their dream of competitive napping', 'to sail around the world', 'after winning a pie-eating contest', 'to become a pet influencer'];
