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
 {id:'q12',category:'Science',prompt:'What gas do plants absorb from the atmosphere?',options:['Oxygen','Helium','Carbon dioxide','Hydrogen'],correctIndex:2,explanation:'Plants use carbon dioxide during photosynthesis.'}
];
export function chooseQuestions(count = 6): Question[] {
 const pool = [...QUESTIONS];
 for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
 return pool.slice(0, count);
}
export function calculatePoints(correct: boolean, elapsedMs: number, doublePoints = false): number {
 if (!correct) return 0;
 const speed = Math.max(0, Math.min(500, Math.floor((15000 - Math.max(0, elapsedMs)) / 30)));
 return (1000 + speed) * (doublePoints ? 2 : 1);
}
