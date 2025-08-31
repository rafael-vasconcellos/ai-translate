import { configs } from "../global/configs";
import { OpenAIChat } from "../global/lib";
import { systemPrompt, userPrompt } from "../global/text";



export async function OpenRouterHandler(text: string, model_name: string, tag: HTMLTextAreaElement) { 
    const API_KEY = configs().providers?.OpenRouter?.api_key
    if (!text || !tag || !model_name || !API_KEY) { return "" }
    const client = new OpenAIChat("https://openrouter.ai/api/v1/chat/completions", { 
        model: model_name,
        system_prompt: systemPrompt,
        headers: { Authorization: "Bearer "+API_KEY }
    })

    tag.value = ""
    const stream = await client.sendPrompt(userPrompt({ text }))
    if (stream) { 
        for await (const chunk of stream) { 
          const text = chunk?.choices?.[0]?.delta?.content;
          if (text) { tag.value += text; }
          else if (chunk?.error) { tag.value = chunk.error?.message }
          else if (chunk) { console.log(chunk) }
        }
    }

    return tag.value
}


export default { 
    provider_name: "OpenRouter AI",
    about_url: "https://openrouter.ai/settings/keys",
    api_key: undefined,
    models: [ 
        { 
          name: "meta-llama/llama-3-70b-instruct",
          owned_by: "meta-llama",
          auto_fetch: false
        }, { 
          name: "meta-llama/llama-3.1-70b-instruct:free",
          owned_by: "meta-llama",
          auto_fetch: false
        }, { 
          name: "meta-llama/llama-3.1-405b-instruct:free",
          owned_by: "meta-llama",
          auto_fetch: false
        }, { 
          name: "meta-llama/llama-3.2-90b-vision-instruct",
          owned_by: "meta-llama",
          auto_fetch: false
        }, { 
          name: "meta-llama/llama-3.3-70b-instruct",
          owned_by: "meta-llama",
          auto_fetch: false
        }, { 
          name: "cohere/command-r-plus",
          owned_by: "cohere",
          auto_fetch: false
        }, { 
          name: "cohere/command-r-plus-08-2024",
          owned_by: "cohere",
          auto_fetch: false
        }, { 
          name: "qwen/qwq-32b:free",
          owned_by: "Qwen",
          auto_fetch: false
        }, { 
          name: "qwen/qwen3-235b-a22b:free",
          owned_by: "Qwen",
          auto_fetch: false
        }, { 
          name: "qwen/qwen-2.5-72b-instruct:free",
          owned_by: "Qwen",
          auto_fetch: false
        }, { 
          name: "qwen/qwen2.5-vl-72b-instruct:free",
          owned_by: "Qwen",
          auto_fetch: false
        }, { 
          name: "moonshotai/kimi-k2:free",
          owned_by: "Moonshot AI",
          auto_fetch: false
        }, { 
          name: "deepseek/deepseek-chat-v2.5",
          owned_by: "DeepSeek AI",
          auto_fetch: false
        }, { 
          name: "deepseek/deepseek-r1:free",
          owned_by: "DeepSeek AI",
          auto_fetch: false
        }, { 
          name: "deepseek/deepseek-r1-0528:free",
          owned_by: "DeepSeek AI",
          auto_fetch: false
        }, { 
          name: "deepseek/deepseek-r1-zero:free",
          owned_by: "DeepSeek AI",
          auto_fetch: false
        }, { 
          name: "deepseek/deepseek-chat:free",
          owned_by: "DeepSeek AI",
          auto_fetch: false
        }, { 
          name: "deepseek/deepseek-chat-v3-0324:free",
          owned_by: "DeepSeek AI",
          auto_fetch: false
        }, { 
          name: "deepseek/deepseek-chat-v3.1:free",
          owned_by: "DeepSeek AI",
          auto_fetch: false
        }, { 
          name: "openai/gpt-oss-20b:free",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/gpt-oss-120b:free",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/gpt-3.5-turbo",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/gpt-3.5-turbo-1106",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/gpt-3.5-turbo-instruct",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/gpt-4o-mini",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/gpt-4o-mini-2024-07-18",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/gpt-4o",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/gpt-4.1-mini",
          owned_by: "openai",
          auto_fetch: false
        }, /*{ 
          name: "openai/o1-mini",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "openai/o1-mini-2024-09-12",
          owned_by: "openai",
          auto_fetch: false
        }, { 
          name: "anthropic/claude-3-sonnet",
          owned_by: "anthropic",
          auto_fetch: false
        }, { 
          name: "anthropic/claude-3.5-sonnet",
          owned_by: "anthropic",
          auto_fetch: false
        }, { 
          name: "google/gemini-2.5-flash",
          owned_by: "Google",
          auto_fetch: false
        }, { 
          name: "google/gemini-2.5-flash-lite-preview-06-17",
          owned_by: "Google",
          auto_fetch: false
        }, { 
          name: "google/gemini-2.5-pro",
          owned_by: "Google",
          auto_fetch: false
        },*/ { 
          name: "google/gemma-3-27b-it:free",
          owned_by: "Google",
          auto_fetch: false
        }, 
    ]
}

/*
    openai/gpt-4.1
    z-ai/glm-4.5
    
*/




/* import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: $OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": $YOUR_SITE_URL, // Optional, for including your app on openrouter.ai rankings.
    "X-Title": $YOUR_SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
  }
})

export async function main() {
  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.2-90b-vision-instruct",
    messages: [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What's in this image?"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
            }
          }
        ]
      }
    ]
  })

  console.log(completion.choices[0].message)
}
 */