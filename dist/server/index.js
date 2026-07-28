export default {
  async fetch(request, env, ctx) {
    void ctx;

    const assetResponse = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers
      .get("accept")
      ?.includes("text/html");

    if (
      assetResponse.status !== 404 ||
      request.method !== "GET" ||
      !acceptsHtml
    ) {
      return assetResponse;
    }

    const indexRequest = new Request(
      new URL("/index.html", request.url),
      {
        method: "GET",
        headers: request.headers,
      },
    );

    return env.ASSETS.fetch(indexRequest);
  },
};
