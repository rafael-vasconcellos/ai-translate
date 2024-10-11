export type CustomSSEInit = { 
    method?: string
    headers?: { 
        Authorization?: string
        "Content-Type"?: string
        Accept?: string // application/json, text/event-stream"
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

export type OpenAIChatInit = CustomSSEInit & { model: string, system_prompt?: string }

export class OpenAIChat extends CustomSSE { 
    readonly model: string
    readonly system_prompt?: string

    constructor(url: string, init: OpenAIChatInit) { 
        super(url, init)
        this.model = init?.model
        this.system_prompt = init?.system_prompt
    }

    async sendPrompt(prompt: string) { 
        if (this.model && prompt) { 
            return this.getStream<any, OpenAIChatCompletionChunk>({ 
                model: this.model,
                messages: [ 
                    { 
                      role: "system", 
                      content: this.system_prompt ?? 'Be as helpful as possible.'
                    }, { 
                      role: "user",
                      content: prompt
                    }
                ],
                stream: true,
                temperature: 0,
                top_p: 0.3,
                frequency_penalty: 0,
                presence_penalty: 0
            })

        }
    }

}

