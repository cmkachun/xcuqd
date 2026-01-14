const url = $request.url;

if (url.includes("mallcoo.cn")) {
    try {
        const body = JSON.parse($request.body);
        if (body.MallID && body.Header?.Token) {
            let accounts = JSON.parse($persistentStore.read("mallcoo_multi_data") || "{}");
            accounts[body.MallID] = body.Header.Token;
            $persistentStore.write(JSON.stringify(accounts), "mallcoo_multi_data");
            $notification.post("猫酷抓包成功", `商场ID: ${body.MallID}`, "");
        }
    } catch (e) {}
} 
else if (url.includes("chamshare.cn")) {
    const token = $request.headers["X-App-Token"] || $request.headers["x-app-token"];
    const marketId = $request.headers["X-App-MarketId"] || $request.headers["x-app-marketid"];
    
    if (token) {
        $persistentStore.write(token, "chamshare_token");
        if (marketId) $persistentStore.write(marketId, "chamshare_marketid");
        $notification.post("昌宜云选抓包成功", "", marketId ? `已获取 MarketId: ${marketId}` : "Token 已更新");
    }
}
$done({});
