import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';


const filePath = "docs";

export const run =async () => {
    try{
        // loads the pdf 
        const directoryLoader = new DirectoryLoader(filePath, {
            '.pdf': (path) => new CustomPDFLoader(path),
        });

        const rawDocs = await directoryLoader.load();

        // splits the text into chunks to be sent 
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize:1000,
            chunkOverlap:200,
        });

        const docs = await textSplitter.splitDocuments(rawDocs);
        console.log("Splitting the doc");

        console.log("Creating the vector store");
        const embeddings = new OpenAIEmbeddings();
        const index = pinecone.Index(PINECONE_INDEX_NAME);  

        await PineconeStore.fromDocuments(docs, embeddings, {
            pineconeIndex: index,
            namespace: PINECONE_NAME_SPACE,
            textKey: 'text',
        });
    }
    catch (error){
        console.log("error: ", error);
        throw new Error("Failed to load the data");
    }
};

(async () => {
    await run();
    console.log('get data completed');  
  })();