/**
 * @name 商场云选合集 (稳定修复版)
 * @author cmkachun
 */

const nameMap = {
    "10540": "金桥国际",
    "12206": "汇智国际",
    "1": "长泰国际"
};

let summary = "";

// 1. 获取数据
const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");
const chamMarketId = $persistentStore.read("chamshare_marketid") || "1";

console.log("--- 1. 数据状态检查 ---");
console.log(`昌宜Token: ${chamToken ? "已获取" : "未获取"}`);
console.log(`猫酷Data: ${mallData ? "已获取" : "未获取"}`);

// 2. 任务调度逻辑
function main() {
    console.log("--- 2. 开始任务流 ---");
    
    // 执行昌宜
    runChamshare(() => {
        // 昌宜结束后执行猫酷
        runMallcoo(() => {
            // 全部结束后发送通知并 done
            finalize();
        });
    });
}

// --- 昌宜云选 (长泰国际) ---
function runChamshare(callback) {
    if (!chamToken) {
        console.log("跳过昌宜: 无Token");
        callback();
        return;
    }
    const name = nameMap[chamMarketId] || `昌宜ID[${chamMarketId}]`;
    const request = {
        url: `https://api.crm.chamshare.cn/daySign`,
        method: `POST`,
        headers: {
            'X-App-Token': chamToken,
            'X-App-MarketId': chamMarketId,
            'X-App-Platform': 'wxapp',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    };
    $httpClient.post(request, (err, resp, data) => {
        try {
            if (err) {
                summary += `【${name}】❌ 网络错误\n`;
            } else {
                const res = JSON.parse(data);
                if (res.code === 0 || res.code === 200) summary += `【${name}】✅ 签到成功\n`;
                else if (res.code === 1101 || data.includes("已签到")) summary += `【${name}】ℹ️ 今日已完成\n`;
                else summary += `【${name}】❌ ${res.msg || "错误"}\n`;
            }
        } catch (e) {
            summary += `【${name}】❌ 响应异常\n`;
        }
        callback();
    });
}

// --- 猫酷商场 (金桥、汇智) ---
function runMallcoo(callback) {
    if (!mallData) {
        console.log("跳过猫酷: 无数据");
        callback();
        return;
    }
    const accounts = JSON.parse(mallData);
    const ids = Object.keys(accounts);
    if (ids.length === 0) { callback(); return; }

    let mcProcessed = 0;
    ids.forEach(id => {
        const name = nameMap[id] || `猫酷ID[${id}]`;
        $httpClient.post({
            url: `https://m.mallcoo.cn/api/user/User/CheckinV2`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "MallID": Number(id), "Header": { "Token": accounts[id] } })
        }, (err, resp, data) => {
            mcProcessed++;
            try {
                if (err) {
                    summary += `【${name}】❌ 网络超时\n`;
                } else {
                    const res = JSON.parse(data);
                    if (res.s === 1) summary += `【${name}】✅ 签到成功\n`;
                    else if (res.m === 2054 || data.includes("已签到")) summary += `【${name}】ℹ️ 今日已完成\n`;
                    else summary += `【${name}】❌ 失败(${res.m})\n`;
                }
            } catch (e) {
                summary += `【${name}】❌ 解析异常\n`;
            }
            if (mcProcessed === ids.length) callback();
        });
    });
}

function finalize() {
    console.log("--- 3. 任务结束，汇总通知 ---");
    if (summary) {
        $notification.post("商场合集签到报告", "", summary.trim());
    }
    $done();
}

// 启动
main();
