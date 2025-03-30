# config.py
from autogen_ext.models.azure import AzureAIChatCompletionClient
from autogen_ext.models.ollama import OllamaChatCompletionClient
from autogen_ext.models.openai import OpenAIChatCompletionClient
from azure.core.credentials import AzureKeyCredential
from autogen_core.models import ModelFamily
import os
import httpx
from dotenv import load_dotenv

class modelConfig:

    #Load Environment Variablles
    load_dotenv()

    # Common Model Configurations
    @staticmethod
    def azure_model_config():
        return {
            "json_output": False,
            "function_calling": False,
            "vision": False,
            "family": ModelFamily.ANY,
            "verify_ssl_certs": False
        }
    
    @staticmethod
    def ollama_model_config():
        return {
            "vision": False,
            "function_calling": True,
            "json_output": False,
            "family": "unknown",
        }
    
    # Client Factories
    @classmethod
    def create_azure_client(cls):
        return AzureAIChatCompletionClient(
            model=os.getenv("AZURE_OPENAI_MODEL_NAME"),
            endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            credential=AzureKeyCredential(str(os.getenv("AZURE_OPENAI_KEY"))),
            # api_version=os.getenv("AZURE_OPENAI_API_VERSION"), # Optional
            model_info=cls.azure_model_config(),
            http_client = httpx.Client(verify=True)  # For disabling ssl
        )
    
    @classmethod 
    def create_ollama_deepseek_r1_client(cls):
        return AzureAIChatCompletionClient(
        model=os.getenv("OLLAMA_MODEL_NAME"),
        endpoint=os.getenv("OLLAMA_MODEL_ENDPOINT"),
        credential=AzureKeyCredential("ollama"),
        model_info=cls.ollama_model_config()
        )
        # return OllamaChatCompletionClient(model=os.getenv("OLLAMA_MODEL_NAME"))

    @classmethod
    def create_openrouter_client(cls):
        return OpenAIChatCompletionClient(
            base_url=os.getenv("OPENROUTER_API_BASE_URL"),
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model="openai/o3-mini",
            model_info=cls.ollama_model_config()
        )