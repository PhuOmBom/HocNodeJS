require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDatabase = require('../src/config/db');

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const input = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      input.question(question, (answer) => { input.close(); resolve(answer.trim()); });
      return;
    }
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    let answer = '';
    const onData = (buffer) => {
      const key = buffer.toString();
      if (key === '\u0003') process.exit();
      if (key === '\r' || key === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        input.close();
        process.stdout.write('\n');
        resolve(answer);
      } else if (key === '\u007f') {
        answer = answer.slice(0, -1);
      } else {
        answer += key;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  try {
    await connectDatabase();
    const [, , argName, argEmail, argPassword] = process.argv;
    const name = argName || await ask('Admin name: ');
    const email = argEmail || await ask('Admin email: ');
    const password = argPassword || await ask('Admin password: ', true);
    if (!name || !email || password.length < 6) throw new Error('Name and email are required; password must contain at least 6 characters.');
    const existing = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (existing) {
      existing.name = name;
      existing.password = password;
      existing.role = 'admin';
      existing.isBanned = false;
      existing.status = 'offline';
      await existing.save();
      console.log(`Admin role granted to ${existing.email}.`);
    } else {
      const user = await User.create({ name, email, password, role: 'admin' });
      console.log(`Admin account created: ${user.email}.`);
    }
  } catch (error) {
    console.error(`Could not create admin: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();