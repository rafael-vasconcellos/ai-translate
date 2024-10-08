import { createSignal, JSX } from "solid-js"
import { IModel, IProvider, IProviders, TProviderKeys } from "../providers"
import { GetConfig, SaveConfig, OpenConfigDir, OpenConfigWindow } from "../../modules"



export interface IConfig { 
    wsServerUrl: string
    caching: boolean
    targetLanguage: string
    providers: IProviders
    getM: (provider?: string | null, name?: string | null) => IModel | undefined
}

export type IExtendedModel = IModel & { 
    provider_key: string
    component?: JSX.Element
}

/* declare global {
    interface String {
        replaceAll(search: string | RegExp, replacement: string): string;
    }
}

if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (search: string | RegExp, replacement: string): string {
        // Verifica se o valor de busca é uma expressão regular
        if (search instanceof RegExp) {
            // Se for uma expressão regular, garante que o flag global esteja presente
            if (!search.global) {
                throw new TypeError('A expressão regular deve ter a flag "g"');
            }
            // Usa o método replace com uma função de substituição
            return this.replace(search, replacement);
        } else {
            // Se for uma string, usa o método replace com a string de busca e o valor de substituição
            return this.split(search).join(replacement);
        }
    };
} */


export const [ enabledModels, setEnabledM ] = createSignal<IExtendedModel[] | null>(null)

export const [ configs, setConfigs ] = createSignal<IConfig>({
    wsServerUrl: "",
    caching: true,
    targetLanguage: "English - US",
    providers: {} as any
} as any)

const configPrototype = Object.getPrototypeOf(configs())
configPrototype.getM = function(provider_key?: string, name?: string) { 
    if (provider_key && name) { 
        const provider: Partial<IProvider> = configs().providers[provider_key as TProviderKeys] as IProvider
        const model = provider?.models?.find( (m: IModel) => m.name === name)
        return model
    }
}


export function getEnabled() { 
    const enabled_models: IExtendedModel[] = []
    Object.keys(configs().providers).forEach(provider_key => { 
        const enabled = configs().providers[provider_key as TProviderKeys]?.models?.filter( (m: IModel) => m.enabled)
        .map(m => Object.assign( {...m}, {provider_key}) )
        if (enabled?.length) { enabled_models.push(...enabled) }
    } )

    enabled_models.sort( (b, a) => { 
        if (typeof a.index==="number" && typeof b.index==="number") { return b.index < a.index? -1 : 0 }
        return 0
    } )

    if (enabled_models[0] && enabled_models[0]?.index !== 0) { 
        enabled_models[0].index = 0 
        const { provider_key, name } = enabled_models[0]
        const model = configs().getM(provider_key, name)
        if(model) { model.index = 0 }
    }

    let flag = false
    for (let i=0; i<enabled_models.length-1; i++) { 
        const a = enabled_models[i]; const b = enabled_models[i+1]
        if (typeof a.index==="number" && typeof b.index==="number") { 
            if (b.index > a.index + 1 || b.index === a.index) { 
                b.index = a.index+1 
                const modelB = configs().getM(b.provider_key, b.name) as IModel 
                modelB.index = a.index+1
                if (!flag) { flag = true }
            }
        }
    }

    if (flag) { save_config(configs()) }
    setEnabledM(enabled_models)
    return enabled_models
}




export async function save_config(config: IConfig) { return await SaveConfig(config as never) }

export async function get_config(): Promise<IConfig | void> { 
    let response: unknown
    for (let _=0; _<5; _++) { 
        response = await GetConfig()
        if (!response) { await new Promise(res => setTimeout(res, 60)) }
        else { break }
    }

    return response as never 
}

export async function open_settings() { 
    return await OpenConfigWindow()
}

export async function open_dir() { return await OpenConfigDir() }



export type CustomSSEInit = { 
    method?: string
    headers?: { 
        Authorization?: string
        "Content-Type"?: string
        Accept?: string
        "Accept-Language"?: string
        [key: string]: any
    }
    credentials?: RequestCredentials
}

type IHttpBody = Record<string, any> | string


export class CustomSSE { 
    public url: string | null
    public method: string
    public credentials: CustomSSEInit['credentials']
    public headers: CustomSSEInit['headers'] | undefined
    public request: Promise<Response> | undefined
    private reader?: ReadableStreamDefaultReader<string> | null


    constructor(url: string | null, init?: CustomSSEInit) {
        this.url = url
        this.method = init?.method ?? "POST"
        this.headers = init?.headers ?? {} as never
        this.credentials = init?.credentials

        if (!this.headers?.["Content-Type"]) { this.headers["Content-Type"] = "application/json" }
        //if (!this.headers?.["Accept-Language"]) {  }
    }

    async* getStream<T= unknown, U= unknown>(httpBody: U | IHttpBody, url?: string ): AsyncGenerator<T> { 
        this.sendPostRequest(httpBody as never, url)
        if (!this.reader) { this.reader = await this.getReader() }
        while(true) { 
            const result = await this.reader.read();
            const content = result.value?.replaceAll('data:', "").replaceAll("\r", "").trim().split("\n")
            .filter(message => message).map(message => { 
                try { return JSON.parse(message) }
                catch { console.log(message) }
            })

            if (content) { 
                for (let item of content) { yield item as T }
            }

            if (result.done) { this.reader.releaseLock() ; break }
        }
    }

    close() { 
        this.reader?.cancel().catch(error => console.error("Error canceling reader:", error));
        this.reader = null
    }


    sendPostRequest(httpBody: IHttpBody, url?: string ) { 
        const requestUrl = url ?? this.url
        const { headers, credentials } = this

        if(httpBody && requestUrl) {
            this.request = fetch(requestUrl, { 
                method: "POST",
                credentials,
                headers,
                body: typeof httpBody!=="string"? JSON.stringify(httpBody) : httpBody
            } )
        }

        return this
    }

    private async getReader() { //precisa ser o mesmo reader
        const response = await this.request as Response
        const body = response.body
        if(!response || !body) { throw new Error("Request is empty!") }
        return body.pipeThrough(new TextDecoderStream()).getReader()
    }

}


export interface OpenAIChatCompletionChunk { 
    id: string;                        // Identificador único do chunk
    object: string;                    // Geralmente 'chat.completion.chunk'
    created: number;                   // Timestamp da criação do chunk
    model: string;                     // Nome do modelo usado (ex: "gpt-4-0314")
    choices: Array<{
        index: number;                   // Índice da escolha (geralmente 0 para uma única resposta)
        delta: {
          content?: string;              // Conteúdo parcial da resposta (incremental)
        };
        finish_reason: string | null;    // Motivo para terminar (ex: 'stop' ou null durante o stream)
    }>;
}

export class OpenAIChat extends CustomSSE { 
    readonly model: string

    constructor(url: string, init: CustomSSEInit & { model: string }) { 
        super(url, init)
        this.model = init?.model
    }

    async sendPrompt(prompt: string, systemPrompt: string) { 
        if (this.model) { 
            return this.getStream<any, OpenAIChatCompletionChunk>({ 
                model: this.model,
                messages: [ 
                    { 
                      role: "system", 
                      content: systemPrompt 
                    }, { 
                      role: "user",
                      content: prompt
                    }
                ],
                stream: true
            })

        }
    }

}


