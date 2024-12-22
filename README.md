<a href="https://openrouter.ai/">
  <h1 align="center">OpenRouter Tool Calling Demo</h1>
</a>

<p align="center">
  Multi-model document querying with Pinecone vector embeddings and OpenRouter AI
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a> ·
  <a href="#authors"><strong>Authors</strong></a>
</p>
<br/>

## Features

- [OpenRouter](https://openrouter.ai) integration for multi-model AI responses
- Semantic document search using [Pinecone](https://pinecone.io) vector database
- PDF processing and intelligent chunking
- OpenAI for document embeddings
- Advanced document processing pipeline:
  - PDF parsing and text extraction
  - Smart document chunking with overlap
  - Vector embeddings generation
  - Efficient vector storage and retrieval
- Built with modern stack:
  - [Next.js](https://nextjs.org) App Router
  - React Server Components (RSCs)
  - [Vercel AI SDK](https://sdk.vercel.ai/docs) for streaming responses
  - [shadcn/ui](https://ui.shadcn.com) components
  - [Tailwind CSS](https://tailwindcss.com) styling
- Authentication via [NextAuth.js](https://github.com/nextauthjs/next-auth)
- Session management with [Vercel KV](https://vercel.com/storage/kv)

## Quick Start

1. Clone and install dependencies:

```bash
git clone https://github.com/nlawz/openrouter-pinecone
cd starter
pnpm install
```

2. Set up your environment:

```bash
cp .env.example .env
```

3. Configure your `.env` file with environment variables
4. Start your development server

```bash
pnpm dev
```
5. Go to http://localhost:3000/ 


## Creating a KV Database Instance

Follow the steps outlined in the [quick start guide](https://vercel.com/docs/storage/vercel-kv/quickstart#create-a-kv-database) provided by Vercel. This guide will assist you in creating and configuring your KV database instance on Vercel, enabling your application to interact with it.

Remember to update your environment variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`) in the `.env` file with the appropriate credentials provided during the KV database setup.

## Pinecone Setup
1. Create a Pinecone account at https://www.pinecone.io/
2. Create a new project in Pinecone
3. Create an index with the following settings:
   - Dimensions: 1536 (for OpenAI embeddings, using text-embedding-3-small)
   - Metric: Cosine
4. Copy these values to your `.env`:
   
  ```
  PINECONE_API_KEY= From Pinecone Console → API Keys
  PINECONE_INDEX_NAME= The name you gave your index
  ```

## OpenAI Setup
1. Create an OpenAI account at https://platform.openai.com/
2. Navigate to API Keys section: https://platform.openai.com/api-keys
3. Create a new API key
4. Add to your `.env`:

## Running locally

```bash
pnpm install
pnpm dev
```

## Deploy Your Own

You can deploy your own version of the OpenRouter Tool Calling demo to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-title=Next.js+Chat&demo-description=A+full-featured%2C+hackable+Next.js+AI+chatbot+built+by+Vercel+Labs&demo-url=https%3A%2F%2Fchat.vercel.ai%2F&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F4aVPvWuTmBvzM5cEdRdqeW%2F4234f9baf160f68ffb385a43c3527645%2FCleanShot_2023-06-16_at_17.09.21.png&project-name=Next.js+Chat&repository-name=nextjs-chat&repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-chatbot&from=templates&skippable-integrations=1&env=OPENROUTER_API_KEY%2CAUTH_SECRET&envDescription=How+to+get+these+env+vars&envLink=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&teamCreateStatus=hidden&stores=[{"type":"kv"}])

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Forked from

- [OpenRouter Tool-calling](https://github.com/OpenRouterTeam/tool-calling)
