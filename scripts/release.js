#!/usr/bin/env node

/**
 * Production Release Script
 *
 * Guides through the production release process:
 * 1. Verifies prerequisites (clean git, correct branch)
 * 2. Checks last preview build succeeded
 * 3. Prompts for new version number
 * 4. Updates package.json and app.json
 * 5. Commits version bump
 * 6. Triggers production build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');
const APP_JSON = path.join(ROOT_DIR, 'app.json');

const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', cwd: ROOT_DIR, ...options }).trim();
  } catch (error) {
    if (options.ignoreError) return null;
    throw error;
  }
}

function log(message, type = 'info') {
  const prefix = {
    info: colors.blue('ℹ'),
    success: colors.green('✓'),
    warning: colors.yellow('⚠'),
    error: colors.red('✗'),
  };
  console.log(`${prefix[type] || ''} ${message}`);
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function suggestVersions(current) {
  const { major, minor, patch } = parseVersion(current);
  return {
    patch: `${major}.${minor}.${patch + 1}`,
    minor: `${major}.${minor + 1}.0`,
    major: `${major + 1}.0.0`,
  };
}

function isValidVersion(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

async function checkPrerequisites() {
  console.log('\n' + colors.bold('🔍 Checking prerequisites...\n'));

  // Check git is clean
  const status = exec('git status --porcelain');
  if (status) {
    log('Working directory has uncommitted changes:', 'error');
    console.log(status);
    log('Please commit or stash changes before releasing.', 'warning');
    process.exit(1);
  }
  log('Working directory is clean', 'success');

  // Check we're on main branch
  const branch = exec('git branch --show-current');
  if (branch !== 'main') {
    log(`Currently on branch '${branch}', expected 'main'`, 'error');
    const answer = await prompt('Continue anyway? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      process.exit(1);
    }
  } else {
    log('On main branch', 'success');
  }

  // Check main is up to date with origin
  exec('git fetch origin main', { ignoreError: true });
  const behind = exec('git rev-list HEAD..origin/main --count', { ignoreError: true });
  if (behind && parseInt(behind) > 0) {
    log(`Local main is ${behind} commit(s) behind origin/main`, 'warning');
    const answer = await prompt('Pull latest changes? (Y/n): ');
    if (answer.toLowerCase() !== 'n') {
      exec('git pull origin main');
      log('Pulled latest changes', 'success');
    }
  } else {
    log('Branch is up to date with origin', 'success');
  }
}

async function checkLastBuild() {
  console.log('\n' + colors.bold('🏗️  Checking last preview build...\n'));

  try {
    const buildsJson = exec('eas build:list --platform ios --profile preview --limit 1 --non-interactive --json');
    const builds = JSON.parse(buildsJson);

    if (builds.length === 0) {
      log('No preview builds found', 'warning');
      const answer = await prompt('Continue without verified preview build? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        process.exit(1);
      }
      return;
    }

    const lastBuild = builds[0];
    const status = lastBuild.status;
    const buildUrl = lastBuild.buildDetailsPageUrl;

    if (status === 'FINISHED') {
      log(`Last preview build: ${colors.green('SUCCESS')}`, 'success');
      log(`Build URL: ${buildUrl}`, 'info');
    } else if (status === 'IN_PROGRESS' || status === 'PENDING') {
      log(`Last preview build is still ${status}`, 'warning');
      log(`Build URL: ${buildUrl}`, 'info');
      const answer = await prompt('Continue anyway? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        process.exit(1);
      }
    } else {
      log(`Last preview build: ${colors.red(status)}`, 'error');
      log(`Build URL: ${buildUrl}`, 'info');
      const answer = await prompt('Continue despite failed build? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        process.exit(1);
      }
    }
  } catch (error) {
    log('Could not check EAS builds (are you logged in?)', 'warning');
    log('Run: eas login', 'info');
    const answer = await prompt('Continue without build verification? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }
}

async function promptVersion() {
  console.log('\n' + colors.bold('📦 Version Update\n'));

  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const currentVersion = packageJson.version;
  const suggestions = suggestVersions(currentVersion);

  console.log(`Current version: ${colors.bold(currentVersion)}\n`);
  console.log('Suggested versions:');
  console.log(`  1) ${suggestions.patch} ${colors.yellow('(patch - bug fixes)')}`);
  console.log(`  2) ${suggestions.minor} ${colors.yellow('(minor - new features)')}`);
  console.log(`  3) ${suggestions.major} ${colors.yellow('(major - breaking changes)')}`);
  console.log(`  4) Custom version\n`);

  const choice = await prompt('Select version [1-4] or enter version directly: ');

  let newVersion;
  switch (choice) {
    case '1':
      newVersion = suggestions.patch;
      break;
    case '2':
      newVersion = suggestions.minor;
      break;
    case '3':
      newVersion = suggestions.major;
      break;
    case '4':
      newVersion = await prompt('Enter custom version (x.y.z): ');
      break;
    default:
      // User entered version directly
      newVersion = choice;
  }

  if (!isValidVersion(newVersion)) {
    log(`Invalid version format: ${newVersion}`, 'error');
    log('Version must be in format x.y.z (e.g., 1.2.3)', 'info');
    process.exit(1);
  }

  return newVersion;
}

function updateVersionFiles(newVersion) {
  console.log('\n' + colors.bold('📝 Updating version files...\n'));

  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const oldVersion = packageJson.version;
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n');
  log(`package.json: ${oldVersion} → ${newVersion}`, 'success');

  // Update app.json
  const appJson = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  appJson.expo.version = newVersion;
  fs.writeFileSync(APP_JSON, JSON.stringify(appJson, null, 2) + '\n');
  log(`app.json: ${oldVersion} → ${newVersion}`, 'success');

  return oldVersion;
}

function commitVersionBump(newVersion) {
  console.log('\n' + colors.bold('📤 Committing version bump...\n'));

  exec('git add package.json app.json');
  exec(`git commit -m "chore: bump version to ${newVersion}"`);
  log(`Created commit: chore: bump version to ${newVersion}`, 'success');

  exec('git push origin main');
  log('Pushed to origin/main', 'success');
}

async function triggerBuild() {
  console.log('\n' + colors.bold('🚀 Production Build\n'));

  console.log('How would you like to trigger the production build?\n');
  console.log('  1) EAS CLI (build now)');
  console.log('  2) GitHub Actions (via workflow dispatch)');
  console.log('  3) Skip (trigger manually later)\n');

  const choice = await prompt('Select option [1-3]: ');

  switch (choice) {
    case '1': {
      const submit = await prompt('Also submit to App Store after build? (y/N): ');
      console.log('\n' + colors.bold('Starting production build...\n'));

      try {
        execSync('eas build --platform ios --profile production --non-interactive', {
          cwd: ROOT_DIR,
          stdio: 'inherit',
        });

        if (submit.toLowerCase() === 'y') {
          console.log('\n' + colors.bold('Submitting to App Store...\n'));
          execSync('eas submit --platform ios --profile production --non-interactive', {
            cwd: ROOT_DIR,
            stdio: 'inherit',
          });
        }
      } catch (error) {
        log('Build/submit failed', 'error');
        process.exit(1);
      }
      break;
    }
    case '2': {
      log('To trigger via GitHub Actions:', 'info');
      console.log('\n  1. Go to: https://github.com/booma-stephan/mycalmbaby/actions');
      console.log('  2. Select "Production Release" workflow');
      console.log('  3. Click "Run workflow"');
      console.log('  4. Choose whether to submit to App Store\n');
      break;
    }
    case '3':
      log('Skipped. Run manually when ready:', 'info');
      console.log('\n  eas build --platform ios --profile production\n');
      break;
    default:
      log('Invalid option, skipping build', 'warning');
  }
}

async function main() {
  console.log(colors.bold('\n🍼 My Calm Baby - Production Release\n'));
  console.log('═'.repeat(45));

  try {
    await checkPrerequisites();
    await checkLastBuild();

    const newVersion = await promptVersion();

    console.log(`\nThis will release version ${colors.bold(newVersion)}`);
    const confirm = await prompt('Continue? (Y/n): ');
    if (confirm.toLowerCase() === 'n') {
      log('Release cancelled', 'warning');
      process.exit(0);
    }

    updateVersionFiles(newVersion);
    commitVersionBump(newVersion);
    await triggerBuild();

    console.log('\n' + '═'.repeat(45));
    console.log(colors.bold(colors.green('\n✓ Release process complete!\n')));
  } catch (error) {
    console.error('\n' + colors.red('Release failed:'), error.message);
    process.exit(1);
  }
}

main();
