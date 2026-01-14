/**
 * @fileoverview 合并抓包脚本 (猫酷 + 昌宜)
 */

const url = $request.url;

if (url.includes("mallcoo.cn")) {
    try {
        const body = JSON.parse($request.body);
        const mallId = body.MallID;
        const token = body.Header?.Token;
        if (mallId && token) {
            let mallData = $persistentStore.read("mallcoo_multi_data");
            let accounts = mallData ? JSON.parse(mallData) : {};
            accounts[mallId] = token;
            $persistentStore.write(JSON.stringify(accounts), "mallcoo_multi_data");
            $notification.post("猫酷抓包成功", `商场ID: ${mallId}`, "Token 已更新");
        }
    } catch (e) { console.log("猫酷解析失败"); }
} 
else if (url.includes("chamshare.cn")) {
    const token = $request.headers["X-App-Token"] || $request.headers["x-app-token"];
    if (token) {
        $persistentStore.write(token, "chamshare_token");
        $notification.post("昌宜云选抓包成功", "", "Token 已更新");
    }
}

$done({});
