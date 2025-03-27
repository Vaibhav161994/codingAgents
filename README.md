# codingAgents
Code generation and executor agent.

An automated coding agent system built with Microsoft's Autogen framework, configured with `dotenv` for secure environment management.

## Features

- 🤖 Automated task execution with multi-agent collaboration
- 🔐 Environment configuration via `.env` file
- 🛠️ Extensible agent configurations
- 📁 Organized file structure with separate configs and agents

## Installation

1. **Prerequisites**
   - Python 3.8+
   - [Pip](https://pip.pypa.io/en/stable/installation/)

2. **Clone Repository**
   ```bash
   git clone https://github.com/Vaibhav161994/codingAgents.git
   cd codingAgents

3. **Install Dependencies**
   pip install -r requirements.txt

4. **Configuration**
   # API Configuration 
   AZURE_OPENAI_ENDPOINT = your_model_endpoint
   AZURE_OPENAI_KEY = your_api_key

5. **Usage**
   python codingAssistant.py