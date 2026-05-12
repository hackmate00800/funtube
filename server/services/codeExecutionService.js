const logger = require('../utils/logger');

const SUPPORTED_LANGUAGES = {
  javascript: { id: 63, name: 'JavaScript', ext: 'js', monaco: 'javascript' },
  python: { id: 71, name: 'Python', ext: 'py', monaco: 'python' },
  java: { id: 62, name: 'Java', ext: 'java', monaco: 'java' },
  cpp: { id: 54, name: 'C++', ext: 'cpp', monaco: 'cpp' },
  c: { id: 50, name: 'C', ext: 'c', monaco: 'c' },
  csharp: { id: 51, name: 'C#', ext: 'cs', monaco: 'csharp' },
  typescript: { id: 74, name: 'TypeScript', ext: 'ts', monaco: 'typescript' },
  go: { id: 60, name: 'Go', ext: 'go', monaco: 'go' },
  rust: { id: 73, name: 'Rust', ext: 'rs', monaco: 'rust' },
  php: { id: 68, name: 'PHP', ext: 'php', monaco: 'php' },
  kotlin: { id: 78, name: 'Kotlin', ext: 'kt', monaco: 'kotlin' },
};

const STARTER_CODES = {
  javascript: `// FunTube Code Playground
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("Developer"));`,
  python: `# FunTube Code Playground
def greet(name):
    return f"Hello, {name}!"
print(greet("Developer"))`,
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, Developer!");
  }
}`,
  typescript: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
console.log(greet("Developer"));`,
  cpp: `#include <iostream>
using namespace std;
int main() {
  cout << "Hello, Developer!" << endl;
  return 0;
}`,
  c: `#include <stdio.h>
int main() {
  printf("Hello, Developer!\\n");
  return 0;
}`,
  csharp: `using System;
class Program {
  static void Main() {
    Console.WriteLine("Hello, Developer!");
  }
}`,
  go: `package main
import "fmt"
func main() {
  fmt.Println("Hello, Developer!")
}`,
  rust: `fn main() {
  println!("Hello, Developer!");
}`,
  php: `<?php
echo "Hello, Developer!\\n";`,
  kotlin: `fun main() {
  println("Hello, Developer!")
}`,
};

const MONACO_LANGS = {};
for (const [key, val] of Object.entries(SUPPORTED_LANGUAGES)) {
  MONACO_LANGS[key] = val.monaco;
}

async function executeWithJudge0(code, language, stdin) {
  const lang = SUPPORTED_LANGUAGES[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  const judge0Url = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
  const judge0Key = process.env.JUDGE0_API_KEY;

  const headers = { 'Content-Type': 'application/json' };
  if (judge0Key) {
    headers['X-RapidAPI-Key'] = judge0Key;
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
  }

  const submitRes = await fetch(`${judge0Url}/submissions?base64_encoded=false&wait=false`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: code,
      language_id: lang.id,
      stdin: stdin || '',
      cpu_time_limit: 5,
      memory_limit: 128000,
    }),
  });

  if (!submitRes.ok) {
    logger.warn(`Judge0 submission failed: ${submitRes.status}`);
    return null;
  }

  const { token } = await submitRes.json();
  let result;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const getRes = await fetch(`${judge0Url}/submissions/${token}?base64_encoded=false`, { headers });
    result = await getRes.json();
    if (result.status?.id >= 3) break;
  }

  if (!result || !result.status) return null;

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    compile_output: result.compile_output || '',
    time: result.time || '0.00',
    memory: result.memory || 0,
    status: result.status?.description || 'Unknown',
    exitCode: result.exit_code,
  };
}

function mockExecution(code, language, stdin) {
  const now = Date.now();
  return {
    stdout: `[Mock] Executing ${language}...\n${stdin ? `Input: ${stdin}\n` : ''}Code executed successfully.\n`,
    stderr: '',
    compile_output: '',
    time: ((Date.now() - now) / 1000).toFixed(2),
    memory: 2048,
    status: 'Finished (Mock)',
    exitCode: 0,
    mock: true,
  };
}

async function executeCode(code, language, stdin) {
  const result = await executeWithJudge0(code, language, stdin);
  return result || mockExecution(code, language, stdin);
}

async function runTests(code, language, testCases) {
  const results = [];
  for (const tc of testCases) {
    const result = await executeCode(code, language, tc.input);
    const passed = result.stdout?.trim() === tc.expectedOutput?.trim();
    results.push({ ...tc, actualOutput: result.stdout?.trim(), passed, error: result.stderr });
  }
  return results;
}

module.exports = { SUPPORTED_LANGUAGES, STARTER_CODES, MONACO_LANGS, executeCode, runTests };
