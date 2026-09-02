import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: 'Hello, this is a connection test. Reply with OK.' }] }]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log(`Status for ${modelName}:`, res.status);
    console.log(`Response for ${modelName}:`, text.substring(0, 300));
  } catch (err) {
    console.error(`Error for ${modelName}:`, err.message);
  }
}

async function run() {
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment!');
    return;
  }
  await testModel('gemini-3.5-flash');
  console.log('\n----------------------------------------\n');
  await testModel('gemini-1.5-flash');
}
run();
