import asyncio
from autogen_agentchat.agents import AssistantAgent, CodeExecutorAgent, UserProxyAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_agentchat.ui import Console
from autogen_ext.code_executors.local import LocalCommandLineCodeExecutor, Path
from config.modelConfig import modelConfig
from dotenv import load_dotenv

async def main() -> None:
    
    # Load Environment Variablles
    load_dotenv()

    # Create Azure OpenAI model Client 
    az_model_client = modelConfig.create_azure_client()

    # Create Ollama based model Client ========= WIP =========
    # r1_model_client = modelConfig.create_ollama_deepseek_r1_client()

    # Coding Assistant agent which helps in generating code.
    coding_assistant = AssistantAgent(
        name="coding_assistant",
        system_message=Path('prompts/coding_assistant_prompt.txt').read_text(),
        model_client=az_model_client,
    )

    # Coding Executor agent which helps in executing generated code.
    code_executor = CodeExecutorAgent(
        name="code_executor",
        code_executor=LocalCommandLineCodeExecutor(work_dir="code_execution"),
    )

    # Get task input from user
    user_task = input(Path('prompts/initial_system_prompt.txt').read_text())

    # Use input() to get user input from console.
    user_proxy = UserProxyAgent("user_proxy", input_func=input)
      
    # The termination condition is a combination of text termination and max message termination, either of which will cause the chat to terminate.
    termination = TextMentionTermination("BYE") | MaxMessageTermination(10)

    selector_prompt = Path('prompts/selector_prompt.txt').read_text()
    # The group chat will alternate between the assistant and the code executor.
    group_chat = SelectorGroupChat([coding_assistant, code_executor, user_proxy], 
                                    az_model_client,
                                    selector_prompt=selector_prompt,
                                    termination_condition=termination)

    # `run_stream` returns an async generator to stream the intermediate messages.
    stream = group_chat.run_stream(task=user_task)
    # `Console` is a simple UI to display the stream.
    await Console(stream)

asyncio.run(main())