export type Question = { id: string; category: string; prompt: string; options: [string,string,string,string]; correctIndex: number; explanation: string };
export const QUESTIONS: Question[] = [
 {id:'q1',category:'Silly science',prompt:'Which animal has three hearts?',options:['Octopus','Penguin','Giraffe','Hamster'],correctIndex:0,explanation:'Octopuses have three hearts. Overachievers.'},
 {id:'q2',category:'Space',prompt:'Which planet has the shortest day?',options:['Mercury','Jupiter','Mars','Venus'],correctIndex:1,explanation:'Jupiter spins once in roughly 10 hours.'},
 {id:'q3',category:'Food facts',prompt:'Botanically speaking, which is a berry?',options:['Strawberry','Raspberry','Banana','Cherry'],correctIndex:2,explanation:'Bananas qualify as berries. Strawberries do not. Botany is chaos.'},
 {id:'q4',category:'Animals',prompt:'What is a group of flamingos commonly called?',options:['A flamboyance','A glitter','A salsa','A parliament'],correctIndex:0,explanation:'A flamboyance of flamingos. Correct and extremely on-brand.'},
 {id:'q5',category:'Trick question',prompt:'How many months have 28 days?',options:['One','Two','Six','All twelve'],correctIndex:3,explanation:'Every month has at least 28 days. Gotcha.'},
 {id:'q6',category:'General knowledge',prompt:'What is the only mammal capable of true sustained flight?',options:['Flying squirrel','Bat','Sugar glider','Flying lemur'],correctIndex:1,explanation:'Bats are the only mammals capable of powered flight.'},
 {id:'q7',category:'Pop culture',prompt:'In a standard deck, how many kings are there?',options:['2','3','4','5'],correctIndex:2,explanation:'Four kings. No, the jokers do not count.'},
 {id:'q8',category:'Silly science',prompt:'Which of these can taste with its feet?',options:['Butterfly','Frog','Pigeon','Goldfish'],correctIndex:0,explanation:'Butterflies have taste receptors on their feet.'},
 {id:'q9',category:'Geography',prompt:'Which country is shaped like a boot?',options:['Portugal','Italy','Greece','Croatia'],correctIndex:1,explanation:'Italy: the world-famous boot.'},
 {id:'q10',category:'Trick question',prompt:'What gets wetter as it dries?',options:['A sponge','A towel','A cloud','A puddle'],correctIndex:1,explanation:'A towel. Your brain is warming up.'},
 {id:'q11',category:'Animals',prompt:'Which animal is famous for cube-shaped poop?',options:['Wombat','Koala','Capybara','Badger'],correctIndex:0,explanation:'Wombats produce cube-shaped droppings. Nature has a sense of humour.'},
 {id:'q12',category:'Science',prompt:'What gas do plants absorb from the atmosphere?',options:['Oxygen','Helium','Carbon dioxide','Hydrogen'],correctIndex:2,explanation:'Plants use carbon dioxide during photosynthesis.'},
 {id:'q13',category:'Sports',prompt:'Which country hosted and won the first FIFA World Cup in 1930?',options:['Brazil','Uruguay','Italy','Argentina'],correctIndex:1,explanation:'Uruguay hosted and won the inaugural FIFA World Cup in 1930.'},
 {id:'q14',category:'Sports',prompt:'How many players does each team normally have on the field in association football?',options:['9','10','11','12'],correctIndex:2,explanation:'A standard football team has 11 players on the field, including the goalkeeper.'},
 {id:'q15',category:'Sports',prompt:'In association football, how far is the penalty spot from the goal line?',options:['9 metres','10 metres','11 metres','12 metres'],correctIndex:2,explanation:'The penalty mark is 11 metres (12 yards) from the goal line.'},
 {id:'q16',category:'Sports',prompt:'What does a yellow card mean in association football?',options:['A goal was scored','A player is cautioned','The match is over','A substitution is required'],correctIndex:1,explanation:'A referee shows a yellow card to caution a player.'},
 {id:'q17',category:'Sports',prompt:'How many points is a successful free throw worth in basketball?',options:['1','2','3','4'],correctIndex:0,explanation:'A successful free throw is worth one point.'},
 {id:'q18',category:'Sports',prompt:'In the NBA, how long does a team normally have to attempt a shot?',options:['14 seconds','20 seconds','24 seconds','30 seconds'],correctIndex:2,explanation:'The NBA shot clock gives a team 24 seconds to attempt a shot.'},
 {id:'q19',category:'Sports',prompt:'How high is a regulation basketball hoop above the court?',options:['8 feet','9 feet','10 feet','11 feet'],correctIndex:2,explanation:'The rim is 10 feet (3.05 metres) above the playing surface.'},
 {id:'q20',category:'Sports',prompt:'How many players from one team are on the court in standard basketball?',options:['4','5','6','7'],correctIndex:1,explanation:'A standard basketball team has five players on the court.'},
 {id:'q21',category:'Sports',prompt:'Which Grand Slam tennis tournament is traditionally played on grass courts?',options:['Australian Open','French Open','Wimbledon','US Open'],correctIndex:2,explanation:'Wimbledon is played on grass courts.'},
 {id:'q22',category:'Sports',prompt:'In tennis scoring, what does “love” mean?',options:['Zero points','One point','A tied game','A match point'],correctIndex:0,explanation:'“Love” means a score of zero in tennis.'},
 {id:'q23',category:'Sports',prompt:'What surface is used at the French Open?',options:['Grass','Clay','Concrete','Wood'],correctIndex:1,explanation:'The French Open is played on clay courts.'},
 {id:'q24',category:'Sports',prompt:'What is the feathered projectile used in badminton called?',options:['A shuttlecock','A birdie net','A featherball','A shuttleball'],correctIndex:0,explanation:'Players hit a shuttlecock, also commonly called a shuttle.'},
 {id:'q25',category:'Sports',prompt:'How many stumps make up a wicket in cricket?',options:['2','3','4','6'],correctIndex:1,explanation:'A cricket wicket is made of three vertical stumps and two bails.'},
 {id:'q26',category:'Sports',prompt:'The Ashes is a famous cricket series between which two countries?',options:['India and Pakistan','England and Australia','South Africa and New Zealand','Canada and the United States'],correctIndex:1,explanation:'The Ashes is contested by England and Australia.'},
 {id:'q27',category:'Sports',prompt:'How many innings are scheduled in a standard Major League Baseball game?',options:['7','8','9','10'],correctIndex:2,explanation:'A standard Major League Baseball game is scheduled for nine innings.'},
 {id:'q28',category:'Sports',prompt:'In baseball, what is a hit called when the batter can circle all the bases and score?',options:['A bunt','A home run','A sacrifice','A double play'],correctIndex:1,explanation:'A home run allows the batter to circle the bases and score.'},
 {id:'q29',category:'Sports',prompt:'What object do players try to shoot into the net in ice hockey?',options:['A ball','A puck','A shuttlecock','A ring'],correctIndex:1,explanation:'Ice hockey is played with a puck.'},
 {id:'q30',category:'Sports',prompt:'How many periods are played in a standard NHL game?',options:['2','3','4','5'],correctIndex:1,explanation:'An NHL game has three regulation periods.'},
 {id:'q31',category:'Sports',prompt:'How many players from one team are normally on the ice in ice hockey, including the goalie?',options:['5','6','7','8'],correctIndex:1,explanation:'A team normally has six players on the ice, including its goaltender.'},
 {id:'q32',category:'Sports',prompt:'How many points is a try worth in rugby union before any conversion kick?',options:['3','4','5','6'],correctIndex:2,explanation:'A try is worth five points in rugby union.'},
 {id:'q33',category:'Sports',prompt:'In rugby, what is a scrum mainly used for?',options:['Restarting play after certain stoppages','Awarding a penalty goal','Ending the match','Substituting a player'],correctIndex:0,explanation:'A scrum is one way rugby union restarts play after certain minor infringements or stoppages.'},
 {id:'q34',category:'Sports',prompt:'How many hits may a volleyball team normally use to return the ball over the net?',options:['2','3','4','5'],correctIndex:1,explanation:'A team normally has up to three hits to return the ball; a block touch does not count as one of them.'},
 {id:'q35',category:'Sports',prompt:'How many rings appear on the Olympic symbol?',options:['4','5','6','7'],correctIndex:1,explanation:'The Olympic symbol has five interlaced rings.'},
 {id:'q36',category:'Sports',prompt:'How often are the Summer Olympic Games normally held?',options:['Every 2 years','Every 3 years','Every 4 years','Every 5 years'],correctIndex:2,explanation:'The Summer Olympic Games are normally held every four years.'},
 {id:'q37',category:'Sports',prompt:'What is the official distance of a marathon?',options:['40 kilometres','41.5 kilometres','42.195 kilometres','45 kilometres'],correctIndex:2,explanation:'A marathon is 42.195 kilometres, or 26 miles and 385 yards.'},
 {id:'q38',category:'Sports',prompt:'In golf, what is a birdie?',options:['One stroke under par on a hole','One stroke over par on a hole','A hole-in-one','A penalty stroke'],correctIndex:0,explanation:'A birdie is a score of one stroke under par on a hole.'},
 {id:'q39',category:'Sports',prompt:'In golf, what does a caddie traditionally do?',options:['Designs the golf course','Carries a player’s clubs and offers assistance','Keeps the score for every group','Repairs golf balls'],correctIndex:1,explanation:'A caddie carries a player’s clubs and may provide advice under the rules.'},
 {id:'q40',category:'Sports',prompt:'What does the chequered flag signal in motor racing?',options:['A caution period','The final lap has just started','The race has finished','A driver must leave the track'],correctIndex:2,explanation:'The chequered flag signals the finish of a race.'},
 {id:'q41',category:'Sports',prompt:'The 100-metre race is usually classified as what kind of track event?',options:['A sprint','A relay','A marathon','A hurdle race'],correctIndex:0,explanation:'The 100 metres is a sprint event.'},
 {id:'q42',category:'Sports',prompt:'The Tour de France is a major race in which sport?',options:['Road cycling','Rowing','Skiing','Motor racing'],correctIndex:0,explanation:'The Tour de France is a multi-stage road cycling race.'},
 {id:'q43',category:'Sports',prompt:'In curling, what do teammates use to sweep the ice in front of a moving stone?',options:['Rackets','Brooms or brushes','Hockey sticks','Paddles'],correctIndex:1,explanation:'Curlers sweep with brooms or brushes to influence the stone’s path and speed.'},
 {id:'q44',category:'Sports',prompt:'The pommel horse is an apparatus used in which sport?',options:['Artistic gymnastics','Equestrian riding','Track cycling','Diving'],correctIndex:0,explanation:'The pommel horse is one of the apparatus used in men’s artistic gymnastics.'},
 {id:'q45',category:'Sports',prompt:'In which swimming stroke does a swimmer start and swim facing upward?',options:['Butterfly','Breaststroke','Backstroke','Freestyle'],correctIndex:2,explanation:'Backstroke is swum on the back, facing upward.'},
 {id:'q46',category:'Sports',prompt:'What is the centre of an archery target commonly called?',options:['The baseline','The bullseye','The crease','The pocket'],correctIndex:1,explanation:'The centre of a target is commonly called the bullseye.'},
 {id:'q47',category:'Sports',prompt:'What is the name of the enclosed area where a boxing match takes place?',options:['A court','A ring','A rink','A pitch'],correctIndex:1,explanation:'Boxers compete in a boxing ring.'},
 {id:'q48',category:'Sports',prompt:'To win a standard table tennis game, a player usually needs at least 11 points and what else?',options:['A lead of one point','A lead of two points','Exactly 12 points','To win three serves in a row'],correctIndex:1,explanation:'A player normally wins at 11 points, but must lead by at least two.'},
 {id:'q49',category:'Science',prompt:'What is the chemical symbol for gold?',options:['Ag','Au','Gd','Go'],correctIndex:1,explanation:'Gold’s symbol is Au, from its Latin name aurum.'},
 {id:'q50',category:'Science',prompt:'Which part of a plant cell carries out photosynthesis?',options:['Nucleus','Chloroplast','Mitochondrion','Cell membrane'],correctIndex:1,explanation:'Chloroplasts contain chlorophyll and are where photosynthesis takes place.'},
 {id:'q51',category:'Science',prompt:'What is the name for the change from a liquid to a gas?',options:['Freezing','Condensation','Evaporation','Melting'],correctIndex:2,explanation:'Evaporation changes a liquid into a gas at its surface.'},
 {id:'q52',category:'Science',prompt:'Which particle has a negative electric charge?',options:['Proton','Neutron','Electron','Photon'],correctIndex:2,explanation:'Electrons carry a negative electric charge.'},
 {id:'q53',category:'Science',prompt:'What is the approximate speed of light in a vacuum?',options:['30,000 kilometres per second','150,000 kilometres per second','300,000 kilometres per second','1 million kilometres per second'],correctIndex:2,explanation:'Light travels at about 300,000 kilometres per second in a vacuum.'},
 {id:'q54',category:'Science',prompt:'Which blood type is known as the universal red blood cell donor?',options:['AB positive','O negative','A positive','B negative'],correctIndex:1,explanation:'O negative red blood cells can generally be used when a recipient’s blood type is unknown in an emergency.'},
 {id:'q55',category:'Science',prompt:'What is the largest organ of the human body?',options:['The liver','The brain','The skin','The lungs'],correctIndex:2,explanation:'The skin is the body’s largest organ by surface area and weight.'},
 {id:'q56',category:'Science',prompt:'Which scale is commonly used to measure the acidity or alkalinity of a solution?',options:['Richter scale','pH scale','Beaufort scale','Kelvin scale'],correctIndex:1,explanation:'The pH scale describes how acidic or alkaline a solution is.'},
 {id:'q57',category:'Science',prompt:'What is the hardest naturally occurring mineral on the Mohs scale?',options:['Quartz','Topaz','Corundum','Diamond'],correctIndex:3,explanation:'Diamond is rated 10 on the Mohs hardness scale.'},
 {id:'q58',category:'Science',prompt:'Which gas makes up most of Earth’s atmosphere?',options:['Oxygen','Carbon dioxide','Nitrogen','Argon'],correctIndex:2,explanation:'Nitrogen makes up about 78 percent of Earth’s atmosphere.'},
 {id:'q59',category:'Science',prompt:'Which vitamin can the human body produce in the skin with help from sunlight?',options:['Vitamin A','Vitamin C','Vitamin D','Vitamin K'],correctIndex:2,explanation:'Sunlight helps the skin produce vitamin D.'},
 {id:'q60',category:'Science',prompt:'What is the basic unit of heredity passed from parents to offspring?',options:['A gene','A tissue','An enzyme','A neuron'],correctIndex:0,explanation:'Genes are segments of DNA that carry hereditary information.'},
 {id:'q61',category:'Space',prompt:'Which planet is closest to the Sun?',options:['Venus','Earth','Mercury','Mars'],correctIndex:2,explanation:'Mercury is the innermost planet in our solar system.'},
 {id:'q62',category:'Space',prompt:'What is the name of the galaxy that contains our Solar System?',options:['Andromeda Galaxy','Milky Way','Whirlpool Galaxy','Sombrero Galaxy'],correctIndex:1,explanation:'Our Solar System is part of the Milky Way galaxy.'},
 {id:'q63',category:'Space',prompt:'Which planet is famous for its prominent rings?',options:['Mars','Saturn','Mercury','Venus'],correctIndex:1,explanation:'Saturn has the most visually prominent ring system in the Solar System.'},
 {id:'q64',category:'Space',prompt:'What is the name of Earth’s natural satellite?',options:['Europa','Titan','The Moon','Phobos'],correctIndex:2,explanation:'The Moon is Earth’s natural satellite.'},
 {id:'q65',category:'Space',prompt:'Which planet is known as the Red Planet?',options:['Jupiter','Mars','Neptune','Uranus'],correctIndex:1,explanation:'Iron-rich dust gives Mars much of its reddish appearance.'},
 {id:'q66',category:'Space',prompt:'What force keeps planets in orbit around the Sun?',options:['Magnetism','Friction','Gravity','Solar wind'],correctIndex:2,explanation:'The Sun’s gravity keeps the planets in their orbits.'},
 {id:'q67',category:'Space',prompt:'What is a light-year a measure of?',options:['Time','Distance','Brightness','Speed'],correctIndex:1,explanation:'A light-year is the distance light travels in one year.'},
 {id:'q68',category:'Space',prompt:'Which planet is the largest in our Solar System?',options:['Saturn','Earth','Neptune','Jupiter'],correctIndex:3,explanation:'Jupiter is the largest planet in the Solar System.'},
 {id:'q69',category:'Space',prompt:'What is the name of the first human to walk on the Moon?',options:['Yuri Gagarin','Buzz Aldrin','Neil Armstrong','John Glenn'],correctIndex:2,explanation:'Neil Armstrong became the first person to walk on the Moon in 1969.'},
 {id:'q70',category:'Space',prompt:'Which planet rotates on its side, with an extreme tilt?',options:['Uranus','Mars','Mercury','Jupiter'],correctIndex:0,explanation:'Uranus has an axial tilt of about 98 degrees, making it appear to rotate on its side.'},
 {id:'q71',category:'Space',prompt:'What is the name of the boundary around a black hole beyond which light cannot escape?',options:['The event horizon','The asteroid belt','The corona','The magnetosphere'],correctIndex:0,explanation:'The event horizon marks the boundary beyond which nothing, not even light, can escape.'},
 {id:'q72',category:'Space',prompt:'Which space telescope launched in 2021 to observe the universe mainly in infrared light?',options:['Hubble Space Telescope','Kepler Space Telescope','James Webb Space Telescope','Chandra X-ray Observatory'],correctIndex:2,explanation:'The James Webb Space Telescope observes primarily in infrared wavelengths.'}
];
export function chooseQuestions(count = 6): Question[] {
 const pool = [...QUESTIONS];

 for (let i = pool.length - 1; i > 0; i--) {
  const randomIndex = Math.floor(Math.random() * (i + 1));
  const question = pool[i];
  pool[i] = pool[randomIndex];
  pool[randomIndex] = question;
 }

 return pool.slice(0, count);
}

export function calculatePoints(correct: boolean, elapsedMs: number, doublePoints = false): number {
 if (!correct) return 0;
 const speed = Math.max(0, Math.min(500, Math.floor((15000 - Math.max(0, elapsedMs)) / 30)));

}
