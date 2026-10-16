// Optional AI clean-up for plans the parser can't read. The model rewrites the
// user's text into the plain format parsePlanText understands, so whatever
// comes back is still checked by the deterministic parser.
//
// Uses OpenRouter's OpenAI-compatible chat completions endpoint. The key is
// entered by the user and kept in this browser only; a multi-user version
// should move this call to a server function so the key is never shipped.

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const INSTRUCTIONS = `Rewrite the user's workout plan into exactly this plain-text format and output nothing else:

Mon: <workout title, or "Rest Day">
* Morning Routine (<minutes> min): <move>, <move>, <move>
* <Exercise name>: <sets>x<reps>          e.g. "Goblet Squat: 3x8-10"
* <Exercise A> + <Exercise B> (Superset): <sets>x<reps> each
* <Exercise>: <sets>x <seconds> sec hold
* <Exercise>: <sets>xFailure
* <Any other note as a plain line>

Rules:
- One block per weekday, Mon to Sun, using the three-letter day names.
- Add a "REST DAY" line under rest days.
- Keep the user's exercise names, sets and reps exactly; do not invent exercises.
- Put extra details in parentheses after the exercise name.`;

export async function normaliseWithAI(text, { apiKey, model }) {
  if (!apiKey) throw new Error('Add your OpenRouter API key in Settings first.');
  if (!model) throw new Error('Choose an OpenRouter model in Settings first.');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: INSTRUCTIONS },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenRouter returned ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned an empty reply.');
  return content.replace(/^```[a-z]*\n?|```$/gim, '').trim();
}
