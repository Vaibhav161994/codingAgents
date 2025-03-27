import asyncio
import httpx
import os
from autogen_agentchat.agents import AssistantAgent, CodeExecutorAgent, UserProxyAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_agentchat.ui import Console
from autogen_core.models import ModelFamily
from autogen_ext.code_executors.local import LocalCommandLineCodeExecutor
from autogen_ext.models.azure import AzureAIChatCompletionClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

async def main() -> None:
    
    # Load Environment Variablles
    load_dotenv()

    az_model_client = AzureAIChatCompletionClient(
    model="gpt-4o",
    # api_version="2024-11-20", Optional
    endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    credential=AzureKeyCredential(str(os.getenv("AZURE_OPENAI_KEY"))), # For key-based authentication.
    model_info={
        "json_output": False,
        "function_calling": False,
        "vision": False,
        "family": ModelFamily.GPT_4O,
        "verify_ssl_certs": False
    },
    http_client = httpx.Client(verify=False)
    )

    assistant = AssistantAgent(
        name="assistant",
        system_message="You are a helpful assistant. Write all code in python. Reply only 'TERMINATE' if the task is done.",
        model_client=az_model_client,
    )

    code_executor = CodeExecutorAgent(
        name="code_executor",
        code_executor=LocalCommandLineCodeExecutor(work_dir="code_execution"),
    )

    # Get task input from user
    user_task = input("I'm a Coding Assistant that will help you around various Coding Tasks. Please enter your request: ")

    # Use input() to get user input from console.
    user_proxy = UserProxyAgent("user_proxy", input_func=input)
      
    # The termination condition is a combination of text termination and max message termination, either of which will cause the chat to terminate.
    termination = TextMentionTermination("APPROVE") | MaxMessageTermination(10)

    # The group chat will alternate between the assistant and the code executor.
    group_chat = SelectorGroupChat([assistant, code_executor, user_proxy], az_model_client, termination_condition=termination)

    # `run_stream` returns an async generator to stream the intermediate messages.
    stream = group_chat.run_stream(task=user_task)
    # `Console` is a simple UI to display the stream.
    await Console(stream)

asyncio.run(main())