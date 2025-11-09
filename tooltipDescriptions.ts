// Tooltip descriptions for all game stats and conditions

export const STAT_TOOLTIPS = {
  health: "Your physical wellbeing. Falls to 0 and you die. Affected by food, rest, injuries, and disease. Restore with medical items or resting at camp.",
  food: "Provisions for your journey. Each person consumes food per week based on rations: Filling (2x), Normal (1x), Meager (0.5x). Running out causes starvation. Buy at markets or hunt for more.",
  money: "Coins for trade. Use to purchase supplies, food, and equipment at markets. Earn through selling trade goods or completing tasks.",
  oxen: "Draft animals pulling your wagon. More oxen means faster, safer travel. They can die from overwork, starvation, or accidents.",
  stamina: "Energy for non-travel actions. Consumed by hunting, scouting, crafting, and foraging. Restores based on ration level when you travel.",
  distanceToRome: "Kilometers remaining to reach Rome. The journey totals 1,400 km through France, Switzerland, and Italy.",
  distanceTraveled: "How far you've come from your starting point in France. Track your progress toward the eternal city.",
};

export const CONDITION_TOOLTIPS = {
  Wounded: "Injured from combat, accidents, or mishaps. Reduces health over time and may worsen. Treat with bandages or medical care at camp.",
  Diseased: "Afflicted by illness. Could be plague, fever, dysentery, or infection. Causes ongoing health loss. Requires medicinal herbs or healing poultices.",
  Exhausted: "Completely drained of energy from overwork or lack of rest. Reduces stamina regeneration and slows recovery. Cure with proper rest or herbal tea.",
  "Broken Wagon": "Your wagon has broken wheels, axles, or structural damage. Slows travel significantly and risks further breakdown. Repair with wagon repair kit or blacksmith services.",
  Starving: "Suffering from severe hunger and malnutrition. Health deteriorates rapidly without food. Feed the party immediately or face death.",
};

export const PHASE_TOOLTIPS = {
  traveling: "On the road between settlements. Time passes quickly (1 week per turn). You can travel, scout ahead, or make camp.",
  camp: "Resting at a makeshift campsite. Time is paused. You can hunt, forage, craft, repair, or break camp to continue.",
  in_city: "Arrived at a major settlement. Time is paused. Visit the market, rest, and prepare for the next leg of your journey.",
  merchant_encounter: "Met a traveling merchant on the road. An opportunity to trade away from cities, but prices may be higher.",
};

export const WEATHER_TOOLTIPS = {
  Clear: "Sunny skies and good visibility. Ideal conditions for travel with no penalties.",
  Rain: "Wet conditions slow travel slightly. Roads become muddy and camping is less comfortable.",
  Storm: "Dangerous weather with heavy rain, wind, or lightning. Travel is risky and may cause injuries or delays.",
  Snow: "Cold weather with snowfall. Significantly slows travel. Risk of frostbite and hypothermia without warm clothing.",
  Fog: "Limited visibility makes navigation difficult. Higher risk of getting lost or ambushed by bandits.",
};

export const SEASON_TOOLTIPS = {
  Spring: "Mild weather and blooming flowers. Good season for travel with moderate temperatures and occasional rain.",
  Summer: "Hot weather and long days. Ideal for travel but water and shade become important. Harvest season approaches.",
  Autumn: "Cooling temperatures and falling leaves. Good travel weather. Harvest time means markets are well-stocked.",
  Winter: "Cold, harsh weather with short days. Travel is difficult and dangerous. Warm clothing essential. Food is scarce.",
};

export const RELATIONSHIP_TOOLTIPS = {
  general: "How your family members feel about you. Affected by your choices, conversations, and how well you provide for them. Low relationship can lead to family members leaving or refusing to help.",
};

export const TRUST_TOOLTIPS = {
  general: "How much your family trusts your leadership and judgment. Built through successful decisions and deep conversations. High trust means family members will follow you even in dire circumstances.",
};

export const MOOD_TOOLTIPS = {
  content: "Happy and satisfied with the journey. This family member has no major complaints.",
  worried: "Concerned about dangers ahead or current conditions. May need reassurance or better circumstances.",
  afraid: "Scared by recent events or deteriorating conditions. Relationship may be declining.",
  angry: "Upset with recent decisions or treatment. At risk of leaving if things don't improve.",
  hopeful: "Looking forward to reaching Rome despite current hardships. Optimistic about the future.",
  devoted: "Completely loyal and trusting. Will follow you anywhere regardless of circumstances.",
};

export const PERSONALITY_TOOLTIPS = {
  Brave: "Faces danger courageously. Less affected by frightening events. Good in crisis situations.",
  Cautious: "Careful and risk-averse. May question dangerous decisions but helps avoid disasters.",
  Optimistic: "Sees the bright side. Maintains morale better in difficult times. Resists despair.",
  Pessimistic: "Expects the worst. More easily worried or frightened but realistic about dangers.",
  Loyal: "Deeply committed to family. Slower to lose relationship and trust. Very reliable.",
  Independent: "Self-reliant and strong-willed. May disagree more but handles hardship better.",
  Compassionate: "Cares deeply about others. Wants to help strangers even at personal cost.",
  Pragmatic: "Practical and realistic. Focuses on survival over idealism. Good in tough choices.",
};

export const PROFESSION_TOOLTIPS = {
  // Male professions
  Merchant: "Expert in trade and negotiation. Gets 15% better prices when buying and selling at markets. Starts with trade goods and more money.",
  Priest: "Respected religious figure. Can craft holy water. May receive help more easily from the faithful. Starts with religious items and healing supplies.",
  Soldier: "Hardy warrior with combat experience. 10% better hunting success chance. Better at handling threats and violence. Starts with military equipment.",
  Blacksmith: "Master of metalwork. Can repair wagons using scrap metal while camped. Can craft repair kits. Starts with tools and materials.",
  Scholar: "Learned academic. Can decipher ancient texts and write scholarly letters. Knowledge opens doors in cities. Starts with books and writing supplies.",
  Apothecary: "Healer and herbalist. Can forage for medicinal herbs while camped. Can craft powerful healing remedies. Starts with medical supplies.",
  Royal: "Noble of high birth. Extremely wealthy and well-equipped. Receives preferential treatment but may be targeted by criminals. Very rare.",

  // Female professions
  Nun: "Devoted woman of God. Respected in religious circles. Can craft holy water and provide spiritual guidance. Starts with religious items and healing supplies.",
  Midwife: "Skilled healer and expert in medicine. Can forage for medicinal herbs while camped. Trusted in communities for healing knowledge. Starts with excellent medical supplies.",
  Herbalist: "Expert in plants and natural remedies. Can forage for medicinal herbs while camped. Can craft powerful healing items. Starts with extensive herb collection.",
  "Noble Woman": "Woman of high birth with considerable wealth and influence. Commands respect despite societal barriers. Receives preferential treatment. Very rare.",
  "Merchant (Female)": "Savvy trader who built her business against societal odds. Gets 15% better prices when buying and selling at markets. Starts with trade goods and money.",
  "Scholar (Female)": "Rare woman of letters, exceptionally educated. Faces societal barriers but possesses valuable knowledge. Can decipher texts and write letters. Starts with books.",
};
