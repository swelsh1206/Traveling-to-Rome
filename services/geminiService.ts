import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GameState, Inventory, PartyMember, Player, PlayerAction, Profession } from "../types";
import { getRandomSprite } from "../data/characterSprites";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
                    description: "A list of changes to party members. Target members by name. Example: [{'name': 'Marie', 'health_change': -10, 'conditions_add': ['Sick']}]",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "The name of the party member to affect." },
                            health_change: { type: Type.NUMBER, description: "Integer change in the party member's health." },
                            conditions_add: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Conditions to add to this member." },
                            conditions_remove: { type: Type.ARRAY, items: { type: 'STRING' }, description: "Conditions to remove from this member." },
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
    if (party.length === 0) return "The player is traveling alone.";
    return "The player is traveling with their family: " + party.map(p => `${p.name} (Health: ${p.health}, Conditions: ${p.conditions.join(', ') || 'None'})`).join('; ');
};

const getSystemInstruction = (player: Player, gameState: GameState) => `
You are a text-based RPG game master for "Le Chemin de Rome" (The Road to Rome).
The year is 1640. The player is travelling from France to Rome.
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

Your role is to create engaging, challenging, and historically plausible outcomes for the player's actions.
Generate a wide variety of events: weather (sudden storms, heat), terrain (muddy roads, a broken bridge), social (meeting other travelers, suspicious figures), and discoveries (an abandoned campsite, a hidden spring).
IMPORTANT: Keep the "description" of the outcome to 1-2 sentences. It should be simple and direct. Not every day involves a major event.
The outcome can affect health, resources, inventory, and character conditions.
An event can affect a party member specifically by name.
The journey is difficult. Keep the tone serious.
Do not break character. Do not output anything other than the requested JSON.
`;

const getActionPrompt = (action: PlayerAction, profession: Profession): string => {
    switch (action) {
        case 'Travel':
            return `The player chose to travel for a day. Generate a varied and interesting outcome for their journey based on the system instructions. An obstacle could make the player or a party member 'Injured' or damage the wagon ('Wagon Damaged'). There's a small chance of encountering a merchant. The outcome must include a 'distance_change' between 15 and 40 km. It must also include food and health changes for the day's travel for the entire party. Reduce the frequency of the 'Exhausted' condition; save it for very challenging events.`;
        case 'Rest':
             return "The player chose to rest for the day. Describe their day of rest in 1-2 sentences. This action restores health and removes the 'Exhausted' condition for the player or party members. 'distance_change' must be 0. The entire party still consumes some food.";
        case 'Make Camp':
            return "The player chose to set up camp for the day. Describe them setting up camp in 1-2 sentences. The outcome should be minimal. This action transitions them to the 'camp' phase where they will make other choices.";
        case 'Scout Ahead':
            return "The player spends some time scouting the path ahead. Describe what they see in 1-2 sentences. This is purely for flavor and information, it should not have any stat changes. Example: 'You see dark clouds gathering in the mountains ahead,' or 'You find tracks indicating a merchant passed this way recently.'";
        case 'Forage for Herbs':
            return "As an Apothecary, the player spends time foraging for useful plants. Describe their search in 1-2 sentences. They might find 'Medicinal Herbs' or nothing at all.";
        case 'Repair Wagon':
            return "As a Blacksmith, the player attempts to repair their wagon using scrap metal. Describe the repair attempt. This action should remove the 'Wagon Damaged' condition.";
    }
    // Default case for camp actions that don't need AI (like Hunt, which is now interactive)
    return "This action is handled locally and should not require an AI-generated outcome.";
}

export const generateCharacterImage = async (player: Player): Promise<string> => {
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

export const generateActionOutcome = async (player: Player, gameState: GameState, action: PlayerAction) => {
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
        // Fallback outcome
        return {
            description: "The road ahead is quiet. You make steady progress.",
            health_change: -2,
            food_change: -5,
            money_change: 0,
            oxen_change: 0,
            distance_change: 15,
            merchant_encountered: false,
            inventory_changes: [],
            conditions_add: [],
            conditions_remove: [],
            party_changes: [],
        };
    }
};