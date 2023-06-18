import { OpenAI, PromptLayerOpenAI } from 'langchain/llms/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { LLMChain, loadQAChain, VectorDBQAChain, ConversationalRetrievalQAChain, RetrievalQAChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferMemory } from "langchain/memory";
import { resourceLimits } from 'worker_threads';

const broad_prompt =
    `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

    Chat History:
    {chat_history}
    Follow Up Input: {question}
    Standalone question:`;

const detailed_prompt = 

    PromptTemplate.fromTemplate(`You are a helpful AI assistant who is trying to help a user understand the following pieces context better if they have questions about it.
    Don't try answering questions that you don't know the answer too.
    If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.
    Don't make up any answers too and only answer accordingly to the context. 
    If asked something outside the context give a polite response to tell them that you can't answer it.

    {context}

Question: {question}
Helpful answer in markdown:`);

    export const makeChain = (vectorstore: PineconeStore) => {
      const questionGenerator = new LLMChain({
        llm: new OpenAI({ temperature: 0 }),
        prompt: broad_prompt,
      });
    
      const docChain = loadQAChain(
        //change modelName to gpt-4 if you have access to it
        new OpenAI({ temperature: 0, modelName: 'gpt-4-0613' }),
        {
          prompt: detailed_prompt,
        },
      );

      const model = new ChatOpenAI({
        modelName: "gpt-4-0613",
      });

    return ConversationalRetrievalQAChain.fromLLM(
        model,
        vectorstore.asRetriever(),
        {
          returnSourceDocuments: true,
          memory: new BufferMemory({
            memoryKey: "chat_history",
            inputKey: "question", // The key for the input to the chain
            outputKey: "text", // The key for the final conversational output of the chain
            returnMessages: true, // If using with a chat model
          }),
          questionGeneratorChainOptions: {
            llm: model,
            template: broad_prompt
          },
        
        }
    );
    };