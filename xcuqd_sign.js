/**
 * @name 商场云选合集 (稳定运行版)
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
    
    // 按顺序执行：昌宜 -> 猫酷 -> 汇总
    runChamshare(() => {
        runMallcoo(() => {
            finalize();
        });
    });
}

// --- 昌宜云选 (长泰国际) ---
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
        body: "{}" 
    };
    
    $httpClient.post(request, (err, resp, data) => {
        try {
            if (err) {
                summary += `【${name}】❌ 网络错误\n`;
            } else {
                console.log(`【长泰】原始响应: ${data}`);
                const res = JSON.parse(data);
                // 关键点：code 1101 是已经签到的标志
                if (res.code === 0 || res.code === 200) {
                    summary += `【${name}】✅ 签到成功\n`;
                } else if (res.code === 1101 || data.includes("已签到")) {
                    summary += `【${name}】ℹ️ 今日已完成\n`;
                } else {
                    summary += `【${name}】❌ ${res.msg || "请求错误"}\n`;
                }
            }
        } catch (e) {
            summary += `【${name}】❌ 格式异常\n`;
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
    console.log("--- 3. 任务结束，汇总通知 ---");
    if (summary) {
        // 去掉末尾换行
        $notification.post("商场合集签到报告", "", summary.trim());
    }
    $done();
}

main();
