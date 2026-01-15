/**
 * @name 商场云选合集 (稳定优化版)
 * @author cmkachun
 */

const nameMap = {
    "10540": "金桥国际",
    "12206": "汇智国际",
    "1": "长泰国际"
};

let summary = "";

async function start() {
    console.log("--- 1. 开始读取持久化数据 ---");
    
    const mallData = $persistentStore.read("mallcoo_multi_data");
    const chamToken = $persistentStore.read("chamshare_token");
    const chamMarketId = $persistentStore.read("chamshare_marketid") || "1";
    
    console.log(`昌宜Token状态: ${chamToken ? "✅ 已获取" : "❌ 未获取"}`);
    console.log(`猫酷Data状态: ${mallData ? "✅ 已获取" : "❌ 未获取"}`);

    // 执行昌宜
    if (chamToken) {
        console.log("--- 2. 执行昌宜签到 ---");
        await runChamshare(chamToken, chamMarketId);
    } else {
        summary += "【昌宜云选】⚠️ 未获取到 Token\n";
    }

    // 执行猫酷
    if (mallData) {
        console.log("--- 3. 执行猫酷签到 ---");
        await runMallcoo(mallData);
    } else {
        summary += "【猫酷商场】⚠️ 无账号数据\n";
    }

    // 汇总通知
    if (summary) {
        console.log("--- 4. 发送通知报告 ---");
        $notification.post("商场合集签到报告", "", summary.trim());
    } else {
        console.log("--- 4. 无数据可通知 ---");
    }

    console.log("--- 任务结束 ---");
    $done();
}

function runChamshare(token, marketId) {
    return new Promise((resolve) => {
        const name = nameMap[marketId] || `昌宜ID[${marketId}]`;
        const request = {
            url: `https://api.crm.chamshare.cn/daySign`,
            method: `POST`,
            headers: {
                'X-App-Token': token,
                'X-App-MarketId': marketId,
                'X-App-Platform': 'wxapp',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        };
        $httpClient.post(request, (err, resp, data) => {
            if (err) {
                summary += `【${name}】❌ 网络错误\n`;
            } else {
                try {
                    const res = JSON.parse(data);
                    if (res.code === 0 || res.code === 200) summary += `【${name}】✅ 签到成功\n`;
                    else if (res.code === 1101 || data.includes("已签到")) summary += `【${name}】ℹ️ 今日已完成\n`;
                    else summary += `【${name}】❌ ${res.msg || "错误"}\n`;
                } catch (e) { summary += `【${name}】❌ 响应异常\n`; }
            }
            resolve();
        });
    });
}

function runMallcoo(mallData) {
    return new Promise((resolve) => {
        const accounts = JSON.parse(mallData);
        const ids = Object.keys(accounts);
        let mcProcessed = 0;
        
        if (ids.length === 0) { resolve(); return; }

        for (const id of ids) {
            const name = nameMap[id] || `猫酷ID[${id}]`;
            $httpClient.post({
                url: `https://m.mallcoo.cn/api/user/User/CheckinV2`,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ "MallID": Number(id), "Header": { "Token": accounts[id] } })
            }, (err, resp, data) => {
                mcProcessed++;
                if (err) {
                    summary += `【${name}】❌ 请求超时\n`;
                } else {
                    try {
                        const res = JSON.parse(data);
                        if (res.s === 1) summary += `【${name}】✅ 签到成功\n`;
                        else if (res.m === 2054 || data.includes("已签到")) summary += `【${name}】ℹ️ 今日已完成\n`;
                        else summary += `【${name}】❌ 失败(${res.m})\n`;
                    } catch (e) { summary += `【${name}】❌ 解析异常\n`; }
                }
                if (mcProcessed === ids.length) resolve();
            });
        }
    });
}

start();
