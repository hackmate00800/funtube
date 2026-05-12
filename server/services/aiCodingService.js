const OpenAI = require('openai');
const logger = require('../utils/logger');

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function callAI(messages) {
  const client = getClient();
  if (!client) return fallbackAI(messages);
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert coding assistant integrated into a code playground. Be concise and practical.' },
        ...messages,
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });
    return res.choices[0]?.message?.content || 'No response from AI.';
  } catch (err) {
    logger.error('OpenAI call failed:', err.message);
    return fallbackAI(messages);
  }
}

function fallbackAI(messages) {
  const lastMsg = messages[messages.length - 1]?.content || '';
  if (lastMsg.includes('debug') || lastMsg.includes('error') || lastMsg.includes('fix'))
    return '**Debugging Tips:**\n1. Check for syntax errors (missing brackets, semicolons)\n2. Verify variable names are spelled correctly\n3. Ensure functions are defined before use\n4. Add console.log/print statements to trace values';
  if (lastMsg.includes('optimize'))
    return '**Optimization Suggestions:**\n1. Use appropriate data structures (Map/Set for lookups)\n2. Avoid nested loops when possible\n3. Cache computed values\n4. Use early returns to reduce indentation';
  if (lastMsg.includes('explain'))
    return '**Code Explanation:**\nThis code defines functions and logic to accomplish a specific task. Key concepts include variables, control flow, and function composition. Review each section for its specific purpose.';
  if (lastMsg.includes('convert') || lastMsg.includes('translate'))
    return '**Code Conversion Note:**\nTo convert between languages, identify the core logic and data structures, then find equivalent syntax in the target language. The key patterns to translate are: loops, conditionals, function definitions, and data structure operations.';
  return '**AI Assistant:** I can help debug errors, optimize code, explain logic, convert between languages, and generate unit tests. Select an action above to get started.';
}

async function debugCode(code, language, error) {
  return callAI([
    { role: 'user', content: `Debug this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nError: ${error}\n\nExplain the error and suggest a fix.` },
  ]);
}

async function optimizeCode(code, language) {
  return callAI([
    { role: 'user', content: `Optimize this ${language} code for performance and readability:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide the optimized version with explanation of changes.` },
  ]);
}

async function explainCode(code, language) {
  return callAI([
    { role: 'user', content: `Explain this ${language} code line-by-line:\n\`\`\`${language}\n${code}\n\`\`\`\n\nExplain what it does, key concepts, and any important patterns.` },
  ]);
}

async function convertCode(code, fromLang, toLang) {
  return callAI([
    { role: 'user', content: `Convert this ${fromLang} code to ${toLang}:\n\`\`\`${fromLang}\n${code}\n\`\`\`\n\nProvide the equivalent ${toLang} code only, with brief notes on changes.` },
  ]);
}

async function generateUnitTests(code, language) {
  return callAI([
    { role: 'user', content: `Generate unit tests for this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide test cases covering normal cases, edge cases, and error conditions.` },
  ]);
}

async function generateChallenge(topic, difficulty) {
  return callAI([
    { role: 'user', content: `Generate a coding challenge about "${topic}" at ${difficulty} difficulty. Include: title, description, starter code template, and 3 test cases with expected outputs. Format as JSON with keys: title, description, starterCode, testCases (array of {input, expectedOutput}).` },
  ]);
}

module.exports = { debugCode, optimizeCode, explainCode, convertCode, generateUnitTests, generateChallenge };
