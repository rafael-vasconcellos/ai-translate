"use strict";
import { Groq, ClientOptions } from "groq-sdk";
import { Prompt, configs } from "../global/configs";


class GroqChat extends Groq { 
    constructor(init: ClientOptions) {
        super(init)
    }

    sendPrompt(prompt: string, model: string) {
        return this.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: model, 
            temperature: 0.2,
            stream: true
        });
    }
}


export async function GroqHandler(text: string, model_name: string, tag: HTMLTextAreaElement): Promise<string> { 
    const API_KEY = configs().providers?.GroqCloud?.api_key
    if (!text || !tag || !model_name || !API_KEY) { return "" }
    const groq = new GroqChat({
        apiKey: API_KEY,
        dangerouslyAllowBrowser: true, 
    })


    tag.value = ""
    const stream = await groq?.sendPrompt(Prompt(text), model_name) ?? []
    for await (const chunk of stream) { 
        if(chunk.choices[0]?.delta?.content && tag) {
            tag.value += chunk.choices[0]?.delta?.content
        }
    }

    return tag.value

}


export default { 
    provider_name: "GroqCloud",
    about_url: "https://console.groq.com/",
    api_key: undefined,
    models: [
        {
            name: "llama3-70b-8192",
            owned_by: "Meta",
            enabled: undefined
        }, {
            name: "mixtral-8x7b-32768",
            owned_by: "Mistral",
            enabled: undefined
        }, 
    ]
}



