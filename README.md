# MoFASA Tools

![Build](https://img.shields.io/github/actions/workflow/status/RahatulAmin/MoFASA/build.yml)
![Version](https://img.shields.io/github/package-json/v/RahatulAmin/MoFASA)
![License](https://img.shields.io/github/license/RahatulAmin/MoFASA)
![Last Commit](https://img.shields.io/github/last-commit/RahatulAmin/MoFASA)
![Issues](https://img.shields.io/github/issues/RahatulAmin/MoFASA)

**MoFASA Tools** is a research-driven application designed to help researchers analyze human-robot interaction (HRI) using the **MOFASA (Modified Factors of Social Appropriateness)** framework. It enables structured analysis of participant behavior by mapping their decisions to the framework’s three central dimensions: **Identity**, **Situation**, and **Definition of the Situation**.

This platform supports the full lifecycle of an HRI study—creating projects, collecting participant responses, and generating LLM-powered behavioral summaries grounded in socio-technical theory.

---

## Core Purpose

The app translates raw participant data into concise summaries using a locally run LLM, providing structured insights about:
- **Social Identity** (e.g., background, experience, self-perception)
- **Contextual Situation** (e.g., environment, time, type of robot)
- **Definition of the Situation** (e.g., uncertainty, social expectations, emotional state)

These insights are crucial for identifying how people perceive and act in robot-embedded environments.

---

## Features

- 🔐 User registration, login, and authentication
- 🧭 Project and participant management interface
- 📝 Structured data input for scenario-based response collection
- 🤖 LLM-generated behavior summaries based on MoFASA factors
- 📊 Easy export and review of participant data
- 🎨 Responsive, clean, and accessible UI

---

## Installation

### Prerequisites
Ensure you have Node.js installed.

### Steps
```bash
git clone https://github.com/RahatulAmin/MoFASA.git
cd MoFASA
npm install

## Running the Application

To start the application in development mode:
```bash
npm run dev
```

To build and start the application in production mode:
```bash
npm run build
npm start
```

## Project Structure

- `src/` - Source code (components, services, store, etc.)
- `public/` - Static assets and HTML
- `styles.css` - Main stylesheet
- `package.json` - Project configuration and dependencies

## Contributing
Contributions are welcome! Feel free to fork the repo, submit a pull request, or open an issue to propose changes.

## If you use MoFASA Tools in your academic work, please cite:
@misc{mofasa2025,
  title = {MoFASA Tools: A Framework-Based Analysis Platform for Human-Robot Interaction},
  author = {Your Name},
  year = {2025},
  url = {https://github.com/RahatulAmin/MoFASA}
}

## License
This project is licensed under the [MIT License](LICENSE).