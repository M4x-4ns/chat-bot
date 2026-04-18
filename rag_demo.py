import os
import faiss
import numpy as np
import json
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
os.environ['HUGGINGFACE_HUB_TOKEN'] = os.environ.get('HUGGINGFACE_HUB_TOKEN', '')

# -----------------------------
# CONFIG
# -----------------------------
DOCS_DIR = "docs"
#CHUNK_OVERLAP = 100
TOP_K = 5

# ใส่ API Key ของตนเอง
genai.configure(api_key="AIzaSyBLZZXCx-Sb_9XgX59gTSqQFrgrgwSrL4Y")

# ใช้ embedding model แบบง่าย
embedding_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

# -----------------------------
# STEP 1: LOAD DOCUMENTS
# -----------------------------
def load_documents(folder_path):
    file_path = os.path.join(folder_path, "thai_movies_final_cleaned.json")

    if not os.path.exists(file_path):
        return[]
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    except Exception as e:
        return []
    
# -----------------------------
# STEP 2: SIMPLE CHUNKING
# -----------------------------
def chunk_text(json_file):
    with open(json_file,'r',encoding='utf-8') as f:
        movies = json.load(f)


# -----------------------------
# STEP 3: PREPARE CHUNKS + METADATA
# -----------------------------
def prepare_chunks(documents):
    chunk_records = []
    for doc in documents:
        title = doc.get('title', 'Unknown')
        imdb_id = doc.get('imdb_id', 'N/A')
        imdb_rating = doc.get('imdb_rating', 'N/A')
        release_year = doc.get('release_year', 'N/A')
        runtime = doc.get('runtime','N/A')
        synopsis = doc.get('synopsis', 'No plot available.')
        reviews = doc.get('reviews') or doc.get('Reviews') or []

        for i, rev in enumerate(reviews):
            context_text = f"Movie: {title} ({release_year}) {runtime}| Official Rating: {imdb_rating}/10 | {rev}"

            chunk_records.append({
                "chunk_id": f"{imdb_id}_{i}",
                "filename": title,
                "text": context_text,
                "metadata": {
                    "imdb_id": imdb_id,
                    "imdb_rating": imdb_rating,
                    "release_year": release_year,
                    "synopsis": synopsis
                }
            })
            
    return chunk_records


# -----------------------------
# STEP 4: CREATE EMBEDDINGS
# -----------------------------
def create_embeddings(chunk_records):
    texts = [c["text"] for c in chunk_records]
    embeddings = embedding_model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    return embeddings

# -----------------------------
# STEP 5: BUILD FAISS INDEX
# -----------------------------

def build_faiss_index(embeddings):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings.astype("float32"))
    return index


# -----------------------------
# STEP 6: RETRIEVE RELEVANT CHUNKS
# -----------------------------
def retrieve(query, index, chunk_records, top_k=3):
    query_embedding = embedding_model.encode([query], convert_to_numpy=True)
    distances, indices = index.search(query_embedding.astype("float32"), top_k)
    
    results = [chunk_records[idx] for idx in indices[0]]
    return results

def save_vector_db(index, chunk_records, index_file="movie_vectors.index", metadata_file="metadata.json"):
    faiss.write_index(index, index_file)
    
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(chunk_records, f, ensure_ascii=False, indent=4)


# -----------------------------
# STEP 7: BUILD PROMPT
# -----------------------------
def build_prompt(query, retrieved_chunks):
    context = "\n\n".join([
        f"[Source: {chunk['filename']}]\n{chunk['text']}"
        for chunk in retrieved_chunks
    ])

    prompt = f"""
You are a helpful assistant.
Answer the question using only the context below.
If the answer is not found in the context, say "ไม่พบข้อมูลในเอกสารที่ให้มา"
Always mention the source filename at the end.

Context:
{context}

Question:
{query}

Answer in Thai:
"""
    return prompt


# -----------------------------
# STEP 8: GENERATE ANSWER WITH LLM
# -----------------------------
def generate_answer(prompt):
    #response = client.chat.completions.create(
        #model= genai.GenerativeModel('gemini-1.5-flash'),
       # messages=[
        #    {"role": "system", "content": "You answer based only on provided context."},
       #     {"role": "user", "content": prompt}
       # ],
       # temperature=0.2
   # )
   # return response.choices[0].message.content
   model = genai.GenerativeModel('gemini-2.5-flash')
   response = model.generate_content(prompt)
   return response.text


# -----------------------------
# MAIN
# -----------------------------
def main():

    print("Loading documents...")
    documents = load_documents(DOCS_DIR)

    print("Preparing chunks...")
    chunk_records = prepare_chunks(documents)

    print("Creating embeddings...")
    embeddings = create_embeddings(chunk_records)

    print("Building index...")
    index = build_faiss_index(embeddings)

    save_vector_db(index, chunk_records)

    print("RAG chatbot ready. Type 'exit' to quit.\n")

    while True:
        query = input("Ask: ")
        if query.lower() == "exit":
            break

        retrieved_chunks = retrieve(query, index, chunk_records, TOP_K)

        print("\nRetrieved sources:")
        for chunk in retrieved_chunks:
            print(f"- {chunk['filename']} | {chunk['chunk_id']}")

        prompt = build_prompt(query, retrieved_chunks)
        answer = generate_answer(prompt)

        print("\nAnswer:")
        print(answer)
        print("-" * 60)


if __name__ == "__main__":
    main()