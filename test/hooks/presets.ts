export const GETRequest = (url: string, init?: RequestInit) => {
    return new Request(`https://example.com${url}`, { method: "GET", ...init })
}

export const POSTRequest = (url: string, body: unknown, init?: RequestInit) => {
    return new Request(`https://example.com${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        ...init,
    })
}
