import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GameState, Inventory, PartyMember, Player, PlayerAction, Profession } from "../types";
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
                    description: "A list of conditions to add to the player, like 'Injured', 'Sick', 'Exhausted', or 'Wagon Damaged'.",
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

const getPartyStatusString = (party: PartyMember[]) => {
    if (party.length === 0) return "The player is traveling alone. Their family did not survive.";
    return "The player is traveling with their family: " + party.map(p => `${p.name} (${p.role}, Personality: ${p.personalityTrait}, Health: ${p.health}, Mood: ${p.mood}, Relationship: ${p.relationship}/100, Trust: ${p.trust}/100, Conditions: ${p.conditions.join(', ') || 'None'})`).join('; ');
};

const getSystemInstruction = (player: Player, gameState: GameState) => `
You are a text-based RPG game master for "Le Chemin de Rome" (The Road to Rome).
The year is 1640. Europe is in chaos from the Thirty Years' War. The player is travelling from France to Rome through dangerous territories.
The player is a ${player.profession} named ${player.name}.
${getPartyStatusString(gameState.party)}
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
Europe in 1640: Religious wars, bandits, plague-stricken villages, corrupt officials, witch hunts, mercenaries, deserters, mysterious cultists, alchemists, inquisitors.
Generate VARIED and INTENSE events: ambushes by bandits, encounters with soldiers, plague villages, religious zealots, fortune tellers, wounded travelers begging for help, abandoned battlefields with supplies, mysterious strangers with secrets, corrupt toll collectors, witch accusations, supernatural rumors, desperate refugees.

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
            return `The player chose to travel for a week. Generate a DRAMATIC and EXCITING outcome.
Examples of good travel events:
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

Make it SPECIFIC and DRAMATIC. Avoid generic descriptions.
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
            return "As a Blacksmith, the player repairs the wagon. Maybe the damage reveals something hidden, or the work attracts attention. Keep it interesting but focused. This removes 'Wagon Damaged' condition.";
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
        const prompt = `16-bit pixel art portrait of a ${player.profession} from 17th century France. Fantasy RPG character style, similar to classic SNES games like Final Fantasy. The character should look weary from travel but determined. Centered bust portrait with a plain background. Retro gaming aesthetic.`;

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
        const prompt = `Generate a DRAMATIC random event that the player encounters. This is 1640 Europe during the Thirty Years' War. Make it EXCITING and DANGEROUS.

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
- Should be realistic to 17th century travel
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
                description: "The road ahead is quiet. You make steady progress.",
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