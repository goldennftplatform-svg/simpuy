/**
 * Curated EMOTA-style trivia for ClaimRush power-ups.
 * Same shape as EzraMOTA TriviaItem (without endgameWeight on the wire).
 */

export const ACRES_PER_BLOCK = 10;
/** First player to this many acres wins. */
export const GOAL_ACRES = 180;

export const TRIVIA_BANK = [
  {
    id: "puyallup_hint",
    q: "Puyallup Valley farming in the Meeker story is especially tied to:",
    choices: ["Silver mining", "Hop fields", "Whale oil", "Cattle drives to Texas"],
    answer: 1,
    teach: "Ezra’s hop-king chapter is Puyallup — acres, kilns, and boom/bust.",
  },
  {
    id: "hop_king",
    q: "“Hop King of the World” points to:",
    choices: [
      "California gold only",
      "Puyallup Valley hops + Ezra’s big personality",
      "Lewis and Clark only",
      "A made-up island",
    ],
    answer: 1,
    teach: "Northwest hops + Meeker branding. Land skill was the real flex.",
  },
  {
    id: "land_claim",
    q: "At journey’s end, many families faced this land tension:",
    choices: [
      "Free land with zero paperwork",
      "Donation claims vs later fees and filings",
      "Only British crown grants",
      "Land assigned by dice",
    ],
    answer: 1,
    teach: "Oregon donation land and later Washington fees both shaped who kept farms.",
  },
  {
    id: "oregon_year",
    q: "The Meeker overland trip to Oregon Territory is tied to:",
    choices: ["1810s fur trade only", "1852 wagon migration", "1898 gold rush only", "1920s cars only"],
    answer: 1,
    teach: "1852 is the core Oregon Trail chapter before hops and mansion years.",
  },
  {
    id: "ezra_size",
    q: "Ezra Meeker was known as:",
    choices: [
      "Well over six feet",
      "About 5′1″ — small, huge mileage",
      "Average height",
      "Tall enough to see over oxen easily",
    ],
    answer: 1,
    teach: "Short in stature, enormous in trail miles and promotion.",
  },
  {
    id: "retrace",
    q: "From the 1870s into the 1920s, Ezra famously:",
    choices: [
      "Never left Oregon",
      "Retraced and promoted the Oregon Trail by wagon and modern travel",
      "Only took steamships to Europe",
      "Opposed all roads",
    ],
    answer: 1,
    teach: "Wagons, cars, even early flight — he kept the trail in people’s heads.",
  },
  {
    id: "river_logic",
    q: "Why did rivers matter so much on the real trail?",
    choices: [
      "They were just pretty",
      "They forced risk — ferries, fords, drownings",
      "They never flooded",
      "They were only crossed in winter",
    ],
    answer: 1,
    teach: "Diaries cluster drama at water. River tiles stay blocked for a reason.",
  },
  {
    id: "fee_acre",
    q: "Later land fees were often talked about as about:",
    choices: ["$0 forever", "$1.25 an acre", "$100 an acre", "Paid in hops only"],
    answer: 1,
    teach: "About $1.25/acre shows up in the fee era — cash mattered after “free” claims.",
  },
  {
    id: "mansion",
    q: "Meeker Mansion in Puyallup is best remembered as:",
    choices: [
      "A gold vault",
      "The hop-king house from the boom years",
      "A ferry office",
      "A fort from 1852",
    ],
    answer: 1,
    teach: "Finished around 1890 — six fireplaces energy, hop money energy.",
  },
  {
    id: "blocks_acres",
    q: "In CLAIMRUSH, how many acres is one block?",
    choices: ["1 acre", "10 acres", "100 acres", "500 acres"],
    answer: 1,
    teach: "1 block = 10 acres. Hit 200 acres (20 blocks) to lock the valley.",
  },
];

export function publicTrivia(item) {
  return {
    id: item.id,
    q: item.q,
    choices: item.choices,
    teach: item.teach,
  };
}

export function pickTrivia(excludeIds = []) {
  const pool = TRIVIA_BANK.filter((t) => !excludeIds.includes(t.id));
  const list = pool.length ? pool : TRIVIA_BANK;
  return list[Math.floor(Math.random() * list.length)];
}

export function checkAnswer(id, choiceIndex) {
  const item = TRIVIA_BANK.find((t) => t.id === id);
  if (!item) return { ok: false, teach: "Unknown question." };
  const correct = Number(choiceIndex) === item.answer;
  return { ok: correct, teach: item.teach, item };
}
