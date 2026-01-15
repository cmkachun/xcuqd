/**
 * @name 商场云选合集 (稳定优化版)
 * @desc 整合猫酷(金桥、汇智)与昌宜云选(长泰)。
 * @author cmkachun
 */

const mallData = $persistentStore.read("mallcoo_multi_data");
const chamToken = $persistentStore.read("chamshare_token");
const chamMarketId = $persistentStore.read("chamshare_marketid") || "1";
const chamVersion = $persistentStore.read("chamshare_version") || "2.1.1";

const nameMap = {
    "10540": "金桥国际",
    "12206": "汇智国际",
    "1": "长泰国际"
};

let summary = "";

// 模拟延迟函数
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function start() {
    console.log("--- 开始商场云选合集签到 ---");
    
    // 1. 增加随机延迟，防止凌晨瞬间网络拥堵导致自动运行失败
    const randomDelay = Math.floor(Math.random() * 3000) + 2000;
    await wait(randomDelay);

    // 2. 执行昌宜云选 (长泰)
    await runChamshare();
    await wait(1500); // 间隔防止请求冲突

    // 3. 执行猫酷商场 (金桥、汇智)
    await runMallcoo();

    // 4. 汇总通知
    if (summary) {
        $notification.post("商场合集签到报告", "", summary.trim());
    }
    console.log("--- 签到任务结束 ---");
    $done();
}

// --- 昌宜云选 (长泰国际) ---
function runChamshare() {
    return new Promise((resolve) => {
        if (!chamToken) {
            summary += "【昌宜云选】⚠️ 未获取到 Token\n";
            resolve();
            return;
        }
        const name = nameMap[chamMarketId] || `昌宜ID[${chamMarketId}]`;
        const request = {
            url: `https://api.crm.chamshare.cn/daySign`,
            method: `POST`,
            timeout: 5000,
            headers: {
                'X-App-Token': chamToken,
                'X-App-MarketId': chamMarketId,
                'X-App-Version': chamVersion,
                'X-App-Platform': 'wxapp',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.67(0x1800432e) NetType/WIFI Language/zh_CN'
            },
            body: JSON.stringify({})
        };
        $httpClient.post(request, (err, resp, data) => {
            try {
                if (err) {
                    summary += `【${name}】❌ 网络错误\n`;
                } else {
                    const res = JSON.parse(data);
                    // 兼容 0 或 200 为成功
                    if (res.code === 0 || res.code === 200) {
                        summary += `【${name}】✅ 签到成功\n`;
                    } else if (res.code === 1101 || res.msg?.includes("已签到") || res.msg?.includes("重复")) {
                        summary += `【${name}】ℹ️ 今日已完成\n`;
                    } else {
                        summary += `【${name}】❌ ${res.msg || "未知反馈"}\n`;
                    }
                }
            } catch (e) {
                summary += `【${name}】❌ 响应异常\n`;
            }
            resolve();
        });
    });
}

// --- 猫酷商场 (金桥、汇智) ---
function runMallcoo() {
    return new Promise((resolve) => {
        if (!mallData) {
            summary += "【猫酷商场】⚠️ 无账号数据\n";
            resolve();
            return;
        }
        const accounts = JSON.parse(mallData);
        const ids = Object.keys(accounts);
        if (ids.length === 0) { resolve(); return; }

        let mcProcessed = 0;
        for (const id of ids) {
            const name = nameMap[id] || `猫酷ID[${id}]`;
            $httpClient.post({
                url: `https://m.mallcoo.cn/api/user/User/CheckinV2`,
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ "MallID": Number(id), "Header": { "Token": accounts[id] } })
            }, (err, resp, data) => {
                mcProcessed++;
                try {
                    if (err) {
                        summary += `【${name}】❌ 请求超时\n`;
                    } else {
                        const res = JSON.parse(data);
                        if (res.s === 1) {
                            summary += `【${name}】✅ 签到成功\n`;
                        } else if (res.m === 2054 || res.m === "2054" || data.includes("已签到")) {
                            summary += `【${name}】ℹ️ 今日已完成\n`;
                        } else {
                            summary += `【${name}】❌ 失败(${res.m || "未知"})\n`;
                        }
                    }
                } catch (e) {
                    summary += `【${name}】❌ 解析异常\n`;
                }
                if (mcProcessed === ids.length) resolve();
            });
        }
    });
}

// 启动
start();
