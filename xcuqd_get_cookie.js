const url = $request.url;

if (url.includes("mallcoo.cn/api/user/User/CheckinV2")) {
    try {
        const body = JSON.parse($request.body);
        if (body.MallID && body.Header?.Token) {
            let accounts = JSON.parse($persistentStore.read("mallcoo_multi_data") || "{}");
            accounts[body.MallID] = body.Header.Token;
            $persistentStore.write(JSON.stringify(accounts), "mallcoo_multi_data");
            const nameMap = {"10540": "金桥国际", "12206": "汇智国际"};
            $notification.post("猫酷抓包成功", `商场: ${nameMap[body.MallID] || body.MallID}`, "Token 已更新");
        }
    } catch (e) {}
} 
else if (url.includes("api.crm.chamshare.cn/daySign/detail")) {
    const token = $request.headers["X-App-Token"] || $request.headers["x-app-token"];
    const marketId = $request.headers["X-App-MarketId"] || $request.headers["x-app-marketid"];
    const version = $request.headers["X-App-Version"] || $request.headers["x-app-version"];
    
    if (token) {
        $persistentStore.write(token, "chamshare_token");
        if (marketId) $persistentStore.write(marketId, "chamshare_marketid");
        if (version) $persistentStore.write(version, "chamshare_version");
        const nameMap = {"1": "长泰国际"};
        $notification.post("昌宜云选抓包成功", `当前商场: ${nameMap[marketId] || marketId}`, "配置信息已存储");
    }
}
$done({});
