const url = $request.url;

if (url.includes("mallcoo.cn")) {
    try {
        const body = JSON.parse($request.body);
        if (body.MallID && body.Header?.Token) {
            let accounts = JSON.parse($persistentStore.read("mallcoo_multi_data") || "{}");
            accounts[body.MallID] = body.Header.Token;
            $persistentStore.write(JSON.stringify(accounts), "mallcoo_multi_data");
            $notification.post("猫酷抓包成功", `商场ID: ${body.MallID}`, "数据已更新");
        }
    } catch (e) {}
} 
else if (url.includes("chamshare.cn")) {
    const token = $request.headers["X-App-Token"] || $request.headers["x-app-token"];
    const marketId = $request.headers["X-App-MarketId"] || $request.headers["x-app-marketid"];
    const version = $request.headers["X-App-Version"] || $request.headers["x-app-version"];
    
    if (token) {
        $persistentStore.write(token, "chamshare_token");
        if (marketId) $persistentStore.write(marketId, "chamshare_marketid");
        if (version) $persistentStore.write(version, "chamshare_version");
        $notification.post("昌宜云选抓包成功", "", `MarketId: ${marketId || '保持现状'}`);
    }
}
$done({});
