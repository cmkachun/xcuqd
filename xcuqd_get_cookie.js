/**
 * @fileoverview 合并抓包脚本 - 优化昌宜触发逻辑
 */

const url = $request.url;

// --- 1. 处理猫酷 (Mallcoo) ---
if (url.includes("mallcoo.cn/api/user/User/CheckinV2")) {
    try {
        const body = JSON.parse($request.body);
        if (body.MallID && body.Header?.Token) {
            let accounts = JSON.parse($persistentStore.read("mallcoo_multi_data") || "{}");
            accounts[body.MallID] = body.Header.Token;
            $persistentStore.write(JSON.stringify(accounts), "mallcoo_multi_data");
            $notification.post("猫酷抓包成功", `商场ID: ${body.MallID}`, "Token 已更新");
        }
    } catch (e) {
        console.log("猫酷抓包解析失败");
    }
} 

// --- 2. 处理昌宜云选 (Chamshare) ---
// 仅在进入“每日签到详情页”时触发抓包
else if (url.includes("api.crm.chamshare.cn/daySign/detail")) {
    const token = $request.headers["X-App-Token"] || $request.headers["x-app-token"];
    const marketId = $request.headers["X-App-MarketId"] || $request.headers["x-app-marketid"];
    const version = $request.headers["X-App-Version"] || $request.headers["x-app-version"];
    
    if (token) {
        $persistentStore.write(token, "chamshare_token");
        if (marketId) $persistentStore.write(marketId, "chamshare_marketid");
        if (version) $persistentStore.write(version, "chamshare_version");
        
        const nameMap = {"1": "长泰国际"};
        const mallName = nameMap[marketId] || `ID:${marketId}`;
        
        $notification.post("昌宜云选抓包成功", `当前商场: ${mallName}`, "配置信息已存储");
    }
}

$done({});
