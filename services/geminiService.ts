import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GameState, Inventory, PartyMember, Player, PlayerAction, Profession, EncounterType, Encounter } from "../types";
import { getRandomSprite } from "../data/characterSprites";

// Initialize AI with error handling
let ai: GoogleGenAI | null = null;
try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
    } else {
        console.warn("No API key found. AI features will be limited.");
    }
} catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
}

const outcomeSchema = {
    type: Type.OBJECT,
    properties: {
        outcome: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: "A description of the outcome of the player's choice. Should be 1-2 sentences." },
                weekly_happenings: {
                    type: Type.ARRAY,
                    description: "For Travel action only: 2-4 brief bullet points describing what happened during the week (e.g., 'Passed through a war-torn village', 'Shared camp with pilgrims', 'Narrowly avoided bandits'). Keep each point to 3-7 words. Omit for non-Travel actions.",
                    items: { type: Type.STRING }
                },
                health_change: { type: Type.NUMBER, description: "Integer change in player health. Can be positive, negative, or zero." },
                food_change: { type: Type.NUMBER, description: "Integer change in player food supply. Can be positive, negative, or zero." },
                money_change: { type: Type.NUMBER, description: "Integer change in player money. Can be positive, negative, or zero." },
                oxen_change: { type: Type.NUMBER, description: "Integer change in number of oxen. Can be positive, negative, or zero." },
                distance_change: { type: Type.NUMBER, description: "Integer change in distance traveled. Usually zero unless the event causes it." },
                merchant_encountered: { type: Type.BOOLEAN, description: "Optional. Set to true if the player encounters a traveling merchant on the road." },
                inventory_changes: {
                    type: Type.ARRAY,
                    description: "A list of items to be added to or removed from inventory. Example: [{'item': 'Scrap Metal', 'change': 1}, {'item': 'Jerky', 'change': -2}]",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            item: { type: Type.STRING },
                            change: { type: Type.NUMBER }
                        },
                        required: ['item', 'change']
                    }
                },
                conditions_add: {
                    type: Type.ARRAY,
                    description: "A list of conditions to add to the player. Valid conditions: 'Wounded', 'Diseased', 'Exhausted', 'Broken Wagon', 'Starving'.",
                    items: { type: Type.STRING }
                },
                conditions_remove: {
                    type: Type.ARRAY,
                    description: "A list of conditions to remove from the player.",
                    items: { type: Type.STRING }
                },
                party_changes: {
                    type: Type.ARRAY,
                    description: "A list of changes to party members. Target members by name. Example: [{'name': 'Marie', 'health_change': -10, 'conditions_add': ['Sick'], 'relationship_change': -5, 'mood': 'afraid'}]",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "The name of the party member to affect." },
                            health_change: { type: Type.NUMBER, description: "Integer change in the party member's health." },
                            conditions_add: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Conditions to add to this member." },
                            conditions_remove: { type: Type.ARRAY, items: { type: 'STRING' }, description: "Conditions to remove from this member." },
                            relationship_change: { type: Type.NUMBER, description: "Change to relationship with player (-20 to +20). Negative if they blame the player, positive if they're grateful." },
                            mood: { type: Type.STRING, description: "Set mood to: 'content', 'worried', 'afraid', 'angry', or 'hopeful'" }
                        },
                        required: ['name']
                    }
                }
            },
            required: ["description", "health_change", "food_change", "money_change", "oxen_change", "distance_change", "inventory_changes", "conditions_add", "conditions_remove", "party_changes"],
        },
    },
    required: ["outcome"],
};

const encounterSchema = {
    type: Type.OBJECT,
    properties: {
        encounter: {
            type: Type.OBJECT,
            properties: {
                npc: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "The NPC's name. Should be historically appropriate for Early Modern Europe." },
                        type: { type: Type.STRING, description: "The type of NPC: traveler, beggar, merchant, soldier, pilgrim, bandit, priest, refugee, noble, or healer." },
                        description: { type: Type.STRING, description: "A brief physical description of the NPC. 1-2 sentences." },
                        mood: { type: Type.STRING, description: "The NPC's mood: friendly, neutral, hostile, or desperate." },
                        dialogue: {
                            type: Type.ARRAY,
                            description: "Initial greeting from the NPC. Should be a single string in an array.",
                            items: { type: Type.STRING }
                        },
                        backstory: { type: Type.STRING, description: "Optional brief backstory that explains who they are and why they're here. 1-2 sentences." },
                    },
                    required: ["name", "type", "description", "mood", "dialogue"]
                },
                situation: { type: Type.STRING, description: "What's happening when you meet this person. Sets the context. 2-3 sentences." },
                options: {
                    type: Type.ARRAY,
                    description: "Exactly 4 options in this order: 1) Fight option, 2) Money option, 3) Skill check option, 4) Custom input option.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING, description: "The action label shown to the player. Short and clear (3-5 words)." },
                            type: { type: Type.STRING, description: "The option type: 'fight', 'money', 'skill', or 'custom'." },
                            description: { type: Type.STRING, description: "What this option does and potential consequences (1 sentence)." },
                            skill: { type: Type.STRING, description: "For skill type only: which skill is used (combat, diplomacy, survival, medicine, stealth, knowledge)." },
                            skillThreshold: { type: Type.NUMBER, description: "For skill type only: difficulty threshold (30=easy, 50=medium, 70=hard)." },
                            moneyCost: { type: Type.NUMBER, description: "For money type only: amount spent (negative) or earned (positive)." },
                            moneyDescription: { type: Type.STRING, description: "For money type only: what the money represents (e.g., 'bribe', 'payment', 'reward')." },
                        },
                        required: ["label", "type", "description"]
                    }
                }
            },
            required: ["npc", "situation", "options"]
        }
    },
    required: ["encounter"]
};

const getPartyStatusString = (party: PartyMember[]) => {
    if (party.length === 0) return "The player is traveling alone. Their family did not survive.";
    return "The player is traveling with their family: " + party.map(p => `${p.name} (${p.role}, Personality: ${p.personalityTrait}, Health: ${p.health}, Mood: ${p.mood}, Relationship: ${p.relationship}/100, Trust: ${p.trust}/100, Conditions: ${p.conditions.join(', ') || 'None'})`).join('; ');
};

const getProfessionEventGuidance = (profession: Profession) => {
    switch(profession) {
        case Profession.Merchant:
        case Profession.Merchant_F:
            return "As a MERCHANT, events should often involve: trade opportunities, bandits targeting wealthy travelers, corrupt toll collectors, competing merchants, counterfeit goods, black market deals, cargo theft, smuggling opportunities.";
        case Profession.Priest:
            return "As a PRIEST, events should often involve: requests for last rites, heresy accusations, religious disputes, pilgrims seeking guidance, desecrated churches, possessed individuals, requests for blessings, conflicts between Catholic and Protestant.";
        case Profession.Nun:
            return "As a NUN, events should often involve: requests for prayers, accusations of improper behavior, religious refugees seeking sanctuary, conflicts with church authorities, pilgrims needing guidance, caring for sick travelers, religious visions, convent politics.";
        case Profession.Soldier:
            return "As a SOLDIER, events should often involve: deserters, military patrols, conscription attempts, battles aftermath, mercenary offers, weapons dealers, old war comrades, military intelligence, sieges.";
        case Profession.Blacksmith:
            return "As a BLACKSMITH, events should often involve: broken weapons/tools needing repair, requests for custom work, metal theft, forge fires, apprenticeship offers, rare metal discoveries, weapon inspections by authorities.";
        case Profession.Scholar:
        case Profession.Scholar_F:
            return "As a SCHOLAR, events should often involve: ancient manuscripts, coded messages, libraries, debates with other scholars, book burnings, accusations of heresy for knowledge, forbidden texts, scientific discoveries.";
        case Profession.Apothecary:
            return "As an APOTHECARY, events should often involve: plague victims seeking help, poisonings, rare herb discoveries, accusations of witchcraft, requests for medicines, childbirth emergencies, mysterious ailments.";
        case Profession.Midwife:
            return "As a MIDWIFE, events should often involve: urgent childbirth situations, women seeking medical advice, accusations of witchcraft, requests for healing, plague victims, complications during delivery, herbal remedies for ailments, midwife guild politics.";
        case Profession.Herbalist:
            return "As a HERBALIST, events should often involve: rare plant discoveries, accusations of witchcraft, requests for healing potions, poisoning investigations, healing plague victims, herbal garden raids, competing herbalists, secret remedies.";
        case Profession.Royal:
        case Profession.NobleWoman:
            return "As NOBILITY, events should often involve: political intrigue, assassination attempts, noble entourages, peasant uprisings, courtly etiquette challenges, inheritance disputes, demands for protection money, requests for patronage.";
        default:
            return "";
    }
};

const getWeeklyFocusGuidance = (focus: string) => {
    switch(focus) {
        case 'cautious':
            return "WEEKLY FOCUS: CAUTIOUS TRAVEL - The player is being extra careful, watching for dangers. Lower distance (15-25 km), less risk of ambush/injury, may avoid some dangers.";
        case 'fast':
            return "WEEKLY FOCUS: FAST TRAVEL - The player is pushing hard to cover ground quickly. Higher distance (30-45 km), more exhaustion, higher risk of accidents/ambush.";
        case 'forage':
            return "WEEKLY FOCUS: FORAGING - The player is gathering resources while traveling. Normal distance (20-30 km), chance to find food/herbs, may discover useful items.";
        case 'bond':
            return "WEEKLY FOCUS: FAMILY BONDING - The player is spending extra time with family during travel. Normal distance (20-30 km), improves family relationships/morale, lowers stress.";
        case 'vigilant':
            return "WEEKLY FOCUS: VIGILANT - The player is keeping extra watch for threats and opportunities. Normal distance (20-30 km), better awareness of dangers/opportunities, may spot things others miss.";
        default:
            return "WEEKLY FOCUS: NORMAL TRAVEL - Standard travel pace and awareness.";
    }
};

const getSystemInstruction = (player: Player, gameState: GameState) => `
You are a text-based RPG game master for "Le Chemin de Rome" (The Road to Rome).
Setting: Early Modern Europe (1450-1650) - an era of religious upheaval, warfare, plague, and transformation. The Renaissance, Reformation, Counter-Reformation, and devastating religious wars define this period.
The player is travelling from France to Rome through dangerous territories during this tumultuous age.
The player is a ${player.gender} ${player.profession} named ${player.name}.
${player.gender === 'Female' ? `IMPORTANT: As a woman in Early Modern Europe, ${player.name} faces additional societal challenges and prejudices, but also has access to certain social networks (other women, religious communities) that men might not. Reflect historical reality while respecting the player's agency. Women travelers often disguised themselves as men, traveled in groups, or claimed religious purposes for protection.` : ''}
${getProfessionEventGuidance(player.profession)}
${getPartyStatusString(gameState.party)}
${getWeeklyFocusGuidance(gameState.weeklyFocus)}
Current game state:
- Day: ${gameState.day}
- Player Health: ${gameState.health}
- Food: ${gameState.food}
- Money: ${gameState.money}
- Oxen: ${gameState.oxen}
- Distance to Rome: ${gameState.distanceToRome} km
- Inventory: ${JSON.stringify(gameState.inventory)}
- Player Active Conditions: ${gameState.conditions.join(', ') || 'None'}

Your role is to create DRAMATIC, EXCITING, and historically plausible outcomes for the player's actions.
Early Modern Europe threats: Religious wars (Thirty Years' War, French Wars of Religion), bandits and brigands, plague epidemics, corrupt officials, witch hunts, mercenary companies, deserters, inquisitors, heretics, alchemists, charlatan healers, apocalyptic preachers.
Generate VARIED and INTENSE events that reflect the player's PROFESSION: ambushes by bandits, encounters with soldiers, plague villages, religious zealots, fortune tellers, wounded travelers begging for help, abandoned battlefields with supplies, mysterious strangers with secrets, corrupt toll collectors, witch accusations, supernatural rumors, desperate refugees, trade opportunities, crafting requests.

IMPORTANT: Tailor events to the player's profession when possible. A merchant encounters different situations than a priest or soldier.

AVOID BORING DESCRIPTIONS like "the path is muddy" or "you make steady progress" - be DRAMATIC and SPECIFIC.
Examples of GOOD descriptions:
- "Armed men block the road ahead, demanding all travelers pay a 'protection fee' or face consequences."
- "A wounded soldier crawls from the ditch, gasping that his company was ambushed by deserters just ahead."
- "The village is silent. Too silent. Doors are marked with red crosses - plague."
- "A wild-eyed woman grabs your arm, warning that the bridge ahead is watched by those who serve 'the old gods.'"

Keep descriptions to 2-3 sentences maximum. Be DRAMATIC but CONCISE.
The journey is DANGEROUS and full of MORAL DILEMMAS.

IMPORTANT - FAMILY RELATIONSHIPS:
Consider how events affect family dynamics. Use party_changes to reflect:
- Family members react differently based on their personality traits (brave, cautious, optimistic, etc.)
- Dangerous situations lower relationship if they feel endangered (-5 to -15)
- Protecting them or making good choices raises relationship (+3 to +10)
- Their spouse will be protective; the child will be more fearful
- Low trust (<40) means they'll question decisions more
- High relationship (>75) means they'll support you even in danger

The outcome can affect health, resources, inventory, character conditions, AND family relationships dramatically.
Do not break character. Do not output anything other than the requested JSON.
`;

const getActionPrompt = (action: PlayerAction, profession: Profession): string => {
    switch (action) {
        case 'Travel':
            return `The player chose to travel for a week. Generate the outcome.

IMPORTANT INSTRUCTIONS:
1. The 'description' should be SHORT (1 sentence) - either a summary of an uneventful week OR describe ONE major event if something dramatic happened.
   - Uneventful week example: "The week passes without major incident."
   - Major event example: "Armed bandits ambush your wagon, demanding everything you own!"

2. The 'weekly_happenings' array should contain 2-4 brief bullet points (3-7 words each) describing what happened during the week:
   - Examples: "Crossed a river at dawn", "Shared camp with pilgrims", "Oxen went lame, slowed progress", "Heavy rain for three days"
   - Mix mundane and interesting happenings
   - If there's a MAJOR dramatic event (bandits, plague, etc.), one of the bullets should reference it, and the description should focus on it
   - If it's a quiet week, bullets should be more mundane travel details

Examples of DRAMATIC events (only occasionally):
- Bandit ambush demanding valuables
- Encounter with plague refugees
- Military checkpoint with suspicious soldiers
- Finding a corpse with mysterious items
- Witnessing an execution or witch burning
- Crossing paths with dangerous mercenaries
- Stumbling upon a hidden shrine or cult gathering
- Being accused of witchcraft by villagers
- Finding an abandoned battlefield with supplies (and bodies)
- Meeting a desperate alchemist fleeing the Inquisition

The outcome must include 'distance_change' between 15 and 40 km.
There's a small chance of encountering a traveling merchant.
Consider food consumption and health impacts from the week's travel.`;
        case 'Rest':
             return "The player rests. Keep it brief but make it feel earned. Maybe they find a moment of peace, or their rest is disturbed by nightmares of the road. 'distance_change' must be 0. Restores health and removes 'Exhausted' condition.";
        case 'Make Camp':
            return "The player sets up camp. Describe what they notice as they make camp - signs of other travelers, distant sounds, the feel of the place. Keep it atmospheric but brief. This transitions to 'camp' phase.";
        case 'Scout Ahead':
            return "The player scouts ahead. Show them something INTERESTING or OMINOUS: approaching soldiers, smoke from a village, signs of recent violence, strange symbols carved into trees, etc. Be SPECIFIC. This is for flavor only, no stat changes.";
        case 'Forage for Herbs':
            return "As an Apothecary, the player forages for herbs. Maybe they find useful plants, or encounter something unexpected while searching (a grave, a trapped animal, strange mushrooms). They might find 'Medicinal Herbs' or face a minor challenge.";
        case 'Repair Wagon':
            return "As a Blacksmith, the player repairs the wagon. Maybe the damage reveals something hidden, or the work attracts attention. Keep it interesting but focused. This removes 'Broken Wagon' condition.";
    }
    return "This action is handled locally and should not require an AI-generated outcome.";
}

export const generateCharacterImage = async (player: Player): Promise<string> => {
    // Use fallback sprites if AI is not available
    if (!ai) {
        console.log("AI not available, using pixel art sprite for", player.profession);
        return getRandomSprite(player.profession);
    }

    try {
        const prompt = `16-bit pixel art portrait of a ${player.profession} from Early Modern Europe (1450-1650). Fantasy RPG character style, similar to classic SNES games like Final Fantasy. The character should look weary from travel but determined. Centered bust portrait with a plain background. Retro gaming aesthetic. Period-appropriate clothing and equipment.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Could not generate character image from response.");
    } catch (error) {
        console.error("Error generating character image:", error);
        console.log("Using fallback pixel art sprite for", player.profession);

        // Fallback: Use pre-generated pixel art sprites
        return getRandomSprite(player.profession);
    }
};

export const generateRandomEvent = async (player: Player, gameState: GameState): Promise<{scenario: string} | null> => {
    if (!ai) return null;

    // Random chance for event (60% chance - events are central to the game)
    if (Math.random() > 0.6) return null;

    try {
        const systemInstruction = getSystemInstruction(player, gameState);
        const professionHint = player.profession === Profession.Merchant ? " Consider trade-related events." :
                              player.profession === Profession.Priest ? " Consider religious events or people seeking spiritual aid." :
                              player.profession === Profession.Soldier ? " Consider military encounters or combat situations." :
                              player.profession === Profession.Blacksmith ? " Consider situations involving broken equipment or metalwork." :
                              player.profession === Profession.Scholar ? " Consider events involving knowledge, books, or intellectual challenges." :
                              player.profession === Profession.Apothecary ? " Consider medical emergencies or herb-related events." :
                              player.profession === Profession.Royal ? " Consider political intrigue or noble affairs." : "";

        const prompt = `Generate a DRAMATIC random event that the player encounters. Early Modern Europe (1450-1650) - religious wars, plague, bandits, and chaos. Make it EXCITING and DANGEROUS.${professionHint}

Examples of GOOD events:
- Armed bandits surround you, demanding everything. Their leader eyes your family hungrily.
- A man in priest's robes runs toward you screaming "They burn innocents! The Inquisition has gone mad!"
- You find a wounded woman clutching a satchel. She whispers "Don't let them take it" before dying.
- Soldiers drag a man from his home. "Witch!" they cry. He locks eyes with you, pleading silently.
- A plague cart rolls by. The driver grins and says "Room for more! You look feverish, friend."
- Mercenaries block the road. "Pay the toll or become the toll," their captain laughs.
- A child runs to you crying that his village was attacked and everyone is dead or taken.
- You witness a public execution. The condemned shouts "The old gods return! The crosses will fall!"

Make it 2-3 sentences. Be DRAMATIC and SPECIFIC. Create moral dilemmas and dangerous choices.
The scenario should end with a question asking what the player wants to do.

Return ONLY a JSON object with a "scenario" field.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scenario: { type: Type.STRING }
                    },
                    required: ["scenario"]
                }
            },
        });

        const jsonStr = response.text;
        const data = JSON.parse(jsonStr);
        return data;

    } catch (error) {
        console.error("Error generating random event:", error);
        return null;
    }
};

export const processEventChoice = async (player: Player, gameState: GameState, scenario: string, playerChoice: string) => {
    const getFallbackOutcome = () => ({
        description: "Your choice has been noted. You continue on your way.",
        health_change: 0,
        food_change: 0,
        money_change: 0,
        oxen_change: 0,
        distance_change: 0,
        merchant_encountered: false,
        inventory_changes: [],
        conditions_add: [],
        conditions_remove: [],
        party_changes: [],
    });

    if (!ai) return getFallbackOutcome();

    try {
        const systemInstruction = getSystemInstruction(player, gameState);
        const prompt = `The player encountered this scenario: "${scenario}"

The player chose to respond: "${playerChoice}"

Based on their choice, generate an outcome that:
- Could be positive, negative, or neutral
- Should logically follow from their choice
- May affect health, resources, inventory, or conditions
- Should be realistic to Early Modern European travel (1450-1650)
- Should take into account the player's profession when relevant
- Keep description to 2-3 sentences

Generate an appropriate outcome.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: outcomeSchema,
            },
        });

        const jsonStr = response.text;
        const data = JSON.parse(jsonStr);
        return data.outcome;

    } catch (error) {
        console.error("Error processing event choice:", error);
        return getFallbackOutcome();
    }
};

export const generateActionOutcome = async (player: Player, gameState: GameState, action: PlayerAction) => {
    // Fallback outcome function
    const getFallbackOutcome = () => {
        if (action === 'Travel') {
            return {
                description: "The week passes without major incident.",
                weekly_happenings: [
                    "Traveled through farmland",
                    "Weather mostly fair",
                    "Met other travelers on road"
                ],
                health_change: -2,
                food_change: -5,
                money_change: 0,
                oxen_change: 0,
                distance_change: 20,
                merchant_encountered: false,
                inventory_changes: [],
                conditions_add: [],
                conditions_remove: [],
                party_changes: [],
            };
        }
        return {
            description: "You complete your task without incident.",
            weekly_happenings: [],
            health_change: 0,
            food_change: 0,
            money_change: 0,
            oxen_change: 0,
            distance_change: 0,
            merchant_encountered: false,
            inventory_changes: [],
            conditions_add: [],
            conditions_remove: [],
            party_changes: [],
        };
    };

    if (!ai) {
        console.warn("AI not available, using fallback outcome");
        return getFallbackOutcome();
    }

    try {
        const systemInstruction = getSystemInstruction(player, gameState);
        const prompt = getActionPrompt(action, player.profession);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: outcomeSchema,
            },
        });

        const jsonStr = response.text;
        const data = JSON.parse(jsonStr);
        return data.outcome;

    } catch (error) {
        console.error("Error generating event outcome:", error);
        return getFallbackOutcome();
    }
};

export const generateEncounter = async (player: Player, gameState: GameState): Promise<Encounter | null> => {
    if (!ai) return null;

    // 40% chance for encounter during travel
    if (Math.random() > 0.4) return null;

    try {
        const systemInstruction = getSystemInstruction(player, gameState);
        const professionHint = getProfessionEventGuidance(player.profession);

        const prompt = `Generate a random encounter on the road to Rome. Early Modern Europe (1450-1650).
${professionHint}

The encounter should introduce a specific NPC character that the player meets. This person should:
- Have a clear personality and motivation
- Present an interesting situation or dilemma
- Be historically appropriate for the setting

Good encounter examples:
- A wounded pilgrim begging for food and medical aid, claims bandits took everything
- A suspicious merchant offering "rare relics" at suspiciously low prices
- A deserter soldier hiding in the woods, desperate and possibly dangerous
- A traveling priest warning of heretics ahead, asking the player to report any suspicious activity
- A beggar woman with a sick child, pleading for medicine or money
- A group of refugees fleeing religious persecution, asking for guidance
- A noble's servant looking for help finding their master who went missing
- An old healer offering to trade remedies for supplies

IMPORTANT: Provide EXACTLY 4 options in this specific order:

1. FIGHT OPTION (type: "fight")
   - Involves combat or physical confrontation
   - Example: "Attack the bandit", "Draw your weapon", "Fight them off"
   - Description should mention combat risks and potential loot

2. MONEY OPTION (type: "money")
   - Involves spending money (negative moneyCost) or earning money (positive moneyCost)
   - Set moneyCost (e.g., -50 for bribe, +30 for reward)
   - Set moneyDescription (e.g., "bribe", "toll", "payment for help", "reward")
   - Example: "Pay the toll" (cost -20), "Accept their offer" (reward +30)

3. SKILL CHECK OPTION (type: "skill")
   - Uses one of the 6 skills: combat, diplomacy, survival, medicine, stealth, knowledge
   - Set skill name and skillThreshold (30=easy, 50=medium, 70=hard)
   - Example: "Persuade them to leave" (diplomacy, 50), "Sneak past" (stealth, 60), "Treat their wounds" (medicine, 40)
   - Vary which skill is used based on the situation

4. CUSTOM INPUT OPTION (type: "custom")
   - Always label as "Say something else" or "Do something else"
   - Description: "Speak or act freely - your words will be analyzed"
   - This allows player to type custom response analyzed by AI

The NPC should feel like a real person with their own story.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: encounterSchema,
            },
        });

        const jsonStr = response.text;
        const data = JSON.parse(jsonStr);
        return data.encounter;

    } catch (error) {
        console.error("Error generating encounter:", error);
        return null;
    }
};

export const processEncounterAction = async (
    player: Player,
    gameState: GameState,
    encounter: Encounter,
    optionIndex: number,
    customInput?: string
) => {
    const getFallbackOutcome = () => ({
        description: "You part ways with the stranger and continue your journey.",
        health_change: 0,
        food_change: 0,
        money_change: 0,
        oxen_change: 0,
        distance_change: 0,
        merchant_encountered: false,
        inventory_changes: [],
        conditions_add: [],
        conditions_remove: [],
        party_changes: [],
    });

    if (!ai) return getFallbackOutcome();

    try {
        const systemInstruction = getSystemInstruction(player, gameState);
        const npcInfo = `NPC: ${encounter.npc.name}, a ${encounter.npc.type} who is ${encounter.npc.mood}. ${encounter.npc.description}`;
        const situationInfo = `Situation: ${encounter.situation}`;
        const option = encounter.options[optionIndex];

        let actionDescription = option.label;
        let skillCheckResult = "";

        // Handle skill check
        if (option.type === 'skill' && option.skill && option.skillThreshold) {
            const playerSkillValue = gameState.skills[option.skill];
            const threshold = option.skillThreshold;
            const randomBonus = Math.floor(Math.random() * 20) - 10; // -10 to +10 random factor
            const totalValue = playerSkillValue + randomBonus;
            const success = totalValue >= threshold;

            skillCheckResult = `SKILL CHECK: ${option.skill} (Player: ${playerSkillValue}, Threshold: ${threshold}, Roll: ${randomBonus > 0 ? '+' : ''}${randomBonus}, Total: ${totalValue}) - ${success ? 'SUCCESS' : 'FAILURE'}`;
            actionDescription = `${option.label} (${success ? 'succeeded' : 'failed'})`;
        }

        // Handle custom input
        if (option.type === 'custom' && customInput) {
            actionDescription = `Custom action: "${customInput}"`;
        }

        // Handle money transaction
        let moneyNote = "";
        if (option.type === 'money' && option.moneyCost) {
            moneyNote = `MONEY TRANSACTION: ${option.moneyCost < 0 ? 'Cost' : 'Reward'} of ${Math.abs(option.moneyCost)} coins (${option.moneyDescription})`;
        }

        const prompt = `The player encountered ${npcInfo}
${situationInfo}

The player chose: "${actionDescription}"
${skillCheckResult}
${moneyNote}

Generate an outcome that:
- Reflects the NPC's personality, mood, and type
- Is appropriate for the chosen action
- ${skillCheckResult ? 'Takes into account whether the skill check succeeded or failed. Success = positive outcome, Failure = negative outcome or complications.' : ''}
- ${moneyNote ? `Includes the money transaction in the outcome (set money_change to ${option.moneyCost}).` : ''}
- ${option.type === 'fight' ? 'Involves combat. Player may take damage but could gain loot. Consider player combat skill.' : ''}
- Could involve rewards, consequences, or neutral results
- May affect health, resources, inventory, or conditions
- Should feel meaningful and consequential
- Keep description to 2-3 sentences

Generate an appropriate outcome based on the player's choice.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: outcomeSchema,
            },
        });

        const jsonStr = response.text;
        const data = JSON.parse(jsonStr);
        return data.outcome;

    } catch (error) {
        console.error("Error processing encounter action:", error);
        return getFallbackOutcome();
    }
};

export const processEncounterConversation = async (
    player: Player,
    gameState: GameState,
    encounter: Encounter,
    playerMessage: string
): Promise<string | null> => {
    if (!ai) return null;

    try {
        const systemInstruction = getSystemInstruction(player, gameState);
        const conversationHistory = encounter.npc.dialogue.join('\n');

        const prompt = `You are roleplaying as ${encounter.npc.name}, a ${encounter.npc.type}.

Character details:
- Description: ${encounter.npc.description}
- Mood: ${encounter.npc.mood}
- Backstory: ${encounter.npc.backstory || "Unknown"}
- Current situation: ${encounter.situation}

Conversation so far:
${conversationHistory}

The player says: "${playerMessage}"

Respond as this character would. Keep your response to 2-4 sentences. Stay in character. Be dramatic and engaging.
The character's mood affects how they respond:
- friendly: Open, helpful, warm
- neutral: Cautious, businesslike, reserved
- hostile: Aggressive, threatening, unfriendly
- desperate: Pleading, emotional, urgent

Return ONLY a JSON object with a "response" field containing the NPC's reply.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{text: prompt }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        response: { type: Type.STRING }
                    },
                    required: ["response"]
                }
            },
        });

        const jsonStr = response.text;
        const data = JSON.parse(jsonStr);
        return data.response;

    } catch (error) {
        console.error("Error processing encounter conversation:", error);
        return null;
    }
};