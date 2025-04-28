import { OpenAI } from 'openai';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

const client = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

/**
 * Generates tags based on the survey title and questions using the OpenAI API
 * @param {string} title - The survey title
 * @param {array} questions - The survey questions
 * @returns {string[]} Returns an array of generated tags
 */

export async function generateTagsForSurvey(title, questions) {
    try {
        const prompt = `Based on the following survey information, generate a single-word tag that best describes it:
        Title: ${title}
        Questions: ${questions.join(' ')}
        Only return one word.`;
        //console.log("Prompt sent to GPT:", prompt);

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
        });
        //console.log("GPT Response:", response);

        const tag = response.choices[0].message.content.trim();
        //console.log("Generated Tag:", tag);

        return tag.split(',').map(t => t.trim()).slice(0, 1);
    } catch (error) {
        //console.error('Error generating tags:', error);
        return [];
    }
}

/**
 * Updates the tags field for a user in Firestore
 * @param {string} userId - The user ID
 * @param {string} newTag - The generated tag
 */

export async function updateUserTags(userId, newTag) {
    if (!newTag) return;
    //console.log("Updating user tags for userId:", userId, "with tag:", newTag);

    try {
        const userRef = doc(db, 'users', userId);
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) return;

            const existingTags = userDoc.data().tags || [];
            if (!existingTags.includes(newTag)) {
                existingTags.push(newTag);
                transaction.update(userRef, { tags: existingTags });
            }
        });
    } catch (error) {
        console.error('Error updating user tags:', error);
    }
}
