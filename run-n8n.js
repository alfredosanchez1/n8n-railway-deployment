#!/usr/bin/env node

// Wrapper script to run n8n
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('🔧 N8N WRAPPER: Installing and starting n8n...');

async function installAndRunN8n() {
  try {
    // Install n8n globally
    console.log('📦 Installing n8n...');
    await execAsync('npm install -g n8n@latest');
    console.log('✅ n8n installed successfully');

    // Configure n8n environment
    const N8N_PORT = process.env.N8N_PORT || 5678;
    process.env.N8N_PORT = N8N_PORT;
    process.env.N8N_HOST = '0.0.0.0';

    console.log(`🔧 N8N WRAPPER: Port ${N8N_PORT}, Host 0.0.0.0`);

    // Start n8n
    const n8nProcess = spawn('n8n', ['start'], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    n8nProcess.on('exit', (code) => {
      console.log(`🔧 N8N WRAPPER: n8n exited with code ${code}`);
      process.exit(code);
    });

    // Handle termination
    process.on('SIGTERM', () => {
      console.log('🔧 N8N WRAPPER: Received SIGTERM');
      n8nProcess.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('🔧 N8N WRAPPER: Received SIGINT');
      n8nProcess.kill('SIGINT');
    });

  } catch (error) {
    console.error('❌ Failed to install n8n:', error);
    process.exit(1);
  }
}

installAndRunN8n();
