/**
 * Lesson note builder following bbbb.docx:
 * Nigerian secondary and early years lesson notes for Creche, KG,
 * Nursery, Primary, JSS and SS.
 *
 * Secondary (JSS/SS) uses the full structure:
 * SUBJECT / CLASS / TERM / WEEK / TOPIC
 * Learning Objectives, Previous Knowledge, Instructional Materials,
 * Introduction, Lesson Development, Examples, Teacher Explanation,
 * Class Participation, Evaluation, Classwork, Homework,
 * Key Points to Remember, Teacher's Note
 *
 * Early years and Primary use activity based age appropriate notes.
 */

export interface LessonNotePayload {
  schoolName: string;
  subject: string;
  classLevel: string;
  topic: string;
  weekNumber: number;
  session: string;
  term: number;
  teacherName?: string;
  periodsPerWeek?: number;
  minutesPerPeriod?: number;
}

type LevelBand = "creche" | "kg" | "nursery" | "primary" | "jss" | "ss";
type SubjectBlock = "math" | "science" | "theory" | "language" | "practical" | "early";

function detectLevel(classLevel: string): LevelBand {
  const c = String(classLevel || "").toUpperCase();
  if (/CRECHE|BABY CLASS/.test(c)) return "creche";
  if (/KG|KINDERGARTEN|KG\s*[123]/.test(c)) return "kg";
  if (/NURSERY/.test(c)) return "nursery";
  if (/PRIMARY|PRIMARY\s*[1-6]|BASIC\s*[1-6]/.test(c)) return "primary";
  if (/SS\s*[123]|SENIOR/.test(c)) return "ss";
  return "jss";
}

function classify(subject: string): SubjectBlock {
  const s = (subject || "").toLowerCase();
  if (/math|algebra|arithmetic|further math/.test(s)) return "math";
  if (/science|physics|chemistry|biology|agric|intermediate/.test(s)) return "science";
  if (/english|yoruba|igbo|hausa|french|language|literature/.test(s)) return "language";
  if (/cca|cultural|home economics|phe|physical|computer|digital|prevoc|business|marketing|commerce|accounting|livestock|animal/.test(s)) return "practical";
  return "theory";
}

function esc(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function topicKey(topic: string): string {
  return String(topic || "").toLowerCase();
}

function termLabel(term: number): string {
  const n = Number(term) || 1;
  if (n === 2) return "Second Term";
  if (n === 3) return "Third Term";
  return "First Term";
}

function isLcmHcf(topic: string): boolean {
  const t = topicKey(topic);
  return /lcm/.test(t) && /hcf|highest common factor|highest common|gcd/.test(t);
}

function mathMain(topic: string, band: LevelBand, subject: string, classLevel: string): string {
  const T = esc(topic);
  const t = topicKey(topic);
  if (isLcmHcf(topic)) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<ul>
<li><strong>LCM:</strong> the Lowest Common Multiple of two or more numbers is the smallest number that is a multiple of all the given numbers.</li>
<li><strong>HCF:</strong> the Highest Common Factor of two or more numbers is the largest number that divides all the given numbers exactly.</li>
</ul>
<p><strong>Main Content</strong></p>
<p><strong>1. Finding LCM using prime factors</strong></p>
<ol>
<li>Write each number as a product of prime factors.</li>
<li>Take all the prime factors.</li>
<li>Use the highest power of each factor.</li>
<li>Multiply those factors to get the LCM.</li>
</ol>
<p><strong>2. Finding HCF using prime factors</strong></p>
<ol>
<li>Write each number as a product of prime factors.</li>
<li>Take only the common prime factors.</li>
<li>Use the lowest power of each common factor.</li>
<li>Multiply those factors to get the HCF.</li>
</ol>
<p><strong>Examples</strong></p>
<p>Find the LCM of 6 and 8.</p>
<ul>
<li>6 = 2 × 3</li>
<li>8 = 2 × 2 × 2 = 2³</li>
<li>LCM = 2³ × 3 = 8 × 3 = 24</li>
</ul>
<p>Find the LCM of 12 and 18.</p>
<ul>
<li>12 = 2² × 3</li>
<li>18 = 2 × 3²</li>
<li>LCM = 2² × 3² = 4 × 9 = 36</li>
</ul>
<p>Find the HCF of 12 and 18.</p>
<ul>
<li>12 = 2² × 3</li>
<li>18 = 2 × 3²</li>
<li>HCF = 2 × 3 = 6</li>
</ul>
<p>Find the HCF of 24 and 36.</p>
<ul>
<li>24 = 2³ × 3</li>
<li>36 = 2² × 3²</li>
<li>HCF = 2² × 3 = 4 × 3 = 12</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Write 6 and 8 on the board and factorise them step by step.</li>
<li>Circle all factors for LCM, then only common factors for HCF.</li>
<li>Ask learners to copy one example and try another with support.</li>
</ul>
`.trim();
  }

  if (/lcm|lowest common multiple/.test(topicKey(topic))) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>${T}:</strong> the smallest number that is a multiple of all the given numbers.</p>
<p><strong>Main Content</strong></p>
<ol>
<li>Write each number as a product of prime factors.</li>
<li>Take all the prime factors.</li>
<li>Use the highest power of each factor.</li>
<li>Multiply to get the LCM.</li>
</ol>
<p><strong>Examples</strong></p>
<ul>
<li>LCM of 4 and 6: 4 = 2², 6 = 2 × 3, LCM = 2² × 3 = 12.</li>
<li>LCM of 8 and 12: 8 = 2³, 12 = 2² × 3, LCM = 2³ × 3 = 24.</li>
<li>LCM of 15 and 20: 15 = 3 × 5, 20 = 2² × 5, LCM = 2² × 3 × 5 = 60.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Model one factorisation on the board.</li>
<li>Have learners practise two similar questions.</li>
</ul>
`.trim();
  }

  if (/hcf|highest common factor/.test(topicKey(topic))) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>${T}:</strong> the largest number that divides all the given numbers exactly.</p>
<p><strong>Main Content</strong></p>
<ol>
<li>Write each number as a product of prime factors.</li>
<li>Take only the common prime factors.</li>
<li>Use the lowest power of each common factor.</li>
<li>Multiply to get the HCF.</li>
</ol>
<p><strong>Examples</strong></p>
<ul>
<li>HCF of 12 and 16: 12 = 2² × 3, 16 = 2⁴, HCF = 2² = 4.</li>
<li>HCF of 18 and 24: 18 = 2 × 3², 24 = 2³ × 3, HCF = 2 × 3 = 6.</li>
<li>HCF of 20 and 30: 20 = 2² × 5, 30 = 2 × 3 × 5, HCF = 2 × 5 = 10.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Show that only shared factors are used for HCF.</li>
<li>Compare with an LCM example so learners see the difference.</li>
</ul>
`.trim();
  }

  if (/percent/.test(topicKey(topic))) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p>Percentage means parts per hundred.</p>
<p><strong>Main Content</strong></p>
<ol>
<li>Write the percentage as a fraction over 100.</li>
<li>Convert the fraction to a decimal if needed.</li>
<li>Multiply by the whole number.</li>
</ol>
<p><strong>Examples</strong></p>
<ul>
<li>15% of 200 = 0.15 × 200 = 30.</li>
<li>25% of 80 = 0.25 × 80 = 20.</li>
<li>Express 45 as a percentage of 60: (45 ÷ 60) × 100 = 75%.</li>
</ul>
`.trim();
  }

  if (/fraction|equivalent fraction/.test(t)) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<ul>
<li><strong>Fraction:</strong> a number that shows parts of a whole. It is written as numerator over denominator, e.g. 3/4 means 3 parts out of 4 equal parts.</li>
<li><strong>Numerator:</strong> the top number (how many parts we have).</li>
<li><strong>Denominator:</strong> the bottom number (how many equal parts the whole is divided into).</li>
<li><strong>Equivalent fractions:</strong> different fractions that name the same amount, e.g. 1/2 = 2/4 = 3/6.</li>
</ul>
<p><strong>Main Content</strong></p>
<ol>
<li>Write a fraction and name the numerator and denominator.</li>
<li>Find equivalent fractions by multiplying or dividing numerator and denominator by the same number.</li>
<li>Compare fractions using a common denominator or a fraction wall/chart.</li>
<li>Simplify a fraction by dividing top and bottom by their HCF.</li>
</ol>
<p><strong>Examples</strong></p>
<ul>
<li>1/2 = 2/4 = 3/6 because 1×2/2×2 and 1×3/3×6 keep the same value.</li>
<li>3/4 is equivalent to 6/8 (multiply by 2).</li>
<li>4/8 simplified: HCF of 4 and 8 is 4, so 4÷4 / 8÷4 = 1/2.</li>
<li>Market example: if a trader sells 1/4 of a basket of oranges and another sells 2/8, they sold the same amount.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Draw a rectangle in 4 equal parts, shade 2, write 2/4. Draw another in 8 parts, shade 4, write 4/8. Show both shaded areas are equal.</li>
<li>Model one multiply-to-find-equivalent example and one simplify example on the board.</li>
<li>Ask learners to finish 3/5 = ?/15 with support.</li>
</ul>
`.trim();
  }

  return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>${T}:</strong> start by writing the definition on the board in plain language, then restate it with one local example. Learners should copy the definition and say it back in their own words.</p>
<p><strong>Main Content</strong></p>
<ol>
<li>Introduce the core rule or method for ${T} with one simple case.</li>
<li>Show the working step by step on the board.</li>
<li>Repeat with a second example that uses different numbers.</li>
<li>Name the common mistake learners make and correct it immediately.</li>
</ol>
<p><strong>Examples</strong></p>
<ul>
<li>Worked example 1: choose easy numbers, show every line of working.</li>
<li>Worked example 2: slightly harder, same method.</li>
<li>Worked example 3: word problem in Nigerian context (market, school fees, sports).</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Model one full solution slowly, thinking aloud at each step.</li>
<li>Ask two learners to finish the next example on the board.</li>
<li>Check that answers carry the correct unit where required.</li>
</ul>
`.trim();
}

function scienceMain(topic: string, subject: string): string {
  const T = esc(topic);
  const t = topicKey(topic);
  if (/photosynth/.test(t)) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>Photosynthesis:</strong> the process by which green plants make their own food using sunlight, carbon dioxide and water. The food made is glucose, and oxygen is released into the air.</p>
<p><strong>Main Content</strong></p>
<ul>
<li><strong>Requirements:</strong> sunlight, carbon dioxide (from air), water (from soil), chlorophyll in leaves.</li>
<li><strong>Word equation:</strong> carbon dioxide + water → (sunlight, chlorophyll) → glucose + oxygen.</li>
<li><strong>Where it happens:</strong> mainly in the leaves, inside chloroplasts.</li>
<li><strong>Importance:</strong> food for plants, food chain base, oxygen for animals and humans.</li>
<li><strong>Factors that affect the rate:</strong> light intensity, carbon dioxide concentration, temperature, water supply.</li>
</ul>
<p><strong>Examples</strong></p>
<ul>
<li>Maisie, cassava and tomato leaves photosynthesise in daylight.</li>
<li>A plant kept in a dark cupboard grows pale because photosynthesis is reduced.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Draw a leaf and label sun, CO2 in, O2 out, water from roots.</li>
<li>Write the word equation and ask learners to read it aloud.</li>
<li>Use a simple experiment idea: iodine test for starch in a leaf after light and dark treatment.</li>
</ul>
<p><strong>Practical where appropriate</strong></p>
<ul>
<li>Aim: show that light is needed for starch formation in leaves.</li>
<li>Materials: potted plant, cardboard, iodine solution, hot water, ethanol (teacher handled).</li>
<li>Procedure: cover part of a leaf, wait, then de-starch and test with iodine.</li>
<li>Safety: teacher handles hot water and ethanol; learners observe only.</li>
<li>Expected result: covered part stays pale with iodine; exposed part turns blue black.</li>
</ul>
`.trim();
  }
  if (/food (chain|web)/.test(t)) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>Food chain:</strong> the order in which living things feed on one another in an ecosystem, starting with a producer.</p>
<p><strong>Main Content</strong></p>
<ul>
<li><strong>Producer:</strong> green plants that make food (grass, maize).</li>
<li><strong>Primary consumer:</strong> herbivore that eats plants (grasshopper, goat).</li>
<li><strong>Secondary consumer:</strong> carnivore that eats herbivores (frog, chicken).</li>
<li><strong>Tertiary consumer:</strong> top predator (eagle, hawk).</li>
<li><strong>Decomposers:</strong> fungi and bacteria that break down dead matter.</li>
<li>Arrows in a food chain always point in the direction of energy flow.</li>
</ul>
<p><strong>Examples</strong></p>
<ul>
<li>Grass → grasshopper → frog → snake → hawk.</li>
<li>Maize → rat → owl.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Draw two food chains on the board and ask learners to name each level.</li>
<li>Explain that removing one member affects the whole chain.</li>
</ul>
`.trim();
  }
  return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>${T}:</strong> define the scientific concept in simple language, then name the key scientific words learners must know.</p>
<p><strong>Main Content</strong></p>
<ul>
<li>Characteristics or features of ${T}.</li>
<li>Causes, types, examples or effects as appropriate for the topic.</li>
<li>Importance, uses or prevention/control where relevant.</li>
</ul>
<p><strong>Examples</strong></p>
<ul>
<li>Everyday example of ${T} from Nigerian life.</li>
<li>One example learners can observe at school or home.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Use a simple chart, real object or labelled diagram for ${T}.</li>
<li>Explain any scientific terms with simple meanings.</li>
</ul>
<p><strong>Practical where appropriate</strong></p>
<ul>
<li>Aim, materials, procedure, observation and conclusion for a simple activity on ${T}.</li>
<li>Include safety precautions for any practical work.</li>
</ul>
`.trim();
}

function theoryMain(topic: string, subject: string): string {
  const T = esc(topic);
  const t = topicKey(topic);
  if (/federalism|federal government/.test(t)) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>Federalism:</strong> a system of government in which power is shared between a central government and regional governments (states or regions), each with its own defined powers.</p>
<p><strong>Main Content</strong></p>
<ul>
<li><strong>Features:</strong> written constitution, division of powers, independent courts, dual citizenship, revenue sharing.</li>
<li><strong>Levels in Nigeria:</strong> Federal Government, 36 State Governments, Local Governments.</li>
<li><strong>Examples of shared concerns:</strong> security, education, health, roads, agriculture.</li>
<li><strong>Importance:</strong> reduces over centralisation, brings government closer to the people, protects diversity.</li>
<li><strong>Challenges:</strong> conflict over revenue, duplication of functions, ethnic tension.</li>
</ul>
<p><strong>Examples</strong></p>
<ul>
<li>Each Nigerian state has a governor and house of assembly.</li>
<li>Local government areas deliver primary health and basic education services.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Draw a simple three tier chart: Federal, State, Local.</li>
<li>Give one real power for each level and ask learners to match them.</li>
</ul>
`.trim();
  }
  if (/population/.test(t)) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>Population:</strong> the total number of people living in a place at a given time.</p>
<p><strong>Main Content</strong></p>
<ul>
<li><strong>Population density:</strong> number of people per unit area of land.</li>
<li><strong>Factors that attract people:</strong> jobs, schools, hospitals, good roads, security.</li>
<li><strong>Factors that push people away:</strong> drought, conflict, poor services.</li>
<li><strong>Effects of rapid growth:</strong> pressure on housing, schools, jobs, food and water.</li>
<li><strong>Government efforts:</strong> family planning education, job creation, rural development.</li>
</ul>
<p><strong>Examples</strong></p>
<ul>
<li>Lagos is densely populated because of jobs and opportunities.</li>
<li>Some rural areas have low density because of limited services.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Use the class register to calculate simple density examples.</li>
<li>Map work: locate two contrasting states and discuss density.</li>
</ul>
`.trim();
  }
  return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>${T}:</strong> define the concept clearly for ${esc(subject)} in language learners can use in an exam answer.</p>
<p><strong>Main Content</strong></p>
<ul>
<li>Types or features of ${T}.</li>
<li>Causes and effects where relevant.</li>
<li>Importance, responsibilities, advantages or disadvantages as applicable.</li>
<li>Use Nigerian examples where appropriate.</li>
</ul>
<p><strong>Examples</strong></p>
<ul>
<li>Example 1 from school or community life.</li>
<li>Example 2 that learners can discuss.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Define terms before explaining ideas.</li>
<li>Use a simple table when comparison helps.</li>
</ul>
`.trim();
}

function languageMain(topic: string, subject: string): string {
  const T = esc(topic);
  const t = topicKey(topic);
  if (/past tense/.test(t)) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>Past tense:</strong> the verb form used to show that an action happened at a time before now.</p>
<p><strong>Main Content</strong></p>
<ul>
<li><strong>Regular verbs:</strong> add ed (walk → walked, play → played).</li>
<li><strong>Irregular verbs:</strong> change form (go → went, see → saw, write → wrote).</li>
<li><strong>Signal words:</strong> yesterday, last week, two days ago, in 2019, when I was young.</li>
<li><strong>Structure:</strong> subject + past form of verb + complement.</li>
<li><strong>Common errors:</strong> using present form after a past time marker (wrong: I go yesterday).</li>
</ul>
<p><strong>Examples</strong></p>
<ol>
<li>Chinedu visited his uncle last Saturday.</li>
<li>The pupils submitted their assignments on Monday.</li>
<li>We travelled to Ibadan during the holiday.</li>
<li>Common mistake: She goed to school. Correct: She went to school.</li>
</ol>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Write five time markers on the board and ask learners to form past sentences.</li>
<li>Drill irregular verbs in pairs: present, past, past participle.</li>
</ul>
`.trim();
  }
  if (/noun phrase|parts of speech|noun/.test(t) && /noun/.test(t)) {
    return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>Noun:</strong> the name of a person, animal, place, thing or idea.</p>
<p><strong>Main Content</strong></p>
<ul>
<li><strong>Proper noun:</strong> specific name (Lagos, Amina, Federal Government).</li>
<li><strong>Common noun:</strong> general name (city, girl, government).</li>
<li><strong>Abstract noun:</strong> ideas or feelings (honesty, fear, joy).</li>
<li><strong>Collective noun:</strong> group names (team, herd, flock).</li>
<li><strong>Plural forms:</strong> add s/es; some irregulars (child → children, man → men).</li>
</ul>
<p><strong>Examples</strong></p>
<ol>
<li>The <strong>teacher</strong> marked the register. (common noun)</li>
<li><strong>Abuja</strong> is the capital of Nigeria. (proper noun)</li>
<li>The <strong>herd</strong> of cattle crossed the road. (collective noun)</li>
</ol>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Sort word cards into person, place, thing, idea.</li>
<li>Ask learners to convert five common nouns into proper nouns.</li>
</ul>
`.trim();
  }
  return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>${T}:</strong> explain the language concept for ${esc(subject)} with the rule stated clearly.</p>
<p><strong>Main Content</strong></p>
<ul>
<li>Rules connected to ${T}.</li>
<li>Correct forms and common errors to avoid.</li>
<li>Vocabulary or structure related to the topic.</li>
</ul>
<p><strong>Examples</strong></p>
<ol>
<li>Example sentence or passage using ${T} correctly.</li>
<li>Another example with different words.</li>
<li>Common mistake and the correct form.</li>
</ol>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Model pronunciation, writing or grammar on the board.</li>
<li>Ask learners to produce one correct example each.</li>
</ul>
`.trim();
}

function practicalMain(topic: string): string {
  const T = esc(topic);
  return `
<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p><strong>${T}:</strong> explain the practical concept and why it matters in real work or daily life.</p>
<p><strong>Main Content</strong></p>
<ol>
<li>Materials or tools needed for ${T}.</li>
<li>Procedure or steps in order.</li>
<li>Safety precautions.</li>
<li>Uses, functions or expected result.</li>
</ol>
<p><strong>Examples</strong></p>
<ul>
<li>Demonstrate one complete step for ${T}.</li>
<li>Show a finished example learners can copy.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Model the procedure slowly.</li>
<li>Check safety before learners start practical work.</li>
</ul>
`.trim();
}

function secondaryMain(subject: string, topic: string, classLevel: string, band: LevelBand): string {
  const block = classify(subject);
  if (block === "math") return mathMain(topic, band, subject, classLevel);
  if (block === "science") return scienceMain(topic, subject);
  if (block === "language") return languageMain(topic, subject);
  if (block === "practical") return practicalMain(topic);
  return theoryMain(topic, subject);
}

function earlyYearsNote(payload: LessonNotePayload, band: LevelBand): string {
  const { subject, classLevel, topic, weekNumber, term, schoolName, teacherName } = payload;
  const T = esc(topic);
  const levelName =
    band === "creche" ? "Creche" :
    band === "kg" ? "Kindergarten" :
    band === "nursery" ? "Nursery" : "Primary";

  return `
<p><strong>${esc(subject)}</strong></p>
<p><strong>CLASS: ${esc(classLevel)}</strong></p>
<p><strong>TERM: ${termLabel(term)}</strong></p>
<p><strong>WEEK: ${weekNumber}</strong></p>
<p><strong>TOPIC: ${T}</strong></p>

<h3>Learning Objectives</h3>
<p>By the end of the lesson, children should be able to:</p>
<ol>
<li>Recognise ${T} through looking, pointing and naming.</li>
<li>Participate in the song, rhyme or activity for ${T}.</li>
<li>Match or sort simple objects related to ${T}.</li>
<li>Respond to simple oral questions about ${T}.</li>
</ol>

<h3>Previous Knowledge</h3>
<p>Children already know familiar objects, colours, shapes, counting, sounds or body parts from earlier ${levelName} activities.</p>

<h3>Instructional Materials</h3>
<ul>
<li>Pictures or flash cards related to ${T}.</li>
<li>Real objects learners can touch and name.</li>
<li>Chart, board or wall display.</li>
<li>Song, rhyme or movement activity.</li>
<li>Crayons, tracing sheets or play materials where useful.</li>
</ul>

<h3>Introduction</h3>
<p>Greet the children and connect ${T} to something they already know at home or in school. Show a picture or real object and ask simple questions such as:</p>
<ul>
<li>What is this?</li>
<li>Can you point to it?</li>
<li>Can you say the word with me?</li>
</ul>

<h3>Lesson Development</h3>
<p><strong>Meaning / Definition</strong></p>
<p>Introduce ${T} in very simple words. Use repetition, pictures and gestures. ${levelName} learners should hear and say the word many times, not copy long notes.</p>
<p><strong>Main Content</strong></p>
<ol>
<li>Show or name ${T} clearly.</li>
<li>Ask children to point, touch, match or sort related items.</li>
<li>Use a short song, rhyme or clapping activity connected to ${T}.</li>
<li>Repeat the key word and one simple meaning.</li>
</ol>
<p><strong>Examples</strong></p>
<ul>
<li>Show one picture or object for ${T} and let children name it.</li>
<li>Play a simple matching game with two or three items.</li>
</ul>
<p><strong>Teacher Explanation / Demonstration</strong></p>
<ul>
<li>Speak slowly, smile and use gestures.</li>
<li>Move around the room so every child can see and respond.</li>
<li>Keep activities short and joyful.</li>
</ul>

<h3>Class Participation</h3>
<ul>
<li>Point to the correct picture when asked.</li>
<li>Repeat ${T} after the teacher.</li>
<li>Join the rhyme or movement activity.</li>
<li>Help a classmate with a matching task.</li>
</ul>

<h3>Evaluation</h3>
<ol>
<li>Point to the ${T} picture.</li>
<li>Show me one object related to ${T}.</li>
<li>Say the word ${T} after me.</li>
<li>Colour or trace the matching sheet if prepared.</li>
</ol>

<h3>Classwork</h3>
<p>Children complete a short matching, pointing or colouring activity for ${T} under teacher guidance.</p>

<h3>Homework</h3>
<p>Tell a parent or guardian one thing you learned about ${T} today.</p>

<h3>Key Points to Remember</h3>
<ul>
<li>${T} is the word we learned today.</li>
<li>We recognise ${T} by looking, pointing, naming and doing.</li>
<li>Every child can participate in the activity.</li>
</ul>

<h3>Teacher's Note</h3>
<ul>
<li>Keep ${esc(classLevel)} activities short, sensory and interactive.</li>
<li>Do not expect young children to copy long notes.</li>
<li>Praise effort and encourage every child to speak or move.</li>
<li>Prefer objects, pictures, songs and play over long lectures.</li>
</ul>

<p><em>Lesson note prepared for ${esc(schoolName)}. Teacher: ${esc(teacherName || "Class Teacher")}.</em></p>
`.trim();
}

function secondaryNote(payload: LessonNotePayload, band: LevelBand): string {
  const { subject, classLevel, topic, weekNumber, term, schoolName, teacherName, periodsPerWeek = 1, minutesPerPeriod = 40 } = payload;
  const T = esc(topic);
  const isSS = band === "ss";
  const isMath = classify(subject) === "math";
  const isLcm = isLcmHcf(topic);

  const objectives = isMath && isLcm
    ? [
        "Define LCM and HCF in simple words.",
        "Find the LCM of two or more numbers using prime factors.",
        "Find the HCF of two or more numbers using prime factors.",
        "Solve classwork questions on LCM and HCF correctly.",
      ]
    : [
        `Define ${T} in clear ${subject} language.`,
        `Explain the main features, types or rules of ${T}.`,
        `Give at least two accurate examples of ${T}.`,
        `Apply ${T} to answer classwork and evaluation questions.`,
      ];

  const evaluation = isMath && isLcm
    ? `
<ol>
<li>Define LCM.</li>
<li>Define HCF.</li>
<li>Find the LCM of 4 and 6.</li>
<li>Find the LCM of 8 and 12.</li>
<li>Find the HCF of 12 and 16.</li>
<li>Find the HCF of 18 and 24.</li>
<li>Find both the LCM and HCF of 12 and 20.</li>
<li>State one difference between LCM and HCF.</li>
</ol>`
    : `
<ol>
<li>What is the meaning of ${T}?</li>
<li>Mention three main points from today's lesson.</li>
<li>Give two examples of ${T}.</li>
<li>State four importance or uses of ${T}.</li>
<li>Answer one application question on ${T}.</li>
<li>True or false with correction where needed.</li>
</ol>`;

  const classwork = isMath && isLcm
    ? `
<ol>
<li>Find the LCM of:
  <br>a. 4 and 6
  <br>b. 8 and 12
  <br>c. 15 and 20
</li>
<li>Find the HCF of:
  <br>a. 12 and 16
  <br>b. 18 and 24
  <br>c. 20 and 30
</li>
<li>Find both the LCM and HCF of 12 and 20.</li>
</ol>`
    : `
<ol>
<li>Define ${T} in your own words.</li>
<li>List three points from the lesson content.</li>
<li>Give two examples of ${T}.</li>
<li>State four importance or uses of ${T}.</li>
<li>Complete one short practical or problem question on ${T}.</li>
</ol>`;

  const homework = isMath && isLcm
    ? `
<ol>
<li>Find the LCM and HCF of 24 and 36.</li>
<li>Find the LCM and HCF of 18 and 30.</li>
<li>Write the rule for LCM and the rule for HCF in your own words.</li>
</ol>`
    : `
<ol>
<li>Write a short summary of ${T} using at least five new words from ${esc(subject)}.</li>
<li>Complete the practice questions for ${T} in your exercise book.</li>
<li>Prepare one example of ${T} for the next lesson.</li>
</ol>`;

  return `
<p><strong>${esc(subject)}</strong></p>
<p><strong>CLASS: ${esc(classLevel)}</strong></p>
<p><strong>TERM: ${termLabel(term)}</strong></p>
<p><strong>WEEK: ${weekNumber}</strong></p>
<p><strong>TOPIC: ${T}</strong></p>
<p><strong>Duration:</strong> ${periodsPerPeriodLabel(periodsPerWeek, minutesPerPeriod)}</p>

<h3>Learning Objectives</h3>
<p>By the end of the lesson, students should be able to:</p>
<ol>
${objectives.map((o, i) => `<li>${esc(o)}</li>`).join("\n")}
</ol>

<h3>Previous Knowledge</h3>
<p>Students already know related work from earlier ${esc(subject)} lessons in ${esc(classLevel)}. They can discuss simple school and community examples. This lesson builds on that foundation and focuses only on ${T}.</p>

<h3>Instructional Materials</h3>
<ul>
<li>Whiteboard or chart paper.</li>
<li>${esc(subject)} textbook and class notes for ${esc(classLevel)}.</li>
<li>Practice questions for ${T}.</li>
<li>Chalk, markers and duster.</li>
${isMath && isLcm ? "<li>Number cards or factor strips where available.</li>" : ""}
</ul>

<h3>Introduction</h3>
<ol>
<li>Ask two short questions about ${T} before writing the title.</li>
<li>Link the topic to something learners already know from school or Nigerian everyday life.</li>
<li>Write <strong>${T}</strong> on the board and state the lesson objectives.</li>
</ol>

${secondaryMain(subject, topic, classLevel, band)}

<h3>Teacher Activities</h3>
<ol>
<li><strong>Introduction (5 minutes):</strong> Greet students, review the previous lesson, and introduce ${T} with a short question.</li>
<li><strong>Explanation (15-20 minutes):</strong> Present the main content on the board using simple language and examples from Nigerian school or community life.</li>
<li><strong>Demonstration (10 minutes):</strong> Work one full example or procedure step by step for the class.</li>
<li><strong>Guided practice (10 minutes):</strong> Lead the class through one question, then ask learners to try a similar one.</li>
<li><strong>Summary (5 minutes):</strong> Recap the key points of ${T} and preview the next lesson.</li>
</ol>

<h3>Student Activities</h3>
<ol>
<li>Listen carefully and copy the board notes on ${T}.</li>
<li>Answer oral questions during the lesson.</li>
<li>Work with a partner on one classwork question.</li>
<li>Complete the evaluation and classwork questions independently.</li>
</ol>

<h3>Class Participation</h3>
<ul>
<li>Ask three learners to restate one point about ${T} in their own words.</li>
<li>Run one short oral question or calculation related to ${T}.</li>
<li>Have learners complete one guided example on the board.</li>
</ul>

<h3>Evaluation</h3>
${evaluation}

<h3>Classwork</h3>
${classwork}

<h3>Homework</h3>
${homework}

<h3>Key Points to Remember</h3>
<ul>
<li>${T} is the main idea of this lesson in ${esc(subject)}.</li>
<li>Explain with clear steps and simple examples.</li>
<li>Practise the classwork questions before the next lesson.</li>
${isMath && isLcm ? "<li>For LCM use all factors with highest powers. For HCF use common factors with lowest powers.</li>" : ""}
</ul>

<h3>Teacher's Note</h3>
<ul>
<li>Define important terms before explaining difficult ideas.</li>
<li>Use examples immediately after hard explanations.</li>
<li>Watch for common errors in ${isMath && isLcm ? "LCM and HCF working" : "definitions and examples"}.</li>
<li>Keep the lesson focused on ${T} for this week only.</li>
<li>Do not add topics from other weeks just to make the note longer.</li>
${isSS ? "<li>For SS classes, keep answers examination friendly and accurate.</li>" : ""}
<li>Prepared for ${esc(schoolName)}. Teacher: ${esc(teacherName || "Class Teacher")}.</li>
</ul>
`.trim();
}

function periodsPerPeriodLabel(periodsPerWeek: number, minutesPerPeriod: number): string {
  const p = Number(periodsPerWeek) || 1;
  const m = Number(minutesPerPeriod) || 40;
  return `${p} period${p === 1 ? "" : "s"}, ${m} minutes each`;
}

export function buildLessonNoteHtml(payload: LessonNotePayload): string {
  const band = detectLevel(payload.classLevel);
  if (band === "creche" || band === "kg" || band === "nursery" || band === "primary") {
    return ensureLessonSectionsInHtml(earlyYearsNote(payload, band), payload);
  }
  return ensureLessonSectionsInHtml(secondaryNote(payload, band), payload);
}

/**
 * Guarantee ChatGPT-style teaching sections exist even if AI or a
 * subject branch returned partial HTML.
 */
export function ensureLessonSectionsInHtml(html: string, payload: LessonNotePayload): string {
  let out = String(html || "");
  const topic = esc(payload.topic || "this topic");
  const subject = esc(payload.subject || "the subject");
  const classLevel = esc(payload.classLevel || "the class");

  if (!/Teacher Activities/i.test(out)) {
    out += `
<h3>Teacher Activities</h3>
<ol>
<li><strong>Introduction (5 minutes):</strong> Greet students, review the previous lesson, and introduce ${topic} with a short question.</li>
<li><strong>Explanation (15-20 minutes):</strong> Present the main content on the board using simple language and examples from Nigerian school or community life.</li>
<li><strong>Demonstration (10 minutes):</strong> Work one full example or procedure step by step for the class.</li>
<li><strong>Guided practice (10 minutes):</strong> Lead the class through one question, then ask learners to try a similar one.</li>
<li><strong>Summary (5 minutes):</strong> Recap the key points of ${topic} and preview the next lesson.</li>
</ol>`;
  }

  if (!/Student Activities/i.test(out)) {
    out += `
<h3>Student Activities</h3>
<ol>
<li>Listen carefully and copy the board notes on ${topic}.</li>
<li>Answer oral questions during the lesson.</li>
<li>Work with a partner on one classwork question.</li>
<li>Complete the evaluation and classwork questions independently.</li>
</ol>`;
  }

  if (!/Classwork/i.test(out)) {
    out += `
<h3>Classwork</h3>
<ol>
<li>Define ${topic} in your own words.</li>
<li>Give two examples of ${topic} in ${subject}.</li>
<li>Complete one short practice question on ${topic}.</li>
</ol>`;
  }

  if (!/Homework|Assignment/i.test(out)) {
    out += `
<h3>Homework</h3>
<ol>
<li>Write a short summary of ${topic} using at least five new words from ${subject}.</li>
<li>Complete the practice questions for ${topic} in your exercise book.</li>
<li>Prepare one example of ${topic} for the next ${classLevel} lesson.</li>
</ol>`;
  }

  return out;
}

export function buildExercises(subject: string, topic: string, classLevel: string) {
  const band = detectLevel(classLevel);
  if (band === "creche" || band === "kg" || band === "nursery" || band === "primary") {
    return [
      { question: `Point to or name ${topic}.`, answer: `Learner recognises ${topic}.` },
      { question: `Show one object or picture related to ${topic}.`, answer: `Learner matches an object to ${topic}.` },
      { question: `Say one thing you learned about ${topic}.`, answer: `A simple oral response about ${topic}.` },
      { question: `Colour or trace the activity sheet for ${topic}.`, answer: `Completed short activity.` },
    ];
  }
  if (isLcmHcf(topic)) {
    return [
      { question: "Find the LCM of 4 and 6.", answer: "12" },
      { question: "Find the LCM of 8 and 12.", answer: "24" },
      { question: "Find the HCF of 12 and 16.", answer: "4" },
      { question: "Find the HCF of 18 and 24.", answer: "6" },
      { question: "Find both the LCM and HCF of 12 and 20.", answer: "LCM = 60, HCF = 4" },
    ];
  }
  return [
    { question: `What is the meaning of ${topic} in ${subject}?`, answer: `A clear definition of ${topic} for ${classLevel} ${subject}.` },
    { question: `Mention three examples or types of ${topic}.`, answer: `Any three accurate examples or types taught in this lesson.` },
    { question: `State four importance or uses of ${topic}.`, answer: `Any four accurate importance points from the lesson.` },
    { question: `Give one real life application of ${topic}.`, answer: `An application from school, home or community.` },
    { question: `Complete one short question on ${topic}.`, answer: `A complete answer using the steps or content taught.` },
  ];
}

export function buildAssignments(topic: string, subject: string) {
  const band = detectLevel("JSS 1");
  if (isLcmHcf(topic)) {
    return [
      { question: "Find the LCM and HCF of 24 and 36." },
      { question: "Find the LCM and HCF of 18 and 30." },
      { question: "Write the rule for LCM and the rule for HCF in your own words." },
    ];
  }
  return [
    { question: `Write a short summary of ${topic} using at least five new words from ${subject}.` },
    { question: `Complete the practice questions for ${topic} in your exercise book.` },
    { question: `Prepare one example of ${topic} for the next lesson.` },
  ];
}

export function buildMidtermFocusHtml(subject: string, classLevel: string, topic: string): string {
  return `
<h3>Week 5 Midterm Focus</h3>
<p>This is midterm week for ${esc(subject)} in ${esc(classLevel)}.</p>
<ul>
  <li>Revise Week 1 to Week 4 notes for ${esc(topic)} and related topics.</li>
  <li>Rerun classwork questions from earlier weeks.</li>
  <li>Open or generate the midterm paper for this subject.</li>
  <li>Record scores and note learners who need extra support.</li>
</ul>
`.trim();
}

/** Full class level list used by registration and bootstrap. */
export const SCHOOL_CLASS_LEVELS = [
  "Creche",
  "KG 1", "KG 2", "KG 3",
  "Nursery 1", "Nursery 2", "Nursery 3",
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3",
  "SS 1", "SS 2", "SS 3",
];

export function expandLevelToClasses(level: string): string[] {
  const l = String(level || "").toUpperCase().replace(/\s+/g, "");
  if (l === "CRECHE") return ["Creche"];
  if (l === "KG" || l === "KINDERGARTEN") return ["KG 1", "KG 2", "KG 3"];
  if (l === "NURSERY") return ["Nursery 1", "Nursery 2", "Nursery 3"];
  if (l === "PRIMARY") return ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"];
  if (l === "JSS") return ["JSS 1", "JSS 2", "JSS 3"];
  if (l === "SS") return ["SS 1", "SS 2", "SS 3"];
  if (/^(JSS|SS|NURSERY|PRIMARY|KG)\d$/.test(l)) {
    return [`${l.slice(0, -1)} ${l.slice(-1)}`];
  }
  if (/^PRIMARY[1-6]$/.test(l)) return [`Primary ${l.slice(-1)}`];
  return [level];
}
