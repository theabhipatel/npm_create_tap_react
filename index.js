#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { execSync } from "child_process";
import degit from "degit";
import path from "path";
import fs from "fs";

const TEMPLATES = [
  {
    name: "React.js with TypeScript (Basic setup)",
    value: "template-react-ts",
    repo: "theabhipatel/template_react_ts",
    description: "React with TypeScript and all Basic setup",
    available: true,
  },
  {
    name: "React.js with Shadcn (Auth setup)",
    value: "template-react-ts-auth",
    repo: "theabhipatel/template_react_ts_auth",
    description:
      "Modern React framework with TypeScript and Authentication setup",
    available: false,
  },
  {
    name: "React.js Dashboard with Shadcn (Auth setup)",
    value: "template-react-ts-dashboard",
    repo: "theabhipatel/template_react_ts_dashboard",
    description:
      "Modern React Dashboard with TypeScript and Authentication setup",
    available: false,
  },
];

const CLI_NAME = "create-tap-react";

async function selectTemplate() {
  const { template } = await inquirer.prompt([
    {
      name: "template",
      type: "list",
      message: "🎨 Select a template:",
      choices: TEMPLATES.map((t) => ({
        name: `${chalk.cyan(t.name)}${
          !t.available ? chalk.red(" - Coming Soon") : ""
        } - ${chalk.gray(t.description)}`,
        value: t.value,
        short: t.name,
      })),
      pageSize: 10,
    },
  ]);

  const selectedTemplate = TEMPLATES.find((t) => t.value === template);

  // Check if template is available
  if (!selectedTemplate.available) {
    console.log(
      chalk.red("\n⚠️  This template is coming soon and not available yet!")
    );
    console.log(chalk.yellow("Please choose another template.\n"));

    // Recursively call selectTemplate to allow user to choose again
    return await selectTemplate();
  }

  return selectedTemplate;
}

async function main() {
  try {
    // Welcome message
    console.log(chalk.cyan.bold(`\n🚀 Welcome to ${CLI_NAME}!\n`));
    console.log(
      chalk.gray("Create modern applications with pre-configured templates\n")
    );

    // Template selection with coming soon handling
    const selectedTemplate = await selectTemplate();

    // Project name input
    const { projectName } = await inquirer.prompt([
      {
        name: "projectName",
        type: "input",
        message: "📝 Project name:",
        default: "my-app",
        validate: (input) => {
          if (!input || input.trim() === "") {
            return "Project name cannot be empty!";
          }

          // Check for invalid characters
          if (!/^[a-zA-Z0-9-_\.]+$/.test(input)) {
            return "Project name can only contain letters, numbers, hyphens, underscores, and dots!";
          }

          return true;
        },
        transformer: (input) => input.trim(),
      },
    ]);

    const targetDir =
      projectName === "." ? process.cwd() : path.resolve(projectName);
    const projectDisplayName =
      projectName === "." ? "current directory" : projectName;

    // Check if directory exists and is not empty
    if (fs.existsSync(targetDir) && projectName !== ".") {
      const files = fs.readdirSync(targetDir);
      if (files.length > 0) {
        const { overwrite } = await inquirer.prompt([
          {
            name: "overwrite",
            type: "confirm",
            message: `Directory ${chalk.yellow(
              projectName
            )} is not empty. Continue anyway?`,
            default: false,
          },
        ]);

        if (!overwrite) {
          console.log(chalk.yellow("\n❌ Operation cancelled"));
          process.exit(0);
        }
      }
    }

    // Create project directory if it doesn't exist
    if (projectName !== "." && !fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    console.log(
      `\n📦 Creating project in ${chalk.cyan(projectDisplayName)}...`
    );
    console.log(`🎨 Using template: ${chalk.green(selectedTemplate.name)}`);

    // Clone template
    const cloneSpinner = ora("📥 Downloading template...").start();

    try {
      const emitter = degit(selectedTemplate.repo, {
        cache: false,
        force: true,
        verbose: false,
      });

      await emitter.clone(targetDir);
      cloneSpinner.succeed("📥 Template downloaded successfully!");
    } catch (error) {
      cloneSpinner.fail("❌ Failed to download template");
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }

    // Install dependencies
    const installSpinner = ora("📦 Installing dependencies...").start();

    try {
      // Check which package manager to use
      let packageManager = "npm";

      if (fs.existsSync(path.join(targetDir, "yarn.lock"))) {
        packageManager = "yarn";
      } else if (fs.existsSync(path.join(targetDir, "pnpm-lock.yaml"))) {
        packageManager = "pnpm";
      }

      const installCommand =
        packageManager === "yarn"
          ? "yarn install"
          : packageManager === "pnpm"
          ? "pnpm install"
          : "npm install";

      execSync(installCommand, {
        stdio: ["ignore", "ignore", "pipe"],
        cwd: targetDir,
      });

      installSpinner.succeed(
        `📦 Dependencies installed with ${packageManager}!`
      );
    } catch (error) {
      installSpinner.fail("⚠️  Failed to install dependencies");
      console.log(
        chalk.yellow("\nYou can install them manually later by running:")
      );
      console.log(
        chalk.cyan(`  cd ${projectName !== "." ? projectName : "."}`)
      );
      console.log(chalk.cyan("  npm install"));
    }

    // Success message
    console.log(chalk.green.bold("\n🎉 Project created successfully!\n"));

    // Next steps
    console.log(chalk.bold("📋 Next steps:"));
    if (projectName !== ".") {
      console.log(`   ${chalk.cyan(`cd ${projectName}`)}`);
    }

    // Read package.json to get available scripts
    try {
      const packageJsonPath = path.join(targetDir, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      if (packageJson.scripts) {
        if (packageJson.scripts.dev) {
          console.log(
            `   ${chalk.cyan("npm run dev")} or ${chalk.cyan("yarn dev")}`
          );
        } else if (packageJson.scripts.start) {
          console.log(
            `   ${chalk.cyan("npm start")} or ${chalk.cyan("yarn start")}`
          );
        }

        if (packageJson.scripts.build) {
          console.log(
            `   ${chalk.cyan("npm run build")} or ${chalk.cyan("yarn build")}`
          );
        }
      }
    } catch (error) {
      console.log(
        `   ${chalk.cyan("npm start")} or ${chalk.cyan("yarn start")}`
      );
    }

    console.log(chalk.gray("\n💡 Happy coding! 🚀\n"));

    // Proper exit
    process.exit(0);
  } catch (error) {
    console.error(chalk.red("\n❌ An unexpected error occurred:"));
    console.error(error);
    process.exit(1);
  }
}

// Handle process interruption
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n👋 Goodbye!"));
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(chalk.yellow("\n\n👋 Process terminated!"));
  process.exit(0);
});

// Run the CLI
main().catch((error) => {
  console.error(chalk.red("❌ Fatal error:"), error);
  process.exit(1);
});
