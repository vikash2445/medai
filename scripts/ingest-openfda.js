import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import 'dotenv/config';

// Custom embedding function
class GeminiEmbeddingFunction {
  constructor(apiKey) {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'text-embedding-004',
    });
  }
  async generate(texts) {
    return this.embeddings.embedDocuments(texts);
  }
}

const client = new ChromaClient();
const collectionName = 'medical_knowledge';

async function fetchDrugLabels() {
  const url = 'https://api.fda.gov/drug/label.json?limit=1000';
  const res = await fetch(url);
  const data = await res.json();
  return data.results;
}

function extractTextFromLabel(label) {
  const parts = [
    `Drug: ${label.openfda?.brand_name?.[0] || 'Unknown'}`,
    `Generic: ${label.openfda?.generic_name?.[0] || 'Unknown'}`,
    `Indications: ${label.indications_and_usage?.[0] || 'Not specified'}`,
    `Warnings: ${label.warnings?.[0] || 'None'}`,
    `Dosage: ${label.dosage_and_administration?.[0] || 'Not specified'}`,
    `Active Ingredient: ${label.active_ingredient?.[0] || 'Unknown'}`,
  ];
  return parts.join('\n');
}

async function main() {
  console.log('📥 Fetching drug labels from OpenFDA...');
  const labels = await fetchDrugLabels();
  console.log(`✅ Fetched ${labels.length} labels`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const documents = [];
  for (const label of labels) {
    const text = extractTextFromLabel(label);
    const chunks = await splitter.splitText(text);
    for (const chunk of chunks) {
      documents.push({
        pageContent: chunk,
        metadata: {
          drugName: label.openfda?.brand_name?.[0] || 'Unknown',
          genericName: label.openfda?.generic_name?.[0] || 'Unknown',
        },
      });
    }
  }

  console.log(`✂️ Split into ${documents.length} chunks`);

  const embedFunction = new GeminiEmbeddingFunction(process.env.GEMINI_API_KEY);
  // Ensure collection is cleared or created
  try {
    await client.deleteCollection({ name: collectionName });
  } catch (e) {}
  const collection = await client.createCollection({
    name: collectionName,
    embeddingFunction: embedFunction,
  });

  const batchSize = 100;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    await collection.add({
      ids: batch.map((_, idx) => `${i + idx}`),
      documents: batch.map(d => d.pageContent),
      metadatas: batch.map(d => d.metadata),
    });
    console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}`);
  }

  console.log('🎉 Ingestion complete!');
}

main().catch(console.error);