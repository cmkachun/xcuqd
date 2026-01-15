/**
 * @name 商场云选合集 (长泰兼容增强版)
 * @author cmkachun
 */

const nameMap = {
    "10540": "金桥国际",
    "12206": "汇智国际",
    "1": "长泰国际"
};

let summary = "";

const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");
const chamMarketId = $persistentStore.read("chamshare_marketid") || "1";
const chamVersion = $persistentStore.read("chamshare_version") || "2.1.1";

function main() {
    console.log("--- 1. 数据状态检查 ---");
    console.log(`昌宜Token: ${chamToken ? "✅" : "❌"}`);
    console.log(`猫酷Data: ${mallData ? "✅" : "❌"}`);
    
    runChamshare(() => {
        runMallcoo(() => {
            finalize();
        });
    });
}

// --- 昌宜云选 (长泰国际) 兼容性重构 ---
function runChamshare(callback) {
    if (!chamToken) {
        callback();
        return;
    }
    const name = nameMap[chamMarketId] || `昌宜ID[${chamMarketId}]`;
    
    const request = {
        url: `https://api.crm.chamshare.cn/daySign`,
        method: `POST`,
        headers: {
            'X-App-Token': chamToken,
            'X-App-MarketId': chamMarketId.toString(),
            'X-App-Version': chamVersion,
            'X-App-Platform': 'wxapp',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.54(0x1800362b) NetType/WIFI Language/zh_CN',
            'Referer': 'https://servicewechat.com/wx2ab4eda1b91e0933/59/page-frame.html'
        },
        // 尝试发送一个空的 JSON 字符串，部分服务器对完全空的 body 会报错误请求
        body: "{}" 
    };
    
    $httpClient.post(request, (err, resp, data) => {
        try {
            if (err) {
                console.log(`【长泰】网络错误: ${err}`);
                summary += `【${name}】❌ 网络错误\n`;
            } else {
                console.log(`【长泰】原始响应: ${data}`);
                const res = JSON.parse(data);
                
                // 昌宜系统逻辑：0/200 成功，1101 已签到，401/403/40001 Token失效
                if (res.code === 0 || res.code === 200) {
                    summary += `【${name}】✅ 签到成功\n`;
                } else if (res.code === 1101 || (res.msg && (res.msg.includes("已签到") || res.msg.includes("重复")))) {
                    summary += `【${name}】ℹ️ 今日已完成\n`;
                } else if (res.code === 401 || res.code === 403 || res.code === 40001) {
                    summary += `【${name}】⚠️ Token 已失效，请重抓\n`;
                } else {
                    summary += `【${name}】❌ ${res.msg || "请求错误"}\n`;
                }
            }
        } catch (e) {
            // 如果解析 JSON 失败，通常是返回了 HTML 报错页
            console.log(`【长泰】解析失败: ${data}`);
            summary += `【${name}】❌ 格式错误\n`;
        }
        callback();
    });
}

// --- 猫酷商场 (金桥、汇智) ---
function runMallcoo(callback) {
    if (!mallData) {
        callback();
        return;
    }
    const accounts = JSON.parse(mallData);
    const ids = Object.keys(accounts);
    let mcProcessed = 0;
    if (ids.length === 0) { callback(); return; }

    ids.forEach(id => {
        const name = nameMap[id] || `猫酷ID[${id}]`;
        $httpClient.post({
            url: `https://m.mallcoo.cn/api/user/User/CheckinV2`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "MallID": Number(id), "Header": { "Token": accounts[id] } })
        }, (err, resp, data) => {
            mcProcessed++;
            try {
                if (!err) {
                    const res = JSON.parse(data);
                    if (res.s === 1) summary += `【${name}】✅ 签到成功\n`;
                    else if (res.m === 2054 || data.includes("已签到")) summary += `【${name}】ℹ️ 今日已完成\n`;
                    else summary += `【${name}】❌ 失败(${res.m})\n`;
                }
            } catch (e) {}
            if (mcProcessed === ids.length) callback();
        });
    });
}

function finalize() {
    if (summary) $notification.post("商场合集签到报告", "", summary.trim());
    $done();
}

main();
